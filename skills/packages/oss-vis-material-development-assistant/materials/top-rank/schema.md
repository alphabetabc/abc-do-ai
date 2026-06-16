---
title: Schema 结构
description: top-rank schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-16
---

# Schema 结构

源文件：`packages/top-rank/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'top-rank',
    fields: [
        defineConfigSchema({...}),       // 配置面板
        defineDataConfigSchema({...}),   // 数据面板
        // 当前未启用交互面板
    ]
}
```

## 2. FormCollapse 分组详情

### 2.1 基础配置（继承自 BASE_LAYOUT 与 getCompTitle）

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| --- | --- | --- | --- | --- |
| `title` | string | 标题 | `Input` | `config.title` |
| `width` | number | 宽度 | `NumberPicker` | `config.width` |
| `height` | number | 高度 | `NumberPicker` | `config.height` |
| `left` | number | 左边距 | `NumberPicker` | `config.left` |
| `top` | number | 顶边距 | `NumberPicker` | `config.top` |
| `isLock` | boolean | 锁定 | `Switch` | `config.isLock` |
| `isHidden` | boolean | 隐藏 | `Switch` | `config.isHidden` |

> 注：本物料的 `width / height` 在 `defaultValue` 中是**外层容器尺寸**（300×300），而实际单项宽高由 `itemStyle.width / height` 控制（380×60）。

### 2.2 通用（itemStyle）

| 字段 | 类型 | 标题 | x-component | x-component-props | 说明 |
| --- | --- | --- | --- | --- | --- |
| `width` | number | 单项宽度 | `NumberPicker` | `placeholder: '请输入宽度'` | 每项宽度（像素） |
| `height` | number | 单项高度 | `NumberPicker` | `placeholder: '请输入高度'` | 每项高度（像素） |
| `marginTop` | number | 间距 | `NumberPicker` | `placeholder: '间距'` | 除第一项外每项的顶部间距（像素） |
| `backgroundImage` | string | 背景图片 | `Background` | `type: 'image'` | 通用背景图（fallback） |
| `indexSize` | number | 序号尺寸 | `NumberPicker` | `placeholder: '请输入尺寸'` | 序号圆形直径（像素），同时也是 `borderRadius` |
| `indexBgColor` | string | 序号背景颜色 | `ColorPicker` | `allowClear: true` | 序号圆形背景色（fallback） |
| `indexBorderColor` | string | 序号边框颜色 | `ColorPicker` | `allowClear: true` | 序号圆形边框色（fallback） |

> 注：`indexStyle.borderWidth` 和 `borderStyle` 在代码中**写死**为 `'2px'` 和 `'solid'`，未暴露 schema（详见 gotchas § 4）。

### 2.3 分项设置（itemsSet）

> ArrayCollapse 数组，每项配置"前三名"的独立样式。

| 字段 | 类型 | 标题 | x-component | 说明 |
| --- | --- | --- | --- | --- |
| `itemsSet` | array | 分项设置 | `ArrayCollapse` | 数组前三项对应排名 1 / 2 / 3 的独立配置 |
| `itemsSet[].itemSetting.backgroundImage` | string | 背景图片 | `Background` | 该项独立背景图（优先于 `itemStyle.backgroundImage`） |
| `itemsSet[].itemSetting.indexBgColor` | string | 序号背景颜色 | `ColorPicker` | 该项序号背景色 |
| `itemsSet[].itemSetting.indexBorderColor` | string | 序号边框颜色 | `ColorPicker` | 该项序号边框色 |
| `itemsSet[].itemSetting.color` | string | 字体颜色 | `ColorPicker` | **该项的数值颜色**（不是名称颜色） |

> 默认提供 3 项（金 / 银 / 铜风格），可添加 / 删除 / 移动：
> - 序号 1：`indexBgColor: '#ec4141'`（红），`color: '#FFB3B3'`
> - 序号 2：`indexBgColor: '#ffa019'`（橙），`color: '#FFDCB3'`
> - 序号 3：`indexBgColor: '#196dff'`（蓝），`color: '#B3E1FF'`

> ⚠️ 数组只对前 3 个 `dataSource` 项生效（`itemsSet[index]` 与 `dataSource` 按 index 对齐）。详见 gotchas § 5。

### 2.4 序号样式（indexFontStyle）

| 字段 | 类型 | 标题 | x-component | enum | 说明 |
| --- | --- | --- | --- | --- | --- |
| `fontFamily` | string | 字体 | `Select` | `GLOBAL_FONTS.map(...)` | — |
| `fontSize` | number | 字号 | `NumberPicker` | — | 序号数字字号 |
| `fontWeight` | string | 字体粗细 | `Select` | `FONT_WEIGHT.map(...)` | — |
| `color` | string | 字体颜色 | `ColorPicker` | `allowClear: true` | 序号数字颜色 |

### 2.5 名称样式（nameFontStyle）

同 § 2.4，作用于 `item.name` 文本。

### 2.6 数值样式（valueFontStyle）

同 § 2.4，作用于 `item.value` 文本。**注意拼写**：`valueFontStyle`（不是 `valueStyle`）。

> 注：`valueFontStyle.color` 会被 `itemsSet[index].itemSetting.color` 覆盖（前三名）。

### 2.7 单位样式（unitFontStyle）

同 § 2.4，作用于 `item.unit` 文本。

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `Background` | 背景图 / 背景色聚合 | `x-component-props.type: 'image'` 限定为图片 |
| `FormCollapse` / `FormCollapse.CollapsePanel` | 折叠面板 | 多层嵌套（itemStyle / itemsSet / 4 个 *FontStyle） |
| `ArrayCollapse` / `ArrayCollapse.{Index,Remove,MoveUp,MoveDown,Addition}` | 数组折叠 | 用于 `itemsSet` |
| `ColorPicker` | 颜色选择 | — |
| `NumberPicker` | 数字输入 | — |
| `Switch` | 开关 | — |
| `Select` | 下拉选择 | `GLOBAL_FONTS` / `FONT_WEIGHT` 枚举 |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue` 关键项：

- **数据**：
    ```json
    [
        { "name": "机房1", "value": "543", "unit": "次" },
        { "name": "机房2", "value": "322", "unit": "次" },
        // ... 10 项
    ]
    ```
    > 注：默认数据**不包含 `id` 字段**，但 dataModel 声明了 `id`（详见 data-model.md § 6）。
- **外层尺寸**：`width: 300, height: 300, left: 15, top: 15`
- **itemStyle**：`width: 380, height: 60, marginTop: 16, indexSize: 32, indexBgColor: '#0037a1', indexBorderColor: '#bcdbff'`
- **itemsSet**：3 项（红 / 橙 / 蓝）
- **indexFontStyle**：`fontFamily: 'DIN', fontSize: 18, fontWeight: 500, color: '#ffffff'`
- **nameFontStyle**：`fontSize: 16, fontWeight: 650, color: '#ffffff'`
- **valueFontStyle**：`fontFamily: 'DIN', fontSize: 26, fontWeight: 500, color: '#b3e1ff'`
- **unitFontStyle**：`fontSize: 16, fontWeight: 650, color: '#ffffff'`

## 5. 数据面板与交互面板

- **数据面板**：`DynamicData`，`fields` 由 `dataModel.dataModelDefinition.header.dimensions + indicators` 展开（`→ data-model.md`）
- **交互面板**：**当前未启用**（虽然 `doc/README.md` 声称支持"点击派发"，但代码无 click 事件，详见 gotchas § 1）
