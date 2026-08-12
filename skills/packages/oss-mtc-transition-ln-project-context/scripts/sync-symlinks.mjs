#!/usr/bin/env node
// sync-symlinks.mjs
// 作用：在仓库根与 skill env/ 之间建立符号链接（symlink）。
// 方向：仓库根 <file>  ->  env/<file>（env/ 为权威源，根为 symlink 镜像）。
//
// 用法：
//   node sync-symlinks.mjs              建立/修复 symlink（默认）
//   node sync-symlinks.mjs --check      仅检查，不修改（人类可读输出）
//   node sync-symlinks.mjs --status     检查并把快照写入 .local-symlink-status.json
//   node sync-symlinks.mjs --remove     移除根目录下的 symlink（保留 env/ 真实文件）
//
// 注意：
// - Windows 创建符号链接可能需要开发者模式或管理员权限。
// - 若根目录已存在普通文件（非 symlink），脚本会先用其内容覆盖 env/ 文件，
//   再删除根文件、建立 symlink，以避免内容丢失。
// - 不会删除 env/ 下的任何文件（env/ 是权威源）。

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 仓库根 = 脚本所在目录往上 4 层
// scripts/ -> oss-mtc-transition-ln-project-context/ -> skills/ -> .trae/ -> 仓库根
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const ENV_DIR = path.resolve(__dirname, "..", "env");

// 要建立 symlink 的文件清单（相对仓库根的路径）
const TARGETS = ["AGENTS.md", "package.json"];

// 状态快照文件（覆盖式，不入库：.local- 前缀已被 .git/info/exclude 排除）
const STATUS_FILE = path.resolve(__dirname, "..", ".local-symlink-status.json");

// ---- helpers ----

function log(...args) {
  console.log("[sync-symlinks]", ...args);
}

function logErr(...args) {
  console.error("[sync-symlinks][ERROR]", ...args);
}

