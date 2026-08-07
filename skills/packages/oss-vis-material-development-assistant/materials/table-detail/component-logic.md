---
title: 组件逻辑维护
description: table-detail 组件代码（index.tsx + 子组件 + hooks）的维护要点
version: 1.0.0
last_updated: 2026-07-30
---

# 组件逻辑维护

本文档说明 `table-detail` 组件代码的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
table-detail/
├── index.tsx                   # 主组件（基于 oss-ui ProTable + ConfigProvider prefixCls="oss-ui"）
├── index.less                  # 样式（根 class: .visual-base-table-detail）
├── schema.ts                   # 配置面板（→ schema.md）
├── schema/interactions.ts      # 交互面板
├── dataModel.json              # 数据契约（→ data-model.md）
├── hooks/
│   ├── useScroll.tsx           # 滚动联动 hook
│   └── useCarousel.tsx         # 自动轮播 hook
└── components/
    ├── cell/
    │   ├── index.tsx           # 单元格渲染器
    │   └── constants.ts        # CellType 枚举
    ├── pagination/
    │   ├── index.tsx           # 自研分页组件
    │   └── index.less
    ├── styled/
    │   └── index.tsx           # styled-components 容器
    └── export-btn/
        └── index.ts            # 工具栏导出按钮（引用 ../export-btn）
```

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
const TableDetail: React.FC<DesignerField & { dataConfig: any; exportAPIConfig: any }> = (props) => {
    const { className, config, dataSource, designer, interaction } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
|---|---|---|---|
| `config` | object | schema | 用户配置（含 columns / groupSet / headerStyle / rowSetting / paginationSetting / otherStyleSetting） |
| `dataSource` | array | 平台注入 | 渲染数据 |
| `designer` | object | 平台 | 设计器上下文（含 `env / constants / prefix`） |
| `interaction` | object | 平台 | 交互配置（含 `defined / dispatch`） |
| `interactionProps` | object | 平台 | 外部订阅参数（`subscribePaginationCurrent` / `subscribePaginationPageSize`） |
| `extraResponse` | object | 平台 | 服务端分页数据（`extraResponse.data.viewItemData.pagination`） |
| `receivedPropsParams` | object | 平台 | 透传给 `ExportBtn` 的外部参数 |
| `dataConfig` | object | 平台 | 数据配置 |
| `exportAPIConfig` | object | 平台 | 导出接口配置 |

### 2.2 关键逻辑

#### 2.2.1 单元格包装 `withCellRender`

```typescript
const withCellRender = (column, ownerProps, extra) => {
    // 给每列注入：
    // - ellipsis: true（省略号）
    // - onCell: 单击事件（event.stopPropagation + 调用 onCellClick）
    // - render: 用 <CellRenderer> 渲染
    return { ...column, ellipsis: true, onCell: (record, rowIndex) => ({ onClick }), render: (...) => <CellRenderer ... /> };
};
```

> 转换在 `formattedColumns`（`src/packages/table-detail/index.tsx`）的 `useMemo` 里执行。

#### 2.2.2 表头分组合成 `formattedColumns`

根据 `groupSet` 配置将 `columns` 重组为嵌套表头：

```typescript
// compact=false → 生成 { title, children: [col1, col2] }
// compact=true  → 生成单列聚合展示（dataIndex 用 includesFields.join(',')）
```

> 详见 `src/packages/table-detail/components/cell/index.tsx` 聚合模式下的 `text` 拼接逻辑。

#### 2.2.3 双模分页 `tableInfo`（核心特性）

```typescript
const servicePagination = useViewItemDataPagination(props);  // 来自 @Src/hooks/useDataSourcePagination
const [paginationState, setPaginationState] = useSetState({ current: 1, pageSize: 50 });

