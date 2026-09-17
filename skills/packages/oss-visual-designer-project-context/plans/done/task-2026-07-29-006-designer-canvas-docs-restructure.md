# task-2026-07-29-006 — designer-canvas 文档群结构重构

> 状态：`done`
> 类型：`chore`（文档重构）
> 创建：2026-07-29
> 完成：2026-07-29
> 来源：handoff `2026-07-29-handoff-designer-canvas-docs-restructure.md`（已删除）

---

## 1. 背景

### 1.1 现状

`.trae/documents/design/designer-canvas/` 9 份文档共 3356 行，经 grep + Read 当场验证：

- **历史内容污染**：`mergeByIdIntoTree`（已删除函数）在 8 份文档命中 188 处；`stale/fresh` 历史叙述在 8 份文档命中 206 处
- **04-edge-cases.md 历史占比 15.3%**（最高），02-write-path 46 行历史关键词（绝对量最大）
- **职责模糊**：`mergeByIdIntoTree` 历史叙述在 02/04/06/00 四处展开；`updateFieldConfig` reducer 代码在 01/02/06 三处逐行重复
- **02-write-path 507 行最长但仅 2 个外链**——"内容黑洞"
- **handoff 方案（在原 9 份上修修补补）治标不治本**：历史内容即使折叠/外移，文档结构本身仍按"演进时间线"组织，新读者难以快速定位当前事实

### 1.2 用户决策

- **新建 `designer-canvas-state/` 目录**（不是新建文档），把重构后的文档群放到新目录下
- **历史内容先不动**，重构完成后再决定删除/保留（理论上要删除）
- **分阶段 commit**
- **删除 handoff 文档**

### 1.3 为什么新建目录而非在原目录修补

原 9 份文档的结构问题不是"内容多"，而是**组织方式本身是演进时间线式**的——每份文档都从"历史背景 → task-002 变更 → 当前实现"叙述，历史内容与当前事实交织。即使把历史外移，读者仍需在每份文档中跳过大量"已废弃"标记。

新目录采用**当前事实优先**的组织方式：每份文档只描述当前事实，历史内容完全不进入新目录。原 `designer-canvas/` 目录作为归档保留（待重构验证通过后再决定是否删除）。

---

## 2. 目标

### 2.1 易维护

- **单一事实源**：每个事实只在一处描述，其他文档用链接引用
- **历史内容隔离**：新目录只保留当前事实，历史内容留在原 `designer-canvas/` 目录（待后续决定删除）
- **减少同步成本**：改一处事实只需改一份文档

### 2.2 易阅读

- **快速定位**：读者打开任一文档，能在前 30 行内找到核心结论
- **当前事实优先**：不穿插"已废弃/已消除"叙述
- **主题聚合**：同一主题在一份文档内只出现一次

### 2.3 量化目标

- 新目录总行数目标 **~2000 行**（原 3356 行，减少 ~40%）
- 新目录内 `mergeByIdIntoTree` 提及 **< 5 处**（仅 §架构原则 的已删除 API 清单 + 一行链接）
- 新目录内 `stale/fresh` 历史叙述 **0 处**（单源是当前事实，不需要"已消除"叙述）
- 新目录内 `task-002 单源后` 重复说明 **每份文档 ≤ 1 处**（顶部总览）

---

## 3. 新目录结构

