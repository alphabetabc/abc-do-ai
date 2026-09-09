# rc-bar3d-line · 数据装配规格（design-first）

> 逆向自 `web/components/ui/rc-echarts/bar3d-line/utils.ts`。
> 本文档是 createSeries 的完整算法规格，按此可实现等价的数据装配层。

## 输入

```ts
// 行式扁平数据（后端返回）
type Row = { indicatorGroup: string; indicatorGroupName: string; indicatorName: string; indicatorValue: any; [k: string]: any };

// 系列配方
type Setting = {
  id: string;               // 匹配 row.indicatorGroup
  type: 'Bar3D.Cube3' | 'line' | 'markerLine';
  legend?: { name?: string; lineStyle?: any; itemStyle?: any };
  seriesItem?: any;         // echarts series 片段覆盖（Bar3D 的 itemStyle 结构特殊，见 cube-render-spec）
};
```

## 类型系统

```ts
enum SeriesType {
  Bar3D = 'Bar3D.Cube3',    // 内部标记，非 echarts 内置，装配时转换为 custom
  Line = 'line',
  MarkerLine = 'markerLine',
}

const internalSettings = {
  [SeriesType.Bar3D]:      { type: 'Bar3D.Cube3', yAxisIndex: 0 },
  [SeriesType.Line]:       { type: 'line',        yAxisIndex: 1 },
  [SeriesType.MarkerLine]: { type: 'line',        yAxisIndex: 1, silent: true },
};
```

## 算法（伪代码，逐行等价）

```
状态:
  seriesMap = { Bar3D: Map<group, opt>, Line: Map<group, opt>, MarkerLine: Map<group, opt> }
  legendDataMap = Map<group, legendItem>
  xAxisData = Set<indicatorName>
  colors = Set()   // 历史遗留：只 add 被注释掉了，恒为空数组

for row in rows:
  settingItem = settings.find(s => s.id === row.indicatorGroup)
  if (!settingItem) continue                      # 1. 无配方行直接丢弃

  # 2. legend 去重登记（名称取 indicatorGroupName）
  if (!legendDataMap.has(row.indicatorGroup)):
    legendDataMap.set(group, { ...settingItem.legend, name: row.indicatorGroupName })

  # 3. 系列懒初始化
  if (!seriesMap[settingItem.type].has(group)):
    if (type === Bar3D):
      seriesOpt = buildCubeOption({                                # 见 cube-render-spec
        ...cloneDeep(settingItem.seriesItem ?? {}),
        ...cloneDeep(internalSettings[type]),
        __seriesType: type, name: row.indicatorGroupName, data: [],
      })
      legendColor = get(legendItem, 'itemStyle.color')             # tooltip 取色
      if (legendColor) set(seriesOpt, 'itemStyle.color', legendColor)
    else:
      seriesOpt = {
        ...(settingItem.seriesItem ?? {}),
        ...internalSettings[type],
        __seriesType: type, name: row.indicatorGroupName, data: [],
      }
      # 注意：非 Bar3D 分支 seriesItem 是浅拷贝（非 cloneDeep）
    seriesMap[type].set(group, seriesOpt)

  # 4. 数据写入
  if (type !== MarkerLine):
    seriesOpt.data.push({ name: row.indicatorName, value: row.indicatorValue, __rawData: row })
    xAxisData.add(row.indicatorName)
  else:
    if (row.indicatorValue === '') { legendDataMap.delete(group); continue }
    seriesOpt.markLine = { data: [{ name: row.indicatorName, yAxis: Number(row.indicatorValue) }] }
    # 整体覆盖式赋值：同 group 多行只有最后一行生效；markLine 无 seriesOpt.markLine 初始化，
    # 首次写入前 markLine.data 路径为 undefined，直接整体赋值即建立。

return {
  legendData: [...legendDataMap.values()],
  xAxisData:  [...xAxisData.values()],     # Set 无序插入序即遍历序
  colors:     [...colors],                 # 恒 []
  series: [...Line.values(), ...Bar3D.values(), ...MarkerLine.values()],   # 顺序固定
}
```

## 关键决策（为什么这样设计）

1. **line 在前、Bar3D 居中、markerLine 最后**：echarts 后声明的 series 绘制在上层，保证标线永远置顶可见；线先声明避免完全盖住柱。
2. **数据点携带 `__rawData`**：柱体 label 的 formatter 与点击回调需要原始行上下文（含 group 之外的扩展字段），echarts dataItem 允许任意附加字段。
3. **markerLine 不占 X 轴类目**：标线是"值域参考线"，与类目无关；空串值语义为"该组无数据"，连带清除 legend。
4. **Bar3D 的 seriesItem 用 cloneDeep、line 用浅拷贝**：Bar3D 的 itemStyle 要与默认配色深合并（merge），避免共享引用污染默认模板；line 无合并需求。
5. **legend 项来自配方而非数据**：颜色/线型等由 seriesSettings.legend 统一给出，`itemStyle.color` 同时回写 series 供 tooltip 使用。

## 输出消费方

`createSeries` 结果由组件层（index.tsx）组装为完整 option，布局/轴/legend 默认样式见 `style-defaults.md`。
