# scripts/ · 机械 I/O

不为临时状态发明持久机制。只做 symlink / 校验类机械操作。

| 脚本 | 用途 |
| --- | --- |
| `sync-symlinks.mjs` | `env/AGENTS.md` → 仓库根 `AGENTS.md` + `.agents/skills/oss-vis-gd-es-project-context/env/` 镜像；`env/rules/*.md` → 镜像 `env/rules/` |
| `setup-rules.mjs` | 将 `env/rules/*.md` symlink 到 IDE rules 目录（.trae / .cursor / .claude） |

```text
node scripts/sync-symlinks.mjs [--target <项目根绝对路径>] [--force]
node scripts/setup-rules.mjs --target <项目根绝对路径> [--dirs .trae/rules] [--dry-run]
```

- 跳过 `README.md`；同名冲突不覆盖（`--force` 例外），交人工处理
- Windows symlink 可能报假错（ENOENT/EEXIST 但实际已建成）：脚本以创建后健康校验为准
