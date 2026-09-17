# task-2026-07-24-017-a-research-link-wording

> 状态：`done`
> 创建：2026-07-24
> 类型：chore（文档措辞调整）

---

## 1. 背景

`designer-canvas` 目录定位为 designer 状态管理的**权威事实文档**（见 `00-overview.md` 权威性声明）。目录内仍有 **7 处** 指向 `research/` 的引用作为"参考归档"使用。

`research/` 是探索性调研文档，不是事实。保留链接合理（作为来源溯源/决策背景），但需要明确标注其性质，避免读者误以为是设计依据。

---

## 2. 目标

保留所有 7 处 research 链接（不删除，作为来源溯源），但在每处链接的描述里明确标注"探索性调研，非权威事实"。

---

## 3. 详细步骤

### 3.1 01-01-widget-types.md L223

**当前**：
```
> `InteractionMap` / `WidgetAnimation` / `DataConfig` / `CustomDataSourceApiConfig` / `DrillDownItem` 的完整定义见 [渲染JSON类型声明.md](../../research/渲染JSON类型声明.md) §6-§10。这些子类型属于 `plugins/interaction`、`plugins/animation`、`plugins/data-fetcher` 模块，等后续相关模块有事实文档需求时再各自下沉。
```

**改为**：
```
> ⚠️ 以下子类型的完整定义**当前在** [渲染JSON类型声明.md](../../research/渲染JSON类型声明.md) §6-§10（**探索性调研，非权威事实**）：
> - `InteractionMap`（`plugins/interaction`）
> - `WidgetAnimation`（`plugins/animation`）
> - `DataConfig` / `CustomDataSourceApiConfig`（`plugins/data-fetcher`）
> - `DrillDownItem`（`src/designer/renderer/components/item-field/DrillDownItem.tsx`）
>
> 这些子类型不属于 designerCanvas slice，等后续相关模块有事实文档需求时再各自下沉到对应模块的 design 目录。
```

### 3.2 00-overview.md §5.2（3 个链接）

**当前**：
```
- [useDesigner 迁移可行性审计](../research/useDesigner迁移可行性审计.md) —— task-006 决策背景（已大部分落地）
- [useView 调用点字段审计](../research/useView调用点字段审计.md) —— task-005 拆分设计
- [Redux 现代化升级调研](../research/Redux现代化升级调研.md) —— slice 模式
```

**改为**：
```
- [useDesigner 迁移可行性审计](../research/useDesigner迁移可行性审计.md) —— task-006 决策背景（**探索性调研，非权威事实**，已大部分落地）
- [useView 调用点字段审计](../research/useView调用点字段审计.md) —— task-005 拆分设计（**探索性调研，非权威事实**；字段使用矩阵见 [07-view-slices.md](./07-view-slices.md) §7）
- [Redux 现代化升级调研](../research/Redux现代化升级调研.md) —— slice 模式（**探索性调研，非权威事实**；持久化策略见 [01-data-model.md](./01-data-model.md) §6）
```

### 3.3 06-principles.md §12

**当前**：
```
- 审计：[useDesigner 迁移可行性审计](../research/useDesigner迁移可行性审计.md)
```

**改为**：
```
- 审计（**探索性调研，非权威事实**）：[useDesigner 迁移可行性审计](../research/useDesigner迁移可行性审计.md)
```

### 3.4 05-known-bugs.md §1.3

**当前**：
```
**来源**：[useDesigner 迁移可行性审计 §2 + §9](../research/useDesigner迁移可行性审计.md)
```

**改为**：
```
**来源**（**探索性调研，非权威事实**）：[useDesigner 迁移可行性审计 §2 + §9](../research/useDesigner迁移可行性审计.md)
```

### 3.5 05-known-bugs.md §5

**当前**：
```
- 审计：[useDesigner 迁移可行性审计](../research/useDesigner迁移可行性审计.md)
```

**改为**：
```
- 审计（**探索性调研，非权威事实**）：[useDesigner 迁移可行性审计](../research/useDesigner迁移可行性审计.md)
```

