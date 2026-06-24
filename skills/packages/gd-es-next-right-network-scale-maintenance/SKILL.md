---
name: gd-es-next-right-network-scale-maintenance
title: 网络规模组件维护技能
description: 提供应急支撑系统中 NetworkScale 组件的全面维护指导，涵盖数据流、组件结构、API 集成和常见维护任务。
version: 2.0.0
author: Emergency Support Team
tags:
  - network
  - maintenance
  - component
  - emergency-support
---

# 网络规模组件维护技能

## 功能特性

- **指标管理**：支持添加、修改和删除网络指标配置
- **配置管理**：统一管理 presets.ts 和 environment.json 配置
- **图表配置**：支持趋势图和柱状图的配置调整
- **故障排查**：提供数据更新、卡片显示、图表渲染等常见问题的排查指南
- **性能优化**：提供组件性能优化建议
- **API 集成**：指导与后端 API 的对接和数据处理
- **多轮播类型**：支持 `carouselNormal`（普通轮播）和 `carouselSection`（分段轮播）两种轮播方式

## 使用方法

### 1. 添加新指标

在 `presets.ts` 中添加新指标配置：

```typescript
{
    group: "group-name",
    type: "type-name",
    typeName: "类型名称",
    title: "显示标题",
    dataItemGroup: IndViewParts.VIEW_X,
    items: [
        { id: "new-id", label: "指标名称", unit: "单位", detailTitle: "详情标题" }
    ]
}
```

### 2. 添加组合指标（推荐方式）

通过 `groupViews` 字段定义组合视图：

```typescript
{
    group: "transmission",
    type: "transmission",
    typeName: "传输情况",
    title: "传输情况",
    dataItemGroup: IndViewParts.VIEW_G3,
    items: [
        // 独立指标配置（用于 API 数据匹配）
        { id: "14", label: "传输一干", detailTitle: "传输一干", unit: "个" },
        { id: "15", label: "传输二干", detailTitle: "传输二干", unit: "个" },
        { id: "16", label: "传输本地", detailTitle: "传输本地", unit: "个" },
    ],
    groupViews: [
        // 组合视图配置（用于卡片显示）
        {
            id: "14/15",
            label: "传输一干/二干",
            unit: "个",
            viewType: "combined",
            children: [{ id: "14" }, { id: "15" }],
        },
        {
            id: "16",
            label: "传输本地",
            unit: "个",
            viewType: "combined",
            children: [{ id: "16" }],
        },
    ],
}
```

**groupViews 字段说明**：

| 字段     | 类型   | 说明                                         |
| -------- | ------ | -------------------------------------------- |
| id       | string | 组合视图唯一标识（通常用 `/` 连接子指标 ID） |
| label    | string | 组合视图显示标签                             |
| unit     | string | 单位                                         |
| viewType | string | 视图类型，固定为 `"combined"`                |
| children | array  | 包含的子指标 ID 列表                         |

### 3. 使用 carouselSection 类型（分段轮播）

对于需要标题在轮播内部、分段展示的场景，使用 `groupViewType: "carouselSection"`：

```typescript
{
    group: "powerAndEnv",
    type: "powerAndEnv",
    typeName: "动环情况",
    title: "动环情况",
    dataItemGroup: IndViewParts.VIEW_G2,
    groupViewType: "carouselSection", // 关键配置：启用分段轮播
    items: [
        // 独立指标配置
        { id: "todo--1", label: "机楼", unit: "个", detailTitle: "机房停电-机楼" },
        { id: "todo--2", label: "重要汇聚", unit: "个", detailTitle: "机房停电-重要汇聚" },
        { id: "todo--3", label: "普通汇聚", unit: "个", detailTitle: "机房停电-普通汇聚" },
        { id: "todo--4", label: "业务汇聚", unit: "个", detailTitle: "机房停电-业务汇聚" },
        { id: "todo--5", label: "机楼", unit: "个", detailTitle: "环境异常-机楼" },
        { id: "todo--6", label: "重要汇聚", unit: "个", detailTitle: "环境异常-重要汇聚" },
        { id: "todo--7", label: "普通汇聚", unit: "个", detailTitle: "环境异常-普通汇聚" },
        { id: "todo--8", label: "业务汇聚", unit: "个", detailTitle: "环境异常-业务汇聚" },
    ],
    groupViews: [
        // 第一段：机房停电
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
        // 第二段：环境异常
        {
            id: "env-section",
            label: "环境异常",
            children: [
                { id: "todo--5", label: "机楼", unit: "个", viewType: "simple" },
                {
                    id: "env-converge",
                    label: "重要/普通/业务 汇聚",
                    unit: "",
                    viewType: "combined",
                    children: [{ id: "todo--6" }, { id: "todo--7" }, { id: "todo--8" }],
                },
            ],
        },
    ],
}
```