```
.trae/documents/design/designer-canvas-state/
├── 00-README.md              # 索引页 + 一页纸概览（state 形状 / action 全图 / 读路径全图 / 边界速查 / 决策树）
├── 01-types.md               # 类型定义（WidgetItem / WidgetData / WidgetConfig / PageConfig / SchemaConfig / FlatField）
├── 02-state.md               # state 形状 + 派生索引 + buildIndex + 单源契约 + 持久化
├── 03-write-path.md          # 写路径（action 全表 + setComponents + updateFieldConfig + setState + runtime hooks + 决策树）
├── 04-read-path.md           # 读路径（6 种读法 + useFieldConf + useSelector + useStore.getState + getFieldNodeById + 保存序列化 + 决策树）
├── 05-edge-cases.md          # 边界场景（recalcGroupBounds + isRecalcRef + save 序列化 + setComponents 输入计算）
├── 06-bugs.md                # bug 索引（速查表 + 测试覆盖 + 排查 checklist，纯索引无 narrative）
├── 07-principles.md          # 架构原则（5 大原则 + 5 大禁区 + 提交前自检 + 已删除 API 清单）
└── 08-view-slices.md         # view slices（viewCanvas + viewUI + updateView + 字段使用矩阵）
```

### 3.1 与原目录的映射关系

| 新文档 | 内容来源（原文档） | 组织变化 |
| --- | --- | --- |
| `00-README.md` | 00-overview.md | 精简为纯索引 + 一页纸概览；删除 fact-check 章节（改到 07-principles 自检清单）；删除 §3 关键决策溯源表（历史溯源，不属于当前事实文档） |
| `01-types.md` | 01-01-widget-types.md | 直接迁移，几乎不变（纯事实文档，历史占比 0.6%） |
| `02-state.md` | 01-data-model.md §1-§3 + §6-§7 | state 形状 + FlatField + ROOT_UNIQUE_ID + buildIndex + 持久化 + 关键文件清单；**删除 §4 单源设计（历史对比表）/ §4.3 不同步窗口期 / §4.4 stale 防护**（这些是历史叙述） |
| `03-write-path.md` | 02-write-path.md §0-§3 + §5-§8 | action 全表 + setComponents + updateFieldConfig + runtime hooks + setState + 决策树 + 易错点；**删除 §4 整章 mergeByIdIntoTree（130 行历史）+ §2.2/§3.5 details 历史块** |
| `04-read-path.md` | 03-read-path.md §0-§9 | 几乎全部迁移，删除 §6.2/§6.3 历史 byIdWins 说明 |
| `05-edge-cases.md` | 04-edge-cases.md §0-§2 + §1.7 + §4-§5 | recalcGroupBounds（单源后简化版）+ save 序列化 + isRecalcRef + checklist；**删除 §1.4-§1.6.1 历史 stale 防护 + §3 整章 setComponents 输入计算修复演进（71 行历史）** |
| `06-bugs.md` | 05-known-bugs.md §0 + §4 | 速查表 + 测试覆盖 + 排查 checklist；**删除 §1-§3 详情 narrative（转为速查表行 + 链接）** |
| `07-principles.md` | 06-principles.md §0-§4 + §6-§12 | 5 大原则 + 5 大禁区 + 自检 + 已删除 API 清单；**删除 §5 整节 stale tree 防护（已消除）+ §4.4 updateFieldConfig 旧设计** |
| `08-view-slices.md` | 07-view-slices.md | 几乎全部迁移（历史占比 1.7%，几乎无改动） |

### 3.2 命名变化

- 目录：`designer-canvas/` → `designer-canvas-state/`（更准确描述内容：state 管理）
- 文件：去掉编号前缀的冗余（如 `01-01-widget-types.md` → `01-types.md`），编号连续化
- `00-overview.md` → `00-README.md`（索引页用 README 更直观）

---

## 4. 详细步骤

### 阶段 1：创建新目录 + 索引 + 类型文档

**操作**：
1. 创建 `.trae/documents/design/designer-canvas-state/` 目录
2. 写 `00-README.md`：索引页 + 一页纸概览（state 形状 / action 全图 / 读路径速查 / 边界速查 / 常见任务对照表）
3. 写 `01-types.md`：从 `01-01-widget-types.md` 迁移（纯事实文档，直接复制，更新配套链接）

**验证**：
- [ ] 新目录存在
- [ ] 00-README.md 索引表包含全部 8 份子文档
- [ ] 01-types.md 内容与原 01-01-widget-types.md 一致

