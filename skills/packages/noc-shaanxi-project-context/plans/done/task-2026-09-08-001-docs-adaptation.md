# Task 2026-09-08-001 · docs/ 目录整体改造（适配 oss-noc-shaanxi）

| 字段          | 值                                          |
| ------------- | ------------------------------------------- |
| 状态          | 待审批                                      |
| 类型          | 文档改造（涉及 `docs/` 写操作，走审批流程） |
| 创建日期      | 2026-09-08                                  |
| 目标目录      | `docs/`（仓库根，进公司 git）               |
| 前置 research | 已完成（见下「调研结论」）                  |

---

## 一、背景与动机

`docs/` 当前内容是从另一个项目——「陕西黄金可视化管理平台（数字孪生 / 金牌楼宇）」整套复制过来的 SDD（规格驱动开发）文档框架。框架与方法论骨架（workflows、standards、skills 骨架、模板类 design 文档）可复用，但所有承载业务内容的文档均与本项目不符：

- **产品定位不符**：文档写的是「黄金可视化管理平台 / 要客资源可视化」；本项目是陕西移动 NOC 大屏（多块业务大屏；日常开发在 develop 完整分支，故障中心能力 cherry-pick 到 develop-cmcc-fault-center 分支）。
- **技术栈不符**：文档写 MongoDB + TypeORM + Cesium + AntD Pro + valtio store + 端口 3007；本项目实际是 midway 3 + React 18 + fedx 大屏框架（fedx-ssr / fedx-gis / echarts / echarts-gl / three / d3）+ antd 5.22.5（resolutions）+ 国产数据库适配 + 端口 9902。
- **路径/路由不符**：文档全部指向 `web/pages/gold-building/`、`src/modules/goldBuilding/`、`/gold-building` 路由；本项目实际是 `web/pages/` 下 14 个大屏页面目录、`src/modules/noc/`（故障中心部署前缀 `/emergency-support` 仅适用于 develop-cmcc-fault-center 分支）。
- **组件不符**：文档围绕 `web/components/earth/`（Cesium 三维地球）展开；本项目通用组件是 large-screen / layout / ui 等。
- **skills/backend/python** 与本项目 Node.js midway 后端完全无关。
- **内部矛盾与死链**：`specs/_template/`、`000-components/001-earth/README.md`、`001-earth/as-is.md` 被引用但不存在；security-standards 的「默认 deny」与 as-is 的「公开系统」自相矛盾；specs 编号规则（README 说业务从 003 起）与实际登记（001-gold-building）不一致。

**目标**：把 `docs/` 全量重写为适合 oss-noc-shaanxi 的 SDD 文档体系，当作新项目从零建设。填不了真实内容的，改为干净的待填模板（不残留金牌楼宇项目的任何业务信息）。

## 二、调研结论（docs 现状盘点）

### 2.1 可复用的骨架（保留结构、重写内容或保留方法论）

| 分区                                                             | 处置                                            |
| ---------------------------------------------------------------- | ----------------------------------------------- |
| `docs/index.md`                                                  | 结构可复用，重写为本项目入口                    |
| `docs/workflows/`（sdd-process.md / tdd-process.md / README.md） | 方法论文档，基本通用，微调引用后保留            |
| `docs/standards/`（coding / security / README）                  | 骨架可复用，security 需按本项目实际鉴权情况重写 |
| `docs/skills/` 骨架（common / frontend-react / ai-tools）        | 保留，frontend 按 fedx 大屏栈重写               |
| `docs/design/decisions/`（README + adr-template）                | 通用模板，直接保留                              |
| `docs/design/glossary.md`                                        | 保留方法论术语，业务术语按 NOC 域填写           |
| `docs/specs/` 目录结构与 README/index                            | 结构可复用，编号规则修正后保留                  |

### 2.2 需全量重写的内容（承载业务/技术事实）

