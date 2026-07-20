#!/usr/bin/env node
/**
 * legacy-change.mjs — 创建一个历史变更文档（as-is → to-be）
 *
 * 用法：
 *   node legacy-change.mjs <短名> [--spec <特性编号-短名>]
 *
 * 示例：
 *   node legacy-change.mjs fix-login-redirect
 *   node legacy-change.mjs refactor-filter-bar --spec 001-model-management
 *
 * 短名格式：小写字母、数字、短横线（如 fix-login-redirect）。
 * 不带 --spec：生成到 docs/specs/_legacy-changes/<短名>.md
 * 带 --spec：生成到 docs/specs/<特性编号-短名>/changes/<短名>.md
 * 模板来源：references/templates/legacy-change.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, validateSlug } from './_lib.mjs';

const args = process.argv.slice(2);
if (!args[0] || args[0].startsWith('--')) {
  console.error('用法: node legacy-change.mjs <短名> [--spec <特性编号-短名>]');
  console.error('示例: node legacy-change.mjs fix-login-redirect');
  console.error('      node legacy-change.mjs refactor-filter-bar --spec 001-model-management');
  process.exit(1);
}

const SHORT_NAME = args[0];
const SPEC_FLAG_IDX = args.indexOf('--spec');
const SPEC_ID = SPEC_FLAG_IDX >= 0 ? args[SPEC_FLAG_IDX + 1] : null;
const CWD = process.cwd();

// 校验短名格式
try {
  validateSlug(SHORT_NAME);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
if (SPEC_ID) {
  try {
    validateSlug(SPEC_ID);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

// 校验
const specsDir = path.join(CWD, 'docs', 'specs');
if (!fs.existsSync(specsDir)) {
  console.error(`✗ 未找到 docs/specs/ 目录`);
  console.error(`  请先在项目根运行: node scripts/init.mjs`);
  process.exit(1);
}

let targetDir;
let specLink = '';
if (SPEC_ID) {
  targetDir = path.join(specsDir, SPEC_ID, 'changes');
  specLink = `docs/specs/${SPEC_ID}/`;
  if (!fs.existsSync(path.join(specsDir, SPEC_ID))) {
    console.error(`✗ 未找到特性目录: docs/specs/${SPEC_ID}`);
    process.exit(1);
  }
} else {
  targetDir = path.join(specsDir, '_legacy-changes');
}

const target = path.join(targetDir, `${SHORT_NAME}.md`);
if (fs.existsSync(target)) {
  console.error(`✗ 已存在: ${path.relative(CWD, target)}`);
  process.exit(1);
}

// 读取模板并替换占位符
const filePathRel = path.relative(CWD, target);
const content = render('legacy-change.md', {
  SHORT_NAME,
  SPEC_LINK: specLink,
  FILE_PATH: filePathRel,
});

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(target, content, 'utf8');
console.log(`\n创建历史变更文档：${SHORT_NAME}`);
console.log(`  路径：${filePathRel}\n`);

console.log(`✓ 完成`);
console.log('\n下一步：');
console.log('  1. 用 P1–P6 查清现状，填写 As-is 段');
console.log('  2. 填写 To-be、影响面、非目标、验收');
console.log('  3. 用反向提问提示词补洞（见 references/legacy-change-template.md）');
console.log('  4. 文档冻结后再让 AI 改代码\n');
