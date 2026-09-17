# task-2026-07-29-003：文档 + 注释 + dev-only 收尾

> 集中处理单源重构后续文档/注释不一致项 + dev-only 诊断增强
>
> 计划日期：2026-07-29
> 任务编号：`task-2026-07-29-003`
> 状态：`cancelled`
> 类型：`chore`
> 来源：[2026-07-28-handoff §4.2 #3/#4 + §4.3 #1/#2](../2026-07-28-handoff-single-source-refactor.md)
>
> **风险等级：低（文档改动为主 + dev-only console.warn）**

---

## 1. 背景

handoff 列出了 5 项文档/注释收尾任务，分散在多文件中。本 task 集中处理。

---

## 2. 目标

1. 修复 dead code 注释（`utils.ts:8`）
2. 修复双源描述（`DesignerContent.tsx:281`）
3. 把历史内容（`02-write-path.md §4`）移到 `research/`
4. reducer 加 dev-only `console.warn` 帮助排查"放弃更新"
5. `AGENTS.md §10.2` 引用 `06-principles.md §12` 建立长期约束链接

---

## 3. 详细步骤

### 步骤 1：修复 utils.ts dead code 注释

- [ ] Read `src/designer/renderer/utils.ts:8` 附近
- [ ] 检查注释列出的 dead code 函数是否仍存在：
  - `patchFieldConf` —— task-002/003 已删
  - `mergeByIdIntoTree` —— task-003 已删
  - `getSaveableComponents` —— task-003 已删
  - `fieldPreserve` —— task-003 已删
  - `dirtyConfigKeys` —— task-003 已删
  - `beginSkipGroupRecalc` / `endSkipGroupRecalc` —— task-003 已删
  - `undo` / `redo` —— task-003 已删
- [ ] 修正注释为"已删除 API 清单"（指向 `06-principles.md §12`）

### 步骤 2：修复 DesignerContent.tsx 双源描述

- [ ] Read `src/designer/DesignerContent.tsx:281` 附近
- [ ] 检查注释 "P6 后 components 引用不随 updateFieldConfig 变化" —— **已过时**
  - 单源后（task-002）updateFieldConfig 改树 + buildIndex，components 引用**始终**变
- [ ] 修正注释反映单源架构（components 永远 fresh）

### 步骤 3：迁移 02-write-path.md §4 历史内容

- [ ] Read `.trae/documents/design/designer-canvas/02-write-path.md` §4（约 90 行）
- [ ] 内容包括：
  - `mergeByIdIntoTree` 三方向伪代码
  - 结构性变更 vs 字段级变更三方向对照表
- [ ] 移动到 `.trae/documents/research/refactor-single-source/` 或新建 `.trae/documents/research/mergeByIdIntoTree-history.md`
- [ ] 02-write-path.md §4 替换为简短指引："mergeByIdIntoTree 已被 task-003 删除，单源架构下不再需要；详见 research/..."

### 步骤 4：reducer 加 dev-only console.warn

- [ ] Read `src/store/modules/designer-canvas.ts` L130-132（updateFieldConfig case）
- [ ] 当前：uniqueId 不存在时静默 return
- [ ] 改为：

  ```ts
  case 'designerCanvas/updateFieldConfig': {
      const { uniqueId, patch } = action.payload;
      return produce(state, (draft) => {
          const target = draft.byId[uniqueId];
          if (!target) {
              if (process.env.NODE_ENV !== 'production') {
                  console.warn(`[designerCanvas/updateFieldConfig] uniqueId "${uniqueId}" not found in byId, skip update`);
              }
              return;
          }
          // ... 原有逻辑
      });
  }
  ```
- [ ] 确保 production build 时 `process.env.NODE_ENV` 被 webpack 替换为 `"production"`，console.warn 被 dead-code elimination 移除

### 步骤 5：AGENTS.md §10.2 引用 06-principles.md §12

- [ ] Read `AGENTS.md §10.2` 找到"禁止重新引入已删除 API"段落
- [ ] 添加链接：`详见 [06-principles.md §12](.trae/documents/design/designer-canvas/06-principles.md)`
- [ ] 同时在 `06-principles.md §12` 添加"AGENTS.md §10.2 反向引用"

---

## 4. 验证清单

- [ ] utils.ts:8 dead code 注释已修正
- [ ] DesignerContent.tsx:281 双源描述已修正
- [ ] 02-write-path.md §4 历史内容已迁移到 research/
- [ ] reducer L130-132 dev-only console.warn 已加
- [ ] AGENTS.md §10.2 引用 06-principles.md §12 已加
- [ ] 06-principles.md §12 反向引用 AGENTS.md §10.2 已加
- [ ] `pnpm exec tsc --noEmit` 零新增错误
- [ ] `pnpm build` 通过（验证 production build 中 console.warn 被消除）
- [ ] 浏览器冒烟：拖拽 / 选中 / 配置面板 无异常
- [ ] 任务文件移到 `plans/done/`
- [ ] roadmap.md 状态更新

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 文档迁移破坏现有外部引用 | 低 | 链接失效 | 保留 02-write-path.md §4 简短指引 + research 完整内容 |
| console.warn 干扰测试输出 | 低 | 测试日志噪声 | dev-only 检查；测试环境 NODE_ENV 通常是 test |
| 大量文档改动 review 困难 | 中 | review 工作量大 | 按文件分组独立 commit |

### 回退

- 文档改动独立 commit，可单独 revert
- console.warn 改动独立 commit

---

## 6. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-29：任务创建。承接 handoff §4.2 #3/#4 + §4.3 #1/#2 收尾项。
- 2026-07-29：**任务取消（cancelled）**。review 发现 5 项收尾中 3 项已在 task-002/003 主重构时顺手完成，单独维持此 task 已无价值：
  - ✅ **步骤 3（02-write-path.md §4 迁移）**：已在 task-004 文档更新时处理，§4 加了"历史参考"折叠标注，未迁移到 research/ 但效果等价（保留链接不破坏）
  - ✅ **步骤 5（AGENTS.md §10.2 引用 §12）**：AGENTS.md L367 已加 `详见 [06-principles.md §12]` 链接；06-principles.md §12 已存在完整已删除 API 清单（反向引用未加，单向已够用）
  - ⚠️ **步骤 1（utils.ts:8 dead code 注释）**：L8 仍列 `patchFieldConf / ...` 名字，但函数已删除，注释不算错只是不精确，价值低
  - ❌ **步骤 2（DesignerContent.tsx:281 双源描述）**：L281 仍写"P6 后 components 引用不随 updateFieldConfig 变化"，单源后已过时。1 行注释修正，记到 memo.md 作为低优先级清理项
  - ❌ **步骤 4（reducer dev-only console.warn）**：designer-canvas.ts L130-131 仍是无日志静默 return。但这两个 return（根节点 / 不存在）都是合法失败路径，加 warn 价值有限；L146 的 `parentMap 不一致` 才是真 bug 信号。记到 memo.md 作为低优先级清理项

  **剩余 2 项（步骤 2、步骤 4）已记到 `memo.md`**，作为零散注释/日志收尾，不再维持独立 task。
