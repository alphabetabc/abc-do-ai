---
title: params-trigger - Schema 配置面板
description: 参数触发器物料的配置面板定义、订阅槽位、映射规则面板
version: 1.0.0
last_updated: 2026-08-04
---

# 🟦 Schema 配置面板详解

> 本文档描述 `packages/params-trigger/schema.ts` 中的配置面板定义。

## 面板结构

本物料使用 1 个 `FormCollapse` 折叠面板承载自定义映射配置：

```
配置 (ConfigPanel)
└── 映射规则 $mapping (CollapsePanel)
    └── mappingList (ArrayCollapse)
        ├── items (CollapsePanel)  // 每个映射项
        │   ├── index (ArrayCollapse.Index)
        │   ├── sourceKey (Select)  // 订阅键（下拉）
        │   ├── input (Input)       // 输入值
        │   ├── output (Input)      // 输出值
        │   └── remove (ArrayCollapse.Remove)
        └── addition (ArrayCollapse.Addition)

数据 (defineDataConfigSchema)  // 标准框架结构，未使用

交互 (defineInteractionSchema)
└── subscribe
    ├── type       // 类型
    ├── category   // 分类
    ├── status     // 状态
    ├── mode       // 模式
    ├── tag        // 标签
    ├── value      // 取值
    ├── code       // 编码
    ├── level      // 层级
    ├── id         // 标识
    └── group      // 分组
```

## 配置项详解

### 1. 标题与基础布局

通过 `getCompTitle(metaInfo, dataModel)` + `BASE_LAYOUT` 注入，详见 [component-logic.md](./component-logic.md) § 默认值。

### 2. 映射规则面板 `$mapping`

#### 2.1 dispatchPrefix（派发前缀）

| 属性    | 值                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------ |
| 类型    | `string`                                                                                               |
| 组件    | `Input`                                                                                                |
| 默认值  | `''`（运行时回退到 `DISPATCH_PREFIX = 'paramsTrigger_'`）                                              |
| Tooltip | 派发字段名的前缀,用于隔离其他同名派发;下游订阅时需使用此前缀+sourceKey。留空则使用默认 paramsTrigger\_ |

> 用户可自定义前缀以避免与项目内其他派发冲突。派发字段名 = `${dispatchPrefix}${sourceKey}`。
>
> ⚠️ **空字符串无法生效**：`''` / `null` / `undefined` 都会被 `\|\|` 短路拦截，全部回退到默认前缀。本物料**不存在"无前缀派发"模式**，是有意的安全设计。

#### 2.2 mappingList

| 属性   | 值                       |
| ------ | ------------------------ |
| 类型   | `array`                  |
| 组件   | `ArrayCollapse`          |
| 装饰器 | `FormItem`（带 tooltip） |
| 默认值 | `[]`                     |

#### 2.3 映射项 `items`（ArrayCollapse.CollapsePanel）

| 属性        | 值                            |
| ----------- | ----------------------------- |
| 类型        | `void`                        |
| 组件        | `ArrayCollapse.CollapsePanel` |
| 默认 header | `映射项`                      |

> ⚠️ **类型规范**：布局/面板类节点统一用 `type: 'void'`，不要用 `object`（见 [gotchas.md § 1](./gotchas.md)）。

子字段：

| 字段        | 类型     | x-component            | 说明               |
| ----------- | -------- | ---------------------- | ------------------ |
| `index`     | `void`   | `ArrayCollapse.Index`  | 行序号（自动）     |
| `sourceKey` | `string` | `Select`（enum）       | 订阅键（详见下表） |
| `input`     | `string` | `Input`                | 命中比较的输入值   |
| `output`    | `string` | `Input`                | 命中后的输出值     |
| `remove`    | `void`   | `ArrayCollapse.Remove` | 删除按钮（自动）   |

#### 2.4 sourceKey 候选项（enum）

由 `constants.ts` 中的 `SUBSCRIBE_KEYS` 派生，**与 subscribe 槽位共享单一真相源**：

| label          | value      |
| -------------- | ---------- |
| 类型(type)     | `type`     |
| 分类(category) | `category` |
| 状态(status)   | `status`   |
| 模式(mode)     | `mode`     |
| 标签(tag)      | `tag`      |
| 取值(value)    | `value`    |
| 编码(code)     | `code`     |
| 层级(level)    | `level`    |
| 标识(id)       | `id`       |
| 分组(group)    | `group`    |

#### 2.5 各槽位典型用法示例

完整链路：**上游派发 → 配置面板映射 → 本物料派发 → 下游订阅**。

