---
title: single-image - 数据契约
description: 单张图片物料的数据模型定义，包含数据字段、数据源配置和默认数据
version: 1.0.0
last_updated: 2026-06-16
---

# 🟩 数据契约

> 源码文件：[`packages/single-image/dataModel.json`](../../../../../packages/single-image/dataModel.json)

## 数据模型概览

| 属性 | 值 |
|------|-----|
| 模型名称 | visual-designer-single-image |
| 模型标题 | 可视化大屏单张图片 |
| 描述 | 可视化大屏单张图片数据模板 |
| 作者 | 郝营营 |

## 字段定义

### 维度（dimensions）

**无维度字段** — 该物料不使用维度。

### 指标（indicators）

| 字段名 | 字段标签 | 数据类型 | 是否列表 | 单位 |
|--------|---------|---------|---------|------|
| `content` | content | String | true | — |

**`content` 字段说明**：

- 用于承载图片的 URL 地址
- 当数据源返回 `content` 时，**优先使用数据源图片**，覆盖配置面板中的背景图
- 位图模式下：`content` 作为 `backgroundImage` 的 URL
- 矢量图模式下：`content` 作为 `WebkitMaskImage` 的 SVG URL

## 数据行配置

```json
{
  "dimensionCount": "unknown",
  "isUseDimensionParams": "false"
}
```

- 维度数量不限
- 不使用维度参数

## 默认数据（defaultValue.dataConfig）

```js
{
  dataType: 'json',
  sql: {},
  json: [{ content: '' }],    // 默认空字符串
  dataSet: { current: {}, params: {} },
  api: { mode: 'get', url: '', headers: {}, params: {} },
}
```

## 数据消费流程

```
dataSource (data)
  └── data[0].content  →  dataImageUrl
        ├── Image 模式 → backgroundImage: url(getImageUrl(dataImageUrl))
        └── SVG 模式   → WebkitMaskImage: url(getImageUrl(dataImageUrl, localDir: 'svg'))
```

> 如果 `data[0].content` 为空，则回退到配置面板中的图片：
> - Image 模式 → `backgroundStyle.backgroundDefine`
> - SVG 模式 → `backgroundStyle.backgroundImage`

## 在 Schema 中的使用

`dataModel.json` 的 header 字段被展开到 DynamicData 组件的 `options.fields` 中：

```ts
fields: [...dataModel.dataModelDefinition.header.dimensions,
         ...dataModel.dataModelDefinition.header.indicators]
```

## 跨文档引用

- 🟦 Schema 中如何引用数据模型 → [schema.md](./schema.md)
- 🟨 组件如何消费数据 → [component-logic.md](./component-logic.md)
