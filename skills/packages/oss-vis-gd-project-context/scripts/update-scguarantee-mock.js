#!/usr/bin/env node
/**
 * scripts/update-scguarantee-mock.js
 * 作用：解析 apec-sz-response.txt（多个「接口NN + JSON」块），按 viewItemId 匹配
 *       public/static/mock/shenzhen-communication-guarantee/ 下的 mock 文件并覆盖更新。
 * 输出格式与既有 mock 一致：{ code, message, data }（去除 clientRequestId / serverUsingTimeMS 等易变字段）。
 * 用法：node update-scguarantee-mock.js
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
// 用法：node update-scguarantee-mock.js [源txt文件名或绝对路径]（默认 apec-sz-response.txt）
const sourceArg = process.argv[2] || 'apec-sz-response.txt';
const SOURCE = path.isAbsolute(sourceArg)
    ? sourceArg
    : path.resolve(
          REPO_ROOT,
          `.local-data/config_applications_cloud.view.server-gcss_1.0.0_views_fifteen-games/${sourceArg}`
      );
const MOCK_DIR = path.resolve(
    REPO_ROOT,
    'public/static/mock/shenzhen-communication-guarantee'
);

function main() {
    console.log(`[update-scguarantee-mock] 源文件：${SOURCE}`);
    const text = fs.readFileSync(SOURCE, 'utf-8');

    // 拆分「接口NN」块
    const blocks = text.split(/^接口\d+\s*$/m).map((s) => s.trim()).filter(Boolean);
    if (!blocks.length) {
        console.error('[update-scguarantee-mock] ❌ 未找到任何接口块');
        process.exit(1);
    }

    // 解析各块 JSON
    const responses = [];
    blocks.forEach((block, i) => {
        try {
            responses.push(JSON.parse(block));
        } catch (err) {
            // 非 JSON 块（如「纯静态，暂无数据」说明）跳过
            console.warn(`[update-scguarantee-mock] ⚠️ 第 ${i + 1} 块非 JSON，跳过：${block.slice(0, 40)}`);
        }
    });
    console.log(`[update-scguarantee-mock] 解析到 ${responses.length} 个接口响应`);

    // 建立现有 mock 的 viewItemId → 文件名 映射
    const mockFiles = fs.readdirSync(MOCK_DIR).filter((f) => f.endsWith('.json') && f !== 'readme.md');
    const idToFile = {};
    for (const file of mockFiles) {
        try {
            const json = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, file), 'utf-8'));
            const id = json?.data?.viewItemId;
            if (id) {
                if (idToFile[id]) {
                    console.warn(`[update-scguarantee-mock] ⚠️ viewItemId 重复：${id}（${idToFile[id]} / ${file}）`);
                }
                idToFile[id] = file;
            }
        } catch {
            console.warn(`[update-scguarantee-mock] ⚠️ mock 文件解析失败，跳过：${file}`);
        }
    }

    let updated = 0;
    const unmatched = [];
    for (const res of responses) {
        const id = res?.data?.viewItemId;
        if (!id || !idToFile[id]) {
            unmatched.push(id || '(无 viewItemId)');
            continue;
        }
        const target = path.join(MOCK_DIR, idToFile[id]);
        // 保持既有 mock 输出格式：仅 code / message / data
        const normalized = { code: res.code, message: res.message, data: res.data };
        fs.writeFileSync(target, JSON.stringify(normalized, null, 4) + '\n', 'utf-8');
        console.log(`[update-scguarantee-mock] ✅ 更新 ${idToFile[id]}（viewItemId: ${id}）`);
        updated++;
    }

    console.log(`[update-scguarantee-mock] 完成：更新 ${updated}/${responses.length}`);
    if (unmatched.length) {
        console.log(`[update-scguarantee-mock] 未匹配（保留原 mock）：${unmatched.join(', ')}`);
    }
}

try {
    main();
} catch (err) {
    console.error('[update-scguarantee-mock] ❌ 异常：', err.message);
    process.exit(1);
}
