#!/usr/bin/env node
/**
 * scripts/2026-07-29-copy-workflows.js
 * 作用：从 .local-docs/docs模板-yzf/docs/workflows/ 拷贝到 docs/workflows/
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-copy-workflows.js
 * 可重复执行：幂等（覆盖已存在的文件）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE = path.resolve(ROOT, '.local-docs/docs模板-yzf/docs/workflows');
const TARGET = path.resolve(ROOT, 'docs/workflows');

const files = [
    'README.md',
    'as-is-to-be-guide.md',
    'brownfield-module-refactor.md',
    'tdd-process.md',
];

function copyOne(name) {
    const src = path.join(TEMPLATE, name);
    const dst = path.join(TARGET, name);
    if (!fs.existsSync(src)) {
        console.warn(`[skip] 模板不存在：${name}`);
        return;
    }
    const content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dst, content, 'utf8');
    console.log(`[copy] ${name}（${content.length} bytes）`);
}

try {
    console.log(`[start] workflows/ 拷贝：${TEMPLATE} → ${TARGET}`);
    if (!fs.existsSync(TARGET)) {
        fs.mkdirSync(TARGET, { recursive: true });
    }
    files.forEach(copyOne);
    console.log('[done] ✅ 完成');
} catch (err) {
    console.error('[error] ❌ 异常：', err.message);
    process.exit(1);
}