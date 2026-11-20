# Task · 2026-11-20-005-fujian-truth-rebuild

## 任务元信息

| 项 | 值 |
|---|---|
| 编号 | `task-2026-11-20-005-fujian-truth-rebuild` |
| Status | 已完成 |
| 类型 | docs |
| 目标分支 | develop-fujian |
| 影响范围 | `branches/fujian/design/**`（新建）、`branches/fujian/references/**`（新建）、`branches/fujian/README.md`、`SKILL.md`（Pointer Map 分支说明） |
| Roadmap | R1 的 fujian 平行实施 |
| 验收标准 | fujian 域自包含：design/ 3 份 + modules/ + references/ 5 份齐全，无「见 develop」的必要引用；代码未变的模块标注「与 develop 一致」；漂移模块按 diff 修订 |
| 前置依赖 | task-004（diff 清单与复核记录） |

## 目标

用户指示：fujian 下的 design 与 references 重建为完整真源，不引用 develop 域，避免每次跨域 diff。

## 方法

1. 以 `branches/develop/design/` + `references/` 为底本复制到 `branches/fujian/`
2. 代码完全一致的部分照搬，标注「与 develop 一致（2026-11-20 diff 验证）」
3. 漂移部分按 task-004 的 diff 清单修订（路由 18 条、modules 001/003/004/005、api-catalog 增 fujian 端点、reusable-capabilities extractFun 漂移标注）
4. fujian 独有模块建 modules/010-wireless-person-manager、011-professional-home-page

## 不做清单

- 不做漂移模块的全量深度重调研（如 new-project 2735 行逐行重读），漂移细节标「深度调研待任务驱动」
- 不动 branches/develop/ 域
- 不盘点 cdtl / unicom

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-20 | 用户（「fujian下面的 design 和 refs 如果可以就重建吧，不要引用dev了」） |
| ② 实现验收 | 已验收 | 2026-11-20 | 用户（「task 004 005 是不是可以归档了」） |

## 进度日志

### 2026-11-20

> - 立项并执行：基于 task-004 diff 清单重建 fujian 真源域
> - 完成：design/（3 份 + modules 001~009 复制并加 fujian 状态标注、新增 010-wireless-person-manager、011-professional-home-page）、references/（5 份复制并加 fujian 域标注，reusable-capabilities 修订 extractFun 漂移）、README/SKILL.md Pointer Map 更新为自包含域
> - 追加（用户指示）：`diff-vs-develop.md` 移除，其引用全部清理，差异信息保留在 README 摘要与各模块/真源的状态标注中
