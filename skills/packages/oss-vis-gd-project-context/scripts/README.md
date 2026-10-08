# scripts/ · 机械 I/O

不为临时状态发明持久机制。批处理 / 跨文件 / 校验类任务一律走 Node.js 脚本（rule `04-script-first-rule.md`，D-13）。

## 常驻脚本

| 脚本                 | 用途                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `sync-symlinks.mjs`  | 将 skill 内约定文件（`env/AGENTS.md`、`env/.pnpmfile.cjs`、`env/pnpm-workspace.yaml`）symlink 到项目根入口 |
| `setup-rules.mjs`    | 将 `env/rules/*.md` symlink 到 IDE rules 目录                                                              |
| `fix-rule4-paths.js` | 修正 rule 内脚本路径引用（2026-10-08 迁移后）                                                              |
| `scan-docs-links.js` | 扫描 docs/ 链接完整性                                                                                      |

```text
node scripts/setup-rules.mjs --target <项目根绝对路径>
node scripts/sync-symlinks.mjs --help
node scripts/scan-docs-links.js
```

## 历史脚本

保留供追溯，新任务不依赖。

- 2026-07（docs 骨架搭建）：`2026-07-29-bootstrap-five-major-center-spec.js`、`2026-07-29-copy-skills.js`、`2026-07-29-copy-specs-top.js`、`2026-07-29-copy-standards.js`、`2026-07-29-copy-workflows.js`、`2026-07-29-create-docs-skeleton.js`、`2026-07-29-fix-five-major-center-code-paths.js`、`2026-07-29-fix-five-major-center-doc-paths.js`
- 2026-08（归档）：`2026-08-03-archive-web-components-plans.js`
- 2026-10（迁移修复）：`2026-10-08-fix-migrated-doc-links.js`、`2026-10-08-rewrite-trae-documents-refs.js`

## 命名与要求

- 常驻：`<action>-<target>.js`；一次性：`YYYY-MM-DD-<purpose>.js`；示例：`example-<purpose>.js`
- 仅 Node 内置 API，无第三方依赖；幂等可重复执行
- try/catch + `process.exit(1)`；`path.resolve(__dirname, ...)` 锚定路径
- 跳过 `README.md`；同名冲突不覆盖，交人工处理
