/* eslint-disable no-console */
/**
 * 生成 map-markers.json mock（task008）
 *
 * 本轮：仅生成 L1 city 层（36 个点 = 4 分公司节点 + 32 资源点）
 * 后续：company / district / street / community / station / logical 逐层补充
 *
 * 数据来源：
 *   - 000-pm-北京移动大屏下钻样例数据-广宁东山链路.md §2.3 分公司兄弟节点
 *   - 001-pm-output-data.md §3.3 缩放后数量 + §4.1 L1 city 打点数据
 *
 * 分布策略：
 *   - 用户提供 L1 city 多边形轮廓（12 点，绝对像素，base.png 2880×1080 体系）
 *   - 4 个分公司节点分散到多边形 4 个象限内
 *   - 每个分公司锚点附近聚集其隶属资源（应急通信车/卫星便捷包/无线队伍/传输队伍 各 1）
 *   - 抢修车/移动油机（数量多）在多边形内更均匀散布，退服区（城区三）略密
 *   - 固定随机种子，保证可复现
 *
 * category 值必须与 presets.ts legendCheckboxes label 一致：
 *   '卫星便捷包'（注意是"便捷"不是"便携"）/ '移动油机' / '抢修车辆' / '应急通信车' / '无线队伍' / '传输队伍'
 *
 * 用法：
 *   node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/gen-map-markers-mock.cjs
 *
 * 输出：
 *   public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json
 */
const fs = require('fs');
const path = require('path');

// ---------- 固定随机种子（可复现） ----------
let _seed = 20260826;
function rand() {
    // LCG（线性同余生成器），保证同种子同结果
    _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
    return _seed / 0x7fffffff;
}
function randRange(min, max) {
    return min + rand() * (max - min);
}

// ---------- L1 city 多边形轮廓（用户提供，绝对像素坐标） ----------
const CITY_POLYGON = [
    { x: 708.4285714285714, y: 209.57142857142858 },
    { x: 478.2857142857143, y: 358.7142857142857 },
    { x: 493.7142857142857, y: 492.42857142857144 },
    { x: 340.7142857142857, y: 609.4285714285714 },
    { x: 385.7142857142857, y: 750.8571428571428 },
    { x: 639, y: 745.7142857142857 },
    { x: 757.2857142857143, y: 723.8571428571428 },
    { x: 725.1428571428571, y: 561.8571428571429 },
    { x: 874.2857142857142, y: 524.5714285714286 },
    { x: 929.5714285714287, y: 479.57142857142856 },
    { x: 867.8571428571428, y: 313.7142857142857 },
    { x: 711, y: 208.2857142857143 },
];

// ---------- 几何工具 ----------
// 射线法判断点是否在多边形内
function pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x,
            yi = poly[i].y;
        const xj = poly[j].x,
            yj = poly[j].y;
        const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// 多边形 bounding box
function polygonBBox(poly) {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    for (const p of poly) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
}

// 多边形质心
function polygonCentroid(poly) {
    let cx = 0,
        cy = 0;
    for (const p of poly) {
        cx += p.x;
        cy += p.y;
    }
    return { x: cx / poly.length, y: cy / poly.length };
}

// 两点距离
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// 在多边形内生成一个点，满足与已有点的最小间距
function genPointInPolygon(poly, bbox, existing, minDist) {
    const MAX_TRIES = 200;
    for (let i = 0; i < MAX_TRIES; i++) {
        const x = randRange(bbox.minX, bbox.maxX);
        const y = randRange(bbox.minY, bbox.maxY);
        if (!pointInPolygon(x, y, poly)) continue;
        let ok = true;
        for (const e of existing) {
            if (dist({ x, y }, e) < minDist) {
                ok = false;
                break;
            }
        }
        if (ok) return { x, y };
    }
    // 兜底：放宽间距再试一次
    for (let i = 0; i < MAX_TRIES; i++) {
        const x = randRange(bbox.minX, bbox.maxX);
        const y = randRange(bbox.minY, bbox.maxY);
        if (pointInPolygon(x, y, poly)) return { x, y };
    }
    return polygonCentroid(poly);
}

