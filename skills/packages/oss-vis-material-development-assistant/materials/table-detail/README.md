---
title: table-detail 物料概览
description: 明细表格物料的整体介绍、文件结构与核心特性
version: 1.0.0
last_updated: 2026-07-30
---

# 明细表格（table-detail）

## 基本信息

| 属性 | 值 |
|------|-----|
| **物料名** | `table-detail` |
| **标题** | 明细表格 |
| **分类** | 表格 |
| **复杂度** | 中 |
| **源文件路径** | `src/packages/table-detail/` |

## 文件结构

```
src/packages/table-detail/
├── oss-material.json           # 物料元信息
├── schema.ts                   # 配置面板 Schema 定义（含 FormCollapse 分组）
├── schema/
│   └── interactions.ts         # 交互面板 Schema（订阅 / 派发 / 动态事件 / 分页器派发）
├── index.tsx                   # 主组件入口（基于 oss-ui ProTable）
├── index.less                  # 样式文件
├── dataModel.json              # 数据模型定义（7 个 indicators，无 dimensions）
├── hooks/
│   ├── useScroll.tsx           # 表格滚动联动 hook（ResizeObserver + MutationObserver）
│   └── useCarousel.tsx         # 自动轮播 hook（setInterval + hover 暂停）
├── components/
│   ├── cell/
│   │   ├── index.tsx           # 单元格渲染器（plainText / Icon / DigitalFlop / Capsule / Checkbox）
│   │   └── constants.ts        # CellType 常量
│   ├── pagination/
│   │   ├── index.tsx           # 自研分页组件（基于 antd Pagination + pageSize Select）
│   │   └── index.less          # 分页样式
│   ├── styled/
│   │   └── index.tsx           # styled-components 容器
│   └── export-btn/
│       └── index.ts            # 工具栏导出按钮（引用其他物料）
└── doc/
    ├── readme.md               # 用户向文档（设计器侧边栏渲染）
    ├── CHANGELOG.md            # 变更日志
    └── images/                 # 文档截图（11 张）
```

## 核心特性

### 1. 双模分页（核心特性）
- **本地分页**（默认）：`_.chunk(visibleDataSource, pageSize)` 前端切页，total = chunk.length
- **服务端分页**：通过 `extraResponse.data.viewItemData.pagination` 识别；total 由服务端返回
- 自动检测（无需配置）：见 [component-logic.md § 2.2.3](./component-logic.md)

### 2. 单元格渲染器（CellRenderer）
支持 5 种内容类型（`src/packages/table-detail/components/cell/index.tsx`）：

| contentShowType | 用途 | 备注 |
|---|---|---|
| `plainText` | 默认纯文本 | 支持 `tooltip` / `controlByOtherField` / 分组聚合 |
| `Icon` | 图标 / 自定义图片 | `image:` 前缀走自定义图片 |
| `DigitalFlop` | 数字翻牌器 | 嵌入 `digital-flop` 物料，支持级别渲染 + trend |
| `Capsule` | 状态胶囊 | 根据 `enums.key` 着色 |
| `Checkbox` | 复选框 | **当前 `onCheckChange` 为空实现**（详见 gotchas § 2） |

### 3. 表头分组
通过 `groupSet` 数组配置分组，支持**两种聚合模式**（`compact: true / false`），详见 [component-logic.md § 2.2.2](./component-logic.md)。

### 4. 工具栏
- **导出按钮**（`enableExportBtn`）：引用 `../export-btn` 物料
- **搜索筛选栏**（`enableTableSearch`）：基于 ProTable 自带 search，支持 `submit / reset` 事件
- ⚠️ ProTable 自带的 `reload / density / fullScreen / setting` 全部 **disabled**（[component-logic.md § 2.2.5](./component-logic.md)）

### 5. 交互体系
- **行点击效果**：`clickEffect.open + style`，可设激活行背景色 / 边框
- **单元格点击派发**：`dynamicEvents` 数组配置（Modal / Drawer / Dispatch）
- **下钻事件**：`drilldownEvent` 全局配置（Modal / Drawer）
- **分页器订阅**：`subscribePaginationCurrent` / `subscribePaginationPageSize`（外部控制）
- **分页器派发**：`actionPaginationCurrent` / `actionPaginationPageSize`（翻页时对外派发）

### 6. 滚动联动
`useScroll` hook 通过 `ResizeObserver` + `MutationObserver` 实时计算 `ProTable` 内部 `scroll.y`，避免分页器 / 搜索栏出现遮挡。

