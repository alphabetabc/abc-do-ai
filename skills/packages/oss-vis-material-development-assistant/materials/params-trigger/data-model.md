---
title: params-trigger - 数据契约
description: 参数触发器物料的数据模型说明（本物料无数据源）
version: 1.0.0
last_updated: 2026-08-04
---

# 🟩 数据契约

> 本文档说明 `packages/params-trigger/` 的数据模型。

## 数据源状态

**本物料不使用数据源。**

```json
// oss-material.json
{
    "dataModel": ""
}
```

`dataModel` 字段为空字符串，表示该物料不依赖外部数据源。运行时也不通过 `props.dataSource` 或 `props.data` 接收任何数据。

> ⚠️ **关于 `dataModel.json`**：本目录下保留了 `dataModel.json` 作为占位文件（`dimensions: []` / `indicators: []`），用于框架元信息描述。**与 `oss-material.json.dataModel = ""` 不冲突**，前者是"框架元信息"，后者是"是否启用数据源"。

## 数据来源

参数触发器的数据完全来自**交互订阅**：

```typescript
// 运行时通过 props.interactionProps[key] 读取订阅值
const subscribedValue = interactionProps[sourceKey];
```

不通过 `props.dataSource` 接收任何数据。

## 默认数据配置

虽然不使用数据源，但 `schema.ts` 中仍定义了 `dataConfig` 默认值（框架要求）：

```typescript
dataConfig: {
    dataType: 'json',
    sql: {},
    dataSet: {
        current: {},
        params: {},
    },
    api: {
        mode: 'get',
        url: '',
        headers: {},
        params: {},
    },
    json: [],
    isRefresh: false,
    refreshTime: 5 * 60,
}
```

**说明**：这是框架要求的标准结构，组件实际不读取这些数据。

## 配置数据结构

组件实际使用的数据来自 `config.mappingList`：

```typescript
interface MappingItem {
    sourceKey: string;   // 订阅键名（须匹配 SUBSCRIBE_KEYS 中的某个 key）
    input: string;       // 命中比较的输入值
    output: string;      // 命中后的输出值（派发的 payload）
}

interface Config {
    mappingList: MappingItem[];
    title: string;       // 物料标题
    width: number;
    height: number;
    left: number;
    top: number;
    isLock: boolean;
    isHidden: boolean;
}
```

## 交互数据结构

### 订阅侧（上游传入）

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| `interactionProps[sourceKey]` | `any` | 上游物料 dispatch | 订阅参数的当前值 |

### 派发侧（本物料发出）

```typescript
interface DispatchData {
    data: Array<{
        fieldName: string;   // 格式：`paramsTrigger_${sourceKey}`
        state: string;       // 来自映射项的 output
    }>;
}
```

**示例**：

```javascript
// 输入映射表
[
    { sourceKey: 'type', input: '1', output: 'station' },
    { sourceKey: 'type', input: '2', output: 'physic' }
]

// 假设上游派发了 :type = '1'
// 本物料命中后派发:
{
    data: [{
        fieldName: 'paramsTrigger_type',
        state: 'station'
    }]
}

// 下游物料订阅 :paramsTrigger_type 即可消费到 'station'
```

## 与其他物料的区别

| 物料类型 | 数据来源 | 本物料 |
|---------|---------|--------|
| 图表物料 | `dataSource` API 请求 | ❌ 不使用 |
| 文本物料 | `dataSource` 或静态配置 | ❌ 不使用 |
| 交互物料 | `interactionProps` 订阅上游 | ✅ 当前方式 |

## 相关文档

- 配置面板定义 → [🟦 schema.md](./schema.md)
- 派发实现逻辑 → [🟨 component-logic.md](./component-logic.md)