#!/usr/bin/env node
/**
 * scripts/copy-shenzhen-skeleton-assets.js
 * 作用：深圳重要通信保障屏骨架阶段，从信管局物理复制视觉资产（task-003 步骤 1）
 * 用法：node copy-shenzhen-skeleton-assets.js
 * 幂等：重复执行时已存在的目标文件跳过
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../..');
const srcPage = path.join(repoRoot, 'web/pages/info-management-bureau');
const dstPage = path.join(repoRoot, 'web/pages/shenzhen-communication-guarantee');
const srcStatic = path.join(repoRoot, 'public/static/images/info-management-bureau');
const dstStatic = path.join(repoRoot, 'public/static/images/shenzhen-communication-guarantee');

// [源文件, 目标文件]（仓库根相对）
const copyList = [
    // 页面 images/
    [`${srcPage}/images/time-icon.png`, `${dstPage}/images/time-icon.png`],
    [`${srcPage}/images/panel-title-bg.svg`, `${dstPage}/images/panel-title-bg.svg`],
    // 切换按钮资产（screen-switch）
    [
        `${srcPage}/sub-pages/components/view-state/images/switch-icon.png`,
        `${dstPage}/sub-pages/components/screen-switch/images/switch-icon.png`,
    ],
    [
        `${srcPage}/sub-pages/components/view-state/images/switch-panel.png`,
        `${dstPage}/sub-pages/components/screen-switch/images/switch-panel.png`,
    ],
    [
        `${srcPage}/sub-pages/components/view-state/images/icon-play.png`,
        `${dstPage}/sub-pages/components/screen-switch/images/icon-play.png`,
    ],
    [
        `${srcPage}/sub-pages/components/view-state/images/icon-stop.png`,
        `${dstPage}/sub-pages/components/screen-switch/images/icon-stop.png`,
    ],
    [
        `${srcPage}/sub-pages/components/view-state/images/line.svg`,
        `${dstPage}/sub-pages/components/screen-switch/images/line.svg`,
    ],
    [
        `${srcPage}/sub-pages/components/view-state/images/menu-item-bg.png`,
        `${dstPage}/sub-pages/components/screen-switch/images/menu-item-bg.png`,
    ],
    // 全局背景（static images）
    [`${srcStatic}/page-background.png`, `${dstStatic}/page-background.png`],
];

function main() {
    console.log('[copy-shenzhen-skeleton-assets] 开始复制视觉资产');
    let copied = 0;
    let skipped = 0;

    copyList.forEach(([src, dst]) => {
        if (!fs.existsSync(src)) {
            console.error(`[copy-shenzhen-skeleton-assets] ❌ 源文件不存在：${src}`);
            process.exit(1);
        }

        if (fs.existsSync(dst)) {
            skipped += 1;
            console.log(`跳过（已存在）：${path.relative(repoRoot, dst)}`);
            return;
        }

        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
        copied += 1;
        console.log(`复制：${path.relative(repoRoot, src)} -> ${path.relative(repoRoot, dst)}`);
    });

    console.log(`[copy-shenzhen-skeleton-assets] ✅ 完成（复制 ${copied}，跳过 ${skipped}）`);
}

try {
    main();
} catch (err) {
    console.error('[copy-shenzhen-skeleton-assets] ❌ 异常：', err.message);
    process.exit(1);
}
