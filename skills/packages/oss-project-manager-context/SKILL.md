---
name: oss-project-manager-context
description: 项目治理骨架：加载 design/ 意图层与 plans/ 计划层。触发：项目治理 / 加载项目上下文 / 当前计划索引 / backlog。
---

# oss-project-manager-context Skill

加载上下文时读当前计划索引文件，按 Pointer Map 加载对应文件。

## 分支感知（必读）

代码真相文档按 git 分支分域存放于 `branches/<branch>/`（design/ + references/）。使用规则：

1. 用户声明的当前分支为基准分支（未声明时视为 `develop`）。
2. 从 `branches/<当前分支>/` 读取真相；该分支目录不存在时，以 `branches/develop/` 为基线，并提示「该分支差异未记录，涉关键结论须现场 Read 代码验证」。
3. **fujian 域已自包含（2026-11-20，task-005）**：`branches/fujian/` 下 design/ + references/ 为完整真源，直接读取，不回指 develop。其余客户分支（cdtl / unicom）仅记差异，不复制主干内容。
4. plans/、pm/、templates/ 为跨分支共享的工作流域，任务卡须带 `branch:` 字段标明目标分支。

## Pointer Map

```text
branches/develop/   主干真相：design/ + references/
branches/fujian/    福建分支完整真源（自包含：design/ + references/）
plans/              current-sprint · backlog · roadmap · templates/（跨分支）
pm/                 需求原始材料（跨分支）
```

| 场景 | 引用文件（以 B = `branches/<当前分支>/`，未建则 `branches/develop/`） |
| --- | --- |
| 北极星 / 禁止清单 | `B/design/vision.md` |
| 技术栈 / 模块边界 / 仓库结构 / 路由 / 构建链 | `B/design/architecture.md` |
| 用户旅程 | `B/design/user-story-map.md` |
| 页面模块深度调研（六要素真源） | `B/design/modules/NNN-<module>/overview.md` |
| 客户分支与主干差异 | `branches/<customer>/README.md` 及其下差异文档 |
| 查「某事实的权威文件在哪」 | `B/references/source-truth-map.md` |
| 接口端点 / sqlId / baseUrlType | `B/references/api-catalog.md` |
| 枚举 / 字典 / 常量取值 | `B/references/enum-and-dictionary.md` |
| 可复用能力（导出/定时器/审批/网元选择等） | `B/references/reusable-capabilities.md` |
| 需求归属判定（前端/后端/联调） | `B/references/scope-classification-rules.md` |
| 节奏 / 优先级 | `plans/roadmap.md` |
| 当前任务索引 | `plans/current-sprint.md` |
| 待办池 + [REJECTED] | `plans/backlog.md` |
| 任务卡模板 | `plans/templates/task-template.md` |

## 维护节奏

free：不定期，随任务驱动。任务产生新认知时落对应文件，不设固定刷新周期。

## 版本

- version: 0.2.0
- 更新时间：2026-11-19
