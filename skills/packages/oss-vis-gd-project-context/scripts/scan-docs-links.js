#!/usr/bin/env node
/**
 * scripts/scan-docs-links.js
 *
 * 作用：扫描 docs/ 下的 markdown 链接，输出 cross-reference graph，并验证 D-12 规则。
 * 用法：
 *   node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js                       # 仅验证（默认）
 *   node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js --validate            # 同上
 *   node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js --graph               # 输出 mermaid graph
 *   node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js --graph-md <path>    # 输出到指定路径
 *   node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js --json <path>         # 输出 JSON
 *   node .trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js --help               # 帮助
 *
 * 行为：
 *   1. 扫描 docs/**.md 下的所有 [text](href) 链接
 *   2. 验证 D-12（链接不得含 .trae / .local-docs）—— 违规直接 exit 1
 *   3. 检测死链（href 是相对路径且目标不存在）—— 警告但不退出
 *   4. 统计每个文件的链出 / 链入数
 *   5. 输出 markdown 表格（默认 stdout）
 *   6. 可选输出 mermaid flowchart + JSON
 *
 * 依赖：仅 Node.js 内置（fs / path）
 * 幂等：是（不修改 docs/，仅读）
 */
const fs = require('fs');
const path = require('path');

// ─── 路径常量 ────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const DOCS_ROOT = path.join(PROJECT_ROOT, 'docs');
const OUTPUT_DIR = path.resolve(__dirname, '../docs-link');

// ─── 工具函数 ────────────────────────────────────────────────
function walk(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, acc);
        else if (entry.name.endsWith('.md')) acc.push(full);
    }
    return acc;
}

function toRel(absPath) {
    return path.relative(DOCS_ROOT, absPath).split(path.sep).join('/');
}

