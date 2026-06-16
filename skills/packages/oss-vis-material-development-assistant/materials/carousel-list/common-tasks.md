---
title: carousel-list 常见修改任务
description: 轮播列表(垂直)物料（carousel-list）最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# carousel-list 常见修改任务

本文档列出针对 `carousel-list` 最常见的修改需求及对应的代码定位。

## 任务 1：修改轮播时间间隔

**场景描述**：需要修改默认的轮播时间间隔。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        swiperTimer: 5,  // 修改为 5 秒
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1](./schema.md#21-功能面板-swipertimer)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 2：修改选中样式

**场景描述**：需要修改默认的选中样式（背景、边框、阴影）。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        selectedStyle: {
            background: 'rgba(0, 138, 255, 0.2)',  // 修改背景色
            borderStyle: 'dashed',  // 修改边框样式
            color: '#00D5FF',  // 修改边框颜色
            borderWidth: 2,  // 修改边框宽度
            boxShadow: 10,  // 修改阴影尺寸
            shadowColor: '#00D5FF',  // 修改阴影颜色
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.4](./schema.md#24-选中样式面板-selectedstyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 3：修改分割线样式

**场景描述**：需要修改默认的分割线样式（颜色、长度、虚线）。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        dividerStyle: {
            color: '#FFFFFF',  // 修改颜色
            width: 300,  // 修改总长度
            dashedwidth: 10,  // 修改虚线长度
            density: 60,  // 修改虚线密度
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.3](./schema.md#23-分割线样式面板-dividerstyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 4：修改字体样式

**场景描述**：需要修改默认的字体样式（字号、颜色、粗细）。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        nameFontStyle: {
            fontSize: 20,  // 修改字号
            color: '#00D5FF',  // 修改颜色
            fontWeight: 'bold',  // 修改粗细
        },
        valueFontStyle: {
            fontSize: 20,
            color: '#FFFFFF',
            fontWeight: 'bold',
        },
        unitFontStyle: {
            fontSize: 16,
            color: '#FFFFFF',
            fontWeight: 'normal',
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.5-2.7](./schema.md#25-名称样式面板-namefontstyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 5：新增数据字段

**场景描述**：需要为列表添加新的数据字段（如图标）。

**涉及文件**：
- `dataModel.json`：添加新的指标字段
- `index.jsx`：读取新字段
- `schema.ts`：添加默认数据

**步骤**：

1. 在 `dataModel.json` 中添加新的指标字段：

```json
{
    "dataType": "String",
    "fieldLabel": "图标",
    "fieldName": "icon",
    "fieldUnit": "",
    "list": "true",
    "rowProperties": ["format"]
}
```

2. 在 `index.jsx` 中读取新字段：

```typescript
<div className="carousel-list-icon">
    <img src={item?.icon} alt="" />
</div>
```

3. 在 `schema.ts` 中添加默认数据：

```typescript
json: [
    { id: '1', name: '语音专线', value: 99.99, unit: '%', icon: '/path/to/icon1.png' },
    // ...
],
```

**涉及**：
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标)
- 🟨 组件逻辑：[component-logic.md § 2.2.6](./component-logic.md#226-渲染结构)
- 🟦 Schema：（无）

## 任务 6：修改交互派发参数

**场景描述**：需要修改交互派发的参数名称。

**涉及文件**：
- `schema.ts`：修改交互面板配置

**步骤**：

1. 在 `schema.ts` 的交互面板中修改：

```typescript
properties: {
    rowHighlightId: {
        title: '行数据ID:customId',  // 修改参数名称
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
    },
    rowHighlightName: {
        title: '行数据名称:customName',  // 修改参数名称
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 3.1](./schema.md#31-行高亮事件-onclickaction)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）
