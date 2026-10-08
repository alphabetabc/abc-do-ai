#!/usr/bin/env node
/**
 * scripts/fix-rule4-paths.js
 *
 * 作用：按 .trae/rules/docs-authoring-rules.md Rule 4 (D-14) 把 docs/ 下的不合规链接统一转为
 *       仓库根相对路径 + 反引号包裹的 plain text code 形式。
 *
 *       ✅ 输入（合规前）：[cmd-dispatcher-center.ts:24-27](../../../web/environment/five-major-center/cmd-dispatcher-center.ts#L24-L27)
 *       ✅ 输出（合规后）：`web/environment/five-major-center/cmd-dispatcher-center.ts#L24-L27`
 *
 * 规则（来自 docs-authoring-rules.md Rule 4）：
 *   1. markdown 链接 [text](path) 中的 path 是仓库内相对路径：转仓库根相对 + 反引号包裹（抛弃 link 形式）
 *   2. 仓库根相对路径必须以 web/ / docs/ / src/ / public/ / config.ts / package.json 等仓库根路径开头
 *   3. 跳过外部链接 http(s)://
 *   4. 跳过纯锚点 #section-name
 *   5. 跳过 markdown 图片 ![alt](path)（不在 Rule 4 范围）
 *   6. 跳过不在仓库内的相对路径（如指向已删除文件夹的路径仍尝试解析；解析失败保留原文 + ⚠️ 标记）
 *
 * 用法：node .trae/skills/oss-vis-gd-project-context/scripts/fix-rule4-paths.js [--dry-run] [--target <file>]
 *   --dry-run    只统计，不写盘
 *   --target     只处理单个文件（相对 docs/ 的相对路径），便于调试
 *
 * 依赖：仅 Node.js 内置（fs / path）
 * 幂等：是（运行第二次没有任何替换）
 *
 * 输出：每文件命中计数 + 替换前后样例（样例 ≤ 5 行）
 */
const fs = require('fs');
const path = require('path');

// ─── 配置 ─────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const DOCS_ROOT = path.join(PROJECT_ROOT, 'docs');

// 仓库根相对路径允许的前缀（路径转换后必须以这些开头）
const ALLOWED_PREFIXES = [
    'web/',
    'docs/',
    'src/',
    'public/',
    'docs-api-backend/', // Rule 1 明确允许
    'config.ts',
    'package.json',
    'tsconfig.json',
    'pnpm-lock.yaml',
    'bootstrap.js', // midway 启动入口
    'pm2.config.js', // 进程配置
    '.editorconfig',
    '.eslintrc',
    '.prettierrc',
    'README.md',
    'AGENTS.md',
];

// 不处理的 markdown 元素前缀
const SKIP_PATTERNS = [
    /^https?:\/\//i, // 外部链接
    /^mailto:/i, // 邮箱
    /^#/, // 纯锚点
    /^\/{2}/, // protocol-relative //cdn.example.com
    /^data:/i, // data URI
];

// 文件类型白名单（命中即视为仓库内文件）
const EXT_RE = /\.(md|markdown|ts|tsx|js|jsx|json|less|css|scss|sass|html|htm|svg|png|jpg|jpeg|gif|webp|yml|yaml|env|lock|tsx?)$/i;

// ─── 工具 ─────────────────────────────────────────────────
function isAbsoluteExternal(p) {
    return SKIP_PATTERNS.some((re) => re.test(p));
}

function walk(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, acc);
        else if (entry.name.endsWith('.md')) acc.push(full);
    }
    return acc;
}

function toRepoRel(absPath) {
    // 把绝对路径转回仓库根相对
    const rel = path.relative(PROJECT_ROOT, absPath).replace(/\\/g, '/');
    return rel;
}

function isAllowedRepoPath(repoRel) {
    if (!repoRel) return false;
    return ALLOWED_PREFIXES.some((p) => {
        const norm = p.replace(/\/$/, '');
        return repoRel === norm || repoRel.startsWith(p);
    });
}

/**
 * 嵌套反引号检测：inner text 已经是反引号包裹的仓库根相对路径。
 * 此时去 link 化，保留 inner 反引号即可。
 */
function tryNestedBackticks(text, href) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('`') || !trimmed.endsWith('`')) return null;
    const innerPath = trimmed.slice(1, -1).split('#')[0];
    if (!innerPath || !isAllowedRepoPath(innerPath)) return null;
    return trimmed; // 返回值就是去掉 link 的最终形态
}

/**
 * 智能 resolve：作者常多写 `../`，导致 path.resolve 后跳到仓库根之外。
 * 例如 fileDir = docs/design/iframe-pages/（深度 3），href 开头 ../../../../ 实际多打了一层。
 * 这里把超额的 `../` 钳制到 fileDir 的深度。
 */
function smartResolve(fileDir, href) {
    // 计算 fileDir 相对 PROJECT_ROOT 的深度
    const fileRel = path.relative(PROJECT_ROOT, fileDir).replace(/\\/g, '/');
    const fileDepth = fileRel === '' ? 0 : fileRel.split('/').length;

    // 计算 href 开头的 ../
    const segs = href.split('/');
    let upCount = 0;
    while (segs[upCount] === '..') upCount += 1;

    const effectiveUp = Math.min(upCount, fileDepth);
    const rest = segs.slice(upCount).join('/');
    const upPart = effectiveUp === 0 ? '' : '../'.repeat(effectiveUp);
    return path.resolve(fileDir, upPart + rest);
}

