// 生成 materials-catalog.md
const fs = require('fs');
const path = require('path');

function globSync(pattern) {
    // 简易 glob 实现
    const isWin = process.platform === 'win32';
    const sep = isWin ? '\\' : '/';
    const norm = p => p.replace(/[\\\/]/g, sep);
    const re = new RegExp(
        '^' +
        pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*\\\*/g, '.*')
            .replace(/\\\*/g, '[^' + (sep === '\\' ? '\\\\' : '\\/') + ']*')
            .replace(/\\\?/g, '[^' + (sep === '\\' ? '\\\\' : '\\/') + ']') +
        '$',
        'i'
    );
    const out = [];
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else {
                const rel = norm(path.relative('.', full));
                if (re.test(rel) || re.test(rel.split(sep).join('/'))) out.push(rel.split(sep).join('/'));
            }
        }
    }
    // 简化：直接读 packages 根
    walk('src/packages');
    return out;
}

// 1. 扫所有物料
const allFiles = [];
function walk(p) {
    if (!fs.existsSync(p)) return;
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        const full = path.join(p, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name === 'oss-material.json') {
            const rel = full.replace(/\\/g, '/');
            const m = rel.match(/^src\/packages\/(.+?)\/oss-material\.json$/);
            if (m) allFiles.push(m[1]);
        }
    }
}
walk('src/packages');

// 2. 扫已画像
const profiles = [];
const profilesDir = '.trae/skills/oss-vis-material-advisor/profiles';
if (fs.existsSync(profilesDir)) {
    for (const f of fs.readdirSync(profilesDir)) {
        if (f.endsWith('.json') && f !== 'README.md') {
            profiles.push(f.replace('.json', ''));
        }
    }
}

// 3. 扫自带 doc
const docs = [];
function walkDoc(p) {
    if (!fs.existsSync(p)) return;
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        const full = path.join(p, e.name);
        if (e.isDirectory()) walkDoc(full);
        else if (e.name === 'readme.md' && full.includes('doc')) {
            const rel = full.replace(/\\/g, '/');
            const m = rel.match(/^src\/packages\/(.+?)\/doc\/readme\.md$/);
            if (m) docs.push(m[1]);
        }
    }
}
walkDoc('src/packages');

// 4. 读取每个画像的评级+分数+成本
const profileData = {};
for (const name of profiles) {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(profilesDir, name + '.json'), 'utf-8'));
        profileData[name] = {
            label: data.rating?.label || '-',
            score: data.rating?.score ?? '-',
            grade: data.rating?.grade || '-',
            minutes: data.build_cost?.estimated_minutes ?? '-',
            complexity: data.basic?.complexity || '-',
        };
    } catch (e) {}
}

