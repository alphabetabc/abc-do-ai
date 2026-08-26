/* eslint-disable no-console */
/**
 * 生成 history-timeline.json mock（task006 §11.11.2）—— v3
 *
 * 变更（2026-08-26）：
 *   - status 恒为 1
 *   - 节点（无 subType）按 idx 线性增长（0% → 100%）
 *   - 资源（有 subType）按"应急调度时序"分阶段到位：
 *       emergency-vehicle  →  [idx 0,  idx 10]   最先到位
 *       repair-vehicle     →  [idx 3,  idx 18]
 *       generator          →  [idx 5,  idx 20]
 *       sat-bag            →  [idx 7,  idx 23]
 *       wireless-team      →  [idx 10, idx 23]
 *       transmission-team  →  [idx 14, idx 23]   最后到位
 *   - idx=23 的 markers 与 map-markers.json 对应 layer 完全一致（坐标 / subType / category / status）
 *   - 与 TimelineHistory 联动的 isHistoryActive = currentTimeIndex !== max 配合：
 *       idx=max → map-markers.json（实时，含全部 6 类资源）
 *       idx<max → history-timeline.json[idx]（按上表逐步到位）
 *
 * ⚠️ 业务时序为示意性 mock（PM 未提供历史资源到位时序，仅给定 L4 street 完整快照）。
 *    若后续 PM 提供真实的资源时序数据，需替换本脚本中的 SUBTYPE_PHASE 表。
 *
 * 数据来源：public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json
 *          中的 city / company / district 三个 layer 的 markers（含 6 类资源 + 节点）。
 *
 * 用法：
 *   node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-history-timeline-mock.cjs
 *
 * 输出：
 *   public/static/mock/bj-cmcc-cmd-dispatcher/history-timeline.json
 */
const fs = require('fs');
const path = require('path');

const TIME_COUNT = 24;

// ---------- 资源 subType 到场时序（单位：timeline idx，0~23）----------
// 含义：在 [start, end] 区间内，资源从 0% 线性增长到 100%；
//       idx < start → 0%；idx >= end → 100%。
const SUBTYPE_PHASE = {
    'emergency-vehicle': [0, 10],
    'repair-vehicle': [3, 18],
    generator: [5, 20],
    'sat-bag': [7, 23],
    'wireless-team': [10, 23],
    'transmission-team': [14, 23],
};

// 节点（无 subType）的最小可见比例：idx=0 时起手可见；idx=23 时 100%
const NODE_FRACTION_START = 0.3;
const NODE_FRACTION_END = 1.0;

// ---------- 输入：map-markers.json ----------
const MARKERS_JSON_PATH = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'public',
    'static',
    'mock',
    'bj-cmcc-cmd-dispatcher',
    'map-markers.json',
);
const mapMarkers = JSON.parse(fs.readFileSync(MARKERS_JSON_PATH, 'utf-8'));

// ---------- 24 个时间点：12:35:23 起，每 5min 递增 ----------
function buildTimes() {
    const times = [];
    const base = new Date(Date.UTC(1970, 0, 1, 12, 35, 23));
    for (let i = 0; i < TIME_COUNT; i += 1) {
        const t = new Date(base.getTime() + i * 5 * 60_000);
        const hh = String(t.getUTCHours()).padStart(2, '0');
        const mm = String(t.getUTCMinutes()).padStart(2, '0');
        const ss = String(t.getUTCSeconds()).padStart(2, '0');
        times.push(`${hh}:${mm}:${ss}`);
    }
    return times;
}

// ---------- 取 idx 时刻的资源数（按 SUBTYPE_PHASE 线性插值，向上取整保证 idx=start+1 时至少有 1 个）----------
function subTypeCountAtIdx(items, subType, idx) {
    const phase = SUBTYPE_PHASE[subType];
    const [start, end] = phase || [0, 23];
    if (idx <= start) return 0;
    if (idx >= end) return items.length;
    const ratio = (idx - start) / (end - start);
    return Math.max(1, Math.ceil(ratio * items.length));
}

// ---------- 单层逐 idx 构建 markers ----------
function buildLevelSnapshots(level) {
    const allForLevel = (mapMarkers.data || []).filter((x) => x.type === level);
    const nodes = allForLevel.filter((x) => !x.subType);
    const bySubType = {};
    for (const item of allForLevel) {
        if (item.subType) {
            if (!bySubType[item.subType]) bySubType[item.subType] = [];
            bySubType[item.subType].push(item);
        }
    }

    const times = buildTimes();
    return times.map((time, idx) => {
        // 节点：按 30% → 100% 线性增长（保证 idx=0 至少保留 1 个，避免界面"空地图"开局）
        const nodeRatio = NODE_FRACTION_START + (idx / (TIME_COUNT - 1)) * (NODE_FRACTION_END - NODE_FRACTION_START);
        const nodeCount = Math.max(1, Math.ceil(nodes.length * nodeRatio));
        const nodeMarkers = nodes.slice(0, nodeCount).map((n) => ({
            left: n.left,
            top: n.top,
            status: typeof n.status === 'number' ? n.status : 1,
            type: level,
        }));

        // 资源：按 subType phase 取前 N 个；保留 map-markers.json 完整字段（含 subType/category/icon/width/height）
        const resourceMarkers = [];
        for (const [subType, items] of Object.entries(bySubType)) {
            const count = subTypeCountAtIdx(items, subType, idx);
            if (count === 0) continue;
            // 复制对象避免引用同一内存；保留全部字段
            resourceMarkers.push(...items.slice(0, count).map((m) => ({ ...m })));
        }

        return {
            time,
            markers: [...nodeMarkers, ...resourceMarkers],
        };
    });
}

// ---------- 组装结果 ----------
const result = {
    city: buildLevelSnapshots('city'),
    company: buildLevelSnapshots('company'),
    district: buildLevelSnapshots('district'),
};

// ---------- 输出 ----------
const outPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'public',
    'static',
    'mock',
    'bj-cmcc-cmd-dispatcher',
    'history-timeline.json',
);
fs.writeFileSync(outPath, JSON.stringify(result, null, 4));

// ---------- 报告 ----------
console.log('✅ Generated:', outPath);
console.log('   节点：30% → 100%（idx 0 → 23 线性）');
console.log('   资源：6 类按 SUBTYPE_PHASE 时序到位');
console.log();
for (const level of ['city', 'company', 'district']) {
    const points = result[level];
    const last = points[points.length - 1].markers;
    const subTypes = {};
    let nodes = 0;
    for (const x of last) {
        if (x.subType) {
            subTypes[x.subType] = (subTypes[x.subType] || 0) + 1;
        } else {
            nodes += 1;
        }
    }
    console.log(`   ${level}: ${points.length} 时间点`);
    console.log(`     idx 0  →  idx 23: ${points[0].markers.length}  →  ${last.length}`);
    console.log(`     idx 23 构成：${nodes} 节点 + ${JSON.stringify(subTypes)}`);
}
console.log();
console.log('   SUBTYPE_PHASE（按到位顺序）：');
for (const [k, v] of Object.entries(SUBTYPE_PHASE)) {
    console.log(`     ${k.padEnd(20)} [${String(v[0]).padStart(2)}, ${String(v[1]).padStart(2)}]`);
}