function extractLinks(mdFile) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const rel = toRel(mdFile);
    const links = [];
    // 匹配 [text](href) 不含代码块（粗略）：行内 / 引用式只处理行内
    const re = /(?<!`)\[([^\]]+)\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(content)) !== null) {
        const [, text, href] = m;
        // 分类
        let kind = 'unknown';
        if (href.startsWith('./') || href.startsWith('../')) kind = 'relative';
        else if (href.startsWith('http://') || href.startsWith('https://')) kind = 'http';
        else if (href.startsWith('mailto:')) kind = 'mailto';
        else if (href.startsWith('/')) kind = 'absolute';
        else if (href.includes('.trae') || href.includes('.local-docs')) kind = 'forbidden';
        // 锚点剥离
        const [hrefNoAnchor, anchor] = href.split('#');
        links.push({ from: rel, text, href, hrefNoAnchor, anchor, kind });
    }
    return links;
}

function resolveTarget(relFrom, hrefNoAnchor) {
    if (!hrefNoAnchor.startsWith('./') && !hrefNoAnchor.startsWith('../')) return null;
    const fromDir = path.dirname(path.join(DOCS_ROOT, relFrom));
    return path.resolve(fromDir, hrefNoAnchor);
}

// ─── 验证 D-12 ───────────────────────────────────────────────
function validateD12(links) {
    const violations = links.filter((l) => l.kind === 'forbidden');
    return violations;
}

// ─── 检测死链 ─────────────────────────────────────────────────
function detectDeadLinks(links) {
    const dead = [];
    for (const link of links) {
        if (link.kind !== 'relative') continue;
        const target = resolveTarget(link.from, link.hrefNoAnchor);
        if (target && !fs.existsSync(target)) {
            dead.push({ from: link.from, href: link.href, target });
        }
    }
    return dead;
}

// ─── 统计链出 / 链入 ─────────────────────────────────────────
function buildStats(files, links) {
    const outBy = {};
    const inBy = {};
    for (const f of files) {
        const rel = toRel(f);
        outBy[rel] = 0;
        inBy[rel] = 0;
    }
    for (const link of links) {
        if (link.kind === 'http' || link.kind === 'mailto') continue;
        outBy[link.from] = (outBy[link.from] || 0) + 1;
        // 解析目标
        if (link.kind === 'relative') {
            const target = resolveTarget(link.from, link.hrefNoAnchor);
            if (target && target.endsWith('.md')) {
                const targetRel = toRel(target);
                inBy[targetRel] = (inBy[targetRel] || 0) + 1;
            }
        }
    }
    return { outBy, inBy };
}

// ─── 输出 Markdown 表格 ──────────────────────────────────────
function renderMarkdownTable(files, links, violations, dead, stats) {
    const lines = [];
    lines.push('# docs/ 链接扫描结果');
    lines.push('');
    lines.push(`> 扫描时间：${new Date().toISOString()}`);
    lines.push(`> 扫描根目录：\`docs/\`（共 ${files.length} 个 .md 文件）`);
    lines.push(`> 链接总数：${links.length}`);
    lines.push('');

    lines.push('## 1. D-12 验证');
    lines.push('');
    if (violations.length === 0) {
        lines.push('✅ **通过**：未发现 `.trae` / `.local-docs` 引用。');
    } else {
        lines.push('❌ **违规**（发现 ' + violations.length + ' 处）：');
        lines.push('');
        lines.push('| 源文件 | 违规链接 |');
        lines.push('| --- | --- |');
        for (const v of violations) {
            lines.push(`| \`${v.from}\` | \`${v.href}\` |`);
        }
    }
    lines.push('');

    lines.push('## 2. 死链检测');
    lines.push('');
    if (dead.length === 0) {
        lines.push('✅ **通过**：未发现死链。');
    } else {
        lines.push('⚠️ **警告**（发现 ' + dead.length + ' 处死链）：');
        lines.push('');
        lines.push('| 源文件 | 死链 | 目标 |');
        lines.push('| --- | --- | --- |');
        for (const d of dead) {
            lines.push(`| \`${d.from}\` | \`${d.href}\` | \`${path.relative(PROJECT_ROOT, d.target)}\` |`);
        }
    }
    lines.push('');

    lines.push('## 3. 链出 / 链入 Top 10');
    lines.push('');
    const outEntries = Object.entries(stats.outBy).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const inEntries = Object.entries(stats.inBy).sort((a, b) => b[1] - a[1]).slice(0, 10);
    lines.push('### 链出 Top 10');
    lines.push('');
    lines.push('| 文档 | 链出数 |');
    lines.push('| --- | --- |');
    for (const [doc, count] of outEntries) {
        lines.push(`| \`${doc}\` | ${count} |`);
    }
    lines.push('');
    lines.push('### 链入 Top 10');
    lines.push('');
    lines.push('| 文档 | 链入数 |');
    lines.push('| --- | --- |');
    for (const [doc, count] of inEntries) {
        lines.push(`| \`${doc}\` | ${count} |`);
    }
    lines.push('');

    lines.push('## 4. 链接类型分布');
    lines.push('');
    const byKind = {};
    for (const l of links) byKind[l.kind] = (byKind[l.kind] || 0) + 1;
    lines.push('| 类型 | 数量 |');
    lines.push('| --- | --- |');
    for (const [kind, count] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
        lines.push(`| ${kind} | ${count} |`);
    }
    lines.push('');

    return lines.join('\n');
}

