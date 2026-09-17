# Designer State —— 索引与导航

> 权威性：本目录是 `designerCanvas` / `viewCanvas` / `viewUI` slice 的**权威设计文档**。修改设计器状态前必读。
>
> 事实准确性：每条事实均对照源码验证。如有偏差，以代码为准并更新本目录。

---

## 0. 这是什么

`designer-state/` 统一文档化设计器的三个 Redux slice：

- **`designerCanvas`** —— 画布运行时大对象（components 树 + 派生 byId/parentMap 索引 + page + runtime hooks）
- **`viewCanvas`** —— 画布高频状态（scale / lines / 标尺 / 画布尺寸）
- **`viewUI`** —— UI 低频状态（tabsKey / *Collapsed / visible / isShowReferLine）

**核心架构**：

- **单源契约**：`components` 树是唯一真相源，`byId` / `parentMap` 是纯派生索引（只读，由 `buildIndex` 重建，禁止直接写入）
- **字段级订阅**：`useFieldConf(uniqueId)` 订阅 `byId[id]`，配合 `buildIndex` 引用复用保持订阅粒度
- **components 永远 fresh**：所有写操作（含 `updateFieldConfig`）都改 components 树 + `buildIndex` 重建派生索引

---

## 1. 文档索引

| # | 文件 | 关注点 | 何时读 |
| --- | --- | --- | --- |
| 00 | [00-README.md](./00-README.md) | **本页**（索引 + 导航） | 第一次进入 |
| 01 | [01-data-model.md](./01-data-model.md) | **数据模型**（类型定义 + state 形状 + 派生索引 + 单源契约） | 修改组件树节点结构 / 加新 config 字段 / 修改 state schema |
| 02 | [02-write-path.md](./02-write-path.md) | **写路径**（action 全表 + reducer + 工具函数 + 写边界场景） | 加新 action / 改 reducer / 修涉及组尺寸的复杂 bug |
| 03 | [03-read-path.md](./03-read-path.md) | **读路径**（hooks + getFieldNodeById + 保存序列化 + 读边界场景） | 加新订阅 / 改 save 逻辑 |
| 04 | [04-principles.md](./04-principles.md) | **架构原则与禁区**（4 大原则 + 5 大禁区 + 提交前自检） | 提交前自检 |
| 05 | [05-deleted-api.md](./05-deleted-api.md) | **已删除 API 速查**（grep 到旧 API 时的权威对照） | grep 到旧 API 时 |
| 06 | [06-bugs-and-tests.md](./06-bugs-and-tests.md) | **Bug 归档 + 测试矩阵**（历史归档） | 修复前先查 |
| 07 | [07-view-slices.md](./07-view-slices.md) | **View Slices**（viewCanvas + viewUI + updateView 跨 slice + hooks） | 修改 view 状态 / 加新 view 字段 |

---

## 2. 快速导航：常见任务对照表

| 我要做什么 | 看哪份文档 |
| --- | --- |
| 修改 state 形状（加字段） | [01-data-model.md](./01-data-model.md) |
| 修改组件树节点结构 / 加新 config 字段 | [01-data-model.md](./01-data-model.md) |
| 加新 action | [02-write-path.md](./02-write-path.md) |
| 改 `setComponents` / `buildIndex` 逻辑 | [02-write-path.md](./02-write-path.md) + [01-data-model.md](./01-data-model.md) |
| 加新订阅 hook | [03-read-path.md](./03-read-path.md) |
| 改保存序列化逻辑 | [03-read-path.md](./03-read-path.md) |
| 改拖拽 / 对齐 / 组操作逻辑 | [02-write-path.md](./02-write-path.md) |
| 排查"读不到最新值"的 bug | [03-read-path.md](./03-read-path.md) + [06-bugs-and-tests.md](./06-bugs-and-tests.md) |
| 排查"保存后字段丢失" | [03-read-path.md](./03-read-path.md) + [06-bugs-and-tests.md](./06-bugs-and-tests.md) |
| 排查"组尺寸不更新" | [02-write-path.md](./02-write-path.md) + [06-bugs-and-tests.md](./06-bugs-and-tests.md) |
| grep 到旧 API | [05-deleted-api.md](./05-deleted-api.md) |
| 提交前自检 | [04-principles.md](./04-principles.md) |
| 修改 view 状态 | [07-view-slices.md](./07-view-slices.md) |

---

## 3. 相关文档（外部引用）

### 3.1 必读依赖

- **本目录 8 份核心文档**（见 §1 索引）
- **单源重构系列 task**（task-2026-07-28-001/002/003/004，实现记录）：见 [plans/done/](../../plans/done/)

### 3.2 参考归档

- **历史文档归档**：[`designer-canvas/`](../designer-canvas/)（重构前的原 9 份文档，保留作为历史归档，包含演进过程与已删除 API 的详细背景）
- **调研文档**（决策背景，非权威事实）：
  - [useDesigner 迁移可行性审计](../../research/useDesigner迁移可行性审计.md)（探索性调研）
  - [useView 调用点字段审计](../../research/useView调用点字段审计.md)（探索性调研）
  - [Redux 现代化升级调研](../../research/Redux现代化升级调研.md)（探索性调研）

### 3.3 反模式警告

**禁止**：

- ❌ 引用已删除 API（`useDesigner` / `mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `fieldPreserve` / `dirtyConfigKeys` / `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` / `undo` / `redo` 等，完整清单见 [05-deleted-api.md](./05-deleted-api.md)）
- ❌ 绕过 `buildIndex` 直接赋值 `byId` / `parentMap`（单源契约禁区）
- ❌ 用 `state.components` 直接保存序列化时再调 `getSaveableComponents`（已删除，直接序列化 `designerState.components`）

如发现违反，从本目录出发重做方案。
