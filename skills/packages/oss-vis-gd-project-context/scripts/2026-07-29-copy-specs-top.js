#!/usr/bin/env node
/**
 * scripts/2026-07-29-copy-specs-top.js
 * 作用：从 .local-docs/docs模板-yzf/docs/specs/_template/ 拷贝 + spec-split-guide.md
 *      新增 pm-inputs/code-inventory.md 占位
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-copy-specs-top.js
 * 可重复执行：幂等
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE = path.resolve(ROOT, '.local-docs/docs模板-yzf/docs/specs');
const TARGET = path.resolve(ROOT, 'docs/specs');

const files = [
    'spec-split-guide.md',
    '_template/spec.md',
    '_template/plan.md',
    '_template/tasks.md',
    '_template/acceptance-tests.md',
    '_template/data-model-extensions.md',
    '_template/pm-inputs/pm-requirements-input.md',
    '_template/pm-inputs/assets/README.md',
];

function copyOne(relPath) {
    const src = path.join(TEMPLATE, relPath);
    const dst = path.join(TARGET, relPath);
    if (!fs.existsSync(src)) {
        console.warn(`[skip] 模板不存在：${relPath}`);
        return;
    }
    const content = fs.readFileSync(src, 'utf8');
    if (!fs.existsSync(path.dirname(dst))) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
    }
    fs.writeFileSync(dst, content, 'utf8');
    console.log(`[copy] ${relPath}（${content.length} bytes）`);
}

function writePlaceholder(relPath, title, hint) {
    const dst = path.join(TARGET, relPath);
    if (!fs.existsSync(path.dirname(dst))) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
    }
    const content = `# ${title}

> ⚠️ **占位 / 待 plan-003 阶段 2 整合**
>
> ${hint}
>
> 模板流程要求每个 spec 含本文件（`.trae/skills/oss-vis-gd-project-context/plans/research/2026-07-29-003-docs-mvp-structure.md` §4.2，已迁入 skill plans/research/）；实际内容由 plan-003 阶段 2 落盘。
`;
    fs.writeFileSync(dst, content, 'utf8');
    console.log(`[placeholder] ${relPath}（${content.length} bytes）`);
}

try {
    console.log(`[start] specs/ 顶层拷贝：${TEMPLATE} → ${TARGET}`);
    files.forEach(copyOne);
    writePlaceholder(
        '_template/pm-inputs/code-inventory.md',
        'code-inventory.md — 模块代码清单',
        '**模板流程要求**每个 spec 含本文件（as-is 阶段必备）；实际内容由 plan-003 阶段 2 落盘。'
    );
    console.log('[done] ✅ 完成');
} catch (err) {
    console.error('[error] ❌ 异常：', err.message);
    process.exit(1);
}