# rc-pie-3d（Pie3d）· 3D 立体饼图

> 源码位置：`web/components/ui/rc-echarts/pie-3d/`（index.tsx 组件 + utils.ts 配方）
> 本文档目标是**脱离源码即可理解该组件是什么、怎么用、怎么实现的**。

## 1. 这是什么

一个基于 **echarts-gl** 的立体（挤出式）饼图：每个扇区是一个独立的 `surface` 参数方程曲面（"弯曲的挤出体"），数值越大扇区越高，形似高低不一的 3D 切块蛋糕。环形内径比例约 45%，静态展示（正交投影、不可旋转缩放、全系列 silent 无鼠标交互、无 tooltip）。

渲染效果示意（斜俯视）：

```
        ▄▄▄▄▄
      ▄█▀▀▀▄█▄▄▄        █ = 高扇区（value 大 → h 大 → 挤出高）
     ▐█ ▄▄▄ █▄▄▄▌       ▄ = 低扇区
     ▐█ █▄▄█▐█▛▛▛▌       环形内径 ≈ 45%（中心镂空）
      ▀█▄▄▄█▀▀▀▀
        ▀▀▀▀▀            底部有透明底盘曲面遮挡穿帮
```

实现思路：echarts-gl 没有原生 3D 饼图，此组件用"参数方程曲面"经典方案——每个扇区生成一个 `type:'surface', parametric:true` 的 series，其参数方程在角度上把圆环截断成扇区、在高度上按 value 挤出。

## 2. 怎么用

```tsx
import 'echarts-gl' 已由组件内部导入，无需重复

<Pie3d
  data={[{ name: '移动', value: 120 }, { name: '联通', value: 60 }]}
  colors={['#00C1DA', '#00BE8C', ...]} // 颜色数组，按 index 循环：data[i % colors.length]
  extraOpts={{ viewControl: { autoRotate: true } }} // 可选，覆盖 grid3D.viewControl
/>
```

- `data` 为空（isEmpty）时返回 null，不渲染。
- 组件挂载后延迟一帧（requestAnimationFrame）再把外层 div 的 opacity 从 0 过渡到 1（0.3s linear）——避免 echarts-gl 初始化闪白。
- 必须传 `colors`（否则 `colors[i % colors.length]` 对 undefined 取模会出错；实际调用方均传入）。

## 3. 内部实现原理（utils.ts 的 getPie3dOption）

### 3.1 数值归一化

组件内部对 value 做 `d3.scaleLinear().domain([0, max]).range([0, 100]).clamp(true)` 线性映射（d3.max 取最大值）。所有值同乘一个比例，**扇区角度占比不变**；归一化的作用是把"挤出高度 h"统一到 0~100 量纲，保证不同数量级数据高度可控。负值会被 clamp 到 0。

内径比 `internalDiameterRatio` 由组件硬编码 0.45，换算曲面参数 `k = (1-0.45)/(1+0.45) ≈ 0.31`，k 控制扇区"管"的粗细（即环的内径）。

### 3.2 扇区参数方程（getParametricEquation）

每个扇区 series 的参数方程，自变量 `u`（角度方向，`-π ~ 3π`，步长 π/32）、`v`（径向/高度方向，`0 ~ 2π`，步长 π/20）：

- **x/y**：`offset + cos/sin(θ) * (1 + cos(v) * k) * hoverRate`。θ 取扇区范围 `[startRadian, endRadian]` 内的 u；**u 超出扇区范围时钳到边界值——这就是"从圆环上截出扇区"的方式**。
- **z（高度）**：`v` 上半程取 `1 * h * 0.1`（h = 归一化后的 value，值越大挤出越高），下半程取 -1（封底）；u 在 `-π/2 ~ 2.5π` 之外的边缘区域用 `sin(u)` / `sin(u)*h*0.1` 做端面封口。
- 扇区占比：按归一化 value 累计，`startRatio = startValue/sumValue`，`endRatio = endValue/sumValue`。
- **选中位移与 hover 放大（1.05）是死代码**：函数内 `isSelected` 被强制置 false，调用处 hover 也固定传 false，视觉不生效。

每个扇区 series 配置：`wireframe.show:false`、`silent:true`、私有字段 `pieData`（含 startRatio/endRatio）与 `pieStatus`。

### 3.3 三个透明底盘 series

数据扇区之后追加三个同名 `mouseoutSeries` 的 surface：`opacity:0`、`silent:true`，方程为"压扁的球"（`x/y = (sin(v)sin(u)+sin(u))/π * 系数`），z 值分层：

| 序号 | xy 系数 | z | 作用 |
| --- | --- | --- | --- |
| 1 | 2 | `cos(v)>0 ? 0.5 : 5` | 扇区下方封闭层 |
| 2 | 2 | `cos(v)>0 ? -5 : -7` | 更深层 |
| 3 | 2.2 | 恒 -7 | 最外圈底座 |

因 opacity 0 不可见，作用是遮挡扇区底部曲面边缘的穿帮/为布局提供参照。

### 3.4 全局 3D 配置

- `grid3D`: `show:false`、`left:'center'`、`width:'100%'`、`boxHeight:60`。
- `viewControl`: **正交投影** `projection:'orthographic'`、`orthographicSize:140`、`rotateSensitivity:0`、`zoomSensitivity:0`（静态、不可交互），`autoRotate` 默认关闭，可被 `extraOpts.viewControl` 覆盖。
- `xAxis3D/yAxis3D/zAxis3D` 均为空对象占位；`legend.show:false`。

### 3.5 组件层与外部依赖

`ReactECharts`（`web/components/large-screen/lib`）+ `replaceMerge={['series','grid3D']}` 防系列残留；`useMemorizedObject` 记忆化 extraOpts；`import 'echarts-gl'` 副作用导入注册 surface 类型；d3 仅用 `max` 与 `scaleLinear`。

## 4. 详细规格（重建用）

参数方程、归一化与完整 option 规格：`parametric-spec.md`。

## 5. 使用陷阱

- value 须可转数值，负值 clamp 到 0（高度为 0 的扁片）。
- 全系列 `silent:true`：无 tooltip、无点击。
- 颜色**只有一条路**：`colors` 数组按 index 循环分配。data 项自带的 `itemStyle`（含 color/opacity）会在组件层被**整体丢弃**——`{ ...d, itemStyle: { color: colors[i % colors.length] } }` 无条件重建 itemStyle，自带的 color/opacity 永远不生效。
- 高度映射依赖数据集内部最大值，**换一批数据高度比例会变**（相对高度，不是绝对值）。
