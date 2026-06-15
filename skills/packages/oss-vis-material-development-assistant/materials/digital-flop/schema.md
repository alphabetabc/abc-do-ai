---
title: Schema 结构
description: digital-flop schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-15
---

# Schema 结构

源文件：`packages/digital-flop/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'digital-flop',
    fields: [
        { name: '配置', key: 'config', schema: {...} },
        renderDataConfig({ fields: [...], showDataStatusSwitch: true }),
        defineInteractionSchema({ action: { $actionCollapse: { ... } } }),
    ]
}
```

| 面板 | 通用工厂 | 说明 |
|------|----------|------|
| 配置 | `getCompTitle` + `BASE_LAYOUT` | 标题 + 基础布局 |
| 数据 | `renderDataConfig` (来自 `@Common/schema`) | 内置 `showDataStatusSwitch: true` |
| 交互 | `defineInteractionSchema` (来自 `@Common/schema`) | 包裹单击事件 |

## 2. FormCollapse 分组详情（config）

### 2.1 样式增强 `$textStyleEnhance`（独立分组）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `textGradientColor.show` | boolean | Switch | 启用文本渐变色（`x-hidden: true`，不显示在面板） |
| `textGradientColor.color` | array | `CssGradientColor` | 渐变色数组，依赖 `show` |

> 💡 `show` 字段加了 `'x-hidden': true`，**不显示在面板**，但组件仍通过 `_.get(config, 'textGradientColor.show')` 读取（其他物料/数据源可能写入该字段）。

### 2.2 数字 `$collapse` → `number` 分组

#### 2.2.1 数字格式化（`$numberFormatter` Card）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `numberLength` | number | NumberPicker | 数据长度（不足补 0，'auto' 为不补） |
| `precision` | number | NumberPicker | 默认位数（小数点后位数） |
| `numberAbs` | number | Switch | 数值显示正数（`Math.abs(data)`） |
| `groupSeparator.show` | string | Switch | 千分位开关（`x-hidden: true`） |
| `groupSeparator.separator` | string | Input | 分隔符设置（如 `,`） |

#### 2.2.2 尺寸 / 文本 / 间距

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `size.width/height` | number | NumberPicker | 数字的尺寸宽高（不配置时由内容撑开） |
| `textStyle` | object | `VisualTextStyle` (disableLineHeight) | 文本样式 |
| `textGap` | number | NumberPicker | 文字间隔（默认 5） |

#### 2.2.3 翻牌器模式 `flopType`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `flopType` | string | Radio.Group | `normal`（无背景）/ `classics`（有背景） |

#### 2.2.4 经典模式配置（`flopType === 'classics'` 时显示）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `backgroundImage` | string | `Background` (type: image, clearable) | 背景图片 |
| `backgroundColor` | string | ColorPicker | 背景颜色 |
| `backgroundRadius` | number | NumberPicker | 背景圆角 |

#### 2.2.5 动画 `animation`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `animation.show` | string | Switch | 动画开关（`x-hidden: true`） |
| `animation.duration` | string | NumberPicker | 动画时长（毫秒） |

### 2.3 趋势设置 `trend`（独立 CustomCollapse）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `show` | string | Switch | 趋势显示开关（`x-hidden: true`） |
| `position` | string | Select | `left` / `right`（影响趋势图标在 prefix/suffix 显示） |
| `threshold` | number | NumberPicker | 临界值（数值 > 阈值 = up，反之 = down） |
| `iconSelect` | string | Select (`ICON_SELECT`) | 趋势图标（↑ / +/- / custom） |
| `iconColorSettings.syncToNumber` | boolean | Switch | 影响数值颜色（开启后数值色 = 趋势色） |
| `iconColorSettings.up` | string | ColorPicker | 上升趋势色（仅非 custom 时显示） |
| `iconColorSettings.down` | string | ColorPicker | 下降趋势色（仅非 custom 时显示） |
| `iconColorSettings.upIcon` | string | `Background` | 上升趋势自定义图（仅 custom 时显示） |
| `iconColorSettings.downIcon` | string | `Background` | 下降趋势自定义图（仅 custom 时显示） |

#### 2.3.1 级别渲染设置 `isLevel`（嵌套 FormCollapse.CollapsePanel）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `isLevel.show` | boolean | Switch | 启用级别渲染 |
| `isLevel.itemsSet` | array | `ArrayCollapse` | 级别配置数组 |
| `itemsSet[].setting.level` | number | NumberPicker | 级别值（与 `data.render` 匹配） |
| `itemsSet[].setting.color` | string | ColorPicker | 级别对应颜色 |
| `itemsSet[].setting.iconWidth` | number | NumberPicker | icon 宽度 |
| `itemsSet[].setting.iconImage` | string | `Background` | icon 图片 |

### 2.4 前缀 `prefix`（独立 FormCollapse）

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `prefix.text` | string | Input | 内容（可写表达式） |
| `prefix.textStyle` | object | `VisualTextStyle` (disableLineHeight, disableTextAlign) | 文本样式 |

> 前缀和后缀配置**完全对称**。

### 2.5 后缀 `suffix`

| 字段 | 类型 | x-component | 说明 |
|------|------|-------------|------|
| `suffix.text` | string | Input | 内容 |
| `suffix.textStyle` | object | `VisualTextStyle` | 文本样式 |
| `suffix.syncToSuffix` | boolean | Switch | 数值影响颜色（依赖 `iconColorSettings.syncToNumber`） |

## 3. 数据面板

