---
title: label-text 物料文档
description: 标题物料（label-text）的完整文档，包含概述、Schema、组件逻辑、数据模型、常见任务和踩坑记录
version: 1.0.0
last_updated: 2026-06-16
---

# label-text（标题）

## 1. 概述

**名称**：标题（label-text）

**用途**：可高度定制的标题组件，支持文本渐变、阴影、描边、倒影效果，支持前缀图标、背景、气泡提示，支持点击下钻交互（Modal/Drawer/Window）。

**所属分类**：文本 / 标签 / 标题

**复杂度**：高

### 1.1 文件入口

| 文件 | 作用 |
| --- | --- |
| `index.jsx` | 主组件入口 |
| `schema.ts` | 配置面板定义（1175 行，包含完整下钻交互） |
| `dataModel.json` | 数据契约 |
| `oss-material.json` | 物料元信息 |
| `index.less` | 样式（渐变文本裁剪） |
| `doc/readme.md` | 用户向文档 |

### 1.2 核心能力

- **文本效果**：支持字体渐变、阴影（textShadow）、描边（webkitTextStroke）、倒影（boxReflect）、字间距、手势光标
- **背景配置**：支持纯色/渐变背景，支持边框（圆角、宽度、样式、颜色）
- **前缀图标**：支持 Ant Design 图标或自定义图片，支持图标样式（字号、颜色、粗细、外边距）
- **气泡提示**：支持 Tooltip 气泡，支持 12 个位置，支持 HTML 换行（`<br/>`）
- **下钻交互**：支持点击事件，支持 Modal/Drawer/Window/WindowSelf 四种效果
- **文本来源**：支持静态配置、数据源字段、交互参数三种来源

### 1.3 适用场景

- 大屏标题、模块标题
- 需要特殊文本效果的标题（渐变、阴影、描边、倒影）
- 需要点击跳转的交互式标题

## 2. 三类维护内容索引

| 维度 | 文档 | 覆盖内容 |
| --- | --- | --- |
| **Schema 维护** | [schema.md](./schema.md) | 文本样式、背景、前缀、气泡、下钻交互配置面板 |
| **组件逻辑维护** | [component-logic.md](./component-logic.md) | 文本效果渲染、背景样式、前缀图标、气泡提示、点击交互 |
| **数据格式** | [data-model.md](./data-model.md) | dataModel.json 字段定义、文本来源优先级 |

## 3. Schema 结构（摘要）

Schema 分为 4 个主要面板：
- **文本**：文本内容、字体样式（渐变、阴影、描边、倒影、字间距、手势光标）
- **背景**：背景颜色（纯色/渐变）、背景边框（圆角、宽度、样式、颜色）
- **前缀**：前缀图标（Ant Design 图标/自定义图片）、图标样式
- **气泡**：气泡提示开关、气泡内容、气泡位置

交互面板包含完整的下钻配置（Modal/Drawer/Window/WindowSelf）。

详见 [schema.md](./schema.md)。

## 4. 组件逻辑（摘要）

主组件 `LabelText` 渲染流程：
1. **文本来源判断**：优先使用 `interactionProps.labelText`，其次使用 `receivedPropsParams`，最后使用 `dataSource` 或静态配置
2. **文本样式构建**：根据配置构建 `labelTextStyle`（字体、颜色、渐变、阴影、描边、字间距）
3. **背景样式构建**：根据配置构建 `innerContainerStyle`（背景色/渐变、边框、旋转）
4. **前缀图标渲染**：`CustomIcon` 子组件根据 `prefixiIConType` 渲染 Ant Design 图标或自定义图片
5. **倒影渲染**：如果 `isBoxReflect` 为 true，使用 `transform: scale(1,-1)` 渲染倒影
6. **气泡提示**：使用 `Tooltip` 组件，支持 HTML 换行（`<br/>` 分割）
7. **点击交互**：`onLabelClick` 根据 `clickEvent.effect` 调用 `interaction.dispatch` 或 `window.open`

详见 [component-logic.md](./component-logic.md)。

## 5. 数据格式（摘要）

dataModel.json 定义了 2 个指标字段：
- `content`（标题文本）
- `iconType`（标题 Icon）

文本来源优先级：
1. `interactionProps.labelText`（交互参数）
2. `receivedPropsParams`（下钻参数）
3. `dataSource?.content` 或 `dataSource?.[0]?.content`（数据源）
4. `text.textContainer.content`（静态配置）

详见 [data-model.md](./data-model.md)。

## 6. 常见修改

详见 [common-tasks.md](./common-tasks.md)。

跨三类维护的典型任务：
- 新增文本效果（如文字发光）
- 新增背景效果（如背景图片）
- 新增前缀图标类型
- 调整下钻交互参数

## 7. 注意事项

详见 [gotchas.md](./gotchas.md)。

主要踩坑：
- `dataConfig.json` 默认数据是对象，但组件兼容数组格式
- 渐变文本需要使用 `background-clip: text` 和 `-webkit-text-fill-color: transparent`
- 倒影使用 `transform: scale(1,-1)` 会反转内容
- 气泡内容支持 `<br/>` 换行，需要手动分割