// 在指定锚点附近（半径范围内）生成多边形内的点
function genPointNearAnchor(anchor, radius, poly, bbox, existing, minDist) {
    const MAX_TRIES = 200;
    for (let i = 0; i < MAX_TRIES; i++) {
        const angle = randRange(0, Math.PI * 2);
        const r = randRange(15, radius);
        const x = anchor.x + Math.cos(angle) * r;
        const y = anchor.y + Math.sin(angle) * r;
        if (!pointInPolygon(x, y, poly)) continue;
        let ok = true;
        for (const e of existing) {
            if (dist({ x, y }, e) < minDist) {
                ok = false;
                break;
            }
        }
        if (ok) return { x, y };
    }
    // 兜底：退化为全多边形内随机
    return genPointInPolygon(poly, bbox, existing, minDist);
}

// ---------- L1 city 数据定义 ----------
// 4 个分公司节点（status: 正常=1，告警/退服中=0）
// 数据来源：000-pm §2.3 分公司兄弟节点表
const CITY_NODES = [
    { name: '城区一分公司', status: 1 }, // 正常
    { name: '城区二分公司', status: 0 }, // 告警
    { name: '城区三分公司', status: 0 }, // 退服中 ◄ 当前路径
    { name: '郊区分公司', status: 1 }, // 正常
];

// 6 类资源 subType → category 映射
// category 值必须与 presets.ts legendCheckboxes label 完全一致
const RESOURCE_MAP = {
    'emergency-vehicle': { category: '应急通信车', count: 4 }, // 应急通信车
    'repair-vehicle': { category: '抢修车辆', count: 8 }, // 抢修车辆
    generator: { category: '移动油机', count: 8 }, // 移动油机
    'sat-bag': { category: '卫星便捷包', count: 4 }, // 卫星便捷包（注意是"便捷"）
    'wireless-team': { category: '无线队伍', count: 4 }, // 无线队伍
    'transmission-team': { category: '传输队伍', count: 4 }, // 传输队伍
};

// 资源 subType 顺序（输出顺序）
const RESOURCE_ORDER = [
    'emergency-vehicle',
    'repair-vehicle',
    'generator',
    'sat-bag',
    'wireless-team',
    'transmission-team',
];

// ---------- 生成 L1 city 打点 ----------
function genCityMarkers() {
    const bbox = polygonBBox(CITY_POLYGON);
    const centroid = polygonCentroid(CITY_POLYGON);
    const markers = [];
    const placed = []; // 已放置点坐标（用于最小间距校验）

    // 1. 4 个分公司节点：分散到多边形 4 个象限
    // 以质心为原点，将多边形 bounding box 分为 4 个象限，每个象限内取一个点
    const quadrants = [
        { x: bbox.minX, y: bbox.minY }, // 左上
        { x: bbox.maxX, y: bbox.minY }, // 右上
        { x: bbox.minX, y: bbox.maxY }, // 左下
        { x: bbox.maxX, y: bbox.maxY }, // 右下
    ];

    const nodeAnchors = [];
    for (let i = 0; i < 4; i++) {
        // 在对应象限的 bounding box 子区域内取多边形内点
        const subBBox = {
            minX: Math.min(quadrants[i].x, centroid.x),
            minY: Math.min(quadrants[i].y, centroid.y),
            maxX: Math.max(quadrants[i].x, centroid.x),
            maxY: Math.max(quadrants[i].y, centroid.y),
        };
        let anchor = null;
        for (let t = 0; t < 300; t++) {
            const x = randRange(subBBox.minX, subBBox.maxX);
            const y = randRange(subBBox.minY, subBBox.maxY);
            if (pointInPolygon(x, y, CITY_POLYGON)) {
                let ok = true;
                for (const e of placed) {
                    if (dist({ x, y }, e) < 80) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    anchor = { x, y };
                    break;
                }
            }
        }
        if (!anchor) anchor = genPointInPolygon(CITY_POLYGON, bbox, placed, 80);
        nodeAnchors.push(anchor);
        placed.push(anchor);
        markers.push({
            left: Math.round(anchor.x),
            top: Math.round(anchor.y),
            status: CITY_NODES[i].status,
            type: 'city',
        });
    }

    // 2. 资源点
    // 策略：
    //   - emergency-vehicle / sat-bag / wireless-team / transmission-team（各 4 个）：
    //     每个分公司锚点附近聚集 1 个（隶属该分公司）
    //   - repair-vehicle（8 个）/ generator（8 个）：
    //     在多边形内更均匀散布，城区三（nodeAnchors[2]，退服中）附近略密
    for (const subType of RESOURCE_ORDER) {
        const cfg = RESOURCE_MAP[subType];
        for (let i = 0; i < cfg.count; i++) {
            let pt;
            if (subType === 'repair-vehicle' || subType === 'generator') {
                // 数量多的资源：均匀散布，城区三附近略密
                // 前 3 个靠近城区三锚点（退服区略密），其余均匀散布
                if (i < 3) {
                    pt = genPointNearAnchor(nodeAnchors[2], 90, CITY_POLYGON, bbox, placed, 25);
                } else {
                    pt = genPointInPolygon(CITY_POLYGON, bbox, placed, 25);
                }
            } else {
                // 各 4 个：每个分公司锚点附近 1 个
                pt = genPointNearAnchor(nodeAnchors[i], 70, CITY_POLYGON, bbox, placed, 25);
            }
            placed.push(pt);
            markers.push({
                left: Math.round(pt.x),
                top: Math.round(pt.y),
                status: 1,
                type: 'city',
                subType,
                category: cfg.category,
            });
        }
    }

    return markers;
}