// 5. 按 18 分类组织（去重：每个物料只属于 1 个主分类）
const categories = [
    { name: '容器 / 布局', items: ['dock-menu', 'ellipse-layout-indicator', 'free-layout-ind-progress', 'free-layout-indicator-group', 'free-layout-indicators-viewer', 'nine-grid', 'scene-over-view-hlj', 'telescoping-board'] },
    { name: '文本 / 标签 / 标题', items: ['label-text', 'message-distribute', 'normal-label', 'textarea-label', 'description-table'] },
    { name: '数字 / 指标卡', items: ['bidirectional-progress', 'business-quality', 'business-scale', 'digital-card', 'digital-flop', 'indicator-display', 'number-level-indicate'] },
    { name: '列表 / 排行', items: ['carousel-list', 'carousel-notice', 'carousel-param', 'equip-list', 'hot-app-top5', 'monitor-topn-list', 'progress-list', 'top-rank', 'top-rank-shaanxi', 'topn-rank', 'topn-rank-one', 'tree-list', 'vertical-list'] },
    { name: '表格', items: ['drilldown-table', 'drilldown-table-2', 'expandable-table', 'pagination-table', 'table', 'table-detail', 'table-fixedColumns', 'table-transpose', 'transfer-table', 'alarm-window-card'] },
    { name: '表单 / 筛选', items: ['popover-check', 'popover-checkparam', 'query-form-group', 'range-picker'] },
    { name: '按钮 / 操作', items: ['custom-request-button', 'export-btn', 'ghost-btn', 'iframe', 'visual-iframe'] },
    { name: '轮播 / 公告', items: ['carousel-image-list', 'tab-list', 'tab-list-2', 'tab-list-arc', 'tab-list-static'] },
    { name: '图表（ECharts）', items: ['circular-column', 'cone-bar', 'cone-bar-line', 'cone-single-bar', 'dual-axes-chart', 'echarts-bar', 'echarts-gauge', 'echarts-liquid', 'echarts-map', 'echarts-multi-variable-area-chart', 'echarts-pie', 'ind-list-echarts-gauge'] },
    { name: '图表（oss-chart-plots）', items: ['oss-chart-plots/plots/area', 'oss-chart-plots/plots/bar', 'oss-chart-plots/plots/base-area', 'oss-chart-plots/plots/base-scatter', 'oss-chart-plots/plots/column', 'oss-chart-plots/plots/double-gauge', 'oss-chart-plots/plots/dual-axes', 'oss-chart-plots/plots/dual-column-line', 'oss-chart-plots/plots/funnel', 'oss-chart-plots/plots/gauge', 'oss-chart-plots/plots/histogram', 'oss-chart-plots/plots/line', 'oss-chart-plots/plots/liquid', 'oss-chart-plots/plots/pie', 'oss-chart-plots/plots/radar', 'oss-chart-plots/plots/rose', 'oss-chart-plots/plots/sankey', 'oss-chart-plots/plots/series-area', 'oss-chart-plots/plots/series-bar', 'oss-chart-plots/plots/series-column', 'oss-chart-plots/plots/stack-bar', 'oss-chart-plots/plots/stack-column', 'oss-chart-plots/plots/word-cloud'] },
    { name: '地图', items: ['baidu-map', 'baidu-map-unicom', 'geo-3d-map', 'geo-cascader', 'oss-chart-classify-map', 'oss-chart-fly-line-map', 'oss-chart-map', 'oss-gis'] },
    { name: '3D / 拓扑', items: ['model-3d/smart-warehouse', 'twaver-topo', 'virtual-3d-column', 'virtual-3d-column-normal'] },
    { name: '时钟 / 动画', items: ['levitated-sphere', 'normal-clock', 'path-animation', 'svg-render', 'warning-board'] },
    { name: '媒体 / 播放', items: ['single-image', 'video-playback', 'weather-display'] },
    { name: '进度 / 加载', items: ['circular-progress', 'circular-progress-group', 'normal-process', 'pagination-display', 'progress-list-bar'] },
    { name: '状态 / 标签', items: ['stats-indi', 'stats-indi-grid', 'stats-indi-group', 'status-display'] },
    { name: '边框 / 装饰', items: ['decoration/border1', 'decoration/border2', 'decoration/border3', 'decoration/border4', 'decoration/border5', 'decoration/border6', 'decoration/border7', 'decoration/border8', 'decoration/border9', 'decoration/border10', 'decoration/border11', 'decoration/border12', 'decoration/decoration1', 'decoration/decoration2', 'decoration/decoration3', 'decoration/decoration4', 'decoration/decoration5', 'decoration/decoration6', 'decoration/decoration7', 'decoration/decoration8', 'decoration/decoration9', 'decoration/decoration10', 'decoration/decoration11', 'decoration/decoration12', 'decoration/hexagon', 'decoration/flash-point', 'decoration/common-container'] },
    { name: '其他', items: ['render-stage-loader', 'zone-setting', 'area-business-vol', 'echarts-line-dual-x', 'echarts-3d-pie', 'top-n'] }
];

// 6. 统计
const total = allFiles.length;
const profiled = profiles.length;
const doc = docs.length;

const labelCount = { '🟢 独立优秀': 0, '🟡 组合可用': 0, '🔴 组合复杂': 0, '⚫ 不建议': 0 };
for (const p of Object.values(profileData)) if (labelCount[p.label] !== undefined) labelCount[p.label]++;

// 7. 输出
const today = '2026-06-16';
let md = '';
md += '---\n';
md += 'title: 物料维护清单（advisor 视角）\n';
md += `description: advisor 对全部 ${total} 个有效物料的画像/文档化状态总览，按 18 个分类组织\n`;
md += 'version: 0.1\n';
md += `last_updated: ${today}\n`;
md += '---\n\n';
md += `# 物料维护清单（advisor 视角）\n\n`;
md += `本清单覆盖 \`src/packages/**/oss-material.json\` 命中的全部 **${total} 个物料**，按 18 个分类组织，标注每个物料的：\n`;
md += `- 复杂度（来自画像，缺失则为 \`-\`）\n`;
md += `- 画像状态（✅ 已画像 / ⏳ 待画像）\n`;
md += `- 自带 doc（📄 / —）\n`;
md += `- 评级 + 分数 + 搭建成本（仅已画像）\n\n`;
md += `> **分类原则**：每个物料只属于 1 个主分类（以 \`oss-material.json.title\` 为首要依据）。\n`;
md += `> 例如 "环形进度图" 类物料归入 [进度/加载](#进度--加载5)，"水平进度图" 归入 [进度/加载](#进度--加载5)，"进度条列表" 归入 [列表/排行](#列表--排行13)。\n\n`;