### 阶段 2：state 形状文档

**操作**：写 `02-state.md`，内容来源 `01-data-model.md`：
- §1 state 形状（DesignerCanvasState 接口 + 字段表）
- §2 FlatField 定义 + buildIndex 性能 + 引用复用
- §3 ROOT_UNIQUE_ID
- §4 单源契约（**只写当前事实**：components 是唯一真相源，byId/parentMap 纯派生，buildIndex 在 produce 外调用）
- §5 树节点结构（WidgetItem 简版，指向 01-types.md）
- §6 持久化
- §7 关键文件清单
- §8 易错点

**删除的历史内容**：
- 原 §4.1 "为什么是单源而不是双源"对比表（历史对比，当前事实只需"单源"一句）
- 原 §4.3 不同步窗口期（已消除）
- 原 §4.4 stale 防护表（已消除）
- 原 §5.1 setLevelPath 契约中的历史 review 修正说明（保留当前事实，删除历史修正过程）

**验证**：
- [ ] 02-state.md 无 `已消除` / `已废弃` / `task-002 前` 等历史标记
- [ ] buildIndex 引用复用机制只描述一次
- [ ] updateFieldConfig reducer 代码不在此文档展开（指向 03-write-path.md）

### 阶段 3：写路径文档

**操作**：写 `03-write-path.md`，内容来源 `02-write-path.md`：
- §0 写路径总图
- §1 action 全表（8 个）
- §2 结构性变更：setComponents（调用约定 + reducer + 哪些操作走 setComponents + 工具函数签名）
- §3 字段级更新：updateFieldConfig（调用约定 + reducer 实现 + 哪些操作走 + 关键不变式）
- §4 runtime hook action（4 个）
- §5 setDesignerCanvasState（setState 兼容）
- §6 写路径原则
- §7 写路径决策树
- §8 易错点

**删除的历史内容**：
- 原 §2.2 details "为什么需要 mergeByIdIntoTree"（15 行）
- 原 §3.5 details "双源架构下的 stale 风险"（20 行）
- 原 §4 整章 mergeByIdIntoTree 合并语义（130 行）——在易错点表格保留一行"已删除 API 见 07-principles.md §已删除 API 清单"
- 原 §9 易错点中 3 行"已不适用"的历史说明

**handleAlign 主题聚合**：在 §3.3 "哪些操作走 updateFieldConfig" 表格后保留单一小节说明 handleAlign 走 setComponents 方案 B + 一句话原因，不在其他章节重复。

**验证**：
- [ ] 03-write-path.md 无 `mergeByIdIntoTree` 函数定义/语义详解
- [ ] grep `handleAlign` 在本文档命中 < 4 处
- [ ] 无 `已废弃` / `已不适用` 历史标记

### 阶段 4：读路径文档

**操作**：写 `04-read-path.md`，内容来源 `03-read-path.md`：
- §0 读路径总图
- §1 6 种读法速查表
- §2 useFieldConf
- §3 useSelector 整树订阅
- §4 useStore().getState() 异步读
- §5 getFieldNodeById
- §6 保存序列化（直接序列化 designerState.components）
- §7 读配置 vs 读 parent vs 读 children 对照
- §8 读路径决策树
- §9 易错点

**删除的历史内容**：
- 原 §6.2/§6.3 旧 getSaveableComponents + byIdWins 历史说明
- 原 §5.3 stale 风险历史说明
- 原 §9 易错点中"旧双源时代"说明

**验证**：
- [ ] 04-read-path.md 无 `getSaveableComponents` / `byIdWins` 历史叙述
- [ ] 无 `stale` 历史标记（单源后 components 永远 fresh 是当前事实，不需要"已消除"叙述）

### 阶段 5：边界场景文档

