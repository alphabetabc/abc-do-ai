# 轮播组件：CarouselNormal / CarouselSection

NetworkScale 主组件（`index.tsx`）根据 `groupViewType` 在两个轮播组件之间分发。本文档说明两种轮播方式的设计理念、配置方式与适用场景。

## 目录

- [§1 组件职责对比](#1-组件职责对比)
- [§2 组件化架构（设计理念）](#2-组件化架构设计理念)
- [§3 carouselNormal（默认）](#3-carouselnormal默认)
- [§4 carouselSection（分段轮播）](#4-carouselsection分段轮播)
- [§5 组件属性](#5-组件属性)
- [§6 输入输出示例](#6-输入输出示例)
- [§7 切换轮播方式](#7-切换轮播方式)
- [§8 添加新的 carouselSection 类型](#8-添加新的-carouselsection-类型)

---

## 1. 组件职责对比

| 特性     | `CarouselNormal`            | `CarouselSection`                  |
| -------- | --------------------------- | ---------------------------------- |
| 标题位置 | 轮播外部                     | 每个轮播页面内部                   |
| 配置方式 | `groupViewType` 为空或不配置 | `groupViewType: "carouselSection"` |
| 数据结构 | 扁平化指标分组               | 分段式 children 数组               |
| 适用场景 | 传输/集客/家客情况           | 动环情况等需要分段展示的场景       |

### 1.1 当前轮播配置汇总

| 组件类型          | 使用场景       | groupViewType 配置         |
| ----------------- | -------------- | -------------------------- |
| `CarouselNormal`  | 传输/集客/家客 | 无 或 非 `"carouselSection"` |
| `CarouselSection` | 动环情况       | `"carouselSection"`         |

---

## 2. 组件化架构（设计理念）

**核心思想**：将不同轮播逻辑拆分为独立组件，通过 `groupViewType` 配置项控制使用哪个组件。

**优势**：

- ✅ 职责单一：每个组件只负责一种轮播方式
- ✅ 易于维护：修改一种轮播方式不影响其他
- ✅ 易于扩展：新增轮播类型只需添加新组件
- ✅ 向后兼容：原有 `carouselNormal` 逻辑完全保留

**组件职责**：

```
index.tsx (主入口)
    ↓
判断 groupViewType
    ├─ "carouselSection" → CarouselSection
    │                       └─ 处理分段轮播（标题在内）
    │
    └─ 其他 → CarouselNormal
              └─ 处理普通轮播（标题在外）
```

**组件渲染流程**：

```
index.tsx (主组件)
    ↓
判断 groupViewType
    ├─→ "carouselSection" → CarouselSection
    │                        ├─→ 遍历 groupViews
    │                        └─→ 每个 section 渲染为一个轮播页
    │                            └─→ 渲染 section.label（标题）
    │                            └─→ 渲染 section.children（卡片）
    │
    └─→ 其他 → CarouselNormal
               ├─→ 标题在外显示
               ├─→ chunk(..., 2) 每屏两个卡片
               └─→ 遍历 groupViews/items 渲染
```

---

## 3. carouselNormal（默认）

**配置**：无 `groupViewType` 或 `groupViewType` 不为 `"carouselSection"`

**数据结构**：

```typescript
{
    title: "传输情况",
    groupViews: [
        { id: "14/15", label: "传输一干/二干", viewType: "combined", children: [{id:"14"},{id:"15"}] },
        { id: "16",    label: "传输本地",      viewType: "combined", children: [{id:"16"}] },
    ],
}
```

**渲染示意**：

```
传输情况  (标题在外)
┌─────────────┬─────────────┐
│ 传输一干/二干│ 传输本地     │  (轮播页1)
│     0/0     │     0       │
└─────────────┴─────────────┘
        ↕ (轮播)
┌─────────────┬─────────────┐
│    ...      │    ...      │  (轮播页2)
└─────────────┴─────────────┘
```

---

## 4. carouselSection（分段轮播）

**配置**：`groupViewType: "carouselSection"`

**数据结构**：

```typescript
{
    title: "动环情况",
    groupViewType: "carouselSection",
    groupViews: [
        {
            id: "power-section",
            label: "机房停电",
            children: [
                { id: "todo--1", label: "机楼", viewType: "simple" },
                { id: "power-converge", label: "汇聚", viewType: "combined", children: [...] },
            ],
        },
        {
            id: "env-section",
            label: "环境异常",
            children: [ ... ],
        },
    ],
}
```

**渲染示意**：

```
┌─────────────┐
│ 机房停电     │  (标题在内)
├─────────────┤
│ 机楼  0     │  (轮播页1)
│ 重要/普通/  │
│ 业务汇聚  0/0/0│
└─────────────┘
        ↕ (轮播)
┌─────────────┐
│ 环境异常     │  (轮播页2)
├─────────────┤
│ 机楼  0     │
│ 重要/普通/  │
│ 业务汇聚  0/0/0│
└─────────────┘
```

---

## 5. 组件属性

> 📌 完整 Props 接口与必填项见 [sub-components.md §3-4](./sub-components.md)。本节只列组件特有字段（与 sub-components.md 等价，仅做交叉引用）。

### 5.1 CarouselNormal

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 轮播标题 |
| `items` | array | 指标数组 |
| `groupViews` | array | 组合视图数组（可选） |
| `activeItem` | object | 当前激活的指标 |
| `onItemClick` | function | 点击事件处理 |

### 5.2 CarouselSection

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `groupViews` | array | 分段视图数组 |
| `items` | array | 指标数组 |
| `activeItem` | object | 当前激活的指标 |
| `onItemClick` | function | 点击事件处理 |

---

## 6. 输入输出示例

### 6.1 输入示例：添加 carouselSection 配置

**在 `presets.ts` 中添加**：

```typescript
{
    group: "powerAndEnv",
    type: "powerAndEnv",
    typeName: "动环情况",
    title: "动环情况",
    dataItemGroup: IndViewParts.VIEW_G2,
    groupViewType: "carouselSection",
    items: [
        { id: "todo--1", label: "机楼", unit: "个", detailTitle: "机房停电-机楼" },
        { id: "todo--2", label: "重要汇聚", unit: "个", detailTitle: "机房停电-重要汇聚" },
        { id: "todo--3", label: "普通汇聚", unit: "个", detailTitle: "机房停电-普通汇聚" },
        { id: "todo--4", label: "业务汇聚", unit: "个", detailTitle: "机房停电-业务汇聚" },
    ],
    groupViews: [
        {
            id: "power-section",
            label: "机房停电",
            children: [
                { id: "todo--1", label: "机楼", unit: "个", viewType: "simple" },
                {
                    id: "power-converge",
                    label: "重要/普通/业务 汇聚",
                    unit: "",
                    viewType: "combined",
                    children: [{ id: "todo--2" }, { id: "todo--3" }, { id: "todo--4" }],
                },
            ],
        },
    ],
}
```

### 6.2 输出示例：carouselSection 效果

- **轮播页1**：显示"机房停电"标题
    - 卡片1：机楼 (todo--1)
    - 卡片2：重要/普通/业务 汇聚 (todo--2/todo--3/todo--4)
- **轮播切换**：可切换显示不同分段
- **详情弹窗**：点击卡片可查看趋势图和柱状图

---

## 7. 切换轮播方式

**从 `carouselNormal` 改为 `carouselSection`**：

```typescript
{
    group: "xxx",
    type: "xxx",
    // ... 其他配置
    groupViewType: "carouselSection", // 关键配置
    groupViews: [
        // 重新组织为分段结构
        {
            id: "section-1",
            label: "第一段标题",
            children: [/* 卡片配置 */],
        },
    ],
}
```

---

## 8. 添加新的 carouselSection 类型

1. 在 `presets.ts` 中添加配置，设置 `groupViewType: "carouselSection"`。
2. 配置 `items` 数组定义独立指标。
3. 配置 `groupViews` 数组定义分段。
4. 每个分段包含 `id`、`label` 和 `children`。
5. `children` 中可以是简单指标或组合指标。

> 📌 扁平化配置方案（`items` 独立 + `groupViews` 组合）详见 [presets-config.md §1.4](./presets-config.md#14-添加组合指标推荐方式)。