const tableInfo = useMemo(() => {
    if (!enablePagination) return { dataSource: visibleDataSource };

    const pageSize = enablePageSizer ? paginationState.pageSize : customPageSize;
    const chunk = _.chunk(visibleDataSource, pageSize);

    return {
        dataSource: chunk.length <= 1 ? chunk[0] : chunk[paginationState.current - 1],
        total: servicePagination ? Infinity : chunk.length,  // 服务端分页：total 交给 Pagination 从 servicePagination 取
        pageSize,
    };
}, [enablePagination, visibleDataSource, enablePageSizer, paginationState, customPageSize, servicePagination]);
```

**两种模式对比**：

| 维度 | 本地分页（默认） | 服务端分页 |
|---|---|---|
| 触发条件 | `extraResponse.data.viewItemData.pagination` 为空 | 该字段存在 |
| 数据切割 | `_.chunk(visibleDataSource, pageSize)` | 不切，假设数据已是当前页 |
| `total` | `chunk.length` | `Infinity`（**让 Pagination 从 servicePagination 取 total**） |
| 分页器 total 来源 | `dataSource.length ?? 0`（`src/packages/table-detail/index.tsx`） | `servicePagination.total` |
| 是否触发 API | ❌（table-detail 本身不调 API） | 取决于数据源 hook 是否监听 current/pageSize 变化 |

#### 2.2.4 外部订阅 `subscribePaginationCurrent / subscribePaginationPageSize`

```typescript
const { subscribePaginationCurrent, subscribePaginationPageSize } = props.interactionProps || {};

useEffect(() => {
    const nextState = {};
    const nextPageSize = subscribePaginationPageSize ?? configPageSize;
    if (!_.isNaN(Number(nextPageSize))) Object.assign(nextState, { pageSize: configPageSize });
    if (!_.isNaN(Number(subscribePaginationCurrent))) Object.assign(nextState, { current: subscribePaginationCurrent });
    initPagination(nextState);
    if (!_.isEmpty(nextState)) setPaginationState(nextState);
}, [configPageSize, subscribePaginationCurrent, subscribePaginationPageSize, ...]);
```

> `initPagination` 通过 `initFlagRef` 守卫，确保**只初始化一次**（`src/packages/table-detail/index.tsx`）。

#### 2.2.5 渲染 `ProTable`

```typescript
<ProTable
    rowClassName="visual-base-table-detail-row"
    columns={formattedColumns}
    dataSource={tableInfo.dataSource}
    pagination={false}                 // 关闭 ProTable 自带分页
    bordered
    showHeader={headerStyle?.enableTableHeader !== false}  // 默认 true；false 时不渲染 <thead>
    search={enableTableSearch === false ? false : undefined}
    options={{ reload: false, density: false, fullScreen: false, setting: false }}  // 全部禁用
    toolBarRender={...}
    scroll={scrollY === null ? undefined : { y: scrollY }}
    onHeaderRow={() => ({ style: headerStyle })}
    onRow={(record, rowIndex = 0) => ({
        onClick: (e) => onRowClick(e, record, rowIndex),
        style: { ...rowSetting, backgroundColor: rowIndex % 2 === 0 ? oddRowBg : evenRowBg, ...clickEffectStyle },
    })}
    onSubmit={onSubmit}                // 搜索提交 → setSearchParams
    onReset={() => setSearchParams(null)}
/>
```

**`showHeader` 影响范围**（详见 gotchas § 15）：

- `enableTableHeader = false` → rc-table 不渲染 `<thead>` 元素
- `useScroll` 的 `tableHeaderHeight` 自动为 0（querySelector 返回 null → `getElementHeight(null)=0`），无需改动 useScroll
- 同分组的其他字段（背景/字色/字号等）以及 `groupSet` 表头分组、列排序/筛选将全部静默失效

#### 2.2.6 条件渲染分页器 `showPagination`

```typescript
const showPagination = useMemo(() => {
    return !_.isEmpty(tableInfo.dataSource) && enablePagination && !hidePagination && tableInfo.total! > 1;
}, [enablePagination, hidePagination, tableInfo.dataSource, tableInfo.total]);
```

渲染条件：

| 条件 | 行为 |
| --- | --- |
| `tableInfo.dataSource` 为空 | 不渲染（避免显示"0 条"的空分页器） |
| `enablePagination = false` | 不渲染（功能关闭） |
| `hidePagination = true` | 不渲染（仅 UI 隐藏，不影响 carousel / 翻页逻辑） |
| `tableInfo.total <= 1` | 不渲染（只有 1 页时不显示分页器） |

**`hidePagination` 与 `enablePagination` 的区别**：

- `enable` = 是否启用分页**功能**（false → 数据不分页、`tableInfo.total` 变为 undefined，carousel 自动不启动）
- `hidePagination` = 是否**视觉上**隐藏分页器（false 时一切正常，true 时仅 UI 不渲染，carousel 继续工作）

典型用法：`enable=true + hidePagination=true + enableCarousel=true + total>1` → 表格自动翻页，无分页器干扰。

#### 2.2.7 分页器派发 `onPaginationChange`

```typescript
const onPaginationChange = usePersistFn((info) => {
    const dispatchData: any[] = [];
    if (interaction?.defined?.actionPaginationCurrent) {
        dispatchData.push({ fieldName: 'actionPaginationCurrent', state: info.current });
    }
    if (interaction?.defined?.actionPaginationPageSize) {
        dispatchData.push({ fieldName: 'actionPaginationPageSize', state: info.pageSize });
    }
    if (!_.isEmpty(dispatchData)) interaction.dispatch({ data: dispatchData });
    setPaginationState(info);
});
```

#### 2.2.8 行单击效果与取消

`rowSetting.clickEffect.open = true` 时，行被点击会高亮（取 `fieldNameForKey` 字段值或 `rowIndex` 作为 key，写入 `activeRowKey`）。当前支持的取消触发：

```typescript
// 1) 点击行：写入激活 key（不含 toggle）
const onRowClick = usePersistFn((event, record, rowIndex) => {
    event?.stopPropagation();
    if (!enableRowClickEffect) return;

    const nextKey = rowSetting.fieldNameForKey ? record[rowSetting.fieldNameForKey] : rowIndex;
    // 再次点击已激活行 → 取消高亮
    setActiveRowKey(nextKey);
});

