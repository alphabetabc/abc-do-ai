---
title: Schema 编写参考
description: Schema 编写规范，覆盖 Designer 真实契约、define* 系列函数、分组面板、数组项、reactions、可用 x-component 白名单
version: 2.0.0
last_updated: 2026-10-29
---

# Schema 编写参考

> 本文档所有内容均以 **Designer 源码**（`oss-visual-designer-develop`）+ **物料仓源码**（`oss-visual-material`）双向核对。
> 权威来源：
> - Designer 端：`packages/share/src/schema/defineSchema.ts`、`packages/share/src/schema/base.ts`、`src/formily/widgets/index.js`
> - 物料端：`src/common/schema/`（`base.ts` / `flex.ts` / `events.ts` / `font-style.ts` / `defineSchema.ts`）

## 0. Schema 在 Designer 中的消费链路

理解这条链路，才能知道 schema 写错会怎样：

```
物料 schema.ts
   ↓ 构建为独立 entry（webpack-components.config.js）
   entries[`${name}.schema`] = path.resolve(dir, json.schema)
   ↓ 发布为 static/material-components/{name}/schema.js
   ↓ Designer 远端加载（src/hooks/use-remote.ts）
   fetchRemoteSchema → importFields: ['schema','defaultValue','materialInfo']
   ↓ 配置面板（src/designer/configuration-panel/component/index.jsx）
   remoteSchema.schema.fields  ||  localSchema.schema.fields
   ↓ 每个 field 渲染成一个 Tab
   <SchemaRender schema={{form:..., schema: item.schema}}
                 formData={{ [item.key]: currentConf.value[item.key] }}
                 onChange={...} />
```

**由此得到 3 条硬约束**：

1. `schema.fields` 的每一项必须形如 `{ name, key, schema }`，`key` 就是配置数据在 `currentConf.value` 下的顶层键名（`config` / `dataConfig` / `interactions` / `customDataSourceApiConfig` / `animation`）。
2. `key` **不能与 Designer 内置 tab 冲突**。Designer 会在 `fields.length > 1` 且无 `key === 'animation'` 时自动追加动画 tab（`AnimationPlugin.schema`，key 为 `animation`）——物料自己定义 `animation` 会被跳过。
3. `fields.length === 1` 时**不会**追加动画 tab。只有一个 `config` 字段的物料将没有「动画」页签。

> 自定义组件模式（`DESIGNER_TYPE_CUSTOM_COMP`）下 Designer 只保留 `field.key === 'config'`。

## 1. 引入

物料仓路径别名（`tsconfig.json` → `paths`，webpack `alias` 同步）：

| 别名 | 指向 |
|---|---|
| `@Src/*` | `src/*` |
| `@Common/*` | `src/common/*` |
| `@Components` / `@Components/*` | `src/components` / `src/components/*` |
| `@Utils` / `@Utils/*` | `src/utils` / `src/utils/*` |
| `@Configs/*` | `src/configs/*` |

```typescript
import { BASE_LAYOUT, getCompTitle, defineInteractionSchema, defineConfigSchema, defineDataConfigSchema } from '@Common/schema';
import { FONT_WEIGHT } from '@Common/constants';
import metaInfo from './oss-material.json';
import dataModel from './dataModel.json';

export const materialInfo = {
    name: metaInfo.title,   // 中文名
    icon: metaInfo.name,    // kebab-case 英文名
    type: metaInfo.name,    // 与 oss-material.json.name 一致，Designer 靠它匹配
};
```

> ⚠️ `materialInfo.type` 必须 **等于** `oss-material.json.name`。Designer 用 `type` 查找物料与 schema（`materialsList.find(d => d.type === cname)`）。

## 2. 标准骨架（推荐写法）

物料仓脚手架模板 `oss-scripts/internal/template/material/schema.ts.temp` 使用的正是这套写法：

```typescript
export const schema = {
    materials: materialInfo.type,
    fields: [
        defineConfigSchema({
            ...getCompTitle(metaInfo, dataModel),
            ...BASE_LAYOUT,
            // ↓ 自定义配置项写在这里
        }),
        defineDataConfigSchema({}),
        defineInteractionSchema({
            subscribe: {},
            // action: {},
        }),
    ],
};

export const defaultValue = {
    config: {
        title: materialInfo.name,
        width: 300,
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
};
```

