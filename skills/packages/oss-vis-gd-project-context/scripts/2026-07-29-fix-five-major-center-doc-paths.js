#!/usr/bin/env node
/**
 * scripts/2026-07-29-fix-five-major-center-doc-paths.js
 *
 * 作用：plan-003 v2 阶段 7 件套的相对路径错误修正
 * 触发：scan-docs-links.js 报告 大量死链，发现 5 个 .md 用错了 ../ 与 ./ 路径
 *
 * 错误的路径（在 docs/specs/five-major-center/ 下的 4 个 .md）：
 *   `../as-is-architecture.md`     → `./as-is-architecture.md`（同级，但反着写）
 *   `../pm-inputs/X`              → `./pm-inputs/X`（同级，但反着写）
 *
 * 错误的路径（在 docs/specs/five-major-center/pm-inputs/ 下的 1 个 .md）：
 *   `../../workflows/...`         → `../../../workflows/...`（多退一层）
 *
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-fix-five-major-center-doc-paths.js
 *
 * 幂等：是（已修复的路径再执行不会被破坏）
 * 依赖：Node.js 内置 fs/path
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const TARGET_DIR = path.join(PROJECT_ROOT, 'docs', 'specs', 'five-major-center');

// 错误路径 → 正确路径 替换规则
const substitutions = [
    // 5 处同级文件错误错位（4 个 docs/specs/five-major-center/*.md）
    {
        file: 'data-model-extensions.md',
        from: '../as-is-architecture.md',
        to: './as-is-architecture.md',
    },
    {
        file: 'data-model-extensions.md',
        from: '../pm-inputs/',
        to: './pm-inputs/',
    },
    {
        file: 'plan.md',
        from: '../as-is-architecture.md',
        to: './as-is-architecture.md',
    },
    {
        file: 'plan.md',
        from: '../pm-inputs/',
        to: './pm-inputs/',
    },
    {
        file: 'spec.md',
        from: '../as-is-architecture.md',
        to: './as-is-architecture.md',
    },
    {
        file: 'spec.md',
        from: '../pm-inputs/',
        to: './pm-inputs/',
    },
    {
        file: 'tasks.md',
        from: '../as-is-architecture.md',
        to: './as-is-architecture.md',
    },
    {
        file: 'tasks.md',
        from: '../pm-inputs/',
        to: './pm-inputs/',
    },
    // 1 处 depth 错误（code-inventory.md 缺一层 ../）
    {
        file: 'pm-inputs/code-inventory.md',
        from: '../../workflows/',
        to: '../../../workflows/',
    },
];

function main() {
    console.log('[fix-paths] 目标目录：' + path.relative(PROJECT_ROOT, TARGET_DIR));
    console.log('[fix-paths] 替换规则数：' + substitutions.length);
    console.log('');

    let totalReplaced = 0;

    // 按文件分组
    const byFile = {};
    for (const sub of substitutions) {
        if (!byFile[sub.file]) byFile[sub.file] = [];
        byFile[sub.file].push(sub);
    }

    for (const [file, subs] of Object.entries(byFile)) {
        const filePath = path.join(TARGET_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.error('[fix-paths] [error] file not found: ' + path.relative(PROJECT_ROOT, filePath));
            process.exit(1);
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let fileReplaced = 0;

        for (const sub of subs) {
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

    console.log('[fix-paths] [done] 全部完成，共替换 ' + totalReplaced + ' 处');
    console.log('[fix-paths] [tip] 建议运行 node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js 验证');
}

try {
    main();
} catch (err) {
    console.error('[fix-paths] [error] exception:', err.message);
    console.error(err.stack);
    process.exit(1);
}
