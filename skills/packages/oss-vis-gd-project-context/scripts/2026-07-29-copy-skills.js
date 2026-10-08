#!/usr/bin/env node
/**
 * scripts/2026-07-29-copy-skills.js
 * 作用：从 .local-docs/docs模板-yzf/docs/skills/ 拷贝到 docs/skills/
 *      coding.md / testing.md 用占位 + 「待 plan-003 整合」标注
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-copy-skills.js
 * 可重复执行：幂等
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE = path.resolve(ROOT, '.local-docs/docs模板-yzf/docs/skills');
const TARGET = path.resolve(ROOT, 'docs/skills');

const placeholderHeader = `# ⚠️ 占位 / 待 plan-003 整合

> **状态**：本文件为占位，**不直接使用**。
> 待 plan-003 阶段 2 由本项目栈版本（React 18 + antd 5 + valtio + fedx-ssr）重写。
> 模板原文（不适用本项目）见 `.local-docs/docs模板-yzf/docs/skills/frontend/react/coding.md`。

---

`;

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

function writePlaceholder(relPath, title) {
    const dst = path.join(TARGET, relPath);
    if (!fs.existsSync(path.dirname(dst))) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
    }
    const content = `# ${title}\n\n${placeholderHeader}`;
    fs.writeFileSync(dst, content, 'utf8');
    console.log(`[placeholder] ${relPath}（${content.length} bytes）`);
}

try {
    console.log(`[start] skills/ 拷贝：${TEMPLATE} → ${TARGET}`);
    // 直接拷贝
    copyOne('README.md');
    copyOne('common/git-workflow.md');
    copyOne('frontend/README.md');
    copyOne('ai-tools/claude-cursor/README.md');
    copyOne('ai-tools/claude-cursor/prompts.md');
    // 占位
    writePlaceholder('frontend/react/coding.md', 'React · 编码与工程习惯');
    writePlaceholder('frontend/react/testing.md', 'React · 测试');
    console.log('[done] ✅ 完成');
} catch (err) {
    console.error('[error] ❌ 异常：', err.message);
    process.exit(1);
}