| 槽位       | 上游派发              | 映射配置（input → output）   | 本物料派发                          |
| ---------- | --------------------- | ---------------------------- | ----------------------------------- |
| `type`     | `:type = '1'`         | `'1' → 'station'`            | `:paramsTrigger_type = 'station'`   |
| `type`     | `:type = '2'`         | `'2' → 'physic'`             | `:paramsTrigger_type = 'physic'`    |
| `category` | `:category = 'A'`     | `'A' → '甲类'`               | `:paramsTrigger_category = '甲类'`  |
| `status`   | `:status = 'online'`  | `'online' → '在线'`          | `:paramsTrigger_status = '在线'`    |
| `mode`     | `:mode = 'real-time'` | `'real-time' → '实时'`       | `:paramsTrigger_mode = '实时'`      |
| `tag`      | `:tag = 'urgent'`     | `'urgent' → '紧急'`          | `:paramsTrigger_tag = '紧急'`       |
| `value`    | `:value = '100'`      | `'100' → '一百'`             | `:paramsTrigger_value = '一百'`     |
| `code`     | `:code = '0x01'`      | `'0x01' → '成功'`            | `:paramsTrigger_code = '成功'`      |
| `level`    | `:level = '3'`        | `'3' → '高级'`               | `:paramsTrigger_level = '高级'`     |
| `id`       | `:id = 'sensor_01'`   | `'sensor_01' → '1号传感器'`  | `:paramsTrigger_id = '1号传感器'`   |
| `group`    | `:group = 'A'`        | `'A' → 'A组'`                | `:paramsTrigger_group = 'A组'`      |

> 同一槽位可配置多条映射（input 不同时分别派发对应 output）；**仅首条命中**生效。

#### 2.6 addition（添加按钮）

```typescript
{
    type: 'void',
    title: '添加映射',
    'x-component': 'ArrayCollapse.Addition',
    'x-component-props': {
        method: 'push',
        defaultValue: {
            sourceKey: SUBSCRIBE_KEYS[0].key,  // 默认 'type'
            input: '',
            output: '',
        },
    },
}
```

## 交互配置 `defineInteractionSchema`

10 个订阅槽位**由 `SUBSCRIBE_KEYS` reduce 派生**，每个槽位都是同构结构：

```typescript
{
    type: 'string',
    title: '${title}(${key})',  // 例 '类型(type)'
    'x-component': 'Input',
    'x-decorator': 'FormItem',
}
```

| 槽位       | 标题           | 适用场景                 |
| ---------- | -------------- | ------------------------ |
| `type`     | 类型(type)     | 订阅 `:type` 类参数      |
| `category` | 分类(category) | 订阅 `:category` 类参数  |
| `status`   | 状态(status)   | 订阅 `:status` 类参数    |
| `mode`     | 模式(mode)     | 订阅 `:mode` 类参数      |
| `tag`      | 标签(tag)      | 订阅 `:tag` 类参数       |
| `value`    | 取值(value)    | 订阅 `:value` 类通用参数 |
| `code`     | 编码(code)     | 订阅 `:code` 类编码参数  |
| `level`    | 层级(level)    | 订阅 `:level` 类层级参数 |
| `id`       | 标识(id)       | 订阅 `:id` 类标识参数    |
| `group`    | 分组(group)    | 订阅 `:group` 类分组参数 |

> ⚠️ **框架约束**：`subscribe` 槽位必须在 schema 中静态声明（无法运行时动态注册）。若需订阅未列出的全局参数，可将其接到任意一个槽位上，下游订阅对应 `paramsTrigger_${槽位名}` 即可。

## 默认值 (`defaultValue`)

```typescript
{
    config: {
        title: '参数触发器',
        width: 300,
        height: 300,
        left: 15,
        top: 15,
        isLock: false,
        isHidden: false,
        mappingList: [],
        dispatchPrefix: '',  // 留空时使用默认前缀 DISPATCH_PREFIX
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
}
```

> ⚠️ `mappingList: []` 是**新增映射前的初始空数组**；用户首次拖入物料后需手动添加映射项。
> ⚠️ `dispatchPrefix: ''` 表示**未配置**，运行时回退到默认 `paramsTrigger_`。

## 特殊 x-component 清单

| 组件                          | 用途             | 备注                        |
| ----------------------------- | ---------------- | --------------------------- |
| `FormCollapse`                | 配置面板折叠容器 | 带 `bordered: false`        |
| `FormCollapse.CollapsePanel`  | 单个折叠面板     | `$mapping`                  |
| `ArrayCollapse`               | 可增删的数组列表 | `mappingList`               |
| `ArrayCollapse.CollapsePanel` | 单个数组项面板   | `items`，**type 必须 void** |
| `ArrayCollapse.Index`         | 序号组件         | 内置                        |
| `ArrayCollapse.Remove`        | 删除按钮         | 内置                        |
| `ArrayCollapse.Addition`      | 添加按钮         | 自定义 defaultValue         |
| `Select`                      | 枚举下拉         | `sourceKey`                 |
| `Input` + `FormItem`          | 文本输入         | `input` / `output`          |

## 条件显示逻辑

本物料**无 `x-reactions` 条件显示**，所有配置项无条件渲染。

## 相关文档

-   配置如何影响派发行为 → [🟨 component-logic.md](./component-logic.md)
-   数据默认值 → [🟩 data-model.md](./data-model.md)
-   新增订阅槽位的操作步骤 → [common-tasks.md § 1](./common-tasks.md#任务-1新增订阅槽位)