async function isSymlink(p) {
  try {
    const stat = await fs.lstat(p);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
}

async function readLinkSafe(p) {
  try {
    return await fs.readlink(p);
  } catch {
    return null;
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// 规范化目标路径，用于比较（Windows 大小写不敏感，用 toLowerCase 比较）
function norm(p) {
  return path.resolve(p).toLowerCase();
}

// ---- 核心逻辑 ----

// 检查单个文件：根文件是否是指向 env/ 文件的 symlink
async function checkOne(file) {
  const rootFile = path.join(REPO_ROOT, file); // 根：应为 symlink
  const envFile = path.join(ENV_DIR, file);    // env：应为真实文件

  const rootExists = await fileExists(rootFile);
  const envExists = await fileExists(envFile);
  const rootIsLink = await isSymlink(rootFile);
  const rootTarget = rootIsLink ? await readLinkSafe(rootFile) : null;

  // 计算 symlink 是否指向 env 文件
  let pointsToEnv = false;
  if (rootIsLink && rootTarget) {
    const resolved = path.resolve(REPO_ROOT, rootTarget);
    pointsToEnv = norm(resolved) === norm(envFile);
  }

  return {
    file,
    rootFile,
    envFile,
    rootExists,
    envExists,
    rootIsLink,
    rootTarget,
    pointsToEnv,
  };
}

async function ensureEnvDir() {
  await fs.mkdir(ENV_DIR, { recursive: true });
}

// 建立/修复 symlink：根 <file> -> env/<file>
async function syncOne(file) {
  const s = await checkOne(file);

  // env 源文件必须存在
  if (!s.envExists) {
    logErr(`env 源文件不存在，跳过：${s.envFile}`);
    return { ok: false, action: "skip-env-missing", ...s };
  }

  // 已经是正确的 symlink
  if (s.rootIsLink && s.pointsToEnv) {
    log(`✓ 已是正确 symlink：${file}  ->  ${s.envFile}`);
    return { ok: true, action: "noop", ...s };
  }

  // 根目录存在普通文件（非 symlink）或指向错误目标
  if (s.rootExists && !s.pointsToEnv) {
    // 先用根内容覆盖 env（避免内容丢失），再删除根文件
    if (!s.rootIsLink) {
      log(`根 ${file} 是普通文件，先用其内容覆盖 env/ 以防丢失…`);
      await fs.copyFile(s.rootFile, s.envFile);
    }
    await fs.rm(s.rootFile, { force: true });
    log(`已移除旧的根 ${file}`);
  }

  // 建立 symlink：根 <file> -> env/<file>
  // Node fs.symlink(target, path)：target=指向的源文件，path=要新建的链接位置
  // 注意：Windows 上若未开启开发者模式/管理员，会抛 EPERM
  try {
    await fs.symlink(s.envFile, s.rootFile, "file");
    log(`✓ 已建立 symlink：根 ${file}  ->  ${s.envFile}`);
    return { ok: true, action: "created", ...s };
  } catch (e) {
    logErr(`建立 symlink 失败：${file}`, e.message);
    logErr("提示：Windows 创建符号链接可能需要开启「开发者模式」或以管理员身份运行。");
    logErr("     或改用 PowerShell：New-Item -ItemType SymbolicLink -Target <env/文件> -Path <根文件>");
    return { ok: false, action: "create-failed", error: e.message, ...s };
  }
}

// 移除根目录下的 symlink（保留 env/ 真实文件）
async function removeOne(file) {
  const s = await checkOne(file);
  if (!s.rootExists) {
    log(`根 ${file} 不存在，无需移除`);
    return { ok: true, action: "noop", ...s };
  }
  if (!s.rootIsLink) {
    log(`根 ${file} 不是 symlink，保留普通文件`);
    return { ok: true, action: "skip-not-symlink", ...s };
  }
  await fs.rm(s.rootFile, { force: true });
  log(`✓ 已移除 symlink：根 ${file}`);
  return { ok: true, action: "removed", ...s };
}

async function printStatus() {
  log(`仓库根：${REPO_ROOT}`);
  log(`env 目录：${ENV_DIR}`);
  log("---");
  for (const file of TARGETS) {
    const s = await checkOne(file);
    const state = !s.rootExists
      ? "不存在"
      : s.rootIsLink
      ? s.pointsToEnv
        ? "✓ symlink 指向 env"
        : `✗ symlink 指向 ${s.rootTarget}（非 env）`
      : "普通文件（非 symlink）";
    log(`${file}: ${state}`);
  }
}

// 生成状态快照对象
async function buildSnapshot() {
  const files = [];
  let allOk = true;
  for (const file of TARGETS) {
    const s = await checkOne(file);
    const ok = s.rootIsLink && s.pointsToEnv;
    if (!ok) allOk = false;
    files.push({
      file,
      envExists: s.envExists,
      rootExists: s.rootExists,
      isSymlink: s.rootIsLink,
      pointsToEnv: s.pointsToEnv,
      target: s.rootTarget,
      ok,
    });
  }
  return {
    checkedAt: new Date().toISOString(),
    repoRoot: REPO_ROOT,
    envDir: ENV_DIR,
    allOk,
    files,
  };
}

// 写入状态快照到 .local-symlink-status.json（覆盖式）
async function writeStatusSnapshot() {
  const snapshot = await buildSnapshot();
  await fs.writeFile(STATUS_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  log(`状态快照已写入：${STATUS_FILE}`);
  return snapshot;
}

// ---- CLI ----

async function main() {
  const argv = process.argv.slice(2);
  const mode = argv.includes("--status")
    ? "status"
    : argv.includes("--check")
    ? "check"
    : argv.includes("--remove")
    ? "remove"
    : "sync";

  await ensureEnvDir();

  if (mode === "check") {
    await printStatus();
    return;
  }

  if (mode === "status") {
    const snapshot = await writeStatusSnapshot();
    if (snapshot.allOk) {
      log("✓ 所有 symlink 正常");
    } else {
      log("✗ 存在异常 symlink，详见状态文件");
    }
    return;
  }

  if (mode === "remove") {
    for (const file of TARGETS) {
      await removeOne(file);
    }
    await printStatus();
    return;
  }

  // mode === "sync"
  for (const file of TARGETS) {
    await syncOne(file);
  }
  await printStatus();
}

main().catch((e) => {
  logErr("未捕获错误：", e);
  process.exit(1);
});
