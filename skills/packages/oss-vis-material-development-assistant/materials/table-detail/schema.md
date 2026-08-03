---
title: Schema 结构
description: table-detail schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-07-30
---

# Schema 结构

源文件：

-   `packages/table-detail/schema.ts`（配置面板）
-   `packages/table-detail/schema/interactions.ts`（交互面板）

## 1. 顶层结构

```typescript
{
    materials: 'table-detail',
    fields: [
        {
            name: '配置', key: 'config',
            schema: { type: 'object', properties: { config: { ...BASE_LAYOUT + FormCollapse(...) } } },
        },
        renderDataConfig({ fields: [...indicators], showDataStatusSwitch: true }),  // 数据面板
        {
            name: '导出接口', key: 'customDataSourceApiConfig',
            schema: { type: 'object', properties: { customDataSourceApiConfig: { 'x-component': 'ExportApi' } } },
        },
        defineInteractionSchema({ ...interactionsSchema }),  // 交互面板
    ],
}
```

> 注：未独立声明 `defineDataConfigSchema`，而是直接用 `renderDataConfig()`（来自 `@Common/schema`），并通过 `dataModel.dataModelDefinition.header.indicators` 展开 fields。

## 2. FormCollapse 分组详情

> 所有分组位于 `properties.config.$collapse.properties` 下，header 即配置面板左侧折叠面板的标题。

### 2.1 基础配置（继承自 `BASE_LAYOUT` + `getCompTitle`）

| 字段           | 类型    | 标题            | x-component    | 说明                                              |
| -------------- | ------- | --------------- | -------------- | ------------------------------------------------- |
| `title`        | string  | 标题            | `Input`        | 组件标题                                          |
| `width`        | number  | 宽度            | `NumberPicker` | 外层容器宽度（像素）                              |
| `height`       | number  | 高度            | `NumberPicker` | 外层容器高度（**驱动 `useScroll` 计算 scrollY**） |
| `left` / `top` | number  | 左边距 / 顶边距 | `NumberPicker` | 容器位置                                          |
| `isLock`       | boolean | 锁定            | `Switch`       | 禁止拖动                                          |
| `isHidden`     | boolean | 隐藏            | `Switch`       | 编辑器中不渲染                                    |

### 2.2 表格列字段 `$columns`

| 字段      | 类型  | x-component   | x-component-props                           | 组件读取方式                                     |
| --------- | ----- | ------------- | ------------------------------------------- | ------------------------------------------------ |
| `columns` | array | `ObjectArray` | `enableFontStyle: true, enableSearch: true` | `config.columns`（→ component-logic.md § 2.2.1） |

> `enableSearch: true` 让每列支持"出现在搜索筛选栏"开关。

### 2.3 列字段模板 `$columnsRenderTemplate`

| 字段                                | 类型   | x-component      | 默认值 | 说明                                                             |
| ----------------------------------- | ------ | ---------------- | ------ | ---------------------------------------------------------------- |
| `columnsRenderTemplate`             | array  | `ArrayCollapse`  | `[]`   | 每个元素描述一列的模板配置（→ component-logic.md § 2.2.7）       |
| `columnsRenderTemplate[].dataIndex` | string | `Input`          | `''`   | 作用列的 `dataIndex`（与 `columns[].dataIndex` 对齐）            |
| `columnsRenderTemplate[].template`  | string | `Input.TextArea` | `''`   | 模板字符串，支持 `{{字段名}}` 引用当前行字段值；未命中显示 `'-'` |

> 仅对 `plainText` 类型的列生效；详见 doc/readme.md「列字段模板」段落。

### 2.4 表头组设置 `$groupSet`

| 字段                          | 类型    | x-component     | 说明                                                 |
| ----------------------------- | ------- | --------------- | ---------------------------------------------------- |
| `groupSet`                    | array   | `ArrayCollapse` | 每项对应一个表头分组（→ component-logic.md § 2.2.2） |
| `groupSet[].groupName`        | string  | `Input`         | 分组名（与 `columns[].group` 对齐）                  |
| `groupSet[].compact`          | boolean | `Switch`        | **是否聚合展示**（false=展开成子列，true=合并显示）  |
| `groupSet[].compactSeperator` | string  | `Input`         | 聚合模式下的子项分隔符（仅 `compact=true` 生效）     |

