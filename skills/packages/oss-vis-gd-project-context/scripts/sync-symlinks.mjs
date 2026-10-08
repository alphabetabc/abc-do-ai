#!/usr/bin/env node
// sync-symlinks.mjs · 资产隔离 symlink 同步（v1.7 · M6 · §3.8.1）
//
// 角色：
//   **仅**把 skill 内的约定文件链接到项目标准入口（如项目根 `AGENTS.md`、`.pnpmfile.cjs`）。
//   不自动推断目标、不自动覆盖已有文件、不读取/解释文件内容。
//
// 调用：
//   node scripts/sync-symlinks.mjs --target <项目根绝对路径> [--entry <入口文件名>] [--force]
//
// 行为（§3.8.1 R1 严格化）：
//   1. --target 不传 → 只做健康校验，不创建任何 symlink
//   2. 目标位置已存在同名文件 / symlink / 目录 → **直接报错**并退出，由用户决定
//   3. 不写入跨平台硬编码路径（Windows / Unix 由 Node.js 原生 fs 处理）
//   4. 不假设目标系统或权限模型
//   5. 只做：① 检查源文件存在；② 创建 symlink；③ 校验健康状态（三项都是机械 I/O）
//   6. 已指向同一源 → 幂等成功；探测冲突用 lstat（含断链 symlink）
//   7. 默认同步全部条目；--entry 只处理指定条目

