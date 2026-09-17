# Schema 定义工具文档

## 一、文件概述

`defineSchema.ts` 提供了一系列用于快速构建可视化设计器中物料配置 schema 的工具函数。这些函数遵循 Formily 的 schema 规范，帮助开发者便捷地定义配置面板、交互、数据源等 schema 结构。

---

## 二、函数详解

### 1. defineConfigSchema - 基础配置

用于定义基础配置面板的 schema 结构。

**函数签名：**
```typescript
defineConfigSchema = (schema?: any) => {
    name: '配置',
    key: 'config',
    schema: { type: 'object', properties: { config: { type: 'object', properties: { ...(schema || {}) } } } }
}
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `schema` | `any` | 否 | 自定义配置项的 schema 定义，会被展开到 `config.properties` 下 |

**返回值结构：**
```typescript
{
    name: '配置',           // 面板名称
    key: 'config',          // 面板标识
    schema: {
        type: 'object',
        properties: {
            config: {
                type: 'object',
                properties: {
                    // 传入的 schema 会被展开到这里
                }
            }
        }
    }
}
```

**使用示例：**
```javascript
defineConfigSchema({
    width: { type: 'string', title: '宽度' },
    height: { type: 'string', title: '高度' },
})
// 输出结果会将 width、height 包裹在 config.config.properties 下
```

---

### 2. defineInteractionSchema - 交互配置

用于定义组件的交互行为 schema，支持参数订阅和事件派发。

**函数签名：**
```typescript
defineInteractionSchema = (schema: Partial<{
    subscribe: any;           // 接收参数
    action: any;              // 派发事件
    panels: Array<{ title: string; properties: any }>;  // 自定义面板
    [key: string]: any;       // 其他属性
}>)
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `subscribe` | `any` | 否 | 参数订阅配置，定义了组件可以接收哪些外部参数 |
| `action` | `any` | 否 | 事件交互配置，定义了组件可以派发哪些事件 |
| `panels` | `Array<{title, properties}>` | 否 | 自定义折叠面板数组，可添加多个自定义面板 |

