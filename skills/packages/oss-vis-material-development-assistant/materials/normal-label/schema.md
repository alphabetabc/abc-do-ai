---
title: Schema 结构
description: 基础标签 schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-16
---

# Schema 结构

源文件：`packages/normal-label/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'normal-label',
    fields: [
        defineConfigSchema({...}),       // 配置面板
        defineDataConfigSchema({...}),   // 数据面板
        // 无交互面板
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 基础设置 `$collapse.properties.common`

| 字段        | 类型   | 标题     | x-component       | 组件读取方式                                               |
| ----------- | ------ | -------- | ----------------- | ---------------------------------------------------------- |
| `textStyle` | object | 文本样式 | `VisualTextStyle` | `config.common.textStyle`（→ 🟨 component-logic.md § 2.1） |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `VisualTextStyle` | 文本样式编辑（字体、颜色、大小、行高、字重） | `disableLineHeight: false`（行高可编辑）、`disableTextAlign: true`（文本对齐禁用） |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue.config` 的关键项：

-   `width: 300, height: 300, left: 15, top: 15`
-   `common.textStyle.color: 'rgba(214, 250, 255, 1)'`
-   `common.textStyle.fontFamily: 'Microsoft YaHei'`
-   `common.textStyle.fontWeight: 'bold'`
-   `common.textStyle.fontSize: 14`
-   `common.textStyle.lineHeight: null`

## 5. 数据面板与交互面板

-   **数据面板**：使用 `renderDataConfig` 函数生成，`fields` 来自 `dataModel.dataModelDefinition.header.dimensions + indicators`（实际仅 indicators 有内容）。`showDataStatusSwitch: true`。
-   **交互面板**：当前未启用。
