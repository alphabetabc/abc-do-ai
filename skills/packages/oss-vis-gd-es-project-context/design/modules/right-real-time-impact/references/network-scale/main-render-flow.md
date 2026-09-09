# NetworkScale 主组件渲染流程

本文档详细描述 `apps/main/app/components/right/network-compact/network-scale/index.tsx` 的渲染分发逻辑，作为后续维护和扩展的标准参考。

## 目录

- [§1 整体架构](#1-整体架构)
- [§2 数据拆分：useMemo 计算 left / right](#2-数据拆分usememo-计算-left--right)
- [§3 左侧（无线）渲染](#3-左侧无线渲染)
- [§4 右侧（动环 / 传输 / 集客 / 家客）渲染](#4-右侧动环--传输--集客--家客渲染)
- [§5 选中态与激活联动](#5-选中态与激活联动)
- [§6 顶部与底部容器](#6-顶部与底部容器)
- [§7 常见扩展场景](#7-常见扩展场景)
- [§8 关键文件](#8-关键文件)
- [§9 相关文档](#9-相关文档)

> 📌 配置驱动设计原则已迁移到独立文档 [principles.md](./principles.md)（包含 idMap 反例与落地清单）。

> 📌 子组件 Props 速查见 [sub-components.md](./sub-components.md)。本文档只讲主组件如何协调子组件。

---

## 1. 整体架构

主组件的渲染树如下：

```
<Box title="右侧-实时影响-TOP" ...>
    <DataStatus loading={false} data={data.viewItemData}>
        <div className={container.inner}>                ← ① 整体容器
            <div className={leftPanel.root}>             ← ② 左侧（无线）
                <div className={leftPanel.title}>无线情况</div>
                <div className={leftPanel.layout}>
                    {left.map(item => renderLeftItem(item))}  ← ③ 左侧卡片分发
                </div>
            </div>
            {right.map(item => renderRightItem(item))}   ← ④ 右侧轮播分发
        </div>
    </DataStatus>
    <Detail indItem={...} modalVisible={...} ... />     ← ⑤ 详情弹窗（折线图 + 柱状图）
    <FaultListTable open={...} ... />                   ← ⑥ 故障清单弹窗
</Box>
```

层级职责：

| 层级 | 组件 / DOM                       | 职责                                            |
| ---- | -------------------------------- | ----------------------------------------------- |
| ①    | `container.inner`                | 横向 flex 布局，分左右两栏                      |
| ②    | `leftPanel.root`                 | 左侧 718px 宽，固定标题"无线情况"               |
| ③    | `leftPanel.layout`               | 无线各分组（物理退服 / 逻辑退服 / 停电站点 等） |
| ④    | `rightPanel.root` + `data-title` | 右侧每个分组（动环 / 传输 / 集客 / 家客）       |
| ⑤    | `Detail`                         | 选中后显示趋势图 + 柱状图                       |
| ⑥    | `FaultListTable`                 | 详情弹窗中"故障清单"链接 / 柱状图点击触发       |

---

## 2. 数据拆分：useMemo 计算 left / right

```typescript
const { left, right } = useMemo(() => {
    const left = (data?.viewItemData ?? []).filter((item) => item.group === "wireless");
    const right = (data?.viewItemData ?? []).filter((item) => item.group !== "wireless");
    return { left, right };
}, [data]);
```

**拆分依据**：以模板 / API 返回的 `group` 字段为唯一标准。

| group 值         | 归属  | 典型模板配置                             |
| ---------------- | ----- | ---------------------------------------- |
| `"wireless"`     | left  | 物理退服 / 逻辑退服 / 停电站点           |
| `"powerAndEnv"`  | right | 机房停电 + 环境异常（`carouselSection`） |
| `"transmission"` | right | 一干 / 二干 / 本地（`carouselNormal`）   |
| `"client"`       | right | AAA/AA/A/普通/重保专线                   |
| `"family"`       | right | BRAS / OLT / 批量 PON                    |

> 💡 新增分组时只需在 `presets.ts` 中设置 `group` 字段，无需修改主组件即可自动归位。

**`useMemo` 依赖**：`[data]`。`data` 来自 `useRequest` 返回，每次轮询或区域变化时引用变化，触发重算。

**空数据兜底**：`data?.viewItemData ?? []` —— `viewItemData` 为 `undefined` 时返回空数组，下游 `.filter` 安全。

---

## 3. 左侧（无线）渲染

### 3.1 渲染代码

```jsx
{
    !isEmpty(left) &&
        left.map((item) => {
            if (item.items.length === 0) return null; // ① 空数据守卫

            if (item.items.length > 2) {
                return (
                    // ② 3+ 指标 → MultiCard
                    <MultiCard
                        className={leftPanel.multiCard}
                        key={item.type}
                        data={item.items}
                        onClick={handleIndClick}
                        activeItem={state.activeIndItem}
                    />
                );
            }

            return (
                // ③ 1-2 指标 → SimpleCard（横向排列）
                <div className={leftPanel.simpleCardContainer} key={item.type}>
                    {item.items.map((d) => (
                        <SimpleCard
                            key={d.id}
                            id={d.id}
                            className={leftPanel.simpleCard}
                            activeItem={state.activeIndItem}
                            currentItem={d}
                            onClick={() => handleIndClick(d)}
                            isActive={state.activeIndItem?.id === d.id}
                        />
                    ))}
                </div>
            );
        });
}
```

### 3.2 阈值规则

| `item.items.length` | 渲染组件         | 容器 className        | 内部布局      | `key`       |
| ------------------- | ---------------- | --------------------- | ------------- | ----------- |
| `0`                 | `null`（不渲染） | -                     | -             | -           |
| `1`                 | `SimpleCard` × 1 | `simpleCardContainer` | 单个卡片居中  | `item.type` |
| `2`                 | `SimpleCard` × 2 | `simpleCardContainer` | 两个卡片横排  | `item.type` |
| `> 2`               | `MultiCard` × 1  | `multiCard`           | 主值 + 进度条 | `item.type` |

### 3.3 选中态联动

`SimpleCard` 自己处理激活高亮：

```typescript
isActive={state.activeIndItem?.id === d.id}
```

`MultiCard` 接收 `activeItem` 对象，内部遍历 `data` 自己判断每个子项的激活态。

### 3.4 关键注意点

- **不传 `groupViews` / `groupViewType`**：左侧无线不参与轮播，直接用 `items` 渲染。
- **空数据守卫 (`items.length === 0`)**：必须先于 `> 2` 判断（虽然 `> 2` 包含 `0`，但显式 `null` 更清晰，便于日后插入其他逻辑）。
- **`key` 用 `item.type`**：无线分组通常 3-4 个，类型稳定；不要用 `item.id` / 数组 index（无线 item 不一定有 `id`）。
- **不使用 `Carousel*`**：即使某些无线分组未来有 3+ 指标，依然用 `MultiCard` 展示，不走轮播逻辑。

---

## 4. 右侧（动环 / 传输 / 集客 / 家客）渲染

### 4.1 渲染代码

```jsx
{
    !isEmpty(right) &&
        right.map((item) => {
            const isCarouselSection = item.groupViewType === "carouselSection";

            return (
                <div className={rightPanel.root} key={item.type} data-title={item.title}>
                    {isCarouselSection ? (
                        <CarouselSection
                            groupViews={item.groupViews}
                            items={item.items}
                            activeItem={state.activeIndItem}
                            onItemClick={handleIndClick}
                        />
                    ) : (
                        <CarouselNormal
                            title={item.title}
                            items={item.items}
                            groupViews={item.groupViews}
                            activeItem={state.activeIndItem}
                            onItemClick={handleIndClick}
                        />
                    )}
                </div>
            );
        });
}
```

### 4.2 轮播方式选择

```typescript
const isCarouselSection = item.groupViewType === "carouselSection";
```

| `item.groupViewType`                               | 渲染组件          | 典型场景                                  |
| -------------------------------------------------- | ----------------- | ----------------------------------------- |
| `"carouselSection"` 或 其他非空值（如 `"custom"`） | `CarouselSection` | 动环情况（按"机房停电" / "环境异常"分段） |
| `undefined` / `null` / `""` / 其他                 | `CarouselNormal`  | 传输 / 集客 / 家客（普通轮播）            |

> ⚠️ **判断是 `=== "carouselSection"` 严格相等**，不是 truthy 检查。如果误传 `"carousel_section"`（下划线）会走 `CarouselNormal`。

### 4.3 Props 差异

| Prop          | `CarouselNormal`      | `CarouselSection`                  |
| ------------- | --------------------- | ---------------------------------- |
| `title`       | ✅ 必传（轮播外标题） | ❌ 不传（标题在 section.label 内） |
| `groupViews`  | ✅ 必传               | ✅ 必传                            |
| `items`       | ✅ 必传               | ✅ 必传                            |
| `activeItem`  | ✅ 必传               | ✅ 必传                            |
| `onItemClick` | ✅ 必传               | ✅ 必传                            |

> 💡 主组件统一把 `state.activeIndItem` 和 `handleIndClick` 透传下去，子组件自行处理激活态。

### 4.4 容器标记

```jsx
<div className={rightPanel.root} key={item.type} data-title={item.title}>
```

- `key={item.type}`：每个右侧分组一个 React key。
- `data-title={item.title}`：**调试用标记**。在浏览器开发者工具中可通过 `[data-title="动环情况"]` 快速定位节点。
- `rightPanel.root`：样式 class，定义 204px 宽、轮播容器基础样式。

### 4.5 关键注意点

- **`item.groupViews` 可能为 `undefined`**：当模板没配置组合视图时，`CarouselNormal` 仍会渲染（按单指标遍历），不会崩。
- **`item.items` 必传**：即使全是组合指标，`items` 也要传（用于子组件按 `id` 查找数据）。
- **不在主组件做长度判断**：右侧不使用 `MultiCard`，全部交给 `CarouselNormal` / `CarouselSection` 内部处理。

---

## 5. 选中态与激活联动

### 5.1 状态字段

```typescript
const [state, setState] = useSetState({
    activeIndItem: null, // 用户点击的指标
    openFaultListModal: false, // 故障清单弹窗
    faultListTableInfo: null, // 弹窗信息
});
```

### 5.2 点击 → 状态更新

```typescript
const handleIndClick = useMemoizedFn((item) => {
    setState({ activeIndItem: item });
});
```

由 `SimpleCard` / `MultiCard` / `CarouselNormal` / `CarouselSection` 透传上来的 `onClick` / `onItemClick` 调用。

### 5.3 区域切换重置

```typescript
useEffect(() => {
    setState({
        // activeIndItem: null,  // 故意注释，不重置
        openFaultListModal: false,
        faultListTableInfo: null,
    });
}, [currentZone]);
```

> 切换区域时仅关闭弹窗，**不重置** `activeIndItem`，由下一段 effect 重新匹配。

### 5.4 组合 ID 重映射（idMap）— ⚠️ 已确认为**冗余逻辑**

> 🔴 **结论**：`index.tsx` 中维护的 `idMap` 硬编码 + `useEffect` 重映射，**在当前 SimpleCard 行为下是冗余的**。
>
> 当前 SimpleCard 在 onClick 时已经传上来"单 ID dataItem"（不是 groupView 合成对象），`idMap` 重复加工一次同样的结果，**不推荐再扩展**。
>
> 详细证据链、对比表、已知问题、重构建议见 [principles.md §2](./principles.md#2-反面案例idmap-硬编码)。

---

## 6. 顶部与底部容器

### 6.0 `currentActiveIndItem` 安全包装（区域匹配守卫）

主组件底部把 `state.activeIndItem` 透传给 `<Detail>` / `<FaultListTable>`。由于选中项可能跨区域留存（如轮询刷新时 `currentZone` 已变），需要一个安全包装：

```typescript
const currentActiveIndItem = useMemo(() => {
    if (currentZone && currentZone.zoneId === state.activeIndItem?.zoneId) {
        return state.activeIndItem;
    }
    return null;
}, [currentZone, state.activeIndItem]);
```

- **仅当当前区域与选中项的区域一致时才返回选中态**。
- 切换区域但 `activeIndItem` 未更新时，返回 `null`，避免详情组件渲染陈旧数据。
- 传给 `<Detail indItem={currentActiveIndItem} ... />` 的就是安全值。

### 6.1 顶部（Box 标题栏）

```jsx
<Box
    title={"右侧-实时影响-TOP"}
    titleBox={<TitleTabs />}
    extra={data?.currentDataTime ? <span>数据时间：{data?.currentDataTime}</span> : null}
    width={1570}
    height={584}
    className={container.root}
    contentClassName={container.content}
>
```

- `title`：固定标题。
- `titleBox`：自定义标题内容（`TitleTabs`，来自父级 `tabs/`）。
- `extra`：右上角显示"数据时间"（来自 API 返回的 `currentDataTime`）。
- `width` / `height`：硬编码 1570 × 584px。

### 6.2 底部（弹窗）

主组件底部挂了两个弹窗，由点击卡片 / 柱状图触发。

```jsx
<Detail
    key={`detail-${currentZone?.zoneId ?? "unknown"}`}  // 切换区域强制 remount
    indItem={currentActiveIndItem}
    currentZone={currentZone}
    modalVisible={state.openFaultListModal}
    onShowDetailList={(info) => {
        setState({
            openFaultListModal: true,
            faultListTableInfo: info,
        });
    }}
/>

<FaultListTable
    open={state.openFaultListModal}
    getContainer={() => props.getRootContainer()}
    onCancel={() => {
        setState({ openFaultListModal: false, faultListTableInfo: null });
    }}
    currentZone={currentZone}
    faultListTableInfo={state.faultListTableInfo}
    currentIndItem={currentActiveIndItem}
/>
```

**两个组件的详细文档**：

- **Detail 详情弹窗**（折线图 + 柱状图 + 故障清单入口）→ [detail-component.md](./detail-component.md)
- **FaultListTable 故障清单弹窗**（表格 + 列配置 + API）→ [fault-list-table.md](./fault-list-table.md)

**关键点**：

- `key={detail-${zoneId}}` 强制 `Detail` 在区域切换时 remount，**修改时务必保留**。
- `getContainer` 通过 `props.getRootContainer()` 把弹窗挂到根 DOM，避免被父容器 `overflow: hidden` 截断。

---

## 7. 常见扩展场景

### 7.1 新增一个左侧（无线）分组

1. 在 `presets.ts` 中追加 `group: "wireless"` 的配置（item.id 列表）。
2. 主组件 **无需任何修改**，自动按 `group === "wireless"` 归到左侧。
3. 根据 `items.length` 自动选择 `SimpleCard` / `MultiCard`。

### 7.2 新增一个右侧（普通）分组

1. 在 `presets.ts` 中追加 `group: "<newGroup>"`（不等于 `"wireless"`）的配置。
2. 主组件 **无需任何修改**。
3. 默认走 `CarouselNormal`（不设置 `groupViewType` 时）。

### 7.3 新增一个右侧（分段轮播）分组

1. 在 `presets.ts` 中追加配置，设置 `groupViewType: "carouselSection"`。
2. 按分段组织 `groupViews`（详见 [carousel-components.md §5](./carousel-components.md#5-carouselsection分段轮播)）。
3. 主组件 **无需任何修改**，自动判断 `groupViewType` 选择 `CarouselSection`。

### 7.4 调整卡片分发阈值

当前 `> 2` 走 `MultiCard` 是硬编码在主组件中。

> ⚠️ **不建议** 把阈值变成可配置 —— 3+ 指标会撑破 `MultiCard` 的视觉平衡，强行放宽会导致 UI 异常。如果确实需要更多指标，请优先考虑：
>
> - 拆成多个 `items` 项（不同 `type`），让 `CarouselNormal` 接管；
> - 调整 `MultiCard` 内部布局（`MultiCard.tsx` + `index.css`），使其支持更多指标。

### 7.5 新增组合 ID 重映射

详见 [§5.4 组合 ID 重映射](#54-组合-id-重映射)。

---

## 8. 关键文件

| 文件                                                                               | 作用                                            |
| ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| `apps/main/app/components/right/network-compact/network-scale/index.tsx`           | 本文档描述的主组件                              |
| `apps/main/app/components/right/network-compact/network-scale/presets.ts`          | 指标 / 视图模板（含 `group` / `groupViewType`） |
| `apps/main/app/components/right/network-compact/network-scale/SimpleCard.tsx`      | 单指标卡片                                      |
| `apps/main/app/components/right/network-compact/network-scale/MultiCard.tsx`       | 多指标卡片                                      |
| `apps/main/app/components/right/network-compact/network-scale/CarouselNormal.tsx`  | 普通轮播                                        |
| `apps/main/app/components/right/network-compact/network-scale/CarouselSection.tsx` | 分段轮播                                        |
| `apps/main/app/components/right/network-compact/network-scale/Detail.tsx`          | 详情弹窗                                        |
| `apps/main/app/components/right/network-compact/network-scale/FaultListTable.tsx`  | 故障清单弹窗                                    |

---

## 9. 相关文档

- [principles.md](./principles.md) — 配置驱动设计原则（idMap 反例 + 落地清单）
- [presets-config.md](./presets-config.md) — presets.ts / environment.json 配置
- [sub-components.md](./sub-components.md) — 子组件 Props 速查
- [carousel-components.md](./carousel-components.md) — 轮播组件设计
- [detail-component.md](./detail-component.md) — Detail 详情弹窗
- [fault-list-table.md](./fault-list-table.md) — FaultListTable 故障清单弹窗
- [troubleshooting.md](./troubleshooting.md) — 故障排查速查
