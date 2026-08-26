---
name: "oss-demonstrate-project-context"
description: "维护 oss-metahuman-demonstrate-project 项目的根级上下文文件（仓库根下的 .pnpmfile.cjs 与 AGENTS.md）。Invoke when editing, creating, or syncing the repo-root .pnpmfile.cjs (pnpm dependency patching) or AGENTS.md (agent / contributor instructions), or when running the sync-symlinks.mjs script that mirrors these files between repo root and env/."
---

# 项目上下文文件管理 (oss-demonstrate-project-context)

在 `oss-metahuman-demonstrate-project` 项目中维护**仓库根级别的两个上下文文件**，通过本 skill 的 `env/` 目录作为权威源，并在仓库根建立符号链接。

## 适用场景

- 修改 `仓库根/.pnpmfile.cjs`（pnpm 依赖注入 / patch）
- 修改 `仓库根/AGENTS.md`（AI Agent / 贡献者说明）
- 新增其他需要由 skill 托管的仓库根上下文文件（编辑 `scripts/sync-symlinks.mjs` 的 `TARGETS`）
- 运行 `scripts/sync-symlinks.mjs` 在仓库根与 `env/` 之间建立 / 检查 / 修复 symlink

## 托管的文件

| 文件（仓库根路径） | 权威源（env/） | 作用 |
|---|---|---|
| `./.pnpmfile.cjs` | `env/.pnpmfile.cjs` | pnpm 安装期的依赖 patch（`hooks.readPackage`） |
| `./AGENTS.md` | `env/AGENTS.md` | AI Agent / 贡献者的项目约定说明 |

## 工作模式：env/ 为权威源

```
仓库根 /                ───symlink───►   skill env/ (权威源)
├── .pnpmfile.cjs  ────────────────────► env/.pnpmfile.cjs
└── AGENTS.md      ────────────────────► env/AGENTS.md
```

**所有修改都在 `env/` 下进行**；修改完后通过 `sync-symlinks.mjs` 确保仓库根的 symlink 指向正确。仓库根的 symlink 不直接编辑。

## 使用方式

### 首次接入 / 修复 symlink

```bash
node .trae/skills/oss-demonstrate-project-context/scripts/sync-symlinks.mjs
```

行为：
1. 若 `env/<file>` 不存在 → 跳过（提示先在 env/ 创建源文件）
2. 若仓库根已是正确 symlink → noop
3. 若仓库根是普通文件 → 先用其内容覆盖 `env/<file>`（防丢失），再删除并重建 symlink
4. 若仓库根本不存在 → 直接创建 symlink 指向 `env/<file>`

### 检查 symlink 状态

```bash
node .trae/skills/oss-demonstrate-project-context/scripts/sync-symlinks.mjs --check
```

### 生成状态快照

```bash
node .trae/skills/oss-demonstrate-project-context/scripts/sync-symlinks.mjs --status
# 写入 .trae/skills/oss-demonstrate-project-context/.local-symlink-status.json
```

### 移除 symlink（保留 env/ 真实文件）

```bash
node .trae/skills/oss-demonstrate-project-context/scripts/sync-symlinks.mjs --remove
```

## 新增托管文件

1. 把文件放到 `env/<file>`（权威源）
2. 在 `scripts/sync-symlinks.mjs` 的 `TARGETS` 数组里追加路径
3. 更新本 SKILL.md 的「托管的文件」表格
4. 跑一次脚本建立 symlink

## 注意事项

- Windows 上创建 symlink 通常需要「开发者模式」或管理员权限；若失败请开启后重试。
- 不要直接在仓库根编辑被托管的文件——所有修改都应在 `env/` 下进行，否则下次 sync 可能被覆盖（脚本会先把根普通文件拷贝回 env/ 再建 symlink）。
- 状态快照文件 `.local-symlink-status.json` 已通过 `.git/info/exclude` 排除，无需入库。

---

## 文档元信息

> 版本：v1.0.0
> 日期：2026-08-24