import { existsSync, lstatSync, symlinkSync, readlinkSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");

// ---- 配置：skill 内源文件 → 项目根入口名（约定优于配置） ----
const ENTRIES = [
  { source: "env/AGENTS.md", entry: "AGENTS.md" }, // 项目级 AI 工作守则（§3.2）
  { source: "env/.pnpmfile.cjs", entry: ".pnpmfile.cjs" }, // pnpm 钩子（依赖注入 / 本地 tarball）
  { source: "env/pnpm-workspace.yaml", entry: "pnpm-workspace.yaml" }, // pnpm 工作区配置（overrides / allowBuilds）
];

// ---- 参数解析 ----
function parseArgs(argv) {
  const out = { target: null, entry: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" || a === "-t") {
      out.target = argv[++i];
    } else if (a === "--entry" || a === "-e") {
      out.entry = argv[++i];
    } else if (a === "--force") {
      out.force = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/sync-symlinks.mjs [--target <project-root>] [--entry <filename>] [--force]

Options:
  --target, -t   项目根绝对路径；不传则只做健康校验
  --entry,  -e   只处理指定入口文件名（默认全部：${ENTRIES.map((e) => e.entry).join(", ")}）
  --force        强制覆盖已存在的同名条目（默认同名直接报错）
  --help,  -h    显示本帮助

Examples:
  # 健康校验（仅校验，不创建）
  node scripts/sync-symlinks.mjs

  # 创建全部 symlink 到项目根
  node scripts/sync-symlinks.mjs --target /path/to/project

  # 只处理某个入口
  node scripts/sync-symlinks.mjs --target /path/to/project --entry .pnpmfile.cjs

Safety:
  - 同名冲突直接报错（不覆盖），除非显式 --force
  - 已指向同一源时幂等成功
  - 跨平台路径由 Node.js 原生 fs 处理，不硬编码
`);
}

/** 路径是否已有条目（含断链 symlink；existsSync 对断链返回 false） */
function linkExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function readLinkAbs(linkPath) {
  try {
    const raw = readlinkSync(linkPath);
    return resolve(dirname(linkPath), raw);
  } catch {
    return null;
  }
}

// ---- 健康校验 ----
function checkHealth(linkPath) {
  if (!linkExists(linkPath)) {
    return { ok: false, reason: "missing" };
  }
  const lst = lstatSync(linkPath);
  if (!lst.isSymbolicLink()) {
    return { ok: false, reason: "not-a-symlink" };
  }
  let target;
  try {
    target = readlinkSync(linkPath);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  const absTarget = resolve(dirname(linkPath), target);
  if (!existsSync(absTarget)) {
    return { ok: false, reason: "broken", target, absTarget };
  }
  return { ok: true, target, absTarget };
}

/** 同步单条条目；返回 true=成功，false=失败（已打印原因） */
function syncEntry({ source, entry }, targetRoot, { force, dryRun }) {
  const sourceAbs = join(SKILL_ROOT, source);
  if (!existsSync(sourceAbs)) {
    console.error(`[sync-symlinks] source not found: ${sourceAbs}`);
    return false;
  }

  // 健康校验模式
  if (!targetRoot) {
    const targetPath = join(process.cwd(), entry);
    const r = checkHealth(targetPath);
    if (r.ok) {
      console.log(`[sync-symlinks] OK: ${targetPath} -> ${r.target}`);
      return true;
    }
    console.log(`[sync-symlinks] NOT OK (${r.reason}): ${targetPath}`);
    return false;
  }

  const linkPath = join(targetRoot, entry);

  if (linkExists(linkPath)) {
    // 幂等：已指向同一源 → 成功
    try {
      if (lstatSync(linkPath).isSymbolicLink()) {
        const absExisting = readLinkAbs(linkPath);
        if (absExisting === resolve(sourceAbs)) {
          console.log(`[sync-symlinks] already linked: ${linkPath} -> ${absExisting}`);
          return true;
        }
      }
    } catch {
      /* fall through to conflict / force */
    }

    if (!force) {
      console.error(`[sync-symlinks] conflict: ${linkPath} already exists.`);
      console.error(`  Refusing to overwrite (per §3.8.1 R1). Use --force if you really mean it.`);
      return false;
    }
    // --force: 仅移除文件或 symlink，不递归删目录
    try {
      const st = lstatSync(linkPath);
      if (st.isDirectory() && !st.isSymbolicLink()) {
        console.error(`[sync-symlinks] --force refused: ${linkPath} is a directory`);
        return false;
      }
      rmSync(linkPath, { recursive: false, force: false });
      console.log(`[sync-symlinks] --force: removed existing ${linkPath}`);
    } catch (e) {
      console.error(`[sync-symlinks] --force failed to remove ${linkPath}: ${e.message}`);
      return false;
    }
  }

  if (dryRun) {
    console.log(`[sync-symlinks] dry-run: would create ${linkPath} -> ${sourceAbs}`);
    return true;
  }

  try {
    symlinkSync(sourceAbs, linkPath);
    console.log(`[sync-symlinks] created: ${linkPath} -> ${sourceAbs}`);
  } catch (e) {
    console.error(`[sync-symlinks] failed to create symlink: ${e.message}`);
    return false;
  }

  const r = checkHealth(linkPath);
  if (!r.ok) {
    console.error(`[sync-symlinks] post-create health-check failed for ${entry}: ${r.reason}`);
    return false;
  }
  console.log(`[sync-symlinks] health-check OK: ${linkPath} -> ${r.target}`);
  return true;
}

// ---- 主流程 ----
function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`[sync-symlinks] ${e.message}`);
    printHelp();
    process.exit(2);
  }

  // 选择条目：--entry 指定则只处理该条，否则全部
  let entries = ENTRIES;
  if (args.entry) {
    const found = ENTRIES.find((e) => e.entry === args.entry);
    if (!found) {
      console.error(`[sync-symlinks] unknown entry: ${args.entry}`);
      console.error(`  available: ${ENTRIES.map((e) => e.entry).join(", ")}`);
      process.exit(2);
    }
    entries = [found];
  }

  // 健康校验模式：--target 未传
  if (!args.target) {
    console.log(`[sync-symlinks] health-check only (no --target provided)`);
    const results = entries.map((e) => syncEntry(e, null, { force: false, dryRun: false }));
    process.exit(results.every(Boolean) ? 0 : 1);
  }

  // 创建模式：--target 已传
  const targetRoot = resolve(args.target);
  if (!existsSync(targetRoot)) {
    console.error(`[sync-symlinks] target root not found: ${targetRoot}`);
    process.exit(1);
  }
  let targetRootStat;
  try {
    targetRootStat = lstatSync(targetRoot);
  } catch (e) {
    console.error(`[sync-symlinks] cannot stat target root: ${e.message}`);
    process.exit(1);
  }
  if (!targetRootStat.isDirectory()) {
    console.error(`[sync-symlinks] target root is not a directory: ${targetRoot}`);
    process.exit(1);
  }

  const results = entries.map((e) => syncEntry(e, targetRoot, { force: args.force, dryRun: false }));
  process.exit(results.every(Boolean) ? 0 : 7);
}

main();
