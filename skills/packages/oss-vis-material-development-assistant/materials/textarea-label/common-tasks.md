---
title: textarea-label 常见修改任务
description: 文本域物料（textarea-label）最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# textarea-label 常见修改任务

本文档列出针对 `textarea-label` 最常见的修改需求及对应的代码定位。

## 任务 1：修改文本样式配置

**场景描述**：需要修改默认的文本样式（字体颜色、字号等）。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        common: {
            textStyle: {
                color: '#FFFFFF',  // 修改字体颜色
                fontFamily: 'Microsoft YaHei',
                fontWeight: 'normal',  // 修改字体粗细
                fontSize: 16,  // 修改字号
                lineHeight: 24,  // 修改行高
            },
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.1](./schema.md#211-文本样式-textstyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 2：启用文本对齐方式配置

**场景描述**：需要允许用户配置文本对齐方式（左对齐、居中、右对齐）。

**涉及文件**：
- `schema.ts`：修改 VisualTextStyle 配置

**步骤**：

1. 在 `schema.ts` 中修改 VisualTextStyle 配置：

```typescript
textStyle: {
    title: '文本样式',
    'x-component': 'VisualTextStyle',
    'x-decorator': 'FormItem',
    'x-validator': [],
    'x-component-props': {
        disableLineHeight: false,
        disableTextAlign: false,  // 启用文本对齐方式
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.1](./schema.md#211-文本样式-textstyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 3：修改自适应高度默认值

**场景描述**：需要默认启用自适应高度。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        common: {
            autoSize: true,  // 默认启用自适应高度
            bordered: false,
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.2](./schema.md#212-自适应高度-autosize)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 4：修改边框默认值

**场景描述**：需要默认显示边框。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        common: {
            autoSize: false,
            bordered: true,  // 默认显示边框
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.3](./schema.md#213-边框-bordered)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 5：新增数据字段

**场景描述**：需要为文本域添加新的数据字段（如标题）。

**涉及文件**：
- `dataModel.json`：添加新的指标字段
- `index.tsx`：读取新字段

**步骤**：

1. 在 `dataModel.json` 中添加新的指标字段：

```json
{
    "dataType": "String",
    "fieldLabel": "标题",
    "fieldName": "title",
    "fieldUnit": "",
    "list": "true",
    "rowProperties": ["format"]
}
```

2. 在 `index.tsx` 中读取新字段：

```typescript
const title = dataSource?.[0]?.title;
const content = dataSource?.[0]?.labelText;

return (
    <div>
        {title && <div className="title">{title}</div>}
        <Input.TextArea
            style={config.common.textStyle}
            autoSize={config.common.autoSize}
            bordered={config.common.bordered}
            value={content}
        ></Input.TextArea>
    </div>
);
```

**涉及**：
- 🟩 数据：[data-model.md § 2.2](./data-model.md#22-indicators指标)
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-渲染-textarea)
- ⬜ Schema：（无）
