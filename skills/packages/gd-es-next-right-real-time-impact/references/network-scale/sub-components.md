# 子组件 Props 速查

> 📌 本文只列**所有子组件的 Props 接口**。组件如何被使用 / 渲染流程 / 状态机请看：
> - 主组件渲染：[main-render-flow.md](./main-render-flow.md)
> - 轮播组件设计：[carousel-components.md](./carousel-components.md)
> - 详情弹窗：[detail-component.md](./detail-component.md)
> - 故障清单弹窗：[fault-list-table.md](./fault-list-table.md)

---

## 目录

- [§1 SimpleCard（单指标卡片）](#1-simplecard单指标卡片)
- [§2 MultiCard（多指标卡片）](#2-multicard多指标卡片)
- [§3 CarouselNormal（普通轮播）](#3-carouselnormal普通轮播)
- [§4 CarouselSection（分段轮播）](#4-carouselsection分段轮播)
- [§5 Detail（详情弹窗）](#5-detail详情弹窗)
- [§6 FaultListTable（故障清单弹窗）](#6-faultlisttable故障清单弹窗)
- [§7 DetailChartOption（图表配置）](#7-detailchartoption图表配置)

---

## 1. SimpleCard（单指标卡片）

**适用场景**：1-2 个指标（主组件中 `item.items.length <= 2`）。
**文件**：`apps/main/app/components/right/network-compact/network-scale/SimpleCard.tsx`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | 指标 ID |
| `currentItem` | `object` | ✅ | 当前指标数据（来自 `items[]`） |
| `activeItem` | `object` | ❌ | 当前激活的指标 |
| `isActive` | `boolean` | ❌ | 是否激活（与 `activeItem.id === currentItem.id` 计算） |
| `onClick` | `(item) => void` | ✅ | 点击事件处理（详见 [principles.md §3](./principles.md#3-正确做法配置驱动)） |

**颜色状态**：有值(红) / 零值(白) / 激活(黄)

---

## 2. MultiCard（多指标卡片）

**适用场景**：3 个以上指标（主组件中 `item.items.length > 2`）。
**文件**：`apps/main/app/components/right/network-compact/network-scale/MultiCard.tsx`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | `array` | ✅ | 多个指标数据 |
| `activeItem` | `object` | ❌ | 当前激活的指标 |
| `onClick` | `(item) => void` | ✅ | 点击事件处理 |

**布局**：第一个指标顶部（主值 + 资源数 + 百分比），其余指标以进度条展示。

**切换条件**（主组件 `index.tsx`）：

```typescript
if (item.items.length > 2) {
    // 使用 MultiCard
} else {
    // 使用 SimpleCard
}
```

> ⚠️ 该阈值硬编码在主组件中，**不建议配置化**。详见 [main-render-flow.md §7.4](./main-render-flow.md#74-调整卡片分发阈值)。

---

## 3. CarouselNormal（普通轮播）

**适用场景**：分组无 `groupViewType` 或值非 `"carouselSection"`。
**文件**：`apps/main/app/components/right/network-compact/network-scale/CarouselNormal.tsx`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | ✅ | 轮播标题（显示在轮播外部） |
| `items` | `array` | ✅ | 指标数组（来自 `viewItemDataTemplate.items`） |
| `groupViews` | `array` | ❌ | 组合视图数组 |
| `activeItem` | `object` | ❌ | 当前激活的指标 |
| `onItemClick` | `(item) => void` | ✅ | 点击事件处理 |

**设计理念与选型**：[carousel-components.md §2](./carousel-components.md#2-组件化架构设计理念)

---

## 4. CarouselSection（分段轮播）

**适用场景**：分组设置 `groupViewType: "carouselSection"`。
**文件**：`apps/main/app/components/right/network-compact/network-scale/CarouselSection.tsx`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `groupViews` | `array` | ✅ | 分段视图数组（每个 section 含 `id` / `label` / `children`） |
| `items` | `array` | ✅ | 指标数组 |
| `activeItem` | `object` | ❌ | 当前激活的指标 |
| `onItemClick` | `(item) => void` | ✅ | 点击事件处理 |

> 💡 标题在每个 section 内部显示（与 `CarouselNormal` 不同）。

---

## 5. Detail（详情弹窗）

**适用场景**：用户点击卡片后展示折线图 + 柱状图。
**文件**：`apps/main/app/components/right/network-compact/network-scale/Detail.tsx`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `indItem` | `object` | ✅ | 当前选中的指标项（来自 `currentActiveIndItem`） |
| `currentZone` | `object` | ✅ | 当前区域（用于 API 请求参数） |
| `modalVisible` | `boolean` | ❌ | 故障清单弹窗是否打开（仅控制链接颜色） |
| `onShowDetailList` | `(info) => void` | ✅ | 显示故障清单回调。`info.type = "all" \| "part"` |

**强制 remount**：`key={detail-${zoneId}}`（在主组件中传入），切换区域时销毁重建。详见 [detail-component.md §3](./detail-component.md#3-强制-remount-机制)。

---

## 6. FaultListTable（故障清单弹窗）

**适用场景**：从 Detail 弹窗中点击柱状图 / 故障清单链接后打开。
**文件**：`apps/main/app/components/right/network-compact/network-scale/FaultListTable.tsx`

| 属性 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | ✅ | 弹窗是否打开 |
| `getContainer` | `function` | ✅ | 透传给 Modal（通常传 `props.getRootContainer()`） |
| `onCancel` | `function` | ✅ | 关闭弹窗回调 |
| `currentZone` | `object` | ✅ | 当前区域 |
| `faultListTableInfo` | `object` | ✅ | `{ type: "all" \| "part", dataItem? }` |
| `currentIndItem` | `object` | ✅ | 当前选中的指标（含 `id`、`data.dataTime`） |

详见 [fault-list-table.md §2](./fault-list-table.md#2-组件-props)。

---

## 7. DetailChartOption（图表配置）

**文件**：`apps/main/app/components/right/network-compact/network-scale/DetailChartOption.tsx`

**职责**：集中管理趋势图（`useLineChartOption`）和柱状图（`useBarChartOption`）的 ECharts 配置。

> 💡 **修改图表样式（颜色 / 网格 / tooltip 等）应在此文件中调整**，不在 `Detail.tsx` 中硬编码。详见 [principles.md §1](./principles.md#1-核心原则)。
