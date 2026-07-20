#!/usr/bin/env node
/**
 * new-spec.mjs — 创建一个新的特性规格目录（五件套 + PM 输入）
 *
 * 用法：
 *   node new-spec.mjs <编号-短名> [特性名]
 *
 * 示例：
 *   node new-spec.mjs 001-model-management 模型管理
 *
 * 编号-短名格式：小写字母、数字、短横线（如 001-model-management）。
 * 已存在的目录不会被覆盖，会报错退出。
 * 模板来源：references/templates/docs/specs/_template/
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, validateSlug, copyTemplateDir } from './_lib.mjs';

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('用法: node new-spec.mjs <编号-短名> [特性名]');
  console.error('示例: node new-spec.mjs 001-model-management 模型管理');
  process.exit(1);
}

const SPEC_ID = args[0];
const SPEC_NAME = args[1] || SPEC_ID;
const CWD = process.cwd();

// 校验短名格式
try {
  validateSlug(SPEC_ID);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// 校验是否在项目根（有 docs/specs/）
const specsDir = path.join(CWD, 'docs', 'specs');
if (!fs.existsSync(specsDir)) {
  console.error(`✗ 未找到 docs/specs/ 目录`);
  console.error(`  请先在项目根运行: node scripts/init.mjs`);
  process.exit(1);
}

const target = path.join(specsDir, SPEC_ID);
if (fs.existsSync(target)) {
  console.error(`✗ 已存在: ${path.relative(CWD, target)}`);
  process.exit(1);
}

// ---------- 生成文件 ----------

console.log(`\n创建特性规格：${SPEC_ID} (${SPEC_NAME})`);
console.log(`目录：${path.relative(CWD, target)}\n`);

const vars = { SPEC_NAME };

// 复制整个 _template 目录（含 pm-inputs/、五件套、示例）
copyTemplateDir(
  path.join('docs', 'specs', '_template'),
  target,
  vars,
  { cwd: CWD }
);
// 删除示例文件（特性目录不需要示例）
const examplePath = path.join(target, 'pm-inputs', 'pm-requirements-input-example.md');
if (fs.existsSync(examplePath)) {
  fs.rmSync(examplePath);
  console.log(`  删除示例: ${path.relative(CWD, examplePath)}`);
}
// assets 占位
fs.mkdirSync(path.join(target, 'pm-inputs', 'assets'), { recursive: true });
fs.writeFileSync(path.join(target, 'pm-inputs', 'assets', '.gitkeep'), '');
console.log(`  创建: ${path.relative(CWD, path.join(target, 'pm-inputs', 'assets', '.gitkeep'))}`);

// 登记 index.md — 用表格分隔行作锚点，更稳健
const indexPath = path.join(specsDir, 'index.md');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const newLine = `| ${SPEC_ID} | ${SPEC_NAME} | 草稿 | [spec](./${SPEC_ID}/spec.md) |`;
const lines = indexContent.split('\n');

// 找包含 |---| 的分隔行，在其后第一个空表格行处插入
let separatorIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (/\|[-:\s|]+\|/.test(lines[i]) && lines[i].includes('---')) {
    separatorIdx = i;
    break;
  }
}
if (separatorIdx >= 0) {
  // 从分隔行后找最后一行表格数据
  let lastTableRow = separatorIdx;
  for (let i = separatorIdx + 1; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('|')) {
      lastTableRow = i;
    } else {
      break;
    }
  }
  lines.splice(lastTableRow + 1, 0, newLine);
  fs.writeFileSync(indexPath, lines.join('\n'), 'utf8');
  console.log(`  登记: ${path.relative(CWD, indexPath)}`);
} else {
  console.warn(`  ⚠ 未找到 index.md 表格分隔行，跳过登记`);
}

console.log(`\n✓ 完成`);
console.log('\n下一步：');
console.log(`  1. 编辑 pm-inputs/pm-requirements-input.md 填写业务需求`);
console.log(`     （参考 _template/pm-inputs/pm-requirements-input-example.md）`);
console.log(`  2. 用反向提问提示词对 PM 输入补洞（见 references/spec-five-pieces.md）`);
console.log(`  3. PM 输入冻结后，生成五件套并研发审定`);
console.log(`  4. 按 spec.md + acceptance-tests.md 实现\n`);
