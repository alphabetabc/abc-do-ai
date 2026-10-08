#!/usr/bin/env node
// 2026-10-08-rewrite-trae-documents-refs.js
// 作用：task-2026-10-08-001 步骤 5 —— 把迁入的 research/done 文档与 scripts 内的
//       `.trae/documents/...` 历史路径改写为 skill 内新路径（仓库根相对，反引号文本）。
// 用法：node 2026-10-08-rewrite-trae-documents-refs.js
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SKILL = path.join(REPO_ROOT, '.trae/skills/oss-vis-gd-project-context');
const NEW = '.trae/skills/oss-vis-gd-project-context';

// 旧路径前缀 → 新路径前缀（长前缀优先）
const MAP = [
  ['.trae/documents/plans/done/', `${NEW}/plans/done/`],
  ['.trae/documents/plans/', `${NEW}/plans/`],
  ['.trae/documents/research/', `${NEW}/plans/research/`],
  ['.trae/documents/design/', `${NEW}/design/`],
  ['.trae/documents/docs-link/', `${NEW}/references/docs-link/`],
  ['.trae/documents/scripts/', `${NEW}/scripts/`],
  ['.trae/documents/roadmap.md', `${NEW}/plans/roadmap.md`],
];

const targets = [path.join(SKILL, 'plans/research'), path.join(SKILL, 'plans/done'), path.join(SKILL, 'scripts')];

function walk(dir, cb) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, cb);
    else if (f.endsWith('.md') || f.endsWith('.js')) cb(p);
  }
}

let totalFiles = 0;
let totalFixed = 0;
for (const dir of targets) {
  walk(dir, (file) => {
    let content = fs.readFileSync(file, 'utf8');
    let fixed = 0;
    for (const [from, to] of MAP) {
      const parts = content.split(from);
      if (parts.length > 1) {
        fixed += parts.length - 1;
        content = parts.join(to);
      }
    }
    if (fixed > 0) {
      fs.writeFileSync(file, content);
      totalFiles++;
      totalFixed += fixed;
      console.log(`[rewrite-refs] ${path.relative(REPO_ROOT, file)}: ${fixed} 处`);
    }
  });
}
console.log(`[rewrite-refs] 完成：${totalFiles} 个文件，共改写 ${totalFixed} 处`);
