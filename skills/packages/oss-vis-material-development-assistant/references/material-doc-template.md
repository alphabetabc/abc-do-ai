---
title: 物料 doc 文档模板
description: packages/{name}/doc/readme.md 的标准结构与维护规范，对应物料代码同目录下的用户向文档
version: 1.0.0
last_updated: 2026-06-12
---

# 物料 doc 文档模板（`packages/{name}/doc/readme.md`）

> 用于 `src/packages/{name}/doc/readme.md` 的编写与维护。这是物料**自带的**用户向文档，
> 与 `materials/{name}/` 下面向开发者的 5+1 文档**不同**。

## 与 5+1 文档的区别

| 维度        | `packages/{name}/doc/readme.md`  | `materials/{name}/*`        |
| ----------- | --------------------------------- | --------------------------- |
| 读者        | 物料使用者（业务方、设计器用户）  | 物料开发者（维护工程师）    |
| 内容深度    | 截图 + 功能清单 + 数据模板        | 字段定义、hooks、性能、踩坑  |
| 维护触发    | 用户可感知行为变更                 | 任何代码改动                 |
| 配套文件    | `doc/CHANGELOG.md`                 | 无（版本由 skill 内部追踪）  |

## 目录结构

```
packages/{name}/doc/
├── readme.md          # 必填：用户向文档
├── CHANGELOG.md       # 必填：版本变更记录（手动维护，不依赖 oss-material.json.version）
└── images/            # 选填：截图资源
    ├── conf-1.png
    └── ...
```

## 标准模板

````markdown
---
title: {中文名，与 oss-material.json.title 一致}
group:
    title: {分组：信息 / 图表 / 容器 / 控件 / ...}
---

# {中文名}({material-name})

## 简述

{一段话说明物料用途，1-3 个 bullet 列出核心能力}

- 能力 1
- 能力 2
- 能力 3

**组件效果示例图**（如有）：

![示例](./images/{screenshot}.png)

## 配置项

{按 FormCollapse 分组逐一列出，每个分组的截图 + 文字说明}

### {分组 1：xxx}

![配置项](./images/conf-1.png)

{特殊配置项 / 使用注意}

### {分组 2：xxx}

...

## 数据模板

```json
[
    {
        "field1": "value1",
        "field2": 123
    }
]
```

## 交互

{描述支持的交互（点击下钻、参数派发等）}

## 特殊说明

- 注意点 1
- 注意点 2
- 默认行为说明
````

## 章节说明

| 章节 | 必填 | 内容 |
|------|------|------|
| frontmatter | ✅ | `title` + `group.title`（用于设计器侧边栏渲染） |
| 简述 | ✅ | 一段话 + 3-5 个 bullet 能力清单 + 整体效果图 |
| 配置项 | ✅ | 按 FormCollapse 分组，每个分组配截图；如组内配置项复杂再分子章节 |
| 数据模板 | ✅ | 完整的 JSON 样例（可直接用于 defaultValue.dataConfig.json） |
| 交互 | 条件 | 若物料启用了 `defineInteractionSchema` / `interaction.dispatch` 则必填 |
| 特殊说明 | 选 | 默认行为、特殊边界、与其他物料的差异 |

## 维护触发规则

| 改动类型                                          | 是否更新 doc |
| ------------------------------------------------- | ------------ |
| 新增 schema 配置项 / 新增交互                      | ✅ 必须       |
| 改 dataModel.json 字段                             | ✅ 必须（同步数据模板） |
| 改 defaultValue 默认值且影响用户感知                | ✅ 必须       |
| 改核心展示逻辑（顺序、动画、组合方式）              | ✅ 必须       |
| 纯内部重构（变量重命名、提取子组件）                 | ⏳ 选填      |
| 仅微调样式未影响默认行为                            | ⏳ 选填      |
| 改 `oss-material.json` 的 version                  | ❌ 跳过（统一由构建/发布流程管控） |

## 配套文件

- **CHANGELOG.md**：每次用户可感知变更追加一条记录
  ```markdown
  ## {version}({YYYY-MM-DD})

  {本次变更要点}
  ```
- **images/**：截图文件命名建议 `{功能}-{序号}.png`，避免中文

## 引用方式

- 设计器侧边栏/帮助面板通过 `doc/readme.md` 的 `title` 字段渲染
- 不在 `materials/README.md` 中索引（与 5+1 文档分离）
- 但**状态可索引**：在 `materials/README.md` 中可加一列"自带 doc"标注 ✅/❌
