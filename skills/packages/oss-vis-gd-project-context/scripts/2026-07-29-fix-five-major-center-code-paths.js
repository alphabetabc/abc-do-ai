#!/usr/bin/env node
/**
 * scripts/2026-07-29-fix-five-major-center-code-paths.js
 *
 * 作用：plan-003 v2 阶段 7 件套中 5 个顶层 .md 的代码路径错误修正
 * 触发：scan-docs-links.js 报告 depth-3 文件用 4 个 ../ 引用 web/ src/ public/
 *
 * 错误路径（depth-3 文件：docs/specs/five-major-center/{as-is,spec,plan,tasks,acceptance-tests,data-model-extensions}.md）：
 *   `../../../../web/...`   → `../../../web/...`（3 层）
 *   `../../../../src/...`   → `../../../src/...`
 *   `../../../../public/...` → `../../../public/...`
 *   `../../../../package.json` → `../../../package.json`
 *
 * 备注：code-inventory.md 与 pm-requirements-input.md 在 pm-inputs/ 子目录（depth-4），使用 4 个 ../ 是正确的不需修正。
 *
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-fix-five-major-center-code-paths.js
 *
 * 幂等：是
 * 依赖：Node.js 内置 fs/path
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const TARGET_DIR = path.join(PROJECT_ROOT, 'docs', 'specs', 'five-major-center');

// depth-3 文件清单（pm-inputs/ 子目录已用 4 个 ../，正确）
const TARGET_FILES = [
    'as-is-architecture.md',
    'spec.md',
    'plan.md',
    'tasks.md',
    'acceptance-tests.md',
    'data-model-extensions.md',
];

// 错误路径 → 正确路径（少 1 个 ../）
// 涵盖 4 个 ../ 与 5 个 ../(//) 与 2 个 ../(//) 两种变体
const substitutions = [
    { from: '](../../../../web/', to: '](../../../web/' },
    { from: '](../../../../src/', to: '](../../../src/' },
    { from: '](../../../../public/', to: '](../../../public/' },
    { from: '](../../../../package.json', to: '](../../../package.json' },
    { from: '](../../../../config.ts', to: '](../../../config.ts' },
    { from: '](../../../../tsconfig.json', to: '](../../../tsconfig.json' },
    { from: '](../../../..//web/', to: '](../../../web/' },
    { from: '](../../../..//src/', to: '](../../../src/' },
    { from: '](../../../..//public/', to: '](../../../public/' },
    { from: '](../../../..//package.json', to: '](../../../package.json' },
    { from: '](../../../..//config.ts', to: '](../../../config.ts' },
    { from: '](../../../..//tsconfig.json', to: '](../../../tsconfig.json' },
    { from: '](../..//web/', to: '](../../../web/' },
    { from: '](../..//src/', to: '](../../../src/' },
    { from: '](../..//public/', to: '](../../../public/' },
    { from: '](../..//package.json', to: '](../../../package.json' },
    { from: '](../..//config.ts', to: '](../../../config.ts' },
    { from: '](../..//tsconfig.json', to: '](../../../tsconfig.json' },
    // 顶级 .md 互链（../X.md → ./X.md）
    { from: '](../acceptance-tests.md', to: '](./acceptance-tests.md' },
    { from: '](../plan.md', to: '](./plan.md' },
    { from: '](../tasks.md', to: '](./tasks.md' },
    { from: '](../data-model-extensions.md', to: '](./data-model-extensions.md' },
    { from: '](../as-is-architecture.md', to: '](./as-is-architecture.md' },
    { from: '](../spec.md', to: '](./spec.md' },
];

function main() {
    console.log('[fix-code-paths] 目标目录：' + path.relative(PROJECT_ROOT, TARGET_DIR));
    console.log('[fix-code-paths] 目标文件数：' + TARGET_FILES.length);
    console.log('[fix-code-paths] 替换规则数：' + substitutions.length);
    console.log('');

    let totalReplaced = 0;

    for (const file of TARGET_FILES) {
        const filePath = path.join(TARGET_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.error('[fix-code-paths] [error] file not found: ' + path.relative(PROJECT_ROOT, filePath));
            process.exit(1);
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let fileReplaced = 0;

        for (const sub of substitutions) {
            const before = content;
            content = content.split(sub.from).join(sub.to);
            const count = (before.match(new RegExp(sub.from.replace(/[.+*?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (count > 0) {
                fileReplaced += count;
                console.log('  [replace] ' + file + ': ' + sub.from + ' → ' + sub.to + ' (' + count + ' 处)');
            }
        }

        if (fileReplaced > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            totalReplaced += fileReplaced;
            console.log('  [write]   ' + file + ' (替换 ' + fileReplaced + ' 处)');
        }
        console.log('');
    }

    console.log('[fix-code-paths] [done] 全部完成，共替换 ' + totalReplaced + ' 处');
    console.log('[fix-code-paths] [tip] 建议运行 node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js 验证');
}

try {
    main();
} catch (err) {
    console.error('[fix-code-paths] [error] exception:', err.message);
    console.error(err.stack);
    process.exit(1);
}
