# rc-bar3d-line（Bar3dLineChart）· 3D 柱 + 折线混合图

> 源码位置：`web/components/ui/rc-echarts/bar3d-line/`（index.tsx 组件 + utils.ts 配方）
> 本文档目标是**脱离源码即可理解该组件是什么、怎么用、怎么实现的**。

## 1. 这是什么

一个面向大屏深色风格的 ECharts 混合图表 React 组件：**伪 3D 立方体柱 + 折线 + 水平标记线**，双 Y 轴（柱走左轴、线走右轴）。输入是后端常见的"扁平指标行"数组，组件内部自动装配成完整的 echarts option。

渲染效果示意（俯视柱体，顶面向右上偏移形成立体感）：

```
 图例(右上)                     ── 折线(右轴, z 上层)
      ●━━●━╮
     ╱    ╲╲____              ╭─╮
    ╱ 顶面 ╱     ╲___         │ │ ← 顶面: 最亮渐变(#00EEFF→#00DBAD)
   ╱______╱                    │ ╲
   │左面  │右面                │  ╲ ← 右面: 稍暗, opacity 0.7
   │(渐变)│(暗)                │   │
   │      │                    │   │ ← 左面: 垂直渐变(#00C1DA→#00BE8C)
   └──────┘╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ← markerLine: 水平虚线标线(置顶, silent)
   类目1   类目2   类目3        (X 轴: 白字 16px, 轴线 #B9C8DC)
```

关键认知：**"3D" 是假的**。`Bar3D.Cube3` 不是 echarts 内置类型，而是组件内部自定义的标记字符串，会被转换成 echarts 的 `custom` 系列，用 `renderItem` 函数以 2D 多边形（polygon）手绘出立方体的 4 个面，靠"顶面/右面向右上偏移 + 亮度差"制造立体错觉。与 echarts-gl 无关，性能开销就是普通 custom series。

## 2. 怎么用

```tsx
<Bar3dLineChart
  dataSource={[
    // 扁平指标行：一行 = 一个 (系列, 类目) 交叉点的值
    { indicatorGroup: 'g1', indicatorGroupName: '故障数', indicatorName: '西安', indicatorValue: 120 },
    { indicatorGroup: 'g1', indicatorGroupName: '故障数', indicatorName: '咸阳', indicatorValue: 80 },
    { indicatorGroup: 'g2', indicatorGroupName: '处理率', indicatorName: '西安', indicatorValue: 0.92 },
    { indicatorGroup: 'g2', indicatorGroupName: '处理率', indicatorName: '咸阳', indicatorValue: 0.85 },
    { indicatorGroup: 'g3', indicatorGroupName: '目标线', indicatorName: 'x',  indicatorValue: 0.9 },
  ]}
  seriesSettings={[
    // id 匹配 dataSource 的 indicatorGroup，决定该组数据画成什么
    { id: 'g1', type: SeriesType.Bar3D },                                        // 3D 柱
    { id: 'g2', type: SeriesType.Line, legend: { name: '处理率' } },             // 折线
    { id: 'g3', type: SeriesType.MarkerLine },                                   // 标记线
  ]}
  optionBuilder={(opt) => opt}   // 可选：最终 option 的整体改写钩子
  onHandleBarClick={(params) => {}} // 可选：图表 click 回调
  yAxisLeft={{}}  yAxisRight={{}}  // 可选：双 Y 轴配置覆盖
  legend={{}}                       // 可选：legend 配置覆盖（data 由内部生成）
/>
```

`SeriesType` 枚举（从组件文件 re-export）：`'Bar3D.Cube3' | 'line' | 'markerLine'`。

字段含义速查：

| dataSource 字段 | 作用 |
| --- | --- |
| `indicatorGroup` | 系列归属键，匹配 seriesSettings[].id；匹配不上的行**被丢弃** |
| `indicatorGroupName` | 系列/图例名称 |
| `indicatorName` | X 轴类目（markerLine 行不占类目） |
| `indicatorValue` | 数值（markerLine 行须为数字或空串） |

seriesSettings 的 `seriesItem` 可传 echarts series 片段覆盖默认（Bar3D 的 itemStyle 按 `{ left, right, top, bottom }` 分面深合并到默认配色）。

## 3. 内部实现原理

