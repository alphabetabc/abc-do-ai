# rc-gauge · option 生成规格（design-first）

> 逆向自 `web/components/ui/rc-echarts/gauge/utils.ts` 的 getOption 与 index.tsx。
> 按此规格可实现行为一致的半环仪表盘。

## 组件层规格

```
props: { className?, radius?, center?, value?, progressColor?, pointerColor?, pointerBorderColor? }
cfg = useMemorizedObject({ radius, center, value ?? 0, progressColor ?? '#19A4FC',
                           pointerColor ?? '#1DD2FF', pointerBorderColor ?? '#1890FF' })
option = useMemo(() => getOption(cfg), [cfg])      # 深比较记忆化，内联 props 不触发重算
render: <ReactIntersectionObserver><ReactECharts className style={{height:'100%'}} option /></ReactIntersectionObserver>
```

ReactIntersectionObserver 规格：进入视口前不渲染 ECharts（全局单例 IntersectionObserver，root=document.body，DOM→回调存 WeakMap，unobserve 用 isCancel 标志失效回调，observe 后调 takeRecords() 冲刷；容器 `<section style="width/height:100%;position:relative">`；离开视口卸载子树、再次进入重建）。

## getOption(cfg) 完整规格

cfg 默认值：`radius = 77`（154/2）、`center = ['50%','50%']`、`value = 0`、三色默认同上。

**common 基座**（两 series 共享）：

```
type: 'gauge'
startAngle: 180, endAngle: 0        # 开口朝下的上半圆
min: 0, max: 1                      # 值域硬编码 0~1
splitNumber: 10
axisLabel: { show:false }
title: { show:false }
center, radius                      # 透传
```

**数据**：`[{ value, name: 'Grade Rating' }]`（两 series 共用同一 data）。

**series[0]（name '指标'，z:1）—— 环 + 刻度 + 进度 + 细针 + 锚点**：

```
progress: { show:true, itemStyle:{ color: progressColor } }
axisLine: { lineStyle:{ width:10, color:[[1,'#1a315e']] } }
pointer:  { length: radius-15, width:4, showAbove:true }        # 颜色未配置，走 echarts 默认
anchor:   { show:true, size:10, icon:'circle', showAbove:true,
            itemStyle:{ borderWidth:3, borderColor:'#1EE7E7', color:'#1890FF' } }
axisTick:  { distance:10, length:9, splitNumber:8, lineStyle:{ width:1 } }
splitLine: { distance:10, length:12, lineStyle:{ width:1 } }
detail: { show:false }
```

**series[1]（name '指标-1'，z:2）—— 只保留粗指针 + 中央数字**：

```
progress: { show:false }
axisLine: { show:false }
pointer:  { show:true, icon:'circle', length: radius*2-10, width:12,
            itemStyle:{ color:pointerColor, borderColor:pointerBorderColor, borderWidth:5 } }
anchor: { show:false }
axisTick: { show:false }
splitLine:{ show:false }
detail: { show:true, fontSize:23, offsetCenter:[0,'-35%'], valueAnimation:false,
          color:'#fff',
          formatter: value => `${Decimal.mul(value, 100).toNumber()}%` }   # ~/web/utils/decimal
```

## 设计决策

1. **双层叠加**：底层管表盘语义（环/刻度/进度），顶层专管视觉焦点（胶囊指针 + 数字），避免单 series 中 pointer 样式与 detail 位置互相牵制。
2. **值域 0~1 + formatter ×100**：进度弧角度与百分比解耦，调用方传小数。
3. **`valueAnimation:false`**：大屏数据轮询时避免数字滚动动画闪烁。
4. **粗指针 `length: radius*2-10`**：圆头 icon 的 length 按直径语义使用，形成穿过中心的对称胶囊。
