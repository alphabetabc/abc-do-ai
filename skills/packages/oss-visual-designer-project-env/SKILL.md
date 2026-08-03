---
name: 'oss-visual-designer-project-env'
description: '管理 oss-visual-designer 项目的 pnpm-workspace.yaml 与 .pnpmfile.cjs 环境配置（按分支维护差异化依赖注入与覆盖规则），以及同步维护项目根目录 AGENTS.md（AI Agent 协作指南）。Invoke when 用户修改 workspace/pnpmfile 配置、切换分支环境、询问依赖注入规则、需要获取当前分支并匹配对应环境配置、或需要更新/校验 AGENTS.md 内容时。'
version: '1.2.0'
date: '2026-07-31'
---

# oss-visual-designer-project-env

管理 oss-visual-designer 项目的两类资产：

1. **分支环境配置**：`pnpm-workspace.yaml` 与 `.pnpmfile.cjs`，按分支维护差异化依赖注入与覆盖规则（见 §1-§6）
2. **AGENTS.md 同步**：项目根目录 `AGENTS.md`（AI Agent 协作指南），随项目演进同步更新规则、索引、禁止项（见 §7）

本文件仅作为索引入口，具体配置内容见 references。

---

## 1. 核心工作流

| 步骤 | 动作                                 | 说明                                             |
| ---- | ------------------------------------ | ------------------------------------------------ |
| 1    | 执行分支检查脚本                     | **硬性前置**，见 §3                              |
| 2    | 读取实际配置文件                     | `pnpm-workspace.yaml` + `.pnpmfile.cjs`          |
| 3    | 参考 `yarn.lock` 中的实际锁定版本    | **硬性约束**，见 §1.1                            |
| 4    | 与 references 文档逐行精确对比       | **禁止扫读**，见 §1.2                            |
| 5    | 用户确认后修改 + 同步更新 references | 修改实际文件并更新 `references/branch-<name>.md` |

### 1.1 yarn.lock 参考准则

修改 `overrides` 或 `.pnpmfile.cjs` 中的依赖版本前，**必须先查阅 `yarn.lock` 中该包的实际锁定版本**：

- `overrides` / 注入的版本应与 `yarn.lock` 中已验证可用的版本对齐，避免引入未经验证的新版本
- 若需要升级版本，先在 `yarn.lock` 中确认目标版本是否存在且已解析过
- `yarn.lock` 是历史依赖树的真实快照，优先级高于凭记忆/猜测设定版本

### 1.2 逐行精确对比准则

步骤 4 对比实际配置与 references 快照时，**必须逐行精确对比，禁止扫读/概括性判断"差不多一致"**：

- `overrides` / `allowBuilds` / `settings` / `packages` 每一项都要逐条核对，不能因"前一项存在"就默认"同类项已覆盖"（如 `react-router-dom` 存在不代表 `react-router` 也存在）
- `.pnpmfile.cjs` 的 `readPackage` 注入块要逐行对比，包括注释行、启用/禁用状态、版本号
- 对比结果要列出**具体差异行**（实际文件第 X 行 vs 快照第 Y 行），不能只说"一致"
- 发现差异时，先向用户报告差异点，确认后再同步更新 references 快照

> 历史教训：曾因扫读认为 `pnpm-workspace.yaml` 与快照"完全一致"，实际遗漏了用户新增的 `react-router: 5.2.0` 行。

---

## 2. 文件位置表

| 文件               | 路径（相对项目根目录）                                  | 类别        |
| ------------------ | ------------------------------------------------------- | ----------- |
| workspace 配置     | `pnpm-workspace.yaml`                                   | 分支环境    |
| pnpm hooks         | `.pnpmfile.cjs`                                         | 分支环境    |
| 依赖锁定快照       | `yarn.lock`                                             | 分支环境    |
| 本地依赖目录       | `.yalc/`、`.yalc/@*/*`、`packages/*`、`packages-next/*` | 分支环境    |
| 分支检查脚本       | `scripts/check-branch.mjs`                              | 分支环境    |
| AI Agent 协作指南  | `AGENTS.md`                                             | AGENTS.md   |
| 权威设计文档       | `.trae/documents/design/designer-state/`                | AGENTS.md   |
| 已删除 API 速查    | `.trae/documents/design/designer-state/05-deleted-api.md` | AGENTS.md |
| 分支配置文档       | `references/branch-<name>.md`                           | references  |
| 公共配置文档       | `references/_common.md`                                 | references  |
| AGENTS.md 同步参考 | `references/agents-md-sync.md`                          | references  |

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

