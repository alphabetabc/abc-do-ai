#!/usr/bin/env node
// fix-tables.mjs
// 作用：修复 markdown 表格的列错位 / 未转义 `|` / 行尾大量空白 padding 问题。
//
// 典型症状（roadmap / plan 类文档常见）：
//   - cell 内出现裸 `|` 字符（regex `\.trae/|agents\.md|\.local-`、
//     集合 `{MAP|SUMMARY|CHANNELS}`、类型联合 `'local'|'beijing'`），
//     markdown 表格语法要求转义为 `\|`，否则破坏列结构。
//   - 每格尾部拖 ~1000 字符的空白 padding，导致行宽度爆炸、diff 噪音。
//
// 修复策略：
//   1. splitCells 时保留 `\|` 转义（避免误切）。
//   2. 行宽 mismatch 时，把多余 cell 合并到 col 2（最长的描述列），用 `\|` 拼接。
//   3. 每格尾部空白 trim 掉；行间空行保留。
//   4. 不修改代码块（```...```）和 inline code（`...`）内的 `|`。
//
// 用法：
//   node fix-tables.mjs <files...>           修改指定文件（默认 --fix）
//   node fix-tables.mjs --check <files...>   仅检查并报告，不修改
//   node fix-tables.mjs --dry-run <files...> 打印变更但不写文件
//
// 选项：
//   --no-backup   修复时跳过 .bak 备份（默认生成 <file>.bak）
//
// 注意：
//   - 不修改代码块 / inline code 内的 `|`。
//   - 合并多余 cell 时假设 col 2 是最长的描述列；如果你的表格 col 2 不是描述列，
//     请先用 --check 看一下输出，手动调整。
//   - 幂等：重复执行结果稳定（合规表格不再被二次修改）。

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- helpers ----

function log(...args) {
    console.log("[fix-tables]", ...args);
}

function logErr(...args) {
    console.error("[fix-tables][ERROR]", ...args);
}

// 保护 fenced code block（```...```）避免内部 `|` 被误伤
// 注意：不保护 inline code（`...`），因为 markdown 表格语法上
// 反引号内的 `|` 仍然算 cell 分隔符，需要转义为 `\|`。
function escapeCodeBlocks(content) {
    const blocks = [];
    const placeholders = [];

    content = content.replace(/```[\s\S]*?```/g, (m) => {
        const idx = blocks.length;
        blocks.push(m);
        const p = `__CODE_BLOCK_${idx}__`;
        placeholders.push(p);
        return p;
    });

    return {
        content,
        restore: (s) => {
            let out = s;
            placeholders.forEach((p, i) => {
                out = out.split(p).join(blocks[i]);
            });
            return out;
        },
    };
}

// 把一行表格行切成 cell 数组，保留 `\|` 转义
function splitCells(row) {
    const cells = [];
    let cur = "";
    let i = 0;
    while (i < row.length && row[i] !== "|") i++;
    if (i < row.length) i++;
    while (i < row.length) {
        if (row[i] === "\\" && row[i + 1] === "|") {
            cur += "\\|";
            i += 2;
        } else if (row[i] === "|") {
            cells.push(cur);
            cur = "";
            i++;
        } else {
            cur += row[i];
            i++;
        }
    }
    return cells;
}

// 把多余 cell 合并到 col 2（描述列），转义为 `\|`
function reconcileCells(cells, expected) {
    if (cells.length <= expected) {
        while (cells.length < expected) cells.push("");
        return cells;
    }
    const out = [cells[0]];
    const middleEnd = cells.length - expected + 2;
    const middle = cells.slice(1, middleEnd);
    out.push(middle.join(" \\| "));
    const remaining = cells.slice(middleEnd);
    out.push(...remaining);
    return out;
}

function isSeparatorRow(row) {
    const trimmed = row.trim();
    return /^\|[\s\-:|]+\|$/.test(trimmed) || /^\|(\s*:?-+:?\s*\|)+$/.test(trimmed);
}

function isTableRow(row) {
    return row.trimStart().startsWith("|");
}

