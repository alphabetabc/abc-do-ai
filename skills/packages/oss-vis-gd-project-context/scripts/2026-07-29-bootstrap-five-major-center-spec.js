#!/usr/bin/env node
/**
 * scripts/2026-07-29-bootstrap-five-major-center-spec.js
 *
 * 作用：plan-003 v2 M-1 步骤 —— 建 `docs/specs/five-major-center/` 子目录 + 拷贝 `_template/` 骨架
 * 用法：node scripts/2026-07-29-bootstrap-five-major-center-spec.js
 *
 * 行为：
 *  1. 在 `docs/specs/five-major-center/` 下创建子目录：pm-inputs/、assets/
 *  2. 从 `docs/specs/_template/` 拷贝 5 个 To-Be 文档（spec.md / plan.md / tasks.md / acceptance-tests.md / data-model-extensions.md）
 *  3. 从 `docs/specs/_template/pm-inputs/` 拷贝 2 个 PM 输入文档（pm-requirements-input.md / code-inventory.md）
 *  4. 占位替换：把模板中的"请替换为中文名称"替换为"五大中心"
 *  5. 写入 assets/README.md 占位
 *
 * 幂等：已存在的目标文件会被覆盖（内容是模板替换后版本）
 *
 * 依赖：Node.js 内置 fs/path
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE_DIR = path.join(PROJECT_ROOT, 'docs', 'specs', '_template');
const TARGET_DIR = path.join(PROJECT_ROOT, 'docs', 'specs', 'five-major-center');
const TARGET_PM_INPUTS = path.join(TARGET_DIR, 'pm-inputs');
const TARGET_ASSETS = path.join(TARGET_DIR, 'assets');

const MODULE_NAME_CN = '五大中心';
const MODULE_NAME_EN = 'five-major-center';
const BASE_ROUTE = '/five-major-center';
const SOURCE_PATH = 'web/pages/five-major-center';

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[mkdir] ${path.relative(PROJECT_ROOT, dir)}`);
    }
}

function copyAndSubstitute(srcPath, dstPath, substitutions) {
    let content = fs.readFileSync(srcPath, 'utf8');
    for (const [from, to] of Object.entries(substitutions)) {
        content = content.split(from).join(to);
    }
    fs.writeFileSync(dstPath, content, 'utf8');
    console.log(`[copy]  ${path.relative(PROJECT_ROOT, srcPath)} → ${path.relative(PROJECT_ROOT, dstPath)}`);
}

function writeAssetsReadme(targetPath) {
    const content = `# 截图与图片资源

> 用途：存放本模块 spec 中引用的截图、示意图、流程图等。

## 命名约定

- \`as-is/<feature>-<date>.png\`：现状截图
- \`spec/<feature>-<date>.png\`：To-Be 设计图
- \`diff/<feature>-<date>.png\`：As-Is vs To-Be 对比

## 当前状态

> ⚠️ **待补充**：本模块首批截图将在 plan-003 v2 阶段 2（写 spec.md）期间补齐。
`;
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log(`[write] ${path.relative(PROJECT_ROOT, targetPath)}`);
}

function main() {
    console.log(`[bootstrap] PROJECT_ROOT = ${PROJECT_ROOT}`);
    console.log(`[bootstrap] TARGET_MODULE  = ${MODULE_NAME_EN} (${MODULE_NAME_CN})`);

    // 1. 创建子目录
    ensureDir(TARGET_DIR);
    ensureDir(TARGET_PM_INPUTS);
    ensureDir(TARGET_ASSETS);

    // 2. 全局占位替换映射（应用到所有模板文件）
    const substitutions = {
        '（请替换为中文名称）': MODULE_NAME_CN,
        '/path/to/feature': BASE_ROUTE,
        'src/views/fault-report/**': `${SOURCE_PATH}/**`,
    };

    // 3. 拷贝 5 个 To-Be 文档
    const toBeFiles = ['spec.md', 'plan.md', 'tasks.md', 'acceptance-tests.md', 'data-model-extensions.md'];
    for (const file of toBeFiles) {
        const src = path.join(TEMPLATE_DIR, file);
        const dst = path.join(TARGET_DIR, file);
        if (!fs.existsSync(src)) {
            console.error(`[error] 模板文件不存在: ${path.relative(PROJECT_ROOT, src)}`);
            process.exit(1);
        }
        copyAndSubstitute(src, dst, substitutions);
    }

    // 4. 拷贝 2 个 PM 输入文档
    const pmInputFiles = ['pm-requirements-input.md', 'code-inventory.md'];
    for (const file of pmInputFiles) {
        const src = path.join(TEMPLATE_DIR, 'pm-inputs', file);
        const dst = path.join(TARGET_PM_INPUTS, file);
        if (!fs.existsSync(src)) {
            console.error(`[error] 模板文件不存在: ${path.relative(PROJECT_ROOT, src)}`);
            process.exit(1);
        }
        copyAndSubstitute(src, dst, substitutions);
    }

    // 5. 写 assets/README.md
    writeAssetsReadme(path.join(TARGET_ASSETS, 'README.md'));

    console.log('\n[bootstrap] ✅ 全部完成');
    console.log(`[bootstrap] 下一步：人工填写 as-is-architecture.md（M-2）+ 重写 code-inventory.md（M-3）`);
}

try {
    main();
} catch (err) {
    console.error('[bootstrap] ❌ 异常：', err.message);
    process.exit(1);
}
