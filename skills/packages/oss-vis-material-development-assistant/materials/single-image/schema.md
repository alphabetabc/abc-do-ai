---
title: single-image - Schema 配置面板详解
description: 单张图片物料的配置面板 Schema 定义，包含图片样式、点击事件、可见范围三个面板及完整的下钻配置
version: 1.0.0
last_updated: 2026-06-16
---

# 🟦 Schema 配置面板详解

> 源码文件：[`packages/single-image/schema.ts`](../../../../../packages/single-image/schema.ts)

## 整体结构

Schema 导出两个核心对象：`schema`（面板定义）和 `defaultValue`（默认值）。

```
schema.fields
├── [0] 配置（config）
│   └── FormCollapse
│       ├── 图片样式（backgroundStyle）
│       ├── 点击事件（clickEventConfig）
│       └── 是否可见（visible）
├── [1] 数据（dataConfig）
│   └── DynamicData 组件
└── [2] 交互（defineInteractionSchema）
    ├── subscribe：urlParam + otherParam1~5
    └── action：下钻配置 + 派发参数
```

## 面板 1：图片样式（backgroundStyle）

| 字段 | 组件 | 类型 | 说明 |
|------|------|------|------|
| `backgroundType` | Radio.Group | string | 图片类型：`Image`（位图）/ `SVG`（矢量图） |
| `backgroundImage` | Background | string | 矢量图上传，acceptType: `.svg`，仅 SVG 模式可见 |
| `backgroundColor` | ColorPicker | string | 矢量图填充色，仅 SVG 模式可见 |
| `backgroundDefine` | Background | string | 位图背景图上传，仅 Image 模式可见 |
| `backgroundRepeat` | Select | string | 图片重复：`full` / `no-repeat` / `repeat-x` / `repeat-y` / `repeat` |
| `isCursorHand` | Switch | boolean | 手势光标开关 |

### 条件显隐逻辑

- `backgroundImage` 和 `backgroundColor`：当 `backgroundType === 'SVG'` 时可见
- `backgroundDefine`：当 `backgroundType === 'Image'` 时可见
- `backgroundType` 有 tooltip 提示：「矢量图配置存在浏览器兼容性问题，谨慎使用」

## 面板 2：点击事件（clickEventConfig）

| 字段 | 组件 | 类型 | 说明 |
|------|------|------|------|
| `clickParams` | Input | string | 参数值，点击时派发的参数内容 |
| `isJoinParam` | Switch | boolean | 拼接参数值开关，开启后将解析 clickParams 中的 otherParam1~5 占位符并替换为实际值 |

> `isJoinParam` 的 tooltip 说明了参数解析规则：`a=otherParam1&b=otherParam2` → 将接收到的 otherParam1、otherParam2 替换后变成 `a=1,2&b=1,2` 形式派发。

## 面板 3：是否可见（visible）

| 字段 | 组件 | 类型 | 说明 |
|------|------|------|------|
| `visible` | Select | string | 可见范围：`all`（所有人）/ `province`（省用户）/ `city`（地市用户） |

## 交互面板（defineInteractionSchema）

### Subscribe（接收参数）

| 字段 | 标题 | 说明 |
|------|------|------|
| `urlParam` | 跳转页面参数 | 用于 Window/WindowSelf 下钻时拼接 URL |
| `otherParam1` ~ `otherParam5` | 拼接参数 1~5 | 用于点击时透传到下钻或参数派发 |

### Action（点击事件配置）

#### 下钻配置（configurableEvent.clickEvent）

| 字段 | 组件 | 说明 |
|------|------|------|
| `show` | Switch | 下钻开关 |
| `effect` | Select | 事件效果：`Modal` / `Drawer` / `Window` / `WindowSelf` |

#### Modal 下钻子配置（effect === 'Modal'）

| 字段 | 组件 | 说明 |
|------|------|------|
| `params` | Input | iframe URL 参数，格式 `a=1&b=2` |
| `drilldownItemFields` | Input | 从数据项中获取的 query 参数字段，逗号分隔 |
| `position` (left/top) | NumberPicker | 弹窗位置 |
| `size` (width/height) | NumberPicker | 弹窗尺寸（高度不含标题栏） |
| `closeIconPosition` (left/top) | NumberPicker | 关闭图标位置 |
| `closeIconFont` (size/type) | NumberPicker + Input | 关闭图标大小和 IconType |
| `mask` | Switch | 显示遮罩层 |
| `closable` | Switch | 显示关闭按钮 |

#### Drawer 下钻子配置（effect === 'Drawer'）

| 字段 | 组件 | 说明 |
|------|------|------|
| `params` | Input | iframe URL 参数 |
| `drilldownItemFields` | Input | query 参数字段 |
| `title` | Input | 弹窗标题 |
| `placement` | Select | 位置：`top` / `bottom` / `left` / `right` |
| `width` | NumberPicker | 宽度（仅 left/right 时可见） |
| `height` | NumberPicker | 高度（仅 top/bottom 时可见） |
| `mask` | Switch | 显示遮罩层 |
| `closable` | Switch | 显示关闭按钮 |

#### Window 下钻子配置（effect === 'Window' / 'WindowSelf'）

| 字段 | 组件 | 说明 |
|------|------|------|
| `params` | Input | URL 参数 |

#### 派发参数（$collapsePanel-click）

| 字段 | 组件 | 说明 |
|------|------|------|
| `imageClickParams` | Input | 点击传参字段名，与点击事件互斥 |

> **互斥逻辑**：当 `configurableEvent.drilldownEvent.show === true` 时，派发参数面板被 `x-disabled` 禁用。

## 默认值（defaultValue）

```js
{
  config: {
    backgroundStyle: {
      backgroundType: 'Image',       // 默认位图模式
      backgroundImage: 'svg-1.svg',
      backgroundColor: '#ada8ac',
      backgroundDefine: 'background-34.png',
      backgroundRepeat: 'full',      // 默认铺满
      isCursorHand: false,
    },
    clickEventConfig: { clickParams: '' },
    visible: { visible: 'all' },
  },
  interactions: {
    configurableEvent: {
      clickEvent: {
        show: false, effect: 'Modal',
        width: 600, height: 600, left: 200, top: 100,
        mask: true, closable: true,
        drilldownItemFields: 'param',
        closeIconLeft: 550, closeIconTop: 25,
      },
    },
  },
}
```

## 跨文档引用

- 🟨 组件如何消费这些 Schema 配置 → [component-logic.md](./component-logic.md)
- 🟩 数据源字段 content 的定义 → [data-model.md](./data-model.md)
