---
title: 数据契约
description: table-detail dataModel.json 字段定义、数据契约、dataSource 匹配规则
version: 1.0.0
last_updated: 2026-07-30
---

# 数据契约

源文件：`packages/table-detail/dataModel.json`

## 1. 顶层结构

```json
{
    "dataModelDefinition": {
        "name": "table-detail",
        "title": "table-detail",
        "icon": "",
        "description": "table-detail",
        "author": "",
        "page": true,
        "header": {
            "dimensions": [],
            "indicators": [
                { "dataType": "String", "fieldLabel": "列1", "fieldName": "columns_01", "fieldUnit": "", "list": "true", "rowProperties": ["format"] }
                // ... 7 个
            ]
        },
        "rowConfig": {
            "dimensionCount": "unknown",
            "isUseDimensionParams": false
        }
    }
}
```

> **特点**：
>
> -   `dimensions: []` —— **本物料无维度字段**（所有字段都是 indicator）
> -   `page: true` —— 支持分页
> -   `rowConfig.isUseDimensionParams: false` —— 不参与维度参数过滤

## 2. 字段说明

### 2.1 dimensions（维度）

| fieldName | fieldLabel | dataType | 说明                               |
| --------- | ---------- | -------- | ---------------------------------- |
| —         | —          | —        | **无维度字段**（`dimensions: []`） |

### 2.2 indicators（指标）

| fieldName    | fieldLabel | dataType | list   | rowProperties | 说明                                                         |
| ------------ | ---------- | -------- | ------ | ------------- | ------------------------------------------------------------ |
| `columns_01` | 列 1       | String   | `true` | `["format"]`  | 占位列，**默认数据中实际名为 `policyPlatform`**              |
| `columns_02` | 列 2       | String   | `true` | `["format"]`  | 占位列，**默认数据中实际名为 `serverCount`**                 |
| `columns_03` | 列 3       | String   | `true` | `["format"]`  | 占位列，**实际名为 `CPURate`**（数字类型，作为 string 存储） |
| `columns_04` | 列 4       | String   | `true` | `["format"]`  | 占位列，**实际名为 `memoryRate`**                            |
| `columns_05` | 列 5       | String   | `true` | `["format"]`  | 占位列，**实际名为 `firstLevelAlarm`**                       |
| `columns_06` | 列 6       | String   | `true` | `["format"]`  | 占位列，**实际名为 `secondLevelAlarm`**                      |
| `columns_07` | 列 7       | String   | `true` | `["format"]`  | 占位列（**默认数据未使用**，可能为兼容旧版预留）             |

> ⚠️ 重要：**dataModel 字段名是 `columns_0X` 占位符**，但 `schema.ts` 中 `defaultValue.columns` 与 `dataConfig.json` 的真实字段名是 `policyPlatform / serverCount / CPURate / ...`。两者通过设计器侧的"数据配置"映射对齐。

## 3. 数据流向

```
外部数据源（API / 数据集 / JSON）
    ↓
dataConfig (dataType + json/api/dataSet)
    ↓
dataConfig.json 字段映射 → 标准 dataModel 字段
    ↓
props.dataSource: Array<Record<string, any>>
    ↓
useScroll: 计算 scroll.y（不修改数据）
    ↓
visibleDataSource = dataSource.filter(...)（搜索栏 onSubmit 后过滤）
    ↓
tableInfo（双模分页）
    ├── 本地：_.chunk(visibleDataSource, pageSize)[current - 1]
    └── 服务端：直接传 visibleDataSource，Pagination 从 servicePagination 取 total
    ↓
formattedColumns（withCellRender + groupSet 处理）
    ↓
<ProTable columns={formattedColumns} dataSource={tableInfo.dataSource} />
    ↓
CellRenderer → 根据 contentShowType 分支渲染
```

## 4. 默认数据示例

`schema.ts` 中 `defaultValue.dataConfig.json`：

```json
[
    {
        "policyPlatform": "财政厅1",
        "serverCount": 36,
        "CPURate": 40,
        "memoryRate": 40,
        "firstLevelAlarm": 2,
        "secondLevelAlarm": 3,
        "policyPlatformId": "0"
    },
    {
        "policyPlatform": "财政厅2",
        "serverCount": 36,
        "CPURate": 40,
        "memoryRate": 40,
        "firstLevelAlarm": 2,
        "secondLevelAlarm": 2,
        "policyPlatformId": "1"
    },
    {
        "policyPlatform": "财政厅3",
        "serverCount": 36,
        "CPURate": 40,
        "memoryRate": 40,
        "firstLevelAlarm": 2,
        "secondLevelAlarm": 2,
        "policyPlatformId": "2"
    },
    {
        "policyPlatform": "财政厅4",
        "serverCount": 36,
        "CPURate": 40,
        "memoryRate": 40,
        "firstLevelAlarm": 2,
        "secondLevelAlarm": 0,
        "policyPlatformId": "3"
    },
    {
        "policyPlatform": "财政厅5",
        "serverCount": 36,
        "CPURate": 40,
        "memoryRate": 40,
        "firstLevelAlarm": 2,
        "secondLevelAlarm": 2,
        "policyPlatformId": "4"
    },
    {
        "policyPlatform": "财政厅6",
        "serverCount": 36,
        "CPURate": 40,
        "memoryRate": 40,
        "firstLevelAlarm": 2,
        "secondLevelAlarm": 1,
        "policyPlatformId": "5"
    }
]
```