| 文档                        | 重写要点                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `as-is/README.md`           | 产品名改为 oss-noc-shaanxi（陕西移动 NOC 大屏），盘点范围 `src/`、`web/`，盘点截止日期改为执行日                                                                                                                                                                                                                                                                   |
| `as-is/stack.md`            | 按 package.json 实际版本重写：midway 3.x、React 18、antd 5.22.5、fedx 大屏框架、echarts/echarts-gl、fedx-gis、three、d3、pnpm workspace（remote-browser-control-ext）；端口 9902；国产数据库适配现状                                                                                                                                                               |
| `as-is/routes-menus.md`     | 重写为实际路由：**仅 6 个在用页面**（management-overview-first、management-overview-first-gis、management-overview-second、great-tang-all-day-mall、remote-control-browser、scene-fusion-manage）；`src/controller/index.ts` 中其余路由（anhui 系列、flood-prevention-screen、emergency-support、large-screen-controller/demo 等）标注为废弃历史页面，不在维护范围 |
| `as-is/data-models.md`      | 按 `src/modules/noc/`（controller/dto/service/mappers）实际盘点重写                                                                                                                                                                                                                                                                                                |
| `as-is/api.md`              | 以 `backend-api-docs/陕西NOC场景接口文档.md` 和 `src/` controller 实现为准重写                                                                                                                                                                                                                                                                                     |
| `as-is/auth-rbac.md`        | 按本仓实际鉴权情况重写（需读 src/config 与 controller 确认，未确认前保留为待填模板）                                                                                                                                                                                                                                                                               |
| `as-is/known-debt.md`       | 按本项目已知债务重写（.jsx 历史文件、国产数据库版本固定、双分支 cherry-pick 流程等）                                                                                                                                                                                                                                                                               |
| `design/system-overview.md` | 重写为 NOC 大屏系统概览与信息架构                                                                                                                                                                                                                                                                                                                                  |
| `design/tech-stack.md`      | 重写为本项目目标技术栈与目录结构                                                                                                                                                                                                                                                                                                                                   |
| `design/architecture.md`    | 重写 NFR / 持久化策略（国产数据库适配）/ Non-goals                                                                                                                                                                                                                                                                                                                 |
| `design/routes-business.md` | 重写为 6 个在用页面的业务路由表（含各自业务域说明）；其余页面明确标注为废弃不在维护范围                                                                                                                                                                                                                                                                            |
| `design/data-models.md`     | 按国产数据库适配实际口径重写                                                                                                                                                                                                                                                                                                                                       |
| `design/api-contracts.md`   | 按 NOC 接口重写端点索引                                                                                                                                                                                                                                                                                                                                            |
| `skills/frontend/react/*`   | 按 fedx 大屏 + React 18 实际习惯重写                                                                                                                                                                                                                                                                                                                               |
| `skills/backend/python/*`   | **保留原样不动**（用户确认不处理）                                                                                                                                                                                                                                                                                                                                 |
| `docs/specs/` 业务 spec     | **保留一个示例，其余删除**（见 2.3）                                                                                                                                                                                                                                                                                                                               |

### 2.3 specs/ 处置（用户已确认）

- **保留**：`specs/001-gold-building/` 整套（7 个文件 + pm-inputs/assets 5 张图）作为「五件套 + pm-inputs」的**示例**保留原样，仅在其 README 或文件头加注「示例文档，来自源项目，内容与本项目无关」。
- **删除**：`specs/000-components/` 整个目录（6 个文件，earth 组件属金牌楼宇项目，本仓不存在 `web/components/earth/`）。
- **修正**：`specs/README.md` 与 `specs/index.md` 重写——编号规则与登记内容一致化；补充或移除对 `specs/_template/` 的引用（模板目录缺失，选择：a) 新建模板目录，b) 移除引用——建议 a，与 sdd-process 白名单闭环）。

## 三、改造方案

### 3.1 总原则

1. **当新项目从零建设**：不迁移金牌楼宇项目任何业务信息；能填真实内容的填本项目事实，填不了的写干净的待填模板（含「填写指引」占位说明）。
2. **事实必须来自源码调研**：重写 as-is/design 各文档时，逐项以 package.json、src/、web/、backend-api-docs/ 实际内容为准，禁止沿用文档旧值。反幻觉守则适用：写之前 Read，写不了就标待填。
3. **框架结构保持不变**：六层结构（index → as-is → design → specs → workflows/standards → skills）与冲突权威顺序沿用。
4. **所有文档遵守仓库链接规范**：仓库相对路径纯文本，禁止 file:/// / 绝对路径 / 相对 markdown 链接；禁止引用 `noc-shaanxi-project-context` 任何内容（docs/ 与 skill 隔离规则）。

### 3.2 分阶段执行计划

#### M1 · 清理与骨架修正（低风险）

1. 删除 `docs/specs/000-components/` 整目录。
2. `specs/001-gold-building/` 文件头加「示例文档」声明（最小改动，不改内容）。
3. 重写 `docs/specs/README.md`、`docs/specs/index.md`：编号规则一致化（建议：000 框架 / 1xx 业务 / 2xx 组件 或简化为 001 起顺序编号，执行时定）；新建 `specs/_template/`（五件套 + as-is 模板，从 workflows/sdd-process.md 白名单反推结构）。
4. 重写 `docs/index.md` 为本项目入口（产品定位、六分区索引、阅读顺序）。

#### M2 · as-is/ 全量重写（需源码调研）

逐文件重写，事实来源：

| 文档                    | 事实来源                                                                        |
| ----------------------- | ------------------------------------------------------------------------------- |
| `as-is/README.md`       | AGENTS.md + 本 task 调研结论                                                    |
| `as-is/stack.md`        | package.json、pnpm-workspace.yaml、src/configuration.ts、config.default.ts      |
| `as-is/routes-menus.md` | src/controller/（api.ts / index.ts）、web/pages/ 目录遍历                       |
| `as-is/data-models.md`  | src/modules/noc/ 的 dto / service / mappers                                     |
| `as-is/api.md`          | backend-api-docs/陕西NOC场景接口文档.md + src/modules/noc/controller            |
| `as-is/auth-rbac.md`    | src/config/ 鉴权配置、controller 中间件（若证据不足 → 待填模板）                |
| `as-is/known-debt.md`   | AGENTS.md 已知债务（.jsx 历史文件、国产 DB 版本固定、双分支流程）+ 代码调研补充 |

