# rc-gauge（Gauge）· 半环仪表盘

> 源码位置：`web/components/ui/rc-echarts/gauge/`（index.tsx 组件 + utils.ts 配方）
> 本文档目标是**脱离源码即可理解该组件是什么、怎么用、怎么实现的**。

## 1. 这是什么

一个开口朝下的 **180° 半环仪表盘**（表盘在上半圆），取值范围固定 0~1，中央显示百分比数字。视觉构成：深蓝底盘环 + 青色进度弧 + 刻度 + 一根细指针 + 中心锚点圆 + 一根穿过中心的粗"胶囊"指针。

渲染效果示意：

```
        ╭─────────────────────╮
      ╭╯ ▓▓▓▓▓▓░░░░░░░░░░░░░░ ╲╮     ▓ = 进度弧(progressColor #19A4FC)
     ╭╯ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ ╲╮   ░ = 底盘环(#1a315e, 宽10)
     │ ╎ ╎ ╎ ╎ ╎ ╎ ╎ ╎ ╎ ╎ ╎ ╎ │   ╎ = 刻度(splitNumber 10)
     │        86%                │   ← 中央偏上白字 23px（value×100）
     │          ●                │   ← 中心锚点圆(边 #1EE7E7, 心 #1890FF)
     │          ║                │   ← 粗圆头指针(#1DD2FF, 边 #1890FF)
     ╰──────────╨──────────────╯     ← 开口朝下（startAngle 180 → endAngle 0）
```

技术上是**两个 echarts gauge series 叠加**（z:1 底层 + z:2 顶层）：一层管"环 + 刻度 + 进度 + 细针 + 锚点"，另一层只管"粗指针 + 中央数字"。拆两层是为了避免单 series 里指针样式与 detail 文字位置互相牵制。

## 2. 怎么用

```tsx
<Gauge
  value={0.86}            // 0~1 小数；>1 会溢出环
  radius={77}             // 仪表半径 px，默认 77（154/2）
  center={['50%', '50%']} // 中心位置
  progressColor="#19A4FC"    // 进度弧颜色
  pointerColor="#1DD2FF"     // 粗指针填充
  pointerBorderColor="#1890FF" // 粗指针描边
  className="..."          // 透传给图表容器
/>
```

- 父容器需给定高度（组件 `style={{height:'100%'}}`）。
- 百分比由内部 formatter 完成（`value×100 + '%'`，用项目 `~/web/utils/decimal` 的 Decimal 计算），**不要传 86 想显示 86%**。

## 3. 内部实现原理

### 3.1 组件层（index.tsx）

props 经 `useMemorizedObject`（`web/hooks/useMemorizedObject`，深比较记忆化）处理后再进 `useMemo(() => getOption(cfg))`——内联对象 props 不会引起 option 重算。

渲染包裹在 `<ReactIntersectionObserver>` 里（规格见 `../rc-shared/overview.md`）：**进入视口前完全不渲染 ECharts 实例**。注意离开视口会卸载子树、再次进入重建。

### 3.2 option 结构

完整逐字段规格（含默认值与设计决策）见 `option-spec.md`。要点概述：

两 series 共享 common 基座：

```
type:'gauge'，startAngle:180 → endAngle:0（上开口朝下）
min:0, max:1, splitNumber:10
axisLabel / title 隐藏
axisTick:  distance:10, length:9, 8 分段
splitLine: distance:10, length:12
数据固定 [{ value, name: 'Grade Rating' }]
```

底层 series（name '指标'，z:1）：

| 元素 | 配置 |
| --- | --- |
| progress | show:true，颜色 progressColor |
| axisLine | 宽 10，底色 `[[1,'#1a315e']]` |
| pointer | 细针：长 `radius-15`、宽 4、showAbove（颜色未显式配置，走 echarts 默认） |
| anchor | 中心圆：size 10、描边 3px `#1EE7E7`、填充 `#1890FF` |
| detail | 隐藏 |

顶层 series（name '指标-1'，z:2），只保留：

| 元素 | 配置 |
| --- | --- |
| pointer | `icon:'circle'` 圆头粗针：长 `radius*2-10`、宽 12、描边 5px pointerBorderColor、填充 pointerColor（视觉为穿过中心的胶囊棒） |
| detail | show:true，`offsetCenter:[0,'-35%']` 白字 23px，formatter `Decimal.mul(value,100).toNumber()+'%'`，`valueAnimation:false` |

其余（axisLine/anchor/axisTick/splitLine/progress）全部关闭。

### 3.3 外部依赖

`ReactECharts`（`web/components/large-screen/lib`）；`useMemorizedObject`；`Decimal`（`~/web/utils/decimal`）。

## 4. 使用陷阱

- 值域硬编码 0~1，传百分数值（如 86）会直接打满/溢出。
- 无 tooltip、无交互回调（未暴露 onEvents）。
- 依赖 IntersectionObserver 懒加载：若父容器初始 display:none 或高度为 0，可能不触发首渲染。
