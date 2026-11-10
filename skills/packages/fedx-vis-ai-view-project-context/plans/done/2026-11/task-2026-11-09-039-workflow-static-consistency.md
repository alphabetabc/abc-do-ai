# Task · 2026-11-09-039-workflow-static-consistency

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-09-039-workflow-static-consistency` |
| Status | 已完成（待验收归档） |
| 类型 | docs |
| 影响范围 | `docs/workflows/big-screen-assembly.md`、`scripts/export-skill.mjs`（SKILL.md 文案）、`docs/materials/_templates/`、约 20 个 `docs/materials/**/spec.md`（补节）、`docs/materials/business/pie-3d/`（依赖声明核对） |
| Roadmap | `plans/roadmap.md` 阶段 4（skill 产物化） |
| 验收标准 | 大屏组装工作流（含导出产物）引用的节名 / 依赖表与实际物料 spec 逐一对得上，静态校验零命中 |
| 前置依赖 | task-038（big-screen-assembly-skill，已完成归档） |

---

## 目标（Goal）

对 task-038 固化的大屏组装工作流做导出产物静态校验，修复发现的三处文档-物料不一致：依赖节名不统一、SKILL.md「依赖物料声明」引用落空、依赖表缺 `echarts-gl`。

---

## 背景

2026-11-09 对 `dist-skill/large-screen-builder/`（`node scripts/export-skill.mjs` 产物，37 模块）执行静态校验，发现：

1. **「数据与依赖」节名不统一（主因）**：`docs/workflows/big-screen-assembly.md` 步骤 0 写「精确依赖以各物料 `spec.md` 的『数据与依赖』节为准」，但 37 模块中仅 17 个有该节；其余 20 个（gauge / pie-3d / echarts-map / 全部 business 物料 / ui-swiper-react-core 等）把依赖信息散写在「实现说明 / 零依赖声明 / 蒸馏决策」节。
2. **SKILL.md「依赖物料声明」落空**：`export-skill.mjs` 生成的 SKILL.md 写「各模块的依赖清单以其 data-model.md『依赖物料声明』为准」，实际仅 `carousel-view` 1 个模块的 data-model.md 有此节，其余 36 个没有。
3. **依赖表缺 `echarts-gl`**：pie-3d 明确需要 `echarts-gl`（surface 系列必需，code 中 side-effect import），工作流步骤 0 依赖表未列。

已通过项（无需动）：产物结构完整、`specs/<模块>/code/` 路径自洽、scaler-container / interaction-store 的 API 示例与 spec 逐字一致、ahooks/zustand/swiper 等依赖表抽查属实。

---

## 功能列表

- F1：统一依赖节名——20 个缺失「数据与依赖」节的 spec.md 补齐该节（内容从现有「实现说明」等节迁移/汇总，不新编依赖）
- F2：`docs/workflows/big-screen-assembly.md` 步骤 0 依赖表补 `echarts-gl` 行（何时需要：pie-3d）
- F3：`scripts/export-skill.mjs` 中 SKILL.md 文案修正：「依赖物料声明」引用改为与 F1 统一后的实际节名口径
- F4：`docs/materials/_templates/` 物料骨架模板固化「数据与依赖」必填节，从源头防漂移

## 不做清单

- 不改动任何物料 `code/` 源码
- 不重跑端到端搭屏试运行（属后续验证任务，另立项）
- 不在缺失模块中虚构「依赖物料声明」（跨模块依赖声明仅 carousel-view 有实际需要；其余模块无跨模块依赖则不补该节）

---

## 步骤（执行计划）

### 步骤 1：补齐 20 个 spec.md 的「数据与依赖」节

- **动作**：对 37 模块重新扫描（脚本复核缺失清单），逐个把散落的依赖信息（npm 依赖 + 版本锁 + 跨模块引用）汇总为「数据与依赖」节；零依赖模块也写明「零外部 npm 依赖」
- **输出**：更新后的 spec.md × 20
- **等待用户**：否

### 步骤 2：工作流与导出脚本修正

- **动作**：F2（依赖表补 echarts-gl 行）+ F3（SKILL.md 文案对齐统一节名）
- **输出**：`docs/workflows/big-screen-assembly.md`、`scripts/export-skill.mjs` 变更
- **等待用户**：否

### 步骤 3：模板固化

- **动作**：`_templates/` 骨架（spec 模板若有）加「数据与依赖」节占位；确认模板结构后决定具体落点
- **输出**：模板变更
- **等待用户**：否

### 步骤 4：回归校验

- **动作**：重跑 `node scripts/export-skill.mjs`；重新执行本任务的静态校验命令（spec.md 全量含「数据与依赖」、data-model 引用口径核对、依赖表逐行 Glob/源码核对）；`pnpm build`（确保脚本/文档改动不破坏站点）
- **输出**：校验零命中的证据（命令输出）
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：`dist-skill/large-screen-builder/specs/*/spec.md` 37/37 含「数据与依赖」节（重导出后复核：缺节数 0/37）
- [x] A2：工作流步骤 0 依赖表含 `echarts-gl` 行（pie-3d），来源为其 spec.md「数据与依赖」节
- [x] A3：导出产物 SKILL.md 依赖指引改为「spec.md『数据与依赖』节为准（各 spec.md 均含该节）」，重新导出后核对一致
- [x] A4：`_templates/spec.md` 第 4 节固化三行式填写约定（npm 依赖 / 跨模块 import / 请求层与静态资源），并注明「不得改用其他节名」
- [x] A5：`pnpm build` 通过（✓ built in 35.61s）
- [x] 决策已回写 `design/`：无架构影响，N/A
- [x] `env/AGENTS.md` 质量门槛命令已通过（`pnpm build`）

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-09 | 用户（「执行这个task」） |
| ② 实现验收 | 已通过 | 2026-11-09 | 用户（「归档」） |

---

## 进度日志（按需追加）

### 2026-11-09 14:10

> - 立项：源于 task-038 产物静态校验发现的三处不一致（见背景节）

### 2026-11-09 15:0x 执行记录

> - 步骤 1：先脚本复核源 `docs/materials/` 缺失清单（20 个），再逐一 Read 后分两类处理——7 个已有「依赖 / 零依赖声明」节的改名为「数据与依赖」并保留原信息（carousel-view / guarantee-business / hot-business / network-conditions / network-impact-situation / ui-column-3d / ui-progress-bar），13 个文末新增节（chart-bar-pie / detail-table / dispatch-progress / ensure-progress / indicator-view / security-mission / bar3d-line / echarts-map / gauge / pie-3d / ui-ind-top-n / ui-swiper-react-core / ui-widget-shell）。所有依赖声明均来自既有 spec 内容 + code/ import 实测核对（扫描无非预期外部 import）
> - 步骤 2：工作流依赖表插入 `echarts-gl` 行；`export-skill.mjs` SKILL.md 文案两行改为统一口径（spec.md「数据与依赖」节为准）
> - 步骤 3：`_templates/spec.md` 第 4 节占位改为三行式必填约定（npm / 跨模块 / 请求层与静态资源），模板本就有该节，仅强化填写约定
> - 步骤 4：重跑导出（37 模块）→ 37/37 含节；产物内 SKILL.md / workflows 校验一致；`pnpm build` 通过
> - 踩坑：无。注意 export-skill 每次重建 dist-skill 会产生大量回收站事件（371 个），属脚本 `rm -rf` 正常行为

---

## 引用一致性（归档前必走）

- [ ] `current-sprint.md` —— 移除该任务索引行
- [ ] `backlog.md` —— 未登记，N/A
- [ ] `roadmap.md` —— 按需更新进度

---

## 关联

> - 相关 task：task-2026-11-09-038-big-screen-assembly-skill（done/2026-11/）
