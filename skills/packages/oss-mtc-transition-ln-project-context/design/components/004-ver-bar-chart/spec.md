# 004 · VerBarChart 组件规格（spec）

> 性质：组件规格文档
> 日期：2026-08-26
> 维护规则：本文件不入 `docs/`、不入 Git
> 版本基准：`frontend/src/components/large-screen/ver-bar-chart/index.tsx`（2026-08-26 读取版）
> 说明：本组件先有代码后补 spec，本文为行为规格的**权威描述**，实现须与之一致；冲突时以本文为准并回改代码。

---

## 1. 范围

大屏可视化用的竖形分组 / 堆叠柱状图组件 `VerBarChart`，基于 ECharts 6 + echarts-for-react。

**包含**：分组/堆叠柱渲染、渐变/纯色柱、三种图例布局、ECharts 声明式分类装饰（markArea/markLine）、graphic 自绘装饰（十字角标 / 分界虚线 / 柱顶装饰条 / 背景立柱）、blockWidth 等宽卡片模式。

**不包含**：横向条形图、dataZoom / 拖拽交互、loading / error 态（数据由调用方保证）。

**产物**：`index.tsx`（组件本体）+ `index.css`（`.ls-ver-bar-chart` 容器样式）。
**依赖**：`echarts@^6.1.0`、`echarts-for-react@^3.0.6`、`react`。

---

## 2. 接口规格

### 2.1 数据类型

```ts
interface VerBarGradientStop { offset: number; color: string; }
interface VerBarSeries {
    name: string;
    colorTop: string;     // 柱顶色，兼作图例图标纯色
    colorBottom: string;  // 柱底色
    gradient?: VerBarGradientStop[];  // 优先于 colorTop/colorBottom；offset 0 顶部
    values: number[];     // 按 groups 顺序
}
interface VerBarGroup { label: string; }
```

### 2.2 Props 与默认值

**数据与基础**

| Prop         | 类型 | 默认值 |
|--------------|------|--------|
| `series` | `VerBarSeries[]` | 必填 |
| `groups` | `VerBarGroup[]` | 必填 |
| `max` | `number` | `autoMax(全部值)` |
| `unit` | `string` | `'单位:（万）'` |
| `showUnit` | `boolean` | `true` |
| `tickCount` | `number` | `5` |
| `showLegend` | `boolean` | `true` |
| `width` / `height` | `number \| string` | `'100%'` |
| `className` / `style` | - | - |

**柱体**

| Prop | 类型 | 默认值 |
|------|------|--------|
| `barWidth` | `number` | `24` |
| `barGap` | `string` | `'20%'` |
| `barSolid` | `boolean` | `false` |
| `barBorderRadius` | `number` | `0` |
| `stack` | `string` | - |

**graphic 装饰**

| Prop | 类型 | 默认值 |
|------|------|--------|
| `showBarTopCap` | `boolean` | `false` |
| `barTopCapColor` | `string` | `'rgba(255, 255, 255, 1)'` |
| `barTopCapSize` | `{width,height}` | `{width:24, height:2}` |
| `showBarBackground` | `boolean` | `false` |
| `barBackgroundColor` | `string` | `'rgba(108, 128, 151, 0.3)'` |
| `barBackgroundOpacity` | `number` | `1` |
| `barBackgroundWidth` | `number` | `24` |
| `barBackgroundPad` | `number` | `0` |
| `showCrossMarks` | `boolean` | `false` |
| `crossMarkColor` | `string` | `'rgba(255, 255, 255, 1)'` |
| `crossMarkSize` | `number` | `4` |
| `showBlockCornerMarks` | `boolean` | `false` |
| `blockCornerMarkColor` | `string` | `'rgba(255, 255, 255, 1)'` |
| `blockCornerMarkSize` | `number` | `5` |
| `showBlockCornerMidLine` | `boolean` | `true` |
| `blockWidth` | `number` | - |
| `showCategoryBg` | `boolean` | `true` |

**图例 / 文字**

