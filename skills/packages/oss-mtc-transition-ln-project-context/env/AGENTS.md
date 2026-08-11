# AGENTS.md — 大屏（可视化分析）开发管理

> 本文件作为 **AI Agent / 团队成员** 开发 **大屏（可视化分析）** 相关功能时的入口说明。
> 范围聚焦：人员信息大屏、信访信息大屏、未来的「大数据综合展示」(`/visual/big-screen`) 等数据可视化模块。
> 其他业务（账号、组织、比对、统计报表等）不在本文件管理范围内，请参考对应 spec。

---

## 1. 项目速览

- 仓库：`oss-mtc-transition-ln`
- 技术栈：前端 React 19 + Ant Design 6 + Vite 8；后端 FastAPI + Kingbase
- 工具链：使用 `mise` 管理版本，参见仓库根 `mise.toml`
- 文档体系：`docs/specs/`（需求规格）、`docs/design/`（架构/契约/数据模型）、`docs/skills/`（开发规范）

---

## 2. 大屏开发范围

### 2.1 已存在 / 已规划的大屏模块

| 模块           | 数据源（schema · 表）                                               | Spec                                                         | 前端路由（计划）               |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------ |
| 人员信息大屏   | `dw_basic_lc` · `stats_jdlk_persion_age_group` 等（§6 data-models） | 待新建 spec                                                  | `/visual/big-screen/personnel` |
| 信访信息大屏   | `dw_basic_lc` · `letter_screen_1`–`6`（§7 data-models）             | 待新建 spec                                                  | `/visual/big-screen/petition`  |
| 大数据综合展示 | TBD                                                                 | `035-visual-monthly-statistics/spec.md` §1.4 提到「另 spec」 | `/visual/big-screen`           |
| 统计分析月报   | `dw_basic_lc` · `abi_*` / `analysis_report_file_info`               | `035-visual-monthly-statistics`                              | `/visual/stats/*`              |

### 2.2 涉及的关键文档

- 总体架构：[docs/design/architecture.md](docs/design/architecture.md)
- 系统总览：[docs/design/system-overview.md](docs/design/system-overview.md)（§2.2.2 菜单域）
- API 契约：[docs/design/api-contracts.md](docs/design/api-contracts.md)
- 数据模型：[docs/design/data-models.md](docs/design/data-models.md)（§6 人员大屏、§7 信访大屏、§11.1 遗留表）
- 技术栈：[docs/design/tech-stack.md](docs/design/tech-stack.md)
- 月报统计规格：[docs/specs/035-visual-monthly-statistics/spec.md](docs/specs/035-visual-monthly-statistics/spec.md)
- Kingbase 方言规范：[docs/skills/database/kingbase/coding.md](docs/skills/database/kingbase/coding.md)
- 大屏 SQL 来源脚本：`assets/可视化分析/人员信息大屏/人员信息大屏.sql` 与 `assets/可视化分析/信访信息大屏/信访信息大屏.sql`

> ⚠️ 添加新大屏模块前，先在 `docs/specs/` 下新建 spec（沿用 `NNN-<name>/spec.md` 五件套：`spec` / `plan` / `tasks` / `data-model-extensions` / `acceptance-tests`）。

---

## 3. 前端目录约定

约定位置（实际目录以仓库当前结构为准；不存在时请先确认）：

```
frontend/src/
├── pages/
│   └── visual/
│       ├── big-screen/
│       │   ├── Personnel/        # 人员信息大屏
│       │   ├── Petition/         # 信访信息大屏
│       │   └── Overview/         # 大数据综合展示
│       └── stats/                # 035 统计分析（月报）
├── components/
│   └── big-screen/               # 通用大屏组件（数字翻牌、地图、轮播等）
├── api/
│   └── visual/                   # 大屏相关 API 封装
└── hooks/
    └── visual/
```

**注意**：本仓库 `frontend/src/` 下目前**尚未确认**有 `pages/visual/` 目录。开始大屏开发时，**先核对**目录结构，避免在错误路径下新建文件。

---

## 4. 后端约定

- 路由：`backend/app/api/visual/`（大屏域端点）
- Service：`backend/app/services/visual/`
- Schema：`backend/app/schemas/visual/`
- 大屏查询 SQL：**不放 migration**，按 [architecture.md §6](docs/design/architecture.md) 约定放 `backend/app/services/visual/sql/` 或 `backend/app/repositories/sql/`，目录命名建议带 `kingbase` 标识。
- 端点前缀：与 comparison / visual 一致使用 `/api/visual/<sub-domain>`（**无** `/v1`）。
- 鉴权：菜单项粒度（详见系统总览 §2.4 与对应 spec）。

---

## 5. 大屏开发通用要点