// ---------- 生成 L1 city 局部加密资源点 ----------
// 在用户提供的小多边形范围内，按每类指定数量增加资源点
function genCityDenseMarkers() {
    const poly = CITY_DENSE_POLYGON;
    const bbox = polygonBBox(poly);
    const markers = [];
    const placed = []; // 仅在 polygon 内做最小间距校验（局部范围）

    for (const subType of RESOURCE_ORDER) {
        const cfg = RESOURCE_MAP[subType];
        const addCount = CITY_DENSE_RESOURCE_COUNT[subType] ?? 0;
        for (let i = 0; i < addCount; i++) {
            // polygon 范围小，用 18 px 最小间距避免堆叠
            const pt = genPointInPolygon(poly, bbox, placed, 18);
            placed.push(pt);
            markers.push({
                left: Math.round(pt.x),
                top: Math.round(pt.y),
                status: 1,
                type: 'city',
                subType,
                category: cfg.category,
            });
        }
    }
    return markers;
}

// ---------- 生成 L2 company 打点 ----------
// 节点：6 个原始节点（用户提供）
// 资源：28 个，按 PM §4.2 缩放（4+8+4+4+4+4），均匀散布
function genCompanyMarkers() {
    const poly = COMPANY_POLYGON;
    const bbox = polygonBBox(poly);
    const markers = [...COMPANY_NODE_MARKERS];
    const placed = COMPANY_NODE_MARKERS.map((m) => ({ x: m.left, y: m.top }));

    // 资源点：按 PM §4.2 数量（4+8+4+4+4+4），均匀散布
    for (const subType of RESOURCE_ORDER) {
        const cfg = RESOURCE_MAP[subType];
        const count = COMPANY_RESOURCE_COUNT[subType];
        for (let i = 0; i < count; i++) {
            const pt = genPointInPolygon(poly, bbox, placed, 20);
            placed.push(pt);
            markers.push({
                left: Math.round(pt.x),
                top: Math.round(pt.y),
                status: 1,
                type: 'company',
                subType,
                category: cfg.category,
            });
        }
    }
    return markers;
}