| Prop | 类型 | 默认值 |
|------|------|--------|
| `legendPosition` | `'top'\|'right'\|'top-right'` | `'top'` |
| `legendGap` | `number` | `8` |
| `legendItemWidth` / `legendItemHeight` | `number` | `14` / `8` |
| `axisLabelColor` | `string` | `'rgba(166, 190, 206, 1)'` |
| `labelFontSize` | `number` | `12` |
| `labelFormatter` | `(v:number)=>string` | - |
| `unitAlign` | `'left'\|'center'\|'right'` | `'right'` |
| `unitGap` | `number` | `8` |
| `unitTextStyle` | `CSSProperties`（color/fontSize/fontWeight/lineHeight/letterSpacing） | - |
| `xAxisLabelInterval` | `number` | ECharts 默认 |
| `xAxisLabelRotate` | `number` | `0` |

### 2.3 常量

```ts
FONT_FAMILY = '"Source Han Sans CN", "Microsoft YaHei", sans-serif'
AXIS_LABEL_COLOR = 'rgba(166, 190, 206, 1)'
AXIS_LINE_COLOR  = 'rgba(108, 128, 151, 0.3)'
LEGEND_TEXT_COLOR = 'rgba(255, 255, 255, 0.85)'
CATEGORY_BG_COLOR = 'rgba(108, 128, 151, 0.2)'
LEGEND_RIGHT_WIDTH = 90; LEGEND_TOP_HEIGHT = 30
```

绘制局部常量：`gridLeft=40`、`gridRight=20`、`RIGHT_MARK_INSET=6`、`catGap=0.5`（对应 series `barCategoryGap:'50%'`）、`BLOCK_HALF_WIDTH=0.36`。

---

## 3. 功能需求

### FR-1 柱体渲染

- FR-1.1 每个分类渲染所有 series 的柱子；`barWidth`/`barGap`/`barCategoryGap:'50%'` 控制排布
- FR-1.2 柱色：`barSolid=true` 用 `colorTop` 纯色；否则 `makeBarGradient` 线性渐变（`gradient` 停靠点优先，退化 colorTop(顶)/colorBottom(底)）
- FR-1.3 `stack` 传入时所有 series 堆叠为一组，且柱顶数值标签自动关闭（`show: !stack`）
- FR-1.4 柱顶标签：白字、`labelFontSize`、`labelFormatter` 格式化，非堆叠时显示
- FR-1.5 `max` 未传时 `autoMax`：数量级向上取整（847→900→1000）；全 0 退化为 10
- FR-1.6 Y 轴 `interval = max/(tickCount-1)`

### FR-2 tooltip

深色底（`rgba(0,20,45,0.95)` / 蓝边框 `rgba(0,82,172,0.6)`）；首行分类名加粗，每项一行 marker + seriesName 左对齐 + 数值右对齐（`toLocaleString('en-US')`）加粗；`trigger:'axis'` + shadow 指示器；`confine:true`。

### FR-3 图例

| position | 布局 | grid 预留 |
|----------|------|-----------|
| `'top'`（默认） | 水平居中 `top:0`；文字全角空格 pad 等宽 | grid.top=80（showLegend 时）/ 20 |
| `'right'` | 竖排 `right:0, top:'middle'` | grid.top=20；grid.right=`max(90+legendGap, dynamicGridRight)` |
| `'top-right'` | 水平靠右 `top:0, right:0` | grid.top=30+legendGap |

图标 rect，色块用 `colorTop`。`showLegend=false` 时不渲染，grid 回退基础值。

### FR-4 坐标轴

- X 轴：类目轴；轴线虚线 `AXIS_LINE_COLOR`；无 tick；标签 16/500，支持 `interval`/`rotate`
- Y 轴：数值轴；轴线与 splitLine 均虚线 `AXIS_LINE_COLOR`；单位文字 `showUnit ? unit : ''` 于轴顶（nameGap/ nameAlign/ unitTextStyle 可调）

