# scripts/ · 机械 I/O

不为临时状态发明持久机制。只做 symlink / 校验类机械操作。

| 脚本 | 用途 |
| --- | --- |
| `sync-symlinks.mjs` | 将 skill 内约定路径 symlink 到项目标准入口 |
| `setup-rules.mjs` | 将 `env/rules/*.md` symlink 到 IDE rules 目录 |

```text
node scripts/setup-rules.mjs --target <项目根绝对路径>
node scripts/sync-symlinks.mjs --help
```

跳过 `README.md`；同名冲突不覆盖，交人工处理。
