#!/usr/bin/env node
// setup-rules.mjs · AI 助手级 rules 集中 symlink（v1.6 · H10 · §3.8.1）
//
// 角色：
//   把 skill 内的 `env/rules/*.md` 批量 symlink 到目标项目 IDE 可识别的标准入口
//   （如 `.trae/rules/`、`.cursor/rules/`、`.claude/rules/`）。
//
// 调用：
//   node scripts/setup-rules.mjs --target <项目根绝对路径> [--dirs <dir1,dir2,...>]
//
// 行为（§3.8.1 R1 严格化）：
//   1. 同名不覆盖：冲突时直接报错，由人工处理（合并 / 改名 / 删除其中之一）
//   2. Skill 升级时规则正文变化**不由脚本自动迁移**，必须人工确认后再部署
//   3. 项目级 `env/AGENTS.md` 始终保持最高优先级，脚本不参与语义层管理
//   4. 只做机械 I/O：① 扫描源文件；② 创建 symlink；③ 校验健康状态
//   5. 不假设目标系统或权限模型
//   6. 跳过 README.md（元文档）；跳过标题含「占位骨架」的文件（待填写，不部署）

import {
  existsSync,
  lstatSync,
  mkdirSync,
  symlinkSync,
  readlinkSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

// Windows 路径大小写不敏感（盘符 E:\ vs e:\ 会导致假冲突），比较前统一小写
const IS_WIN = process.platform === "win32";
function samePath(a, b) {
  if (a == null || b == null) return false;
  return IS_WIN ? a.toLowerCase() === b.toLowerCase() : a === b;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");

// ---- 配置 ----
const RULES_DIR_REL = "env/rules"; // AI 助手级 rules 唯一源
const DEFAULT_TARGET_DIRS = [".trae/rules"]; // 本项目默认只部署 .trae/rules

/** 是否应跳过部署：README 元文档，或标题含「占位骨架」的待填 rule */
function shouldSkipDeploy(fname, sourceAbs) {
  if (fname.toLowerCase() === "readme.md") {
    return { skip: true, reason: "meta-readme" };
  }
  let body;
  try {
    body = readFileSync(sourceAbs, "utf8");
  } catch {
    return { skip: false };
  }
  // 与 env/rules/README.md 约定一致：一级标题含「占位骨架」→ 骨架，默认不部署
  if (/^#\s+.*占位骨架/m.test(body)) {
    return { skip: true, reason: "skeleton" };
  }
  return { skip: false };
}

// ---- 参数解析 ----
function parseArgs(argv) {
  const out = { target: null, dirs: DEFAULT_TARGET_DIRS.slice(), dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" || a === "-t") {
      out.target = argv[++i];
    } else if (a === "--dirs" || a === "-d") {
      out.dirs = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a === "--dry-run") {
      out.dryRun = true;
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
  node scripts/setup-rules.mjs --target <project-root> [--dirs <dir1,dir2,...>] [--dry-run]

Options:
  --target, -t    项目根绝对路径（必填）
  --dirs,  -d     目标 IDE rules 目录列表，逗号分隔（默认 .trae/rules）
  --dry-run       只打印计划，不实际创建 symlink
  --help,  -h     显示本帮助

Examples:
  # 部署到默认 3 个 IDE rules 目录
  node scripts/setup-rules.mjs --target /path/to/project

  # 自定义目标目录
  node scripts/setup-rules.mjs --target /path/to/project --dirs .trae/rules,.windsurf/rules

Safety:
  - 跳过 README.md 与标题含「占位骨架」的文件
  - 同名冲突直接报错（不覆盖），由人工处理；冲突或失败时 exit ≠ 0
  - 脚本不做版本管理；规则正文变化必须人工确认后再部署
`);
}

// ---- 健康校验 ----
function checkHealth(linkPath) {
  if (!linkExists(linkPath)) return { ok: false, reason: "missing" };
  const lst = lstatSync(linkPath);
  if (!lst.isSymbolicLink()) return { ok: false, reason: "not-a-symlink" };
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

/** 路径是否已有条目（含断链 symlink；existsSync 对断链返回 false） */
function linkExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

// ---- 主流程 ----
function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`[setup-rules] ${e.message}`);
    printHelp();
    process.exit(2);
  }
  if (!args.target) {
    console.error(`[setup-rules] --target is required`);
    printHelp();
    process.exit(2);
  }

  const sourceDir = join(SKILL_ROOT, RULES_DIR_REL);
  if (!existsSync(sourceDir)) {
    console.error(`[setup-rules] rules source dir not found: ${sourceDir}`);
    process.exit(1);
  }

  // 扫描源规则文件：跳过 README.md 与占位骨架
  const allMd = readdirSync(sourceDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const sources = [];
  const skipped = [];
  for (const f of allMd) {
    const abs = join(sourceDir, f);
    const gate = shouldSkipDeploy(f, abs);
    if (gate.skip) {
      skipped.push({ f, reason: gate.reason });
      continue;
    }
    sources.push(f);
  }

  console.log(`[setup-rules] deployable (${sources.length}):`);
  for (const f of sources) console.log(`  - ${join(sourceDir, f)}`);
  if (skipped.length > 0) {
    console.log(`[setup-rules] skipped (${skipped.length}):`);
    for (const { f, reason } of skipped) console.log(`  - ${f} (${reason})`);
  }
  if (sources.length === 0) {
    console.error(`[setup-rules] no deployable .md rules after skip filters`);
    process.exit(1);
  }

  const targetRoot = resolve(args.target);
  if (!existsSync(targetRoot)) {
    console.error(`[setup-rules] target root not found: ${targetRoot}`);
    process.exit(1);
  }

  let totalPlanned = 0;
  let totalCreated = 0;
  let totalConflict = 0;
  let totalBroken = 0;

  for (const targetRelDir of args.dirs) {
    const targetDir = join(targetRoot, targetRelDir);
    console.log(`\n[setup-rules] target dir: ${targetDir}`);

    if (!args.dryRun) {
      try {
        mkdirSync(targetDir, { recursive: true });
      } catch (e) {
        console.error(`[setup-rules] mkdir failed: ${e.message}`);
        process.exit(3);
      }
    }

    for (const fname of sources) {
      const sourceAbs = join(sourceDir, fname);
      const linkPath = join(targetDir, fname);
      totalPlanned++;

      // 已存在同名条目（含断链）→ 直接报错（除非同名且指向相同源，跳过）
      if (linkExists(linkPath)) {
        const lst = lstatSync(linkPath);
        if (lst.isSymbolicLink()) {
          let existing;
          try {
            existing = readlinkSync(linkPath);
          } catch {
            existing = null;
          }
          const absExisting = existing ? resolve(dirname(linkPath), existing) : null;
          if (samePath(absExisting, resolve(sourceAbs))) {
            console.log(`  [=] ${fname} (already linked to same source)`);
            continue;
          }
          console.error(`  [!] conflict: ${linkPath}`);
          console.error(`      existing -> ${existing ?? "(unreadable/broken)"}`);
          console.error(`      wanted   -> ${sourceAbs}`);
          console.error(`      refusing to overwrite (per §3.8.1 R1)`);
          totalConflict++;
          continue;
        } else {
          console.error(`  [!] conflict: ${linkPath} exists and is not a symlink`);
          console.error(`      refusing to overwrite (per §3.8.1 R1)`);
          totalConflict++;
          continue;
        }
      }

      // 创建 symlink
      if (args.dryRun) {
        console.log(`  [+] ${fname} (dry-run)`);
        continue;
      }
      try {
        symlinkSync(sourceAbs, linkPath);
        console.log(`  [+] ${fname} created`);
        totalCreated++;
      } catch (e) {
        console.error(`  [!] failed: ${fname} -> ${e.message}`);
        totalBroken++;
        continue;
      }

      // 创建后健康校验
      const r = checkHealth(linkPath);
      if (!r.ok) {
        console.error(`  [!] post-create health-check failed for ${fname}: ${r.reason}`);
        totalBroken++;
      }
    }
  }

  console.log(`\n[setup-rules] summary:`);
  console.log(`  planned: ${totalPlanned}`);
  console.log(`  created: ${totalCreated}`);
  console.log(`  skipped (source): ${skipped.length}`);
  console.log(`  conflict (left to human): ${totalConflict}`);
  console.log(`  broken (failed): ${totalBroken}`);

  if (totalConflict > 0 || totalBroken > 0) {
    process.exit(4);
  }
}

main();
