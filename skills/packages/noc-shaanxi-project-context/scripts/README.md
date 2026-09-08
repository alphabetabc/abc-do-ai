# scripts/ · 机械 I/O

不为临时状态发明持久机制。只做 symlink / 校验类机械操作。

| 脚本 | 用途 |
| --- | --- |
| `sync-symlinks.mjs` | 将 `env/AGENTS.md`、`env/.pnpmfile.cjs` symlink 到项目根 |
| `setup-rules.mjs` | 将 `env/rules/*.md` symlink 到 `.trae/rules` |

```text
# 同步项目根入口（AGENTS.md / .pnpmfile.cjs）
node scripts/sync-symlinks.mjs --target <项目根绝对路径>

# 部署 IDE rules（默认 .trae/rules，可 --dirs 扩展）
node scripts/setup-rules.mjs --target <项目根绝对路径>

# 只做健康校验（不创建）
node scripts/sync-symlinks.mjs
node scripts/setup-rules.mjs --target <项目根绝对路径> --dry-run
```

跳过 `README.md`；同名冲突不覆盖，交人工处理（`--force` 可强制覆盖）。