// ---------- 生成 L3 district 打点 ----------
// 节点：4 原始节点（用户提供）+ 资源 12 个（每类 2 个）
// 不做位置调整，直接复用用户给的节点坐标
function genDistrictMarkers() {
    const poly = DISTRICT_POLYGON;
    const bbox = polygonBBox(poly);
    const markers = [...DISTRICT_NODE_MARKERS];
    const placed = DISTRICT_NODE_MARKERS.map((m) => ({ x: m.left, y: m.top }));

    for (const subType of RESOURCE_ORDER) {
        const cfg = RESOURCE_MAP[subType];
        const count = DISTRICT_RESOURCE_COUNT[subType];
        for (let i = 0; i < count; i++) {
            // 节点少、polygon 范围不大，用 18 px 最小间距
            const pt = genPointInPolygon(poly, bbox, placed, 18);
            placed.push(pt);
            markers.push({
                left: Math.round(pt.x),
                top: Math.round(pt.y),
                status: 1,
                type: 'district',
                subType,
                category: cfg.category,
            });
        }
    }
    return markers;
}

// ---------- 生成 L4 street 打点 ----------
// 节点：5 社区（不含物理站）
// 资源：7 个（每类 1 个，emergency-vehicle 2 个）
// 物理站（td/nr）已统一通过 STATION_MARKERS（type: 'station'）承载，street 层不重复
function genStreetMarkers() {
    const poly = STREET_POLYGON;
    const bbox = polygonBBox(poly);
    const markers = [];
    const placed = [];

    // 1. 5 社区节点：先放用户提供的 2 个，再补 3 个随机生成
    for (const node of STREET_COMMUNITY_NODES) {
        placed.push({ x: node.left, y: node.top });
        markers.push({
            left: node.left,
            top: node.top,
            status: node.status,
            type: 'street',
        });
    }
    // 补 3 个社区节点
    for (let i = 0; i < 3; i++) {
        const pt = genPointInPolygon(poly, bbox, placed, 25);
        placed.push(pt);
        markers.push({
            left: Math.round(pt.x),
            top: Math.round(pt.y),
            status: 1,
            type: 'street',
        });
    }

    // 2. 资源点：按 PM §4.4 完整数据
    for (const subType of RESOURCE_ORDER) {
        const cfg = RESOURCE_MAP[subType];
        const count = STREET_RESOURCE_COUNT[subType];
        for (let i = 0; i < count; i++) {
            const pt = genPointInPolygon(poly, bbox, placed, 18);
            placed.push(pt);
            markers.push({
                left: Math.round(pt.x),
                top: Math.round(pt.y),
                status: 1,
                type: 'street',
                subType,
                category: cfg.category,
            });
        }
    }

    return markers;
}

// ---------- 生成 L5 community 打点 ----------
// 节点：2 个原始节点（用户提供）
// 资源：6 个（每类 1 个），不含物理站
// 物理站（td/nr）统一通过 STATION_MARKERS（type: 'station'）承载，community 层不重复
function genCommunityMarkers() {
    const poly = COMMUNITY_POLYGON;
    const bbox = polygonBBox(poly);
    const markers = [...COMMUNITY_NODE_MARKERS];
    const placed = COMMUNITY_NODE_MARKERS.map((m) => ({ x: m.left, y: m.top }));

    for (const subType of RESOURCE_ORDER) {
        const cfg = RESOURCE_MAP[subType];
        const count = COMMUNITY_RESOURCE_COUNT[subType];
        for (let i = 0; i < count; i++) {
            const pt = genPointInPolygon(poly, bbox, placed, 18);
            placed.push(pt);
            markers.push({
                left: Math.round(pt.x),
                top: Math.round(pt.y),
                status: 1,
                type: 'community',
                subType,
                category: cfg.category,
            });
        }
    }
    return markers;
}

// ---------- 保留现有 station / logical 层（坐标不变） ----------
// 来源：现有 map-markers.json，task008 §3.4 明确保留
const STATION_MARKERS = [
    { left: 622, top: 282, status: 0, type: 'station', subType: 'td' },
    { left: 820, top: 431, status: 0, type: 'station', subType: 'td' },
    { left: 668, top: 519, status: 1, type: 'station', subType: 'nr' },
];

const LOGICAL_MARKERS = [{ left: 455, top: 352, status: 1, type: 'logical', icon: 'radar', width: 460, height: 448 }];