| 分支 / 类别              | 文档                                          | 状态      |
| ------------------------ | --------------------------------------------- | --------- |
| （公共）                 | `references/_common.md`                       | ✅ 已维护 |
| `release-shaanxi-unicom` | `references/branch-release-shaanxi-unicom.md` | ✅ 已维护 |
| `develop`                | `references/branch-develop.md`                | ✅ 已维护 |
| AGENTS.md 同步           | `references/agents-md-sync.md`                | ✅ 已维护 |

---

## 5. 目录结构图

```
oss-visual-designer-project-env/
├── SKILL.md                  # 本文件（入口索引）
├── scripts/
│   └── check-branch.mjs      # 分支检查脚本（Node.js ESM）
└── references/
    ├── _common.md            # 公共配置（各分支共享）
    ├── branch-<name>.md      # 各分支专属配置（引用 _common.md）
    └── agents-md-sync.md     # AGENTS.md 同步维护参考（快照 + 触发点 + 校验）
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

---

## 7. AGENTS.md 同步维护

> 维护项目根目录 `AGENTS.md`（AI Agent 协作指南）。详细规则见 [`references/agents-md-sync.md`](./references/agents-md-sync.md)。

### 7.1 何时触发

以下事件发生时，**必须**检查 AGENTS.md 对应章节（完整触发点表见 `agents-md-sync.md` §3）：

- 完成 task（归档到 `plans/done/`）→ 检查 §7 测试 / §10.2 禁止项
- 删除 API → 检查 §10.2 禁止项 / §9.1 幻觉场景
- 新增 / 删除 slice → 检查 §5 slice 清单
- 新增 / 删除路径别名 → 检查 §4.2 别名表
- 新增 / 删除 `.trae/documents/` 文档 → 检查 §8 文档表
- 测试框架 / 覆盖现状变化 → 检查 §7

### 7.2 维护工作流

1. **识别触发点**：根据 `agents-md-sync.md` §3 判断需检查的章节
2. **读取实际 AGENTS.md**：读取项目根目录 `AGENTS.md` 对应章节
3. **读取权威源**：读取代码 / `.trae/documents/` 文档确认最新事实
4. **逐行对比**：实际 AGENTS.md 与 `agents-md-sync.md` §4 快照 + 权威源逐行对比（**禁止扫读**，见 §1.2）
5. **报告差异**：列出具体差异行（实际文件第 X 行 vs 快照第 Y 行）
6. **用户确认**：向用户报告差异，询问是否更新
7. **修改 + 同步**：用户确认后修改 AGENTS.md，并同步更新 `agents-md-sync.md` §4 快照

### 7.3 修改约束

- **编码**：必须 UTF-8。**禁止** PowerShell `Set-Content`（破坏中文，见项目规则 §6），用 Edit / Write 工具
- **链接**：文档内文件链接用**相对路径**，禁止 `file:///` 绝对路径（AGENTS.md §8 规定）
- **不承载事实**：AGENTS.md 只做索引 + 规则，业务事实写在 `.trae/documents/`，AGENTS.md 只引用
- **事实优先级**：AGENTS.md §9.2 明确——代码 > `.trae/documents/` > AGENTS.md。冲突时以代码为准，再回写 AGENTS.md

### 7.4 关键快照（完整版见 agents-md-sync.md §4）

- **§5 Redux Store**：5 个 slice（app / component / viewCanvas / viewUI / designerCanvas），`whitelist = []`
- **§4.2 路径别名**：7 个别名，`@Configs/*` 是死别名
- **§7 测试**：vitest 4.1，72 个用例
- **§10.2 已删除 API**：`useDesigner` / `getFieldConf` / `mergeByIdIntoTree` / `getSaveableComponents` 等
- **§3.1 designer-state**：8 份文档（00-README ~ 07-view-slices）

### 7.5 校验清单

修改 AGENTS.md 后自检（完整清单见 `agents-md-sync.md` §6）：

- [ ] 修改的章节是否对应 §3 触发点？
- [ ] 是否用 Edit / Write 工具修改（非 PowerShell `Set-Content`）？
- [ ] 文件内链接是否为相对路径（无 `file:///`）？
- [ ] 引用的 `.trae/documents/` 文档是否真实存在（用 Glob 验证）？
- [ ] 引用的源码路径是否真实存在？
- [ ] 是否避免复制权威文档内容（只做索引 + 规则）？
- [ ] `agents-md-sync.md` §4 快照是否同步更新？