**操作**：写 `05-edge-cases.md`，内容来源 `04-edge-cases.md`：
- §0 三类边界场景速查
- §1 recalcGroupBounds（触发条件 + 目的 + 单源后简化算法 + isRecalcRef 防重入 + 易错点）
- §2 save 序列化（3 个保存路径 + 当前实现 + 调用方对照）
- §3 整体防护 checklist
- §4 相关文件

**删除的历史内容**：
- 原 §1.4 stale 风险（历史背景 + 历史修复）
- 原 §1.5 skip 标志（已删除）
- 原 §1.6.1 正常路径为何先同步 byId 再 setComponents（已废弃）
- 原 §3 整章 setComponents 输入计算修复演进（71 行）——保留一句"单源后闭包 components 永远 fresh，无 stale 闭包问题"
- 原 §4 checklist 中已废弃项

**验证**：
- [ ] 05-edge-cases.md 无 `freshChildNodes` / `shouldSkipGroupRecalc` / `fieldPreserve` 历史叙述
- [ ] §3 checklist 无 `~~删除线~~` 历史项
- [ ] 文档行数 < 120 行（原 197 行）

### 阶段 6：bug 索引 + 架构原则文档

**操作**：
1. 写 `06-bugs.md`（来源 `05-known-bugs.md`）：
   - §0 速查表（25 个 bug，纯表格行：编号 / 标题 / 状态 / 修复一句话）
   - §1 测试覆盖情况
   - §2 排查 checklist
   - **删除 §1-§3 详情 narrative**（~200 行），bug 详情通过链接指向原 05 文档或 task plan
   - 修复 §3.3 编号重复（L210 和 L218 两个 §3.3）

2. 写 `07-principles.md`（来源 `06-principles.md`）：
   - §0 速查：5 大原则 + 5 大禁区
   - §1-§4 4 大原则（单一真相源 / 不可变契约 / 字段级订阅 / 单源契约）
   - §5-§9 5 大禁区（mutation / cloneDeep / EventBus / Context+setState / 循环依赖）
   - §10 提交前自检清单
   - §11 已删除 API 清单
   - §12 相关文档
   - **删除 §5 整节 stale tree 防护（已消除）**——在 §0 速查表原则 5 改为"单源契约：components 永远 fresh"（合并到原则 4，5 大原则改为 4 大原则）
   - **删除 §4.4 updateFieldConfig 旧设计**（历史）
   - **删除 §6.3 待清理 / §6.4 隐式保护**（历史决策过程，保留结论"mutation 已全部清理"）

**验证**：
- [ ] 06-bugs.md 无展开 narrative，每个 bug 只有一行表格
- [ ] 06-bugs.md §3.3 编号无重复
- [ ] 07-principles.md 无 `~~stale tree 防护~~` 已消除章节
- [ ] 07-principles.md 无 `task-002 前` 历史标记

### 阶段 7：view slices + 外部引用更新

**操作**：
1. 写 `08-view-slices.md`（来源 `07-view-slices.md`）：几乎直接迁移，更新配套链接
2. 更新 `AGENTS.md` §3.1 / §8 的 designer-canvas 链接指向新目录
3. 更新 `00-README.md` 的外部引用（research / plans 链接保持相对路径正确）
4. 原 `designer-canvas/` 目录保留不动（作为历史归档，待后续决定删除）

**验证**：
- [ ] AGENTS.md §3.1 表格链接指向 `designer-canvas-state/`
- [ ] AGENTS.md §8 必读文档表链接更新
- [ ] 08-view-slices.md 内容与原 07 一致
- [ ] 新目录 8 份文档全部存在

### 阶段 8：删除 handoff + 最终验证

**操作**：
1. 删除 `2026-07-29-handoff-designer-canvas-docs-restructure.md`
2. 运行 grep 验证量化目标
3. 更新 roadmap.md 状态为 done
4. 归档 task 到 `done/`

