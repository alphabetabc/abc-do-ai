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
                    },
                },
            ],
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

| 面板类型                 | x-component-props.header | 说明                   |
| ------------------------ | ------------------------ | ---------------------- |
| `$subscribe`             | `'参数订阅'`             | 组件接收外部参数的配置 |
| `$action`                | `'事件交互'`             | 组件派发事件的配置     |
| `$CollapsePanel_{index}` | 自定义标题               | 用户自定义面板         |

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
                visible: { type: 'boolean', title: '是否显示' },
            },
        },
    ],
});
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

## 卡片分组模式

在 `FormCollapse.CollapsePanel` 内部，进一步用 `Card` 做**视觉细分**。典型模式：**外层 Card（UI 容器）+ 内层 object（数据承载）双层结构**。

参考：`src/packages/table-detail/schema.ts`（`$color` / `$scrollbar`）、`src/packages/cone-bar-line/schema.ts`（`$xAxisSettings`）。

### 基础示例

```typescript
$groupSetting: {
    type: 'object',
    'x-component': 'FormCollapse.CollapsePanel',
    'x-component-props': {
        header: '分组设置',
    },
    properties: {
        $subGroup: {                       // ← 外层 Card（视觉分组）
            type: 'void',                  //    type: void 不存数据
            'x-component': 'Card',
            'x-component-props': {
                title: '子分组',           //    卡片标题
                bordered: false,           //    无边框样式
                style: { marginBottom: 10 },
            },
            properties: {
                subField: {                // ← 内层 object（数据承载）
                    type: 'object',        //    type: object 存数据
                    properties: {
                        nestedField: {
                            title: '嵌套字段',
                            type: 'string',
                            'x-decorator': 'FormItem',
                            'x-component': 'Input',
                        },
                    },
                },
            },
        },
    },
},
```

### 关键规则

| 规则                      | 说明                                                                          |
| ------------------------- | ----------------------------------------------------------------------------- |
| 外层必须 `type: 'void'`   | `void` 表示此层不存数据，仅作 UI 容器                                         |
| 内层必须 `type: 'object'` | `object` 表示真正承载数据                                                     |
| `x-component: 'Card'`     | 项目自定义 Card 组件，提供带 title 的视觉                                     |
| 组件只读内层              | `config.groupSetting.subField.nestedField` 路径访问，**不读外层 `$subGroup`** |

### 命名约定

外层 Card 字段**建议加 `$` 前缀**，与普通数据字段区分（如 `$color` / `$scrollbar` / `$xAxisSettings`）。这是项目惯例，**不是 Formily 强制要求**。

### 适用场景

| 场景                                 | 是否使用 Card                          |
| ------------------------------------ | -------------------------------------- |
| 折叠面板顶部唯一字段                 | ❌ 不需要（直接挂在 CollapsePanel 下） |
| 折叠面板内有 5+ 个同类字段想视觉分组 | ✅ 用 Card                             |
| 折叠面板内同名字段需要二级标题       | ✅ 用 Card                             |
| 折叠面板内需要复杂嵌套               | ✅ Card + object 双层                  |

### 反例

```typescript
// ❌ 单一字段也包 Card：徒增层级
$paginationSetting: {
    properties: {
        $card: {                          // 没必要
            type: 'void',
            'x-component': 'Card',
            'x-component-props': { title: '简单开关' },
            properties: {
                enable: {                 // 单字段直接挂 CollapsePanel 下即可
                    type: 'boolean',
                    'x-decorator': 'FormItem',
                    'x-component': 'Switch',
                },
            },
        },
    },
},

// ❌ 数据写在 void 层（数据丢失）
$color: {
    type: 'void',                         // void 不存数据！
    properties: {
        prevNextColor: { ... },           // 实际拿不到
    },
},
```

## 数组项分组模式（ArrayCollapse）

数组项内部的 `items` 节点和 Card 模式一样，**必须用 `type: 'object'` 承载数据**。如果误写成 `type: 'void'`，数据会被丢弃，运行时拿不到字段值。

参考：`src/packages/params-trigger/schema.ts`（`mappingList.items`）、`src/packages/table-detail/schema.ts`（数组配置）。

### 正确示例

```typescript
mappingList: {
    type: 'array',
    'x-component': 'ArrayCollapse',
    'x-decorator': 'FormItem',
    items: {
        type: 'object',                            // ← 必须 object 存数据
        'x-component': 'ArrayCollapse.CollapsePanel',
        'x-component-props': { header: '映射项' },
        properties: {
            index: {
                type: 'void',                       // 操作组件不存数据
                'x-component': 'ArrayCollapse.Index',
            },
            sourceKey: {                            // ← 真实字段：可正常读写
                type: 'string',
                title: '订阅键',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                enum: sourceKeyEnum,
            },
            remove: {
                type: 'void',                       // 删除按钮不存数据
                'x-component': 'ArrayCollapse.Remove',
            },
        },
    },
},
```

### 关键规则

| 规则                                 | 说明                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `items` 必须 `type: 'object'`        | 用来承载每一项的真实数据                                              |
| 操作组件用 `type: 'void'`            | `ArrayCollapse.Index` / `ArrayCollapse.Remove` 等操作类用 void        |
| 数据字段（input / output 等）         | 必须挂在 `object` 这一层下，否则运行时拿不到                          |
| `ArrayCollapse.Addition`             | 放在 `properties`（非 `items`）里，按钮自身 void，写在 `defaultValue` |

### 反例

```typescript
// ❌ items 写成 void：数据全部丢失
mappingList: {
    type: 'array',
    'x-component': 'ArrayCollapse',
    items: {
        type: 'void',                              // ← 错误！应当 object
        'x-component': 'ArrayCollapse.CollapsePanel',
        properties: {
            sourceKey: { ... },                    // 拿不到值
            input: { ... },
            output: { ... },
        },
    },
},
```

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

| 属性                | 说明                                  |
| ------------------- | ------------------------------------- |
| `title`             | 表单字段标题                          |
| `type`              | 数据类型 string/number/boolean/object |
| `x-decorator`       | 装饰器组件，通常为 FormItem           |
| `x-component`       | 表单组件                              |
| `x-component-props` | 组件属性                              |
| `enum`              | 枚举选项                              |
| `displayType`       | 显示类型，'row' 为行内显示            |
| `x-reactions`       | 条件显隐配置                          |

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

| 组件                         | 用途                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `ColorPicker`                | 颜色选择                                                                          |
| `Background`                 | 背景配置，type: 'image' 或 'svg'                                                  |
| `NumberPicker`               | 数字输入                                                                          |
| `Radio.Group`                | 单选，optionType: 'button' 为按钮样式                                             |
| `Select`                     | 下拉选择                                                                          |
| `Switch`                     | 开关                                                                              |
| `Input`                      | 文本输入                                                                          |
| `Space`                      | 间距布局，size 属性设置间距                                                       |
| `VisualTextStyle`            | 文本样式配置（颜色、字体、字号、字重）                                            |
| `FormCollapse`               | 折叠面板容器                                                                      |
| `FormCollapse.CollapsePanel` | 折叠面板项                                                                        |
| `CustomCollapse`             | 自定义折叠面板                                                                    |
| `ArrayCollapse`              | 数组配置                                                                          |
| `Card`                       | 卡片容器（用于折叠面板**内部**进一步细分，参考 `table-detail` / `cone-bar-line`） |
