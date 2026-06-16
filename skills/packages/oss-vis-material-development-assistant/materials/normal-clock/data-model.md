---
title: normal-clock - 数据契约
description: 时钟物料的数据模型说明（本物料无数据源）
version: 1.0.0
last_updated: 2026-06-16
---

# 🟩 数据契约

> 本文档说明 `packages/normal-clock/` 的数据模型。

## 数据源状态

**本物料不使用数据源。**

```json
// oss-material.json
{
    "dataModel": ""
}
```

`dataModel` 字段为空字符串，表示该物料不依赖外部数据源。

## 数据来源

时钟组件的时间数据完全来自客户端：

```jsx
// 使用 dayjs 获取当前时间
dayjs().format(textSetting?.timeFormat)
```

不通过 `props.dataSource` 或 `props.data` 接收任何数据。

## 默认数据配置

虽然不使用数据源，但 `schema.ts` 中仍定义了 `dataConfig` 默认值：

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
    json: {
        content: '',
        iconType: '',
    },
}
```

**说明：** 这是框架要求的标准结构，但组件实际不读取这些数据。

## 配置数据结构

组件实际使用的数据来自 `config.normal`：

```typescript
interface NormalConfig {
    timeFormat: string;           // 时间格式
    isTimeParams: boolean;        // 是否启用整点传参
    timeParamsFormat: string;     // 传参格式
    timeParamsDate: string;       // 传参时间点
    textStyle: {
        fontSize: number;         // 字号
        color: string;            // 字体颜色
        fontFamily: string;       // 字体
        fontWeight: string | number; // 字体粗细
        textAlign: string;        // 对齐方式
    };
}
```

## 交互数据结构

整点传参时派发的数据：

```typescript
interface DispatchData {
    data: Array<{
        fieldName: string;  // 来自 interaction.defined.timeParamsKey
        state: string;      // 格式化后的时间字符串
    }>;
}
```

**示例：**

```javascript
{
    data: [{
        fieldName: 'currentTime',
        state: '2026/06/16 14:00:00'
    }]
}
```

## 与其他物料的区别

| 物料类型 | 数据来源 | 本物料 |
|---------|---------|--------|
| 图表物料 | `dataSource` API 请求 | ❌ 不使用 |
| 文本物料 | `dataSource` 或静态配置 | ❌ 不使用 |
| 时钟物料 | 客户端 `dayjs()` | ✅ 当前方式 |

## 相关文档

- 配置面板定义 → [🟦 schema.md](./schema.md)
- 组件如何使用配置 → [🟨 component-logic.md](./component-logic.md)