### 2.1 两种等价写法

| 写法 | 产物 key | 使用场景 |
|---|---|---|
| `defineConfigSchema({...})` | `config` | **推荐**，自动包 `config.config` 一层 |
| 手写 `{ name:'配置', key:'config', schema:{ type:'object', properties:{ config:{ type:'object', properties:{...} } } } }` | `config` | 旧物料存量写法，与上者产物等价 |

> `digital-card` / `table-detail` 等大量存量物料仍是手写写法。两者可混用，但**新物料统一用 `define*` 系列**。

### 2.2 `define*` 系列函数的真实产物

来源：`packages/share/src/schema/defineSchema.ts`（Designer 侧），物料仓经 `src/common/schema/defineSchema.ts` 转出。

| 函数 | 产物 `{name, key}` | 说明 |
|---|---|---|
| `defineConfigSchema(schema)` | `{ name:'配置', key:'config' }` | 把传入对象铺到 `properties.config.properties` |
| `defineDataConfigSchema(opts)` | `{ name:'数据', key:'dataConfig' }` | `x-component:'DynamicData'`，`options` 支持 `showDataStatusSwitch` / `fields` / `height` / `tooltip` |
| `defineInteractionSchema({subscribe,action,panels})` | `{ name:'交互', key:'interactions' }` | 见 §3 |
| `defineCustomDataSourceSchema(opts)` | `{ name:'数据', key:'customDataSourceApiConfig' }` | 自定义数据源（物料自管请求） |
| `defineCustomDataSourceConfigSchema(opts)` | `{ name:'数据', key:'customDataSourceApiConfig' }` | = 上者 + `'x-component':'CustomDataSource'` + `dataRefresh:true` |

## 3. `defineInteractionSchema` 详解

### 3.1 真实产物结构

```typescript
defineInteractionSchema({
    subscribe: { /* 订阅字段 */ },
    action:    { /* 派发事件 */ },
    panels:    [ { title:'自定义面板标题', properties:{...} } ],
    // 其他键：原样铺进 interactions.properties
});
```

