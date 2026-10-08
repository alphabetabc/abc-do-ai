# Finding：docs 模板结构与本项目适配分析（第一轮 research）

> **日期**：2026-07-29
> **作者**：TRAE Agent（research 阶段）
> **目的**：为「应急保障可视化大屏」项目初始化 `docs/` 目录与根 `AGENTS.md` 提供事实依据与适配结论
> **范围**：仅做模板结构研究 + 项目现状摸排 + 差异分析；不写最终 docs 内容
> **关联文件**：
> - 路线图：`.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`
> - 下一步计划：`.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-001-plan-next-research-step.md`
> - 已归档参考：`.trae/skills/oss-vis-gd-project-context/plans/done/2026-07-29-002-docs-init-research-output.md`

---

## 0. TL;DR（结论先行）

| 维度                          | 结论                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| 模板来源                      | `.local-docs/docs模板-yzf/`（OSS 告警监控-联通系统 Brownfield 模板）                  |
| 模板适用阶段                  | **Brownfield 存量改造**（As-Is → To-Be → 按切片重构）                                  |
| 本项目类型                    | **典型 Brownfield**：存量大屏项目（midway + fedx-ssr + React 18），无 docs 文档化      |
| docs/ 初始化策略              | **拷贝模板结构 → 重写 design 三件套 → 按业务模块建 specs/**                          |
| AGENTS.md 初始化策略          | **拷贝模板根 → 替换占位符**（项目定位、模块根路径、技术栈相关条款）                  |
| 当前阶段（参考 Brownfield）   | **阶段 0**：仅在 `.trae/documents/` 落 research 与 plan，不动业务代码、不落 `docs/`    |
| 关键风险                      | React 18 + antd 5 + fedx-ssr 是模板未覆盖的新栈；部分 design 章节需重新组织           |
| 下一步                        | 启动 `.trae/plans/2026-07-29-001-plan-next-research-step.md`，进入第二轮深度研究 |

---

## 1. 模板深度分析（目标态 As-Of-Template）

### 1.1 模板根结构

```
docs模板-yzf/
├── AGENTS.md              # 项目级 Agent 宪法（强制入口）
├── README.md              # （未读取，但通常作为模板说明）
└── docs/
    ├── index.md                                # 文档总站（导航）
    ├── ai-prompts-guide.md                     # 迁移全流程分步提示词
    ├── design/                                 # 顶层设计（SSOT）
    │   ├── README.md
    │   ├── tech-stack.md                       # ★ 必填第一篇
    │   ├── system-overview.md                  # IA / 路由 / 壳层
    │   ├── architecture.md                     # 分层 / 模块边界 / NFR
    │   ├── framework-communication.md          # 主-子应用通信契约
    │   ├── data-models.md                      # 全局实体
    │   ├── api-contracts.md                    # HTTP 契约索引（详细在 api/*.json）
    │   ├── glossary.md                         # 术语表
    │   ├── decisions/                          # ADR 目录
    │   ├── assets/                             # 文档配图
    │   └── api/                                # YAPI 导出快照
    │       ├── fault-report.json
    │       ├── work-sheet.json
    │       └── duty-schedule.json
    ├── specs/                                  # 特性规格
    │   ├── index.md                            # specs 索引表
    │   ├── spec-split-guide.md                 # 复杂模块拆分指南
    │   ├── _template/                          # 五件套模板
    │   │   ├── spec.md
    │   │   ├── plan.md
    │   │   ├── tasks.md
    │   │   ├── acceptance-tests.md
    │   │   ├── data-model-extensions.md
    │   │   └── pm-inputs/
    │   │       ├── pm-requirements-input.md
    │   │       └── assets/README.md
    │   ├── fault-report/                       # 存量示例（伞形+子spec）
    │   ├── troubleshooting-workbench/          # 伞形
    │   ├── troubleshooting-workbench-group/    # 子
    │   ├── troubleshooting-workbench-province/ # 子
    │   ├── troubleshooting-workbench-other/    # 子
    │   ├── troubleshooting-workbench-bmap/     # 子
    │   ├── team-claw/
    │   └── change-shifts-page/
    ├── skills/                                 # 工程习惯
    │   ├── README.md
    │   ├── common/git-workflow.md
    │   ├── frontend/README.md
    │   ├── frontend/react/{coding,testing}.md
    │   └── ai-tools/claude-cursor/prompts.md
    ├── workflows/                              # 工作流程
    │   ├── README.md
    │   ├── as-is-to-be-guide.md                # ★ 核心：As-Is → To-Be 模式
    │   ├── brownfield-module-refactor.md       # ★ 核心：阶段步骤
    │   └── tdd-process.md
    ├── standards/                              # 项目级规范
    │   ├── README.md
    │   ├── coding-standards.md
    │   └── security-standards.md
    └── research/                               # 调研备忘
        ├── README.md
        └── antd-4.19.1/                        # antd 4 组件参考
            ├── README.md
            ├── quick-reference.md
            ├── USAGE.md
            └── components/
```

### 1.2 各文档的强制 / 选填属性

| 文档                                | 强制 | 何时填写                                  | 来源                                                                                |
| ----------------------------------- | ---- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `AGENTS.md`                         | ★    | **拷贝模板后立即替换占位符**              | `.local-docs/docs模板-yzf/AGENTS.md`                      |
| `docs/index.md`                     | ★    | 拷贝即用（路径锚点会自动匹配）            | `.local-docs/docs模板-yzf/docs/index.md`              |
| `docs/design/tech-stack.md`         | ★    | **拷贝后第一时间**                        | `.local-docs/docs模板-yzf/docs/design/tech-stack.md`  |
| `docs/design/system-overview.md`    | ★    | 梳理 IA / 路由 / 壳层时                   | `.local-docs/docs模板-yzf/docs/design/system-overview.md` |
| `docs/design/architecture.md`       | ★    | 分层、目录、与全局关系                     | `.local-docs/docs模板-yzf/docs/design/architecture.md` |
| `docs/design/framework-communication.md` | ○ | 若为微前端子应用                          | `.local-docs/docs模板-yzf/docs/design/framework-communication.md` |
| `docs/design/data-models.md`        | ★    | 实体定稿后                                | `.local-docs/docs模板-yzf/docs/design/data-models.md` |
| `docs/design/api-contracts.md`      | ★    | 接口形状确认后                            | `.local-docs/docs模板-yzf/docs/design/api-contracts.md` |
| `docs/design/glossary.md`           | ★    | 术语首次出现时                            | `.local-docs/docs模板-yzf/docs/design/glossary.md`     |
| `docs/design/decisions/ADR-NNN.md`  | ○    | 重大架构决策时                            | `.local-docs/docs模板-yzf/docs/design/decisions/adr-template.md` |
| `docs/specs/_template/`             | ★    | 拷贝即用                                  | 五件套模板                                                                          |
| `docs/specs/<slug>/`                | ★    | 每个业务模块一个                          | 至少 spec / plan / tasks / acceptance-tests / data-model-extensions               |
| `docs/specs/<slug>/as-is-architecture.md` | ○ | Brownfield 存量模块需要                  | `.local-docs/docs模板-yzf/docs/specs/fault-report/as-is-architecture.md` |
| `docs/workflows/as-is-to-be-guide.md` | ★  | 拷贝即用（流程核心文档）                 | `.local-docs/docs模板-yzf/docs/workflows/as-is-to-be-guide.md` |
| `docs/workflows/brownfield-module-refactor.md` | ★  | 拷贝即用（阶段步骤）                | `.local-docs/docs模板-yzf/docs/workflows/brownfield-module-refactor.md` |
| `docs/workflows/tdd-process.md`     | ★    | 拷贝即用                                  | `.local-docs/docs模板-yzf/docs/workflows/tdd-process.md` |
| `docs/standards/coding-standards.md` | ★    | 拷贝即用（按本项目栈微调）                | `.local-docs/docs模板-yzf/docs/standards/coding-standards.md` |
| `docs/standards/security-standards.md` | ★    | 拷贝即用                                  | `.local-docs/docs模板-yzf/docs/standards/security-standards.md` |
| `docs/skills/frontend/react/coding.md` | ★    | 按本项目栈重写                            | `.local-docs/docs模板-yzf/docs/skills/frontend/react/coding.md` |
| `docs/skills/frontend/react/testing.md` | ★    | 按本项目栈重写                            | `.local-docs/docs模板-yzf/docs/skills/frontend/react/testing.md` |
| `docs/ai-prompts-guide.md`          | ★    | 拷贝即用                                  | `.local-docs/docs模板-yzf/docs/ai-prompts-guide.md` |
| `docs/research/<topic>/`            | ○    | 调研某框架/库时                           | `.local-docs/docs模板-yzf/docs/research/antd-4.19.1`  |

### 1.3 模板的「权威性顺序」与「硬约束」

> 来源：`.local-docs/docs模板-yzf/AGENTS.md` 第 17-51 行

**冲突优先级（自上而下）**：

1. `docs/specs/{模块}/spec.md` + `acceptance-tests.md`（目标行为）
2. `docs/design/api-contracts.md` + `data-models.md`
3. `docs/specs/{模块}/as-is-architecture.md`（现状）
4. `docs/specs/{模块}/pm-inputs/pm-requirements-input.md`（业务语言）
5. `docs/design/tech-stack.md`、`architecture.md`
6. `docs/skills/` 下与所选栈匹配的 `coding.md` / `testing.md`

**硬约束（必须遵守）**：

- **阶段 1–3**：只写 `docs/`，不改业务代码
- 未在 `plan.md` 登记的切片，不做结构性重构
- API 字段以 `api-contracts.md`、OpenAPI 或代码已有类型为准；未知标「待确认」
- 状态机、权限、字典规则先写入 `spec.md` 再改代码
- 新模块复制 `docs/specs/_template/` 或参照 `fault-report/`，在 `specs/index.md` 登记

**禁止事项**：

- 编造未在契约或类型中出现的 API 路径与响应字段
- 顺带重构无关模块、未登记依赖的「顺手」升级
- 跳过 `as-is-architecture.md` 直接大规模改数据流或目录
- 使用 `docs-new/` 等非 `docs/` 路径作为规格正文

### 1.4 模板的 Brownfield 阶段模型

> 来源：`.local-docs/docs模板-yzf/docs/workflows/brownfield-module-refactor.md` §2

| 阶段     | 执行者  | 产出                                                    | 改代码？ |
| ------- | ------- | ------------------------------------------------------- | -------- |
| 0 准备  | 人      | pm-input §A/B、tech-stack、code-inventory §A/B          | 否       |
| 1 As-Is | AI 只读 | `as-is-architecture.md`、`code-inventory`               | 否       |
| — 评审  | 人      | §9/§10；可选 `.trae/documents/specs/spec-split-guide.md` | 否       |
| 2 To-Be | AI      | 五件套（**含 plan/tasks**）                             | 否       |
| — 评审  | 人      | spec §8/§10                                             | 否       |
| 4 重构  | AI / 人 | R1–R5 + 勾选 tasks                                      | **是**   |

**默认重构切片**：

| 切片 | 内容                                          |
| ---- | --------------------------------------------- |
| R1   | 类型/枚举与 data-model 对齐，**无行为变更**   |
| R2   | API 封装收敛                                  |
| R3   | 状态机显式化                                  |
| R4   | 组件拆分                                      |
| R5   | 边界与错误处理                                |

**MR 约定**：

- 阶段 1–2：MR 仅 `docs/`
- 阶段 4 切片：代码 + 更新 `tasks.md`；行为变更更新 `spec.md` / `design/`

### 1.5 模板的 As-Is / To-Be 双态文档

> 来源：`.local-docs/docs模板-yzf/docs/workflows/as-is-to-be-guide.md`

| 态       | 文档                                             | 何时冻结        |
| -------- | ------------------------------------------------ | --------------- |
| **As-Is** | `as-is-architecture.md`、`code-inventory.md`     | 阶段 1 评审后   |
| **To-Be** | 五件套（`spec.md` 等）                           | 阶段 2–3 评审后 |
| **Gap**   | `spec.md` §8                                     | 阶段 2 产出，阶段 4 前关闭 |

**复杂模块拆分（伞形 + 子 spec）**：

```
docs/specs/
├── <slug>/                 # 伞形目录（保留原名）
│   ├── capability-map.md   # 子 spec 索引
│   ├── as-is-architecture.md
│   ├── pm-inputs/
│   └── spec.md             # 总览 + §9 子 spec 索引
└── <slug>-<子能力>/        # 每个子能力复制 _template/
```

模板示例：troubleshooting-workbench（伞形）→ troubleshooting-workbench-{group,province,other,bmap}（4 个子 spec）。

---

## 2. 当前项目现状摸排（As-Is-Of-Project）

### 2.1 项目定位

| 项         | 值                                                                          |
| ---------- | --------------------------------------------------------------------------- |
| 项目名     | `oss-visual-gd-emergency-support`                                           |
| 中文名     | **广东移动_应急保障可视化大屏**（来自 `README.md`）|
| 类型       | **SSR + 大屏可视化**（midway + fedx-ssr）                                  |
| 业务领域   | 通信运营商应急保障（广东移动，重大事件/台风/全运会/节假日通信保障）       |
| 主要场景   | 应急大屏 + 五大中心 + 信管局视图 + GIS 大屏                                |
| 路由前缀   | `/gd-emergency-support`、`/five-major-center`、`/info-management-bureau`、`/gis-entry`、`/large-screen-demo`（来自 `src/controller/index.ts`）|

### 2.2 技术栈（与模板对比）

| 维度           | 模板项目（OSS 联通）                            | 本项目（GD 应急保障）                          | 差异点                                                                                  |
| -------------- | ----------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| 后端 / BFF     | Webpack 4 + 纯前端                              | **midway 3 + koa + fedx-bff-web/ssr**         | 本项目是**全栈同构**，BFF 层独立于前端代码                                            |
| 前端框架       | React 16.13.1                                   | **React 18.1.0**                              | React 18 新特性（并发、自动批处理）需要 coding.md 单独说明                              |
| UI 组件库      | oss-ui 1.0.7-beta（基于 antd **4.19.1**）        | **antd 5.26.7** + ProComponents 2.3.50       | antd 4 → antd 5 是破坏性升级；模板的 research/antd-4.19.1/ 不适用本项目                 |
| 移动端 UI      | antd-mobile 5.10.2                              | （未使用）                                    | 本项目是桌面端大屏，不需要移动端适配                                                    |
| 状态管理       | Hox 1.1.2（主力）+ Redux 仅路由                 | **valtio 1.11.2** + React Hooks               | 主力状态管理换库                                                                        |
| 路由           | React Router 5.2.0                              | **React Router DOM 5.2.0**                    | 同版本                                                                                  |
| HTTP           | axios + oss-web-common/createWebRequest         | **@midwayjs/axios** + axios + fedx-bff        | BFF 层封装                                                                              |
| 公共组件库     | oss-web-common 0.2.39                          | **@fedx-web-common/react-hooks/utils**        | 内部组件库换源                                                                          |
| 构建           | Webpack 4 + 自定义配置                          | **fedx-ssr 0.5.0** + @fedx-bff-web/*         | 构建工具换源（fedx-ssr 内含 webpack，但已封装）                                        |
| 包管理器       | npm（需 `--legacy-peer-deps`）                  | **pnpm**（`pnpm-lock.yaml` 存在）             | pnpm                                                                                    |
| TypeScript     | TS 4.2.3                                        | **TS 4.0+**                                   | 同主版本                                                                                |
| 可视化         | （未涉及）                                      | **echarts 5.6 + echarts-gl 2.0 + fedx-3d-renderer + fedx-vis/react-echarts** | 本项目为大屏可视化重头                         |
| GIS            | （未涉及）                                      | **fedx-gis 1.6.9 + EMap v2**                  | GIS 大屏地图是本项目核心能力                                                            |
| 实时数据       | （未涉及）                                      | **@midwayjs/socketio + socket.io-client**     | 大屏需要实时数据                                                                        |
| 部署           | pm2 + 静态服务                                  | **pm2 + koa-static-cache**                    | 类似                                                                                    |
| 微前端         | qiankun 子应用                                   | **未发现 qiankun 相关依赖**（需进一步确认）   | 本项目未必走微前端                                                                     |

### 2.3 业务模块识别（基于 mock 数据 + screen-config + 路由）

#### 2.3.1 路由层（来自 `src/controller/index.ts`）

| 路由前缀                          | 推测模块名         | 备注                                 |
| --------------------------------- | ------------------ | ------------------------------------ |
| `/large-screen-demo`              | 大屏演示           | demo                                  |
| `/gd-emergency-support`           | 应急保障大屏       | 核心模块                              |
| `/gis-entry`                      | GIS 入口           | GIS 大屏地图                          |
| `/five-major-center`              | 五大中心           | 多个子视图                            |
| `/five-major-center/:subpath`     | 五大中心子页       | 动态子路由                            |
| `/info-management-bureau`         | 信管局视图         | 开闭幕式 / 比赛日 / 首页              |

#### 2.3.2 应急保障大屏模块（来自 `public/environment.json` `gd-emergency-support.modules`）

| 模块 key                | 中文名       | 备注                                           |
| ----------------------- | ------------ | ---------------------------------------------- |
| `ensure-progress`       | 保障进展     | 保障进度跟踪                                   |
| `security-mission`      | 保障任务     | 保障任务清单                                   |
| `duty-table`            | 值班表       | 值班人员信息                                   |
| `early-warning-perception` | 预警感知  | 气象预警 / 水情预警                            |
| `emergency-resources`   | 应急资源     | 应急物资 / 抢修队伍                            |
| `network-conditions`    | 网络情况     | 故障情况                                       |
| `damage-to-towns`       | 乡镇受损     | 乡镇级网络受损                                 |

> **建议 slug**：`emergency-support-dashboard`（应急保障大屏）

#### 2.3.3 五大中心（来自 `environment.json.five-major-center`）

| 子中心 key                       | 中文名       | 备注                                  |
| -------------------------------- | ------------ | ------------------------------------- |
| `cmd-dispatcher-center`          | 指挥调度中心 | 大屏 + 节假日 + 抗台防汛保障 iframe   |
| `comprehensive-display-center`   | 综合展示中心 | 综合展示 + 全运 + 高速 + 高铁          |
| `iframe-page.situation-awareness-center` | 态势感知中心 | 第三方 iframe          |
| `info-management-bureau`         | 信管局视图   | 开闭幕式 / 比赛日 / 首页 / 倒计时      |

> **建议 slug**：`five-major-center`

#### 2.3.4 应急保障 NE 类型（来自 `environment.json.emergencySupportNeTypes`）

| 分类        | NE 类型示例                                                           |
| ----------- | --------------------------------------------------------------------- |
| 故障情况    | 2G/4G/5G 基站、物理站、超级基站、一镇四站、停电站点、机房停电、干线中断 |
| 应急物资    | 应急发电车、应急通信车、无人机基站、移动油机、卫星便携包、应急仓、冲锋舟、应急微波、卫星电话 |
| 抢修队伍    | 无线队伍、传输队伍、集客队伍、动力队伍、家宽队伍                      |
| 台风预报    | 中国、日本、美国、韩国、中国香港、中国台湾                          |
| 台风等级    | 热带低压 → 超强台风（6 级）                                          |
| 物资调度    | 物资轨迹                                                              |

#### 2.3.5 GIS 与地图能力（来自 `environment.json.GisConfig` / `EMapConfig`）

- **EMap v2** GIS 大屏地图（fedx-gis 1.6.9 + fedx-bff-web/ssr）
- **GisConfig** 备用底图（bigemap）
- **广东 21 个地市 GeoJSON**（440100 ~ 445300 + 442000 + 442100）
- **广东省乡镇 GeoJSON**（townJson/ 目录）
- **应急图例**：暴雨 / 台风 / 雷雨大风 / 冰雹 / 市级响应 / 洪水 / 雨量

### 2.4 服务端能力（BFF）

| 文件                                  | 作用                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| `src/configuration.ts` | Midway IoC 容器装配：koa/validate/axios/task/upload/http-proxy/socketio/core |
| `src/controller/index.ts` | SSR 渲染入口（@fedx-bff-web/ssr-core.render）                |
| `src/controller/api.ts` | API 代理：`/api/index`、`/api/detail/:id`                   |
| `src/service/index.ts` | ApiIndexService（从 mock 读取）                              |
| `src/service/detail.ts` | ApiDetailService（从 mock 读取）                             |
| `src/interface/index.ts` | 类型定义（IndexData）                                       |
| `src/interface/detail.ts` | 类型定义（DetailData）                                       |
| `src/modules/common/controller/static-file.ts` | 静态文件服务                                                |
| `src/socket/Socket.ts` | Socket.IO 实时数据通道                                       |
| `src/mock/index.ts` | Mock 数据源（IndexData）                                     |
| `src/mock/detail.ts` | Mock 数据源（DetailData）                                    |
| `docs-api-backend/右屏网络情况接口.md` | 后端接口契约（手写，非 YAPI 导出）                           |
| `docs-api-backend/摄像头` | 摄像头相关接口（camera-list.ts / camera-video.ts）            |

> 注意：当前 BFF 仅 2 个端点（`/api/index`、`/api/detail/:id`），其他 mock 数据通过 `public/static/mock/` 下的 JSON 文件提供。

### 2.5 现有文档情况

| 路径                                          | 类型     | 评价                                                                       |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `README.md`                                   | 项目根   | 极简，仅 1 行                                                              |
| `README.Dev.md`                               | 项目根   | 仅 3 行 npm 脚本说明                                                       |
| `docs-api-backend/`                           | 后端契约 | 散落 TS 文件 + 1 个手写 MD，非结构化                                       |
| `public/static/doc/指挥调度中心跳转.md`       | 散落     | 单点说明                                                                   |
| **无 docs/ 目录**                             | ❌       | **缺失主文档集**（本次任务目标）                                          |
| **无 AGENTS.md**                              | ❌       | **缺失 Agent 入口**（本次任务目标）                                       |
| **无 specs/、无 design/**                     | ❌       | 设计层 / 规格层缺失                                                        |

### 2.6 关键技术决策（基于 package.json + screen-config）

| 决策点                       | 选择                                                                  | 来源                                                              |
| ---------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 渲染模式                     | **CSR**（`config.ts` 中 `mode: 'csr'`）                              | `config.ts`                            |
| SSR 端口                     | fePort 9032                                                           | `config.ts`                            |
| 部署模式                     | PM2 多进程 + koa-static-cache                                         | `pm2.config.js`                    |
| TypeScript 路径别名          | `~` → 源码目录（推测，待确认）                                        | `src/interface/detail.ts` |
| Mock 数据位置                | BFF 层（`src/mock/`）+ 前端层（`public/static/mock/`）               | `src/mock`                            |
| 实时数据                     | Socket.IO 双向通道                                                    | `src/socket/Socket.ts`      |
| 视图切换                     | 信管局视图自动轮播 15s + 手动/自动模式                                | `environment.json.info-management-bureau.viewSwitchInterval`     |
| 大屏分中心                   | 五大中心 / 信管局 / GIS / 应急保障                                    | 路由 + config                                                    |

---

## 3. 模板 → 本项目映射分析

### 3.1 直接可复用的文档（拷贝即用）

| 模板文件                                            | 复用方式                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                         | **拷贝 → 替换占位符**：项目名、模块根路径、技术栈相关条目（`Hox/Redux → valtio`、`antd 4 → antd 5`）  |
| `docs/index.md`                                     | 直接拷贝（路径锚点适配）                                                                              |
| `docs/workflows/as-is-to-be-guide.md`               | 直接拷贝                                                                                              |
| `docs/workflows/brownfield-module-refactor.md`      | 直接拷贝                                                                                              |
| `docs/workflows/tdd-process.md`                     | 直接拷贝                                                                                              |
| `docs/specs/spec-split-guide.md`                    | 直接拷贝                                                                                              |
| `docs/specs/_template/`                             | 直接拷贝                                                                                              |
| `docs/skills/common/git-workflow.md`                | 直接拷贝                                                                                              |
| `docs/standards/coding-standards.md`                | 直接拷贝 + 微调（按本项目栈）                                                                          |
| `docs/standards/security-standards.md`              | 直接拷贝                                                                                              |
| `docs/ai-prompts-guide.md`                          | 直接拷贝                                                                                              |
| `docs/skills/ai-tools/claude-cursor/prompts.md`     | 直接拷贝                                                                                              |

### 3.2 需要重写的文档（按本项目栈）

| 模板文件                                  | 重写要点                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `docs/design/tech-stack.md`               | 完全重写：去掉 React 16/oss-ui/Hox/oss-web-common，加入 React 18/antd 5/fedx-ssr/valtio/ECharts/fedx-gis 等         |
| `docs/design/system-overview.md`          | 重写：IA 按本项目五大中心 + 应急大屏 + 信管局 + GIS；去掉 qiankun 微前端内容（待确认）                              |
| `docs/design/architecture.md`             | 重写：分层按 midway BFF + fedx-ssr + React 18 大屏组件结构组织                                                  |
| `docs/design/framework-communication.md`  | 重写或删除：若非微前端子应用，本节改写为「上游/下游数据源契约」                                                  |
| `docs/design/data-models.md`              | 重写：实体围绕应急保障 NE 类型、保障任务、值班表、预警等                                                         |
| `docs/design/api-contracts.md`            | 重写：本项目 BFF 仅 2 端点 + 大量 mock JSON + 后端散落接口文档；待 YAPI 快照导出后补充                            |
| `docs/design/glossary.md`                 | 微调：补充应急保障领域术语（应急物资、台风等级、保障任务、NE 类型等）                                            |
| `docs/skills/frontend/react/coding.md`    | 重写：React 18 + antd 5 + fedx-ssr + valtio 工程约定                                                            |
| `docs/skills/frontend/react/testing.md`   | 重写或精简：本项目无明显单测体系（需确认）                                                                        |
| `docs/specs/index.md`                     | 重写：模块按本项目业务录入                                                                                       |

### 3.3 不适用的模板内容

| 模板文件                                  | 不适用原因                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `docs/design/api/{fault-report,work-sheet,duty-schedule}.json` | 本项目未发现 YAPI 导出；应改为 `docs-api-backend/` 现有 TS 接口 + `public/static/mock/` JSON |
| `docs/research/antd-4.19.1/`             | 本项目使用 antd 5；不需要这个目录（或改为 antd 5 research）                                  |
| `docs/specs/fault-report/` 及所有 OSS 联通示例 | 本项目业务模块完全不同，应全部替换                                                          |

### 3.4 本项目独有的内容（需新增）

| 内容                                            | 来源                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `docs/design/data-models.md` §X：应急保障 NE 类型模型 | `public/environment.json.emergencySupportNeTypes`              |
| `docs/design/data-models.md` §X：保障任务 / 值班表 / 预警实体 | `environment.json.gd-emergency-support.modules` 7 个模块     |
| `docs/design/architecture.md` §X：BFF 层（midway + fedx-bff-web/ssr） | `src/configuration.ts` |
| `docs/design/tech-stack.md` §X：可视化栈（ECharts + fedx-gis + fedx-3d） | `package.json`                  |
| `docs/design/tech-stack.md` §X：实时数据栈（Socket.IO）             | `src/socket/Socket.ts`    |
| `docs/specs/emergency-support-dashboard/`        | 应急保障大屏 7 个模块                                            |
| `docs/specs/five-major-center/`                  | 五大中心（cmd-dispatcher / comprehensive-display / iframe-page）|
| `docs/specs/info-management-bureau/`             | 信管局视图（开闭幕式 + 比赛日 + 首页 + 倒计时）                 |
| `docs/specs/gis-entry/`                          | GIS 大屏地图                                                    |

### 3.5 AGENTS.md 占位符替换清单

模板 `.local-docs/docs模板-yzf/AGENTS.md` 第 7-10 行的「项目定位」：

| 占位符（模板）                          | 替换值（本项目）                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| **类型**                                | 前端单体（BFF + SSR + 大屏可视化），支持独立部署和 iframe 嵌入                     |
| **当前重点模块**                        | 应急保障大屏（gd-emergency-support）+ 五大中心（five-major-center）               |
| **模块代码根路径**                      | `src/`（BFF + SSR）+ `public/static/mock/`（前端 mock）+ 路由视图代码（待定位）   |
| **协作模式**                            | 存量模块 **文档化 → 按 spec 切片重构**                                            |

模板第 43 行的「前端栈」：

| 占位符                | 替换值                                                                |
| --------------------- | --------------------------------------------------------------------- |
| React 16 + Hox + oss-ui | **React 18.1.0 + valtio 1.11.2 + fedx-ui 2.1.5 + antd 5.26.7**       |

模板第 46 行的「依赖安装」：

| 占位符                          | 替换值                                            |
| ------------------------------- | ------------------------------------------------- |
| `npm install --legacy-peer-deps` | **`pnpm install`**（`pnpm-lock.yaml` 已存在）    |

模板第 47-50 行的实现习惯：

| 占位符                                         | 替换值                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| **公共组件库** oss-web-common                   | **@fedx-web-common/react-hooks + fedx-ui + fedx-vis/react-echarts + @fedx-vis/react-large-screen** |
| **API 请求** `import request from '@Common/api'` | **`@midwayjs/axios` + `@fedx-bff/core`**（BFF 层统一封装）                  |
| **微前端** qiankun                              | **未启用**（独立部署，iframe 嵌入）                                          |
| **按钮鉴权** `<AuthButton authKey>`            | 待确认（本项目未发现此组件）                                                  |

---

## 4. Brownfield 阶段匹配与初始化路径

### 4.1 当前阶段判断

| 模板要求                                              | 本项目现状                                                       | 阶段评估                  |
| ----------------------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| 项目根 AGENTS.md                                      | ❌ 缺失                                                          | **阶段 0 启动前提**       |
| docs/ 文档总站                                        | ❌ 缺失                                                          | **阶段 0 启动前提**       |
| docs/design/tech-stack.md                             | ❌ 缺失（仅 `package.json` 体现）                                | 阶段 0 / 1 边界           |
| docs/specs/ 任意模块                                  | ❌ 缺失                                                          | 阶段 1 / 2 起点           |
| 业务模块可运行                                        | ✅ 有 mock，可运行 `npm start`                                   | 阶段 0 ✅                 |
| 业务模块有历史代码                                    | ✅ 大屏 + 五大中心 + 信管局 + GIS + 后端 BFF                     | 阶段 1 输入              |
| API 契约 / OpenAPI                                    | ⚠️ 部分（`docs-api-backend/` + `public/static/mock/`）           | 阶段 0.5 待补            |
| 业务 PM 输入                                          | ❌ 缺失                                                          | 阶段 0 前置               |

**结论**：本项目处于 **「阶段 0 启动前」**，需要先：

1. 落 AGENTS.md（项目宪法）
2. 落 docs/ 结构（含占位符）
3. 填 design/tech-stack.md（拷贝后立即重写）
4. 梳理业务模块并建 specs/ 子目录
5. 补 PM 输入（如有）

### 4.2 推荐初始化路径（与 `.trae/plans/plan-2026-07-29-002-docs-init.md` 对齐）

| 阶段  | 任务                                                                          | 输出路径                       |
| ----- | ----------------------------------------------------------------------------- | ------------------------------ |
| 0.A   | 拷贝 AGENTS.md 到项目根，替换占位符                                            | `/AGENTS.md`                   |
| 0.B   | 拷贝 docs/ 目录骨架（含 workflows / standards / specs/_template）              | `/docs/`                       |
| 0.C   | 拷贝后立即重写 docs/design/tech-stack.md                                       | `/docs/design/tech-stack.md`   |
| 0.D   | 重写 docs/design/system-overview.md（按本项目 IA）                             | `/docs/design/system-overview.md` |
| 0.E   | 重写 docs/design/architecture.md（按 midway + fedx-ssr 分层）                   | `/docs/design/architecture.md` |
| 0.F   | 决定是否需要 framework-communication.md（若非微前端，删或改为数据源契约）       | `/docs/design/framework-communication.md` |
| 1.A   | 识别 4-6 个核心业务模块，建 specs/ 子目录 + 落 pm-inputs（PM 待补）            | `/docs/specs/<slug>/pm-inputs/` |
| 1.B   | 编写每个模块的 as-is-architecture.md（仅读代码，标注待 PM 确认的部分）          | `/docs/specs/<slug>/as-is-architecture.md` |
| 1.C   | 编写每个模块的 code-inventory.md                                               | `/docs/specs/<slug>/pm-inputs/code-inventory.md` |
| 2.A   | 编写每个模块的 spec.md（含 §8 现状与目标差异 + §10 开放问题）                  | `/docs/specs/<slug>/spec.md`   |
| 2.B   | 编写每个模块的 plan.md + tasks.md（R1–R5 切片）                                | `/docs/specs/<slug>/plan.md` + `tasks.md` |
| 2.C   | 编写每个模块的 acceptance-tests.md（含「现状」列：已实现/部分/未实现）          | `/docs/specs/<slug>/acceptance-tests.md` |
| 2.D   | 编写每个模块的 data-model-extensions.md                                       | `/docs/specs/<slug>/data-model-extensions.md` |
| 3.A   | 整合全局 data-models.md + api-contracts.md + glossary.md                      | `/docs/design/{data-models,api-contracts,glossary}.md` |
| 4.*   | 按 R1–R5 切片改代码（阶段 4 不在本 research 范围）                             | —                              |

---

## 5. 待解决问题与开放问题

### 5.1 关键技术决策需 PM / 架构师确认

| #   | 问题                                                                                                                | 影响范围                             |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| O-1 | 本项目是否走 qiankun 微前端？（package.json 未发现，需确认）                                                         | framework-communication.md 是否需要   |
| O-2 | 是否引入按钮级鉴权（AuthButton）？（模板重点章节，本项目现状未知）                                                    | AGENTS.md §实现习惯、tech-stack.md  |
| O-3 | 是否有单测体系？（package.json 未见 vitest/jest，需确认）                                                            | skills/frontend/react/testing.md  |
| O-4 | 是否走 CI / CD（lint、test、build）流水线？（package.json 有 lint 脚本）                                            | workflows 补充                       |
| O-5 | BFF 仅 2 个端点，是否准备扩展？（api/index + api/detail/:id）                                                       | api-contracts.md 结构               |
| O-6 | 应急保障大屏的「模块 key」（ensure-progress 等）与代码的对应关系是什么？                                            | specs/emergency-support-dashboard  |
| O-7 | 信管局视图（info-management-bureau）有 4 类子视图（开闭幕式/比赛日/首页/倒计时），是否每个单独 spec？             | specs/info-management-bureau       |
| O-8 | 后端接口契约文档（`docs-api-backend/`）是临时还是长期？是否需要 YAPI 导出？                                          | api-contracts.md 来源               |
| O-9 | 应急保障 NE 类型（emergeStatus1/2/3、应急物资等）是配置驱动还是写死？                                              | data-models.md 建模                  |
| O-10 | mock 数据是否最终替换为真实接口？分批推进还是一次性？                                                              | plan.md 切片策略                    |
| O-11 | 第三方 iframe（节假日保障、抗台防汛、全运会、高速大屏、高铁专网、态势感知）是否纳入 docs 范围？                   | specs/five-major-center 边界         |

### 5.2 内容待补（非阻塞，但建议在阶段 1 前补齐）

| 内容                              | 来源建议                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| PM 输入（A–H 八节）               | 5 大业务模块 × 8 节                                              |
| 真实接口契约                      | 后端开发人员对接                                                  |
| 性能基线（NFR）                   | 大屏首屏 < 2s / 实时数据延迟 < 1s                                |
| 浏览器 / 分辨率兼容矩阵           | 信管局大屏 5760×1080、应急大屏 4K                                |
| 错误码完整清单                    | BFF 拦截器 + 后端枚举                                             |

### 5.3 本次 research 阶段的边界（明确不做什么）

- ❌ 不创建 `/AGENTS.md`（属计划阶段 0.A）
- ❌ 不创建 `/docs/` 目录（属计划阶段 0.B+）
- ❌ 不写任何 design 文档正文（属计划阶段 0.C+）
- ❌ 不写任何 spec 文档正文（属计划阶段 1+）
- ❌ 不动业务代码（始终遵守）
- ❌ 不评审 PM 输入（PM 未介入）

---

## 6. 风险登记

| 风险                                              | 等级 | 缓解                                                                                          |
| ------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------- |
| 模板与本项目栈差异大（React 18 / antd 5 / fedx-ssr） | 中 | 在 tech-stack.md 中**明确标注差异**，不在 coding.md 沿用 antd 4 写法                          |
| 大量业务模块（7+）一阶段文档化不现实              | 高 | **分批推进**：先 emergency-support-dashboard（核心），再扩展到五大中心 / 信管局 / GIS         |
| mock 数据驱动 vs 真实接口驱动 边界模糊             | 中 | 在 spec.md §5 明确「mock 阶段 vs 联调阶段」差异                                              |
| 第三方 iframe 页面难以文档化                       | 低 | 在 spec 中标注「外部依赖 / 不在文档范围内」                                                  |
| 后端契约缺失（`docs-api-backend/` 散乱）            | 中 | **阶段 0.5** 增补一个 api-contracts.md 框架，标注「待 YAPI 导出」                            |
| 大屏可视化无单测标准                              | 中 | testing.md 标注「暂以手工 + 视觉验收为主」，不强行套单测模板                                 |

---

## 7. 参考资料

### 7.1 模板来源

- 模板根：`.local-docs/docs模板-yzf`
- 模板 AGENTS：`.local-docs/docs模板-yzf/AGENTS.md`
- 模板入口：`.local-docs/docs模板-yzf/docs/index.md`
- 模板核心流程：
  - `.local-docs/docs模板-yzf/docs/workflows/as-is-to-be-guide.md`
  - `.local-docs/docs模板-yzf/docs/workflows/brownfield-module-refactor.md`
  - `.local-docs/docs模板-yzf/docs/ai-prompts-guide.md`

### 7.2 本项目关键文件

- 入口：`README.md`
- 包配置：`package.json`
- 构建配置：`config.ts`
- BFF 装配：`src/configuration.ts`
- BFF 控制器：`src/controller`
- BFF 接口：`src/interface`
- BFF 服务：`src/service`
- BFF Mock：`src/mock`
- Socket：`src/socket/Socket.ts`
- 前端 Mock 数据：`public/static/mock`
- 环境配置：`public/environment.json`
- 后端契约（散落）：`docs-api-backend`

### 7.3 模板示例模块（参考用，不直接复用）

- `.local-docs/docs模板-yzf/docs/specs/fault-report` — 伞形示例
- `.local-docs/docs模板-yzf/docs/specs/troubleshooting-workbench` — 伞形示例
- `.local-docs/docs模板-yzf/docs/design/tech-stack.md` — tech-stack 写法参考

---

## 8. 下一步

1. **审阅本 finding**：确认 O-1 ~ O-11 的开放问题处理策略
2. **进入下一轮 research**：`.trae/plans/2026-07-29-001-plan-next-research-step.md` 规划深度研究
3. **PM 介入**（可选）：补 specs/pm-inputs/pm-requirements-input.md §A–H
4. **第二轮 research 后**：落 AGENTS.md + docs/ 骨架（具体执行计划另起一份 plan）