// 2) 点表格外部 / 3) 按 Esc → 取消（document 级监听，仅在开启时挂）
useEffect(() => {
    if (!enableRowClickEffect) return;
    const rootEl = rootElementRef.current;
    if (!rootEl) return;

    const isOutsideTable = (e: MouseEvent) => {
        const target = e.target as Element;
        if (rootEl.contains(target)) return false;
        // 弹出的 Modal/Drawer 容器在 ConfigProvider prefixCls="oss-ui" 下类名带 oss-ui- 前缀
        return !target.closest(
            '.oss-ui-modal, .oss-ui-modal-wrap, .oss-ui-modal-mask, .oss-ui-drawer, .oss-ui-drawer-content',
        );
    };

    const onDocClick = (e: MouseEvent) => {
        if (isOutsideTable(e)) setActiveRowKey(undefined);
    };
    const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveRowKey(undefined);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
        document.removeEventListener('mousedown', onDocClick);
        document.removeEventListener('keydown', onKey);
    };
}, [enableRowClickEffect]);
```

##### 行为对照

| 场景 | 行为 |
| --- | --- |
| 点击非激活行 | 高亮新行（`activeRowKey` 设为 `nextKey`） |
| 再次点击已激活行 | state 值不变，仍高亮 |
| 点击表格外部 | 取消高亮（`setActiveRowKey(undefined)`） |
| 点击弹出的 Modal / Drawer 内部 | 视作仍属表格上下文，不取消 |
| 按 Esc | 取消高亮 |

##### 关键设计点

| 设计 | 说明 |
| --- | --- |
| 用 `mousedown` 而非 `click` | 在 `click` 之前触发，避免行点击自身把高亮"擦掉" |
| 监听器只挂在 `document`，deps 仅依赖 `enableRowClickEffect` | 组件生命周期内只挂/摘一次；切换激活行不重新注册 |
| Modal/Drawer 容器算"内部" | `ConfigProvider prefixCls="oss-ui"`，容器类名带 `oss-ui-` 前缀；`closest` 兼容覆盖 wrapper / mask / drawer-content 多层 |
| `activeRowKey` 类型 | `string \| number \| undefined`，避免 `useState(undefined)` 被推成 `undefined` 单类型 |

### 2.2.9 自动轮播 `useCarousel`

新增能力：启用后表格按指定间隔自动翻页，末页回到第 1 页循环。

```typescript
// index.tsx
const safeTotal = Number.isFinite(tableInfo.total) ? tableInfo.total : Infinity;
useCarousel({
    enabled: enableCarousel && enablePagination && safeTotal > 1,
    total: safeTotal,
    interval: carouselInterval,
    pauseOnHover,
    containerRef: rootElementRef,  // 复用 rootElementRef
    currentPage: paginationState.current,
    onChange: (next) => setPaginationState({ current: next }),
});
```

**关键行为（见 `src/packages/table-detail/hooks/useCarousel.tsx`）**：

| 条件 | 行为 |
| --- | --- |
| `enableCarousel = true` 且 `enablePagination = true` 且 `total > 1` 且本地分页 | 启动 setInterval，按 `interval` 秒周期调用 `onChange((current % total) + 1)` |
| `total = Infinity`（服务端分页） | 不启动（hook 内部 `Number.isFinite` 守卫 + 上层 `enable` 双重守卫） |
| `total <= 1` | 不启动 |
| `pauseOnHover = true` 且鼠标进入容器 | 暂停（不打断定时器，仅闭包内 `paused = true` 跳过 tick） |
| 鼠标离开容器 | 从暂停点恢复（`paused = false`） |
| 组件卸载 / `enabled` 切为 `false` | cleanup `clearInterval` + 解绑 mouseenter / mouseleave |
| 用户手动翻页 | **不停**轮播，按节奏继续 |

**为何服务端分页不启动**：

`tableInfo.total = Infinity`（详见 § 2.2.3），若数据源 hook 监听 `paginationState.current` 变化重新发请求：
- `setInterval` 每 5 秒触发一次 `onChange(current + 1)`
- 数据源 hook 每 5 秒发一次 API 请求
- 1 小时 = 720 次请求，**流量风暴**

因此 MVP 阶段直接禁用，schema `description` 字段已加警告文案。未来若要支持需额外机制（如"轮播周期内只发一次请求"）。

**实现要点**：

- 用 `useRef` 持续跟踪 `currentPage` / `onChange`，避免定时器回调拿闭包旧值
- `setInterval` 句柄 + `paused` 闭包变量都在 `useEffect` 内部，依赖变化时整体重建
- 容器复用 `rootElementRef`（已在 `StyledContainer` 上挂载），不新增 ref

### 2.2.9 列字段模板渲染 `columnsRenderTemplate`

新增能力：对指定列的展示文本做模板化拼接，可在一列中组合多个字段。

**数据流**：

```
config.columnsRenderTemplate       (顶层数组，每项 { dataIndex, template })
       ↓ latestConfig.current
