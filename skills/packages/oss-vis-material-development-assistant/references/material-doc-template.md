---
title: 物料 doc 文档模板
description: packages/{name}/doc/readme.md 的标准结构与维护规范，含 Designer 侧渲染契约与构建链路
version: 2.0.0
last_updated: 2026-10-29
---

# 物料 doc 文档模板（`packages/{name}/doc/readme.md`）

> 用于 `src/packages/{name}/doc/readme.md` 的编写与维护。
> 这是物料**自带的**用户向文档，与 `materials/{name}/` 下面向开发者的 5+1 文档**不同**。

## 1. 与 5+1 文档的区别

| 维度        | `packages/{name}/doc/readme.md`  | `materials/{name}/*`        |
| ----------- | --------------------------------- | --------------------------- |
| 读者        | 物料使用者（业务方、设计器用户）  | 物料开发者（维护工程师）    |
| 内容深度    | 截图 + 功能清单 + 数据模板        | 字段定义、hooks、性能、踩坑  |
| 维护触发    | 用户可感知行为变更                 | 任何代码改动                 |
| 配套文件    | `doc/CHANGELOG.md`                 | 无（版本由 skill 内部追踪）  |

## 2. 目录结构

```
packages/{name}/doc/
├── readme.md          # 必填：用户向文档
├── CHANGELOG.md       # 必填：版本变更记录
└── images/            # 选填：截图资源
    ├── conf-1.png
    └── ...
```

> `doc/CHANGELOG.md` 的路径由 `oss-scripts/internal/materials/config.ts` 常量
> `packageChangelogFile = 'doc/CHANGELOG.md'` 约定，与 `material:update` 脚本强绑定。

## 3. Designer 侧的渲染契约

### 3.1 frontmatter（**必须**）

```yaml
---
title: {中文名，与 oss-material.json.title 一致}
group:
    title: {分组：信息 / 图表 / 容器 / 控件 / ...}
---
```

| 字段            | 作用                                                              |
| --------------- | ----------------------------------------------------------------- |
| `title`         | 设计器侧边栏 / 帮助面板渲染的标题，**必须**与 `oss-material.json.title` 一致 |
| `group.title`   | 组件管理 / 物料分组展示                                            |

> 缺失 `group` 时，物料在分组列表中归属异常。

### 3.2 构建链路

```
packages/{name}/doc/readme.md
   ↓ yarn build:material-doc (AUTO_SIDE_BAR=true, BUILD_INTO_MATERIAL=true)
   ↓ 读取 frontmatter 分组信息 + 生成 docs/_sidebar.md
docs/components/{name}/readme.md
   ↓ yarn build:single-material
build/static/material-components/zips/{name}.zip
   ├── comp/    # 编译后的物料 JS（{name}.js + chunk）
   └── doc/     # 用户向文档（readme.md + images/）
```

相关脚本（`package.json`）：

| 脚本                                | 用途                                      |
| ----------------------------------- | ----------------------------------------- |
| `build:doc`                         | 构建文档站                                 |
| `build:doc-sidebar`                 | 同上 + 自动生成侧边栏（`AUTO_SIDE_BAR=true`） |
| `build:material-doc`                | 构建物料随包文档（`BUILD_INTO_MATERIAL=true`） |
| `build:single-material`             | 打包单物料为 zip                           |

### 3.3 本地预览

```bash
# 1. 生成文档
yarn build:doc

# 2. 启动预览（需要全局安装 docsify-cli）
npm i docsify-cli -g
docsify serve docs

# 3. 默认访问地址
# http://localhost:3000
```

### 3.4 新增物料文档后

手动在 `docs/_sidebar.md` 增加路径（`build:doc-sidebar` 可自动生成）。

## 4. 标准模板

````markdown
---
title: {中文名，与 oss-material.json.title 一致}
group:
    title: {分组名称}
---

# {中文名}({material-name})

## 简述

{一段话说明物料用途}

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

{描述支持的交互（点击下钻、参数派发、订阅等）}

## 特殊说明

- 注意点 1
- 注意点 2
- 默认行为说明
````

> 脚手架模板 `oss-scripts/internal/template/material/readme.md.temp` 只含
> `title` / `group` / `简述` / `配置项` / `数据模板` / `特殊说明` 六个骨架段落。
> **`交互` 段落需手动补充**（脚手架未生成）。

## 5. 章节说明

| 章节        | 必填 | 内容                                                             |
| ----------- | ---- | ---------------------------------------------------------------- |
| frontmatter | ✅   | `title` + `group.title`（用于设计器侧边栏渲染）                    |
| 简述        | ✅   | 一段话 + 3-5 个 bullet 能力清单 + 整体效果图                       |
| 配置项      | ✅   | 按 FormCollapse 分组，每个分组配截图；复杂组再分子章节              |
| 数据模板    | ✅   | 完整的 JSON 样例（可直接用于 `defaultValue.dataConfig.json`）      |
| 交互        | 条件 | 物料启用了 `defineInteractionSchema` / `interaction.dispatch` 时必填 |
| 特殊说明    | 选   | 默认行为、特殊边界、与其他物料的差异                                |

## 6. 维护触发规则

| 改动类型                                     | 是否更新 doc |
| ------------------------------------------- | ------------ |
| 新增 schema 配置项 / 新增交互                | ✅ 必须       |
| 改 `dataModel.json` 字段                     | ✅ 必须（同步数据模板） |
| 改 `defaultValue` 默认值且影响用户感知        | ✅ 必须       |
| 改核心展示逻辑（顺序、动画、组合方式）         | ✅ 必须       |
| 改交互面板结构（下钻/动态事件/订阅）           | ✅ 必须（同步「交互」章节） |
| 纯内部重构（变量重命名、提取子组件）            | ⏳ 选填      |
| 仅微调样式未影响默认行为                       | ⏳ 选填      |
| 改 `oss-material.json` 的 `version`          | ❌ 跳过（由 `material:update` 脚本统一管控） |

## 7. CHANGELOG 规范

路径：`packages/{name}/doc/CHANGELOG.md`。由 `material:update` 脚本自动追加，格式固定：

```markdown
## {version}({YYYY-MM-DD})

{本次变更要点}
```

> 新条目追加在**文件顶部**（`updateMaterialChangelog` 用 `${newChangelogContent}\n${changelog}` 拼接）。
> 首次创建时自动补建 `doc/` 目录。

手动维护时保持同一格式：

```markdown
## 0.0.2(2026-10-29)

- 新增「动态事件」交互配置
- 修复 `dataSource` 为空时白屏问题
```

## 8. 截图规范

- 目录：`packages/{name}/doc/images/`
- 命名：`{功能}-{序号}.png`（避免中文），如 `conf-1.png`、`effect-modal.png`
- 引用：相对路径 `./images/xxx.png`
- 打包时随 `doc/` 一起进 zip，**不要**用绝对路径或外链

## 9. 与 skill 内部索引的关系

- `materials/README.md`（物料清单）**不索引** `doc/readme.md` 正文，但可加一列「自带 doc」标注 ✅/❌
- 5+1 文档（`materials/{name}/*`）面向开发者，与本文档分离维护
- `oss-material.json` 的 `version` 由 `material:update` 脚本维护，**不要手改**
