---
title: Schema 编写参考
description: Schema 编写规范，包含基础结构、引入、defineInteractionSchema、分组面板、背景配置、文字样式、reactions、常用 x-component 列表
version: 1.0.0
last_updated: 2026-06-12
---

# Schema 编写参考

## 基础结构

### 引入

```typescript
import { BASE_LAYOUT, getCompTitle, defineInteractionSchema, defineConfigSchema, defineDataConfigSchema } from '@Common/schema';
import metaInfo from './oss-material.json';
import dataModel from './dataModel.json';

export const materialInfo = {
    name: metaInfo.title,
    icon: metaInfo.name,
    type: metaInfo.name,
};
```

### Schema 定义

使用 `defineConfigSchema` 包装配置，结构如下：

```typescript
export const schema = {
    materials: materialInfo.type,
    fields: [
        defineConfigSchema({
            ...getCompTitle(metaInfo, dataModel),
            ...BASE_LAYOUT,
            $collapse: {
                type: 'void',
                'x-component': 'FormCollapse',
                'x-component-props': {
                    bordered: false,
                    expandIconPosition: 'right',
                },
                properties: {
                    // FormCollapse.CollapsePanel 分组
                },
            },
        }),
        defineDataConfigSchema({}),
        defineInteractionSchema({
            subscribe: {
                // 参数订阅
            },
            action: {
                // 事件派发
            },
            panels: [
                {
                    title: '面板标题',
                    properties: {
                        // 面板配置项
                    }
                }
            ]
        }),
    ],
};
```

### 默认值

```typescript
export const defaultValue = {
    config: {
        title: metaInfo.title,
        width: 400,
        height: 300,
        left: 15,
        top: 15,
        isLock: false,
        isHidden: false,
    },
    dataConfig: {
        dataType: 'json',
        sql: {},
        dataSet: { current: {}, params: {} },
        api: { mode: 'get', url: '', headers: {}, params: {} },
        json: [],
        isRefresh: false,
        refreshTime: 5 * 60,
    },
    // interaction 无默认值
};
```

## defineInteractionSchema 详解

用于定义组件的交互行为 schema，支持参数订阅和事件派发。

### 函数签名

```typescript
defineInteractionSchema = (schema: Partial<{
    subscribe: any;           // 接收参数
    action: any;              // 派发事件
    panels: Array<{ title: string; properties: any }>;  // 自定义面板
    [key: string]: any;       // 其他属性
}>)
```

### 返回值结构

```typescript
{
    name: '交互',
    key: 'interactions',
    schema: {
        type: 'object',
        properties: {
            interactions: {
                type: 'object',
                properties: {
                    $collapse: {
                        type: 'void',
                        'x-component': 'FormCollapse',
                        'x-component-props': {
                            bordered: false,
                            expandIconPosition: 'right',
                        },
                        properties: {
                            $subscribe: { /* 参数订阅面板 */ },
                            $action: { /* 事件交互面板 */ },
                            $CollapsePanel_0: { /* 自定义面板1 */ },
                        }
                    }
                }
            }
        }
    }
}
```

### 面板类型

| 面板类型 | x-component-props.header | 说明 |
|----------|-------------------------|------|
| `$subscribe` | `'参数订阅'` | 组件接收外部参数的配置 |
| `$action` | `'事件交互'` | 组件派发事件的配置 |
| `$CollapsePanel_{index}` | 自定义标题 | 用户自定义面板 |

### 使用示例

```typescript
defineInteractionSchema({
    subscribe: {
        dataSource: {
            type: 'string',
            title: '数据源',
            'x-component': 'Input',
        },
        title: {
            type: 'string',
            title: '标题',
            'x-component': 'Input',
        },
    },
    action: {
        onClick: {
            type: 'void',
            title: '点击事件',
            'x-component': 'EventAction',
        },
    },
    panels: [
        {
            title: '高级配置',
            properties: {
                visible: { type: 'boolean', title: '是否显示' }
            }
        }
    ]
})
```

## 分组面板模式

使用 `FormCollapse.CollapsePanel` 组织配置分组：

```typescript
$collapse: {
    properties: {
        containerStyle: {
            type: 'object',
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': {
                header: '容器样式',
            },
            properties: {
                bgColor: {
                    title: '背景色',
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': 'ColorPicker',
                },
            },
        },
    },
},
```

**注意**：`type: 'object'` + `x-component: 'FormCollapse.CollapsePanel'` 才能创建真实的分组面板。

## 背景配置模式

```typescript
bgType: {
    title: '背景类型',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
    'x-component-props': {
        optionType: 'button',
    },
    enum: [
        { label: '纯色', value: 'color' },
        { label: '图片', value: 'image' },
    ],
},
bgColor: {
    title: '背景色',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'ColorPicker',
    'x-reactions': {
        dependencies: ['.bgType'],
        when: "{{ $deps[0] === 'color' }}",
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } },
    },
},
bgImage: {
    title: '背景图',
    displayType: 'row',
    'x-decorator': 'FormItem',
    'x-component': 'Background',
    'x-component-props': { type: 'image', clearable: true },
    'x-reactions': {
        dependencies: ['.bgType'],
        when: "{{ $deps[0] === 'image' }}",
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } },
    },
},
```

## 文字样式配置

使用 `VisualTextStyle` 组件配置文字样式：

```typescript
textStyle: {
    title: '文字样式',
    type: 'object',
    'x-decorator': 'FormItem',
    'x-component': 'VisualTextStyle',
    'x-component-props': {
        disableLineHeight: true,      // 不显示行高
        disableTextAlign: true,      // 不显示文本对齐
        enableLetterSpacing: false,   // 不显示字间距
    },
},
```

## 字段属性说明

| 属性 | 说明 |
|------|------|
| `title` | 表单字段标题 |
| `type` | 数据类型 string/number/boolean/object |
| `x-decorator` | 装饰器组件，通常为 FormItem |
| `x-component` | 表单组件 |
| `x-component-props` | 组件属性 |
| `enum` | 枚举选项 |
| `displayType` | 显示类型，'row' 为行内显示 |
| `x-reactions` | 条件显隐配置 |

## reactions 条件显隐

```typescript
'x-reactions': {
    dependencies: ['.fieldName'],     // 依赖的字段
    when: "{{ $deps[0] === 'value' }}", // 条件表达式
    fulfill: {
        state: { visible: true },      // 满足条件时的状态
    },
    otherwise: {
        state: { visible: false },     // 不满足条件时的状态
    },
},
```

## 常用 x-component

| 组件 | 用途 |
|------|------|
| `ColorPicker` | 颜色选择 |
| `Background` | 背景配置，type: 'image' 或 'svg' |
| `NumberPicker` | 数字输入 |
| `Radio.Group` | 单选，optionType: 'button' 为按钮样式 |
| `Select` | 下拉选择 |
| `Switch` | 开关 |
| `Input` | 文本输入 |
| `Space` | 间距布局，size 属性设置间距 |
| `VisualTextStyle` | 文本样式配置（颜色、字体、字号、字重） |
| `FormCollapse` | 折叠面板容器 |
| `FormCollapse.CollapsePanel` | 折叠面板项 |
| `CustomCollapse` | 自定义折叠面板 |
| `ArrayCollapse` | 数组配置 |