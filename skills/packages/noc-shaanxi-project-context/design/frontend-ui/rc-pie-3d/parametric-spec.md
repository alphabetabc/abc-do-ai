# rc-pie-3d · 参数方程与 option 规格（design-first）

> 逆向自 `web/components/ui/rc-echarts/pie-3d/utils.ts`（getPie3dOption / getParametricEquation）与 index.tsx。
> 按此规格可用 echarts-gl surface 系列重建等价的立体饼图。

## 组件层规格

```
props: { data: Array<{name, value}>, colors: string[], extraOpts?: { viewControl? } }
if (isEmpty(data)) return null
# 注意：data 项自带的 itemStyle 在此被整体丢弃（itemStyle 被无条件重建为 { color: colors[i % len] }）
pieData = data.map((d,i) => ({ ...d, itemStyle:{ color: colors[i % colors.length] } }))
memoExtraOpts = useMemorizedObject(extraOpts)   # 仅 extraOpts 深比较记忆化
option = useMemo(() => getPie3dOption(pieData, 0.45, memoExtraOpts), [props.data, props.colors, memoExtraOpts])
  # props.data / props.colors 是原始引用依赖，未记忆化：调用方每次 render 传新数组字面量即触发重算
挂载后 requestAnimationFrame 延迟一帧 setVisible(true)，外层 div opacity 0→1（transition 0.3s linear）——防 echarts-gl 初始化闪白
render: <ReactECharts option replaceMerge={['series','grid3D']} style={{height:'100%'}} />
import 'echarts-gl'（副作用注册 surface 类型）
```

## getPie3dOption(input, internalDiameterRatio=0.45, extraOpts)

### 步骤 1：数值归一化

```
k = (1 - 0.45) / (1 + 0.45)                          # ≈ 0.3103，控制扇区"管"粗细（内径）
max = d3.max(pieData, d => +d.value)
scale = d3.scaleLinear().domain([0,max]).range([0,100]).clamp(true)
每个 d.value = scale(+d.value)
```

归一化是等比缩放：**角度占比不变**（占比按归一化值算），作用是把挤出高度 h 统一 0~100 量纲。负值 clamp 到 0。

### 步骤 2：每数据项一个 surface series

```
{
  name: d.name ?? `series${i}`,
  type:'surface', parametric:true,
  wireframe:{ show:false },
  pieData: d,                    # 私有：携带 startRatio/endRatio
  pieStatus: { selected:false, hovered:false, k: 1/10 },   # 1/10 为遗留值，方程实际用外部 k
  silent:true,
  itemStyle: { color?, opacity? }（从 d.itemStyle 拷贝存在的字段）
}
```

### 步骤 3：扇区角度分配

```
sumValue = Σ 归一化值
逐 series：end = start + value
  pieData.startRatio = start / sumValue
  pieData.endRatio   = end / sumValue
  parametricEquation = getParametricEquation(startRatio, endRatio, false, false, k, pieData.value)
```

### 步骤 4：getParametricEquation(startRatio, endRatio, isSelected, isHovered, k, h)

```
startRadian = startRatio * 2π; endRadian = endRatio * 2π; midRadian = 中点 * 2π
isSelected 被强制置 false（选中位移恒 0，功能禁用）
hoverRate = isHovered ? 1.05 : 1（调用处固定 false，实际恒 1——hover 放大为死代码）
k 未传时默认 1/3

u: { min:-π, max:3π, step:π/32 }      # 角度方向
v: { min:0,  max:2π, step:π/20 }      # 径向/高度方向

x(u,v) = offsetX + cos(θ) * (1 + cos(v)*k) * hoverRate
y(u,v) = offsetY + sin(θ) * (1 + cos(v)*k) * hoverRate
  其中 θ = clamp(u, startRadian, endRadian)      # u 超出扇区钳到边界 = 从圆环截出扇区
z(u,v):
  u < -π/2        → sin(u)
  u > 2.5π        → sin(u) * h * 0.1
  sin(v) > 0      → 1 * h * 0.1        # 挤出高度，h 即归一化 value → 值大柱高
  否则            → -1                 # 封底
```

### 步骤 5：三个透明底盘 series（name 均 'mouseoutSeries'）

```
公共：silent:true, type:'surface', parametric:true, wireframe:{show:false},
     itemStyle:{ opacity:0, color:'#E1E8EC' }
方程（"压扁球"）：
  u: { min:0, max:2π, step:π/20 }, v: { min:0, max:π, step:π/20 }
  x = ((sin(v)*sin(u) + sin(u)) / π) * C
  y = ((sin(v)*cos(u) + cos(u)) / π) * C

  #1: C=2,   z = cos(v)>0 ? 0.5 : 5
  #2: C=2,   z = cos(v)>0 ? -5 : -7
  #3: C=2.2, z = -7（恒定）
```

### 步骤 6：顶层 option

```
legend: { show:false, textStyle:{ fontSize:18 }, data: legendData, formatter: p => p }
xAxis3D / yAxis3D / zAxis3D: {}
grid3D: {
  viewControl: { projection:'orthographic', orthographicSize:140,
                 rotateSensitivity:0, zoomSensitivity:0, ...extraOpts?.viewControl },   # autoRotate 默认关
  left:'center', width:'100%', show:false, boxHeight:60,
}
series: [ 扇区们..., 底盘#1, #2, #3 ]
```

## 设计决策

1. **surface 参数方程而非 pie3d**：echarts-gl 无原生 3D 饼，业界通用方案即"每扇区一个参数方程曲面"。
2. **高度归一化**：跨数据集高度量纲统一；代价是**高度为相对值**（依赖当前数据集 max）。
3. **正交投影 + 交互全关**：静态展示图，正交投影保证形状不随视角畸变。
4. **silent 全系列 + 透明底盘**：无 tooltip 无点击；底盘遮扇区底面边缘穿帮。
