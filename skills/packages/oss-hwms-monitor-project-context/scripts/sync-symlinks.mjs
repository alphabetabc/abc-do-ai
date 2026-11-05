#!/usr/bin/env node
// sync-symlinks.mjs · 资产隔离 symlink 同步
//
// 角色：
//   **仅**把 skill 内的 `env/AGENTS.md` 链接到项目标准入口（如项目根 `AGENTS.md`）。
//   不自动推断目标、不自动覆盖已有文件、不读取/解释规则内容。
//
// 调用：
//   node scripts/sync-symlinks.mjs --target <项目根绝对路径> [--entry <入口文件名>]
//
// 行为：
//   1. --target 不传 → 只做健康校验，不创建任何 symlink
//   2. 目标位置已存在同名文件 / symlink / 目录 → **直接报错**并退出，由用户决定
//   3. 不写入跨平台硬编码路径（Windows / Unix 由 Node.js 原生 fs 处理）
//   4. 不假设目标系统或权限模型
//   5. 只做：① 检查源文件存在；② 创建 symlink；③ 校验健康状态（三项都是机械 I/O）
//   6. 已指向同一源 → 幂等成功；探测冲突用 lstat（含断链 symlink）

import { existsSync, lstatSync, symlinkSync, readlinkSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");

// ---- 配置：默认源 / 目标 / 入口名（约定优于配置） ----
const SOURCE_REL = "env/AGENTS.md"; // 项目级 AI 工作守则源
const DEFAULT_ENTRY = "AGENTS.md"; // 项目根标准入口

// ---- 参数解析 ----
function parseArgs(argv) {
  const out = { target: null, entry: DEFAULT_ENTRY, force: false };
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
  node scripts/sync-symlinks.mjs [--target <project-root>] [--force] [--entry <filename>]

Options:
  --target, -t   项目根绝对路径；不传则只做健康校验
  --entry,  -e   项目根下的入口文件名（默认 AGENTS.md）
  --force        强制覆盖已存在的同名条目（默认同名直接报错）
  --help,  -h    显示本帮助

Examples:
  # 健康校验（仅校验，不创建）
  node scripts/sync-symlinks.mjs

  # 创建 symlink 到项目根
  node scripts/sync-symlinks.mjs --target /path/to/project

  # 自定义入口文件名
  node scripts/sync-symlinks.mjs --target /path/to/project --entry CLAUDE.md

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

  const sourceAbs = join(SKILL_ROOT, SOURCE_REL);
  if (!existsSync(sourceAbs)) {
    console.error(`[sync-symlinks] source not found: ${sourceAbs}`);
    process.exit(1);
  }

  // 健康校验模式：--target 未传
  if (!args.target) {
    const targetPath = join(process.cwd(), args.entry);
    console.log(`[sync-symlinks] health-check only (no --target provided)`);
    const r = checkHealth(targetPath);
    if (r.ok) {
      console.log(`[sync-symlinks] OK: ${targetPath} -> ${r.target}`);
      process.exit(0);
    } else {
      console.log(`[sync-symlinks] NOT OK (${r.reason}): ${targetPath}`);
      process.exit(1);
    }
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

  const linkPath = join(targetRoot, args.entry);

  if (linkExists(linkPath)) {
    // 幂等：已指向同一源 → 成功退出
    try {
      if (lstatSync(linkPath).isSymbolicLink()) {
        const absExisting = readLinkAbs(linkPath);
        if (absExisting === resolve(sourceAbs)) {
          console.log(`[sync-symlinks] already linked: ${linkPath} -> ${absExisting}`);
          process.exit(0);
        }
      }
    } catch {
      /* fall through to conflict / force */
    }

    if (!args.force) {
      console.error(`[sync-symlinks] conflict: ${linkPath} already exists.`);
      console.error(`  Refusing to overwrite. Use --force if you really mean it.`);
      process.exit(3);
    }
    // --force: 仅移除文件或 symlink，不递归删目录
    try {
      const st = lstatSync(linkPath);
      if (st.isDirectory() && !st.isSymbolicLink()) {
        console.error(`[sync-symlinks] --force refused: ${linkPath} is a directory`);
        process.exit(4);
      }
      rmSync(linkPath, { recursive: false, force: false });
      console.log(`[sync-symlinks] --force: removed existing ${linkPath}`);
    } catch (e) {
      console.error(`[sync-symlinks] --force failed to remove ${linkPath}: ${e.message}`);
      process.exit(4);
    }
  }

  // 创建 symlink
  try {
    symlinkSync(sourceAbs, linkPath);
    console.log(`[sync-symlinks] created: ${linkPath} -> ${sourceAbs}`);
  } catch (e) {
    if (e.code === "EPERM") {
      console.error(`[sync-symlinks] failed (EPERM): Windows 需开启「开发者模式」或以管理员运行才能创建 symlink`);
    } else {
      console.error(`[sync-symlinks] failed to create symlink: ${e.message}`);
    }
    process.exit(5);
  }

  // 创建后健康校验
  const r = checkHealth(linkPath);
  if (!r.ok) {
    console.error(`[sync-symlinks] post-create health-check failed: ${r.reason}`);
    process.exit(6);
  }
  console.log(`[sync-symlinks] health-check OK: ${linkPath} -> ${r.target}`);
}

main();
