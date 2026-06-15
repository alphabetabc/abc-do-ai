---
title: Schema 结构
description: free-layout-indicators-viewer schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-15
---

# Schema 结构

源文件：`packages/free-layout-indicators-viewer/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'free-layout-indicators-viewer',
    fields: [
        defineConfigSchema({...}),                                     // 配置面板
        defineDataConfigSchema({ fields: [...] }),                    // 数据面板
        // defineInteractionSchema({...})  ← ⚠️ 当前未启用
    ]
}
```

| 面板 | 通用工厂 | 说明 |
|------|----------|------|
| 配置 | `defineConfigSchema` + `getCompTitle` + `BASE_LAYOUT` | 配置面板 |
| 数据 | `defineDataConfigSchema` | 数据面板 |
| 交互 | ❌ 注释中 | 当前未启用 |

## 2. FormCollapse 分组详情（config）

### 2.1 布局配置 `$layout`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `layout.disableBackground` | boolean | Switch | 是否禁用背景 |
| `layout.background` | string | `Background` (type: image, clearable) | 背景图片 |
| `layout.points` | array | `MonacoEditor` | **布局点**（`{id, left, top}` 数组） |
| `layout.pointSize` | object | `Size` (enableLock: false) | 每个指标的尺寸（事件代理容器用） |

#### 2.1.1 `points` MonacoEditor 配置

```typescript
{
    type: 'array',
    title: '布局点',
    'x-component': 'MonacoEditor',
    'x-decorator': 'FormItem',
    'x-decorator-props': {
        tooltip: '布局点，用于设置指标位置，支持相对值和绝对值，每一项格式为{id: "id-1", left:10,top:"20%" }',
    },
    'x-component-props': {
        strict: true,
        height: 300,
        enableModal: true,
        enableTooltip: false,
        enableModalControl: true,
        modalProps: { footer: false },
    },
}
```

> `strict: true` 严格 JSON 校验。
> 数据格式：`[{ id: "id-1", left: "20%", top: "40%" }, ...]` 或 `[{ id: "id-1", left: 100, top: 50 }, ...]`

### 2.2 指标值 `$indicatorValueSetting`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `indicatorValueSetting.offsetY` | number | NumberPicker | 垂直方向的偏移 |
| `indicatorValueSetting.fontSetting` | object | `compositionFontStyle()` 工厂 | 字体配置（含 `fontStyle` / `gradientColors` / `enableGradient`） |

### 2.3 指标名 `$indicatorNameSetting`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `indicatorNameSetting.width` | number | NumberPicker | 宽度（控制自动换行） |
| `indicatorNameSetting.offsetY` | number | NumberPicker | 垂直方向的偏移 |
| `indicatorNameSetting.fontSetting` | object | `compositionFontStyle()` | 字体配置 |

### 2.4 指标单位 `$indicatorUnitSetting`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `indicatorUnitSetting.fontSetting` | object | `compositionFontStyle()` | 字体配置（无 offsetY/width） |

> 💡 指标单位**没有**独立的 offsetY/width，由 styled-components 容器自动布局。

### 2.5 指标个性配置 `$indicatorItemSetting`

```typescript
{
    type: 'array',
    'x-component': 'ArrayCollapse',
    items: {
        type: 'object',
        'x-component': 'ArrayCollapse.CollapsePanel',
        'x-component-props': { header: '单项' },
        properties: {
            index: { 'x-component': 'ArrayCollapse.Index' },
            filterKey: {                    // 过滤条件（多个 indicatorId 用逗号分隔）
                type: 'string',
                title: '过滤条件',
                'x-component': 'Input',
                'x-decorator-props': { tooltip: '使用indicatorId过滤，多个使用逗号分隔' },
            },
            background: {                   // 单项背景图
                type: 'string',
                title: '背景图片',
                'x-component': 'Background',
                'x-component-props': { type: 'image', clearable: true },
            },
            backgroundSize: {                // 单项背景图尺寸
                type: 'object',
                title: '背景图片尺寸',
                'x-component': 'Size',
                'x-component-props': { enableLock: false },
            },
            remove: { 'x-component': 'ArrayCollapse.Remove' },
        },
    },
    properties: {
        addition: { 'x-component': 'ArrayCollapse.Addition', title: '添加配置' },
    },
}
```