> ⚠️ `compactSeperator` 的 `x-reactions.when` 依赖 `.compact`（详见 gotchas § 4）。

### 2.5 表头设置 `headerStyle`

| 字段 | 类型 | 标题 | x-component | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `enableTableHeader` | boolean | 显示表头 | `Switch` | `true` | false 则不渲染 `<thead>`；同分组其他字段、`groupSet` 表头分组、列排序/筛选将全部失效（详见 gotchas § 15） |
| `backgroundColor` | string | 背景颜色 | `ColorPicker` | — | 表头背景 |
| `fontWeight` | string | 字重 | `Select` | — | 枚举 `FONT_WEIGHT` |
| `color` | string | 字色 | `ColorPicker` | — | 表头字色 |
| `fontSize` | number | 字号 | `NumberPicker` | — | — |
| `fontFamily` | string | 字体 | `Select` | — | 枚举 `GLOBAL_FONTS` |
| `height` | number | 表头单元格高度 | `NumberPicker` | — | — |

### 2.6 表格行设置 `rowSetting`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `fieldNameForKey` | string | 行标识字段 | `Input` | **空则使用 index 作 key**（→ gotchas § 3） |
| `height` | number | 单行高度 | `NumberPicker` | — |
| `color` | string | 字色 | `ColorPicker` | — |
| `fontSize` | number | 字号 | `NumberPicker` | — |
| `oddRowBg` | string | 奇数行背景色 | `ColorPicker` | — |
| `evenRowBg` | string | 偶数行背景色 | `ColorPicker` | — |
| `borderColor` / `borderWidth` / `borderStyle` | — | 边框 | `ColorPicker` / `NumberPicker` / `Select` | — |

#### 2.6.1 行单击效果 `rowSetting.clickEffect`

| 字段                    | 类型    | 标题     | x-component    | 说明                         |
| ----------------------- | ------- | -------- | -------------- | ---------------------------- |
| `open`                  | boolean | 是否开启 | `Switch`       | 开启后点击行触发 active 样式 |
| `style.borderColor`     | string  | 边框颜色 | `ColorPicker`  | —                            |
| `style.borderWidth`     | number  | 边框宽度 | `NumberPicker` | —                            |
| `style.borderStyle`     | string  | 边框样式 | `Select`       | —                            |
| `style.backgroundColor` | string  | 背景色   | `ColorPicker`  | —                            |

### 2.7 分页器配置 `paginationSetting`

> 表格类物料的**核心分组**。组件读取方式见 [component-logic.md § 2.2.3](./component-logic.md)。

| 字段 | 类型 | 标题 | x-component | 默认值 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `enable` | boolean | 启用 | `Switch` | `true` | **false 则不渲染分页器**，数据全量展示 |
| `hidePagination` | boolean | 隐藏分页器 | `Switch` | `false` | 仅隐藏分页器 UI，**不影响自动轮播**（详见 component-logic § 2.2.6） |
| `enablePageSizer` | boolean | 启用分页控制器 | `Switch` | `true` | false → 用 `customPageSize` 固定切页 |
| `pageSize` | number | 每页条数 | `Select` | `50` | 仅 `enablePageSizer=true` 时显示，枚举：`10 / 20 / 50 / 100` |
| `customPageSize` | number | 自定义每页条数 | `NumberPicker` | `50` | 仅 `enablePageSizer=false` 时显示 |
| `left` | string | 位置 | `NumberPicker` | `0` | 分页器距左边距（控制容器 `paddingLeft`，详见 gotchas § 1） |
| `enableCarousel` | boolean | 启用自动轮播 | `Switch` | `false` | 启用后表格按间隔自动翻页；仅本地分页生效（服务端分页下不启动，详见 component-logic § 2.2.8） |
| `carouselInterval` | number | 轮播间隔（秒） | `NumberPicker` | `5` | 仅 `enableCarousel=true` 时显示，范围 1 ~ 60 |
| `pauseOnHover` | boolean | 鼠标悬停时暂停 | `Switch` | `true` | 仅 `enableCarousel=true` 时显示 |

