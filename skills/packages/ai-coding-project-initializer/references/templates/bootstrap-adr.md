# 0001 — Bootstrap 文档骨架

## 背景

{PROJECT_NAME} 需要一套文档驱动 AI Coding 的骨架，让 agent 与人都能按同一套文档协作。

## 决策

采用 ai-coding-project-initializer skill 的默认布局：

- 根级 `AGENTS.md` 作为 Agent 协作宪法
- `docs/design/` 作为全局设计单一事实来源
- `docs/specs/` 作为特性级 SDD 目录（含五件套模板）
- `docs/research/` 作为调研备忘
- 三条铁律：① 没写清不让大改；② 文档与代码同批；③ 禁止臆造

## 后果

- 新特性必须先在 `docs/specs/index.md` 登记才能开工
- 契约变更必须先改 `docs/design/` 再改代码
- `AGENTS.md` 需要保持精简，细节拆到 `docs/` 按需读取
