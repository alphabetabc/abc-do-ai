#!/usr/bin/env node
/**
 * scripts/init-spec-module.js
 * 作用：从 docs/specs/_template/ 复制模块骨架到 docs/specs/<slug>/，替换模块名占位符（幂等）。
 * 用法：node init-spec-module.js <slug> <中文名>
 * 示例：node init-spec-module.js shenzhen-communication-guarantee 深圳重要通信保障
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.resolve(__dirname, '../../../../docs/specs/_template');
const SPECS_DIR = path.resolve(__dirname, '../../../../docs/specs');

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
    });
}

function main() {
    const [slug, cnName] = process.argv.slice(2);
    if (!slug || !cnName) {
        console.error('[init-spec-module] 错误：用法 node init-spec-module.js <slug> <中文名>');
        process.exit(1);
    }
    const targetDir = path.join(SPECS_DIR, slug);
    if (!fs.existsSync(TEMPLATE_DIR)) {
        console.error(`[init-spec-module] 错误：模板目录不存在：${TEMPLATE_DIR}`);
        process.exit(1);
    }
    if (fs.existsSync(targetDir)) {
        console.warn(`[init-spec-module] 目标目录已存在，跳过复制（幂等）：${targetDir}`);
    } else {
        fs.mkdirSync(targetDir, { recursive: true });
        for (const file of walk(TEMPLATE_DIR)) {
            const rel = path.relative(TEMPLATE_DIR, file);
            const dest = path.join(targetDir, rel);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            let content = fs.readFileSync(file, 'utf8');
            content = content.replace(/（请替换为中文名称）/g, cnName);
            fs.writeFileSync(dest, content);
            console.log(`[init-spec-module] 创建：${path.relative(SPECS_DIR, dest)}`);
        }
    }
    console.log('[init-spec-module] ✅ 完成');
}

try {
    main();
} catch (err) {
    console.error('[init-spec-module] ❌ 异常：', err.message);
    process.exit(1);
}