index.tsx: withCellRender(column, ownerProps)
       ↓ 透传 columnsRenderTemplate props
CellRenderer (plainText 分支)
       ↓ template(item.template, record)
最终 text
```

**渲染决策顺序（plainText 分支）**：

```typescript
// components/cell/index.tsx (plainText 分支)
let text = record[columSetting.dataIndex];                                // ① 默认

const tmplItem = columnsRenderTemplate?.find(c => c?.dataIndex === columSetting.dataIndex);
const hasTemplate = !!tmplItem?.template;

if (belongGroup) {                                                          // ② 聚合展示（覆盖模板）
    text = belongGroup.includesFields.map(...);
} else if (hasTemplate) {                                                   // ③ 模板（仅 belongGroup 未命中时生效）
    text = template(tmplItem.template, record);
}

if (controlledField && controlMode) {                                       // ④ controlledField
    if (controlMode === 'enumRender') {                                     // 枚举替换可覆盖模板文本
        text = setting.text;
    }
}
```

**优先级总结**：

| 优先级 | 来源 | 说明 |
| --- | --- | --- |
| 1（最低） | `record[dataIndex]` 默认值 | 无任何配置时 |
| 2 | **模板** | 用户配置 `columnsRenderTemplate` 命中 |
| 3 | belongGroup | 聚合展示（与模板互斥，if/else if） |
| 4（最高） | enumRender | 强语义控制，胜出模板 |

**边界行为**：

- `columnsRenderTemplate` 未配置 → 完全无副作用，走原有逻辑
- 模板 dataIndex 找不到对应列 → 静默忽略
- `contentShowType !== 'plainText'` → 不进入该分支，模板不生效
- 模板路径未命中字段 → `template()` 自动 fallback `'-'`
- 同列多条模板 → 取第一条（`find` 行为）

**示例**（基于示例数据）：

```typescript
// config.columnsRenderTemplate:
[
    { dataIndex: 'policyPlatform', template: '{{policyPlatform}} ({{serverCount}} 台)' },
    { dataIndex: 'cpuInfo', template: 'CPU {{CPURate}}% / MEM {{memoryRate}}%' },
]

// 渲染结果：
// policyPlatform 列 → "财政厅1 (36 台)"
// cpuInfo 列        → "CPU 40% / MEM 40%"
```

`template()` 工具函数见 `src/utils/template.ts`，详见 `src/utils/template.ts` 头部 JSDoc。

### 2.2.10 数据过滤 `dataExtraSetting.dataFilterTypeFieldName`

新增能力：基于外部订阅值过滤 dataSource，配合 `subscribeDataFilterType` 使用。

**数据流**：

```
config.dataExtraSetting.dataFilterTypeFieldName (要过滤的字段名)
        ↓ 解构
