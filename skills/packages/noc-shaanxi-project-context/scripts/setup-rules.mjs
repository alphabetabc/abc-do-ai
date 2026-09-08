#!/usr/bin/env node
// setup-rules.mjs · 把 env/rules/*.md symlink 到项目 IDE rules 入口
//
// 调用：
//   node scripts/setup-rules.mjs --target <项目根绝对路径> [--dirs <dir1,dir2,...>]
//
// 行为：
//   1. 同名不覆盖：冲突时报错，交人工处理
//   2. 只做机械 I/O：扫描源文件 → 创建 symlink → 健康校验
//   3. 跳过 README.md；不为空壳维护分类/跳过逻辑

import {
  existsSync,
  lstatSync,
  mkdirSync,
  symlinkSync,
  readlinkSync,
  readdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(__dirname, "..");

const RULES_DIR_REL = "env/rules";
const DEFAULT_TARGET_DIRS = [".trae/rules"];

function shouldSkipDeploy(fname) {
  if (fname.toLowerCase() === "readme.md") {
    return { skip: true, reason: "meta-readme" };
  }
  return { skip: false };
}

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
  --dirs,  -d     目标 IDE rules 目录，逗号分隔（默认 .trae/rules）
  --dry-run       只打印计划，不创建 symlink
  --help,  -h     帮助

Safety:
  - 跳过 README.md
  - 同名冲突不覆盖；冲突或失败时 exit ≠ 0
`);
}

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

function linkExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

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

  const allMd = readdirSync(sourceDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const sources = [];
  const skipped = [];
  for (const f of allMd) {
    const gate = shouldSkipDeploy(f);
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
          if (absExisting === resolve(sourceAbs)) {
            console.log(`  [=] ${fname} (already linked to same source)`);
            continue;
          }
          console.error(`  [!] conflict: ${linkPath}`);
          console.error(`      existing -> ${existing ?? "(unreadable/broken)"}`);
          console.error(`      wanted   -> ${sourceAbs}`);
          console.error(`      refusing to overwrite`);
          totalConflict++;
          continue;
        } else {
          console.error(`  [!] conflict: ${linkPath} exists and is not a symlink`);
          console.error(`      refusing to overwrite`);
          totalConflict++;
          continue;
        }
      }

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
