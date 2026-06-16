---
title: Schema 结构
description: dock-menu schema 分组结构、字段定义、x-component 选择
version: 1.0.0
last_updated: 2026-06-16
---

# Schema 结构

源文件：`packages/dock-menu/schema.ts`

## 1. 顶层结构

```typescript
{
    materials: 'dock-menu',
    fields: [
        defineConfigSchema({...}),       // 配置面板
        DATA_CONFIG,                     // 数据面板（常量）
        // 无交互面板
    ]
}
```

| 面板 | 方式 | 说明 |
| --- | --- | --- |
| 配置 | `defineConfigSchema` + `getCompTitle` + `BASE_LAYOUT` | 3 个 FormCollapse 面板 |
| 数据 | `DATA_CONFIG` 常量 | 标准数据配置 |
| 交互 | ❌ 未启用 | 无交互面板 |

## 2. FormCollapse 分组详情（config）

### 2.1 通用 `$commonStyle`

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| --- | --- | --- | --- | --- |
| `width` | number | 展开宽度 | `NumberPicker` | `config.commonStyle?.width`（→ component-logic.md § 2.2.1） |
| `hideWidth` | number | 隐藏宽度 | `NumberPicker` | `config.commonStyle?.hideWidth`（→ component-logic.md § 2.2.1） |
| `activeKey` | string | 默认选中项ID | `Input` | `commonStyle.activeKey`（→ component-logic.md § 2.2.3） |
| `backgroundColor` | string | 菜单背景色 | `ColorPicker` | `commonStyle.backgroundColor`（→ component-logic.md § 2.2.1） |

#### 2.1.1 热区设置 `$hotZoneCollapse`

| 字段 | 类型 | 标题 | x-component | 组件读取方式 |
| --- | --- | --- | --- | --- |
| `hotZone.position` | string | 位置 | `Select`（left/right） | `commonStyle.hotZone.position`（→ component-logic.md § 2.2.1） |
| `hotZone.width` | number | 展开宽度 | `NumberPicker` | `commonStyle.hotZone.width`（→ component-logic.md § 2.2.1） |
| `hotZone.hideWidth` | number | 隐藏宽度 | `NumberPicker` | `commonStyle.hotZone?.hideWidth`（→ component-logic.md § 2.2.1） |

### 2.2 默认设置 `$baseStyle`

使用 `...commonStyle` 展开，包含以下子字段：

| 字段 | 类型 | 标题 | x-component |
| --- | --- | --- | --- |
| `size.width` | number | 元素尺寸-宽 | `NumberPicker` |
| `size.height` | number | 元素尺寸-高 | `NumberPicker` |
| `margin.*` | number | 元素边距（上/右/下/左） | `NumberPicker` × 4 |
| `textStyle` | object | 元素文本 | `VisualTextStyle`（disableLineHeight: true） |
| `lineHeight` | number | 元素行高 | `NumberPicker` |
| `border.*` | - | 元素边框（线型/线宽/颜色/圆角） | `Select` + `NumberPicker` × 2 + `ColorPicker` |
| `backgroundType` | string | 元素背景（背景图/背景色） | `Radio.Group` |
| `backgroundColor` | string | 背景颜色 | `ColorPicker`（条件显示） |
| `backgroundImg` | - | 背景图片 | `Background`（条件显示） |
| `backgroundRepeat` | string | 背景重复 | `Select`（条件显示） |
| `prefix` | object | 元素前缀（CustomCollapse） | `CustomCollapse` |

#### prefix 子字段

| 字段 | 类型 | 标题 | x-component |
| --- | --- | --- | --- |
| `prefix.show` | string | 开关 | `Switch`（x-hidden） |
| `prefix.prefixMargin.*` | number | 前缀边距（上/右/下/左） | `NumberPicker` × 4 |
| `prefix.prefixImg` | - | 前缀图片 | `Background` |
| `prefix.size.*` | number | 前缀尺寸（宽/高） | `NumberPicker` × 2 |

> `backgroundType` 通过 `x-reactions` 控制 `backgroundColor` / `backgroundImg` / `backgroundRepeat` 的显隐。

### 2.3 选中设置 `$activeStyle`

与默认设置完全相同的结构（`...commonStyle` 展开），字段定义同 § 2.2。

## 3. 使用的特殊 x-component 清单

| 组件 | 用途 | 备注 |
| --- | --- | --- |
| `VisualTextStyle` | 文本样式编辑 | `disableLineHeight: true` |
| `Background` | 背景图片 / 前缀图片选择 | type: 'image' |
| `ColorPicker` | 颜色选择 | 背景色、边框色 |
| `NumberPicker` | 数字输入 | 宽度、高度、边距等 |
| `Select` | 下拉选择 | 热区位置、边框线型、背景重复 |
| `Radio.Group` | 单选按钮组 | 背景类型（背景图/背景色） |
| `Switch` | 开关 | 前缀显示开关（x-hidden） |
| `CustomCollapse` | 自定义折叠面板 | 元素前缀 |
| `FormCollapse.CollapsePanel` | 标准折叠面板 | 通用/默认设置/选中设置/热区设置 |

## 4. 默认值参考

`schema.ts` 末尾 `defaultValue.config` 的关键项：

```typescript
{
    width: 300, height: 1078, left: 1566, top: 1,
    commonStyle: {
        hotZone: { height: null, width: 80, position: 'left' },
        backgroundColor: 'rgba(115, 131, 137, 0.5)',
        activeKey: '1',
    },
    baseStyle: {
        textStyle: { fontFamily: 'Microsoft YaHei', fontWeight: 'bold', fontSize: 14 },
        prefix: { show: true, prefixImg: { url: 'ShaanxiUnicom_youpingzhuangshi.png', isMaterial: false }, width: 30, height: 30 },
        width: 120, height: 30,
        backgroundType: 'image',
        backgroundImg: { url: 'ShaanxiUnicom_dmjtf.png', isMaterial: false },
        backgroundRepeat: 'full',
    },
    activeStyle: {
        textStyle: { fontFamily: 'Microsoft YaHei', fontWeight: 'bold', fontSize: 15 },
        prefix: { prefixImg: { url: '水波纹.png', isMaterial: false }, width: 20, height: 20, show: true },
        width: 120, height: 30,
        backgroundType: 'image',
        backgroundImg: { url: 'ShaanxiUnicom_youpingbiankuang.png', isMaterial: false },
        backgroundRepeat: 'full',
    },
}
```

## 5. 数据面板与交互面板

- **数据面板**：使用 `DATA_CONFIG` 常量（来自 `@Common/schema`），标准数据配置（支持 json/api/sql/dataSet 四种数据源）。
- **交互面板**：当前未启用。

## 6. 跨文档引用

- 组件读取 config → [component-logic.md § 2.1](./component-logic.md#21-入口签名)
- `formateItemBgStyle` 处理背景 → [component-logic.md § 2.2.2](./component-logic.md#222-背景样式格式化-formateitembgstyle)
- 数据面板字段 → [data-model.md § 2](./data-model.md#2-字段说明)
