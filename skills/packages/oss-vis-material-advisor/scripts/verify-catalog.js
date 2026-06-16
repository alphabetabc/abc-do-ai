// 验证物料统计
const fs = require('fs');
const path = require('path');

// 使用相对路径避免 Windows 路径分隔符问题
process.chdir(path.join(__dirname, '..', '..', '..', '..'));

const all = new Set();
function walk(p) {
    if (!fs.existsSync(p)) return;
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
        const f = path.join(p, e.name);
        if (e.isDirectory()) walk(f);
        else if (e.name === 'oss-material.json') {
            const rel = f.replace(/\\/g, '/');
            const m = rel.match(/src\/packages\/(.+?)\/oss-material\.json$/);
            if (m) all.add(m[1]);
        }
    }
}

const base = 'src/packages';
console.log('scanning:', base);
walk(base);
console.log('Total unique:', all.size);

// 当前 catalog 里的分类清单
const categories = {
    '容器 / 布局': [
        'dock-menu',
        'ellipse-layout-indicator',
        'free-layout-ind-progress',
        'free-layout-indicator-group',
        'free-layout-indicators-viewer',
        'nine-grid',
        'scene-over-view-hlj',
        'telescoping-board',
    ],
    '文本 / 标签 / 标题': ['label-text', 'message-distribute', 'normal-label', 'textarea-label', 'description-table'],
    '数字 / 指标卡': [
        'bidirectional-progress',
        'business-quality',
        'business-scale',
        'digital-card',
        'digital-flop',
        'indicator-display',
        'number-level-indicate',
    ],
    '列表 / 排行': [
        'carousel-list',
        'carousel-notice',
        'carousel-param',
        'equip-list',
        'hot-app-top5',
        'monitor-topn-list',
        'progress-list',
        'top-rank',
        'top-rank-shaanxi',
        'topn-rank',
        'topn-rank-one',
        'tree-list',
        'vertical-list',
    ],
    表格: [
        'drilldown-table',
        'drilldown-table-2',
        'expandable-table',
        'pagination-table',
        'table',
        'table-detail',
        'table-fixedColumns',
        'table-transpose',
        'transfer-table',
        'alarm-window-card',
    ],
    '表单 / 筛选': ['popover-check', 'popover-checkparam', 'query-form-group', 'range-picker'],
    '按钮 / 操作': ['custom-request-button', 'export-btn', 'ghost-btn', 'iframe', 'visual-iframe'],
    '轮播 / 公告': ['carousel-image-list', 'tab-list', 'tab-list-2', 'tab-list-arc', 'tab-list-static'],
    '图表（ECharts）': [
        'circular-column',
        'cone-bar',
        'cone-bar-line',
        'cone-single-bar',
        'dual-axes-chart',
        'echarts-bar',
        'echarts-gauge',
        'echarts-liquid',
        'echarts-map',
        'echarts-multi-variable-area-chart',
        'echarts-pie',
        'ind-list-echarts-gauge',
    ],
    '图表（oss-chart-plots）': [
        'oss-chart-plots/plots/area',
        'oss-chart-plots/plots/bar',
        'oss-chart-plots/plots/base-area',
        'oss-chart-plots/plots/base-scatter',
        'oss-chart-plots/plots/column',
        'oss-chart-plots/plots/double-gauge',
        'oss-chart-plots/plots/dual-axes',
        'oss-chart-plots/plots/dual-column-line',
        'oss-chart-plots/plots/funnel',
        'oss-chart-plots/plots/gauge',
        'oss-chart-plots/plots/histogram',
        'oss-chart-plots/plots/line',
        'oss-chart-plots/plots/liquid',
        'oss-chart-plots/plots/pie',
        'oss-chart-plots/plots/radar',
        'oss-chart-plots/plots/rose',
        'oss-chart-plots/plots/sankey',
        'oss-chart-plots/plots/series-area',
        'oss-chart-plots/plots/series-bar',
        'oss-chart-plots/plots/series-column',
        'oss-chart-plots/plots/stack-bar',
        'oss-chart-plots/plots/stack-column',
        'oss-chart-plots/plots/word-cloud',
    ],
    地图: [
        'baidu-map',
        'baidu-map-unicom',
        'geo-3d-map',
        'geo-cascader',
        'oss-chart-classify-map',
        'oss-chart-fly-line-map',
        'oss-chart-map',
        'oss-gis',
    ],
    '3D / 拓扑': ['model-3d/smart-warehouse', 'twaver-topo', 'virtual-3d-column', 'virtual-3d-column-normal'],
    '时钟 / 动画': ['levitated-sphere', 'normal-clock', 'path-animation', 'svg-render', 'warning-board'],
    '媒体 / 播放': ['single-image', 'video-playback', 'weather-display'],
    '进度 / 加载': ['circular-progress', 'circular-progress-group', 'normal-process', 'pagination-display', 'progress-list-bar'],
    '状态 / 标签': ['stats-indi', 'stats-indi-grid', 'stats-indi-group', 'status-display'],
    '边框 / 装饰': [
        'decoration/border1',
        'decoration/border2',
        'decoration/border3',
        'decoration/border4',
        'decoration/border5',
        'decoration/border6',
        'decoration/border7',
        'decoration/border8',
        'decoration/border9',
        'decoration/border10',
        'decoration/border11',
        'decoration/border12',
        'decoration/decoration1',
        'decoration/decoration2',
        'decoration/decoration3',
        'decoration/decoration4',
        'decoration/decoration5',
        'decoration/decoration6',
        'decoration/decoration7',
        'decoration/decoration8',
        'decoration/decoration9',
        'decoration/decoration10',
        'decoration/decoration11',
        'decoration/decoration12',
        'decoration/hexagon',
        'decoration/flash-point',
        'decoration/common-container',
    ],
    其他: ['render-stage-loader', 'zone-setting', 'area-business-vol', 'echarts-line-dual-x', 'echarts-3d-pie', 'top-n'],
};

// 检查分类总和
const flat = [];
for (const [cat, items] of Object.entries(categories)) {
    flat.push(...items);
}
console.log('分类总和（带重复）:', flat.length);
console.log('分类唯一:', new Set(flat).size);

// 找出重复
const seen = new Map();
const duplicates = [];
for (const m of flat) {
    if (seen.has(m)) {
        duplicates.push([seen.get(m), m]);
    } else {
        seen.set(m, m);
    }
}
console.log('跨分类重复:');
for (const [a, b] of duplicates) {
    console.log('  -', a);
}

// 找出 catalog 没有的物料
const catalogSet = new Set(flat);
const missing = [...all].filter((x) => !catalogSet.has(x));
console.log('\n实际有但 catalog 没列:', missing);

// 找出 catalog 列出但实际没有的
const extra = [...catalogSet].filter((x) => !all.has(x));
console.log('catalog 列出但实际没:', extra);
