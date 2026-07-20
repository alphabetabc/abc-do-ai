# Superpowers 技能族速查

> 原则：**可能适用就先加载技能**；用户指令优先于技能教条。
> 不强制安装——团队环境未配置时可跳过，流程仍按本 skill 的文档骨架执行。

## 新项目主路径相关（9 项）

| 技能                                               | 用在新项目的何时                                     |
| -------------------------------------------------- | ---------------------------------------------------- |
| `using-superpowers`                                | 任何任务前：先发现并加载该用的技能                   |
| `brainstorming`                                    | 阶段 ①–②：澄清意图、方案权衡；未批准设计前不开战写码 |
| `writing-plans`                                    | 五件套前后：把 plan/tasks 落成可执行步骤             |
| `test-driven-development`                          | 阶段 ⑥：红 → 绿 → 重构                               |
| `executing-plans` / `subagent-driven-development`  | 按计划推进、可拆分的并行任务                         |
| `systematic-debugging`                             | 实现期缺陷：先取证再改                               |
| `verification-before-completion`                   | 宣称完成前：跑验证、给证据                           |
| `requesting-code-review` / `receiving-code-review` | MR 前后审查节奏                                      |
| `using-git-worktrees`                              | 需要隔离实验分支时                                   |

## 历史变更相关（5 项）

| 技能                             | 用在历史变更时                     |
| -------------------------------- | ---------------------------------- |
| `systematic-debugging`           | 复现、取证、定位根因——先证据后改   |
| `test-driven-development`        | 回归：先锁行为再改                 |
| `verification-before-completion` | 宣称完成前跑验证、给证据           |
| `brainstorming`                  | 方案有多条改法、影响面不清时先澄清 |
| `using-git-worktrees`            | 隔离实验分支时                     |

## Frontend Design（前端设计技能）

当任务涉及**新页面、营销/落地、显著 UI 改版**时，启用 `frontend-design`：

- 避免千篇一律的「AI 味」布局与配色套路
- 在**已有设计系统 / 管理后台 Shell**内工作时：以产品与 `docs/design` 的 Shell/主题约定为准，技能服从现有体系
- 与 PM assets、spec「界面与交互」对齐，不凭空发挥
- 历史变更场景：仅当 to-be **明确包含**显著 UI 变更；禁止借机整站换皮
