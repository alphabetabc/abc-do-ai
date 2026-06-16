---
title: textarea-label Schema 结构
description: 文本域物料（textarea-label）的 Schema 配置面板定义，包含基础设置
version: 1.0.0
last_updated: 2026-06-16
---

# textarea-label Schema 结构

## 1. 顶层结构

```typescript
{
    materials: 'textarea-label',
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
                            ...getCompTitle(metaInfo, dataModel),
                            ...BASE_LAYOUT,
                            $collapse: { ... }  // FormCollapse 包含 1 个面板
                        }
                    }
                }
            }
        },
        renderDataConfig({ ... })  // 数据配置
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 基础设置面板 `common`

#### 2.1.1 文本样式 `textStyle`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `textStyle` | object | 文本样式 | VisualTextStyle | 文本样式组合组件 |

**VisualTextStyle 配置**：
- `disableLineHeight: false` - 启用行高配置
- `disableTextAlign: true` - 禁用文本对齐方式配置

#### 2.1.2 自适应高度 `autoSize`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `autoSize` | boolean | 是否自适应内容高度 | Switch | 根据内容自动调整高度 |

#### 2.1.3 边框 `bordered`

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `bordered` | boolean | 是否有边框 | Switch | 显示/隐藏边框 |

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `VisualTextStyle` | 文本样式 | 组合字体、字号、颜色、行高等配置 |
| `Switch` | 开关 | 自适应高度、边框开关 |
| `FormCollapse` | 折叠面板 | 配置分组 |

## 4. 默认值参考

```typescript
{
    config: {
        title: '文本域',
        width: 300,
        height: 300,
        left: 15,
        top: 15,
        isLock: false,
        isHidden: false,
        common: {
            textStyle: {
                color: 'rgba(214, 250, 255, 1)',
                fontFamily: 'Microsoft YaHei',
                fontWeight: 'bold',
                fontSize: 14,
                lineHeight: 20,
            },
            autoSize: false,
            bordered: false,
        },
    },
    dataConfig: {
        dataType: 'json',
        json: [{ labelText: '文本内容' }],
        isRefresh: false,
        refreshTime: 5 * 60,
    },
}
```

## 5. 数据面板

- **数据面板**：使用 `renderDataConfig`，字段来自 `dataModel.json` 的 `dimensions` + `indicators`
- **showDataStatusSwitch: true** - 显示数据状态开关
