# task-2026-07-28-005：恢复 verify-immer-ref3.mjs 验证脚本

> 单源重构后续收尾 — 找回被误删的关键验证脚本，作为单源架构回归测试入口
>
> 计划日期：2026-07-28
> 任务编号：`task-2026-07-28-005`
> 状态：`done`
> 类型：`chore`
> 完成日期：2026-07-28
> 来源：[2026-07-28-handoff-single-source-refactor §3.1](../2026-07-28-handoff-single-source-refactor.md)
>
> **风险等级：低（仅恢复/新增脚本，不改源码）**

---

## 1. 背景

commit [`0a385e5`](../../)（task-002 步骤 2 的关键修复）把 `buildIndex` 移到 `produce` 外调用，修复了 Immer proxy 导致引用复用失效的 bug。该 commit message 把 `.trae/scripts/verify-immer-ref3.mjs` 作为验证证据引用，但脚本本身**在后续 commit 中被删除**（Glob 确认当前不存在）。

未来需要重新验证 buildIndex 引用复用行为时，只能重新写脚本。本 task 找回该脚本并固定下来。

---

## 2. 目标

1. 恢复 `verify-immer-ref3.mjs` 到 `.trae/scripts/`
2. 脚本能成功跑通，输出 `sameRef=true` 等关键结论
3. 在 AGENTS.md §10.2 引用脚本路径（可选）

---

## 3. 详细步骤

### 步骤 1：定位脚本历史

- [ ] `git log --diff-filter=D -- .trae/scripts/verify-immer-ref3.mjs` 找到删除 commit
- [ ] `git show <commit>^:.trae/scripts/verify-immer-ref3.mjs` 读取历史内容
- [ ] 若历史不可恢复（如 force push 丢失），按步骤 2 重写等效脚本

### 步骤 2：恢复 / 重写脚本

**恢复**（首选）：

- [ ] 把历史内容写回 `.trae/scripts/verify-immer-ref3.mjs`
- [ ] 顶部加注释说明：用途（验证 buildIndex 引用复用）+ commit 来源

**重写**（fallback，脚本结构参考）：

- [ ] 用 `pnpm` 安装 Immer（项目已依赖）
- [ ] 构造示例 components 树（5-10 节点，含 group 嵌套）
- [ ] 模拟单源 reducer 流程：`produce` 改树 → `buildIndex(components, oldById)`
- [ ] 断言 `oldById['未改节点'].data === newById['未改节点'].data`（同引用）
- [ ] 断言 `oldById['已改节点'].data !== newById['已改节点'].data`（新引用）

### 步骤 3：验证脚本可跑

- [ ] `node .trae/scripts/verify-immer-ref3.mjs` 退出码 0
- [ ] 输出包含 `sameRef=true` 关键结论

---

## 4. 验证清单

- [x] `.trae/scripts/verify-immer-ref3.mjs` 文件存在
- [x] `node .trae/scripts/verify-immer-ref3.mjs` 跑通（28/28 断言通过，退出码 0）
- [x] 脚本顶部注释含用途 + commit 来源 + Immer/buildIndex 一致性说明
- [ ] （可选）AGENTS.md §10.2 引用脚本路径

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 历史 commit 已 force-push 丢失 | 低 | 需重写脚本 | 按步骤 2 fallback 流程 |
| Immer 版本差异导致行为不同 | 低 | 输出与历史不一致 | 用项目 package.json 中锁定的版本 |

### 回退

- 脚本独立文件，删除即可回退
- 不改任何源码

---

## 6. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：任务创建。承接 handoff §3.1 P1 #1 收尾项。

### 2026-07-28：完成脚本重写

**关键发现**：脚本从未被 git 跟踪过。
- `git log --all --diff-filter=A/D -- "**/verify-immer-ref3.mjs"` 全空
- `git ls-files | grep verify-immer` 全空
- plan 文档原假设"在后续 commit 中被删除"不准确 —— 实际是 0a385e5 commit message 引用脚本路径作为验证证据，但脚本本身从未 add/commit

按 plan §3 步骤 2 fallback 流程重写。

**脚本内容**：[`.trae/scripts/verify-immer-ref3.mjs`](../../scripts/verify-immer-ref3.mjs)（199 行，UTF-8）
- 复制 buildIndex 精简等价实现（避免脚本依赖 `@Src/*` 别名 / TypeScript 编译）
- 4 个场景：
  1. 首次 buildIndex（基线）—— 5 节点树全部进入 byId/parentMap
  2. produce 外调 buildIndex（正确路径）—— 未修改节点引用复用，修改节点新引用
  3. produce 内调 buildIndex（反例，验证 0a385e5 bug 场景）—— 反例不可复用
  4. 嵌套 group 内单节点修改（边界）—— group 本身 data 未变也复用

**验证结果**：`node .trae/scripts/verify-immer-ref3.mjs` 退出码 0，**28/28 断言通过**。
关键输出：`sameRef=true（produce 外调 buildIndex 时 n_img_1 节点引用复用生效）`

**与仓库事实一致性核对**：
- Immer 9.0.21（node_modules/immer/package.json）≥ 9.0.6（package.json 声明），满足
- buildIndex 引用复用条件 `oldEntry.data === node.data` 与 src/designer/renderer/utils.ts:680 一致
- ROOT_UNIQUE_ID 常量与 src/store/modules/designer-canvas.ts:3 导入路径一致

**后续维护注意**：脚本内 buildIndex 是 src/designer/renderer/utils.ts 的精简等价副本（已加注释说明），如 utils.ts 中 buildIndex 行为变化需同步此函数。