**carouselSection 特性**：

- ✅ 标题在轮播内部显示
- ✅ 每个轮播页面独立分段
- ✅ 支持简单指标和组合指标混合使用
- ✅ 每个分段有自己的 label（分段标题）

### 4. 配置图表（environment.json）

```json
{
  "gd-emergency-support.unitIdSettings": {
    "unitId": "1",
    "label": "停电站点",
    "group": "无线",
    "seriesType": [
      { "name": "移动", "fieldName": "kpiValue1" },
      { "name": "铁塔", "fieldName": "kpiValue2" }
    ]
  }
}
```

### 5. 配置故障列表表格（environment.json）

```json
{
  "gd-emergency-support.rightNetworkCompactFaultListTable.columns": [
    {
      "desc": "指标描述",
      "unitId": ["new-id"],
      "columns": [
        { "fieldName": "field1", "width": 200, "label": "列1" },
        { "fieldName": "field2", "width": 300, "label": "列2" },
        {
          "fieldName": "field3",
          "width": 100,
          "label": "列3",
          "renderType": "type1"
        }
      ]
    }
  ]
}
```

## 组件架构

### 核心组件

| 组件                | 用途                               | 文件                    |
| ------------------- | ---------------------------------- | ----------------------- |
| `NetworkScale`      | 主组件，包含数据获取和布局逻辑     | `index.tsx`             |
| `CarouselNormal`    | 普通轮播组件（标题在外）           | `CarouselNormal.tsx`    |
| `CarouselSection`   | 分段轮播组件（标题在内，分段展示） | `CarouselSection.tsx`   |
| `SimpleCard`        | 单个指标卡片组件                   | `SimpleCard.tsx`        |
| `MultiCard`         | 多个指标卡片组件                   | `MultiCard.tsx`         |
| `Detail`            | 详情弹窗组件                       | `Detail.tsx`            |
| `FaultListTable`    | 故障列表表格组件                   | `FaultListTable.tsx`    |
| `DetailChartOption` | 图表配置选项                       | `DetailChartOption.tsx` |

### 轮播组件对比

| 特性     | `CarouselNormal`             | `CarouselSection`                  |
| -------- | ---------------------------- | ---------------------------------- |
| 标题位置 | 轮播外部                     | 每个轮播页面内部                   |
| 配置方式 | `groupViewType` 为空或不配置 | `groupViewType: "carouselSection"` |
| 数据结构 | 扁平化指标分组               | 分段式 children 数组               |
| 适用场景 | 传输/集客/家客情况           | 动环情况等需要分段展示的场景       |

### 组件渲染流程

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

## 输入输出示例

### 输入示例：添加 carouselSection 配置

**在 presets.ts 中添加**：

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

### 输出示例：carouselSection 效果

**配置生效后的效果**：

- **轮播页1**：显示"机房停电"标题
  - 卡片1：机楼 (todo--1)
  - 卡片2：重要/普通/业务 汇聚 (todo--2/todo--3/todo--4)
- **轮播切换**：可切换显示不同分段
- **详情弹窗**：点击卡片可查看趋势图和柱状图

## 依赖关系

### 核心文件

| 文件                    | 用途                       |
| ----------------------- | -------------------------- |
| `index.tsx`             | 主组件，包含数据获取和布局 |
| `presets.ts`            | 数据模板配置 + 样式定义    |
| `CarouselNormal.tsx`    | 普通轮播组件               |
| `CarouselSection.tsx`   | 分段轮播组件               |
| `SimpleCard.tsx`        | 单个指标卡片组件           |
| `MultiCard.tsx`         | 多个指标卡片组件           |
| `Detail.tsx`            | 详情弹窗组件               |
| `FaultListTable.tsx`    | 故障列表表格组件           |
| `DetailChartOption.tsx` | 图表配置选项               |
| `request/right.ts`      | API 请求函数               |

### 配置文件

| 文件             | 路径                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| presets.ts       | `apps/main/app/components/right/network-compact/network-scale/presets.ts` |
| environment.json | `apps/main/public/config/environment.json`                                |
| id-mapper.xml    | API 到数据库表的映射                                                      |

### 环境配置路径

- `gd-emergency-support.unitIdSettings` - 图表系列配置
- `gd-emergency-support.rightNetworkCompactFaultListTable.columns` - 弹窗表格配置
- `gd-emergency-support.modules.network-conditions.request.interval` - 轮询间隔

