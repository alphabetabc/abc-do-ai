---
title: export-btn 常见修改任务
description: 导出按钮物料（export-btn）最常见的修改需求及对应的代码定位
version: 1.0.0
last_updated: 2026-06-16
---

# export-btn 常见修改任务

本文档列出针对 `export-btn` 最常见的修改需求及对应的代码定位。

## 任务 1：修改按钮样式

**场景描述**：需要修改默认的按钮样式（文本、边框、背景）。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        baseStyle: {
            textStyle: {
                fontSize: 24,  // 修改字号
                color: '#FFFFFF',  // 修改颜色
            },
            borderWidth: 2,  // 修改边框宽度
            borderColor: '#00D5FF',  // 修改边框颜色
            borderRadius: 8,  // 修改圆角
            backgroundType: 'color',  // 修改背景类型
            backgroundColor: 'rgba(0, 138, 255, 0.2)',  // 修改背景颜色
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1](./schema.md#21-元素设置面板-basestyle)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 2：修改前缀图标配置

**场景描述**：需要修改默认的前缀图标配置。

**涉及文件**：
- `schema.ts`：修改配置面板默认值

**步骤**：

1. 在 `schema.ts` 中修改默认值：

```typescript
defaultValue: {
    config: {
        baseStyle: {
            prefix: {
                show: true,
                prefixImg: {
                    url: '/oss-visual/custom/export.png',  // 修改图片路径
                    isMaterial: true,
                },
                width: 30,  // 修改尺寸
                marginRight: 10,  // 修改右边距
            },
        },
    },
},
```

**涉及**：
- 🟦 Schema：[schema.md § 2.1.7](./schema.md#217-元素前缀-prefix)
- ⬜ 组件逻辑：（无）
- ⬜ 数据：（无）

## 任务 3：修改导出文件名格式

**场景描述**：需要修改导出文件的命名格式。

**涉及文件**：
- `index.tsx`：修改文件名生成逻辑

**步骤**：

1. 在 `index.tsx` 的 `onInnerClick` 中修改：

```typescript
downloadLink.download = `自定义前缀_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
```

**涉及**：
- ⬜ Schema：（无）
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-导出逻辑)
- ⬜ 数据：（无）

## 任务 4：修改导出文件类型

**场景描述**：需要将导出文件类型从 Excel 改为 CSV。

**涉及文件**：
- `index.tsx`：修改 Blob 类型和文件扩展名

**步骤**：

1. 在 `index.tsx` 的 `onInnerClick` 中修改：

```typescript
// 修改 Blob 类型
const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });

// 修改文件扩展名
downloadLink.download = `导出数据${dayjs().format('YYYYMMDDHHmmss')}.csv`;
```

**涉及**：
- ⬜ Schema：（无）
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-导出逻辑)
- ⬜ 数据：（无）

## 任务 5：新增参数来源

**场景描述**：需要为导出接口添加新的参数来源。

**涉及文件**：
- `index.tsx`：修改参数合并逻辑

**步骤**：

1. 在 `index.tsx` 的 `onInnerClick` 中修改：

```typescript
const newParams = { /* 新参数 */ };

api.buildCustomApiParams(config.params, { 
    receivedPropsParams, 
    customDataSourceApiParams,
    newParams,  // 新增参数
});
```

**涉及**：
- ⬜ Schema：（无）
- 🟨 组件逻辑：[component-logic.md § 2.2.1](./component-logic.md#221-导出逻辑)
- ⬜ 数据：（无）