## 3. 数据面板

`defineDataConfigSchema({...})`，传入：
- `fields`: `[...dataModel.header.dimensions, ...dataModel.header.indicators]` → `[indicatorId, indicatorName, indicatorValue, indicatorUnit, indicatorType]`

## 4. 交互面板

⚠️ **当前未启用**。`schema.ts` 末尾有注释：

```typescript
// defineInteractionSchema({
//     subscribe: {},
//     action:{}
// }),
```

如需启用交互（如点击下钻），需取消注释并实现 `IndItem` 中的 `eventUISetting` 钩子（已留）。

## 5. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `MonacoEditor` | 布局点 JSON 编辑 | `points` 配置 |
| `Background` | 背景资源选择 | `layout.background` / `indicatorItemSetting[].background` |
| `Size` | 尺寸编辑（带锁定比例） | `layout.pointSize` / `backgroundSize` |
| `compositionFontStyle` | 通用字体配置工厂 | 三个指标分组都使用 |
| `ArrayCollapse` | 数组折叠 | `indicatorItemSetting` |
| `FormCollapse.CollapsePanel` | 标准折叠面板 | 5 个分组都用 |

## 6. 默认值参考

`schema.ts` 末尾 `defaultValue` 的关键项：

### 6.1 config

```typescript
{
    width: 1060, height: 150, left: 15, top: 15,
    layout: {
        points: [
            { id: 'id-1', left: '20%', top: '40%' },
            { id: 'id-2', left: '30%', top: '57%' },
            { id: 'id-3', left: '39%', top: '68%' },
            { id: 'id-4', left: '48%', top: '75%' },
            { id: 'id-5', left: '57%', top: '85%' },
            { id: 'id-6', left: '67%', top: '77%' },
            { id: 'id-7', left: '77%', top: '68%' },
            { id: 'id-8', left: '87%', top: '57%' },
            { id: 'id-9', left: 1024, top: 110 },  // ← 同时支持像素和百分比
        ],
    },
    indicatorValueSetting: {
        fontSetting: {
            fontStyle: { fontSize: 36, color: '#020D1B', fontWeight: 400, fontFamily: 'YouSheBiaoTiHei-2', lineHeight: 1.1 },
            gradientColors: [/* 蓝色 → 白色 线性渐变 */],
            enableGradient: true,
        },
    },
    indicatorUnitSetting: {
        fontSetting: { fontStyle: { fontSize: 16, color: '#fff', fontFamily: 'Microsoft YaHei' }, enableGradient: false },
    },
    indicatorNameSetting: {
        width: 70,
        fontSetting: { fontStyle: { fontSize: 14, color: '#fff', fontFamily: 'Microsoft YaHei', fontWeight: 'bold' }, enableGradient: false },
    },
}
```

### 6.2 dataConfig

```json
{
    "dataType": "json",
    "json": [
        { "indicatorId": "id-1", "indicatorName": "应急人员", "indicatorValue": 115, "indicatorUnit": "个", "indicatorType": "" },
        // ... 9 条数据
    ]
}
```

> 默认数据中**包含 `indicatorType` 字段**（空字符串），dataModel 中**已声明**但组件**未使用**。

## 7. 跨文档引用

- `points` 匹配逻辑 → [component-logic.md § 3.1](./component-logic.md#31-坐标点匹配-points)
- `compositionFontStyle` 工厂产物 → [component-logic.md § 5](./component-logic.md#5-渐变文字-styledgradienttsx)
- 字段展开（`...header.indicators`）→ [data-model.md § 2](./data-model.md#2-字段说明)
