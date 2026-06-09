# 主组件 index.tsx 职责

[EmergencyResources/index.tsx](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support-next/apps/main/app/components/left/emergency-resources/index.tsx) 是整个模块的中枢。

## 职责概览

| 职责 | 说明 |
| --- | --- |
| 环境配置读取 | 刷新间隔、x 轴排序、x 轴换行、详情弹窗列宽配置 |
| 全局状态订阅 | `supportTask`（作为 `taskId`）、`currentZone`（`zoneId`/`zoneLevel`） |
| 柱图数据拉取 | 4 类柱图 API（实时出动 / 跨市调度 / 本地预置 / 全量资源） |
| 图表配置生成 | ECharts `option`（按当前页签） |
| 弹窗派发 | 弹窗标题、详情组件分发、配置 key 三处 |
| 列宽配置注入 | 读取 `detailModal.<key>` 后透传 `tableColumnsSettings` 给详情组件 |

## 状态机

```typescript
const [state, setState] = useSetState({
    modalVisible: false,        // 弹窗可见
    resourceType: "",           // 选中的资源类型（柱图点击时设置）
    resourcesTypeSelected: "实时出动",  // 当前页签
    disabledDraggable: true,    // 拖拽控制
    _modalSource: null as null | "bar",  // 弹窗来源：bar=柱状图点击，null=资源清单按钮
});
```

## 弹窗派发一致性

主组件中 **3 处** 对当前弹窗的判断/派发必须保持完全一致，便于团队维护：

| 位置 | 作用 | 写法 |
| --- | --- | --- |
| L430-431 | `currentDetailKey` 配置 key | `?:` 链式 |
| L523-531 | 弹窗标题 | `?:` 链式 |
| L565-600 | 详情组件分发 | `?:` 链式 |

```text
"跨市调度"  →  标题: "跨市调度清单"  /  组件: CrossCityDetail  /  key: "跨市调度"
"全量资源"  →  标题: "全量资源清单"  /  组件: FullDetail       /  key: "全量资源"
"实时出动"  →  标题: "实时资源清单"  /  组件: Detail           /  key: "实时出动"
resourceType === "队伍"  →  标题: "本地队伍预置"  /  组件: PresetTeamDetail /  key: "本地预置-队伍"
其他（默认）→  标题: "预置资源清单"  /  组件: PresetDetail      /  key: "本地预置"
```

新增页签时三处要同步更新。

## 弹窗来源区分（弹窗宽度）

通过 `_modalSource` 区分两种触发方式，使用不同的宽度配置：

| 触发方式 | `_modalSource` | 宽度配置 | 配置缺省时的兜底 |
| --- | --- | --- | --- |
| 点击柱状图 | `"bar"` | `barModalWidth` | 由 `Modal` 的 `width={modalWidth ?? 1900}` 兜底为 **1900**（已移除 `?? 900`） |
| 点击"资源清单"按钮 | `null` | `width` | **1900**（代码内 `?? 1900`） |

`handleChartClick` 设置 `_modalSource: "bar"`；资源清单按钮 onClick 必须显式重置 `_modalSource: null`；关闭弹窗 onCancel 也重置为 `null`。

```typescript
// 模态框宽度：柱状图点击时优先使用 barModalWidth，否则使用 width（默认 1900）
const modalWidth = state._modalSource === "bar"
    ? currentDetailSettings?.barModalWidth
    : (currentDetailSettings?.width ?? 1900);
// ...
<Modal width={modalWidth ?? 1900} ... />
```

详见 [modal-config.md](modal-config.md)。

## 相关文档

- [chart.md](chart.md) — 图表规则
- [detail.md](detail.md) — 详情组件
- [api.md](api.md) — API 入参与响应
- [modal-config.md](modal-config.md) — 列宽配置
- [style.md](style.md) — 样式
