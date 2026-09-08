#!/usr/bin/env node
// sync-symlinks.mjs · 资产隔离 symlink 同步
//
// 角色：
//   把 skill `env/` 下的约定资产 symlink 到项目对应位置：
//     - env/AGENTS.md     -> <项目根>/AGENTS.md
//     - env/.pnpmfile.cjs -> <项目根>/.pnpmfile.cjs
//   不自动推断目标、不自动覆盖已有文件、不读取/解释内容。
//
// 调用：
//   node scripts/sync-symlinks.mjs --target <项目根绝对路径> [--force]
//   node scripts/sync-symlinks.mjs                # 健康校验（基于 cwd）
//
// 行为：
//   1. --target 不传 → 只做健康校验，不创建任何 symlink
//   2. 目标位置已存在同名文件 / symlink / 目录 → 直接报错并退出，由用户决定
//   3. 不写入跨平台硬编码路径（Windows / Unix 由 Node.js 原生 fs 处理）
//   4. 已指向同一源 → 幂等成功；探测冲突用 lstat（含断链 symlink）

import { existsSync, lstatSync, symlinkSync, readlinkSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");

// ---- 配置：源（相对 SKILL_ROOT）→ 目标（相对项目根）----
const ENTRIES = [
  { src: "env/AGENTS.md", dest: "AGENTS.md" },
  { src: "env/.pnpmfile.cjs", dest: ".pnpmfile.cjs" },
];

// ---- 参数解析 ----
function parseArgs(argv) {
  const out = { target: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" || a === "-t") {
      out.target = argv[++i];
    } else if (a === "--force" || a === "-f") {
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
  node scripts/sync-symlinks.mjs [--target <project-root>] [--force]

Options:
  --target, -t   项目根绝对路径；不传则只做健康校验
  --force,  -f   强制覆盖已存在的同名条目（默认同名直接报错）
  --help,   -h   显示本帮助

Links:
  env/AGENTS.md     -> <target>/AGENTS.md
  env/.pnpmfile.cjs -> <target>/.pnpmfile.cjs

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

/**
 * 为单条 entry 创建/校验 symlink。
 * 返回 true 表示成功（含幂等），false 表示失败（已打印错误）。
 */
function syncEntry({ srcRel, destAbs, force }) {
  const sourceAbs = join(SKILL_ROOT, srcRel);
  if (!existsSync(sourceAbs)) {
    console.error(`[sync-symlinks] source not found: ${sourceAbs}`);
    return false;
  }

  if (linkExists(destAbs)) {
    // 幂等：已指向同一源 → 成功
    if (lstatSync(destAbs).isSymbolicLink()) {
      const absExisting = readLinkAbs(destAbs);
      if (absExisting === resolve(sourceAbs)) {
        console.log(`[sync-symlinks] already linked: ${destAbs} -> ${absExisting}`);
        return true;
      }
    }

    if (!force) {
      console.error(`[sync-symlinks] conflict: ${destAbs} already exists.`);
      console.error(`  Refusing to overwrite. Use --force if you really mean it.`);
      return false;
    }
    // --force: 仅移除文件或 symlink，不递归删目录
    try {
      const st = lstatSync(destAbs);
      if (st.isDirectory() && !st.isSymbolicLink()) {
        console.error(`[sync-symlinks] --force refused: ${destAbs} is a directory`);
        return false;
      }
      rmSync(destAbs, { recursive: false, force: false });
      console.log(`[sync-symlinks] --force: removed existing ${destAbs}`);
    } catch (e) {
      console.error(`[sync-symlinks] --force failed to remove ${destAbs}: ${e.message}`);
      return false;
    }
  }

  // 创建 symlink
  try {
    symlinkSync(sourceAbs, destAbs);
    console.log(`[sync-symlinks] created: ${destAbs} -> ${sourceAbs}`);
  } catch (e) {
    console.error(`[sync-symlinks] failed to create symlink: ${e.message}`);
    return false;
  }

  // 创建后健康校验
  const r = checkHealth(destAbs);
  if (!r.ok) {
    console.error(`[sync-symlinks] post-create health-check failed: ${r.reason}`);
    return false;
  }
  console.log(`[sync-symlinks] health-check OK: ${destAbs} -> ${r.target}`);
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

  // 健康校验模式：--target 未传
  if (!args.target) {
    console.log(`[sync-symlinks] health-check only (no --target provided)`);
    let allOk = true;
    for (const { dest } of ENTRIES) {
      const destAbs = join(process.cwd(), dest);
      const r = checkHealth(destAbs);
      if (r.ok) {
        console.log(`[sync-symlinks] OK: ${destAbs} -> ${r.target}`);
      } else {
        console.log(`[sync-symlinks] NOT OK (${r.reason}): ${destAbs}`);
        allOk = false;
      }
    }
    process.exit(allOk ? 0 : 1);
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

  let allOk = true;
  for (const { src, dest } of ENTRIES) {
    const ok = syncEntry({ srcRel: src, destAbs: join(targetRoot, dest), force: args.force });
    if (!ok) allOk = false;
  }
  process.exit(allOk ? 0 : 5);
}

main();
