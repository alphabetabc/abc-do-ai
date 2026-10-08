# Task · 2026-10-08-008-info-management-bureau-doc

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-08-008-info-management-bureau-doc` |
| Status | 已完成 |
| 类型 | skill（业务模块文档新建，无业务代码改动） |
| 影响范围 | skill `oss-vis-gd-project-context` 下 `design/modules/info-management-bureau/`（新建）；`SKILL.md` 场景表 |
| Roadmap | skill 结构治理延续（task-002 分层规则的业务模块落地） |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-10-08-002（modules/ 分层规则已确立） |

---

## 目标（Goal）

为 `web/pages/info-management-bureau/`（信管局大屏）建立 `design/modules/info-management-bureau/` 子模块文档：000-overview 入口（模块定位、路由、视图结构）+ 三个子页面（home / game-match / open-and-close）各自的实现文档，仿照 five-major-center 的目录组织方式。

---

## 步骤（执行计划）

### 步骤 1：源码调研

- **动作**：Read `render.tsx` / `sub-pages/index.tsx`（视图切换机制）、三个子页面 `index.tsx` 与各自 `modules/` 布局（home 12 个子模块、game-match 8 个、open-and-close 8 个）、`sub-pages/components/` 共享组件（container / view-state / today-scheduler 等）、`share/presets.ts`、数据来源（services / fields.ts / screen.ts）
- **输出**：调研结论（对话中呈现，含子模块清单与数据流）
- **等待用户**：否

### 步骤 2：建 000-overview

- **动作**：新建 `design/modules/info-management-bureau/000-overview/README.md`：模块定位与入口（路由）、视图结构（home / game-match / open-and-close 三视图 + ViewStateSwitch 切换机制）、共享组件层（sub-pages/components）、数据与配置组织（fields.ts / screen.ts / share/presets.ts）、子文档索引
- **输出**：`000-overview/README.md`
- **等待用户**：否

### 步骤 3：建三个子页面文档

- **动作**：新建 `design/modules/info-management-bureau/home/README.md`、`game-match/README.md`、`open-and-close/README.md`：各页面子模块清单（每个 module 一句话职责 + 关键文件）、布局结构、数据模型（字段表）、交互、图表用法
- **输出**：三份子页面 README
- **等待用户**：否

### 步骤 4：索引与验收

- **动作**：SKILL.md 场景表登记新模块入口；核对所有路径 / 子模块名与源码一致；grep 无死链
- **输出**：验收 checklist 勾选
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不改任何 `web/` 业务代码
- 不为每个 module 单独建文档（子模块在页面 README 内以清单形式覆盖，粒度到「模块 + 关键文件 + 职责」）
- 不写底层组件用法（EChartsMap / emap-gis 等，链接 components/ 对应文档）
- 不穷举 images/ 静态资源
- **文档纪律（源自 task-003 验收教训，必须遵守）**：
  - 引用方向：业务文档 → 组件文档；需要说明图表/地图实现时链接 `design/components/` 对应文档，不复制其内容、不在组件文档里加业务引用
  - design/ 文档是长期真实源，**不写任务溯源 / 变更记录 / 过程性信息**（这些只进任务卡）
  - README（000-overview）保持入口薄层：定位 + 快速上手 + 文档索引；内容拆到主题子文档（如各视图 sub-page 文档）
  - 不与其他模块做对比说明，只描述自身
  - 所有模块名 / 文件路径 / 交互行为先读源码核实（反幻觉守则），禁止凭印象写

---

## 验收 checklist

- [x] A1：000-overview 覆盖路由入口、三视图结构、视图切换机制、共享组件层、数据组织、子文档索引
- [x] A2：三份子页面文档各自覆盖全部 modules/ 子模块（清单式）+ 数据模型 + 交互
- [x] A3：SKILL.md 场景表已登记，模块内相对链接与跨目录引用（components/、five-major-center 经验引用）无死链
- [x] A4：文档中子模块名 / 文件路径与源码一致（反幻觉守则，抽查核对）
- [x] 影响架构 / 硬约束的决策已回写 `design/`（000-overview/README.md 内沉淀组织规则）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-08 | user（「执行这个 task」指令视为批准） |
| ② 实现验收 | 已通过 | 2026-10-08 | user（「请归档」指令视为验收通过） |

---

## 变更记录（执行中偏离任务卡的部分）

| # | 偏离 | 原因 |
| --- | --- | --- |
| 1 | 步骤 3 由「三份子页面 README」升级为「视图编号目录 + 每 widget 一个编号子目录（spec.md + data-model.md）」：`001-home/`（6 widget）、`002-game-match/`（8 widget）、`003-open-and-close/`（7 widget），共 21 个 widget 子文档 | 用户两轮细化要求：先「每页面组件与数据细化」，后明确「001-xxx/spec.md + data-model.md」结构 |
| 2 | 增补 `000-overview/001-view-state/README.md`（视图轮换、倒计时、人工干预、页面跳转详解） | 视图切换机制内容量大，从 000-overview 拆出主题子文档（渐进式披露） |
| 3 | home 的 cloud-video / game-private-network / public-network 三个模块目录在源码中无引用，按实况标注为遗留代码 | 反幻觉守则：调研发现，如实写入 |

---

## 关联

> - 前置：`task-2026-10-08-002-design-restructure-map-geo`
> - 目录组织参照：`design/modules/five-major-center/`（000-overview + 编号子目录模式）
