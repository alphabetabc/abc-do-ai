#!/usr/bin/env node
// fix-doc-links.mjs
// 作用：把 .md 文档中不合规的链接形式转为 `docs-link-format.md` 规范形式。
//
// 不合规形式（规则禁止）：
//   1. file:/// 绝对路径  →  `[x](file:///e:/oss-fe-git/.../docs/specs/.../spec.md#L10)`
//   2. 可点击相对路径    →  `[x](../specs/.../spec.md)` 或 `[x](./spec.md)`
//
// 合规形式（唯一允许）：
//   `docs/specs/.../spec.md#L10` x   （仓库相对路径纯文本，反引号包裹，text 在 path 后）
//
// 用法：
//   node fix-doc-links.mjs <files...>          修改指定文件（默认）
//   node fix-doc-links.mjs --check <files...>  仅检查并报告，不修改
//   node fix-doc-links.mjs --dry-run <files...>模拟运行，打印变更但不写文件
//
// 注意：
// - 路径前缀 `e:/oss-fe-git/phoenix/oss-mtc-transition-ln/` 为本仓库专属；
//   其他仓库使用前请编辑 `ABS_REPO_PREFIX` 常量。
// - 不修改代码块（```...```）内的 [text](path)，避免误伤代码示例。
// - 不修改反引号代码片段（`...`）内的内容。
// - 幂等：重复执行结果稳定（合规形式不会再被二次转换）。

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- 配置 ----

// 本仓库绝对路径前缀（其他仓库请修改此项）
const ABS_REPO_PREFIX = "e:/oss-fe-git/phoenix/oss-mtc-transition-ln/";

// 相对路径转换规则：把 ../<子目录>/ → docs/<子目录>/
// 仅在 markdown 链接 [text](path) 内部生效
const RELATIVE_DIR_RULES = [
  { from: /\(\.\.\/specs\//g, to: "(docs/specs/" },
  { from: /\(\.\.\/design\//g, to: "(docs/design/" },
  { from: /\(\.\.\/skills\//g, to: "(docs/skills/" },
  { from: /\(\.\.\/workflows\//g, to: "(docs/workflows/" },
  { from: /\(\.\.\/standards\//g, to: "(docs/standards/" },
  { from: /\(\.\.\/research\//g, to: "(docs/research/" },
];

// ---- helpers ----

function log(...args) {
  console.log("[fix-doc-links]", ...args);
}

function logErr(...args) {
  console.error("[fix-doc-links][ERROR]", ...args);
}

// 匹配 [text](path) 形式，仅在非代码块、非反引号片段内
// 简化策略：直接全局替换，由调用方负责控制输入是 markdown 文档
// 代码块保护：在主流程中实现
function escapeCodeBlocks(content) {
  // 把 ```...``` 代码块替换为占位符，避免内部 [text](path) 被误伤
  // 反引号代码片段 `...` 同样保护
  const blocks = [];
  const placeholders = [];

  // 保护 fenced code block
  content = content.replace(/```[\s\S]*?```/g, (m) => {
    const idx = blocks.length;
    blocks.push(m);
    placeholders.push(`__CODE_BLOCK_${idx}__`);
    return placeholders[idx];
  });

  // 保护 inline code
  content = content.replace(/`[^`\n]+`/g, (m) => {
    const idx = blocks.length;
    blocks.push(m);
    placeholders.push(`__INLINE_CODE_${idx}__`);
    return placeholders[idx];
  });

  return { content, blocks, placeholders, restore: (s) => {
    let out = s;
    placeholders.forEach((p, i) => { out = out.split(p).join(blocks[i]); });
    return out;
  } };
}

// 转换单个文件，返回 { original, result, counts, modified }
async function processFile(filePath) {
 const absPath = path.resolve(filePath);
 const original = await fs.readFile(absPath, "utf8");

 const { content: protectedContent, restore } = escapeCodeBlocks(original);
 let content = protectedContent;

 const counts = {
   fileScheme: 0,        // file:/// 绝对路径
   relativePath: 0,       // ../specs/ 等相对路径
   markdownLink: 0,       // [text](path) → `path` text
 };

 // 1. 去除 file:/// 绝对路径前缀
 const fileRegex = new RegExp(
   "file:\\/\\/\\/" + ABS_REPO_PREFIX.replace(/[/\\]/g, "\\\\").replace(/[/]/g, "\\/"),
   "g"
 );
 // 简化实现：直接写死模式（本仓库）
 const filePattern = /file:\/\/\/e:\/oss-fe-git\/phoenix\/oss-mtc-transition-ln\//g;
 counts.fileScheme = (content.match(filePattern) || []).length;
 content = content.replace(filePattern, "");

 // 2. 相对路径 ../<dir>/ → docs/<dir>/（仅在 markdown 链接内）
 for (const rule of RELATIVE_DIR_RULES) {
   counts.relativePath += (content.match(rule.from) || []).length;
   content = content.replace(rule.from, rule.to);
 }

 // 3. markdown 链接 [text](path) → `path` text
 const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
 counts.markdownLink = (content.match(linkPattern) || []).length;
 content = content.replace(linkPattern, "`$2` $1");

 const result = restore(content);

 return {
   path: absPath,
   original,
   result,
   counts,
   modified: result !== original,
   total: counts.fileScheme + counts.relativePath + counts.markdownLink,
 };
}

// ---- CLI ----

async function main() {
 const argv = process.argv.slice(2);
 const dryRun = argv.includes("--dry-run");
 const check = argv.includes("--check");
 const files = argv.filter((a) => !a.startsWith("--"));

 if (files.length === 0) {
   logErr("用法：node fix-doc-links.mjs <files...> [--check] [--dry-run]");
   logErr("示例：node fix-doc-links.mjs docs/specs/038/spec.md");
   process.exit(1);
 }

 const mode = check ? "check" : dryRun ? "dry-run" : "write";
 log(`模式：${mode}（${files.length} 个文件）`);

 let grandTotal = 0;
 for (const f of files) {
   try {
     const r = await processFile(f);
     const c = r.counts;
     const detail = `file://=${c.fileScheme}, ../path=${c.relativePath}, md-link=${c.markdownLink}`;
     if (r.total === 0) {
       log(`✓ ${f}：无需修改（${detail}）`);
     } else {
       log(`${mode === "write" ? "✓" : "·"} ${f}：${r.total} 处替换（${detail}）`);
     }
     grandTotal += r.total;
     if (mode === "write" && r.modified) {
       await fs.writeFile(r.path, r.result, "utf8");
     }
   } catch (e) {
     logErr(`处理失败：${f}`, e.message);
   }
 }

 log(`总计：${grandTotal} 处替换`);
}

main().catch((e) => {
 logErr("未捕获错误：", e);
 process.exit(1);
});