// ---------- L1 city 局部加密多边形 ----------
// 用户提供（2026-08-26）：这块范围内六类资源密度太低，加密
// 坐标体系：base.png 2880×1080，绝对像素
const CITY_DENSE_POLYGON = [
    { x: 706, y: 173 },
    { x: 686, y: 226 },
    { x: 540, y: 305 },
    { x: 458, y: 369 },
    { x: 674, y: 400 },
    { x: 703, y: 485 },
    { x: 762, y: 525 },
    { x: 880.0, y: 497 },
    { x: 878.0, y: 333 },
    { x: 705, y: 176 },
];

// 局部加密区各类资源目标数量（每类在 polygon 内再加几个点）
const CITY_DENSE_RESOURCE_COUNT = {
    'emergency-vehicle': 4,
    'repair-vehicle': 6,
    generator: 6,
    'sat-bag': 4,
    'wireless-team': 4,
    'transmission-team': 4,
};

// ---------- L2 company 多边形轮廓（用户提供，2026-08-26） ----------
// 坐标体系：base.png 2880×1080，绝对像素
const COMPANY_POLYGON = [
    { x: 535, y: 216 },
    { x: 471, y: 280 },
    { x: 259, y: 351 },
    { x: 181, y: 468 },
    { x: 266, y: 670 },
    { x: 402, y: 570 },
    { x: 672, y: 529 },
    { x: 782.0, y: 615 },
    { x: 825, y: 651 },
    { x: 912, y: 620 },
    { x: 1025, y: 591.0 },
    { x: 962.0, y: 486 },
    { x: 717, y: 334 },
    { x: 538, y: 216 },
];

// ---------- L2 company 节点数据（用户提供原始节点，2026-08-26） ----------
// 保留 6 个原始节点数据；不再按 PM §4.2 生成 2 行政区节点
const COMPANY_NODE_MARKERS = [
    { left: 979, top: 572, status: 1, type: 'company' },
    { left: 441, top: 496, status: 1, type: 'company' },
    { left: 272, top: 439, status: 1, type: 'company' },
    { left: 928, top: 492, status: 1, type: 'company' },
    { left: 944, top: 535, status: 1, type: 'company' },
    { left: 965, top: 487, status: 1, type: 'company' },
];

// ---------- L2 company 资源缩放配置 ----------
// PM §4.2：应急通信车 4 / 抢修车 8 / 移动油机 4 / 卫星便捷包 4 / 无线队伍 4 / 传输队伍 4 = 28
const COMPANY_RESOURCE_COUNT = {
    'emergency-vehicle': 4,
    'repair-vehicle': 8,
    generator: 4,
    'sat-bag': 4,
    'wireless-team': 4,
    'transmission-team': 4,
};

// ---------- L1 city 节点原始数据 ----------
// 来源：用户提供（2026-08-26）原始退服/正常节点数据，不参与资源生成
const CITY_NODE_MARKERS = [
    { left: 661, top: 253, status: 1, type: 'city' },
    { left: 835, top: 387, status: 1, type: 'city' },
    { left: 580, top: 510, status: 1, type: 'city' },
    { left: 533, top: 426, status: 1, type: 'city' },
    { left: 519, top: 584, status: 1, type: 'city' },
    { left: 514, top: 547, status: 1, type: 'city' },
    { left: 479, top: 590, status: 1, type: 'city' },
    { left: 479, top: 549, status: 1, type: 'city' },
    { left: 386, top: 570, status: 1, type: 'city' },
    { left: 323, top: 568, status: 1, type: 'city' },
];

// ---------- L3 district 多边形轮廓（用户提供，2026-08-26） ----------
// 坐标体系：base.png 2880×1080，绝对像素
const DISTRICT_POLYGON = [
    { x: 523, y: 202 },
    { x: 405, y: 235 },
    { x: 418.0, y: 363.0 },
    { x: 390, y: 461 },
    { x: 445, y: 514 },
    { x: 504.0, y: 581 },
    { x: 594, y: 694 },
    { x: 642, y: 771 },
    { x: 777, y: 786 },
    { x: 901, y: 700 },
    { x: 941, y: 639 },
    { x: 745.0, y: 632 },
    { x: 764, y: 504 },
    { x: 712, y: 391 },
    { x: 653, y: 284 },
    { x: 592, y: 238 },
    { x: 521, y: 200 },
];

