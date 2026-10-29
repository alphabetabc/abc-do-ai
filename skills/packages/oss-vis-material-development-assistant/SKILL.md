---
name: oss-vis-material-development-assistant
description: 物料维护助手。维护、更新、拓展 src/packages 下所有带 oss-material.json 的有效物料。涵盖新增/重构物料组件、修改 schema、调整配置、新增交互、改数据格式等。涉及代码改动时调用。
version: 1.1.0
last_updated: 2026-10-29
---

# Material Development Assistant

## 能力概览

| 任务         | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| 维护现有物料 | 修 bug、调样式、改默认值                               |
| 拓展物料能力 | 加配置项、加交互、加数据字段                           |
| 新建物料     | 从 0 创建组件（含 schema + 组件 + dataModel）          |
| 文档化物料   | 按 5+1 段式编写物料专属文档                            |
| 维护物料文档 | 代码变更后**同步更新**对应物料的 5+1 文档              |
| 维护物料 doc | 自动维护 `packages/{name}/doc/readme.md`（用户向文档） |

**作用域**：`src/packages/**/oss-material.json` 命中的目录（[清单](./materials/README.md)，共 **155** 个）。

## 任务导航（按需求查表）

| 我想...                       | 看哪份文档                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------- |
| 加一个配置项（颜色/尺寸/...） | [references/schema-reference.md](./references/schema-reference.md)           |
| 改组件渲染逻辑 / 修 bug       | [references/component-patterns.md](./references/component-patterns.md)       |
| 加下钻 / 派发交互             | [references/interaction-patterns.md](./references/interaction-patterns.md)   |
| 改数据字段 / 接新数据源       | `materials/{name}/data-model.md`                                             |
| 维护某个具体物料              | `materials/{name}/README.md`                                                 |
| 给物料写 5+1 文档             | [materials/\_template.md](./materials/_template.md)                          |
| 维护物料的 `doc/readme.md`    | [references/material-doc-template.md](./references/material-doc-template.md) |
| 查有哪些物料 / 文档化状态     | [materials/README.md](./materials/README.md)                                 |

## 维护物料的三个维度

每个物料的修改都归属以下三类之一，**先定位再动手**：

| 维度             | 图例 | 关注点                                    | 涉及文件                     |
| ---------------- | ---- | ----------------------------------------- | ---------------------------- |
| **Schema 维护**  | 🟦   | 配置面板、分组、x-component、默认值       | `schema.ts`                  |
| **组件逻辑维护** | 🟨   | TSX、props、hooks、子组件、样式           | `index.tsx` / `components/*` |
| **数据格式**     | 🟩   | dataModel.json、数据契约、dataSource 匹配 | `dataModel.json`             |

## 文档结构

```
material-development-assistant/
├── SKILL.md                    # 本文件（任务导航）
├── references/                 # 通用参考
│   ├── schema-reference.md     # Schema 编写规范（Designer 消费链路 + define* 系列 + x-component 白名单）
│   ├── component-patterns.md   # 组件代码模式（props 契约、class 命名、hooks、数据读取、性能）
│   ├── interaction-patterns.md # 交互开发模式（5 种模式 + 优先级 + 选型速查）
│   └── material-doc-template.md # 物料 doc/readme.md 模板（用户向文档）
└── materials/                  # 物料专属文档
    ├── README.md               # 155 个物料清单
    ├── _template.md            # 5+1 段式模板
    └── {name}/                 # 各物料文档
        ├── README.md
        ├── schema.md           # 🟦
        ├── component-logic.md  # 🟨
        ├── data-model.md       # 🟩
        ├── common-tasks.md     # 跨三类
        └── gotchas.md
```

> **路径规范**：物料源文件引用使用项目根相对路径，例 `packages/free-layout-indicators-viewer/dataModel.json`（省略 `src/` 前缀和 `file:///` 全量路径）。

## 维护策略

- **不手动更新 `oss-material.json` 的 `version` 字段**——由 `yarn material:update` 脚本统一管控（它会交互式询问版本号、更新 `version`/`commit`/`versionBy`，并自动追加 `doc/CHANGELOG.md`）
- **新增/删除文档时**同步更新 `materials/README.md` 清单
- **修改 schema/component/data 后必须维护物料 doc**：
  - 改了 `schema.ts` → 更新 `materials/{name}/schema.md`（字段、分组、x-component）
  - 改了 `index.tsx` / 子组件 / hooks → 更新 `materials/{name}/component-logic.md`
  - 改了 `dataModel.json` / 数据流向 → 更新 `materials/{name}/data-model.md`
  - 改了跨三类的逻辑 → 更新 `materials/{name}/common-tasks.md`，新增踩坑更新 `gotchas.md`
  - 任何改动都应同时校对 `materials/{name}/README.md` 摘要是否还准确