md += '## 状态说明\n\n';
md += '| 符号 | 含义 |\n';
md += '|------|------|\n';
md += '| ✅ 已画像 | advisor 已生成 `profiles/{name}.json` |\n';
md += '| ⏳ 待画像 | 物料存在但 advisor 尚未生成画像 |\n';
md += '| 📄 自带 doc | 物料自带 `doc/readme.md`（设计器侧边栏渲染） |\n';
md += '| 🟢 独立优秀 | 评级 A，6 维加权 ≥ 4.5 |\n';
md += '| 🟡 组合可用 | 评级 B，3.5-4.5 |\n';
md += '| 🔴 组合复杂 | 评级 C，2.5-3.5 |\n';
md += '| ⚫ 不建议 | 评级 D，< 2.5 |\n\n';

md += '## 总览\n\n';
md += '| 指标 | 数值 |\n|------|------|\n';
md += `| 物料总数 | ${total} |\n`;
md += `| 已画像 | ${profiled}（${((profiled / total) * 100).toFixed(1)}%）|\n`;
md += `| 待画像 | ${total - profiled}（${(((total - profiled) / total) * 100).toFixed(1)}%）|\n`;
md += `| 自带 doc | ${doc}（${((doc / total) * 100).toFixed(1)}%）|\n`;
md += `| 🟢 独立优秀 | ${labelCount['🟢 独立优秀']} |\n`;
md += `| 🟡 组合可用 | ${labelCount['🟡 组合可用']} |\n`;
md += `| 🔴 组合复杂 | ${labelCount['🔴 组合复杂']} |\n`;
md += `| ⚫ 不建议 | ${labelCount['⚫ 不建议']} |\n\n`;

md += '## 按分类\n\n';
for (const cat of categories) {
    md += `### ${cat.name}（${cat.items.length}）\n\n`;
    md += '| 物料 | 复杂度 | 画像 | 自带 doc | 评级 | 分数 | 搭建（minimal） |\n';
    md += '|------|--------|------|----------|------|------|----------------|\n';
    let profiled_count = 0;
    for (const name of cat.items) {
        const has_profile = profiles.includes(name);
        const has_doc = docs.includes(name);
        if (has_profile) profiled_count++;
        const p = profileData[name] || {};
        const complexity = p.complexity || '-';
        const profile_icon = has_profile ? '✅' : '⏳';
        const doc_icon = has_doc ? '📄' : '—';
        md += `| \`${name}\` | ${complexity} | ${profile_icon} | ${doc_icon} | ${p.label || '-'} | ${p.score ?? '-'} | ${p.minutes ?? '-'} min |\n`;
    }
    md += `\n> 已画像 ${profiled_count}/${cat.items.length}\n\n`;
}

md += '## 推进建议\n\n';
md += `当前覆盖率 ${((profiled / total) * 100).toFixed(1)}%，后续批次建议：\n\n`;
md += '1. **第一批**（已做，11 个）：8 个有 5+1 文档物料 + 3 个高频（echarts-map/table/top-rank）\n';
md += '2. **第二批**（已完成，10 个）：表格全部完成\n';
md += '3. **第三批**（建议）：列表/排行（13 个全做）— 高频复用率高\n';
md += '4. **第四批**：图表 ECharts 剩余（9 个）+ oss-chart-plots 系列（23 个，建议抽取通用 schema 模板）\n';
md += '5. **第五批**：数字/指标卡、容器/布局、地图、其他\n';
md += '6. **最后**：边框/装饰（27 个，纯样式，无数据交互，画像意义低）\n\n';
md += '## 与 development-assistant 清单的关系\n\n';
md += '- 本清单的**物料分类与名称**与 `oss-vis-material-development-assistant/materials/README.md` 保持一致（单一真相）\n';
md += '- 本清单**新增画像状态、评级、分数、搭建成本** 4 列（advisor 独有）\n';
md += '- 两份清单互为补充，**没有重复维护负担**\n';

// 8. 校验：每个物料只出现在 1 个分类；总数 = 实际 oss-material.json 数
const seen = new Set();
const dupes = [];
for (const cat of categories) {
    for (const name of cat.items) {
        if (seen.has(name)) dupes.push(name);
        else seen.add(name);
    }
}
if (dupes.length) {
    console.error('✗ 重复分类:', dupes);
    process.exit(1);
}
const missing = allFiles.filter(x => !seen.has(x));
const extra = [...seen].filter(x => !allFiles.includes(x));
if (missing.length) {
    console.error('✗ 分类遗漏:', missing);
    process.exit(1);
}
if (extra.length) {
    console.error('✗ 分类多列:', extra);
    process.exit(1);
}
console.log('  ✓ 分类清单去重、覆盖校验通过（', seen.size, '=', total, '）');

fs.writeFileSync('.trae/skills/oss-vis-material-advisor/materials-catalog.md', md);
console.log('✓ materials-catalog.md written,', total, 'materials,', profiled, 'profiled');