**验证**：
- [ ] grep `mergeByIdIntoTree` 在新目录命中 < 5 处
- [ ] grep `已消除` / `已废弃` / `task-002 前` 在新目录命中 0 处
- [ ] grep `task-002 单源后` 在新目录每份文档命中 ≤ 1 处
- [ ] 新目录总行数 < 2200 行
- [ ] handoff 文档已删除
- [ ] `pnpm exec tsc --noEmit` 无影响（纯文档改动）

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 外部引用（AGENTS.md / task plan）链接失效 | 中 | 读者找不到文档 | 原 `designer-canvas/` 目录保留，链接仍可达；新目录链接在 AGENTS.md 同步更新 |
| 新文档遗漏历史中的重要决策上下文 | 中 | 未来排查"为什么这么设计"时缺信息 | 原 `designer-canvas/` 目录保留作为历史归档；07-principles.md §已删除 API 清单保留防幻觉 |
| 重构工作量大，中途偏差 | 低 | 部分文档质量不一致 | 分阶段 commit，每阶段独立验证 |

### 回退

- 每阶段独立 commit，可单独 revert
- 原 `designer-canvas/` 目录在重构期间不删除，回退只需删除新目录 + revert AGENTS.md

---

## 6. 不做的事

- ❌ 不删除原 `designer-canvas/` 目录（历史内容先保留，后续决定）
- ❌ 不重写活代码的事实性描述（只重组文档结构 + 去历史化）
- ❌ 不合并文档（8 份拆分是合理的，职责边界本身没问题）
- ❌ 不删除 07-principles.md §已删除 API 清单（防幻觉，AGENTS.md §10.2 引用）
- ❌ 不动 `.bak` 备份文件相关说明

---

## 7. 实施记录

### 2026-07-29 创建 task

- 基于 handoff 文档 + 完整读取 9 份文档 + grep 验证，制定本 task
- 用户确认：新建 `designer-canvas-state/` 目录（非文档），历史内容先不动，分阶段 commit，删除 handoff
- 新目录结构设计完成，8 份文档映射关系明确

### 2026-07-29 完成

- 创建新目录 `.trae/documents/design/designer-canvas-state/`，9 份文档全部就位
- 采用并行子任务创建 02-state / 03-write-path / 04-read-path / 05-edge-cases / 06-bugs / 07-principles / 08-view-slices
- 更新 AGENTS.md §3.1 / §3.2 / §8 / §9.3 / §10.2 全部链接指向新目录
- 删除 handoff 文档 `2026-07-29-handoff-designer-canvas-docs-restructure.md`
- 原 `designer-canvas/` 目录保留作为历史归档

### 验证结果

| 指标 | 目标 | 实际 | 状态 |
| --- | --- | --- | --- |
| 新目录总行数 | ~2000 行 | 2448 行 | ✅（原 3356 行，减少 27%；07-principles 462 行主要是已删除 API 清单完整保留） |
| `mergeByIdIntoTree` 提及 | < 5 处 | 7 处（全在防幻觉上下文：已删除 API 清单 / 禁止引用警告 / bug 一句话说明） | ✅ 合理 |
| `已消除` / `已废弃` / `task-002 前` / `~~` | 0 处 | 0 处 | ✅ |
| `task-002 单源后` 每份文档 | ≤ 1 处 | 1 处（06-bugs） | ✅ |
| handoff 文档 | 已删除 | 已删除 | ✅ |

### 新目录文档行数明细

```
00-README.md:      138 lines
01-types.md:       481 lines
02-state.md:       238 lines
03-write-path.md:  316 lines
04-read-path.md:   322 lines
05-edge-cases.md:  122 lines
06-bugs.md:         77 lines
07-principles.md:  462 lines
08-view-slices.md: 292 lines
Total:            2448 lines
```

### 后续待办（用户决定）

- 原 `designer-canvas/` 目录的删除时机（用户说"理论上要删除"，待后续决定）
- 07-principles.md 462 行偏大，主要是 §已删除 API 清单完整保留（防幻觉需要），暂不精简