### FR-5 分类声明式装饰（showCategoryBg，默认开）

- FR-5.1 每分类一块 markArea 底色（`CATEGORY_BG_COLOR`），宽度分类单位 ±0.36，仅挂第一个 series
- FR-5.2 分类之间（x=gIdx+0.5）markLine 竖虚线，`symbol:'none'`，共 N-1 条

### FR-6 graphic 自绘装饰

统一像素基准：`topY = convertToPixel(yAxis, max)`、`bottomY = convertToPixel(yAxis, 0)`；任一坐标转换失败跳过该元素；提交 `{ graphic: { $action:'replace', elements, clip:false } }`。

- **FR-6.1 Y 轴两端「+」角标**（showCrossMarks）：每条网格线（tickCount 条）左右两端（x=40 / chartWidth-20）各一组十字（2 条 line，单边长 crossMarkSize，lineWidth 1）
- **FR-6.2 分类边界十字 + 虚线**（showBlockCornerMarks）：N 分类 → N+1 条边界。blockPx = 相邻类目中心像素差（单分类退化 `blockWidth`）；左边界 = firstCenter - blockPx/2；每条边界画顶部「+」（横线 + 全高竖线）与底部「┴」（横线 + 仅上半段竖线）；`showBlockCornerMidLine=true`（默认）时中间画 lineDash:[4,4] 竖虚线（AXIS_LINE_COLOR）；最右边界左移 6px（RIGHT_MARK_INSET）
- **FR-6.3 柱顶装饰条**（showBarTopCap）：每个非零值柱顶白 rect（barTopCapSize），z:100
- **FR-6.4 背景立柱**（showBarBackground && barBackgroundWidth>0）：每分类一块满高 rect（topY→bottomY），z:0。宽度：`barBackgroundPad>0` → `min(barBackgroundWidth, 柱宽+2×pad)`；否则 `min(barBackgroundWidth, blockPx×0.9)`。柱宽估算：固定 barWidth 或 `blockPx×(1-0.5)`。series 的 `showBackground` 必须为 false（防双重绘制）
- **约束**：graphic line 虚线只能用 `lineDash`，不得用 `type:'dashed'`

### FR-7 blockWidth 等宽卡片模式

- FR-7.1 设置 `blockWidth` 时动态计算 `grid.right = max(0, 容器宽 - 40 - N×blockWidth - blockCornerMarkSize - 3)`
- FR-7.2 容器尺寸变化（ResizeObserver）实时重算；未设置 blockWidth 时 dynamicGridRight 为 null
- FR-7.3 生效后每个分类严格占 blockWidth 像素，边界十字落在分类边界上

### FR-8 生命周期

- FR-8.1 `onChartReady`：`resize()` → `drawGraphics()` → 注册 window resize 监听
- FR-8.2 任何影响像素布局的输入变化（数据 / max / 图例 / 装饰开关 / dynamicGridRight）→ rAF 等一帧后重画 graphic（依赖清单见 §5.2）
- FR-8.3 window resize → `instance.resize()` 后立即重画 graphic
- FR-8.4 卸载：取消未执行 rAF（防对已 dispose 实例调 convertToPixel）、移除 resize 监听
- FR-8.5 graphic 全量替换（`$action:'replace'`），不得累积旧元素
- FR-8.6 ReactECharts 以 `notMerge + lazyUpdate` 应用 option

---

## 4. 非功能需求

- NFR-1 单文件组件，导出 `VerBarChart`（default）及类型 `VerBarSeries` / `VerBarGroup` / `VerBarGradientStop` / `VerBarChartProps`
- NFR-2 容器类名 `ls-ver-bar-chart`，透传 `className`/`style`/`width`/`height`
- NFR-3 所有 `convertToPixel` 结果判空，null 安全
- NFR-4 快速连续的数据变化不产生旧 graphic 残留

---

## 5. 实现规格（供重建 / 核对）

### 5.1 option 结构