// ---------- L3 district 节点数据（保留用户提供的原始节点，2026-08-26） ----------
const DISTRICT_NODE_MARKERS = [
    { left: 431, top: 436, status: 1, type: 'district' },
    { left: 654, top: 451, status: 1, type: 'district' },
    { left: 5, top: 5.57, status: 1, type: 'district' },
    { left: 605, top: 655, status: 1, type: 'district' },
];

// ---------- L3 district 资源缩放配置 ----------
// PM §4.3：每类 2 个 = 12 个资源
const DISTRICT_RESOURCE_COUNT = {
    'emergency-vehicle': 2,
    'repair-vehicle': 2,
    generator: 2,
    'sat-bag': 2,
    'wireless-team': 2,
    'transmission-team': 2,
};

// ---------- L4 street 多边形轮廓（用户提供，2026-08-26） ----------
// 坐标体系：base.png 2880×1080，绝对像素
const STREET_POLYGON = [
    { x: 393.0, y: 216 },
    { x: 317, y: 277 },
    { x: 382, y: 425.0 },
    { x: 510, y: 469 },
    { x: 573, y: 627 },
    { x: 724, y: 727 },
    { x: 817, y: 700 },
    { x: 847, y: 637 },
    { x: 848, y: 558 },
    { x: 839, y: 452 },
    { x: 694, y: 342 },
    { x: 573, y: 413 },
    { x: 467, y: 368 },
    { x: 472, y: 272 },
    { x: 472, y: 272 },
];

// ---------- L4 street 节点数据（5 社区 + 7 物理站，PM §4.4） ----------
// 社区：保留用户提供原始数据；按 PM 补全5 个社区
// 物理站：按 PM 表格生成 7 个 td/nr 站点
const STREET_COMMUNITY_NODES = [
    { left: 675, top: 411, status: 1, name: '社区1' }, // 用户原始节点 1
    { left: 746, top: 642, status: 1, name: '社区2' }, // 用户原始节点 2
    // PM §4.4 还有 3 个社区节点，按 polygon 随机生成
];

// PM §4.4：7 个物理站（4G td / 5G nr 混合）
// 注：物理站统一通过 STATION_MARKERS（type: 'station'）承载，street 层不重复
// 这里保留 STREET_STATION_COUNT 以备后续参考
const STREET_STATION_COUNT = {
    td: 3, // td: 4G 站点
    nr: 4, // nr: 5G 站点
};

// ---------- L4 street 资源缩放配置（PM §4.4，PM 完整数据） ----------
// 每类资源各 1 个（除 emergency-vehicle 有 2 个，共 7）
const STREET_RESOURCE_COUNT = {
    'emergency-vehicle': 2, // 京A·01驻守东山 + 京A·03行进高井路
    'repair-vehicle': 1,
    generator: 1,
    'sat-bag': 1,
    'wireless-team': 1,
    'transmission-team': 1,
};

// ---------- L5 community 多边形轮廓（用户提供，2026-08-26） ----------
// 坐标体系：base.png 2880×1080，绝对像素
const COMMUNITY_POLYGON = [
    { x: 682, y: 306 },
    { x: 475, y: 308 },
    { x: 394.0, y: 414 },
    { x: 354, y: 437 },
    { x: 552, y: 599 },
    { x: 745.0, y: 684 },
    { x: 857, y: 759.0 },
    { x: 865, y: 617 },
    { x: 723, y: 612 },
    { x: 725, y: 384 },
    { x: 725, y: 384 },
];

// ---------- L5 community 节点配置（用户提供原始节点，2026-08-26） ----------
// 保留原始节点数据：1 退服（555/378）+ 1 正常（802/623）
// 物理站（td/nr）统一通过 STATION_MARKERS（type: 'station'）承载，community 层不重复
const COMMUNITY_NODE_MARKERS = [
    { left: 555, top: 378, status: 0, type: 'community' }, // 退服
    { left: 802, top: 623, status: 1, type: 'community' }, // 正常
];

