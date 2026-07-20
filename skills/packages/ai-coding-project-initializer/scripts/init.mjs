#!/usr/bin/env node
/**
 * init.mjs — 为项目装上文档驱动 AI Coding 的完整骨架
 *
 * 用法：
 *   node init.mjs [目标目录] [--agents-only] [--docs-only] [--legacy]
 *
 * 不传目标目录则默认当前工作目录。
 * --agents-only  只生成 AGENTS.md
 * --docs-only    只生成 docs/ 全树
 * --legacy       额外生成历史变更模板
 *
 * 已存在的文件不会被覆盖，会跳过并提示。
 *
 * 模板来源：references/templates/ —— 脚本只负责读取、替换占位符、写入。
 */
import path from 'node:path';
import {
  render,
  writeFile,
  gitkeep,
  copyTemplateDir,
} from './_lib.mjs';

const ARGS = process.argv.slice(2);
const TARGET = ARGS.find(a => !a.startsWith('--')) || process.cwd();
const FLAGS = {
  agentsOnly: ARGS.includes('--agents-only'),
  docsOnly: ARGS.includes('--docs-only'),
  legacy: ARGS.includes('--legacy'),
};

// ---------- AGENTS.md ----------

function genAgents(projectName) {
  const content = render('AGENTS.md', { PROJECT_NAME: projectName });
  writeFile(path.join(TARGET, 'AGENTS.md'), content, { cwd: TARGET });
}

// ---------- docs/ 全树 ----------

function genDocsTree(projectName) {
  const docs = path.join(TARGET, 'docs');

  // docs/design/ — 复制整个 design 模板目录
  copyTemplateDir(path.join('design'), path.join(docs, 'design'), {}, { cwd: TARGET });
  gitkeep(path.join(docs, 'design', 'decisions'), { cwd: TARGET });

  // docs/specs/
  const specs = path.join(docs, 'specs');
  // index.md
  writeFile(
    path.join(specs, 'index.md'),
    render(path.join('docs', 'specs', 'index.md')),
    { cwd: TARGET }
  );
  // _template/ — 复制整个特性模板目录（含 pm-inputs 示例）
  copyTemplateDir(
    path.join('docs', 'specs', '_template'),
    path.join(specs, '_template'),
    {},
    { cwd: TARGET }
  );
  gitkeep(path.join(specs, '_template', 'pm-inputs', 'assets'), { cwd: TARGET });
  gitkeep(path.join(specs, '_legacy-changes'), { cwd: TARGET });

  // docs/research/
  copyTemplateDir(path.join('docs', 'research'), path.join(docs, 'research'), {}, { cwd: TARGET });

  // docs/index.md
  writeFile(
    path.join(docs, 'index.md'),
    render(path.join('docs', 'index.md')),
    { cwd: TARGET }
  );

  // docs/roadmap.md — 项目级计划
  writeFile(
    path.join(docs, 'roadmap.md'),
    render(path.join('docs', 'roadmap.md'), { PROJECT_NAME: projectName }),
    { cwd: TARGET }
  );

  // 空目录占位
  gitkeep(path.join(docs, 'skills'), { cwd: TARGET });
  gitkeep(path.join(docs, 'workflows'), { cwd: TARGET });
  gitkeep(path.join(docs, 'changelogs'), { cwd: TARGET });
}

// ---------- 历史变更模板 ----------

function genLegacyTemplate() {
  const template = path.join(TARGET, 'docs', 'specs', '_template');
  const content = render('legacy-change.md', {
    SHORT_NAME: '<短名>',
    SPEC_LINK: '',
    FILE_PATH: 'docs/specs/_template/legacy-change.md',
  });
  writeFile(path.join(template, 'legacy-change.md'), content, { cwd: TARGET });
}

// ---------- bootstrap ADR ----------

function genBootstrapAdr(projectName) {
  const decisions = path.join(TARGET, 'docs', 'design', 'decisions');
  const content = render('bootstrap-adr.md', { PROJECT_NAME: projectName });
  writeFile(path.join(decisions, '0001-bootstrap.md'), content, { cwd: TARGET });
}

// ---------- 主流程 ----------

function main() {
  const projectName = path.basename(path.resolve(TARGET)) || 'My Project';
  console.log(`\n初始化文档骨架：${projectName}`);
  console.log(`目标目录：${TARGET}\n`);

  if (!FLAGS.docsOnly) {
    console.log('▶ AGENTS.md');
    genAgents(projectName);
  }
  if (!FLAGS.agentsOnly) {
    console.log('\n▶ docs/ 全树');
    genDocsTree(projectName);
  }
  if (FLAGS.legacy) {
    console.log('\n▶ 历史变更模板');
    genLegacyTemplate();
  }
  if (!FLAGS.docsOnly && !FLAGS.agentsOnly) {
    console.log('\n▶ Bootstrap ADR');
    genBootstrapAdr(projectName);
  }

  console.log('\n✓ 完成');
  console.log('\n下一步：');
  console.log('  1. 编辑 AGENTS.md 填写 <待填> 占位符');
  console.log('  2. 编辑 docs/design/ 下各文件填写技术栈、架构等');
  console.log('  3. 用 new-spec.mjs 创建第一个特性：node scripts/new-spec.mjs 001-my-feature');
  if (FLAGS.legacy) {
    console.log('  4. 历史项目改动复制 docs/specs/_template/legacy-change.md 到任务目录');
  }
  console.log('');
}

main();