---

## 4. 验证

### 4.1 grep 验证

完成后运行：
```
grep -rn "\.\./\.\./research/\|\.\./research/" .trae/documents/design/designer-canvas/
```

预期：7 处链接全部保留，但每处都标注"探索性调研，非权威事实"。

### 4.2 措辞一致性验证

- 4.1 grep 命中每条都含"探索性调研，非权威事实"标记
- 00-overview.md §5.2 的额外注释指向对应的 design 文档（确保读者能找到权威事实位置）

---

## 5. 风险与回退

- **风险**：纯文字修改，无代码变更
- **回退**：直接改回即可

---

## 6. 不做

- ❌ 不删除 research 链接（作为来源溯源保留）
- ❌ 不修改 research 文档本身
- ❌ 不做持久化策略下沉（task-017-b）
- ❌ 不做 view 字段矩阵下沉（task-017-c）

---

## 7. 实施记录（2026-07-24）

### 7.1 执行摘要

按 plan §3 5 处修改全部完成：

- ✅ `01-01-widget-types.md` L223 — 大块引用重写为 ⚠️ 警告块 + 子类型归属清单
- ✅ `00-overview.md` L169-L171 — 3 处加"探索性调研，非权威事实"标记 + 2 处指向权威事实位置
- ✅ `06-principles.md` L418 — "审计"加标记
- ✅ `05-known-bugs.md` L81 (§1.3) — "**来源**"加标记
- ✅ `05-known-bugs.md` L218 (§5) — "审计"加标记

### 7.2 发现偏差：实际 9 处，plan 漏算 2 处

grep `\.tre/documents/design/designer-canvas/` 实际命中 **9 处** research 引用（plan 假设 7 处）：

| 位置 | 链接目标 | 处理 |
| --- | --- | --- |
| `01-01-widget-types.md:223` | 渲染JSON类型声明.md | ✅ 本任务（标注） |
| `00-overview.md:169` | useDesigner迁移可行性审计.md | ✅ 本任务（标注） |
| `00-overview.md:170` | useView调用点字段审计.md | ✅ 本任务（标注） |
| `00-overview.md:171` | Redux现代化升级调研.md | ✅ 本任务（标注） |
| `05-known-bugs.md:81` | useDesigner迁移可行性审计.md | ✅ 本任务（标注） |
| `05-known-bugs.md:218` | useDesigner迁移可行性审计.md | ✅ 本任务（标注） |
| `06-principles.md:418` | useDesigner迁移可行性审计.md | ✅ 本任务（标注） |
| **`01-data-model.md:195`** | Redux现代化升级调研.md | ⏩ **task-017-b**（**删除 + 内联事实**） |
| **`07-view-slices.md:255`** | useView调用点字段审计.md | ⏩ **task-017-c**（**删除 + 内联矩阵**） |

漏算的 2 处恰好是 §5.2 新增"指向权威事实位置"指引的反向链路终点。但 **17-b/17-c 的处理方式是"删除+下沉"，比加标注更彻底**——完成后 §5.2 的指引会自包含，故不扩展本任务范围。

### 7.3 grep 验证结果

**`grep -rn "探索性调研，非权威事实"` 命中 7 处**（count 模式）：

```
00-overview.md:3
01-01-widget-types.md:1
05-known-bugs.md:2
06-principles.md:1
```

符合 plan §4.2 预期。

**`grep -rn "../research/"` 命中 9 行**：

- 7 处带"探索性调研，非权威事实"标记（本任务产出）
- 2 处"详见"行（由 task-017-b / task-017-c 删除）

### 7.4 遇到的问题

`05-known-bugs.md` §1.3 的修改在第一次并行 SearchReplace 时虽然报告成功，但后续 Read 显示仍是旧文本。重新单独执行一次后生效。疑为 IDE 读快照缓存问题。

### 7.5 后续

- ✅ 本任务完成，归档到 `done/`
- ⏩ 启动 task-017-b（持久化策略下沉）
- ⏩ 启动 task-017-c（view 字段使用矩阵下沉）