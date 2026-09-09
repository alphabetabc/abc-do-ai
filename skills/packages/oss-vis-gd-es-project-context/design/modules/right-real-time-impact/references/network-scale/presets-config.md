# presets.ts 与 environment.json 配置

本文档整理 NetworkScale 组件的两类核心配置：

- `presets.ts` — 指标 / 视图 / 样式声明（TypeScript）
- `environment.json` — 图表 / 弹窗列 / 轮询间隔（JSON）

## 目录

- [§1 presets.ts](#1-presetsts)
    - [§1.1 IndViewParts 枚举](#11-indviewparts-枚举)
    - [§1.2 viewItemDataTemplate 数据结构](#12-viewitemdatatemplate-数据结构)
    - [§1.3 添加新指标](#13-添加新指标)
    - [§1.4 添加组合指标（推荐方式）](#14-添加组合指标推荐方式)
    - [§1.5 启用分段轮播（carouselSection）](#15-启用分段轮播carouselsection)
    - [§1.6 切换轮播方式](#16-切换轮播方式)
- [§2 environment.json](#2-environmentjson)
    - [§2.1 图表系列配置（unitIdSettings）](#21-图表系列配置unitidsettings)
    - [§2.2 故障清单弹窗列配置](#22-故障清单弹窗列配置)
    - [§2.3 轮询间隔](#23-轮询间隔)
- [§3 配色与样式](#3-配色与样式)
- [§4 配置维护 Checklist](#4-配置维护-checklist)

> ⚠️ **配置驱动原则**：所有展示逻辑由 `presets.ts` / `environment.json` 声明式配置控制，组件内部不写业务硬编码。详见 [main-render-flow.md §10](./main-render-flow.md#10-配置驱动设计原则-️-重要)。

---

## 1. presets.ts

**位置**：`apps/main/app/components/right/network-compact/network-scale/presets.ts`

**职责**：

- 定义 `viewItemDataTemplate`（指标模板）
- 定义 `networkScaleStyles`（样式表）
- 定义 `IndViewParts` 枚举（视图分组）

### 1.1 IndViewParts 枚举

| 枚举            | 说明            |
| --------------- | --------------- |
| `VIEW_G1_LEFT`  | 无线情况-左     |
| `VIEW_G1_RIGHT` | 无线情况-右     |
| `VIEW_G2`       | 机房停电 / 动环 |
| `VIEW_G3`       | 传输中断 / 传输 |
| `VIEW_G4`       | 集客情况        |
| `VIEW_G5`       | 家客情况        |

### 1.2 viewItemDataTemplate 数据结构

每个分组包含 `group` / `type` / `title` / `dataItemGroup` / `items` / 可选 `groupViews` / 可选 `groupViewType`：

```typescript
interface GroupTemplate {
    group: string; // 分组名（wireless / transmission / client / family / powerAndEnv）
    type: string; // 唯一类型
    typeName: string; // 类型中文名
    title: string; // 卡片标题
    dataItemGroup: IndViewParts;
    items: Item[]; // 独立指标（扁平化）
    groupViews?: GroupView[]; // 组合视图（卡片显示）
    groupViewType?: "carouselSection" | "carouselNormal"; // 轮播类型
}

interface Item {
    id: string;
    label: string;
    unit: string;
    detailTitle: string;
}

interface GroupView {
    id: string; // 组合 ID（建议用 "/" 连接子指标 ID）
    label: string;
    unit: string;
    viewType: "combined" | "simple";
    children: Array<{ id: string }>;
}
```

### 1.3 添加新指标

在 `presets.ts` 的 `viewItemDataTemplate` 中追加配置：

```typescript
{
    group: "group-name",
    type: "type-name",
    typeName: "类型名称",
    title: "显示标题",
    dataItemGroup: IndViewParts.VIEW_X,
    items: [
        { id: "new-id", label: "指标名称", unit: "单位", detailTitle: "详情标题" },
    ],
}
```

### 1.4 添加组合指标（推荐方式）

通过 `groupViews` 字段定义组合视图，`items` 仍保持独立（便于 API 数据匹配）：

```typescript
{
    group: "transmission",
    type: "transmission",
    typeName: "传输情况",
    title: "传输情况",
    dataItemGroup: IndViewParts.VIEW_G3,
    items: [
        // 独立指标（API 数据匹配用）
        { id: "14", label: "传输一干", detailTitle: "传输一干", unit: "个" },
        { id: "15", label: "传输二干", detailTitle: "传输二干", unit: "个" },
        { id: "16", label: "传输本地", detailTitle: "传输本地", unit: "个" },
    ],
    groupViews: [
        // 组合视图（卡片显示用）
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

`groupViews` 字段说明：

| 字段     | 类型   | 说明                                         |
| -------- | ------ | -------------------------------------------- |
| id       | string | 组合视图唯一标识（通常用 `/` 连接子指标 ID） |
| label    | string | 组合视图显示标签                             |
| unit     | string | 单位                                         |
| viewType | string | `"combined"` 或 `"simple"`                   |
| children | array  | 包含的子指标 ID 列表                         |

### 1.5 启用分段轮播（carouselSection）

需要"标题在轮播内部、按段展示"的场景（例如动环情况），使用 `groupViewType: "carouselSection"`：

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
        { id: "todo--5", label: "机楼", unit: "个", detailTitle: "环境异常-机楼" },
        { id: "todo--6", label: "重要汇聚", unit: "个", detailTitle: "环境异常-重要汇聚" },
        { id: "todo--7", label: "普通汇聚", unit: "个", detailTitle: "环境异常-普通汇聚" },
        { id: "todo--8", label: "业务汇聚", unit: "个", detailTitle: "环境异常-业务汇聚" },
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

`carouselSection` 特性：

- ✅ 标题在轮播内部显示
- ✅ 每个轮播页面独立分段
- ✅ 支持简单指标和组合指标混合使用
- ✅ 每个分段有自己的 `label`（分段标题）

### 1.6 切换轮播方式

从 `carouselNormal` 改为 `carouselSection`：

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

## 2. environment.json

**位置**：`apps/main/public/config/environment.json`

### 2.1 图表系列配置（unitIdSettings）

**路径**：`gd-emergency-support.unitIdSettings`

**作用**：配置区域统计柱状图的系列类型和字段映射。

```json
{
    "unitId": "1",
    "label": "停电站点",
    "group": "无线",
    "seriesType": [
        { "name": "移动", "fieldName": "kpiValue1" },
        { "name": "铁塔", "fieldName": "kpiValue2" }
    ]
}
```

| 字段         | 说明           | 示例                                             |
| ------------ | -------------- | ------------------------------------------------ |
| `unitId`     | 指标 ID        | `"1"`                                            |
| `label`      | 指标显示标签   | `"停电站点"`                                     |
| `group`      | 分组名称       | `"无线"`                                         |
| `seriesType` | 系列配置数组   | `[{ "name": "移动", "fieldName": "kpiValue1" }]` |
| `subTitle`   | 副标题（可选） | `"逻辑退服"`                                     |

> 折线图无需额外配置，自动使用 `presets.ts` 中的 `unitId` 和 `detailTitle`。

### 2.2 故障清单弹窗列配置

**路径**：`gd-emergency-support.rightNetworkCompactFaultListTable.columns`

**作用**：配置故障清单弹窗的列定义和显示。详细使用见 [fault-list-table.md](./fault-list-table.md)。

```json
{
    "gd-emergency-support.rightNetworkCompactFaultListTable": {
        "columns": [
            {
                "desc": "逻辑退服、2G退服、4G退服、5G退服",
                "unitId": ["4", "5", "6", "7"],
                "columns": [
                    { "fieldName": "siteLabel", "width": 300, "label": "退服基站名称" },
                    { "fieldName": "alarmTime", "width": 200, "label": "告警发生时间" },
                    { "fieldName": "workOrder", "width": 100, "label": "派单", "renderType": "type1" },
                    { "fieldName": "siteUnit", "width": "auto", "label": "产权" }
                ]
            }
        ]
    }
}
```

| 字段         | 说明                     | 示例                   |
| ------------ | ------------------------ | ---------------------- |
| `desc`       | 描述（仅用于维护时识别） | "逻辑退服..."          |
| `unitId`     | 命中的 unitId 列表       | `["4", "5", "6", "7"]` |
| `width`      | 列宽（数字或 `"auto"`）  | `300`                  |
| `label`      | 覆盖后端 `fieldLabel`    | `"退服基站名称"`       |
| `renderType` | 自定义渲染类型           | `"type1"`              |

`renderType` 映射到组件内 `cellRenderMap`（详见 [fault-list-table.md §6.1](./fault-list-table.md#61-内置-cellrendermap)）。

### 2.3 轮询间隔

**路径**：`gd-emergency-support.modules.network-conditions.request.interval`

```json
{
    "gd-emergency-support": {
        "modules": {
            "network-conditions": {
                "request": {
                    "interval": 300
                }
            }
        }
    }
}
```

> 建议值 300 秒，更短的间隔会显著增加后端压力。

---

## 3. 配色与样式

修改 `network-scale/index.css` 中的 CSS 变量：

| 元素   | 颜色                 | 说明            |
| ------ | -------------------- | --------------- |
| 主色   | `rgb(13, 255, 122)`  | 成功 / 激活状态 |
| 警告   | `rgb(254, 147, 146)` | 有值状态        |
| 零值   | `#fff`               | 无故障          |
| 激活   | `rgb(255, 237, 80)`  | 选中状态        |
| 无线左 | `rgb(40, 108, 246)`  | 偶数列标题色    |
| 无线右 | `rgb(246, 191, 40)`  | 奇数列标题色    |

布局尺寸（在 `index.css` / `networkScaleStyles` 中定义）：

- **总尺寸**: 1570px × 584px
- **无线部分**: 718px 宽
- **右侧列**: 204px 宽（Carousel）
- **SimpleCard**: 160px × 85px
- **MultiCard**: 278px × 181px

---

## 4. 配置维护 Checklist

| 任务             | 涉及文件                                                           |
| ---------------- | ------------------------------------------------------------------ |
| 新增指标         | `presets.ts`                                                       |
| 新增组合指标     | `presets.ts`（items + groupViews）                                 |
| 新增分段轮播     | `presets.ts`（`groupViewType: "carouselSection"`）                 |
| 新增图表系列     | `environment.json` → `unitIdSettings`                              |
| 新增弹窗列       | `environment.json` → `rightNetworkCompactFaultListTable.columns`   |
| 新增 unitId 弹窗 | `environment.json` + `request/right.ts`（apiList）                 |
| 调整轮询间隔     | `environment.json` → `modules.network-conditions.request.interval` |
| 调整配色         | `index.css`                                                        |
