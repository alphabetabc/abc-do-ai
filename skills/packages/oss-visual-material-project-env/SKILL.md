---
name: 'oss-visual-material-project-env'
description: 'Maintains pnpm workspace config (pnpm-workspace.yaml) and pnpm hooks (pnpmfile.cjs) for the oss-visual-material project. Invoke when user wants to modify workspace packages, overrides, local tarball fetchers, dependency injection, or build settings.'
---

# oss-visual-material-project-env

> 维护 oss-visual-material 项目的 pnpm 配置文件：`pnpm-workspace.yaml` 与 `.pnpmfile.cjs`。本文档为入口索引，详细配置、字段说明、操作指南、依赖关系、安装指令、版本校验提示等全部在 `references/` 目录中按分支维护。

## 核心工作流

**调用本 skill 前，必须先执行分支检查脚本（步骤 1）。**

| 步骤 | 操作                                                   | 说明                                 |
| ---- | ------------------------------------------------------ | ------------------------------------ |
| 1    | 执行分支检查脚本                                       | 见下方「执行前检查」                 |
| 2    | 读取 `pnpm-workspace.yaml` 和 `.pnpmfile.cjs` 实际内容 | 与当前分支的 references 文档对比     |
| 3    | **以 `yarn.lock` 为准校验版本**                        | 与 `yarn.lock` 中已解析的版本对照，发现差异时主动汇报 |
| 4    | 检查实际配置与 references 是否一致                     | 不一致则向用户报告差异并询问是否更新 |
| 5    | 用户确认后再修改实际配置文件                           | 同步更新 references 文档             |

> **准则**：本 skill 所有版本判断必须以 `yarn.lock` 中实际解析的版本为最终依据。references 中记录的版本号必须能与 `yarn.lock` 对得上；如对不上，要么以 `yarn.lock` 为准更新 references，要么作为「版本校验提示」单独记录差异及处理策略。 |

---

## 文件位置

| 文件                        | 路径                                |
| --------------------------- | ----------------------------------- |
| workspace 配置              | `pnpm-workspace.yaml`（项目根目录） |
| pnpm hooks                  | `.pnpmfile.cjs`（项目根目录）       |
| 本地 tarball 目录（默认）   | `.local-deps/`                      |
| 本地 tarball 目录（自定义） | `deps/`                             |
| 分支检查脚本                | `scripts/check-branch.mjs`          |
| 分支配置文档                | `references/branch-<name>.md`       |

---

## 执行前检查（分支校验）

```bash
node .trae/skills/oss-visual-material-project-pnpm/scripts/check-branch.mjs
```

参数：

| 参数              | 说明                             |
| ----------------- | -------------------------------- |
| `--branch <name>` | 自定义期望分支（默认 `develop`） |
| `-y, --yes`       | 分支不匹配时不询问直接继续       |
| `-h, --help`      | 显示帮助                         |

脚本行为：

1. 通过 `git rev-parse --abbrev-ref HEAD` 获取当前分支
2. 与期望分支（默认 `develop`）对比
3. **匹配**：返回 `✅ 分支匹配`，退出码 0
4. **不匹配**：列出风险项，询问用户是否继续；输入 `y/Y` 继续，其他取消
5. **git 不可用**：报错退出

> 脚本使用 Node.js ES Modules（`.mjs`）编写，跨平台（Windows/macOS/Linux）通用。这是 skill 唤起前的硬性前置步骤，必须先执行通过再进入后续流程。

---

## References（按分支）

| 分支              | 文档                                                         | 说明                                                                                 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `develop`（默认） | [references/branch-develop.md](references/branch-develop.md) | develop 分支完整配置：配置快照、字段说明、操作指南、依赖关系、安装指令、版本校验提示 |

> 如未来需要为其他分支（如 `feature/*`、`release/*`、`main`）维护独立配置，按以下步骤扩展：
>
> 1. 新建 `references/branch-<name>.md`
> 2. 通过 `--branch <name>` 参数调用检查脚本指向对应分支
> 3. 在本表格中添加新分支文档链接

---

## 目录结构

```
.trae/skills/oss-visual-material-project-pnpm/
├── SKILL.md                              # 本文件：入口索引
├── scripts/
│   └── check-branch.mjs                  # 分支检查脚本（Node.js ES Modules）
└── references/
    ├── branch-develop.md                 # develop 分支完整配置（默认）
    └── branch-<name>.md                  # 其他分支（按需扩展）
```