// ─── 输出 Mermaid Graph ──────────────────────────────────────
function renderMermaid(files, links) {
    const lines = ['```mermaid', 'flowchart LR'];
    // 仅 output relative 链接（docs/ 内部）
    const nodeIds = new Map();
    let nextId = 0;
    function idOf(rel) {
        if (!nodeIds.has(rel)) nodeIds.set(rel, 'n' + (nextId++));
        return nodeIds.get(rel);
    }
    const seen = new Set();
    for (const link of links) {
        if (link.kind !== 'relative') continue;
        const target = resolveTarget(link.from, link.hrefNoAnchor);
        if (!target || !target.endsWith('.md')) continue;
        const fromRel = link.from;
        const toRel = toRel(target);
        if (fromRel === toRel) continue;
        const edge = idOf(fromRel) + ' --> ' + idOf(toRel);
        if (seen.has(edge)) continue;
        seen.add(edge);
        lines.push(`  ${edge}`);
    }
    // 节点标签（仅出现过的）
    const allFiles = files.map(toRel);
    for (const rel of [...nodeIds.keys()].sort()) {
        const nid = nodeIds.get(rel);
        const label = rel.replace(/'/g, ' ');
        lines.push(`  ${nid}["�� ${label}"]`);
    }
    lines.push('```');
    lines.push('');
    lines.push(`> 节点：${nodeIds.size}，边：${seen.size}`);
    return lines.join('\n');
}

// ─── 输出 JSON ───────────────────────────────────────────────
function renderJson(files, links, violations, dead, stats) {
    return JSON.stringify(
        {
            scannedAt: new Date().toISOString(),
            docsRoot: path.relative(PROJECT_ROOT, DOCS_ROOT),
            fileCount: files.length,
            linkCount: links.length,
            violations: violations.map((v) => ({ from: v.from, href: v.href })),
            deadLinks: dead.map((d) => ({ from: d.from, href: d.href, target: path.relative(PROJECT_ROOT, d.target) })),
            stats,
            links: links.map((l) => ({ from: l.from, href: l.href, kind: l.kind })),
        },
        null,
        2
    );
}

// ─── 主函数 ──────────────────────────────────────────────────
function main() {
    const args = process.argv.slice(2);
    const showHelp = args.includes('--help') || args.includes('-h');
    const wantGraph = args.includes('--graph');
    const wantJson = args.includes('--json');
    const wantValidate = args.includes('--validate') || (!wantGraph && !wantJson);

    if (showHelp) {
        console.log('用法：');
        console.log('  node scan-docs-links.js [--validate] [--graph] [--json <path>]');
        console.log('');
        console.log('选项：');
        console.log('  --validate          仅验证（D-12 + 死链检测），输出到 stdout（默认）');
        console.log('  --graph             输出 mermaid graph 到 stdout');
        console.log('  --json [path]       输出 JSON 到 stdout 或指定路径');
        console.log('  --help / -h         显示帮助');
        process.exit(0);
    }

    console.log('[scan-docs-links] �� 扫描 docs/ ...');
    const files = walk(DOCS_ROOT);
    console.log(`[scan-docs-links] ✅ 找到 ${files.length} 个 .md 文件`);

    const allLinks = [];
    for (const file of files) {
        const links = extractLinks(file);
        allLinks.push(...links);
    }
    console.log(`[scan-docs-links] ✅ 提取 ${allLinks.length} 条链接`);

    const violations = validateD12(allLinks);
    const dead = detectDeadLinks(allLinks);
    const stats = buildStats(files, allLinks);

    if (violations.length > 0) {
        console.error(`[scan-docs-links] ❌ D-12 违规：${violations.length} 处`);
        for (const v of violations) {
            console.error(`  ❌ ${v.from} → ${v.href}`);
        }
        process.exit(1);
    }

    if (dead.length > 0) {
        console.warn(`[scan-docs-links] ⚠️ 死链：${dead.length} 处`);
        for (const d of dead) {
            console.warn(`  ⚠️ ${d.from} → ${d.href} (→ ${path.relative(PROJECT_ROOT, d.target)})`);
        }
    }

    if (wantValidate) {
        const md = renderMarkdownTable(files, allLinks, violations, dead, stats);
        console.log('');
        console.log(md);
    }

    if (wantGraph) {
        const mermaid = renderMermaid(files, allLinks);
        console.log('');
        console.log(mermaid);
    }

    if (wantJson) {
        const jsonIdx = args.indexOf('--json');
        const jsonPath = args[jsonIdx + 1];
        const json = renderJson(files, allLinks, violations, dead, stats);
        if (jsonPath && !jsonPath.startsWith('--')) {
            const absPath = path.resolve(PROJECT_ROOT, jsonPath);
            fs.writeFileSync(absPath, json, 'utf8');
            console.log(`[scan-docs-links] ✅ JSON 已写入：${path.relative(PROJECT_ROOT, absPath)}`);
        } else {
            console.log('');
            console.log(json);
        }
    }

    console.log('');
    console.log('[scan-docs-links] [done] complete');
    if (violations.length === 0 && dead.length === 0) {
        console.log('[scan-docs-links] [info] all checks passed');
    }
}

try {
    main();
} catch (err) {
    console.error('[scan-docs-links] [error] exception:', err.message);
    console.error(err.stack);
    process.exit(1);
}