# rc-bar3d-line · 伪 3D 立方体渲染规格（design-first）

> 逆向自 `web/components/ui/rc-echarts/bar3d-line/utils.ts` 的 buildCubeOption。
> 本文档是 renderItem 的完整绘制规格，按此可实现像素级一致的伪 3D 柱。

## 设计目标

不用 echarts-gl，用 echarts `custom` series + `renderItem` 以 2D polygon 手绘立方体：**顶面向右上偏移 + 各面明度差**制造立体错觉。开销等同普通 custom series，适合大屏多图共存。

## 入口转换

`buildCubeOption(opts)` 仅当 `opts.type === 'Bar3D.Cube3'` 时生效（否则返回 null），输出：

```
{ ...opts, type: 'custom', renderItem: <见下> }
```

itemStyle 处理：`itemStyle = merge(cloneDeep(DEFAULT_CUBE_ITEMSTYLE), opts.itemStyle ?? {})`（深合并，用户配置覆盖默认）。

## 默认配色（DEFAULT_CUBE_ITEMSTYLE，逐字段）

```
top:    fill = 线性渐变 (0,0)→(0,1)：0% '#00EEFF' → 100% '#00DBAD'
left:   fill = 线性渐变 (0,0)→(0,1)：0% '#00C1DA' → 100% '#00BE8C'，opacity 1，stroke '#00BE8C'
right:  fill = 线性渐变 (0,0)→(0,1)：0% '#00BAD1' → 100% '#00AE85'，opacity 0.7，stroke '#00AE85'
bottom: opacity 0（不可见）
```

所有渐变 `type:'linear', global:false`。

## renderItem(params, api) 绘制算法

```
hasStack = 'stack' in opts                      # 堆叠模式：value 列含义变化
colTop    = hasStack ? 2 : 1                    # 顶值所在 dataItem 列
startPoint = api.coord([api.value(0), api.value(colTop)])            # 柱顶屏幕坐标
endPoint   = api.coord([api.value(0), api.value(colTop) - api.value(1)])  # 柱底（顶值-自身高度）

currentSeriesIndices = api.currentSeriesIndices()
[barLayout] = api.barLayout({
  barGap: opts.barGap || '30%',          # 注意是 ||（falsy 覆盖），非 ??：传 0/'' 也会落回默认
  barCategoryGap: opts.barCategoryGap || '20%',
  count: max(currentSeriesIndices.length - 1, 1),
  barWidth: opts.barWidth ?? 22,
})
barWidthOffsetX = barLayout?.width / 2   # 可选链：barLayout 为 undefined 时结果为 NaN（透传 echarts 容错，柱不渲染面）
topFaceHeight = 10          # 顶面向上"厚度"，px
offX = opts.barOffsetX || 0 # 整柱横向平移（多系列错位），同样是 || 语义
```

返回 `{ type:'group', children: [...] }`，children 为 4 个 polygon + 可选 label：

**top-face**（平行四边形，4 点顺时针）：

```
P1 = [start.x + offX,                    start.y]
P2 = [start.x + offX + 0.8*bwOff,        start.y - topH/2]
P3 = [start.x + offX,                    start.y - topH]
P4 = [start.x + offX - bwOff,            start.y - topH/2]
style = itemStyle.top
```

**bottom-face**：同 top-face 几何但用 `endPoint`，style = itemStyle.bottom（opacity 0，不可见）。

**left-face**（左侧面矩形，注意有 -4px 微调）：

```
[start.x+offX, start.y]
[start.x+offX - bwOff, start.y - 4]
[end.x+offX   - bwOff, end.y   - 4]
[end.x+offX,          end.y]
style = itemStyle.left
```

**right-face**（右侧面平行四边形）：

```
[start.x+offX,          start.y]
[end.x+offX,            end.y]
[end.x+offX + 0.8*bwOff, end.y - 4]
[start.x+offX + 0.8*bwOff, start.y - 4]
style = itemStyle.right
```

**label**（仅当 `opts.label.show`）：

```
type:'text'
style = api.style({ color:'#fff', fontSize:16, textAlign:'center', ...opts.label.textStyle })
追加覆盖: textStrokeWidth = 0
text = opts.label.formatter?.(get(opts, `data.${params.dataIndex}.__rawData`)) ?? ''
x = start.x, y = start.y - 30          # 柱顶上方 30px
```

## 坐标系要点

- `api.value(0)` = 类目索引；`api.value(1)` = 数值。堆叠时 dataItem 为 `[cat, value, cumulative]`，顶取列 2、底取 `列2 - 列1`。
- `api.coord([x, y])` 返回屏幕像素坐标；所有面坐标都是屏幕系下的绝对点。
- `api.barLayout` 的 count 传 `系列数-1（至少 1）`：让 echarts 按并排柱布局计算单柱宽度。
- `barWidth` 默认 22px 是柱"正面"宽度；顶面/右面的 `0.8*bwOff` 是立体透视的横向收缩系数。

## 交互

柱体点击复用组件层 `onEvents: { click: onHandleBarClick }`（custom series 的 group/polygon 点击会冒泡为该 series 的 click 事件，params.dataIndex 可定位数据行）。