## 设计理念

### 组件化架构

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

### 扁平化配置方案

**核心思想**：`items` 存储独立指标（便于 API 数据匹配），`groupViews` 定义组合视图（便于卡片显示）。

**优势**：

- ✅ 数据扁平化：每个 ID 独立，便于 API 返回数据匹配
- ✅ 灵活组合：通过 `groupViews` 自由定义组合方式
- ✅ 向后兼容：独立指标和组合指标共存
- ✅ 配置集中化：所有配置在 presets.ts

**数据流**：

```
presets.ts (配置 items + groupViews)
    ↓
API 返回数据 (每个独立 ID 有独立值)
    ↓
index.tsx (根据 groupViewType 选择组件)
    ↓
CarouselNormal / CarouselSection (渲染轮播)
    ↓
SimpleCard (显示卡片)
    ↓
渲染完成
```

### 两种轮播方式对比

#### carouselNormal（默认）

**配置**：无 `groupViewType` 或 `groupViewType` 不为 "carouselSection"

**数据结构**：

```typescript
{
    title: "传输情况",
    groupViews: [
        { id: "14/15", label: "传输一干/二干", viewType: "combined", ... },
        { id: "16", label: "传输本地", viewType: "combined", ... },
    ],
}
```

**渲染**：

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

#### carouselSection（分段轮播）

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
                { id: "power-converge", label: "汇聚", viewType: "combined", ... },
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

**渲染**：

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

### 当前轮播配置汇总

| 组件类型          | 使用场景       | groupViewType 配置         |
| ----------------- | -------------- | -------------------------- |
| `CarouselNormal`  | 传输/集客/家客 | 无 或 非 "carouselSection" |
| `CarouselSection` | 动环情况       | `"carouselSection"`        |

## API 数据处理

### getNetworkSituationApi 分析

**返回值结构**：

```typescript
{
    viewItemData: Array<{
        group: string,
        type: string,
        title: string,
        groupViewType?: string, // 新增：轮播类型
        items: Array<{
            id: string,
            label: string,
            unit: string,
            detailTitle: string,
            data: any,
            zoneId: string
        }>,
        groupViews?: Array<any>
    }>,
    currentDataTime: string | null
}
```

**关键特性**：

- ✅ `viewItemData` 不会返回空数组（除非模板本身为空）
- ✅ 使用 `viewItemDataTemplate` 作为结构框架
- ✅ 即使后端数据为空，也会返回完整结构
- ✅ 组合指标数据合并到 `data.value14`、`data.value15` 等字段
- ✅ 支持 `groupViewType` 配置，自动选择正确的轮播组件

**数据处理流程**：

1. 调用 `getViewItemDataApi` 获取指标数据（exitNumberRows）
2. 调用 `getViewItemDataApi` 获取资源数数据（resourceNumRows）
3. 使用 `Map` 结构按 `label` 分组数据
4. 遍历模板，填充每个指标的数据
5. 计算百分比和资源数比例
6. 返回结构化的 `viewItemData`（包含 `groupViewType`）

## 常见维护任务

### 添加新的 carouselSection 类型

1. 在 `presets.ts` 中添加配置，设置 `groupViewType: "carouselSection"`
2. 配置 `items` 数组定义独立指标
3. 配置 `groupViews` 数组定义分段
4. 每个分段包含 `id`、`label` 和 `children`
5. `children` 中可以是简单指标或组合指标

### 切换轮播方式

**从 carouselNormal 改为 carouselSection**：

```typescript
// 在 presets.ts 中添加配置
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
            children: [ /* 卡片配置 */ ],
        },
    ],
}
```

### 调整轮询间隔

```typescript
gd-emergency-support.modules.network-conditions.request.interval = 300 // 秒
```

### 更新配色方案

修改 `index.css` 中的 CSS 变量：

- 主色：rgb(13, 255, 122)
- 警告：rgb(254, 147, 146)
- 激活：rgb(255, 237, 80)

### 调试 API 调用

检查浏览器网络面板：

- `getNetworkSituationApi` - 主数据获取
- `getRightNetworkScaleDetailLineChartDataApi` - 趋势图
- `getRightNetworkScaleDetailBarChartDataApi` - 柱状图
- `getModalFaultListTableDataApi` - 故障列表

### 添加新的组合指标

1. 在 `presets.ts` 的 `items` 数组中添加独立指标配置
2. 在 `groupViews` 数组中添加组合视图配置
3. 在 `request/right.ts` 中添加数据合并逻辑（如需）
4. 测试数据显示

## 故障排查

