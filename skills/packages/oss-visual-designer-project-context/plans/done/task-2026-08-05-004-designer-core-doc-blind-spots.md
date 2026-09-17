# task-2026-08-05-004：designer-core 文档盲点补充

> 创建日期：2026-08-05
> 完成日期：2026-08-06
> 状态：`done`（已归档到 `done/`）
> 类型：`docs`
> 前置文档：[research/tango-cross-review报告.md](../research/tango-cross-review报告.md) §4.1-4.4

---

## 1. 背景与目标

### 1.1 背景

Tango 交叉印证报告发现了 4 个设计盲点，都是"我们没想到的"。这些不是代码 bug，是设计文档中缺失的决策记录和边界说明。

### 1.2 目标

补充 4 个设计文档盲点，不改任何代码。

### 1.3 不做什么

- 不改任何源码
- 不改 `useTree` equalityFn（那是 task-005）
- 不实现 undo/redo
- 不实现 iframe 沙箱

---

## 2. 详细步骤

### 2.1 盲点 1：选中/拖拽/放置目标"不抽象"决策记录

**文件**：[`design/00-overview.md`](../design/designer-core/00-overview.md) §2.2

**补充内容**：在"不抽象（留给业务）"表中新增一行

| 不抽象的能力 | 为什么不抽象 | 业务参考 |
|---|---|---|
| 选中/拖拽/放置目标 | 这三者是 UI 交互模型，不是树状态管理。混入 TreeStoreState 会导致画布缩放等高频操作触发组件树订阅者。 | Tango 的 SelectSource / DragSource / DropTarget 三件套模式（独立 observable，持有 workspace 引用派生节点，不冗余存储节点引用） |

### 2.2 盲点 2：undo/redo 未来方案备忘

**文件**：[`design/00-overview.md`](../design/designer-core/00-overview.md) §1.3

**补充内容**：

> **未来方案备忘**：若需 undo/redo，推荐树级快照方案（存 `getState().components` 序列化字符串 + 操作 message），而非 command pattern。Tango 的 `TangoHistory` 已验证此方案可行（100 条上限，文件级代码快照）。框架可提供 `createHistoryPlugin`（cross-slice-sync 类型），在 subscribe 回调中 push 快照。

### 2.3 盲点 3：跨 iframe 边界读路径

**文件**：[`design/03-read-path.md`](../design/designer-core/03-read-path.md) 新增 §9

**补充内容**：

```markdown
## §9 跨 iframe 边界（未来场景，当前不涉及）

当前读路径假设在同一窗口内（共享 store 引用）。如果渲染器在 iframe 里：

- **不能共享 store 引用**：iframe 有独立的 JS 上下文，Zustand store 实例无法跨窗口传递
- **需走 postMessage + 全量序列化**：主窗口 `getState().components` 序列化后 postMessage 发送，iframe 侧反序列化后用 `setTree` 写入自己的 store 副本
- **多实例路由**：用 channelId 区分多个 iframe
- **握手流程**：iframe 发 initialized → 主窗口注册 → 后续消息带 channelId
- **参考**：Tango 的 sandbox 包（CodeSandbox sandpack 协议）
```

### 2.4 盲点 4：data 引用生命周期约束

**文件**：[`design/01-data-model.md`](../design/designer-core/01-data-model.md) §1.2

**补充内容**：在"data 是引用复用的关键"条目下补充

> **data 引用生命周期**：`data` 是浅引用，禁止跨删除操作持有。节点删除后旧 data 引用虽未 GC 但已脱离 store 管理，读取会得到过期值。异步回调应通过 `getState()` 或 `useLatestState()` 实时读取，不缓存 data 引用。

---

## 3. 验证

| 验证项 | 方法 |
|---|---|
| 4 个盲点文档已补充 | Read 3 个设计文档，确认章节存在 |
| 文档内容与代码一致 | 交叉核对源码 |
| 无代码改动 | git diff 确认只有 `.md` 文件变更 |

---

## 4. 风险与回退

纯文档改动，无风险，无回退需求。

---

## 5. 实施记录

### 5.1 改动清单（2026-08-06 落地）

| 盲点 | 文件 | 位置 | 改动 |
| --- | --- | --- | --- |
| 1. 选中/拖拽/放置目标不抽象 | [`00-overview.md`](../design/designer-core/00-overview.md) | §2.2 不抽象表 | 新增 1 行，列入 Tango SelectSource/DragSource/DropTarget 三件套模式作为业务参考 |
| 2. undo/redo 未来方案备忘 | [`00-overview.md`](../design/designer-core/00-overview.md) | §1.3 不做什么章节末尾 | 新增 1 段（块引用），TangoHistory 树级快照方案 + createHistoryPlugin 设想 |
| 3. 跨 iframe 边界 | [`03-read-path.md`](../design/designer-core/03-read-path.md) | 文档末尾新增 §13 | 5 条要点：store 不可跨窗口/postMessage+序列化/channelId/握手流程/参考 |
| 4. data 引用生命周期 | [`01-data-model.md`](../design/designer-core/01-data-model.md) | §1.2 TreeNode 契约 | 在 `data` 是引用复用的关键条目下追加子条目 |

### 5.2 与原 plan 的偏差

- **盲点 3 章节号**：plan 写"新增 §9"，但 `03-read-path.md` 已有 §9（shallowEqual 约束）。为避免章节号冲突，按"以文档事实为准"原则追加为 §13。
- **盲点 1 表格列名适配**：plan 表格用列名"不抽象的能力 / 为什么不抽象 / 业务参考"，当前文件表头是"留给业务项 / 事实依据 / 理由"。按当前文件列名填写，行内保留 plan 全部信息。

### 5.3 验证结果

- 4 个改动全部用 Read 工具回读确认（line 52 / line 87 / line 66 / line 457-467）
- 无源码改动（`git status` 显示的 8 个 packages-next/ 改动是历史 task 残留，与本任务无关）
- 文档内容与代码一致（沿用 plan §2 中已 review 的决策）