1. **数据口径**：所有统计口径变更须同步更新 `docs/design/data-models.md` 中对应章节与 spec 中的「口径」条款。
2. **大屏只读**：大屏仅消费统计表（`stats_*` / `letter_screen_*` / `abi_*`）快照，不直接写明细库。
3. **导出/下载**：大屏如需导出，沿用 `035` 的 Excel 导出与 `Content-Disposition` 文件名规范。
4. **加载/空态/错误态**：必须实现；401 → `/login`，403 → `/403`，5xx 走契约统一错误体。
5. **图表方案**：本期图表组件选型尚未确定，开始前需先在 spec 里约定（候选：ECharts / AntV / Recharts），并与设计资源对齐分辨率（建议 1920×1080 / 2K）。
6. **响应式**：大屏主要面向大屏展示端，PC 管理端的列表页另行布局。

---

## 6. 命名与代码风格

- 详见：[docs/skills/frontend/react/coding.md](docs/skills/frontend/react/coding.md)
- 大屏组件名使用 `PascalCase`，目录与文件名一致（如 `PersonnelAgeChart.tsx`）。
- 大屏页面入口文件建议命名：`index.tsx` + 子组件目录。

---

## 7. 开发流程（建议）

1. 新建/更新 spec（`docs/specs/NNN-<name>/`）
2. 在 `docs/design/data-models.md` 中确认/扩展统计表模型
3. 后端：定义 API + SQL + Service + Schema + 测试
4. 前端：API 封装 + 页面 + 组件 + 测试
5. 在对应 spec 的 `acceptance-tests.md` 中追加验收用例
6. 联调通过后更新本文件 §2.1 的表格，确保「新模块」可被未来 Agent 检索到

---

## 8. 禁止行为

- ❌ 不得修改本文件**以外**的 `docs/` 文档来引用本文件（`docs/` 禁止引用 `AGENTS.md`，详见 `.trae/rules/docs-no-private-refs.md`）
- ❌ 不要在本文件未涉及的目录中乱建文件（如 `packages/`、`backend/migrations/` 等）
- ❌ 不要把大屏查询 SQL 写进 Alembic migration
- ❌ 不要绕过菜单鉴权直接暴露大屏端点

---

## 10. 文档修改门禁（大屏可视化计划期间生效，2026-08-11）

> 本节约束本仓库所有 AI Agent / 团队成员对仓库文件的修改权限。

| 等级           | 范围                                                                                              | 修改方式                                                            |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **L1 自由**    | `.trae/skills/oss-mtc-transition-ln-project-context/**`（个人/草稿区）                          | 当前会话可直接编辑                                                  |
| **L2 计划授权** | 仓库根 `AGENTS.md`（含 `env/AGENTS.md` 硬链接镜像）                                                | 必须走 `plans/roadmap-2026-08-11-big-screen.md` §6 提案审批         |
| **L3 严控**    | `docs/**/*.md`、`README.md`、`docs/specs/_template/**`                                          | 必须走同上提案审批，且需 PM / 架构师会签                            |

- **L2 中 `AGENTS.md` 是规则的权威载体**：跨会话、跨阶段的硬规则必须沉淀至此，`.trae/skills/.../plans/` 仅作工作底稿。
- **L3 中 `_template/**` 仅在 PM + 架构双签时可改**；任何 spec 引用模板都假设模板稳定。
- **状态机**：`[ ] 提案` → `[ ] 审批中` → `[x] 执行并落行`。
- 任何 L2 / L3 改动前必须把变更条目放进对应 `plans/roadmap-*.md` §6 并勾选；勾选未走完视为违规。

### 10.1 task 文件生命周期

- task 文件位于 `.trae/skills/oss-mtc-transition-ln-project-context/plans/`
- 状态流转：`✅ 进入` → `🟡 进行中` → `✅ 完成`
- **完成的 task 必须移动到 `plans/done/` 子目录**，文件名保留原样（含日期与编号）
- `plans/` 根目录只保留"进入 / 进行中 / 暂停"状态的 task；`done/` 只保留已完成的
- 移动操作属于 L1（自由），不需要审批
- 移动后须同步更新 `plans/roadmap-*.md` §4 任务索引的状态列（如 `✅ 完成 → done/`）

---

## 9. 变更记录

| 日期       | 变更                                                                                              | 备注                |
| ---------- | ------------------------------------------------------------------------------------------------- | ------------------- |
| 2026-08-11 | 初始化 AGENTS.md，建立大屏开发管理入口                                                            | 初版                |
| 2026-08-11 | 新增 §10 文档修改门禁（L1/L2/L3），与 `plans/roadmap-2026-08-11-big-screen.md` §6 联动            | R-AGENTS-L1L2L3     |
| 2026-08-11 | 新增 §10.1 task 文件生命周期（完成 task 移至 `plans/done/`）                                      | R-AGENTS-TASK-DONE  |
