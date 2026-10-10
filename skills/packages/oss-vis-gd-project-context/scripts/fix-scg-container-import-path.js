#!/usr/bin/env node
/**
 * scripts/fix-scg-container-import-path.js
 * 作用：修正深圳保障屏 widget 内 container import 路径（../../ → ../../../，task-003 修复）
 * 用法：node fix-scg-container-import-path.js
 * 幂等：替换不到内容时不写文件
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../..');
const roots = [
    'web/pages/shenzhen-communication-guarantee/sub-pages/home/modules',
    'web/pages/shenzhen-communication-guarantee/sub-pages/area/modules',
];

const FROM = "'../../components/container'";
const TO = "'../../../components/container'";

function main() {
    let fixed = 0;

    const walk = (dir) => {
        fs.readdirSync(dir).forEach((f) => {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) {
                walk(p);
                return;
            }
            if (!f.endsWith('.tsx')) {
                return;
            }
            const c = fs.readFileSync(p, 'utf8');
            if (c.includes(FROM)) {
                fs.writeFileSync(p, c.split(FROM).join(TO));
                fixed += 1;
                console.log(`fixed: ${path.relative(repoRoot, p)}`);
            }
        });
    };

    roots.forEach((r) => {
        const abs = path.join(repoRoot, r);
        if (!fs.existsSync(abs)) {
            console.error(`[fix-scg-container-import-path] ❌ 目录不存在：${abs}`);
            process.exit(1);
        }
        walk(abs);
    });

    console.log(`[fix-scg-container-import-path] ✅ 完成（修复 ${fixed} 个文件）`);
}

try {
    main();
} catch (err) {
    console.error('[fix-scg-container-import-path] ❌ 异常：', err.message);
    process.exit(1);
}