// 修复单个表格区域（从 header 行开始到非 `|` 行结束）
// 返回 { rows, changed, issue }：
//   - changed: 行内容有变（无论是列错位修复还是 padding trim）
//   - issue: 真列错位描述（cell 数不匹配）；null 表示只是 padding 问题
function rebuildTable(rows) {
    if (rows.length === 0) return { rows, changed: false, issue: null };
    const expectedCols = splitCells(rows[0]).length;
    const out = [];
    let changed = false;
    let issue = null;

    for (const r of rows) {
        if (isSeparatorRow(r)) {
            const sep = [];
            for (let i = 0; i < expectedCols; i++) sep.push("---");
            const rebuilt = "| " + sep.join(" | ") + " |";
            if (rebuilt !== r) changed = true;
            out.push(rebuilt);
            continue;
        }
        const cells = splitCells(r);
        if (cells.length !== expectedCols) {
            issue = `行 cell 数 ${cells.length} ≠ 表头 ${expectedCols}`;
            const reconciled = reconcileCells(cells, expectedCols);
            const cleaned = reconciled.map((c) => c.replace(/\s+/g, " ").trim());
            while (cleaned.length < expectedCols) cleaned.push("");
            const rebuilt = "| " + cleaned.join(" | ") + " |";
            if (rebuilt !== r) changed = true;
            out.push(rebuilt);
        } else {
            const cleaned = cells.map((c) => c.replace(/\s+/g, " ").trim());
            while (cleaned.length < expectedCols) cleaned.push("");
            const rebuilt = "| " + cleaned.join(" | ") + " |";
            if (rebuilt !== r) changed = true;
            out.push(rebuilt);
        }
    }
    return { rows: out, changed, issue };
}

function processContent(content) {
    const { content: protectedContent, restore } = escapeCodeBlocks(content);
    const lines = protectedContent.split(/\r?\n/);
    const out = [];
    let inTable = false;
    let tableRows = [];
    let tableIssueCount = 0;
    let tablePaddingCount = 0;
    let tableChecked = 0;
    let mismatchReport = [];
    let paddingReport = [];

    let tableStartLine = 0;
    for (const line of lines) {
        if (isTableRow(line)) {
            if (!inTable) {
                inTable = true;
                tableStartLine = out.length + 1;
                tableRows = [];
            }
            tableRows.push(line);
        } else {
            if (inTable) {
                tableChecked++;
                const { rows, changed, issue } = rebuildTable(tableRows);
                if (issue) {
                    tableIssueCount++;
                    mismatchReport.push({ lineStart: tableStartLine, rows: rows.length, reason: issue });
                } else if (changed) {
                    tablePaddingCount++;
                    paddingReport.push({ lineStart: tableStartLine, rows: rows.length });
                }
                for (const r of rows) out.push(r);
                inTable = false;
                tableRows = [];
            }
            out.push(line);
        }
    }
    if (inTable && tableRows.length > 0) {
        tableChecked++;
        const { rows, changed, issue } = rebuildTable(tableRows);
        if (issue) {
            tableIssueCount++;
            mismatchReport.push({ lineStart: tableStartLine, rows: rows.length, reason: issue });
        } else if (changed) {
            tablePaddingCount++;
            paddingReport.push({ lineStart: tableStartLine, rows: rows.length });
        }
        for (const r of rows) out.push(r);
    }

    return {
        content: restore(out.join("\n")),
        tableChecked,
        tableIssueCount,
        tablePaddingCount,
        mismatchReport,
        paddingReport,
    };
}

// ---- CLI ----

function parseArgs(argv) {
    const opts = { mode: "fix", noBackup: false, files: [] };
    for (const arg of argv.slice(2)) {
        if (arg === "--check") opts.mode = "check";
        else if (arg === "--fix") opts.mode = "fix";
        else if (arg === "--dry-run") opts.mode = "dry-run";
        else if (arg === "--no-backup") opts.noBackup = true;
        else if (arg === "--help" || arg === "-h") {
            console.log(`Usage: node fix-tables.mjs [--check|--fix|--dry-run] [--no-backup] <files...>

Modes:
  --check       only report issues, don't modify
  --fix         modify files in place (default)
  --dry-run     print diffs but don't write

Options:
  --no-backup   skip writing <file>.bak before modifying (default: write backup)

Examples:
  node fix-tables.mjs docs/specs/foo/spec.md
  node fix-tables.mjs --check docs/**/*.md
  node fix-tables.mjs --dry-run roadmap.md`);
            process.exit(0);
        } else if (!arg.startsWith("--")) {
            opts.files.push(arg);
        }
    }
    return opts;
}