index.tsx (顶层变量 dataFilterTypeFieldName)
        ↓ visibleDataSource useMemo
props.interactionProps.subscribeDataFilterType (订阅值)
        ↓
filter((item) => `${item[dataFilterTypeFieldName]}` === `${subscribeDataFilterType}`)
        ↓
visibleDataSource（已过滤的 dataSource）
        ↓
分页计算 / 渲染
```

**过滤逻辑**（`visibleDataSource` useMemo）：

```typescript
// index.tsx
const { dataExtraSetting } = config;
const { dataFilterTypeFieldName } = dataExtraSetting || {};
const { subscribeDataFilterType } = props.interactionProps || {};

const visibleDataSource = useMemo(() => {
    let data = dataSource;

    // ① 数据过滤（dataFilterTypeFieldName + subscribeDataFilterType）
    //    用 [null, '', undefined].includes 显式判断，不用 _.isEmpty
    //    因为 lodash _.isEmpty(0) === true，会导致订阅值为 0 时跳过过滤
    if (dataFilterTypeFieldName && ![null, '', undefined].includes(subscribeDataFilterType)) {
        data = (data || []).filter((dataItem: any) => {
            return `${dataItem?.[dataFilterTypeFieldName]}` === `${subscribeDataFilterType}`;
        });
    }

    // ② 搜索栏过滤（原有）
    const searchParamsEntries = ...;
    if (_.isEmpty(searchParamsEntries) || _.isEmpty(data)) return data;
    return data.filter(...);
}, [searchParams, dataSource, dataFilterTypeFieldName, subscribeDataFilterType]);
```

**边界行为**：

| 场景 | 行为 |
| --- | --- |
| `dataFilterTypeFieldName` 未配置 | 跳过过滤，走原有逻辑 |
| `subscribeDataFilterType` 为 `undefined` / `null` / `''` | `[null, '', undefined].includes()` 返回 true，跳过过滤（**注意：不能用 `_.isEmpty`，因为它会把 `0` / `false` 视为 empty**） |
| `dataSource` 为 `undefined` | `(data \|\| [])` 兜底，返回空数组 |
| 字段值类型不一致（数字 vs 字符串） | `\`${...}\`` 字符串化统一比较 |
| 字段名拼写错误（指向不存在字段） | 数据全部过滤掉，表格为空（**用户责任**） |
| 与搜索栏同时启用 | 两层过滤叠加（先 `dataFilterTypeFieldName` 再 `searchParams`） |

**对下游的影响**：

| 下游 | 影响 |
| --- | --- |
| `tableInfo.dataSource` | 自动响应（依赖 `visibleDataSource`） |
| `tableInfo.total`（本地分页） | 自动响应（过滤后页数可能变少） |
| `servicePagination.total`（服务端分页） | 不变（仍为 `dataSource.length`） |
| 分页器 | 重新计算页数 |

**示例**：

```typescript
// dataSource
[
    { policyPlatform: '财政厅1', serverCount: 36, ... },
    { policyPlatform: '财政厅2', serverCount: 24, ... },
    { policyPlatform: '财政厅3', serverCount: 18, ... },
]

// config.dataExtraSetting.dataFilterTypeFieldName = 'policyPlatform'
// props.interactionProps.subscribeDataFilterType = '财政厅2'

// 过滤后
[{ policyPlatform: '财政厅2', serverCount: 24, ... }]
```

### 2.3 维护检查清单

- [ ] 新增列字段时同步在 `dataModel.json` 加 indicator
- [ ] 修改 `paginationSetting` 默认值时检查 `_.get(config, 'paginationSetting', {})` 兜底
- [ ] 增删 `groupSet` 项时同步检查 `columns[].group` 是否对齐
- [ ] 修改 `extraResponse.data.viewItemData.pagination` 识别规则时同步 `@Src/hooks/useDataSourcePagination`
- [ ] 滚动联动（`useScroll`）依赖 `paginationElementRef`，**不可移除分页器 ref**
- [ ] 调整自动轮播（`useCarousel`）时同步检查 `safeTotal > 1` 守卫；改动 `interval` 字段范围同步 schema `x-component-props`
- [ ] 新增/修改 `columnsRenderTemplate` 时同步检查 schema 字段定义、CellRenderer 模板逻辑、doc 三个入口（schema.md / doc/readme.md / gotchas）
- [ ] 调整 `dataExtraSetting.dataFilterTypeFieldName` 时同步检查：订阅字段 `subscribeDataFilterType` schema、visibleDataSource deps、分页重算影响
- [ ] 调整 `paginationSetting.color` / `commonSettings.scrollbar` 颜色时同步检查 StyledContainer 选择器是否仍生效、`index.less` 中是否有更高优先级样式