// 保留 COMMUNITY_STATION_CONFIGS 以备后续参考
const COMMUNITY_STATION_CONFIGS = [
    { subType: 'td', status: 0, name: '广宁东山综合基站' }, // 退服中
    { subType: 'nr', status: 1, name: '广宁电厂路微站' }, // 正常
];

// ---------- L5 community 资源缩放配置（PM §4.5：6 个，每类 1 个） ----------
const COMMUNITY_RESOURCE_COUNT = {
    'emergency-vehicle': 1, // 京A·01，驻守东山综合基站
    'repair-vehicle': 1, // 京A·12，前往东山综合基站
    generator: 1, // 示意性（油机在高井路）
    'sat-bag': 1, // YJB-01，东山综合基站应急回传
    'wireless-team': 1, // 无线保障一队
    'transmission-team': 1, // 示意性
};

// ---------- L5 community 节点已由 genCommunityMarkers 输出（2 物理站 td/nr + 6 资源） ----------
// 不再保留原始节点数据
const OTHER_NODE_MARKERS = [];

// ---------- 主流程 ----------
function main() {
    // L1 city 生成
    // cityMarkers = 4 分公司节点 + 32 资源
    // 但实际原始数据已有 10 个分公司节点（含退服点），用 CITY_NODE_MARKERS 替换 genCityMarkers 的节点部分
    const generatedCity = genCityMarkers(); // 含 4 节点 + 32 资源
    const cityResources = generatedCity.filter((m) => m.subType); // 32 个资源
    const cityDenseResources = genCityDenseMarkers(); // 局部加密 28 个资源（4+6+6+4+4+4）
    const cityMarkers = [...CITY_NODE_MARKERS, ...cityResources, ...cityDenseResources];
    console.log(
        `[gen-map-markers] L1 city 生成 ${cityMarkers.length} 个点（节点 ${CITY_NODE_MARKERS.length} + 资源 ${cityResources.length} + 加密资源 ${cityDenseResources.length}）`,
    );

    // L2 company 生成：6 原始节点 + 28 资源
    const companyMarkers = genCompanyMarkers();
    console.log(`[gen-map-markers] L2 company 生成 ${companyMarkers.length} 个点（节点 6 + 资源 28）`);

    // L3 district 生成：4 原始节点 + 12 资源
    const districtMarkers = genDistrictMarkers();
    console.log(
        `[gen-map-markers] L3 district 生成 ${districtMarkers.length} 个点（节点 ${DISTRICT_NODE_MARKERS.length} + 资源 12）`,
    );

    // L4 street 生成：5 社区 + 7 资源（不含物理站）
    const streetMarkers = genStreetMarkers();
    console.log(`[gen-map-markers] L4 street 生成 ${streetMarkers.length} 个点（预期 12）`);

    // L5 community 生成：2 原始节点 + 6 资源
    const communityMarkers = genCommunityMarkers();
    console.log(`[gen-map-markers] L5 community 生成 ${communityMarkers.length} 个点（节点 2 + 资源 6）`);

    const data = [
        ...cityMarkers,
        ...OTHER_NODE_MARKERS, // company / district / street / community 节点
        ...companyMarkers,
        ...districtMarkers,
        ...streetMarkers,
        ...communityMarkers,
        ...STATION_MARKERS,
        ...LOGICAL_MARKERS,
    ];

    const output = { data };
    const outPath = path.resolve(__dirname, '../../../../public/static/mock/bj-cmcc-cmd-dispatcher/map-markers.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 4) + '\n', 'utf8');
    console.log(`[gen-map-markers] 写入 ${outPath}`);
    console.log(
        `[gen-map-markers] 合计 ${data.length} 个点（city ${cityMarkers.length} + company ${companyMarkers.length} + district ${districtMarkers.length} + street ${streetMarkers.length} + community ${communityMarkers.length} + station ${STATION_MARKERS.length} + logical ${LOGICAL_MARKERS.length}）`,
    );
    console.log('[gen-map-markers] 五层（city/company/district/street/community）+ station/logical 全部完成');
}

main();
