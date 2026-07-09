# Bootstrap 检查清单

> 第一次给项目装上 `agents.md`（或整改存量项目）时，按此清单走。

## 第一步 · 摸底

- [ ] 读 `README.md` —— 项目是什么
- [ ] 看根目录文件 —— 单仓 / monorepo / 文档驱动
- [ ] 找包管理器：`package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` …
- [ ] 看 CI / 脚本：`.github/workflows/` / `Makefile` / `scripts/`
- [ ] 翻 git log 近 30 条 —— 项目活跃度、命名风格

> 跳过 `vendor/`、`node_modules/`、`dist/` 等无关目录。

## 第二步 · 跟用户对齐（必做，不要替用户决定）

- [ ] **文档布局**：用默认布局（`agents.md` + `research/` + `plans/` + `decisions/`），还是复用已有结构（如 `CONTEXT.md`、`docs/adr/`）？
- [ ] **`agents.md` 重点**：业务领域 / 团队约定 / 工具链 / 其他？
- [ ] **Agent 工作准则**：模板中的默认简版准则（落盘优先、防发散、基于原始代码、控制上下文、文档持续重构、深度对齐、测试先行、系统化调试）是否适用？需要增减哪些？如已安装 grill-me / tdd / diagnose 等 skill，可将对应简版替换为引用

## 第三步 · 写文件

- [ ] 创建 `agents.md`（用 [agents-md.template.md](./agents-md.template.md) 复制填写）
- [ ] 按需建空目录：`research/`、`plans/`、`decisions/`
- [ ] 在 `agents.md` 的"决策索引"里登记本次 bootstrap 决策
- [ ] （可选）把这次决策写进 `decisions/0001-bootstrap.md`

## 第四步 · 自检

- [ ] `agents.md` 里所有链接都能点开、不指向不存在的文件
- [ ] 空目录里有 `.gitkeep`（如果用了 git）
- [ ] 没有把"我自己也记不住"的细节写进 `agents.md` —— 那属于 `research/`
- [ ] 没有把"做了就回不去"的决策埋在 `agents.md` —— 必须落 `decisions/`
- [ ] `agents.md` 控制在合理长度 —— 过长会挤占 agent 上下文空间，细节拆到 `research/`
- [ ] 工作准则用速查表而非长文 —— agent 每次会话都要读这份文档，避免用大量 token 解决小问题

## 常见陷阱

| 陷阱                         | 症状                                          | 纠正                                                            |
| ---------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| `agents.md` 写成 README 副本 | agent 不知道在哪两个文档之间怎么选            | README = 给**人**看的索引；`agents.md` = 给 **agent** 看的索引  |
| 决策只写聊天记录             | 三个月后没人知道当时为什么选 X                | 不可逆 / 反直觉的决策一律落 `decisions/NNNN-*.md`               |
| 计划永远停在阶段一           | 团队 / agent 不知道做完什么样                 | 每个阶段必须有"完成的样子"；不达成就别勾                        |
| 调研笔记无限增长             | 翻不到结论                                    | 笔记必须有一句话结论；过期笔记加 `status: superseded-by-plan-X` |
| 套默认布局却没跟用户确认     | 项目已有 `CONTEXT.md`，又多出一份 `agents.md` | 第二步对齐不可省；已有等价物一律**复用**                        |
| 文档无限膨胀挤占上下文       | agent 读取效率下降，关键信息被噪音淹没        | 定期重构：过大的文件拆分或归档，`agents.md` 只放索引和概要      |
| 结论只停留在聊天里           | 换个会话就丢失，下个 agent 从零开始           | 一切结论落 `research/` / `plans/` / `decisions/`，不靠对话记忆  |
| 执行中发散到计划外           | 任务越做越多，原计划停滞                      | 偏离时先判断是否影响计划；是→更新计划，否→记笔记，当前任务继续  |

## Bootstrap 完成 ≠ 任务完成

`agents.md` 装上之后才算**开始**用本 skill。任何后续变更（feature / 重构 / 修 bug）都应走 `research → plan → maintain` 循环，并通过 `agents.md` 的索引让 agent 能找到上下文。
