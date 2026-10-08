#!/usr/bin/env node
// 2026-10-08-fix-migrated-doc-links.js
// 作用：task-2026-10-08-001 步骤 4 —— 修正迁入 skill 的 done/research 文档中的 ../ 相对链接与 .local-docs 链接，
//       统一改为仓库根相对路径（反引号纯文本，遵循 01-link-format）。
// 用法：node 2026-10-08-fix-migrated-doc-links.js
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SKILL = path.join(REPO_ROOT, '.trae/skills/oss-vis-gd-project-context');

// 迁移前源目录（用于解析历史相对链接的真实目标）
const ORIG_BASE = path.join(REPO_ROOT, '.trae/documents');

const targets = [
  { dir: path.join(SKILL, 'plans/research'), orig: path.join(ORIG_BASE, 'research') },
  { dir: path.join(SKILL, 'plans/done'), orig: path.join(ORIG_BASE, 'plans/done') },
];

// 仓库根一级条目名，用于「历史链接多写了一层 ../」时的重锚定
const ROOT_ENTRIES = new Set(fs.readdirSync(REPO_ROOT));

let totalFixed = 0;
let totalFiles = 0;

function walk(dir, cb) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, cb);
    else if (f.endsWith('.md')) cb(p);
  }
}

for (const { dir, orig } of targets) {
  walk(dir, (file) => {
    // 该文件迁移前的原位置（保持子目录结构）
    const rel = path.relative(dir, file);
    const origFileDir = path.dirname(path.join(orig, rel));
    let content = fs.readFileSync(file, 'utf8');
    let fixed = 0;
    // 匹配 [text](../...) 形式的 markdown 链接（含 ../.local-docs 等）
    content = content.replace(/\[([^\]]*)\]\((\.\.[^)]+)\)/g, (m, text, linkPath) => {
      const abs = path.resolve(origFileDir, linkPath);
      let rootRel = path.relative(REPO_ROOT, abs).split(path.sep).join('/');
      if (rootRel.startsWith('..')) {
        // 回退：历史链接多写了一层 ../ 时，若路径中含仓库根一级条目名，则重锚定
        const segs = rootRel.split('/');
        const idx = segs.findIndex((s) => ROOT_ENTRIES.has(s));
        if (idx >= 0) rootRel = segs.slice(idx).join('/');
        else return m; // 无法重锚定：保留原样
      }
      fixed++;
      return '`' + rootRel + '`';
    });
    if (fixed > 0) {
      fs.writeFileSync(file, content);
      totalFiles++;
      totalFixed += fixed;
      console.log(`[fix-links] ${path.relative(REPO_ROOT, file)}: ${fixed} 处`);
    }
  });
}

console.log(`[fix-links] 完成：${totalFiles} 个文件，共修正 ${totalFixed} 处链接`);
