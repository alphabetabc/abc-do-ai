#!/usr/bin/env node
// sync-symlinks.mjs · env 资产 symlink 同步
//
// 角色：
//   把 skill 内 `env/AGENTS.md` 与 `env/rules/*.md` symlink 到：
//   1. 仓库根 `AGENTS.md`（项目标准入口）
//   2. `<根>/.agents/skills/<skill-id>/env/` 镜像
//   不自动覆盖已有文件；同名冲突报错，交人工处理（--force 例外）。
//
// 调用：
//   node scripts/sync-symlinks.mjs [--target <项目根绝对路径>] [--force]
//
// 行为：
//   1. --target 不传 → 以脚本向上推导仓库根（含 .git 或 pnpm-workspace.yaml 的祖先目录）
//   2. 同名已是 symlink 且指向同一源 → 幂等成功
//   3. 同名为真实文件 / 指向别处 → 报错退出；--force 可覆盖（不删目录）
//   4. Windows 上 symlink 可能报假错（ENOENT/EEXIST 但实际已建成）：创建报错后
//      立即做健康校验，链接正确即视为成功

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");
const SKILL_ID = "oss-vis-gd-es-project-context";

const AGENTS_REL = "env/AGENTS.md";
const RULES_REL = "env/rules";
const DEFAULT_MIRROR = join(".agents", "skills", SKILL_ID);

function parseArgs(argv) {
  const out = { target: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" || a === "-t") out.target = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else throw new Error(`Unknown argument: ${a}`);
  }
  return out;
}

function printHelp() {
  console.log(`Usage:
  node scripts/sync-symlinks.mjs [--target <project-root>] [--force]

Options:
  --target, -t   项目根绝对路径；缺省时自动向上探测仓库根
  --force        强制覆盖已存在的同名条目（默认同名冲突报错）
  --help,   -h   显示本帮助

Effect:
  <root>/AGENTS.md                                    -> 本 skill env/AGENTS.md
  <root>/.agents/skills/${SKILL_ID}/env/AGENTS.md     -> 本 skill env/AGENTS.md
  <root>/.agents/skills/${SKILL_ID}/env/rules/<r>.md  -> 本 skill env/rules/<r>.md
`);
}

function findRepoRoot(start) {
  let dir = start;
  while (true) {
    if (existsSync(join(dir, ".git")) || existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

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
    return resolve(dirname(linkPath), readlinkSync(linkPath));
  } catch {
    return null;
  }
}

function checkHealth(linkPath) {
  const absTarget = readLinkAbs(linkPath);
  if (!absTarget) return { ok: false, reason: "not-a-symlink-or-unreadable" };
  if (!existsSync(absTarget)) return { ok: false, reason: "broken", absTarget };
  return { ok: true, absTarget };
}

/** 路径等价比较：Windows 下不区分大小写（盘符 e:/E: 常见差异） */
function samePath(a, b) {
  if (process.platform === "win32") return a.toLowerCase() === b.toLowerCase();
  return a === b;
}

/** 在 linkPath 创建指向 sourceAbs 的 symlink；返回 true=处理成功 */
function ensureLink(sourceAbs, linkPath, force, label) {
  sourceAbs = resolve(sourceAbs);
  if (linkExists(linkPath)) {
    const absExisting = readLinkAbs(linkPath);
    if (samePath(absExisting ?? "", sourceAbs)) {
      console.log(`[sync-symlinks] [=] ${label} (already linked)`);
      return true;
    }
    if (!force) {
      console.error(`[sync-symlinks] [!] conflict: ${linkPath} already exists (-> ${absExisting ?? "not a symlink"})`);
      console.error(`      refusing to overwrite; use --force if you really mean it`);
      return false;
    }
    const st = lstatSync(linkPath);
    if (st.isDirectory() && !st.isSymbolicLink()) {
      console.error(`[sync-symlinks] [!] --force refused: ${linkPath} is a directory`);
      return false;
    }
    rmSync(linkPath, { recursive: false, force: false });
    console.log(`[sync-symlinks] --force: removed existing ${linkPath}`);
  }

  try {
    symlinkSync(sourceAbs, linkPath);
  } catch (e) {
    // Windows 假报错：报 ENOENT/EEXIST 但链接实际已建成，健康校验兜底
    const r = checkHealth(linkPath);
    if (r.ok && samePath(r.absTarget, sourceAbs)) {
      console.log(`[sync-symlinks] [+] ${label} (created; fs reported "${e.code}" but link is healthy)`);
      return true;
    }
    console.error(`[sync-symlinks] [!] failed: ${label} -> ${e.message}`);
    return false;
  }
  const r = checkHealth(linkPath);
  if (!r.ok) {
    console.error(`[sync-symlinks] [!] post-create health-check failed (${r.reason}): ${linkPath}`);
    return false;
  }
  console.log(`[sync-symlinks] [+] ${label}`);
  return true;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`[sync-symlinks] ${e.message}`);
    printHelp();
    process.exit(2);
  }

  const root = args.target ? resolve(args.target) : findRepoRoot(SKILL_ROOT);
  if (!root || !existsSync(root)) {
    console.error(`[sync-symlinks] target root not found (pass --target <project-root>)`);
    process.exit(1);
  }

  // 源校验
  const agentsSrc = join(SKILL_ROOT, AGENTS_REL);
  const rulesSrcDir = join(SKILL_ROOT, RULES_REL);
  if (!existsSync(agentsSrc) || !existsSync(rulesSrcDir)) {
    console.error(`[sync-symlinks] source missing: ${agentsSrc} or ${rulesSrcDir}`);
    process.exit(1);
  }
  const ruleFiles = readdirSync(rulesSrcDir)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .sort();

  let failed = 0;

  // 1) 仓库根 AGENTS.md
  if (!ensureLink(agentsSrc, join(root, "AGENTS.md"), args.force, "AGENTS.md (repo root)")) failed++;

  // 2) .agents/skills/<skill-id>/env/ 镜像
  const mirrorRoot = join(root, DEFAULT_MIRROR);
  const mirrorEnv = join(mirrorRoot, "env");
  const mirrorRules = join(mirrorEnv, "rules");
  mkdirSync(mirrorRules, { recursive: true });
  if (!ensureLink(agentsSrc, join(mirrorEnv, "AGENTS.md"), args.force, "env/AGENTS.md (mirror)")) failed++;
  for (const f of ruleFiles) {
    if (!ensureLink(join(rulesSrcDir, f), join(mirrorRules, f), args.force, `env/rules/${f} (mirror)`)) failed++;
  }

  console.log(`\n[sync-symlinks] repo root: ${root}`);
  console.log(`[sync-symlinks] mirror root: ${mirrorRoot}`);
  console.log(`[sync-symlinks] failures: ${failed}`);
  process.exit(failed > 0 ? 4 : 0);
}

main();