- **同时维护 `packages/{name}/doc/readme.md`（用户向文档）**：
  - 改了功能/能力（新增交互、改数据格式、改核心展示）→ 必须更新 `doc/readme.md` 的"简述"、"配置项"、"数据模板"、"特殊说明"对应段落
  - 改了用户可感知行为 → 同步更新 `doc/CHANGELOG.md`
  - 模板见 [references/material-doc-template.md](./references/material-doc-template.md)
  - 不动 doc 的场景：纯内部重构、未变更默认值的样式微调（`oss-material.json` 的 `thumbnail`、类名内部调整）

## Class 命名速记

```typescript
const COMPONENT_NAME = '{oss-material.json.name}'; // kebab-case

// class 命名
`${COMPONENT_NAME}-root` // 根（可省略 -root）
`${COMPONENT_NAME}-header` // 子节点
`${COMPONENT_NAME}-content`;
```

完整规范见 [references/component-patterns.md § 5](./references/component-patterns.md#5-class-命名规范)。

## 开发流程

1. **确认分支**：`git status` —— 文档必须基于 `develop`（见「分支与发布上下文」）
2. **定位任务类型**（查"任务导航"表）
3. **读通用规范**（对应 references 文档；改动前先扫一遍「Designer 契约速查」）
4. **读物料特有**（materials/{name}/）
5. **执行修改**：先动 schema → 再动组件 → 最后数据
6. **自检**（按下表逐项确认，避免"写完跑不起来"）
7. **同步物料清单**（如新增/删除文档，更新 `materials/README.md`）
8. **同步物料用户文档**（如有用户可感知变更，更新 `packages/{name}/doc/readme.md` 与 `CHANGELOG.md`）

### 自检清单

| 检查项 | 怎么查 |
|---|---|
| schema 引用的 `x-component` 真实存在 | 对照 [schema-reference.md § 8](./references/schema-reference.md) 的白名单；**`EventAction` 不存在** |
| 折叠面板 / 数组项的 `type` 正确 | CollapsePanel 与数组 `items` 用 `object`；`DefineActionArray` 用 `void` |
| `materialInfo.type` === `oss-material.json.name` | 直接比对两个文件 |
| 交互读取路径正确 | 用 `props.interaction.defined`（**不是** `props.interactions`） |
| 派发 `fieldName` 非空 | 派发前判空，否则被 Designer 静默丢弃 |
| 数据读取有兜底 | 一律 `_.get(props, 'a.b.c', 默认值)` |
| 物料元信息完整 | `yarn material:metalDataCheck`（校验 `name/title/version/main/schema/thumbnail/groupId/type/versionBy/commit`） |
| 构建可过 | `yarn build:single-material {name}` |

## 分支与发布上下文

### 分支策略

| 分支                   | 角色                           | 内容特征                                                       | 维护重点                                              |
| ---------------------- | ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------- |
| **`develop`**          | 主开发分支（**权威源**）       | 物料组件的**最新代码**，新能力、新交互、新字段都在这里         | 文档与文档化物料必须基于 `develop` 当前代码           |
| `release/*` / `master` | 已发布分支                     | 旧版物料，含兼容性代码（兼容老编辑器）、旧字段、未清理的脏数据 | **不主动修改**；如必须改动应 cherry-pick 到 `develop` |
| `feature/*`            | 个人/团队特性分支              | 临时开发，可能含未完成代码                                     | 不直接看，先合并到 `develop`                          |

> ⚠️ **核心原则**：
>
> - **不要基于 `release` 分支的代码写文档**——它有兼容代码、字段已冻结，写出来的文档是历史而非现状
> - **`develop` 是唯一权威源**——所有 5+1 文档、doc/readme.md 索引都必须基于 `develop` 当前 commit
> - 切换分支后**重新核对**之前写的文档，因为 `develop` 可能新增了交互/字段
> - 当前仓库实际 checkout 的分支可能是 `feature/*`（如 `feature-241571`）。**动手写文档前先 `git status` 确认分支**，并以 `develop` 为对照基线核对差异。

### 兼容性代码识别

开发/阅读时遇到以下情况，**很可能是 release 分支的兼容代码**（不要照搬到新文档中）：

| 兼容代码特征                                   | 例子                                  | 处理                                     |
| ---------------------------------------------- | ------------------------------------- | ---------------------------------------- | --------------- | ---------------------------- |
| `if (designerProps?.version) { /* 老逻辑 */ }` | version 分支                          | 不在文档中说明，**视为已废弃**           |
| 字段在 schema 中用 `x-hidden: true` 但仍写     | 占位字段                              | 不在物料清单里出现                       |
| 多个 `.jsx` / `.tsx` 都有 main 入口            | `echarts-bar/index.tsx` + `index.jsx` | 只认 `oss-material.json.main` 指向的文件 |
| 注释掉的 schema 块                             | `// defineInteractionSchema(...)`     | 说明**当前未启用**，文档中标注「未启用」 |
| 多余的 fallback 字段                           | `\|\| 'auto'`                         | 说明 schema 字段类型为非必填             |

### release 物料打包流程

`release` 分支（或 CI）通过 `oss-scripts/scripts/build-single-material.ts` 把当前物料代码打包成 **`.zip` 文件**，输出到 `build/static/material-components/zips/{material-name}.zip`
（路径 = `appBuildComponents` + `static/material-components/zips`，其中 `appBuildComponents = resolveApp('build')`）。每个 zip 内含：

- `comp/`：编译后的物料 JS（`{name}.js` + chunk）
- `doc/`：用户向文档（`readme.md` + `images/`）

> ⚠️ 两个仓的根目录都**没有** `develop-materials/` 文件夹（已核实不存在）。若在别处见到该目录，它由外部流程填充，**不要手动往里加东西**。
>
> 关键约束：release 物料的 `comp/` JS 必须能被**当前编辑器（设计器）**解析；如果在 `develop` 新增了编辑器暂不支持的 schema 组件 / 字段，**release 物料**可能加载报错，需要加兼容层。

### 验证 release 物料兼容

当 `develop` 上对某物料做了破坏性 schema 变更（例如改了 x-component 类型、删了字段），需要：

1. **跑构建**：`pnpm run build:single-material {material-name}` 确认能打包成功
2. **加载测试**：把 zip 拷到实际编辑器项目下加载，确认渲染与交互正常
3. **回退方案**：如果编辑器版本未跟上，保留旧字段的 schema，但 `x-hidden: true` 不让用户感知

## Designer 契约速查

> 完整说明见 `references/`。以下为最容易踩坑的几条，改代码前先扫一眼。

| 主题 | 结论 |
|---|---|
| 交互配置读取位置 | `props.interaction.defined`（**不是** `props.interactions`，后者被 `_.omit` 掉了） |
| `interaction.defined` | 是 **getter**（`→ ownerProps.value.interactions`），不要当普通对象缓存 |
| `interaction.subscribe` / `action` | 分别是「订阅到的数据数组」和「已派发数据 Map」 |
| 订阅值读取 | `props.interactionProps`（键 = schema 里声明的订阅字段名） |
| 派发字段名 | `data: [{ fieldName, state }]`，`fieldName` 为空/非字符串会被 **静默丢弃** |
| 下钻字段名 | 用 `props.designer.fieldName.DRILL_DOWN`（值 `'drilldownEvent'`），别硬编码 |
| 动态事件前缀 | 用 `props.designer.prefix.dynamicEventPrefix`（值 `'DynamicEvent-'`），别硬编码 |
| 交互常量 | `INTERACTION_TYPES.INTERACTION_TYPE_MODAL`（**没有** `INTERACTION_TYPES_MODAL` 这个名字） |
| 交互面板标题 | `defineInteractionSchema` 生成的是「**订阅管理**」「**派发管理**」 |
| 事件列表 widget | `DefineActionArray` / `DefineActionItem`；**`EventAction` 在 Designer 中不存在** |
| `DefineActionArray` 的 `type` | **必须** `'void'`，否则组件直接渲染报错文案 |
| 折叠面板 | `FormCollapse.CollapsePanel` 必须 `type:'object'`；数据字段不能挂在 `void` 层 |
| 数组项 | `items` 必须 `type:'object'`；`Index`/`Remove`/`Addition` 才用 `void` |
| `materialInfo.type` | 必须 **等于** `oss-material.json.name`（Designer 靠它匹配） |
| `schema.fields` 的 `key` | 即配置数据的顶层键（`config`/`dataConfig`/`interactions`/…）；勿自定义 `animation` key（会被吞） |
| 数据读取 | 一律 `_.get` 兜底；`dataSource` 可能为空数组 |