### 3.1 数据装配（utils.ts 的 createSeries）

1. 逐行匹配配方 → 按 group 去重生成 legend、用 Set 收集 X 轴类目。
2. 三种类型各一个 `Map<group, seriesOpt>`，首遇某 group 初始化系列配置。
3. 数据点 push 进 series 的 data，每点附 `__rawData: 整行原始数据`（供 label formatter / 点击回调取上下文）。
4. 输出顺序固定 **line → Bar3D → markerLine**（标线最后，保证置顶）。

内部预设：

| 类型 | echarts type | yAxisIndex | 备注 |
| --- | --- | --- | --- |
| Bar3D | custom（转换后） | 0 左轴 | buildCubeOption 转换 |
| Line | line | 1 右轴 | |
| MarkerLine | line | 1 右轴 | `silent: true` |

**MarkerLine 特殊逻辑**：数据不进 data、不占类目，而是写 `seriesOpt.markLine.data = [{ name, yAxis: Number(value) }]`——整体覆盖式赋值，同 group 多行只有最后一行生效；`indicatorValue === ''` 时删除该组 legend 并跳过该行。

### 3.2 伪 3D 立方体（buildCubeOption，核心）

把 `type:'Bar3D.Cube3'` 的配置改写为 `type:'custom'` + `renderItem(params, api)`：

- 用 `api.coord()` 把 `(类目, 值)` 与 `(类目, 值-高度)` 换算成屏幕坐标，得柱顶 `startPoint`、柱底 `endPoint`（支持 stack 堆叠：堆叠时用第 2 列累计值定位）。
- 柱宽由 `api.barLayout({ barGap:'30%', barCategoryGap:'20%', count, barWidth:22 })` 计算。
- 返回 group，内含 4 个 polygon：

| 面 | 形状 | 默认样式 |
| --- | --- | --- |
| top | 平行四边形，向右上偏 `topFaceHeight=10`、宽 `barWidthOffsetX*0.8` | 最亮渐变 `#00EEFF→#00DBAD` |
| right | 右侧面 | 渐变 `#00BAD1→#00AE85`，opacity 0.7 |
| left | 左侧面 | 渐变 `#00C1DA→#00BE8C`，描边 `#00BE8C` |
| bottom | 同 top 形状 | `opacity: 0`（不可见，结构占位） |

- 所有面支持 `barOffsetX` 横向平移（多系列错位）。
- `label.show` 时追加 text 元素：位于柱顶上方 30px、白字 16px，文本由 `label.formatter(row.__rawData)` 生成。
- legend 项的 `itemStyle.color` 会被写到 series `itemStyle.color`（供 tooltip 取色）。

### 3.3 组件层（index.tsx）

- `optionBuilder` 存 `useLatest` ref，不参与 useMemo 依赖——内联函数不会触发重算，闭包更新即时生效。
- 默认布局：grid `{left:50, top:60, right:50, bottom:30}`；tooltip axis+shadow 触发；legend 右上白字 16px；双 value Y 轴 `alignTicks:true`、splitLine `#F2F2F2` 20% 透明。
- `<ReactECharts option replaceMerge={['series','xAxis']} onEvents={{click}} />`：replaceMerge 保证系列数变化时整体替换、不残留旧系列。

### 3.4 外部依赖

`ReactECharts`（`web/components/large-screen/lib`，项目统一 ECharts 包装）；`useLatest`（`@fedx-web-common/react-hooks`）；`cloneDeep/merge/get/set`（`@fedx-web-common/utils`）。

## 4. 详细规格（重建用）

- 数据装配算法：`data-flow.md`（createSeries 逐行等价伪代码）
- 伪 3D 立方体绘制：`cube-render-spec.md`（renderItem 坐标公式与默认色值）
- 组件层与默认样式：`style-defaults.md`

## 5. 使用陷阱

- `onHandleBarClick` 未判空：不传时点击图表会抛错（内部 `props.onHandleBarClick(params)` 直接调用）。
- 各系列类目不齐时无补空对齐逻辑，柱/线会错位。
- markerLine 同 group 多行互相覆盖；`indicatorValue` 须为数字或 `''`。
- bar/line 的 value 直接透传 echarts（字符串数字可行，但 tooltip 排序等行为由 echarts 决定）。
