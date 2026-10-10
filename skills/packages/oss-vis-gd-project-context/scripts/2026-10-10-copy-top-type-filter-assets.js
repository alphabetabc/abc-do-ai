#!/usr/bin/env node
/**
 * 2026-10-10-copy-top-type-filter-assets.js
 * 作用：004-03 top-type-filter 迁移素材复制（幂等）
 *  - top_bg.svg：信管局 page images → 深圳屏 page images
 *  - 5 类型图标：信管局 static images → 深圳屏 static images（临时映射，待 UI 图标原位替换）
 * 用法：node 2026-10-10-copy-top-type-filter-assets.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../../');
const IMB_PAGE_IMAGES = path.join(ROOT, 'web/pages/info-management-bureau/images');
const SCG_PAGE_IMAGES = path.join(ROOT, 'web/pages/shenzhen-communication-guarantee/images');
const IMB_STATIC = path.join(ROOT, 'public/static/images/info-management-bureau');
const SCG_STATIC = path.join(ROOT, 'public/static/images/shenzhen-communication-guarantee');

// 深圳类型 → 信管局源图标（临时映射）
const ICON_MAP = {
    'icon-会场.svg': 'icon-竞赛场馆.svg',
    'icon-参访区.svg': 'icon-非竞赛场馆.svg',
    'icon-酒店.svg': 'icon-酒店.svg',
    'icon-交通枢纽.svg': 'icon-医院.svg',
    'icon-其它.svg': 'icon-办公场所.svg',
};

function copy(from, to) {
    if (!fs.existsSync(from)) throw new Error(`源文件不存在：${from}`);
    fs.copyFileSync(from, to);
    console.log(`[copy-assets] ✓ ${path.relative(ROOT, to)}`);
}

function main() {
    if (!fs.existsSync(SCG_STATIC)) fs.mkdirSync(SCG_STATIC, { recursive: true });

    copy(path.join(IMB_PAGE_IMAGES, 'top_bg.svg'), path.join(SCG_PAGE_IMAGES, 'top_bg.svg'));

    Object.entries(ICON_MAP).forEach(([target, source]) => {
        copy(path.join(IMB_STATIC, source), path.join(SCG_STATIC, target));
    });

    console.log('[copy-assets] ✅ 完成');
}

try {
    main();
} catch (err) {
    console.error('[copy-assets] ❌ 异常：', err.message);
    process.exit(1);
}