### 数据不更新

- 检查轮询是否启用（`pollingInterval` > 0）
- 验证区域参数是否变化（`currentZone`）
- 检查浏览器网络请求是否正常
- 确认 `refreshDeps` 配置正确

### 卡片显示问题

- 检查 `item.items.length` 计数
- 验证数据结构与模板匹配
- 确认 CSS 类正确应用
- 检查 `DataStatus` 组件的 `data` 属性

### 轮播不切换

- 检查 `groupViews` 长度是否 > 1
- 验证 `Carousel` 组件的 `dots` 属性
- 确认轮播容器尺寸正确

### carouselSection 不生效

- 检查 `groupViewType` 是否正确设置为 `"carouselSection"`
- 验证 `groupViews` 数组结构是否正确
- 确认 `CarouselSection` 组件已正确导入
- 检查浏览器控制台错误

### 图表不显示

- 验证 `indItem` 是否已选择
- 检查 `dataTime` 有效性
- 查看控制台错误信息
- 确认 `unitIdSettings` 配置正确

### 选中状态异常

- 检查 `activeIndItem` 更新逻辑
- 验证区域切换时的状态重置
- 确认 `currentActiveIndItem` 计算正确

### API 返回空数据

**结论**：`getNetworkSituationApi` 返回的 `viewItemData` 不会为空数组，除非 `viewItemDataTemplate` 本身为空。

| 场景         | 返回结果                           |
| ------------ | ---------------------------------- |
| 模板为空     | `[]`（空数组）                     |
| 请求失败     | 使用 `defaultData`（包含模板数据） |
| 后端数据为空 | 返回完整结构，`data` 字段为空对象  |

## 性能优化建议

1. 使用 `useMemo` 进行计算缓存
2. 使用 `useMemoizedFn` 优化事件处理函数
3. 使用 `DataStatus` 懒加载图表
4. 设置合理的轮询间隔（建议 300 秒）
5. 避免在 `useEffect` 中进行复杂计算
6. 合理使用 `chunk` 函数，避免大数组操作

## 区域级别配置

| 级别   | parentName | regionName |
| ------ | ---------- | ---------- |
| 省 (2) | -1         | -1         |
| 市 (3) | regionName | -          |
| 区 (4) | cityName   | cityName   |
| 镇 (5) | cityName   | regionName |

## 子组件设计规范

### CarouselNormal

**属性**：

| 属性        | 类型     | 说明                 |
| ----------- | -------- | -------------------- |
| title       | string   | 轮播标题             |
| items       | array    | 指标数组             |
| groupViews  | array    | 组合视图数组（可选） |
| activeItem  | object   | 当前激活的指标       |
| onItemClick | function | 点击事件处理         |

### CarouselSection

**属性**：

| 属性        | 类型     | 说明           |
| ----------- | -------- | -------------- |
| groupViews  | array    | 分段视图数组   |
| items       | array    | 指标数组       |
| activeItem  | object   | 当前激活的指标 |
| onItemClick | function | 点击事件处理   |

### SimpleCard

**属性**：

| 属性        | 类型     | 说明           |
| ----------- | -------- | -------------- |
| id          | string   | 指标 ID        |
| currentItem | object   | 当前指标数据   |
| activeItem  | object   | 当前激活的指标 |
| isActive    | boolean  | 是否激活       |
| onClick     | function | 点击事件处理   |

### MultiCard

**属性**：

| 属性       | 类型     | 说明           |
| ---------- | -------- | -------------- |
| data       | array    | 多个指标数据   |
| activeItem | object   | 当前激活的指标 |
| onClick    | function | 点击事件处理   |

### Detail

**属性**：

| 属性             | 类型     | 说明               |
| ---------------- | -------- | ------------------ |
| indItem          | object   | 当前选中的指标     |
| currentZone      | object   | 当前区域           |
| modalVisible     | boolean  | 故障列表弹窗可见性 |
| onShowDetailList | function | 显示故障列表回调   |

### FaultListTable

**属性**：

| 属性               | 类型     | 说明           |
| ------------------ | -------- | -------------- |
| open               | boolean  | 弹窗是否打开   |
| getContainer       | function | 获取弹窗容器   |
| onCancel           | function | 关闭弹窗回调   |
| currentZone        | object   | 当前区域       |
| faultListTableInfo | object   | 故障列表数据   |
| currentIndItem     | object   | 当前选中的指标 |

## 相关文档

- 组件概览：`docs/maintenance/network-scale.md`
- API 文档：http://10.10.2.8:9091/project/1179/
- Mock 数据：`/static/mock/emergency/`
