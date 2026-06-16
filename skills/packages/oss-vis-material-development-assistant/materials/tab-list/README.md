# tab-list（TAB列表）

## 1. 概述

**名称**：TAB列表（tab-list）  
**用途**：可切换的Tab列表组件，支持自动轮播、选中高亮、前缀图标（Icon/图片）、自定义样式、轮播控制开关。  
**所属分类**：轮播 / 公告  
**复杂度**：中

## 2. 核心能力

| 能力 | 说明 |
|------|------|
| 轮播切换 | 支持配置轮播周期，自动切换选中项 |
| 轮播控制 | 支持外部参数控制轮播启停，支持鼠标悬停显示控制按钮 |
| 选中样式 | 支持为选中项配置独立样式（背景、文本、边框等） |
| 前缀图标 | 支持 Icon 或图片两种前缀类型，可配置尺寸、颜色、边距 |
| 交互派发 | 选中项变化时派发 12 个参数（id、name、param、params1-9、全量值） |
| 显示控制 | 支持通过接收参数控制组件显示隐藏 |

## 3. 文档索引

| 维度 | 文档 | 说明 |
|------|------|------|
| 🟦 Schema | [schema.md](./schema.md) | 配置面板结构、x-component、联动逻辑 |
| 🟨 组件逻辑 | [component-logic.md](./component-logic.md) | 轮播逻辑、选中状态、样式构建、交互派发 |
| 🟩 数据格式 | [data-model.md](./data-model.md) | dataModel.json、数据流、字段映射 |
| 常用任务 | [common-tasks.md](./common-tasks.md) | 修改轮播周期、添加派发参数、配置前缀图标 |
| 踩坑记录 | [gotchas.md](./gotchas.md) | 已知问题与注意事项 |

## 4. 关键文件

| 文件 | 作用 |
|------|------|
| `src/packages/tab-list/index.jsx` | 主组件，包含轮播逻辑、选中状态、交互派发 |
| `src/packages/tab-list/schema.ts` | 配置面板定义，包含通用样式、选中样式、交互定义 |
| `src/packages/tab-list/dataModel.json` | 数据契约，定义 3 个指标字段 |
| `src/packages/tab-list/index.less` | 样式定义，包含容器、轮播按钮、Radio 隐藏 |
| `src/packages/tab-list/oss-material.json` | 物料元信息 |

## 5. 依赖关系

| 依赖 | 用途 |
|------|------|
| `oss-ui` | Icon、Image、ConfigProvider、Radio、DataStatus |
| `@Utils` | getImageUrl 获取图片资源路径 |
| `oss-web-toolkits` | lodash 工具方法 |
| `@Common/schema` | BASE_LAYOUT、getCompTitle、defineInteractionSchema |
| `@Common/constants` | FLEX_DIRECTION、JUSTIFYCONTENT、ALIGNITEMS |

## 6. 默认数据

```json
[
    { "id": "1", "content": "数字乡村", "icon": "visual-manager-logo-shuzixiangcun" },
    { "id": "2", "content": "工信部", "icon": "visual-manager-gongxinbu" },
    { "id": "3", "content": "交通枢纽", "icon": "visual-manager-jiaotongshuniu" }
]
```