### 2.2.11 主题色注入 `StyledContainer`

新增能力：通过 `styled-components` 在 `StyledContainer` 上**动态生成主题样式**，作用对象为滚动条与分页器。

**核心设计**：

```
config.paginationSetting.color
config.commonSettings.scrollbar
        ↓ 解构
index.tsx (顶层变量 paginationColorSetting / commonSettings)
        ↓ <StyledContainer /> 传 props
styled.div 内部用 ${({ commonSettings, paginationColorSetting }) => `...`} 生成 CSS
        ↓
CSS 注入到 DOM（覆盖 index.less 中写死的主题样式）
```

**关键代码**（`components/styled/index.tsx`）：

```typescript
export const StyledContainer = styled.div<{
    commonSettings?: CommonSettings;
    paginationColorSetting?: PaginationColorSetting;
}>`
    ${({ commonSettings, paginationColorSetting }) => {
        const sc = commonSettings?.scrollbar || {};
        const pc = paginationColorSetting || {};
        const safe = (v?: string, fallback = 'initial') => v || fallback;

        return `
            /* 滚动条 */
            .oss-ui-table-body::-webkit-scrollbar-thumb {
                background-color: ${safe(sc.thumbColor)};
            }
            .oss-ui-table-body::-webkit-scrollbar-track {
                background-color: ${safe(sc.trackColor)};
            }
            /* 分页器 */
            .table-detail-pagination {
                .oss-ui-pagination-prev,
                .oss-ui-pagination-next {
                    color: ${safe(pc.prevNextColor, 'inherit')};
                }
                .oss-ui-pagination-item {
                    border-color: ${safe(pc.itemBorderColor)};
                    background-color: ${safe(pc.itemNormalColor)};
                    color: ${safe(pc.itemTextColor, 'inherit')};
                    &.oss-ui-pagination-item-active {
                        background-color: ${safe(pc.itemActiveColor, pc.itemNormalColor)};
                    }
                }
            }
        `;
    }}
`;
```

**默认行为**（`safe()` 兜底）：

| 字段未配置 | fallback | 说明 |
| --- | --- | --- |
| `thumbColor` / `trackColor` | `initial` | 不覆盖 `index.less` 中原有滚动条样式 |
| `prevNextColor` / `itemTextColor` | `inherit` | 沿用父级文字色 |
| `itemBorderColor` / `itemNormalColor` / `itemActiveColor` | `initial` | 不覆盖原有样式 |

**样式注入位置**：仅覆盖 `background-color` / `color` / `border-color`，**不修改 `width: 6px` 滚动条尺寸**。

**Card + object 双层 schema 结构**：schema 中 `$color`（Card）→ `color`（object）、`$scrollbar`（Card）→ `scrollbar`（object）；组件**只读内层 object**，外层 Card 仅作视觉分组。

## 3. 子组件 `CellRenderer`（`components/cell/index.tsx`）

### 3.1 职责

根据 `columSetting.contentShowType` 选择不同的渲染分支。

### 3.2 关键 props

| prop | 类型 | 来源 | 说明 |
|---|---|---|---|
| `columSetting` | object | schema `columns[i]` | 列配置（含 contentShowType / dataIndex / contentProps / width） |
| `record` | object | dataSource 项 | 当前行数据 |
| `text` | any | antd ProTable | 当前单元格文本（antd 传入） |
| `groupSetting` | array | schema `groupSet` | 分组信息，用于聚合模式 |
| `designer` | object | 平台 | 含 `env / constants`，给 `RenderIcon` 用 |
| `interaction` | object | 平台 | 给 Icon 类型动态事件 cursor 切换用 |
| `actions.onCheckChange` | function | index.tsx | **当前为空实现**（详见 gotchas § 2） |

### 3.3 渲染分支