async function processFile(file, opts) {
    const absPath = path.resolve(file);
    let original;
    try {
        original = await fs.readFile(absPath, "utf8");
    } catch (e) {
        logErr(`无法读取 ${absPath}: ${e.message}`);
        return { ok: false, error: e.message };
    }

    const { content, tableChecked, tableIssueCount, tablePaddingCount, mismatchReport, paddingReport } = processContent(original);

    if (tableIssueCount === 0 && tablePaddingCount === 0) {
        log(`✓ ${file}: ${tableChecked} 张表格全部合规（无需修改）`);
        return { ok: true, tableChecked, tableIssueCount, tablePaddingCount, mismatchReport, paddingReport, modified: false };
    }

    if (opts.mode === "check") {
        if (tableIssueCount > 0) {
            log(`✗ ${file}: ${tableChecked} 张表格中 ${tableIssueCount} 张有列错位`);
            mismatchReport.forEach((m) => {
                log(`    L${m.lineStart} 起：${m.reason}`);
            });
        }
        if (tablePaddingCount > 0) {
            log(`~ ${file}: ${tablePaddingCount} 张表格有 padding 待 trim（不影响结构）`);
            paddingReport.forEach((m) => {
                log(`    L${m.lineStart} 起`);
            });
        }
        return { ok: tableIssueCount === 0, tableChecked, tableIssueCount, tablePaddingCount, mismatchReport, paddingReport, modified: false };
    }

    if (opts.mode === "dry-run") {
        if (tableIssueCount > 0) {
            log(`[DRY-RUN] ${file}: ${tableIssueCount} 张表格列错位待修`);
            mismatchReport.forEach((m) => {
                log(`    L${m.lineStart} 起：${m.reason}`);
            });
        }
        if (tablePaddingCount > 0) {
            log(`[DRY-RUN] ${file}: ${tablePaddingCount} 张表格 padding 待 trim`);
        }
        return { ok: true, tableChecked, tableIssueCount, tablePaddingCount, mismatchReport, paddingReport, modified: false };
    }

    // --fix：先备份
    if (!opts.noBackup) {
        const backupPath = absPath + ".bak";
        try {
            await fs.copyFile(absPath, backupPath);
            log(`  备份: ${backupPath}`);
        } catch (e) {
            logErr(`备份失败 ${backupPath}: ${e.message}`);
            return { ok: false, error: e.message };
        }
    }

    await fs.writeFile(absPath, content, "utf8");
    log(`✓ ${file}: 已修复（${tableIssueCount} 列错位 + ${tablePaddingCount} padding trim）/ ${tableChecked} 张表格`);
    mismatchReport.forEach((m) => {
        log(`    L${m.lineStart} 起：${m.reason}`);
    });
    return { ok: true, tableChecked, tableIssueCount, tablePaddingCount, mismatchReport, paddingReport, modified: true };
}

async function main() {
    const opts = parseArgs(process.argv);

    if (opts.files.length === 0) {
        logErr("请指定至少一个 markdown 文件");
        logErr("用法: node fix-tables.mjs [--check|--fix|--dry-run] <files...>");
        process.exit(1);
    }

    let totalChecked = 0,
        totalIssueCount = 0,
        totalPaddingCount = 0,
        totalModified = 0,
        failCount = 0;

    for (const file of opts.files) {
        const r = await processFile(file, opts);
        totalChecked += r.tableChecked || 0;
        totalIssueCount += r.tableIssueCount || 0;
        totalPaddingCount += r.tablePaddingCount || 0;
        if (r.modified) totalModified++;
        if (!r.ok) failCount++;
    }

    log("");
    log(
        `汇总: ${opts.files.length} 文件 / ${totalChecked} 表格 / ${totalIssueCount} 列错位 / ${totalPaddingCount} padding / ${totalModified} 已改 / ${failCount} 失败`,
    );

    if (opts.mode === "check" && totalIssueCount > 0) {
        process.exit(1);
    }
}

main().catch((e) => {
    logErr(e.stack || e.message);
    process.exit(1);
});
