---
title: 常见修改任务
description: 基础标签最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# 常见修改任务

本文档列出针对 `normal-label` 最常见的修改需求及对应的代码定位。

## 任务 1：修改默认文本内容

**场景描述**：希望首次拖入物料时显示不同的默认文本。

**涉及文件**：
- `packages/normal-label/schema.ts`：修改 `defaultValue.dataConfig.json`

**步骤**：

1. 在 `schema.ts` 末尾找到 `defaultValue.dataConfig.json`：

```typescript
json: [{ labelText: '文本内容' }],
```

2. 将 `'文本内容'` 替换为目标文本。

**涉及维度**：🟩 数据格式

---

## 任务 2：调整文本样式默认值

**场景描述**：修改默认字体、颜色、大小等文本样式。

**涉及文件**：
- `packages/normal-label/schema.ts`：修改 `defaultValue.config.common.textStyle`

**步骤**：

1. 在 `schema.ts` 末尾找到 `defaultValue.config.common.textStyle`：

```typescript
common: {
    textStyle: {
        color: 'rgba(214, 250, 255, 1)',
        fontFamily: 'Microsoft YaHei',
        fontWeight: 'bold',
        fontSize: 14,
        lineHeight: null,
    },
},
```

2. 修改对应属性值。

**注意**：修改后仅影响**首次拖入**的物料，已配置的物料不受影响。

**涉及维度**：🟦 Schema

---

## 任务 3：新增文本前缀/后缀

**场景描述**：希望在文本前后添加固定前缀或后缀（如"总计：xxx"）。

**涉及文件**：
- `packages/normal-label/schema.ts`：新增配置项
- `packages/normal-label/index.tsx`：修改渲染逻辑

**步骤**：

1. 在 `schema.ts` 的 `common` 面板下新增配置字段：

```typescript
properties: {
    textStyle: { /* 已有 */ },
    prefix: {
        type: 'string',
        title: '文本前缀',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
    },
    suffix: {
        type: 'string',
        title: '文本后缀',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
    },
},
```

2. 在 `defaultValue.config.common` 中添加默认值：

```typescript
common: {
    textStyle: { /* ... */ },
    prefix: '',
    suffix: '',
},
```

3. 在 `index.tsx` 中读取并拼接：

```typescript
const { prefix = '', suffix = '' } = config.common || {};
// 渲染
<section style={config.common.textStyle}>
    <span>{prefix}{dataSource?.[0]?.labelText}{suffix}</span>
</section>
```

**涉及维度**：🟦 Schema + 🟨 组件逻辑

---

## 任务 4：修改组件尺寸

**场景描述**：调整组件的默认宽高。

**涉及文件**：
- `packages/normal-label/schema.ts`：修改 `defaultValue.config`

**步骤**：

1. 在 `schema.ts` 末尾找到 `defaultValue.config`：

```typescript
defaultValue: {
    config: {
        width: 300,
        height: 300,
        left: 15,
        top: 15,
        // ...
    },
},
```

2. 修改 `width` 和 `height` 的值。

**涉及维度**：🟦 Schema

---

## 任务 5：新增配置面板分组

**场景描述**：在配置面板中新增一个分组（如"边框设置"）。

**涉及文件**：
- `packages/normal-label/schema.ts`：新增 FormCollapsePanel

**步骤**：

1. 在 `schema.ts` 的 `$collapse.properties` 下新增：

```typescript
properties: {
    common: { /* 已有 */ },
    border: {
        type: 'object',
        'x-component': 'FormCollapse.CollapsePanel',
        'x-component-props': {
            header: '边框设置',
        },
        properties: {
            borderWidth: {
                type: 'number',
                title: '边框宽度',
                'x-decorator': 'FormItem',
                'x-component': 'NumberPicker',
            },
            // 更多字段...
        },
    },
},
```

2. 在 `defaultValue.config` 中添加默认值：

```typescript
config: {
    common: { /* ... */ },
    border: { borderWidth: 1 },
},
```

3. 在 `index.tsx` 中读取并使用新配置。

**涉及维度**：🟦 Schema + 🟨 组件逻辑

---

## 任务 N：调整默认值

**涉及文件**：`packages/normal-label/schema.ts` 末尾 `defaultValue.config.xxx`

修改后**首次拖入**物料会使用新默认值。已配置的物料不受影响。
