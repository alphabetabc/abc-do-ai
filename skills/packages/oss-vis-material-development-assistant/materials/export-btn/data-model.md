---
title: export-btn 数据契约
description: 导出按钮物料（export-btn）的数据契约说明，本物料无数据模型
version: 1.0.0
last_updated: 2026-06-16
---

# export-btn 数据契约

## 1. 概述

本物料为纯交互组件，**无数据模型**（无 `dataModel.json`），不使用 `dataSource`。

## 2. 导出接口配置

导出接口配置来自 `customDataSourceApiConfig`（新）或 `exportAPIConfig`（历史，已弃用）。

### 2.1 配置结构

```typescript
{
    customDataSourceApiConfig: {
        dataType: 'api',  // 'api' 或 'dataSet'
        api: {
            mode: 'post',
            url: '',
            headers: {},
            params: {},
            enableRequestControl: false,
        },
    },
}
```

### 2.2 参数合并

组件通过 `api.buildCustomApiParams` 合并以下参数：
- `config.params`：接口配置中的参数
- `receivedPropsParams`：接收的参数参数
- `customDataSourceApiParams`：交互参数（来自 `interactionProps`）

## 3. 数据流向

```
导出接口配置（customDataSourceApiConfig）
    ↓
api.buildCustomApiParams（合并参数）
    ↓
api.customDataSourceApi（发起请求）
    ↓
Blob 数据
    ↓
创建下载链接
    ↓
下载 Excel 文件
```

## 4. 扩展建议

### 4.1 新增参数来源

如需新增参数来源，修改 `onInnerClick` 中的参数合并逻辑：

```typescript
api.buildCustomApiParams(config.params, { 
    receivedPropsParams, 
    customDataSourceApiParams,
    newParams,  // 新增参数
});
```

### 4.2 限制

- 本物料不使用 `dataSource`
- 导出接口配置由 `ExportApi` 组件管理
