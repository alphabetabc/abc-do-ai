---
name: 'oss-visual-designer-project-env'
description: '管理 oss-visual-designer 项目的 pnpm-workspace.yaml 与 .pnpmfile.cjs 环境配置，按分支维护差异化依赖注入与覆盖规则。Invoke when 用户修改 workspace/pnpmfile 配置、切换分支环境、询问依赖注入规则、或需要获取当前分支并匹配对应环境配置时。'
version: '1.1.0'
date: '2026-07-23'
---

# oss-visual-designer-project-env

管理 oss-visual-designer 项目的 `pnpm-workspace.yaml` 与 `.pnpmfile.cjs`，按分支维护差异化依赖注入与覆盖规则。本文件仅作为索引入口，具体配置内容见 references。

---

## 1. 核心工作流

| 步骤 | 动作                                 | 说明                                             |
| ---- | ------------------------------------ | ------------------------------------------------ |
| 1    | 执行分支检查脚本                     | **硬性前置**，见 §3                              |
| 2    | 读取实际配置文件                     | `pnpm-workspace.yaml` + `.pnpmfile.cjs`          |
| 3    | 参考 `yarn.lock` 中的实际锁定版本    | **硬性约束**，见 §1.1                            |
| 4    | 与 references 文档对比               | 核对 overrides / readPackage 注入项              |
| 5    | 用户确认后修改 + 同步更新 references | 修改实际文件并更新 `references/branch-<name>.md` |

### 1.1 yarn.lock 参考准则

修改 `overrides` 或 `.pnpmfile.cjs` 中的依赖版本前，**必须先查阅 `yarn.lock` 中该包的实际锁定版本**：

- `overrides` / 注入的版本应与 `yarn.lock` 中已验证可用的版本对齐，避免引入未经验证的新版本
- 若需要升级版本，先在 `yarn.lock` 中确认目标版本是否存在且已解析过
- `yarn.lock` 是历史依赖树的真实快照，优先级高于凭记忆/猜测设定版本

---

## 2. 文件位置表

| 文件           | 路径（相对项目根目录）                                  |
| -------------- | ------------------------------------------------------- |
| workspace 配置 | `pnpm-workspace.yaml`                                   |
| pnpm hooks     | `.pnpmfile.cjs`                                         |
| 依赖锁定快照   | `yarn.lock`                                             |
| 本地依赖目录   | `.yalc/`、`.yalc/@*/*`、`packages/*`、`packages-next/*` |
| 分支检查脚本   | `scripts/check-branch.mjs`                              |
| 分支配置文档   | `references/branch-<name>.md`                           |
| 公共配置文档   | `references/_common.md`                                 |

---

## 3. 执行前检查（分支校验）

**完整命令**：

```bash
node scripts/check-branch.mjs [选项]
```

**参数表**：

| 参数              | 说明                                            |
| ----------------- | ----------------------------------------------- |
| `--branch <name>` | 自定义期望分支（默认 `release-shaanxi-unicom`） |
| `-y, --yes`       | 非交互模式，不询问直接继续                      |
| `-h, --help`      | 显示帮助                                        |

**脚本行为**（5 步）：

1. 通过 `git rev-parse --abbrev-ref HEAD` 获取当前分支
2. 与期望分支（默认 `release-shaanxi-unicom`）对比
3. 匹配：打印 `✅ 分支匹配`，退出码 0
4. 不匹配：列出风险项 → 询问 `是否仍要继续？(y/N)` → `y/Y` 继续（退出码 0），其他取消（退出码 1）
5. git 不可用：报错并退出码 1

> 非 TTY 环境且未传 `--yes` 时，直接退出码 1。

---

## 4. References 索引表

| 分支                     | 文档                                          | 状态      |
| ------------------------ | --------------------------------------------- | --------- |
| （公共）                 | `references/_common.md`                       | ✅ 已维护 |
| `release-shaanxi-unicom` | `references/branch-release-shaanxi-unicom.md` | ✅ 已维护 |
| `develop`                | `references/branch-develop.md`                | ✅ 已维护 |

---

## 5. 目录结构图

```
oss-visual-designer-project-env/
├── SKILL.md                  # 本文件（入口索引）
├── scripts/
│   └── check-branch.mjs      # 分支检查脚本（Node.js ESM）
└── references/
    ├── _common.md            # 公共配置（各分支共享）
    └── branch-<name>.md      # 各分支专属配置（引用 _common.md）
```

---

## 6. 分支扩展策略

未来需要支持新分支（feature/release/main 等）：

1. 切换到目标分支
2. 复制 `references/branch-develop.md` 为 `references/branch-<新分支名>.md`
3. 仅更新分支专属内容（目标分支信息、`.pnpmfile.cjs` 快照、注入说明表、`@fedx-vis/*` 状态、版本校验提示）
4. 公共内容无需修改，自动引用 `_common.md`
5. 在 §4 References 索引表追加一行
6. 使用 `check-branch.mjs --branch <新分支名>` 校验