// markdown link 正则：兼容 [text](path) 和 ![alt](path) 两种
const MD_LINK_RE = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * 替换单个文件的链接。
 * 返回 { count, samples }：count = 实际替换次数；samples = [{before, after}, ...] 最多 3 条。
 */
function fixFile(fileAbs) {
    let content = fs.readFileSync(fileAbs, 'utf8');
    const fileDir = path.dirname(fileAbs);
    let count = 0;
    const samples = [];

    const updated = content.replace(MD_LINK_RE, (match, bang, text, href) => {
        // 跳过图片（Rule 4 范围外）
        if (bang === '!') return match;

        // 跳过纯锚点 / 外部链接
        if (isAbsoluteExternal(href)) return match;

        // 嵌套反引号：inner text 已是合规反引号路径 → 去 link
        const nested = tryNestedBackticks(text, href);
        if (nested !== null) {
            if (nested !== match) {
                count += 1;
                if (samples.length < 3) {
                    samples.push({ before: match, after: nested });
                }
            }
            return nested;
        }

        // 尝试解析为绝对路径
        let abs;
        try {
            // 处理 url-encoded anchor（如 %E6%95%B0...）
            const decodedHref = decodeURIComponent(href);
            abs = smartResolve(fileDir, decodedHref.split('#')[0]);
        } catch (_) {
            return match;
        }

        // 必须在仓库根之内
        const rel = toRepoRel(abs);
        if (rel.startsWith('..') || !rel || !isAllowedRepoPath(rel)) return match;

        // 必须是允许的仓库内路径前缀
        if (!isAllowedRepoPath(rel)) {
            return match;
        }

        // 还原 link 中的 anchor / 行号（保留到路径末尾）
        let anchor = '';
        const hashIdx = href.indexOf('#');
        if (hashIdx >= 0) anchor = href.substring(hashIdx);

        const newPath = rel + anchor;
        const replacement = `\`${newPath}\``;

        if (replacement !== match) {
            count += 1;
            if (samples.length < 3) {
                samples.push({ before: match, after: replacement });
            }
        }
        return replacement;
    });

    return { updated, count, samples };
}

// ─── 主流程 ───────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = { dryRun: false, target: null };
    for (let i = 0; i < args.length; i += 1) {
        if (args[i] === '--dry-run') opts.dryRun = true;
        else if (args[i] === '--target') {
            opts.target = args[i + 1];
            i += 1;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(
                '用法：node fix-rule4-paths.js [--dry-run] [--target <file-rel-to-docs>]',
            );
            process.exit(0);
        }
    }
    return opts;
}

function main() {
    const opts = parseArgs();
    const files = opts.target
        ? [path.resolve(DOCS_ROOT, opts.target)]
        : walk(DOCS_ROOT);

    if (!fs.existsSync(DOCS_ROOT)) {
        console.error('[fix-rule4-paths] ❌ docs/ 目录不存在：' + DOCS_ROOT);
        process.exit(1);
    }

    let totalFiles = 0;
    let totalReplacements = 0;
    const perFile = [];

    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.warn(`[fix-rule4-paths] ⚠️ 文件不存在：${file}`);
            continue;
        }
        const { updated, count, samples } = fixFile(file);
        if (count > 0) {
            totalFiles += 1;
            totalReplacements += count;
            const rel = path.relative(DOCS_ROOT, file).replace(/\\/g, '/');
            perFile.push({ file: rel, count, samples });
            if (!opts.dryRun) {
                fs.writeFileSync(file, updated, 'utf8');
            }
        }
    }

    // 排序：替换数从高到低
    perFile.sort((a, b) => b.count - a.count);

    console.log(`[fix-rule4-paths] ${opts.dryRun ? '🔍 dry-run' : '✅ 已写盘'} 模式`);
    console.log(`[fix-rule4-paths] 扫描文件：${files.length} 个`);
    console.log(`[fix-rule4-paths] 命中文件：${totalFiles} 个`);
    console.log(`[fix-rule4-paths] 总替换数：${totalReplacements} 处\n`);

    if (perFile.length > 0) {
        console.log('── 命中 Top 20 ──');
        for (const row of perFile.slice(0, 20)) {
            console.log(`  ${row.file.padEnd(60)}  ${row.count} 处`);
        }
        console.log('');
    }

    if (!opts.dryRun && totalReplacements > 0) {
        console.log('[fix-rule4-paths] 💡 建议：');
        console.log('  1. git diff 查看本次变更');
        console.log('  2. grep -rn "file:///e:" docs/   # Rule 4 file:// 应为 0');
        console.log('  3. grep -rn "\\.\\./\\.\\./\\.\\./" docs/   # 3 层以上相对路径应为 0');
        console.log('  4. node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js   # 死链扫描');
    }
}

try {
    main();
} catch (err) {
    console.error('[fix-rule4-paths] ❌ 异常：', err.message);
    process.exit(1);
}