`renderDataConfig({...})`（来自 `@Common/schema`），传入：
- `fields`: `[...dataModel.header.dimensions, ...dataModel.header.indicators]` → `[value, render, suffix]`
- `showDataStatusSwitch: true` → 显示"数据为空占位符"开关

## 4. 交互面板（interactions）

### 4.1 单击事件 `$onClickAction`

```
$onClickAction (FormCollapse.CollapsePanel "单击事件")
  └── $collapse (FormCollapse)
      ├── configurableEvent (FormCollapse.CollapsePanel "下钻配置")
      │   └── clickEvent
      │       ├── show: Switch "下钻开关"
      │       ├── effect: Select "事件效果" → Modal | Drawer | Window | WindowSelf  ✅ 4 种
      │       ├── modalSet: Show when effect === 'Modal' (params/drilldownItemFields/position/size/closeIconPosition/closeIconFont/mask/closable)
      │       ├── drawerSet: Show when effect === 'Drawer' (params/drilldownItemFields/title/placement/width/height/mask/closable)
      │       └── windowSet: Show when effect === 'Window' || 'WindowSelf' (params)
      └── '$collapsePanel-click' (FormCollapse.CollapsePanel "派发参数")
          └── onClickId: Input (字段名映射, 派发 dataSource.id)
```

#### 4.1.1 4 种下钻效果对比

| effect | schema 块 | 组件行为 |
|--------|-----------|----------|
| `Modal` | `modalSet` | `interaction.dispatch({ fieldName: 'clickEvent', state: { visible: true, ...dataSource } })` |
| `Drawer` | `drawerSet` | 同 Modal |
| `Window` | `windowSet` | `window.open(url + urlParam)` |
| `WindowSelf` | `windowSet` | `window.open(url + urlParam, '_self')` |

> **与 echarts-bar 的差异**：digital-flop 支持全部 4 种下钻效果（包含 `Window` / `WindowSelf`）。

#### 4.1.2 派发参数

```typescript
// 派发字段（来自 dataSource）
{ fieldName: interaction.defined?.onClickId, state: dataSource.id }
```

> ⚠️ `dataSource.id` 在当前 dataModel 中**未声明**！详见 [gotchas.md § 2](./gotchas.md#)。

## 5. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
|------|------|------|
| `CssGradientColor` | CSS 渐变色编辑 | `textGradientColor.color` |
| `VisualTextStyle` | 通用文本样式 | 数字/前缀/后缀的 textStyle |
| `Card` | 嵌套卡片（数字格式化分组） | `$numberFormatter` |
| `CustomCollapse` | 自定义折叠面板 | 趋势/动画/千分位 |
| `FormCollapse.CollapsePanel` | 标准折叠面板 | 数字 / 趋势图标颜色 / 级别渲染 |
| `ArrayCollapse` | 数组折叠 | `isLevel.itemsSet` |
| `Background` | 背景资源选择（图片/视频） | 背景图、自定义趋势图标 |
| `ColorPicker` | 颜色选择器 | 各类颜色配置 |
| `Radio.Group` | 单选按钮组 | `flopType` |
| `Select` (`ICON_SELECT`) | 常量化的图标选择 | `iconSelect` |
| `Switch` | 布尔开关 | 大量使用 |
| `Input` / `NumberPicker` | 文本/数字输入 | 通用 |

## 6. 默认值参考

`schema.ts` 末尾 `defaultValue` + `schema-parts/defaultValues.ts` 的关键项：

### 6.1 config（基础）

```typescript
{
    width: 200, height: 80, left: 15, top: 15,
    transform: { rotate: 0 },
    opacity: 100,
    // number / trend / prefix / suffix 来自 defaultValues.ts
}
```

### 6.2 number（来自 `defaultValues.ts`）

```typescript
{
    textStyle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Microsoft YaHei', fontWeight: 'bold', textAlign: 'center' },
    backgroundColor: '#104193',
    backgroundRadius: 2,
    flopType: 'classics',
    groupSeparator: { show: true, separator: ',' },
    precision: 0,
    animation: { show: true, duration: 1000 },
}
```

### 6.3 trend（来自 `defaultValues.ts`）

```typescript
{
    show: true,
    threshold: 0,
    iconSelect: '↑',
    iconColorSettings: { up: '#00FF00', down: '#FF0000', syncToNumber: false },
}
```

### 6.4 prefix / suffix

```typescript
{
    text: '',
    textStyle: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', fontFamily: 'Microsoft YaHei' },
    // suffix 额外有 syncToSuffix: false
}
```

### 6.5 dataConfig

```json
{
    "dataType": "json",
    "json": [{ "id": 1, "value": 123, "render": 1, "suffix": "" }],
    "dataSet": { "current": {}, "params": {} },
    "api": { "mode": "get", "url": "", "headers": {}, "params": {} }
}
```

> 默认数据中**包含 `id: 1` 字段**（手写），但 `dataModel.json` 中**未声明**该字段。

## 7. 跨文档引用

- 字段展开（`...header.dimensions + ...header.indicators`）→ [data-model.md § 2](./data-model.md#2-字段说明)
- `flopType` 切换渲染逻辑 → [component-logic.md § 3.1](./component-logic.md#31-主组件-indextsx)
- TWEEN 动画实现 → [component-logic.md § 4](./component-logic.md#4-动画核心-value-renderertsx)
- `RootStyled` 渐变文字 CSS → [component-logic.md § 5](./component-logic.md#5-根容器-rootstyledtsx)
