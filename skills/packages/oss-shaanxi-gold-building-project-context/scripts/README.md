# scripts/

| 脚本 | 功能 | 运行时机 |
| --- | --- | --- |
| `sync-symlinks.mjs` | 将 env/AGENTS.md、env/rules 等 symlink 到宿主入口（项目根等） | 手动，按需 |
| `setup-rules.mjs` | 初始化 rules 相关配置 | 手动，按需 |

说明：

- 均为机械 I/O 脚本，不含 LLM 逻辑；摘要 / 分析等智能任务由 AI 用宿主工具完成。
- 安装 skill 时不会自动执行；同名入口已存在时直接报错，交人工处理。
