---
title: progress-list-bar 常见修改任务
description: 水平进度图物料（progress-list-bar）最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# progress-list-bar 常见修改任务

本文档列出针对 `progress-list-bar` 最常见的修改需求及对应的代码定位。

## 任务 1：修改进度条样式

**场景描述**：需要修改进度条的高度、圆角、间距、背景色。

**涉及文件**：
- `schema.ts`：修改配置面板默认值
- `index.tsx`：读取配置参数

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        style: {
            progressBarStyle: {
                height: 30,  // 修改高度
                borderRadius: 15,  // 修改圆角
                spacing: 15,  // 修改间距
                backgroundColor: 'rgba(255, 255, 255, 0.3)',  // 修改背景色
            },
        },
    },
},
```

2. 在 `index.tsx` 中读取配置参数：

```typescript
const { height, borderRadius, spacing, backgroundColor } = progressBarStyle;
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.1](./schema.md#211-进度条样式-progressbarstyle)
- 🟨 组件逻辑：[component-logic.md § 2.2.2](./component-logic.md#222-进度条渲染)
- ⬜ 数据：（无）

## 任务 2：修改进度点动画效果

**场景描述**：需要修改进度点动画的缩放比例、透明度变化。

**涉及文件**：
- `components/Styled.tsx`：修改进度点动画样式

**步骤**：

1. 在 `components/Styled.tsx` 中修改进度点动画样式：

```typescript
@keyframes pulse {
    0% {
        transform: translateY(-50%) scale(1);
        opacity: 1;
    }
    50% {
        transform: translateY(-50%) scale(1.5);  // 修改缩放比例
        opacity: 0.3;  // 修改透明度
    }
    100% {
        transform: translateY(-50%) scale(1);
        opacity: 1;
    }
}
```

**涉及**：
- 🟨 组件逻辑：[component-logic.md § 4.1](./component-logic.md#41-progressdot-组件)
- ⬜ Schema：（无）
- ⬜ 数据：（无）

## 任务 3：新增数据字段

**场景描述**：需要为进度条添加新的数据字段（如颜色）。

**涉及文件**：
- `dataModel.json`：添加新的指标字段
- `index.tsx`：读取新字段
- `components/RowItem.tsx`：使用新字段

**步骤**：

1. 在 `dataModel.json` 中添加新的指标字段：

```json
{
    "dataType": "String",
    "fieldLabel": "颜色",
    "fieldName": "color",
    "fieldUnit": "",
    "list": "true",
    "rowProperties": ["format"]
}
```

2. 在 `index.tsx` 中读取新字段：

```typescript
const { label, value, unit, color } = item;
```

3. 在 `components/RowItem.tsx` 中使用新字段：

```typescript
const progressStyle = {
    width: `${item.value}%`,
    borderRadius: `${borderRadius}px`,
    background: `linear-gradient(to right, ${color || '#1890ff'}, ${color || '#52c41a'})`,
};
```

**涉及**：
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标)
- 🟨 组件逻辑：[component-logic.md § 3.2.1](./component-logic.md#321-进度条样式构建)
- ⬜ Schema：（无）

## 任务 4：修改进度条方向

**场景描述**：需要修改进度条的方向（从左到右/从右到左）。

**涉及文件**：
- `schema.ts`：修改配置面板默认值
- `components/RowItem.tsx`：根据方向调整样式

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        style: {
            progressBarStyle: {
                direction: 'right',  // 修改方向
            },
        },
    },
},
```

2. 在 `components/RowItem.tsx` 中根据方向调整样式：

```typescript
const progressStyle = {
    width: `${item.value}%`,
    borderRadius: `${borderRadius}px`,
    background: `linear-gradient(to right, #1890ff, #52c41a)`,
    marginLeft: direction === 'right' ? 'auto' : '0',
    marginRight: direction === 'left' ? 'auto' : '0',
};
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.1](./schema.md#211-进度条样式-progressbarstyle)
- 🟨 组件逻辑：[component-logic.md § 3.2.1](./component-logic.md#321-进度条样式构建)
- ⬜ 数据：（无）

## 任务 5：修改进度点动画开关

**场景描述**：需要修改进度点动画的默认开关状态。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        style: {
            progressBarStyle: {
                enableAnimation: false,  // 修改默认开关状态
            },
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.1](./schema.md#211-进度条样式-progressbarstyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）