### 2.8 其他配置 `otherStyleSetting`

| 字段                | 类型    | 标题       | x-component | 默认值 | 说明                                            |
| ------------------- | ------- | ---------- | ----------- | ------ | ----------------------------------------------- |
| `enableExportBtn`   | boolean | 启用导出   | `Switch`    | `true` | 显示工具栏的 `ExportBtn`                        |
| `enableTableSearch` | boolean | 启用筛选栏 | `Switch`    | `true` | false → ProTable `search={false}`，搜索栏不渲染 |

## 3. 数据面板

-   **`renderDataConfig(...)`**：`fields` 由 `dataModel.dataModelDefinition.header.indicators` 展开（7 个 string 类型字段）
-   `showDataStatusSwitch: true` → 数据面板显示"启用 / 停用"开关
-   支持的数据类型：`json` / `api` / `dataSet` / `sql`
-   默认 `dataConfig.dataType = 'json'`

## 4. 导出接口面板（独立分组）

```typescript
{
    name: '导出接口',
    key: 'customDataSourceApiConfig',
    schema: { customDataSourceApiConfig: { 'x-component': 'ExportApi' } },
}
```

> 工具栏的 `ExportBtn` 会读取此配置（→ 引用 `../export-btn` 物料）。

## 5. 交互面板（`defineInteractionSchema(interactionsSchema)`）

> 交互面板分三块：**订阅 / 派发 / 动态事件**。详见 `src/packages/table-detail/schema/interactions.ts`。

### 5.1 订阅分页器参数 `$subscribe.$paginationSubscribe`

| 字段                          | 类型   | 标题     | 组件读取                                                                            |
| ----------------------------- | ------ | -------- | ----------------------------------------------------------------------------------- |
| `subscribePaginationCurrent`  | string | 当前页码 | `props.interactionProps.subscribePaginationCurrent`（→ component-logic.md § 2.2.4） |
| `subscribePaginationPageSize` | string | 每页条数 | `props.interactionProps.subscribePaginationPageSize`                                |

> 用于外部组件 / 全局 hook 驱动本表格的 `current / pageSize`。

### 5.2 分页器派发参数 `$paginationAction`

| 字段                       | 类型   | 标题     | 派发时机                                                 |
| -------------------------- | ------ | -------- | -------------------------------------------------------- |
| `actionPaginationCurrent`  | string | 当前页码 | 翻页时（`onPaginationChange`）派发 `state: info.current` |
| `actionPaginationPageSize` | string | 每页条数 | 翻页时派发 `state: info.pageSize`                        |

> 与 § 5.1 共同构成分页器的发布 / 订阅链路。

### 5.3 下钻事件 `$onClickAction.configurableEvent.drilldownEvent`

| 字段                         | 类型    | 标题     | 说明                                                                          |
| ---------------------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `show`                       | boolean | 下钻开关 | —                                                                             |
| `effect`                     | string  | 事件效果 | 枚举：`Modal / Drawer`                                                        |
| `modalSet.*` / `drawerSet.*` | —       | 弹窗配置 | 与 `drilldown-table-2` 兼容（详见 `src/packages/table-detail/doc/readme.md`） |
| `drilldownItemFields`        | string  | 其他参数 | 下钻 query 参数（逗号分隔字段名）                                             |

### 5.4 动态事件 `$dynAction.dynamicEvents`

ArrayCollapse 数组，每项配置一种交互：

| 字段                   | 类型   | 标题         | x-component  | 说明                                                                   |
| ---------------------- | ------ | ------------ | ------------ | ---------------------------------------------------------------------- |
| `effect`               | string | 事件类型     | `Select`     | 枚举：`RowDispatch / CellDispatch / Modal / Drawer / CheckboxDispatch` |
| `clickKey`             | string | 事件唯一标识 | `Input`      | **通常填列的 `dataIndex`**，用于精确匹配                               |
| `rowClickFieldMapping` | array  | 事件数据映射 | `ArrayItems` | 仅 `RowDispatch` 生效：把列字段值派发到目标 `action`                   |

