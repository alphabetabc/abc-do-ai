# scripts/ · 机械 I/O

不为临时状态发明持久机制。只做 symlink / 校验类机械操作。symlink 一律用相对路径，可移植。

> 蒸馏流程与规则的权威描述见 `../references/distill-workflow.md`，本 README 只讲脚本用法。

| 脚本 | 用途 |
| --- | --- |
| `setup-rules.mjs` | 将 `env/rules/*.md`（跳过 README）symlink 到 `.trae/rules/` |
| `sync-symlinks.mjs` | 将 `env/AGENTS.md` symlink 到 `.trae/AGENTS.md`（根 AGENTS.md 是治理权威，不覆盖） |
| `distill-core/` | **蒸馏工作流唯一入口**（分析能力只此一份）：`lib`（开库/路径锚定/ALIAS）、`profile-core`（分析规则库：import 分类/AST Props/归一化 hash/相似度/重依赖白名单/内联映射，禁止在别处重写）、`survey`（工作流1 批量评价，直接入库）、`profile`（工作流2 单体画像入库）、`sync-status`（对账）、`query`（stdout 查询）、`view`（本地只读 HTML 视图：`node view.mjs [端口]` → http://localhost:8899，三表浏览 + 状态分布 + 行详情）。一律在物料站仓库根运行（`process.cwd()` 锚定） |

```text
node scripts/setup-rules.mjs --target <项目根绝对路径> [--dirs <dir1,...>] [--dry-run]
node scripts/sync-symlinks.mjs --target <项目根绝对路径> [--entry <路径>] [--force]
# 蒸馏工作流命令：见 ../research/README.md（distill-core 包，物料站仓库根运行）
```

预归类信号（survey，置信度递减）：重依赖白名单→D；与已蒸馏物料同名→A；import ≥2 个已蒸馏 ui 物料→A；Box+detail-modal 组合模式→A；相似度 ≥0.8 且体量足够→C（极小同构降 A）；跨中心同名多版本→C；纯 react 无可复用子组件/Placeholder→D；其余→B 低置信（建议精读）。

跳过 `README.md`；同名冲突不覆盖，交人工处理。