#### M3 · design/ 全量重写（to-be 定义）

| 文档                        | 处置                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `design/README.md`          | 索引更新                                                                                                      |
| `design/system-overview.md` | 重写为 NOC 大屏系统概览                                                                                       |
| `design/tech-stack.md`      | 重写为本项目目标栈与目录结构                                                                                  |
| `design/architecture.md`    | 重写 NFR / 国产数据库持久化策略 / Non-goals（含分支策略：develop → cherry-pick 至 develop-cmcc-fault-center） |
| `design/routes-business.md` | 6 个在用页面路由表，其余标注废弃                                                                              |
| `design/data-models.md`     | 按国产数据库适配实际口径重写（可引用其设计结论但**不得链接 skill 文档**，需转述进 docs）                      |
| `design/api-contracts.md`   | NOC 接口契约索引                                                                                              |
| `design/glossary.md`        | 保留方法论术语 + 填写 NOC 业务术语（大屏、GIS、故障中心等）                                                   |
| `design/decisions/`         | 保留模板，可选登记第一条 ADR（如「docs 框架选型 SDD」）                                                       |

#### M4 · skills / standards / workflows 适配

| 文档                              | 处置                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `skills/README.md`                | 索引更新（去 python，加 node-midway）                                                                     |
| `skills/common/*`                 | 微调（基本通用）                                                                                          |
| `skills/frontend/react/*`         | 按本项目实际重写：fedx 大屏组件模式、render.tsx 入口、modules 拆分、less module、fields.ts/screen.ts 约定 |
| `skills/backend/python/*`         | **保留原样不动**（用户确认不处理）                                                                        |
| `skills/ai-tools/claude-cursor/*` | 基本通用，更新文档引用路径                                                                                |
| `standards/coding-standards.md`   | 微调（加 pnpm / lint 命令约定）                                                                           |
| `standards/security-standards.md` | 按本项目实际鉴权重写，消除「默认 deny vs 公开系统」矛盾                                                   |
| `workflows/sdd-process.md`        | 修正 `_template/` 引用、编号规则对齐                                                                      |
| `workflows/tdd-process.md`        | 基本保留                                                                                                  |

### 3.3 明确不做（Non-goals）

- 不改任何源码（src/、web/、public/）。
- 不动 `backend-api-docs/`（其为本仓接口事实来源，只读）。
- 不为任何大屏页面（emergency-support 等）补写业务 spec（那是后续独立任务，本任务只搭框架 + 示例）。
- 不在本 task 内做 git 提交（执行后统一提交，或按用户指示）。

## 四、交付物清单

改造后 `docs/` 预期结构：

```
docs/
├── index.md                          # 重写：本项目入口
├── as-is/                            # M2 全量重写（7 文件）
├── design/                           # M3 全量重写（含 decisions 模板保留）
├── specs/
│   ├── README.md / index.md          # 重写
│   ├── _template/                    # 新建：五件套模板
│   └── 001-gold-building/            # 保留（加示例声明）
├── workflows/                        # M4 微调
├── standards/                        # M4 微调/重写 security
└── skills/                           # M4：react 重写（backend/python 保留原样）
```

## 五、验收标准

1. `docs/` 内 grep 不到以下金牌楼宇残留：`gold-building`、`goldBuilding`、`要客`、`金牌楼宇`、`黄金可视化`、`MongoDB`（as-is/design 正文中）、`Cesium`、`3007`（specs/001-gold-building 示例目录内除外，需有示例声明覆盖）。
2. 所有内部引用无死链（`_template/`、`001-earth/README.md` 等 dangling 引用全部消除）。
3. 所有引用格式符合仓库链接规范（仓库相对路径纯文本）。
4. `docs/` 不引用 `noc-shaanxi-project-context` 任何路径。
5. 每个待填模板文档含明确「填写指引」，不含源项目业务信息。
6. `pnpm run lint` 不受影响（纯文档改动）。

## 六、风险与依赖

| 风险                                                                    | 缓解                                                                                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| as-is 重写需大量源码调研（接口、数据模型、鉴权）                        | 逐文件以 Read/Grep 取证；证据不足处标待填，不编造                                                                      |
| 国产数据库适配结论在 skill 中，docs 不能引用                            | 转述进 design/data-models.md，不链接 skill                                                                             |
| 团队其他成员对 docs/ 有依赖                                             | 走 git 提交留痕；删除 000-components 前在审批时确认                                                                    |
| **docs/ 当前为 git 未跟踪（untracked）状态，删除操作无 git 历史可恢复** | M1 删除 `specs/000-components/` 等操作前，先做一次 git 提交将现有 docs/ 原样入库留底（或用户确认无需留底），再执行删除 |

## 七、审批记录

| 日期       | 事项                 | 结论   |
| ---------- | -------------------- | ------ |
| 2026-09-08 | 任务创建，待用户审批 | 待审批 |
| 2026-09-08 | 用户批准，开始执行   | 已批准 |
| 2026-09-08 | M1-M4 全部完成，验收 grep / 死链 / 链接规范检查通过 | 已完成 |