```
contentShowType
├── 'plainText'  → 文本，支持 tooltip / controlByOtherField / 分组聚合
├── 'Icon'       → <RenderIcon>，image: 前缀走自定义图片
├── 'DigitalFlop'→ <DigitalFlop>（嵌入 digital-flop 物料，支持级别渲染 + trend）
├── 'Capsule'    → <Capsule>（按 enums.key 着色）
├── 'Checkbox'   → <Checkbox>（onCheckChange 空实现）
└── 其它         → 同 plainText
```

### 3.4 关键逻辑：`controlByOtherField`

```typescript
// 在 plainText 分支
if (controlledField && controlMode) {
    if (controlMode === 'levelRender') {
        // 按 levels[].number 区间选 color
        color = levels.find(s => record[controlledField] >= s.number)?.color || levels.slice(-1)[0].color;
    } else if (controlMode === 'enumRender') {
        // 按 enums[].key 选 color + 替换 text
        const setting = enums.find(s => s.key === record[controlledField]);
        color = setting.color; text = setting.text;
    }
}
```

### 3.5 维护检查清单

- [ ] 新增 contentShowType 需同时：
    - 在 `components/cell/constants.ts` 加 `CellType`
    - 在 `CellRenderer` 加分支
    - 在 schema `columns` 的 `contentProps` 加对应配置
- [ ] 修改 `DigitalFlop` 的 `levels` 默认结构时同步 defaultValue 中的样例
- [ ] `controlByOtherField` 的字段名**不参与 dataModel**，靠外部数据源传值

## 4. 子组件 `Pagination`（`components/pagination/index.tsx`）

### 4.1 职责

封装 antd `Pagination`，叠加自定义 `Select` 做 pageSize 切换。

### 4.2 关键 props

| prop | 类型 | 说明 |
|---|---|---|
| `total` | number | 总条数 |
| `current` | number | 当前页 |
| `pageSize` | number | 每页条数 |
| `showSizeChanger` | boolean | 是否显示 pageSize Select |
| `pageSizeOptions` | array | pageSize 候选，默认 `['10', '20', '50', '100']` |
| `onChange(info)` | function | `{ pageSize, current }` |

### 4.3 关键逻辑：`onChange` pageSize 联动

```typescript
const onChange = (info: any) => {
    const prevState = _.pick(props, ['current', 'pageSize']);
    const nextState = { ...prevState, ...info };
    if (prevState.pageSize !== nextState.pageSize) nextState.current = 1;  // 切 pageSize 自动回到第 1 页
    props.onChange(nextState);
};
```

### 4.4 维护检查清单

- [ ] 修改 `DEFAULT_PAGE_SIZE` 时同步 schema `paginationSetting.pageSize.enum`
- [ ] pageSize 候选项必须为 **string** 数组（`['10', '20', ...]`），与 schema `Select` 兼容
- [ ] `size="small"` 是写死的，需要改动请确认工具栏高度

## 5. Hook `useScroll`（`hooks/useScroll.tsx`）

### 5.1 职责

实时计算 `ProTable` 内部 `scroll.y`，避免分页器 / 搜索栏遮挡。

### 5.2 实现要点

```typescript
const fullHeight = config.height;
const searchBarHeight = getElementHeight('.oss-ui-pro-table-search-query-filter');
const toolbarListHeight = getElementHeight('.oss-ui-pro-table-list-toolbar');
const tableHeaderHeight = getElementHeight('.oss-ui-table-header .oss-ui-table-tbody, .oss-ui-table-thead');
const paginationHeight = getElementHeight('.table-detail-pagination');
const scrollY = fullHeight - searchBarHeight - toolbarListHeight - tableHeaderHeight - paginationHeight;
setScrollY(isNaN(scrollY) || scrollY <= 0 ? null : scrollY);
```

观察器：
- `ResizeObserver` 监听 `.oss-ui-pro-table` 尺寸变化
- `MutationObserver` 监听分页器 `paginationElementRef` 是否插入 / 移除（**确保分页器异步渲染后能重新计算**）

### 5.3 维护检查清单

- [ ] 修改 `config.height` 默认值时同步检查滚动计算
- [ ] 修改分页器或工具栏 DOM 结构时同步更新 selector
- [ ] 修改 `getElementHeight` 时注意使用 `clientHeight`（不取 `getBoundingClientRect`）

## 6. 样式 `index.less`

### 6.1 命名规范

根 class `.visual-base-table-detail`（与物料名不完全一致，按现有约定保持）。

### 6.2 关键样式块

