# Task · 2026-11-16-012-material-backflow-batch

> task-010 派生任务 T1（物料回流批）。承接 G1 / G2 / G3 / G4。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-012-material-backflow-batch` |
| Status | 已完成 |
| 类型 | 编码（物料回流） |
| 影响范围 | `docs/materials/`（新增 4 模块）、`apps/playground/src/components/materials/registry.tsx`、`apps/show-case/src/components/materials/`（临场物料源） |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准） |

---

## 目标（Goal）

把 show-case 实战中的 4 个宿主临场物料回流为正式物料：G1 `bg-image`、G2 `title-plain`、G3 `period-cards`、G4 `center-ind-cards` → `docs/materials/`，按蒸馏流程产出四件套（manifest / spec / data-model / code / examples）。

## 不做清单

- 不处理 G6–G11 可配置性增强（属 T2，另卡）
- 不改 `dist-skill/`（完成后统一 `pnpm export:skill` 重导出，见 task-010 步骤 2 收尾）

---

## 步骤（执行计划）

### 步骤 1：逐物料回流

- **动作**：从 `apps/show-case/src/components/materials/` 提取 4 物料 → `docs/materials/<分组>/<模块>/` 四件套
- **输出**：4 个新模块目录
- **等待用户**：否

### 步骤 2：schema 契约登记（方向定调推论）

- **动作**：每物料 manifest 补 `runtime.type` + playground registry 注册演示组件
- **输出**：registry.tsx 更新，`pnpm check:material-registry` 通过
- **等待用户**：否

### 步骤 3：验证

- **动作**：根 `pnpm build` + `pnpm check:material-registry` + playground `pnpm build`
- **等待用户**：是（硬门槛②）

---

## 技术设计（2026-11-16 定稿）

- **分组**：`bg-image` → components/ui（decoration 通用底图容器）；`title-plain` / `period-cards` / `center-ind-cards` → business（屏级模式组件）
- **贴图自包含**：period-cards / center-ind-cards 的 PM 贴图拷入各模块 `code/assets/`（模块间禁止相互 import，不用共享 _assets），并提供 `groupBgUrl` / `cellBgUrl` props 覆盖入口
- **schema 契约**：manifest 补 `runtime.schemaable/type/dataContract/propsContract/events/constraints`（与 check:material-registry 校验项对齐）；items 数组型 dataContract（data.inline 下发 items，展开合并进 props）
- **show-case 临场版保留**：ops-monitor 屏继续用临场版（独立演进中）；playground home.schema.json 新增 period-cards section 作为回流版 schema 链路演示

## 验收 checklist

- [x] A1 4 模块四件套齐全，manifest 必填字段完整（name/description/tags/category 取自词表：decoration ×2 / indicator ×2）
- [x] A2 manifest `runtime.type` ↔ playground registry 键一致（check:material-registry 通过：13 物料 / 13 键）
- [x] A3 根 `pnpm build` 通过；playground `pnpm build` 通过（贴图均入产物）
- [x] A4 show-case 保持临场版 + 回流版并存（理由：ops-monitor 为实战验证屏，回流版经 playground schema 链路验证；两版暂不强制合一，待 show-case 下一轮迭代再切换）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（build / check:material-registry / playground build）
- [x] 实测：playground home.schema.json 新增 period-cards section（inline items），浏览器验证两组行条（昨天/今天）+ 6 张贴图指标卡渲染、left-title-bg/left-ind-bg 资源 200、console 零错误

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡 | — |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户（批量建卡批准，执行「继续下一个task」） |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户（current-sprint 归档记录「用户验收通过」回填） |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T1 · G1–G4）
> - 物料源现场：`apps/show-case/src/components/materials/`
