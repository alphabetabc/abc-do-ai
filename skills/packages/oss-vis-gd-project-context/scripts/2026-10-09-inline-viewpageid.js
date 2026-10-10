#!/usr/bin/env node
/**
 * 2026-10-09-inline-viewpageid.js
 * 作用：004-01 将各 service 文件中的 viewPageId 常量内联到每个接口的 params 中
 * 用法：node 2026-10-09-inline-viewpageid.js
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../../../../web/services/shenzhen-communication-guarantee');
const files = [
    'area/section-left.ts',
    'home/center.ts',
    'home/section-left.ts',
    'home/section-right.ts',
    'components/index.ts',
];

let total = 0;
files.forEach((rel) => {
    const file = path.join(dir, rel);
    let content = fs.readFileSync(file, 'utf8');
    const before = content;

    // 删除常量声明行
    content = content.replace(/^const viewPageId = 'open-close-ceremonies-view'; \/\/ 复用信管局视图页\r?\n\r?\n/m, '');
    // 内联到 params
    content = content.replace(/^(\s*)viewPageId,$/gm, "$1viewPageId: 'open-close-ceremonies-view', // 复用信管局视图页");

    if (content !== before) {
        const count = (content.match(/viewPageId: 'open-close-ceremonies-view'/g) || []).length;
        total += count;
        fs.writeFileSync(file, content);
        console.log(`[inline-viewpageid] ${rel}: 内联 ${count} 处`);
    } else {
        console.log(`[inline-viewpageid] ${rel}: 无变更`);
    }
});
console.log(`[inline-viewpageid] ✅ 完成，共内联 ${total} 处`);