| 选择器 | 用途 |
|---|---|
| `.visual-base-table-detail .oss-ui-pro-table` | ProTable 整体 |
| `.oss-ui-pro-table-search` | 搜索栏背景透明化 + label 白字 |
| `.oss-ui-card` / `.oss-ui-pro-table-list-toolbar` | 卡片透明 + 导出按钮容器样式 |
| `.oss-ui-table` / `.data-cell` / `.data-cell-inner` | 表格透明背景 + 单元格内联 |
| `.oss-ui-table.oss-ui-table-bordered` | 边框样式重写（`border: none` + 通过 `>` 嵌套样式自定义） |
| `.visual-base-table-detail-row` | 行 hover / focus 透明 |
| `.table-detail-pagination` | 分页器绝对定位到容器底部 |

### 6.3 ⚠️ 关键样式说明

```less
.table-detail-pagination {
    position: absolute;
    bottom: 0;
}
```

> **绝对定位** + `left` 来自 `paginationSetting.left`（在 index.tsx 里通过 inline style 写入）。详见 gotchas § 1。

### 6.4 维护检查清单

- [ ] 根 class `.visual-base-table-detail` 与 `StyledContainer` 一致
- [ ] `.oss-ui-pro-table` 嵌套层级修改时同步更新选择器
- [ ] 滚动条样式 `::-webkit-scrollbar { width: 6px; height: 6px; }` 修改时考虑全局影响

## 7. 常用工具函数

| 函数 | 来源 | 用途 |
|---|---|---|
| `useViewItemDataPagination(props)` | `@Src/hooks/useDataSourcePagination` | 读 `extraResponse.data.viewItemData.pagination` |
| `useSetState` | `@Src/hooks/useSetState` | 状态合并 |
| `usePersistFn` | `@Src/hooks/usePersistFn` | 持久化函数引用（避免子组件因函数 prop 重渲） |
| `useLatest` | `@Src/hooks/useLatest` | 持久化最新值 |
| `useMemorizedObject` | `@Src/hooks/useMemorizedObject` | 对象深比较 memo |
| `getImageUrl` | `@Utils` | 解析背景图 / 图片资源路径 |

## 8. 性能要点

| 场景 | 注意事项 |
|---|---|
| 数据量大（>1000 行） | 本地分页切 chunk 仍是 O(n)，建议改用服务端分页 |
| 频繁数据刷新 | `formattedColumns` 依赖 `memorizedSetting`，**修改 columns 引用会触发整列重渲** |
| 滚动联动 | `ResizeObserver` 在容器尺寸不变时不会触发，跨窗口 resize 需要手动调用 |
| 自定义渲染（DigitalFlop） | 每行嵌入 `DigitalFlopImp`，大量行时性能下降明显 |

## 9. 调试小技巧

### 9.1 查看当前分页状态

```typescript
console.log('pagination', { paginationState, servicePagination, tableInfo });
```

### 9.2 强制走服务端分页（调试用）

```typescript
// 在 index.tsx 临时改写
const servicePagination = { total: 999, pageSize: 50, current: 1 };  // 强制启用
```

### 9.3 临时禁用滚动联动

```typescript
// 在 index.tsx 渲染处
scroll={undefined}  // 不传 scroll.y
```

## 10. 维护历史

| 日期 | 变更 | 原因 |
|---|---|---|
| 2026-07-30 | 新增 dataFilterTypeFieldName | 数据过滤能力（`dataExtraSetting.dataFilterTypeFieldName` + `subscribeDataFilterType` 订阅联动） |
| 2026-07-30 | 新增 commonSettings + paginationSetting.color | 主题色注入能力（`StyledContainer` 动态样式，作用于滚动条 / 分页器） |
| 2026-07-30 | 新增 columnsRenderTemplate | 列字段模板能力（顶层配置 + CellRenderer plainText 分支集成 `template()`） |
| 2026-07-30 | 新增 hidePagination | 隐藏分页器 UI，不影响自动轮播（`paginationSetting.hidePagination`） |
| 2026-07-30 | 新增 enableTableHeader | 显隐表头能力（`headerStyle.enableTableHeader`） |
| 2026-07-30 | 新增 useCarousel | 自动轮播能力（`paginationSetting.enableCarousel / carouselInterval / pauseOnHover`） |
| 2026-07-30 | 文档化 | 首次编写 5+1 文档 |
| 2023-07-24 | 0.0.1 | 创建物料 + 增加分页配置（`src/packages/table-detail/doc/CHANGELOG.md`） |