### 7. 自动轮播（新增）
`useCarousel` hook 支持按指定间隔自动翻页，末页回到第 1 页循环：
- 配置项：`paginationSetting.enableCarousel` / `carouselInterval` / `pauseOnHover`
- 默认间隔 5 秒；可启用鼠标悬停暂停
- **仅本地分页生效**，服务端分页下不启动（详见 [component-logic.md § 2.2.8](./component-logic.md#228-自动轮播-usecarousel)）

### 8. 显隐表头（新增）
通过 `headerStyle.enableTableHeader` 控制表头渲染，默认 `true`：
- false 时不渲染 `<thead>` 元素，节省纵向空间
- ⚠️ 关闭后同分组其他字段（背景/字色/字号等）、`groupSet` 表头分组、列排序/筛选将全部静默失效
- `useScroll` 自动适应（无需额外改动）

### 9. 隐藏分页器（新增）
通过 `paginationSetting.hidePagination` 控制分页器 UI 显隐，默认 `false`：
- true 时仅隐藏分页器，**不影响自动轮播**、不影响翻页逻辑
- 与 `enableCarousel` 组合：开启后表格自动翻页但不显示分页器
- 与 `enablePagination` 区别：`enable` 是功能开关（关闭后数据不分页）；`hidePagination` 仅 UI 隐藏

### 10. 列字段模板（新增）
通过顶层 `columnsRenderTemplate` 数组对指定列的展示文本做模板化拼接：
- 每项包含 `dataIndex`（作用列）和 `template`（模板字符串）
- 模板语法：`{{字段名}}` 引用当前行的字段值；未命中字段自动 fallback 为 `'-'`
- 示例：`{{policyPlatform}} ({{serverCount}} 台)` → `财政厅1 (36 台)`
- 仅对 `plainText` 类型的列生效；其他类型（Capsule/Icon/DigitalFlop/Checkbox）无效
- 优先级：聚合展示（`groupSet.includesFields`）> 模板 > 默认值；`enumRender` 仍可覆盖模板文本
- 详见 [component-logic.md § 2.2.9](./component-logic.md#229-列字段模板渲染-columnsrendertemplate)

## 默认配置

```typescript
{
    config: {
        width: 1000, height: 500, left: 15, top: 15,
        headerStyle: { fontSize: 16, color: '#00DEFF', backgroundColor: '#0D285C', height: 24, fontFamily: 'PangMenZhengDao' },
        rowSetting: {
            fieldNameForKey: 'policyPlatformId',
            height: 38,
            color: '#E5E5E5',
            oddRowBg: 'rgba(2,62,171,0)',
            evenRowBg: 'rgba(2,62,171,0.1)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1, borderStyle: 'dashed',
            clickEffect: { open: true, style: { borderColor: '#004DD9', borderWidth: 1, borderStyle: 'solid', backgroundColor: 'rgba(0, 77, 217, 0.2)' } },
        },
        columns: [...7 列：政务平台 / 服务器数量 / CPU利用率 / 内存利用率 / 一级告警 / 二级告警 / 二级告警（带分组合并）],
        groupSet: [{ groupName: '性能', compact: false }, { groupName: '告警', compact: false }],
        paginationSetting: { enable: true, enablePageSizer: true, pageSize: 50, customPageSize: 50, left: 0 },
        otherStyleSetting: { enableExportBtn: true, enableTableSearch: true },
    },
    dataConfig: {
        dataType: 'json',
        json: [/* 6 条财政厅示例数据 */],
        isRefresh: false,
        refreshTime: 5 * 60,
    },
    interactions: {
        configurableEvent: { drilldownEvent: { show: true, effect: 'Modal', drilldownItemFields: 'policyPlatformId' } },
    },
}
```

## 文档导航

| 文档 | 说明 | 维度 |
|------|------|------|
| [schema.md](./schema.md) | 配置面板字段定义、分组结构 | 🟦 Schema |
| [component-logic.md](./component-logic.md) | 组件渲染逻辑、滚动联动、分页策略 | 🟨 组件逻辑 |
| [data-model.md](./data-model.md) | dataModel.json 字段、数据契约 | 🟩 数据 |
| [common-tasks.md](./common-tasks.md) | 常见修改任务指南 | - |
| [gotchas.md](./gotchas.md) | 踩坑记录与注意事项 | - |

## 使用场景

适用于可视化大屏中需要展示**明细数据列表**的场景：

- 监控告警列表（支持点击下钻查看详情）
- 政务平台 / 机房 / 服务器等明细表格
- 需要**本地搜索 + 导出 + 分页**的复合型表格
- 需要与服务端分页（数据集 / API）联动的表格