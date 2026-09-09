# 图表规则

ECharts 柱图配置的核心规则。

## 数据选择

主组件通过 `state.resourcesTypeSelected` 选择当前数据：

```typescript
const dataMap = {
    本地预置: dataPreset,
    实时出动: dataRealTime,
    全量资源: dataFull,
    跨市调度: dataCrossCity,
};
```

## x 轴排序

资源类型先按 `environment.json` 中的 `xAxisValueOrder` 排序，未配置的资源类型追加到末尾。

## x 轴文案格式化

当当前页签在 `xAxisValueFormatter.tabType` 中时，用 `xAxisValueFormatter.dict[value]` 替换 x 轴展示文案。常用于长资源名换行，例如 `应急\n发电车`。

## 柱图类型

| 页签 | 柱图规则 |
| --- | --- |
| 实时出动 | 按 `typeName` 动态生成堆叠柱 |
| 全量资源 | 按 `typeName` 动态生成堆叠柱 |
| 本地预置 | 固定两组非堆叠柱：`计划预置`、`实际到达` |
| 跨市调度 | 固定三组非堆叠柱：`总计`、`到达`、`在途` |

## 0 值展示

图表将 0 值渲染为 `maxYValue * 0.01`（保留柱形可见），并通过 `yRaw` 保留真实值，label 和 tooltip 应显示 `yRaw`。

## 单位换算

图表 API 中存在换算逻辑：

- `光缆`：通常按米转公里，`parseInt(y) / 1000`
- `接头盒`：按百单位展示，`parseInt(y) / 100`
- 其他资源：`Number(y) || 0`

维护 tooltip、label 或详情数据时要确认图表值与详情值是否需要保持同一单位。

## 相关文档

- [main.md](main.md) — 主组件
- [api.md](api.md) — API
- [detail.md](detail.md) — 详情组件
