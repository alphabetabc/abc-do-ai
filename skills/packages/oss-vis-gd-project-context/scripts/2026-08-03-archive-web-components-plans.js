#!/usr/bin/env node
/**
 * 2026-08-03-archive-web-components-plans.js
 *
 * 目的：把 6 个 plan-005 ~ 010（web/components 视图基础设施文档化）从
 *       `.trae/skills/oss-vis-gd-project-context/plans/` 移到 `.trae/skills/oss-vis-gd-project-context/plans/done/`
 *
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/2026-08-03-archive-web-components-plans.js
 *
 * 设计：幂等（已归档则跳过）；只移动文件名前缀为 `2026-08-03-00[5-9]|010-` 的 6 个；
 *       完成后打印：移动 N 个 / 跳过 M 个 / 异常 0
 */

const fs = require('fs');
const path = require('path');

const PLAN_DIR = path.resolve(__dirname, '..', 'plans');
const DONE_DIR = path.resolve(PLAN_DIR, 'done');

const TARGETS = [
    '2026-08-03-005-plan-web-components-docs.md',
    '2026-08-03-006-plan-app-bootstrap-and-data-scheme.md',
    '2026-08-03-007-plan-large-screen-engine.md',
    '2026-08-03-008-plan-screen-control-socket.md',
    '2026-08-03-009-plan-component-library.md',
    '2026-08-03-010-plan-stale-fixes-and-roadmap-sync.md',
];

function main() {
    if (!fs.existsSync(DONE_DIR)) {
        fs.mkdirSync(DONE_DIR, { recursive: true });
    }

    let moved = 0;
    let skipped = 0;
    let failed = 0;

    for (const name of TARGETS) {
        const src = path.join(PLAN_DIR, name);
        const dest = path.join(DONE_DIR, name);

        try {
            if (!fs.existsSync(src)) {
                if (fs.existsSync(dest)) {
                    console.log(`[skip] already archived: ${name}`);
                    skipped++;
                } else {
                    console.error(`[fail] missing source file: ${name}`);
                    failed++;
                }
                continue;
            }
            fs.renameSync(src, dest);
            console.log(`[move] ${name}`);
            moved++;
        } catch (err) {
            console.error(`[fail] ${name}: ${err.message}`);
            failed++;
        }
    }

    console.log(`--- summary ---  moved=${moved}  skipped=${skipped}  failed=${failed}`);

    if (failed > 0) {
        process.exit(1);
    }
}

try {
    main();
} catch (err) {
    console.error('[fatal] unexpected:', err.message);
    process.exit(1);
}
