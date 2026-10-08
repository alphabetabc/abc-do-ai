#!/usr/bin/env node
/**
 * scripts/2026-07-29-create-docs-skeleton.js
 * 作用：在项目根创建 docs/ 目录骨架（按 plan-002 §5.1 + Stage B §5.1）
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-create-docs-skeleton.js
 * 可重复执行：幂等（已存在的目录/文件不报错）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const DOCS = path.resolve(ROOT, 'docs');

const dirs = [
    'design/decisions',
    'design/assets',
    'design/realtime-protocol',
    'design/iframe-pages',
    'workflows',
    'standards',
    'skills/common',
    'skills/frontend/react',
    'skills/ai-tools/claude-cursor',
    'research',
    'operations',
    'specs/_template/pm-inputs/assets',
];

function ensure(dir) {
    const abs = path.join(DOCS, dir);
    if (fs.existsSync(abs)) {
        console.log(`[skip] 已存在：${dir}`);
    } else {
        fs.mkdirSync(abs, { recursive: true });
        console.log(`[create] 创建：${dir}`);
    }
}

try {
    console.log(`[start] docs/ 骨架：${DOCS}`);
    dirs.forEach(ensure);
    console.log('[done] ✅ 完成');
} catch (err) {
    console.error('[error] ❌ 异常：', err.message);
    process.exit(1);
}