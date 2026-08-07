---
title: 常见修改任务
description: table-detail 最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-07-30
---

# 常见修改任务

本文档列出针对 `table-detail` 最常见的修改需求及对应的代码定位。

## 任务 1：新增一个列字段

**场景描述**：表格需要展示一个新字段（如 "操作系统"）。

涉及：
- 🟩 数据：[data-model.md § 7.1](./data-model.md#71-新增字段)
- 🟦 Schema：[schema.md § 2.2](./schema.md#22-表格列字段-columns)
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-单元格包装-withcellrender)（无需改动，contentShowType 走 plainText 即可）

**步骤**：

1. 在 `dataModel.json` 的 `indicators` 数组添加：
    ```json
    { "dataType": "String", "fieldLabel": "操作系统", "fieldName": "columns_08", "fieldUnit": "", "list": "true", "rowProperties": ["format"] }
    ```
2. 在 `schema.ts` 末尾 `defaultValue.columns` 添加：
    ```typescript
    {
        title: '操作系统',
        dataIndex: 'os',
        search: true,            // 可选：让此列出现在搜索筛选栏
        align: 'center',
        width: 120,
        contentShowType: 'plainText',
    }
    ```
3. 在 `defaultValue.dataConfig.json` 添加样例数据：
    ```json
    { ..., "os": "CentOS 7" }
    ```
4. 真实数据源：在数据面板将 `columns_08` 映射到 API 的 `os` 字段

---

## 任务 2：切换分页模式（本地 ↔ 服务端）

**场景描述**：数据量较大，需要切换为服务端分页。

涉及：
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-双模分页-tableinfo核心特性)
- 🟩 数据：[data-model.md § 5](./data-model.md#5-服务端分页数据契约)

**步骤**：

1. **数据源切换**：在数据面板配置 `dataType: 'api'` 或 `'dataSet'`，配置 URL / params / 数据集 ID
2. **确保数据源 hook 返回服务端分页结构**：
    ```typescript
    extraResponse = {
        data: {
            viewItemData: {
                rows: [...],         // 当前页数据
                pagination: { current, pageSize, total },
            }
        }
    }
    ```
3. **配置分页参数注入**：
    - 在 params 中加 `pageIndex / pageSize` 字段（数据集）
    - 或在 `customDataSourceApiConfig` 配 `viewPageArgs.pageIndex/pageSize`（API）
4. **触发刷新**：table-detail 不会主动发请求，需通过外部数据源 hook 监听 `paginationState.current` 变化

> ⚠️ 详见 [gotchas.md § 5](./gotchas.md#5-table-detail-本身不触发-api-请求)

---

## 任务 3：新增一个配置项（如"行高自动适应"）

**场景描述**：希望行高根据内容自动撑开。

涉及：
- 🟦 Schema：[schema.md § 2.5](./schema.md#25-表格行设置-rowsetting)
- 🟨 组件逻辑：[component-logic.md § 2.2.5](./component-logic.md#225-渲染-protable)
- ⬜ 数据：（无）

**步骤**：

1. 在 `schema.ts` 的 `rowSetting` 面板添加：
    ```typescript
    autoHeight: {
        title: '行高自动适应',
        type: 'boolean',
        'x-decorator': 'FormItem',
        'x-component': 'Switch',
    },
    ```
2. 在 `defaultValue.config.rowSetting` 加默认值：
    ```typescript
    autoHeight: false,
    ```
3. 在 `index.tsx` 的 `onRow` 渲染里读取：
    ```typescript
    style: {
        ...rowSetting,
        height: rowSetting.autoHeight ? 'auto' : `${rowSetting.height}px`,
        // ...
    },
    ```

---

## 任务 4：新增一种单元格内容类型（如"进度条"）

**场景描述**：希望某列用进度条展示（如 "CPU利用率"）。

涉及：
- 🟨 组件逻辑：[component-logic.md § 3.3](./component-logic.md#33-渲染分支)
- 🟩 数据：（无新增字段，可复用 `columns_03 / 04`）

**步骤**：

1. 在 `components/cell/constants.ts` 加枚举：
    ```typescript
    export const CellType = { PlainText: 'plainText', Icon: 'Icon', DigitalFlop: 'digitalFlop', Capsule: 'capsule', Checkbox: 'checkbox', ProgressBar: 'progressBar' };
    ```
2. 在 `CellRenderer` 加渲染分支：
    ```typescript
    } else if (columSetting.contentShowType === CellType.ProgressBar) {
        cell = <Progress percent={Number(record[columSetting.dataIndex])} />;
    }
    ```
3. 在 `schema.ts` 的 `columns[].contentProps` 加配置项（如 `progressColor / maxValue`）
4. 在 `defaultValue.columns` 中某列 `contentShowType: 'progressBar'`

> ⚠️ `columns` 的 `contentShowType` 当前**没有 schema 字段约束**（代码里直接读字符串），新增类型无需修改 schema 顶层，但**需要在 doc/README.md 的"配置项"段落补充说明**。

---

## 任务 5：调整默认值

**涉及文件**：`schema.ts` 末尾 `defaultValue.config.*` 或 `dataConfig.json`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响（设计器侧会持久化旧配置）。

### 5.1 调整默认行数（示例：每页 20 条）

```typescript
// schema.ts 末尾
defaultValue: {
    config: {
        // ...
        paginationSetting: { enable: true, enablePageSizer: true, pageSize: 20, customPageSize: 20, left: 0 },
    },
}
```

### 5.2 调整默认列配置

```typescript
defaultValue: {
    config: {
        columns: [
            // 增删列
        ],
    },
}
```

### 5.3 调整默认数据示例

```typescript
defaultValue: {
    dataConfig: {
        json: [
            // 修改示例数据
        ],
    },
}
```

---

## 任务 6：实现服务端分页 + 数据集接入

**场景描述**：对接数据集 API，启用服务端分页。

涉及：
- 🟩 数据：[data-model.md § 7.2](./data-model.md#72-接入真实数据源)
- 🟦 Schema：[schema.md § 3](./schema.md#3-数据面板)（配置 dataType + 数据集）
- 🟨 组件逻辑：[component-logic.md § 2.2.3](./component-logic.md#223-双模分页-tableinfo核心特性)（无需修改，识别服务端分页自动生效）

**步骤**：

1. **数据面板**：dataType 选 `dataSet`，选择目标数据集，配置字段映射（dataModel 占位字段 → 数据集字段）
2. **params 注入分页参数**：
    ```typescript
    dataSet: {
        current: {},
        params: {
            pageIndex: '当前页码（订阅）',
            pageSize: '每页条数（订阅）',
        },
    },
    ```
3. **数据集接口**：返回结构必须包含 `extraResponse.data.viewItemData.pagination`
4. **确认触发**：table-detail 翻页时通过 `setPaginationState` 更新 state；数据源 hook 监听 state 变化自动重发请求

> ⚠️ 当前组件**不主动发请求**，需确保数据集 / API 数据源 hook 监听 `paginationState.current / pageSize` 变化。详见 [gotchas.md § 5](./gotchas.md#5-table-detail-本身不触发-api-请求)。

---

## 任务 7：修复 onCheckChange 空实现

**场景描述**：复选框列 `contentShowType: 'checkbox'` 勾选时无任何反应。

涉及：
- 🟨 组件逻辑：[component-logic.md § 3.2](./component-logic.md#32-关键-props)（`actions.onCheckChange` 当前为空实现）

**步骤**：

1. 在 `index.tsx` 实现 `onCheckChange`：
    ```typescript
    const onCheckChange = usePersistFn((event, record, index, column) => {
        const isChecked = event.target.checked;
        interaction.dispatch({
            data: [{
                fieldName: `${designer.prefix.dynamicEventPrefix}rowCheckChange`,
                state: { isChecked, record, columnKey: column.dataIndex, rowIndex: index },
            }],
        });
    });
    ```
2. 修改 `withCellRender` 把 `actions.onCheckChange` 改为 `(e, record, index, column) => ...` 签名
3. 在 `CellRenderer` 调用处补全参数

---

## 任务 8：添加导出自定义筛选条件（订阅查询参数）

**场景描述**：导出时需携带外部订阅的查询参数。

**步骤**：

1. 在 `index.tsx` 的 `exportBtnReceivedPropsParams`（已有，`src/packages/table-detail/index.tsx`）查看当前实现
2. 如需新增订阅：在 `schema/interactions.ts` 的 `$subscribe` 加 `subscribeXxx` 字段
3. 在 `interactionProps.subscribeXxx` 读取并合并到 `exportBtnReceivedPropsParams`
4. 同步 `doc/README.md` 的"导出配置"段落

---

## 任务 9：实现行多选（跨行操作）

**场景描述**：当前 `Checkbox` 单行勾选未生效，需要支持跨行操作（如批量删除）。

涉及：
- 🟨 组件逻辑：[component-logic.md § 3.2](./component-logic.md#32-关键-props) + 新增 selectedRowKeys state
- 🟩 数据：（无）

**步骤**：

1. 在 `index.tsx` 加 state：
    ```typescript
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    ```
2. 在 `ProTable` 加 `rowSelection`：
    ```typescript
    rowSelection={{
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys as string[]),
    }}
    ```
3. （可选）在 `interaction.dispatch` 派发 `selectedRowKeys` 供其他组件订阅

> ⚠️ `rowSelection` 与 `Checkbox contentShowType` **不要同时用**，否则会出现重复勾选列。

---

## 任务 10：实现行拖拽排序

**场景描述**：希望用户能拖拽行调整顺序。

涉及：
- 🟨 组件逻辑：[component-logic.md § 2.2.5](./component-logic.md#225-渲染-protable)（ProTable 自带可拖拽功能）
- 🟩 数据：派发排序结果

**步骤**：

1. 使用 ProTable 的 `components` API 覆盖 `body.row`（antd pro 文档）
2. 在 `index.tsx` 加 `interaction.dispatch` 派发新顺序
3. 外部数据源 hook 接收并写入数据库

> ⚠️ 当前 schema / doc 都不支持此功能，需评估是否在当前 PR 范围。

---

## 任务 11：调整自动轮播行为

**场景描述**：调整自动轮播的间隔、暂停策略，或让 hover 区域扩大到更大范围。

涉及：
- 🟦 Schema：[schema.md § 2.6](./schema.md#26-分页器配置-paginationsetting)（`enableCarousel` / `carouselInterval` / `pauseOnHover`）
- 🟨 组件逻辑：[component-logic.md § 2.2.8](./component-logic.md#228-自动轮播-usecarousel)（`useCarousel` 调用 + 守卫）
- 🟨 组件逻辑：[hooks/useCarousel.tsx](../../../../src/packages/table-detail/hooks/useCarousel.tsx)（核心定时器实现）

**步骤（按常见场景）**：

### 11.1 修改默认间隔 / 间隔范围

```typescript
// schema.ts → paginationSetting.carouselInterval
carouselInterval: {
    type: 'number',
    title: '轮播间隔（秒）',
    'x-decorator': 'FormItem',
    'x-component': 'NumberPicker',
    'x-component-props': { min: 1, max: 60, step: 1 },  // 改这里
    default: 5,                                          // 改这里
    'x-reactions': { /* ... */ },
},
```

### 11.2 关闭默认 hover 暂停

```typescript
// schema.ts → paginationSetting.pauseOnHover
pauseOnHover: {
    // ...
    default: false,  // 改这里
},
```

### 11.3 让 hover 整张大屏卡片才暂停（而非仅表格区域）

需要在 `index.tsx` 中传入一个**更大的** ref 给 `useCarousel`，而不是复用 `rootElementRef`：

```typescript
// index.tsx
const cardRef = useRef<HTMLDivElement>(null);
// 渲染时挂到外层卡片：<div ref={cardRef}><TableDetail /></div>
// 传入 useCarousel：
useCarousel({
    // ...
    containerRef: cardRef,  // 改这里
});
```

> 当前实现把 `containerRef` 直接复用 `rootElementRef`，是因为 table-detail 不知道外层卡片结构。
> 业务侧如需"整张大屏卡片 hover 才暂停"，需要在父级把 ref 透传下来（属于"业务接入"层）。

### 11.4 让轮播跨页面持久化（保持进度）

不属于组件范围。可走派发+订阅链路：

```typescript
// 1. 在 schema/interactions.ts 配置 actionPaginationCurrent
// 2. 在 onPaginationChange（已有，index.tsx）派发
// 3. 外部 store 持久化 current
// 4. 回来时通过 subscribePaginationCurrent 反向注入
```

> 详见 [gotchas.md § 14](./gotchas.md#14-自动轮播跨页面持久化问题-)

### 11.5 调试轮播是否正常启动

```typescript
// hooks/useCarousel.tsx 顶部
console.log('[useCarousel]', { enabled, total, interval, pauseOnHover });
// DevTools → Performance 录制 → 搜索 setInterval，看是否每 N 秒触发
```

> 详见 [component-logic.md § 9](./component-logic.md#9-调试小技巧)

---

## 任务 12：隐藏分页器（自动轮播场景）

**场景描述**：大屏场景下希望表格自动翻页但不显示分页器，避免分散视觉焦点。

涉及：
- 🟦 Schema：[schema.md § 2.6](./schema.md#26-分页器配置-paginationsetting)（`hidePagination`）
- 🟨 组件逻辑：[component-logic.md § 2.2.6](./component-logic.md#226-条件渲染分页器-showpagination)

**步骤**：

1. 在 schema 已有 `paginationSetting`，把 `hidePagination` 设为 `true`（**不要**把 `enable` 设为 `false`！）
2. 把 `enableCarousel` 设为 `true`，配 `carouselInterval`（默认 5 秒）
3. 保持 `enablePageSizer`、`pageSize` 等不变（分页功能正常工作，只是 UI 隐藏）

**反例（错误做法）**：

```typescript
// ❌ 把 enable 设为 false 会导致：数据全量展示 + carousel 不启动
paginationSetting: {
    enable: false,
    enableCarousel: true,
    // ...
}
```

**正例**：

```typescript
// ✅ enable=true + hidePagination=true + enableCarousel=true
paginationSetting: {
    enable: true,
    hidePagination: true,
    enableCarousel: true,
    carouselInterval: 5,
    pauseOnHover: true,
}
```

> ⚠️ 详见 [gotchas.md § 16](./gotchas.md#16-enable-和-hidepagination-容易混淆-)（`enable` 和 `hidePagination` 区别）

---

## 任务 13：使用「列字段模板」组合多字段展示

**场景描述**：在某一列展示拼接多个字段的文本，例如"政务平台（36 台）"。

涉及：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-列字段模板-columnsrendertemplate)
- 🟨 组件逻辑：[component-logic.md § 2.2.9](./component-logic.md#229-列字段模板渲染-columnsrendertemplate)
- 🟦 工具函数：`src/utils/template.ts`（`template(str, data, options?)`）
- ⚠️ 限制：[gotchas.md § 17](./gotchas.md#17-columnsrendertemplate-仅对-plaintext-类型列生效-)（仅 plainText 生效）

**步骤**：

1. 确认目标列 `contentShowType === 'plainText'`
2. 在 schema 「列字段模板」分组下添加一项：
   - `dataIndex`：该列的 `dataIndex`
   - `template`：模板字符串，用 `{{字段名}}` 引用当前行字段
3. 运行验证渲染

**示例数据**：

```typescript
{ policyPlatform: '财政厅1', serverCount: 36, CPURate: 40, memoryRate: 40 }
```

**示例配置**：

```typescript
// ✅ 简洁拼接
columnsRenderTemplate: [
    { dataIndex: 'policyPlatform', template: '{{policyPlatform}} ({{serverCount}} 台)' },
    // → "财政厅1 (36 台)"

    { dataIndex: 'cpuInfo', template: 'CPU {{CPURate}}% / MEM {{memoryRate}}%' },
    // → "CPU 40% / MEM 40%"
]
```

### 13.1 验证模板是否生效

```typescript
// CellRenderer plainText 分支加 console.log
console.log('[template]', { columSetting: columSetting.dataIndex, tmplItem, hasTemplate, text });
```

### 13.2 模板未命中的兜底

- 模板路径取不到字段值 → 自动显示 `'-'`
- 想自定义 fallback → 给 `template()` 工具传第三个参数 `{ fallback: 'N/A' }`（当前 schema 用默认 `'-'`）
- 模板路径语法：支持 lodash `_.get` 风格（点路径 / 数组下标 / `[brackets]`）

### 13.3 与其他能力组合

| 组合 | 行为 | 详见 |
| --- | --- | --- |
| belongGroup（聚合展示） | belongGroup 胜出，模板不生效 | gotchas § 18 |
| `enumRender` | enumRender 胜出，模板文本被覆盖 | gotchas § 18 |
| `levelRender`（只改色） | **可共存**，levelRender 改色 + 模板改文本 | gotchas § 18 |
| `enableTableHeader=false` | 完全独立，组合出"无表头无模板"无影响 | — |

**反例（错误做法）**：

```typescript
// ❌ 给 Capsule 列配模板：模板只对 plainText 生效，Capsule 仍走 enum 着色
columnsRenderTemplate: [
    { dataIndex: 'status', template: '{{value}}' },  // status 列是 Capsule，不生效
]

// ❌ 给被 groupSet 包含的列配模板：belongGroup 胜出
groupSet: [{ groupName: 'platform', includesFields: ['policyPlatform', 'serverCount'], compact: false }],
columnsRenderTemplate: [
    { dataIndex: 'policyPlatform,serverCount', template: '{{policyPlatform}} ({{serverCount}})' }, // 不生效
]
```

**正例**：

```typescript
// ✅ 给未分组、未设置其他渲染逻辑的 plainText 列配模板
columns: [
    { dataIndex: 'policyPlatform', title: '政务平台', contentShowType: 'plainText' },
],
columnsRenderTemplate: [
    { dataIndex: 'policyPlatform', template: '{{policyPlatform}} ({{serverCount}} 台)' },
],
```

> ⚠️ 详见 [gotchas.md § 17 / § 18](./gotchas.md)（生效范围 + 优先级）

---

## 任务 14：使用「数据过滤」实现联动外部订阅

**场景描述**：大屏场景下希望表格数据根据外部订阅值实时过滤，例如根据外部门选择的政务平台过滤当前表格。

涉及：
- 🟦 Schema 配置：[schema.md § 2.8](./schema.md#28-数据额外配置-dataextrasetting)（`dataExtraSetting.dataFilterTypeFieldName`）
- 🟦 Schema 订阅：[schema/interactions.ts](./schema/interactions.ts) 的 `subscribeDataFilterType`（在「订阅参数」分组）
- 🟨 组件逻辑：[component-logic.md § 2.2.10](./component-logic.md#2210-数据过滤-dataextrasettingdatafiltertypefieldname)
- ⚠️ 踩坑：[gotchas.md § 19](./gotchas.md#19-datafiltertypefieldname-字段名配错导致表格全空-)（字段名拼错全空）

**步骤**：

1. 在「数据额外配置」分组配置 `dataFilterTypeFieldName`，指定要过滤的字段名（如 `policyPlatform`）
2. 在「交互」→「订阅参数」启用 `subscribeDataFilterType`（已默认存在 schema）
3. 外部事件发起方派发该订阅值（如另一个物料的点击事件）

**示例数据**：

```typescript
[
    { policyPlatform: '财政厅1', serverCount: 36, ... },
    { policyPlatform: '财政厅2', serverCount: 24, ... },
    { policyPlatform: '财政厅3', serverCount: 18, ... },
]
```

**示例配置**：

```typescript
// config.dataExtraSetting.dataFilterTypeFieldName = 'policyPlatform'

// 外部物料派发（典型场景：点击外部门列表）
// → 通过 interaction.dispatch 写入 subscribeDataFilterType
// props.interactionProps.subscribeDataFilterType = '财政厅2'

// 过滤后
[{ policyPlatform: '财政厅2', serverCount: 24, ... }]
```

### 14.1 不过滤的两种情况

| 情况 | 行为 |
| --- | --- |
| `dataFilterTypeFieldName` 未配置 | 跳过过滤 |
| `subscribeDataFilterType` 为 `undefined` / `null` / `''` | `[null, '', undefined].includes()` 返回 true，跳过过滤（**注意：不能用 `_.isEmpty`，它会把 `0` / `false` 视为 empty**） |

### 14.2 与搜索栏过滤叠加

执行顺序：

```
dataSource (原始)
    │ ① dataFilterTypeFieldName 过滤
    ▼
    │ ② searchParams 过滤（搜索栏输入）
    ▼
visibleDataSource
```

详见 [gotchas.md § 20](./gotchas.md#20-datafiltertypefieldname-与搜索栏过滤的顺序-)。

### 14.3 调试过滤是否生效

```typescript
// index.tsx visibleDataSource useMemo 加 console.log
console.log('[dataFilterTypeFieldName]', {
    dataFilterTypeFieldName,
    subscribeDataFilterType,
    rawLength: dataSource?.length,
    filteredLength: visibleDataSource?.length,
});
// rawLength > 0 && filteredLength === 0 → 字段名配错或订阅值为空
```

**反例（错误做法）**：

```typescript
// ❌ 字段名拼错：表格全空
dataExtraSetting: { dataFilterTypeFieldName: 'platformName' },  // 实际叫 policyPlatform

// ❌ 订阅值类型不一致（数字 vs 字符串）
//   subscribeDataFilterType: 1
//   record.policyPlatform: '1'
//   已通过 `${}` 自动兼容，但需注意

// ❌ 把 dataFilterTypeFieldName 字段名当成"完整路径"
dataExtraSetting: { dataFilterTypeFieldName: 'platforms[0].name' },  // 当前不支持嵌套路径
```

**正例**：

```typescript
// ✅ 简单字段名（最常见）
dataExtraSetting: { dataFilterTypeFieldName: 'policyPlatform' },

// ✅ 配合订阅使用（外部事件发起方按需 dispatch）
interaction: {
    subscribe: { subscribeDataFilterType: true },
    dispatch: { ... }
},
```

> ⚠️ 详见 [gotchas.md § 19 / § 20](./gotchas.md)

---

## 任务 15：自定义滚动条 / 分页器主题色

通过 `paginationSetting.color` 和 `commonSettings.scrollbar` 两个分组实现主题色定制。

### 15.1 自定义分页器颜色（active 项高亮）

```typescript
// 配置：仅改选中项背景色 + 文字色
config: {
    paginationSetting: {
        color: {
            itemActiveColor: '#00DEFF',     // 选中项背景：青色
            itemTextColor: '#FFFFFF',        // 全部分页项文字：白色
        },
    },
},
```

**渲染结果**：

- `.oss-ui-pagination-item` 文字色：白
- `.oss-ui-pagination-item.oss-ui-pagination-item-active` 背景：青色
- 其他字段未配置 → `initial` 兜底，不影响原有样式

### 15.2 自定义滚动条颜色

```typescript
// 配置：滑块青色 + 轨道半透明
config: {
    commonSettings: {
        scrollbar: {
            thumbColor: 'rgba(0, 222, 255, 0.8)',
            trackColor: 'rgba(255, 255, 255, 0.1)',
        },
    },
},
```

**渲染结果**：

- `.oss-ui-table-body::-webkit-scrollbar-thumb` 背景：青色 80% 透明
- `.oss-ui-table-body::-webkit-scrollbar-track` 背景：白色 10% 透明
- 滚动条 `width: 6px` 尺寸不变

### 15.3 调试主题色是否生效

```typescript
// components/styled/index.tsx 顶部
console.log('[StyledContainer]', { commonSettings, paginationColorSetting });

// 浏览器开发者工具 → Elements
// 搜索 ".oss-ui-pagination-item-active"
// 看是否有内联 background-color 样式（styled-components 生成的 class）
```

**反例**：

```typescript
// ❌ 在 .oss-ui-pagination-item-active 上加 background-color
//   StyledContainer 注入的样式在 styled-components class 内
//   如果 index.less 中用 !important，会覆盖注入样式

// ❌ 期望分页器尺寸调整（width 改不了）
//   注入样式只覆盖 background-color，不改 width: 6px
```

**正例**：

```typescript
// ✅ 只覆盖需要改的字段，其余留空用 initial
paginationSetting: {
    color: {
        itemActiveColor: '#00DEFF',  // 单独改一项，不影响其他
    },
},

// ✅ 滚动条 + 分页器组合使用
commonSettings: {
    scrollbar: {
        thumbColor: 'rgba(0, 222, 255, 0.8)',
    },
},
paginationSetting: {
    color: {
        itemActiveColor: '#00DEFF',
    },
},
```

> ⚠️ 详见 [component-logic.md § 2.2.11](./component-logic.md) / [gotchas.md § 22](./gotchas.md)

---