> `dynamicEvents` 第 0 项如果是 `RowDispatch`，后续不允许再添加新事件（schema 通过 `x-reactions.run` 强制）。

## 6. 使用的特殊 x-component 清单

| 组件                                          | 用途                    | 备注                                    |
| --------------------------------------------- | ----------------------- | --------------------------------------- |
| `FormCollapse` / `FormCollapse.CollapsePanel` | 折叠面板                | 7 个分组全部用此容器                    |
| `ObjectArray`                                 | 表格列数组              | `enableFontStyle` / `enableSearch` 增强 |
| `ArrayCollapse`                               | 表头分组 / 动态事件数组 | —                                       |
| `ArrayItems`                                  | 列字段映射              | —                                       |
| `ColorPicker`                                 | 颜色选择                | —                                       |
| `NumberPicker`                                | 数字输入                | —                                       |
| `Switch`                                      | 布尔开关                | —                                       |
| `Select`                                      | 下拉选择                | —                                       |
| `Input`                                       | 文本输入                | —                                       |
| `DynamicData`                                 | 数据配置面板            | 来自 `@Common/schema.renderDataConfig`  |
| `ExportApi`                                   | 导出接口配置            | 独立面板                                |
| `Space` / `FormLayout`                        | 布局                    | Modal / Drawer 配置项布局               |

## 7. 默认值参考

`schema.ts` 末尾 `defaultValue` 关键项：

### 7.1 config（关键值）

```typescript
config: {
    title: 'table-detail',
    width: 1000, height: 500, left: 15, top: 15,
    isLock: false, isHidden: false,
    headerStyle: { fontSize: 16, color: '#00DEFF', backgroundColor: '#0D285C', height: 24, fontFamily: 'PangMenZhengDao' },
    rowSetting: { /* 见 schema § 2.5 */ },
    columns: [
        { dataIndex: 'policyPlatform', search: true, width: 80, contentShowType: 'plainText' },
        { dataIndex: 'serverCount', search: true, width: 100 },
        { dataIndex: 'CPURate', group: '性能', width: 100, contentShowType: 'digitalFlop', contentProps: { levels: [...] } },
        { dataIndex: 'memoryRate', group: '性能', width: 100, contentShowType: 'digitalFlop', contentProps: { levels: [...] } },
        { dataIndex: 'firstLevelAlarm', group: '告警', width: 100, contentShowType: 'plainText' },
        { dataIndex: 'secondLevelAlarm', group: '告警', width: 100, contentShowType: 'capsule', contentProps: { enums: [...] } },
    ],
    groupSet: [
        { groupName: '性能', compact: false, compactSeperator: '/' },
        { groupName: '告警', compact: false, compactSeperator: '/' },
    ],
    paginationSetting: { enable: true, enablePageSizer: true, pageSize: 50, customPageSize: 50, left: 0 },
    otherStyleSetting: { enableExportBtn: true, enableTableSearch: true },
}
```

### 7.2 dataConfig

```typescript
dataConfig: {
    dataType: 'json',
    json: [
        { policyPlatform: '财政厅1', serverCount: 36, CPURate: 40, memoryRate: 40, firstLevelAlarm: 2, secondLevelAlarm: 3, policyPlatformId: '0' },
        // ... 6 条
    ],
    isRefresh: false,
    refreshTime: 5 * 60,  // 5 分钟
}
```

### 7.3 interactions

```typescript
interactions: {
    configurableEvent: {
        drilldownEvent: {
            show: true, effect: 'Modal',
            params: '', width: 600, height: 600, left: 200, top: 100,
            mask: true, closable: true,
            drilldownItemFields: 'policyPlatformId',
            closeIconLeft: 25, closeIconTop: 25,
        },
    },
}
```
