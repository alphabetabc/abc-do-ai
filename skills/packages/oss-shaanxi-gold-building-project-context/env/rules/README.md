# env/rules/ · AI 助手级 Rules 集中源

> **定位**（§3.8.3 H10）：本目录是 **AI 助手自身**的工作规则集中源，**与项目级 `env/AGENTS.md` 严格分层**。
>
> - **项目级**（`AGENTS.md`）：项目本身的硬约束（架构 / 决策 / Do-Not）
> - **助手级**（`env/rules/*.md`）：AI 助手跨项目共享的工作纪律（memory / token / review / 检索触发）
>
> **部署方式**：由 `scripts/setup-rules.mjs`（详见 §3.8.1）批量 symlink 到各 IDE 入口（`.trae/rules/`、`.cursor/rules/`、`.claude/rules/` 等）。
>
> **何时更新**：直接编辑本目录文件即可；symlink 指向不变，**无需重新运行脚本**。Skill 升级时规则正文变化**必须由人工确认**后再部署。

---

## 文件命名

平铺命名，数字前缀 + kebab-case，例：`01-memory-usage.md`、`02-token-optimization.md`。

## 何时新增

- 多个项目共享的 AI 助手纪律
- 不属于某个项目独有的硬约束
- 想跨 IDE 复用（不写两份）

## 何时**不**该新增

- ❌ 项目独有的硬约束 → 进 `env/AGENTS.md §4 Do-Not`
- ❌ 业务决策 → 进 `design/`
- ❌ 任务跟踪 → 进 `plans/`

## Frontmatter 约定（跨 IDE 兼容）

每个 rule 文件**必须**以 YAML frontmatter 开头（4 家编辑器识别触发词都靠 frontmatter）：

```yaml
---
description: <触发描述 · ≤ 200 字 · 前 60 字含核心触发词>
alwaysApply: true   # 或 false（仅在 AI 判断相关时加载）
---

# 正文...
```

**字段说明**（按 4 家编辑器最小公共子集）：

| 字段 | 必需 | 适用编辑器 | 说明 |
| --- | --- | --- | --- |
| `description` | ✅ | Cursor / Trae / Qoder / CodeBuddy | 触发描述；用于 AI 判断加载时机 |
| `alwaysApply` | ⚠️ 建议 | Cursor / Trae / CodeBuddy | `true` = 始终加载；`false` = 模型决策 |
| `globs` | 可选 | Cursor / Qoder | 文件 glob 模式（仅匹配时加载） |
| `trigger` | 可选 | Qoder | `manual` / `model_decision` / `always` / `specific_files` |

> `setup-rules.mjs` 部署时**不改变后缀**（4 家编辑器均接受 `.md` + frontmatter）；只有当规则启用 `globs` 时，Cursor 才会要求 `.mdc` —— 这种情况下脚本需要把对应文件复制为 `.mdc` 副本。
>
> **跳过规则（脚本强制）**：① `README.md`（元文档）不部署；② 一级标题含「占位骨架」的文件不部署。冲突或创建失败时 **exit ≠ 0**。

## 骨架 vs 即用 rule（二元约定）

本目录的 rule 文件分两类，**元约定集中在本 README，单文件不重复**：

| 类型 | 标记 | frontmatter | setup-rules.mjs 行为 |
| --- | --- | --- | --- |
| **即用 rule** | 标题不含"占位骨架" | `alwaysApply` 按需（true / false） | **默认部署**到 IDE 入口 |
| **占位骨架** | 标题含"占位骨架" | description 标 `[SKELETON · 待填写]`，`alwaysApply: false` | **默认跳过**部署（等待填写完成） |

**判断规则**：标题里有"占位骨架" → 骨架；其他 → 即用。

## 当前规则清单

| 文件                            | 角色                  | 类型        |
| ------------------------------- | --------------------- | ----------- |
| `01-link-format.md`             | 链接格式规范（`alwaysApply: true`） | 即用 rule   |
| `02-no-hallucination.md`        | 反幻觉守则（v1.6 M7 落地） | 即用 rule   |
| `03-external-doc-approval.md`   | 外部文档修改审批守则（`alwaysApply: true`） | 即用 rule   |

> 数量与命名按项目需要扩展，**不预设上限**。
>
> **反幻觉守则（`06`）的特殊定位**：v1.6 起从 `env/AGENTS.md` 必备章节降级为 AI 助手级 rule，跨项目共享。项目如需项目级反幻觉加严（如"禁止引用未通过 type-check 的内部包"），写到 `env/AGENTS.md §4 Do-Not`，与本文件**正交叠加**。