产出：

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
                        'x-component-props': { bordered:false, expandIconPosition:'right' },
                        properties: {
                            $subscribe:        { /* 存在 subscribe 时 */ },
                            $action:           { /* 存在 action 时 */ },
                            $CollapsePanel_0:  { /* panels[0] */ },
                            $CollapsePanel_1:  { /* panels[1] */ },
                        },
                    },
                },
            },
        },
    },
}
```

### 3.2 面板标题（**已核实，勿改**）

| 面板键 | `x-component-props.header` | 触发条件 |
|---|---|---|
| `$subscribe` | `订阅管理` | `subscribe` 非空 |
| `$action` | `派发管理` | `action` 非空 |
| `$CollapsePanel_{index}` | `panels[index].title` | `panels` 非空数组 |

> 旧文档写的「参数订阅」「事件交互」**是错的**。若你按旧文档核对 UI 文案会误判为 bug。
> 三个面板都是 `FormCollapse.CollapsePanel`；`subscribe`/`action` 为空时对应面板**不生成**。

### 3.3 三类面板语义

| 面板 | 运行时位置 | 组件读取路径 |
|---|---|---|
| `subscribe` | `interactions.value.interactions.<字段名>` | 值形如 `:上游字段名`，由 Designer 解析为订阅键 |
| `action` | `interactions.value.interactions.<字段名>` | 组件读取后用于 `interaction.dispatch` |
| `panels` | 同上 | 自定义分组 |

**运行时存储位置**：`interaction.defined === ownerProps.value.interactions`（getter）。
即配置面板里 `interactions` 面板下的一切，最终落在 `props.interaction.defined` 上。

### 3.4 使用示例

```typescript
defineInteractionSchema({
    subscribe: {
        titleSubscribeKey: {
            type: 'string',
            title: '标题订阅字段',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': { tooltip: '接收外部派发的标题值，优先级高于配置的标题' },
        },
    },
    action: {
        onClick: {
            type: 'void',
            title: '点击事件',
            'x-component': 'DefineActionItem',
        },
    },
    panels: [
        { title: '高级配置', properties: { visible: { type:'boolean', title:'是否显示' } } },
    ],
});
```

> ⚠️ `onClick` 上例用的是 `DefineActionItem`。**`EventAction` 在 Designer 中不存在**，写了会渲染为空。

## 4. 分组面板模式（FormCollapse）

### 4.1 基本结构

```typescript
$collapse: {
    type: 'void',
    'x-component': 'FormCollapse',
    'x-component-props': { bordered: false, expandIconPosition: 'right' },
    properties: {
        containerStyle: {
            type: 'object',                              // ← 必须 object
            'x-component': 'FormCollapse.CollapsePanel',
            'x-component-props': { header: '背景' },
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

### 4.2 核心规则

| 规则 | 说明 |
|---|---|
| CollapsePanel 必须 `type:'object'` | `void` 层不存数据 → 组件读不到值 |
| 面板标题走 `x-component-props.header` | 不是 `title` |
| `type:'void'` 的节点只做 UI 容器 | 不产生数据 |

### 4.3 卡片二级分组（Card）

在 CollapsePanel 内用 `Card` 做视觉细分，**双层结构**：

```typescript
$groupSetting: {
    type: 'object',
    'x-component': 'FormCollapse.CollapsePanel',
    'x-component-props': { header: '分组设置' },
    properties: {
        $subGroup: {                       // 外层 Card（视觉容器）
            type: 'void',                  // void 不存数据
            'x-component': 'Card',
            'x-component-props': {
                title: '子分组',
                bordered: false,
                style: { marginBottom: 10 },
            },
            properties: {
                subField: {                // 内层 object（数据承载）
                    type: 'object',
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

**关键规则**：

| 规则 | 说明 |
|---|---|
| 外层必须 `type:'void'` | 仅作 UI 容器 |
| 内层必须 `type:'object'` | 真正承载数据 |
| 组件只读内层 | `config.groupSetting.subField.nestedField`，**不读** `$subGroup` |
| 外层字段建议加 `$` 前缀 | 项目惯例（`$color` / `$scrollbar` / `$xAxisSettings`），非 Formily 强制 |

参考：`src/packages/table-detail/schema.ts`（`$color` / `$scrollbar`）、`src/packages/cone-bar-line/schema.ts`（`$xAxisSettings`）。

### 4.4 反例

```typescript
// ❌ 单一字段包 Card：徒增层级
$paginationSetting: {
    properties: {
        $card: {
            type: 'void',
            'x-component': 'Card',
            'x-component-props': { title: '简单开关' },
            properties: {
                enable: { type:'boolean', 'x-decorator':'FormItem', 'x-component':'Switch' },
            },
        },
    },
},

// ❌ 数据写在 void 层：数据丢失
$color: {
    type: 'void',
    properties: { prevNextColor: { /* 拿不到 */ } },
},
```

## 5. 数组项分组模式（ArrayCollapse / ArrayItems）

### 5.1 ArrayCollapse

```typescript
mappingList: {
    type: 'array',
    'x-component': 'ArrayCollapse',
    'x-decorator': 'FormItem',
    items: {
        type: 'object',                            // ← 必须 object
        'x-component': 'ArrayCollapse.CollapsePanel',
        'x-component-props': { header: '映射项' },
        properties: {
            index: {
                type: 'void',
                'x-component': 'ArrayCollapse.Index',
            },
            sourceKey: {                            // ← 真实字段
                type: 'string',
                title: '订阅键',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': { options: sourceKeyEnum },
            },
            remove: {
                type: 'void',
                'x-component': 'ArrayCollapse.Remove',
            },
        },
    },
    properties: {
        addition: {
            type: 'void',
            title: '添加条目',
            'x-component': 'ArrayCollapse.Addition',
        },
    },
},
```

| 规则 | 说明 |
|---|---|
| `items` 必须 `type:'object'` | 承载每一项真实数据 |
| 操作类用 `type:'void'` | `ArrayCollapse.Index` / `.Remove` / `.Addition` |
| `Addition` 放在 `properties`（非 `items`） | 按钮自身 void |
| `x-component-props.options` 是 Select 的选项来源 | 见 §8 |

### 5.2 ArrayItems（扁平映射列表）

```typescript
rowClickFieldMapping: {
    type: 'array',
    title: '事件数据映射',
    'x-component': 'ArrayItems',
    items: {
        type: 'object',
        'x-decorator': 'ArrayItems.Item',
        properties: {
            $Space: {
                type: 'void',
                'x-component': 'Space',
                properties: {
                    columnKey: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': { title:'列字段', placeholder:'列字段' },
                    },
                    action: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                        'x-component-props': { title:'派发字段', placeholder:'派发字段' },
                    },
                },
            },
            remove: {
                type: 'void',
                'x-component': 'ArrayItems.Remove',
            },
        },
    },
    properties: {
        addition: {
            type: 'void',
            title: '增加字段映射',
            'x-component': 'ArrayItems.Addition',
        },
    },
},
```

参考：`src/packages/table-detail/schema/interactions.ts`。

### 5.3 反例

```typescript
// ❌ items 写成 void：数据全部丢失
mappingList: {
    type: 'array',
    'x-component': 'ArrayCollapse',
    items: {
        type: 'void',                        // ← 错误！应当 object
        'x-component': 'ArrayCollapse.CollapsePanel',
        properties: { sourceKey: {...} },   // 拿不到值
    },
},
```

## 6. `DefineActionArray` / `DefineActionItem`（动态事件数组）

Designer 注册于 `src/formily/widgets/index.js`。这是**唯一**用于「多事件列表」的自定义 widget。

### 6.1 硬约束：`type` 必须是 `void`

`DefineActionArray.tsx` 内部显式校验：

```typescript
if (schema.type !== 'void') {
    return <span>…的类型必须为<strong><code>void</code></strong></span>;
}
```

写成 `object` / `array` 都会**直接渲染报错文案**，不是静默失败。

### 6.2 正确用法

```typescript
defineInteractionSchema({
    action: {
        compositionAction: {
            type: 'object',
            properties: {
                dynamicActions: {
                    type: 'void',                    // ← 必须 void
                    'x-component': 'DefineActionArray',
                    'x-component-props': {
                        title: '动态事件',
                        effectOptions: [
                            { label: '派发参数', value: 'dispatchParams' },
                            { label: '弹出Modal', value: 'Modal' },
                            { label: '弹出Drawer', value: 'Drawer' },
                        ],
                        itemSetting: {
                            headerKey: {
                                type: 'string',
                                title: '标题字段',
                                'x-decorator': 'FormItem',
                                'x-component': 'Input',
                                'x-component-props': { tooltip: '取值为title，extra' },
                            },
                            dataFieldName: {
                                type: 'string',
                                title: '数据字段',
                                'x-decorator': 'FormItem',
                                'x-component': 'Input',
                                'x-reactions': {
                                    dependencies: ['.effect'],
                                    fulfill: {
                                        run: `$self.visible = $deps[0] !== "Modal"`,
                                    },
                                },
                            },
                            modalSet: {
                                type: 'void',
                                'x-reactions': {
                                    dependencies: ['.effect'],
                                    fulfill: { run: `$self.visible = $deps[0] === "Modal"` },
                                },
                                properties: renderModalSet(),
                            },
                        },
                    },
                },
            },
        },
    },
});
```

### 6.3 它自动注入的字段

`DefineActionArray` 渲染的每项结构固定为：

| 字段 | 来源 | 说明 |
|---|---|---|
| `actionField` | 组件内建 | 「事件标识」，即派发目标字段名 |
| `effect` | 组件内建（若传 `effectOptions`） | 「事件效果」 |
| `index` / `remove` | 组件内建 | `ArrayCollapse.Index` / `.Remove` |
| 其余 | `itemSetting` | 剔除 `actionKey`、`effect` 后铺入 |

### 6.4 参考实现

`src/packages/decoration/common-container/schema.ts`（`compositionAction.dynamicActions`）
`src/packages/table/index.jsx` + `src/packages/table-fixedColumns/index.tsx`（`activeRowKeyField` 过滤）

## 7. `reactions` 条件显隐

### 7.1 两种写法

```typescript
// 写法 A：when / otherwise
'x-reactions': {
    dependencies: ['.bgType'],
    when: "{{ $deps[0] === 'color' }}",
    fulfill:    { state: { visible: true } },
    otherwise:  { state: { visible: false } },
},

// 写法 B：fulfill.run（表达式内联）
'x-reactions': {
    dependencies: ['.effect'],
    fulfill: {
        run: `$self.visible = $deps[0] !== "Modal"`,
    },
},
```

### 7.2 依赖路径写法

| 写法 | 含义 |
|---|---|
| `'.fieldName'` | 同级兄弟字段 |
| `'$.fieldName'` | 绝对路径（根下字段） |
| `'#ref'` | 引用其他字段 id |

### 7.3 便捷函数

`src/common/schema/base.ts` 导出了 `getSimpleRactions(field)`，等价于「依赖字段为 `true` 时可见」：

```typescript
import { getSimpleRactions } from '@Common/schema';

enableSub: {
    type: 'object',
    'x-reactions': getSimpleRactions('.enableSub'),
    properties: { /* ... */ },
},
```

## 8. 常用 x-component 白名单（**已核实**）

### 8.1 Designer 自定义 widget（`src/formily/widgets/index.js`）

| 注册名 | 用途 | 关键 props |
|---|---|---|
| `ColorPicker` | 颜色选择 | `allowClear` |
| `ColorGroup` | 多色组 | — |
| `Background` | 背景（图片/贴图） | `type:'image'\|'svg'`、`clearable` |
| `BackgroundColor` / `BackgroundColorGroup2EC` / `BackgroundColorGroup2G` | 背景色组 | — |
| `CssGradientColor` | 渐变色数组 | — |
| `Border` | 边框 | — |
| `VisualTextStyle` | 文字样式 | `disableLineHeight`/`disableTextAlign`/`enableLetterSpacing` |
| `EditableInput` | 可编辑标题 | `options:{dataModal,iconType,tooltip}` |
| `ComponentBaseInfo` | 组件基本信息 | `componentName`/`componentVersion`/`componentType` |
| `CustomCollapse` | 自定义折叠 | `title` 或 `header` |
| `Divider` | 分割线 | `style` |
| `DropdownBorder` | 下拉边框 | — |
| `Size` / `Lock` / `SliderWithNumber` / `TileSelect` | 尺寸/锁定/滑块/瓦片选择 | — |
| `MonacoEditor` | 代码编辑器 | `language` |
| `GeoJsonSelect` | GeoJSON 选择 | — |
| `ObjectArray` / `ObjectDescriptionsArray` | 对象数组 / 描述数组 | — |
| `LevelSettings` | 层级配置 | — |
| `Preview` | 预览 | — |
| `DynamicData` | 数据配置面板 | `options:{fields,showDataStatusSwitch,height,tooltip}` |
| `CustomDataSource` | 自定义数据源 | `dataRefresh` |
| `ExportApi` | 导出接口 | — |
| `UploadToMaterial` / `CopyTOClipboard` | 上传/复制 | — |
| `DirSpaceSize` | 上下左右间距 | — |
| `VisualIframeSelector` | iframe 选择 | — |
| `DefineActionItem` / `DefineActionArray` | 交互动作 / 动作列表 | 见 §6 |
| `AutoComplete` | 自动补全 | — |
| `Fedx3dRenderStageLoaderList` | 3D 舞台选择 | — |

> ⚠️ **未注册**：`QueryForm`、`VisualUpload`（主项目注释状态），写了不渲染。
> ⚠️ **`EventAction` 不存在**，不要使用。

### 8.2 fedx-report 内置组件（`fedx-report/lib/formily-common/SchemaField.js`）

`FormItem` `CollapseItem` `Input` `ValueInput` `SizeInput` `ColorInput` `ImageInput` `MonacoInput` `PositionInput` `CornerInput` `BackgroundImageInput` `BackgroundStyleSetter` `BoxStyleSetter` `BorderStyleSetter` `BorderRadiusStyleSetter` `DisplayStyleSetter` `BoxShadowStyleSetter` `FlexStyleSetter` `FontStyleSetter` `DrawerSetter` `NumberPicker` `DatePicker` `TimePicker` `Select` `SelectSearch` `Radio`（含 `Radio.Group`） `Checkbox` `Cascader` `Slider` `Switch` `Space` `ArrayItems` `ArrayTable` `ArrayCards` `ArrayCollapse` `FormCollapse` `FormGrid` `FormLayout` `FormTab` `Editable` `Password` `PreviewText` `Reset` `Submit` `Card` `Rate` `Transfer` `TreeSelect` `Upload` `Action` `Text` `QueryForm` `Table` `EnumText` `IconTypeSetter` `JsonSetter` `APISetter`

### 8.3 Select 选项来源（两种写法都有效）

```typescript
// 写法 A：x-component-props.options（renderDynamicEvents / DefineActionArray 用这个）
'enum-options': {
    type: 'string',
    'x-component': 'Select',
    'x-component-props': { options: [{ label:'纯色', value:'color' }] },
},

// 写法 B：enum（renderLayoutFlex / BASE_LAYOUT 用这个）
'flex-direction': {
    type: 'string',
    'x-component': 'Select',
    'x-decorator': 'FormItem',
    enum: FLEX_DIRECTION,
},
```

## 9. 背景配置模式

```typescript
bgType: {
    title: '背景类型',
    type: 'string',
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
    'x-component-props': { optionType: 'button' },
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

## 10. 文字样式配置

用 `compositionFontStyle()`（`src/common/schema/font-style.ts`）可省去重复：

```typescript
import { compositionFontStyle } from '@Common/schema';

labelStyle: {
    type: 'object',
    'x-decorator': 'FormItem',
    ...compositionFontStyle({
        fontStyleProps: { disableLineHeight: true, disableTextAlign: true },
    }),
},
```

产出三个字段：`enableGradient`(Switch) / `fontStyle`(VisualTextStyle) / `gradientColors`(CssGradientColor)。

> 手写等价：
> ```typescript
> textStyle: {
>     title: '文字样式',
>     type: 'object',
>     'x-decorator': 'FormItem',
>     'x-component': 'VisualTextStyle',
>     'x-component-props': {
>         disableLineHeight: true,
>         disableTextAlign: true,
>         enableLetterSpacing: false,
>     },
> },
> ```

## 11. 布局配置复用

`BASE_LAYOUT`（`src/common/schema/base.ts`）一次性提供：

| 字段 | 内容 |
|---|---|
| `divider1` | 分割线 |
| `$layout.position` | `left` / `top`（NumberPicker） |
| `$layout.size` | `width` / `height` / `lockedScale`（Lock） |
| `$layout.transform` | `rotate` / `scale`（TileSelect） |
| `$layout.opacity` | 不透明度（SliderWithNumber） |
| `$layout.group` | `isLock` / `isHidden`（Switch） |
| `divider2` | 分割线 |

`renderSizeWH(opts)` 可单独生成尺寸块（`fieldName` 可自定义）。

`renderLayoutFlex(decoratorProps)` 生成 `flexDirection` / `justifyContent` / `alignItems`。

## 12. 字段属性速查

| 属性 | 说明 |
|---|---|
| `title` | 字段标题（FormItem label） |
| `type` | `string`/`number`/`boolean`/`object`/`array`/`void`/`text` |
| `x-decorator` | 装饰器，通常 `FormItem` |
| `x-decorator-props` | 装饰器属性（`tooltip`/`labelCol`/`wrapperCol`/`gridSpan`/`feedbackLayout`/`style`） |
| `x-component` | 表单组件 |
| `x-component-props` | 组件属性 |
| `x-reactions` | 条件显隐 |
| `x-hidden` | `true` = 隐藏但保留数据（**占位字段**，不写入用户向文档） |
| `x-index` | 排序权重 |
| `enum` | 枚举选项（Select/Radio 等） |
| `default` | 字段默认值 |
| `displayType` | `'row'` 行内显示 |
| `component` | 遗留字段（如 `'color'`），不影响渲染 |

## 13. 常见陷阱

| 陷阱 | 后果 | 正确做法 |
|---|---|---|
| CollapsePanel 写 `type:'void'` | 配置项不落库 | 用 `type:'object'` |
| 数组 `items` 写 `type:'void'` | 数组项数据全丢 | 用 `type:'object'` |
| `DefineActionArray` 写非 `void` | 渲染报错文案 | 必须 `type:'void'` |
| 用 `EventAction` | 渲染为空 | 用 `DefineActionItem` / `DefineActionArray` |
| 用 `QueryForm` / `VisualUpload` | 渲染为空 | 改用已注册组件 |
| `materialInfo.type` ≠ `oss-material.json.name` | Designer 匹配不到物料 | 严格一致 |
| `fields` 中自定义 `key:'animation'` | 动画 tab 被吞 | 不要自定义 animation key |
| Select 只写 `enum` 不写 `options`（在 `DefineActionArray` 内） | 下拉为空 | 用 `x-component-props.options` |
| 在 `getCompTitle` 里漏传 `dataModel` | 标题旁无「数据模板下载」按钮 | 传入 `dataModel` |