**返回值的 schema 结构：**
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
                        'x-component': 'FormCollapse',           // 折叠容器
                        'x-component-props': {
                            bordered: false,
                            expandIconPosition: 'right',
                        },
                        properties: {
                            $subscribe: { /* 参数订阅面板 */ },
                            $action: { /* 事件交互面板 */ },
                            $CollapsePanel_0: { /* 自定义面板1 */ },
                            $CollapsePanel_1: { /* 自定义面板2 */ },
                            // ...其他属性
                        }
                    }
                }
            }
        }
    }
}
```

**交互配置说明：**

| 面板类型 | x-component-props.header | 说明 |
|----------|-------------------------|------|
| `$subscribe` | `'参数订阅'` | 组件接收外部参数的配置 |
| `$action` | `'事件交互'` | 组件派发事件的配置 |
| `$CollapsePanel_{index}` | 自定义标题 | 用户自定义面板 |

**使用示例：**
```javascript
defineInteractionSchema({
    subscribe: {
        dataSource: {
            type: 'string',
            title: '数据源',
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

---

### 3. defineDataConfigSchema - 数据配置

用于定义数据源配置的 schema，提供统一的数据源管理界面。

**函数签名：**
```typescript
defineDataConfigSchema = (opts?: Partial<{
    showDataStatusSwitch: boolean;  // 显示数据状态切换开关
    fields: any[];                   // 字段映射列表
    height: number;                 // 编辑器高度
    tooltip: string;                // 提示文本
    [key: string]: any;             // 其他属性
}>)
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showDataStatusSwitch` | `boolean` | - | 是否显示数据状态切换开关 |
| `fields` | `any[]` | - | 字段映射列表，用于支持字段映射功能 |
| `height` | `number` | `300` | Monaco 编辑器的高度 |
| `tooltip` | `string` | - | 鼠标悬停时的提示文本 |

**返回值的 schema 结构：**
```typescript
{
    name: '数据',
    key: 'dataConfig',
    schema: {
        type: 'object',
        properties: {
            dataConfig: {
                type: 'object',
                title: '数据属性相关',
                description: '支持多数据源转换映射',
                'x-component': 'DynamicData',
                'x-component-props': {
                    options: {
                        height: 300,
                        tooltip: '自动刷新间隔(秒)...',
                        ...opts
                    }
                }
            }
        }
    }
}
```

**使用示例：**
```javascript
// 基础用法
defineDataConfigSchema()

// 带选项用法
defineDataConfigSchema({
    showDataStatusSwitch: true,
    fields: [
        { name: 'id', label: 'ID' },
        { name: 'name', label: '名称' }
    ],
    height: 400,
    tooltip: '这是数据配置说明'
})
```

---

### 4. defineCustomDataSourceSchema - 自定义数据源（基础）

定义自定义数据源 schema 的基础函数，支持更灵活的配置。

**函数签名：**
```typescript
defineCustomDataSourceSchema = (opts?: {
    properties?: any;           // 自定义属性
    'x-component'?: any;        // 组件类型
    'x-component-props'?: any; // 组件属性
})
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `properties` | `any` | 否 | 自定义属性定义，会展开到 schema 的 properties 下 |
| `x-component` | `any` | 否 | 指定使用的 x-component 组件 |
| `x-component-props` | `any` | 否 | 传递给 x-component 的 props |

**返回值的 schema 结构：**
```typescript
{
    name: '数据',
    key: 'customDataSourceApiConfig',
    schema: {
        type: 'object',
        properties: {
            customDataSourceApiConfig: {
                title: '地图接口相关配置',
                description: '支持数据集接入',
                ...subSchema,  // 包含 properties、x-component、x-component-props
                type: 'object'
            }
        }
    }
}
```

**使用示例：**
```javascript
defineCustomDataSourceSchema({
    properties: {
        apiUrl: { type: 'string', title: 'API地址' },
        method: { type: 'string', title: '请求方法' }
    },
    'x-component': 'CustomDataSource',
    'x-component-props': {
        dataRefresh: true
    }
})
```

---

### 5. defineCustomDataSourceConfigSchema - 自定义数据源（高级）

基于 `defineCustomDataSourceSchema` 的高级封装，专门用于配置自定义数据源组件。

**函数签名：**
```typescript
defineCustomDataSourceConfigSchema = (opts?: Partial<{
    dataRefresh: boolean;  // 是否显示数据刷新属性
    [key: string]: any;    // 其他属性，会合并到 x-component-props
}>)
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `dataRefresh` | `boolean` | `true` | 是否展示数据刷新属性 |

**使用示例：**
```javascript
// 使用默认配置（dataRefresh: true）
defineCustomDataSourceConfigSchema()

// 自定义配置
defineCustomDataSourceConfigSchema({
    dataRefresh: false,
    customProp: 'value'
})
```

---

## 三、组合使用示例

在实际开发中，通常需要组合使用多个 schema 定义函数来构建完整的物料配置面板：

```javascript
import {
    defineConfigSchema,
    defineInteractionSchema,
    defineDataConfigSchema,
    defineCustomDataSourceConfigSchema,
} from 'oss-web-toolkits';

// 定义一个完整的物料 schema
const myMaterialSchema = {
    type: 'object',
    properties: {
        ...defineConfigSchema({
            width: { type: 'string', title: '宽度' },
            height: { type: 'string', title: '高度' },
        }).schema.properties,

        ...defineDataConfigSchema({
            height: 400,
        }).schema.properties,

        ...defineInteractionSchema({
            subscribe: {
                data: { type: 'string', title: '数据' }
            },
            action: {
                onChange: { type: 'void', title: '变更事件' }
            }
        }).schema.properties,
    }
};
```

---

## 四、Schema 层级结构

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  materialSchema                                             │
│       │                                                     │
│       ▼                                                     │
│  {                                                   │
│      type: 'object',                                     │
│      properties: {                                      │
│          config: {              ← defineConfigSchema      │
│              properties: { ... }                          │
│          },                                               │
│          dataConfig: {          ← defineDataConfigSchema  │
│              x-component: 'DynamicData',                  │
│              x-component-props: { options: {...} }       │
│          },                                               │
│          interactions: {         ← defineInteractionSchema│
│              properties: {                                │
│                  $collapse: {                            │
│                      x-component: 'FormCollapse',        │
│                      properties: {                        │
│                          $subscribe: { ... },            │
│                          $action: { ... },               │
│                          $CollapsePanel_0: { ... }       │
│                      }                                    │
│                  }                                        │
│              }                                            │
│          },                                               │
│          customDataSourceApiConfig: { ← defineCustom...  │
│              x-component: 'CustomDataSource',            │
│              x-component-props: { dataRefresh: true }    │
│          }                                                │
│      }                                                     │
│  }                                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、相关文件路径

| 文件路径 | 说明 |
|----------|------|
| `packages/share/src/schema/defineSchema.ts` | Schema 定义工具源码 |
| `packages/formily` | Formily 相关组件包 |
| `packages/types` | 类型定义包 |

---

## 六、注意事项

1. **Formily 规范**：所有 schema 都遵循 Formily 的规范，使用 `x-component`、`x-component-props` 等扩展属性来指定渲染组件和组件属性。

2. **组件渲染**：schema 中的 `x-component` 需要在设计器中注册对应的组件，否则无法正常渲染。

3. **数据刷新**：`defineCustomDataSourceConfigSchema` 默认启用 `dataRefresh: true`，这会在配置面板中显示数据刷新相关属性。

4. **折叠面板**：`defineInteractionSchema` 会自动将订阅、事件等包装在 `FormCollapse` 折叠容器中，提供更好的组织结构。
