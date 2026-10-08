# Finding-003：docs/ 最小可行目录结构（D-15 ~ D-18）

> **日期**：2026-07-29
> **性质**：第二轮 research Stage B 结论
> **作用范围**：沉淀 `/docs/` 顶层 + 子目录骨架（不含业务模块 spec）
> **前置 finding**：[`2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) §1.1（模板结构）、§3.1 / §3.3（复用与不适用）
> **关联 finding**：[`2026-07-29-002-agents-md-content-plan.md`](./2026-07-29-002-agents-md-content-plan.md)（AGENTS.md 措辞）
> **规则约束**：`.trae/rules/docs-authoring-rules.md` Rule 1 / Rule 2
> **路线图**：`.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` §2 决策表 D-15 ~ D-18

---

## 0. TL;DR

| 维度              | 结论                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------- |
| 模板文件总数      | **约 70 个文件**（finding §1.1 已枚举）                                                       |
| 必保留（拷贝即用）| **16 个文件**（workflows / standards / specs/_template / skills/common / skills/ai-tools / ai-prompts-guide 等）|
| 可省略            | **23 个文件**（template 业务示例 + antd-4.19.1 research + 5 份 YAPI 快照 JSON）               |
| 可合并            | **2 处合并**（skills/frontend/react/{coding,testing}.md 暂时合并到 README 占位；research/antd-4.19.1/ 整体删除）|
| 需新增            | **3 个新目录**（`docs/design/realtime-protocol/`、`docs/design/iframe-pages/`、`docs/operations/`）+ **1 个新文件**（`docs/specs/_template/pm-inputs/code-inventory.md`） |
| 最小可行文件总数  | **约 28 个文件** + **5 个空目录占位**（含 1 个 README）→ 落 `/docs/` 后约 30 个文件            |

---

## 1. Q-101 必保留文件清单（拷贝即用 + 微调）

> 「必保留」= 模板原文可直接复用，仅路径锚点适配本项目，无需重写业务内容

| #   | 文件路径                                                | 模板来源                                                                                          | 处理方式                                |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | `docs/index.md`                                         | `.trae/.local-docs/docs模板-yzf/docs/index.md`                                | 拷贝 + 锚点适配                         |
| 2   | `docs/workflows/README.md`                              | `.trae/.local-docs/docs模板-yzf/docs/workflows/README.md`               | 拷贝 + 锚点适配                         |
| 3   | `docs/workflows/as-is-to-be-guide.md`                   | 模板原文件                                                                                        | **直接拷贝**（不重写）                  |
| 4   | `docs/workflows/brownfield-module-refactor.md`          | 模板原文件                                                                                        | **直接拷贝**（不重写）                  |
| 5   | `docs/workflows/tdd-process.md`                         | 模板原文件                                                                                        | **直接拷贝**（不重写）                  |
| 6   | `docs/standards/README.md`                              | 模板原文件                                                                                        | 拷贝 + 锚点适配                         |
| 7   | `docs/standards/coding-standards.md`                    | 模板原文件                                                                                        | 拷贝 + 微调（标注「适配 React 18 / antd 5 / fedx-ssr」） |
| 8   | `docs/standards/security-standards.md`                  | 模板原文件                                                                                        | **直接拷贝**                            |
| 9   | `docs/specs/spec-split-guide.md`                        | 模板原文件                                                                                        | **直接拷贝**                            |
| 10  | `docs/specs/_template/spec.md`                          | 模板五件套                                                                                        | **直接拷贝**                            |
| 11  | `docs/specs/_template/plan.md`                          | 模板五件套                                                                                        | **直接拷贝**                            |
| 12  | `docs/specs/_template/tasks.md`                         | 模板五件套                                                                                        | **直接拷贝**                            |
| 13  | `docs/specs/_template/acceptance-tests.md`              | 模板五件套                                                                                        | **直接拷贝**                            |
| 14  | `docs/specs/_template/data-model-extensions.md`         | 模板五件套                                                                                        | **直接拷贝**                            |
| 15  | `docs/specs/_template/pm-inputs/pm-requirements-input.md` | 模板 pm-input                                                                                    | **直接拷贝**                            |
| 16  | `docs/specs/_template/pm-inputs/assets/README.md`       | 模板 pm-input assets                                                                              | **直接拷贝**                            |
| 17  | `docs/skills/README.md`                                 | 模板 skills README                                                                                | 拷贝 + 锚点适配                         |
| 18  | `docs/skills/common/git-workflow.md`                    | 模板 common/git-workflow                                                                          | **直接拷贝**                            |
| 19  | `docs/skills/ai-tools/claude-cursor/README.md`          | 模板 claude-cursor README                                                                         | 拷贝 + 锚点适配                         |
| 20  | `docs/skills/ai-tools/claude-cursor/prompts.md`         | 模板 claude-cursor prompts                                                                        | **直接拷贝**                            |
| 21  | `docs/research/README.md`                               | 模板 research README                                                                              | 拷贝 + 锚点适配                         |
| 22  | `docs/design/README.md`                                 | 模板 design README                                                                                | 拷贝 + 锚点适配                         |
| 23  | `docs/design/decisions/README.md`                       | 模板 decisions README                                                                             | 拷贝 + 锚点适配                         |
| 24  | `docs/design/decisions/adr-template.md`                 | 模板 ADR 模板                                                                                     | **直接拷贝**                            |
| 25  | `docs/ai-prompts-guide.md`                              | 模板 ai-prompts-guide                                                                             | 拷贝 + 锚点适配                         |
| 26  | `docs/skills/frontend/README.md`                        | 模板 frontend README                                                                              | 拷贝 + 锚点适配                         |

**小计**：26 个文件直接可保留（finding 估算 16 个偏低——含 README 锚点适配类）。

---

## 2. Q-102 可省略文件清单（含原因 + 替代方案）

> 「可省略」= 模板中存在但本项目不适用；**省略≠删除**——若省略，须说明替代方案

| #   | 文件 / 目录                                              | 省略原因                                                                                          | 替代方案                                                                                       |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | `docs/research/antd-4.19.1/`（5 个文件）                 | 本项目用 **antd 5.26.7**（`package.json`），4.19.1 组件参考全部不适用                                | 不创建 antd-4 research；如需 antd 5 备忘，由 `docs/skills/frontend/react/coding.md` 占位说明  |
| 2   | `docs/specs/fault-report/`（伞形 + 子 spec 示例）         | 模板 OSS 联通告警业务，本项目无此模块                                                              | 由本项目首个 spec（如 `emergency-support-dashboard/`）替代                                     |
| 3   | `docs/specs/troubleshooting-workbench/`（伞形 + 4 子 spec）| 同上                                                                                              | 同上                                                                                            |
| 4   | `docs/specs/team-claw/`                                  | 同上                                                                                              | 同上                                                                                            |
| 5   | `docs/specs/change-shifts-page/`                         | 同上                                                                                              | 同上                                                                                            |
| 6   | `docs/design/api/fault-report.json`                      | 本项目未做 YAPI 导出；该 JSON 是模板 OSS 联通业务快照                                              | 待 YAPI 导出后单独建 `docs/design/api/<本项目模块>.json`（finding §5.1 O-8 决策）             |
| 7   | `docs/design/api/work-sheet.json`                        | 同上                                                                                              | 同上                                                                                            |
| 8   | `docs/design/api/duty-schedule.json`                     | 同上                                                                                              | 同上                                                                                            |
| 9   | `docs/skills/frontend/react/coding.md`（模板版）         | 模板以 React 16 + Hox + oss-ui 编写，与本项目 React 18 + valtio + fedx-ui 完全不适用                | **占位文件**：仅留标题 + 「待 plan-003 整合」标注，由本项目栈重写版在 plan-003 阶段产出         |
| 10  | `docs/skills/frontend/react/testing.md`（模板版）        | 模板以 jest/enzyme 为例；本项目无单测体系（finding §2.2 / O-3）                                     | **占位文件**：仅留标题 + 「待 plan-003 整合」标注                                                |
| 11  | `docs/design/framework-communication.md`（模板版）       | 模板以 qiankun 主-子应用通信为例；本项目未启用 qiankun                                                | **决策点**：见 §3.2 O-1 决策——默认改写为「上游/下游数据源契约」                                |
| 12  | `docs/design/data-models.md`（模板版）                   | 模板以 OSS 联通告警实体建模                                                                        | **占位文件**：仅留标题 + 「待 plan-003 整合」标注                                                |
| 13  | `docs/design/api-contracts.md`（模板版）                 | 模板以 OSS 联通 API 契约索引                                                                       | **占位文件**：仅留标题 + 「待 plan-003 整合」标注                                                |
| 14  | `docs/design/glossary.md`（模板版）                      | 模板以 OSS 联通术语编写                                                                            | **占位文件**：仅留标题 + 「待 plan-003 整合」标注                                                |
| 15  | `docs/design/tech-stack.md`（模板版）                    | 模板栈 React 16 / antd 4 / Hox / oss-ui                                                             | **不拷贝**：由 plan-002 步骤 4 完全重写（见 Stage A）                                            |
| 16  | `docs/design/system-overview.md`（模板版）               | 模板 IA 是 OSS 联通五模块                                                                          | **不拷贝**：由 plan-002 步骤 4 完全重写                                                          |
| 17  | `docs/design/architecture.md`（模板版）                  | 模板分层是 webpack 4 + React 16                                                                    | **不拷贝**：由 plan-002 步骤 4 完全重写                                                          |
| 18  | `docs/specs/index.md`（模板版，登记 OSS 联通示例）       | 模板登记了 7 个 OSS 联通示例模块                                                                    | **拷贝骨架 + 清空示例**：保留 README + 表格头，本项目模块待 plan-003 后登记                     |

**小计**：18 项可省略（含 5 项「不拷贝直接重写」）。

> 「占位文件」≠「空白文件」——必须保留文件名 + 一行 ⚠️「待 plan-003 整合」标注，便于追溯。

---

## 3. Q-103 可合并文件清单

| #   | 合并项                                                                 | 合并理由                                                                                            | 合并后结构                                                                                       |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `docs/skills/common/` + `docs/skills/frontend/` 是否合并？              | 模板分两层但本项目 skills 内容极少（仅 frontend/react 占位）；保留两层便于将来扩展（如 backend）      | **保留两层**，不合并；模板原结构即可                                                              |
| 2   | `docs/research/antd-4.19.1/` 整目录                                     | 整个目录对本项目不适用（antd 5）                                                                     | **整目录删除**（不是合并，是省略）                                                                 |
| 3   | `docs/specs/_template/pm-inputs/code-inventory.md`（模板未含，需新增）  | 模板流程要求每模块含 `as-is-architecture.md` + `code-inventory.md`，但 `_template/pm-inputs/` 只放了 `pm-requirements-input.md` | **新增** `pm-inputs/code-inventory.md` 占位文件到 `_template/`（与 pm-requirements-input.md 同级） |

**结论**：模板分层结构合理，本项目**无大规模合并需求**；仅新增 1 个 `code-inventory.md` 占位文件。

---

## 4. Q-104 本项目独有的目录 / 文件

### 4.1 新增目录建议

| #   | 建议目录                                                       | 定位                                                                                                       | 必要性    |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `docs/design/realtime-protocol/`                               | Socket.IO 实时数据通道契约（`@midwayjs/socketio` + `socket.io-client`，finding §2.4）；模板未涉及             | **高**（finding §2.4 已识别为本项目独有） |
| 2   | `docs/design/iframe-pages/`                                    | 第三方 iframe 嵌入清单（节假日保障 / 抗台防汛 / 全运会 / 高速 / 高铁 / 态势感知，finding §5.1 O-11）         | **高**（6+ 第三方依赖）                  |
| 3   | `docs/operations/`                                             | 部署 / 监控 / 故障排查；pm2 + koa-static-cache（finding §2.6）                                              | **中**（与 design 分开，避免 design 文件过多） |
| 4   | `docs/specs/_template/pm-inputs/code-inventory.md`             | as-is 阶段必备模板（模板流程要求）                                                                         | **高**（§3 合并项已识别）                |

### 4.2 新增文件建议

| #   | 建议文件                                                       | 内容                                                                                                       | 落地时机    |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | `docs/design/realtime-protocol/socket-events.md`                | 命名空间 / 事件清单 / payload 契约 / 重连策略                                                              | plan-003 阶段 2 整合 |
| 2   | `docs/design/iframe-pages/iframe-registry.md`                  | 第三方 iframe URL 清单 + 健康检查契约 + 失败回退                                                           | plan-003 阶段 2 整合 |
| 3   | `docs/operations/deployment.md`                                 | pm2 启动参数 / 端口（fePort 9032）/ 静态资源路径（`./build` + `./build/client` + `./public`）                | plan-002 步骤 6 占位 + plan-003 充实       |
| 4   | `docs/operations/troubleshooting.md`                            | 常见故障 + 日志位置 + BFF 启动失败排查                                                                     | plan-002 步骤 6 占位                       |
| 5   | `docs/specs/_template/pm-inputs/code-inventory.md`              | as-is 阶段：模块文件清单 + 类型清单 + mock 数据清单 + 接口清单 + 字典清单模板                                | plan-002 步骤 10 占位                      |

### 4.3 推荐策略

| 推荐               | 理由                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **plan-002 阶段**：建 `docs/design/realtime-protocol/` `docs/design/iframe-pages/` `docs/operations/` 三个空目录（含 README 占位）；新增 §4.2 中 5 个占位文件首行加 ⚠️「待 plan-003 整合」 | 让骨架完整、可被引用，但不写实体内容；符合 D-11「代码事实优先」（不在缺数据时臆造内容）|
| **plan-003 阶段**：填实 §4.2 中前 2 个文件（realtime + iframe）+ 各模块的 `code-inventory.md` | 业务模块 spec 阶段同步沉淀                                                                           |

---

## 5. 最小可行结构（最终落地清单）

### 5.1 目录树（plan-002 步骤 2 建好后）

```
docs/
├── index.md                                  [Q-101 #1  拷贝 + 锚点]
├── ai-prompts-guide.md                       [Q-101 #25 拷贝 + 锚点]
├── design/
│   ├── README.md                             [Q-101 #22 拷贝 + 锚点]
│   ├── tech-stack.md                         [重写：plan-002 步骤 4]
│   ├── system-overview.md                    [重写：plan-002 步骤 4]
│   ├── architecture.md                       [重写：plan-002 步骤 4]
│   ├── framework-communication.md            [决策：plan-002 步骤 5]
│   ├── data-models.md                        [占位：plan-002 步骤 5]
│   ├── api-contracts.md                      [占位：plan-002 步骤 5]
│   ├── glossary.md                           [占位：plan-002 步骤 5]
│   ├── decisions/
│   │   ├── README.md                         [Q-101 #23 拷贝 + 锚点]
│   │   └── adr-template.md                   [Q-101 #24 直接拷贝]
│   ├── assets/                               [空目录占位]
│   ├── realtime-protocol/                    [新增：plan-002 步骤 2]
│   │   └── README.md                         [占位]
│   └── iframe-pages/                         [新增：plan-002 步骤 2]
│       └── README.md                         [占位]
├── workflows/
│   ├── README.md                             [Q-101 #2  拷贝 + 锚点]
│   ├── as-is-to-be-guide.md                  [Q-101 #3  直接拷贝]
│   ├── brownfield-module-refactor.md         [Q-101 #4  直接拷贝]
│   └── tdd-process.md                        [Q-101 #5  直接拷贝]
├── standards/
│   ├── README.md                             [Q-101 #6  拷贝 + 锚点]
│   ├── coding-standards.md                   [Q-101 #7  拷贝 + 微调]
│   └── security-standards.md                 [Q-101 #8  直接拷贝]
├── skills/
│   ├── README.md                             [Q-101 #17 拷贝 + 锚点]
│   ├── common/
│   │   └── git-workflow.md                   [Q-101 #18 直接拷贝]
│   ├── frontend/
│   │   ├── README.md                         [Q-101 #26 拷贝 + 锚点]
│   │   └── react/
│   │       ├── coding.md                     [占位：plan-002 步骤 8]
│   │       └── testing.md                    [占位：plan-002 步骤 8]
│   └── ai-tools/
│       └── claude-cursor/
│           ├── README.md                     [Q-101 #19 拷贝 + 锚点]
│           └── prompts.md                    [Q-101 #20 直接拷贝]
├── research/
│   └── README.md                             [Q-101 #21 拷贝 + 锚点]
│                                                ⚠️ 不创建 antd-4.19.1/
├── operations/                               [新增：plan-002 步骤 2]
│   ├── README.md                             [新增占位]
│   ├── deployment.md                         [新增占位]
│   └── troubleshooting.md                    [新增占位]
└── specs/
    ├── index.md                              [拷贝骨架 + 清空示例：plan-002 步骤 10]
    ├── spec-split-guide.md                   [Q-101 #9  直接拷贝]
    └── _template/
        ├── spec.md                           [Q-101 #10 直接拷贝]
        ├── plan.md                           [Q-101 #11 直接拷贝]
        ├── tasks.md                          [Q-101 #12 直接拷贝]
        ├── acceptance-tests.md               [Q-101 #13 直接拷贝]
        ├── data-model-extensions.md          [Q-101 #14 直接拷贝]
        └── pm-inputs/
            ├── pm-requirements-input.md      [Q-101 #15 直接拷贝]
            ├── code-inventory.md             [新增占位：plan-002 步骤 10]
            └── assets/
                └── README.md                 [Q-101 #16 直接拷贝]
```

### 5.2 文件计数

| 类别       | 数量        | 备注                                                                |
| ---------- | ----------- | ------------------------------------------------------------------- |
| 直接拷贝   | 16          | Q-101 中标「直接拷贝」者                                            |
| 拷贝 + 锚点 | 10          | Q-101 中标「拷贝 + 锚点」者                                          |
| 拷贝 + 微调 | 1           | coding-standards.md                                                 |
| 重写       | 3           | tech-stack / system-overview / architecture（plan-002 步骤 4）      |
| 占位文件   | 9           | design 辅助 3 个 + skills/react 2 个 + operations 3 个 + code-inventory 1 个 |
| 决策后处理 | 1           | framework-communication.md（按 O-1 决策；plan-002 步骤 5）            |
| 拷贝骨架   | 1           | specs/index.md（清空模板示例）                                       |
| **合计**   | **41 个文件** + 3 个空目录（design/assets/、skills/frontend/、specs/_template/pm-inputs/assets/） |

> 与 finding §0 估算的「28 个文件」存在差异：finding 漏算了几类——README 占位（5 个）+ 设计三件套重写（3 个）+ 决策文件（2 个）+ 模板流程（4 个）。

---

## 6. 沉淀决策（追加 roadmap §2）

| 决策编号 | 决策内容                                                                                            | 来源 |
| -------- | --------------------------------------------------------------------------------------------------- | ---- |
| D-15     | docs/ 最小可行结构按 §5.1 目录树落地：必保留 16 直接拷贝 + 10 拷贝锚点 + 1 微调 + 3 重写 + 9 占位 + 1 决策 + 1 骨架 = 41 文件 + 3 空目录 | Stage B §5 |
| D-16     | 不创建 `docs/research/antd-4.19.1/`（本项目 antd 5）；不创建 `docs/design/api/*.json` YAPI 快照（本项目未做 YAPI） | Stage B §2 |
| D-17     | 不合并 `docs/skills/{common,frontend}` 两层（保留扩展性）；新增 3 个目录 `realtime-protocol/` / `iframe-pages/` / `operations/` | Stage B §3 + §4 |
| D-18     | 新增 `docs/specs/_template/pm-inputs/code-inventory.md`（模板流程要求补全）                          | Stage B §4.2 |

---

## 7. 完成定义（DoD）

- [x] Q-101 必保留 26 个文件清单（含理由）
- [x] Q-102 可省略 18 项清单（含原因 + 替代方案）
- [x] Q-103 合并决策：无大规模合并
- [x] Q-104 新增 3 目录 + 5 文件清单
- [x] 最小可行目录树（41 文件 + 3 空目录）
- [x] 沉淀决策 D-15 ~ D-18 待 roadmap §2 追加
- [x] 未动业务代码
- [x] 未引用 `.trae/` 与 `.local-docs/`（Rule 2）

---

## 8. 不在本文件范围内（OUT）

- ❌ 实际落 `/docs/`（属 plan-002 步骤 2–11）
- ❌ 写各文档正文（design / workflows / standards 等由 plan-002 步骤 3–11 负责）
- ❌ 业务模块 spec（属 plan-003）
- ❌ PM 输入文档（属 plan-001 Stage D）

---

## 9. 关联文档

| 文档                                                                                                          | 说明                                                |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`                                                                              | 整体路线图                                          |
| [`./2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) | 第一轮 finding（模板结构 §1.1 / 复用 §3.1 / 不适用 §3.3）|
| [`./2026-07-29-002-agents-md-content-plan.md`](./2026-07-29-002-agents-md-content-plan.md)                   | 上游 Stage A 结论（措辞影响 docs/ 表述）            |
| `.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-002-plan-docs-foundation.md`          | 下游：执行计划（按本结构落地）                      |
| `.trae/.local-docs/docs模板-yzf/docs`                                      | 模板 docs/ 全集（仅参考结构）                       |