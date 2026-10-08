#!/usr/bin/env node
/**
 * scripts/2026-07-29-copy-standards.js
 * 作用：从 .local-docs/docs模板-yzf/docs/standards/ 拷贝 + 微调到 docs/standards/
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-copy-standards.js
 * 可重复执行：幂等（覆盖已存在的文件）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE = path.resolve(ROOT, '.local-docs/docs模板-yzf/docs/standards');
const TARGET = path.resolve(ROOT, 'docs/standards');

// 直接拷贝
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

// 拷贝 + 微调（本项目栈）
function copyAndAdapt(name, headerNote) {
    const src = path.join(TEMPLATE, name);
    const dst = path.join(TARGET, name);
    if (!fs.existsSync(src)) {
        console.warn(`[skip] 模板不存在：${name}`);
        return;
    }
    let content = fs.readFileSync(src, 'utf8');
    // 在标题下插入适配标注
    content = content.replace(/^(# 编码标准[^\n]*\n)/, `$1\n> ${headerNote}\n`);
    fs.writeFileSync(dst, content, 'utf8');
    console.log(`[adapt] ${name}（${content.length} bytes）`);
}

try {
    console.log(`[start] standards/ 拷贝：${TEMPLATE} → ${TARGET}`);
    if (!fs.existsSync(TARGET)) {
        fs.mkdirSync(TARGET, { recursive: true });
    }
    copyOne('README.md');
    copyAndAdapt('coding-standards.md', '**本项目栈**：React 18.1.0 + antd 5.26.7 + valtio 1.11.2 + fedx-ssr 0.5.0 + midway 3（详见 `docs/design/tech-stack.md`）');
    copyOne('security-standards.md');
    console.log('[done] ✅ 完成');
} catch (err) {
    console.error('[error] ❌ 异常：', err.message);
    process.exit(1);
}