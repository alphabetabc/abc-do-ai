#!/usr/bin/env node
/**
 * 2026-10-09-fix-mock-viewpageid.js
 * 作用：mock json 中的 viewPageId 与 service 保持一致（复用信管局 open-close-ceremonies-view）
 * 用法：node 2026-10-09-fix-mock-viewpageid.js
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../../../../public/static/mock/shenzhen-communication-guarantee');
let total = 0;
fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .forEach((f) => {
        const file = path.join(dir, f);
        const content = fs.readFileSync(file, 'utf8');
        const next = content.replaceAll('"shenzhen-communication-guarantee-view"', '"open-close-ceremonies-view"');
        if (next !== content) {
            fs.writeFileSync(file, next);
            total += 1;
            console.log(`[fix-mock-viewpageid] ${f}: 已替换`);
        }
    });
console.log(`[fix-mock-viewpageid] ✅ 完成，共 ${total} 个文件`);
