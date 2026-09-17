# task-2026-07-29-004：清理 .bak 备份文件（延后 1 个月启动）

> 单源稳定 1 个月后清理历史 .bak 备份文件
>
> 计划日期：2026-07-29（创建，**延后到 2026-08-28 启动**）
> 任务编号：`task-2026-07-29-004`
> 状态：`cancelled`（2026-07-28）
> 类型：`chore`
> 来源：[2026-07-28-handoff §4.2 #5](../2026-07-28-handoff-single-source-refactor.md) / 原 task-2026-07-28-003 §1
>
> **⚠️ 任务取消**：用户 2026-07-28 明确指示 **`.bak` 备份文件全部保留**，不清理。本任务不再推进。
>
> **保留理由**（用户决策）：
> 1. `.bak` 文件作为历史快照永久保留，便于未来需要回查旧实现时参考
> 2. AGENTS.md §10.2 已标注 .bak 文件是"历史快照，不是活代码——grep 时需排除"，与永久保留一致
> 3. 删除风险 > 保留成本：万一未来需要参考，反而要重新生成
>
> **风险等级：低（删除历史快照，不影响活代码）** — **不再适用**（任务取消）

---

## 1. 背景

task-2026-07-28-003 在死代码清理阶段**主动延后**了 `.bak` 备份文件的清理，理由：

1. 单源重构刚落地，需观察稳定性（1 个月冷却期）
2. 部分 .bak 文件可能在回退时作为参考
3. 部分 .bak 文件记录了 task-007 之前的实现（pre-byId 时代）

1 个月后无问题则可安全清理。AGENTS.md §10.2 已标注 ".bak 备份文件是历史快照，不是活代码——grep 时需排除"。

---

## 2. 目标

1. 清理以下 5 个 .bak 文件：
   - `src/designer/renderer/utils.bak.js`
   - `src/designer/renderer/DesignerField.bak.jsx`
   - `src/designer/canvas-graph/index.bak.js`
   - `src/store/backup/app.js.bak`
   - `src/store/backup/component.js.bak`
   - `src/store/backup/index.js.bak`
   - `src/store/backup/modules-index.js.bak`
2. 验证清理后 grep 排除 .bak 后结果不变
3. AGENTS.md §10.2 关于 .bak 的说明可改为"已清理"

---

## 3. 详细步骤

### 步骤 0：启动条件验证（2026-08-28 启动时）

- [ ] 确认单源架构稳定 1 个月
  - 期间无回退 commit
  - 期间无新 bugfix 涉及 .bak 文件
  - Wave 1/2/3 任务已全部完成

### 步骤 1：清理前备份

- [ ] 把所有 .bak 文件打包成 `archive-2026-07-28-bak-files.tar.gz`
- [ ] 存到 `.trae/archive/`（不在 git 跟踪）
- [ ] 留 1 个月观察期（2026-08-28 → 2026-09-28）

### 步骤 2：删除 .bak 文件

- [ ] 删除 7 个 .bak 文件
- [ ] 单 commit: `chore: 清理单源重构前历史 .bak 备份文件（稳定 1 个月后）`
- [ ] 更新 AGENTS.md §10.2 ".bak 已清理"

### 步骤 3：验证

- [ ] Grep 排除 .bak 后结果不变（脚本运行对比）
- [ ] `pnpm exec tsc --noEmit` 零错误
- [ ] `pnpm build` 通过
- [ ] `pnpm start` 启动正常

---

## 4. 验证清单

- [ ] 启动条件满足（单源稳定 1 个月）
- [ ] 7 个 .bak 文件已删除
- [ ] 单 commit `chore: 清理单源重构前历史 .bak 备份文件`
- [ ] Grep 排除 .bak 后结果不变
- [ ] `pnpm exec tsc --noEmit` 零错误
- [ ] `pnpm build` 通过
- [ ] `pnpm start` 启动正常
- [ ] AGENTS.md §10.2 更新
- [ ] 任务文件移到 `plans/done/`
- [ ] roadmap.md 状态更新

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 清理后某 .bak 文件被新 bugfix 需要 | 极低 | 需重新引入 | 1 个月观察期已大幅降低风险 |
| 删除路径错误 | 极低 | 误删活代码 | 列出每个文件路径 + Read 确认是 .bak |

### 回退

- 1 个月观察期内发现问题：`archive-2026-07-28-bak-files.tar.gz` 还原
- 单 commit `git revert <commit>`

---

## 6. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-29：任务创建。承接 handoff §4.2 #5 + 原 task-2026-07-28-003 §1 主动延后项。**计划 2026-08-28 启动**。
- **2026-07-28（取消当日）：状态变更 `planning` → `cancelled`（用户决策）**。用户明确指示 `.bak` 备份文件全部保留，不清理。原计划 §3 步骤 0/1/2 全部不再执行；`archive-2026-07-28-bak-files.tar.gz` 备份步骤也不需要。本任务文件保留作为决策记录。
