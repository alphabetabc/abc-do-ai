---
title: progress-list-bar Schema 结构
description: 水平进度图物料（progress-list-bar）的 Schema 配置面板定义，包含样式配置
version: 1.0.0
last_updated: 2026-06-16
---

# progress-list-bar Schema 结构

## 1. 顶层结构

```typescript
{
    materials: 'progress-list-bar',
    fields: [
        {
            name: '配置',
            key: 'config',
            schema: {
                type: 'object',
                properties: {
                    config: {
                        type: 'object',
                        properties: {
                            ...getCompTitle(material, dataModel),
                            ...BASE_LAYOUT,
                            $collapse: { ... }  // FormCollapse 包含 1 个面板
                        }
                    }
                }
            }
        },
        defineDataConfigSchema({ ... })  // 数据配置
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 样式面板 `style`

#### 2.1.1 进度条样式 `progressBarStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `direction` | string | 进度条方向 | Select | left/right |
| `height` | number | 进度条高度 | NumberPicker | 进度条高度（px） |
| `borderRadius` | number | 进度条圆角 | NumberPicker | 进度条圆角（px） |
| `spacing` | number | 进度条间距 | NumberPicker | 进度条之间的间距（px） |
| `backgroundColor` | string | 进度条背景色 | ColorPicker | 进度条背景色 |
| `enableAnimation` | boolean | 进度点动画 | Switch | 是否启用进度点动画 |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `NumberPicker` | 数字输入 | 高度、圆角、间距 |
| `ColorPicker` | 颜色选择 | 背景色 |
| `Select` | 下拉选择 | 方向 |
| `Switch` | 开关 | 动画开关 |
| `FormCollapse` | 折叠面板 | 配置分组 |

## 4. 默认值参考

```typescript
{
    config: {
        title: '水平进度图',
        width: 400,
        height: 300,
        left: 15,
        top: 15,
        style: {
            progressBarStyle: {
                direction: 'left',
                height: 20,
                borderRadius: 10,
                spacing: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                enableAnimation: true,
            },
        },
    },
    dataConfig: {
        dataType: 'json',
        json: [
            { label: '标签1', value: 50, unit: '%' },
            { label: '标签2', value: 70, unit: '%' },
            { label: '标签3', value: 30, unit: '%' },
        ],
    },
}
```

## 5. 数据面板

- **数据面板**：使用 `defineDataConfigSchema`，字段来自 `dataModel.json` 的 `dimensions` + `indicators`