tooltip / legend / grid（见 FR-2/3 及 §2.3 常量）；xAxis / yAxis（FR-4）；series 每项含 `name/type:'bar'/data/barWidth/barCategoryGap:'50%'/barGap/stack/itemStyle(barSolid? colorTop : gradient, borderRadius)/showBackground:false/label/markArea/markLine`（后两者仅 sIdx===0）。

useMemo 依赖（即重绘触发清单）：`series, groups, max, tickCount, unit, showLegend, showBarBackground, barBackgroundColor, barBackgroundOpacity, axisLabelColor, showCategoryBg, dynamicGridRight, labelFormatter, barWidth, labelFontSize, barGap, unitGap, showUnit, legendPosition, legendGap, barSolid, barBorderRadius, stack, xAxisLabelInterval, xAxisLabelRotate, legendItemWidth, legendItemHeight, showBlockCornerMidLine, barBackgroundPad`

### 5.2 工具函数

```ts
function autoMax(values: number[]): number {
    const max = Math.max(...values, 0);
    if (max === 0) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
}

function makeBarGradient(colorTop, colorBottom, gradient?) {
    const stops = gradient && gradient.length > 0
        ? gradient.map((g) => ({ offset: g.offset, color: g.color }))
        : [{ offset: 0, color: colorTop }, { offset: 1, color: colorBottom }];
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}
```

### 5.3 JSX

```tsx
<div ref={containerRef} className={`ls-ver-bar-chart ${className ?? ''}`.trim()}
     style={{ width, height, ...style }}>
    <ReactECharts
        ref={(e) => { if (e) chartRef.current = e.getEchartsInstance(); }}
        option={option} style={{ width: '100%', height: '100%' }}
        notMerge lazyUpdate onChartReady={onChartReady} />
</div>
```

ref 体系：`containerRef`（外层 div，ResizeObserver 用）、`chartRef`（ECharts 实例）、`rafRef`（待执行 rAF）、`drawGraphicsRef`（每渲染更新的最新 drawGraphics 引用，保证 resize 监听 add/remove 同引用）。

---

## 6. 验收标准

- [ ] 默认渲染：分组柱 + 渐变 + 柱顶白字数值 + 顶部居中图例 + 分类底色 + 分类间虚线
- [ ] `max` 未传时 Y 轴上限数量级取整；全 0 数据不崩
- [ ] `stack` 堆叠生效且柱顶标签消失；`barSolid` / `barBorderRadius` 生效
- [ ] 三种 legendPosition 的 grid 预留符合 FR-3 表
- [ ] showCrossMarks：每条网格线两端「+」，溢出 grid 不被裁剪
- [ ] showBlockCornerMarks：N+1 条边界，顶「+」底「┴」，虚线可关，最右左移 6px
- [ ] showBarTopCap：非零柱顶白条盖在柱上
- [ ] showBarBackground：pad=0 占分类 90% 宽；pad>0 贴柱（柱宽+2×pad）
- [ ] blockWidth：分类严格等宽，容器 resize 后十字仍落边界
- [ ] 数据变化一帧内重绘无错位；连续变化无残留
- [ ] 卸载 / 路由切换无 disposed instance 报错，监听已移除
- [ ] tooltip 符合 FR-2（深色底、千分位右对齐）

---

## 7. 已知偏离 / 待改进（与理想实现的差距，重建时可修正）

| 项 | 现状 | 风险 |
|----|------|------|
| gridLeft/gridRight 双源 | 绘制侧写死 40/20，与 option grid 独立 | legendPosition='right' 时右侧角标会画进图例区 |
| catGap=0.5 镜像 | 与 series 写死的 barCategoryGap:'50%' 双份 | 改一处漏一处 |
| blockPx 重复计算 | 装饰 2 / 4 各算一遍 | 逻辑漂移风险 |
| 单文件 ~1000 行 | 未拆分 | 阅读 / review 成本 |

---

## 8. 相关文档

- [概述与使用示例](./index.md)
- [技术实现与边界](./reference.md)
- [能力构建推导](./implementation-notes.md)
