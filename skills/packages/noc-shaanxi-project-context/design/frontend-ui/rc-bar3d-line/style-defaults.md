# rc-bar3d-line · 组件层与默认样式规格（design-first）

> 逆向自 `web/components/ui/rc-echarts/bar3d-line/index.tsx`。
> 组件装配层：props → 完整 echarts option 的映射规格。

## Props 契约

```ts
{
  legend?: object;         // legend 配置覆盖（展开合并，内部生成的 data 不可被覆盖掉——data 在 spread 之后赋值）
  seriesSettings?: Setting[];  // 见 data-flow.md
  dataSource: Row[];       // 必填
  yAxisLeft?: object;      // 左 Y 轴配置覆盖
  yAxisRight?: object;     // 右 Y 轴配置覆盖
  optionBuilder?: (opt) => opt;  // 最终 option 整体改写钩子，默认恒等
  onHandleBarClick?: (params) => void;  // 图表 click 回调（未判空！不传时点击会抛错）
}
```

## 计算图

```
props.dataSource / seriesSettings / legend
  └→ useMemo#1 → createSeries() → { xAxis, series, legend, colors }
props.yAxisLeft / yAxisRight
  └→ useMemo#2 → latest.current.optionBuilder({ colors, grid, tooltip, yAxis:[L,R], xAxis, series, legend })
  └→ <ReactECharts option replaceMerge={['series','xAxis']} onEvents={{click}} style={{height:'100%'}} />
```

- `optionBuilder` 存 `useLatest`（ref）：内联函数不触发 useMemo 重算，但闭包取值永远最新。
- `replaceMerge: ['series','xAxis']`：数据更新时系列数/类目数变化按整体替换处理，防止旧 series 残留。
- 外层 `<div className="full-width full-height">`：父级须给定尺寸。

## 默认样式常量（完整值）

**X 轴**（category）：

```
axisLabel: { color:'#fff', fontSize:16, interval:0, fontFamily:'MicrosoftYaHei' }
axisTick:  { show:false }
axisLine:  { show:true, color:'#B9C8DC' }
data: xAxisData（来自 createSeries）
```

**legend**：

```
right: 10
textStyle: { color:'#fff', fontSize:16, fontFamily:'MicrosoftYaHei' }
...props.legend（用户覆盖在前，内部 data 在后最终生效）
data: legendData
```

**Y 轴 × 2**（结构相同，分别被 yAxisLeft / yAxisRight 展开覆盖）：

```
type: 'value'
axisLabel: { color:'#fff', fontSize:14, fontFamily:'MicrosoftYaHei' }
axisTick:  { show:false }
axisLine:  { show:true, color:'#B9C8DC' }
alignTicks: true
splitLine: { lineStyle: { color:'#F2F2F2', opacity:0.2 } }
```

**grid**：`{ left:50, top:60, right:50, bottom:30 }`

**tooltip**：`{ show:true, trigger:'axis', axisPointer:{ type:'shadow' } }`

**colors**：`createSeries` 返回的空数组原样透传给 optionBuilder（顶层 color 字段，实际无效果，保留兼容）。

## 覆盖语义注意

- `...props.yAxisLeft` 在默认值**之后**展开：用户可用 `axisLabel: {...}` 整体替换默认 axisLabel（浅覆盖，非深合并）。
- legend 相反：用户 legend 先展开、`data` 后赋值，data 不可覆盖。