> 6 条数据，按 `policyPlatformId: '0'~'5'` 标识唯一性，与 `rowSetting.fieldNameForKey: 'policyPlatformId'` 对齐。

## 5. 服务端分页数据契约

> 当 `extraResponse.data.viewItemData.pagination` 存在时启用服务端分页。

```typescript
extraResponse = {
    data: {
        viewItemData: {
            rows: [...],          // 当前页数据（结构同 defaultValue.dataConfig.json）
            pagination: {
                current: number,
                pageSize: number,
                total: number,    // 总条数
            }
        }
    }
}
```

> ⚠️ 字段路径不一致：项目里另一个物料 `pagination-display` 读的是 `viewItemData.page.total`（`src/packages/pagination-display/index.jsx`），不是 `pagination`。**table-detail 用的是 `pagination`**（`src/hooks/useDataSourcePagination.ts`）。

## 6. 字段使用情况

| dataModel 字段（占位） | 实际字段名（默认数据） | 组件读取位置                                | 实际生效          |
| ---------------------- | ---------------------- | ------------------------------------------- | ----------------- |
| `columns_01`           | `policyPlatform`       | `columns[0].dataIndex = 'policyPlatform'`   | ✅                |
| `columns_02`           | `serverCount`          | `columns[1].dataIndex = 'serverCount'`      | ✅                |
| `columns_03`           | `CPURate`              | `columns[2].dataIndex = 'CPURate'`          | ✅（digitalFlop） |
| `columns_04`           | `memoryRate`           | `columns[3].dataIndex = 'memoryRate'`       | ✅（digitalFlop） |
| `columns_05`           | `firstLevelAlarm`      | `columns[4].dataIndex = 'firstLevelAlarm'`  | ✅                |
| `columns_06`           | `secondLevelAlarm`     | `columns[5].dataIndex = 'secondLevelAlarm'` | ✅（capsule）     |
| `columns_07`           | （未用）               | （未配置列）                                | ❌ 占位未使用     |
| —                      | `policyPlatformId`     | `rowSetting.fieldNameForKey`                | ✅ 作为行 key     |

## 7. 扩展建议

### 7.1 新增字段

1. 在 `dataModel.json` 的 `indicators` 数组添加
    ```json
    { "dataType": "String", "fieldLabel": "新增列", "fieldName": "columns_08", "fieldUnit": "", "list": "true", "rowProperties": ["format"] }
    ```
2. 在 `schema.ts` 的 `defaultValue.columns` 数组添加对应列配置（含 `dataIndex` 与实际数据字段对齐）
3. 在 `defaultValue.dataConfig.json` 添加样例数据
4. （可选）配置 `contentShowType`（plainText / Icon / DigitalFlop / Capsule / Checkbox）

### 7.2 接入真实数据源

**场景**：从 API / 数据集获取数据。

**步骤**：

1. 数据面板选 `dataType: 'api'` 或 `'dataSet'`
2. 配置 URL / params / headers（API）或 数据集 ID（数据集）
3. 字段映射：dataModel 占位字段（`columns_01`）映射到实际 API 字段（如 `policyPlatform`）
4. **如需服务端分页**：
    - 在 `customDataSourceApiConfig` 配 `api.dataType = 'api'`（参考 `src/packages/pagination-table/index.tsx` 的实现）
    - 或确保数据源 hook 返回 `extraResponse.data.viewItemData.pagination`
    - 在 params 注入 `pageIndex / pageSize`（数据集会自动处理）

### 7.3 限制

-   当前**无排序逻辑**（如需，需自定义或外部处理）
-   当前**不支持列固定**（与 `table-fixedColumns` 不同）
-   当前**不支持虚拟滚动**（与 `oss-table-plots` 系列不同）
-   行 click 效果依赖 `fieldNameForKey`，**未配置时使用 index**（性能隐患 + 数据变化时丢失状态，详见 gotchas § 3）

### 7.4 修复建议（仅记录，不在当前 PR 范围）

**1. dataModel 字段名优化**

-   `columns_01~07` 是占位名，对用户不友好
-   建议改为语义化命名（如 `policyPlatform / serverCount / ...`），与 defaultValue 对齐

**2. 移除未使用的 `columns_07`**

-   当前 schema columns 只有 6 项，`columns_07` 占位但无对应
-   建议删除以减少认知负担

**3. 服务端分页字段路径统一**

-   `table-detail` 用 `viewItemData.pagination`，`pagination-display` 用 `viewItemData.page.total`
-   建议统一为 `viewItemData.pagination`，并在 `pagination-display` 同步修改
