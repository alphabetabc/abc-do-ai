# 清理未使用的 Redux Action

> 计划日期：2026-07-20
> 任务编号：`task-2026-07-20-002`
> 上游任务：[task-2026-07-20-001-redux-modernization](./done/task-2026-07-20-001-redux-modernization.md)
> 状态：`done`
> 类型：`refactor`

---

## 1. 背景

task-001 完成了 Redux 现代化升级，把 `handleActions` 改为原生 `switch`。在此过程中发现：
- 部分 action case 可能从未被 dispatch（死代码）
- 部分字段命名不一致（如 `toolbarHiddenList` vs `topToolbarHiddenList`）
- `form/*` 和 `tab/*` slice 的使用情况不明

需要做一次使用度审计，保证新建的 store 是真实被使用的，而不是声明了放到这里的。

---

## 2. 目标

1. **审计**：列出所有 reducer case 及其 dispatch 点数量
2. **清理**：删除确认无 dispatch 点的 case（保留 `resetState` 等生命周期 action）
3. **修复**：统一 `toolbarHiddenList` 命名（与调用方对齐）
4. **验证**：清理后 `pnpm tsc --noEmit` 仍无新增错误

---

## 3. 审计范围

### 3.1 待审计的 reducer 文件

| 文件 | action 数量 |
| --- | --- |
| [src/store/modules/app.ts](src/store/modules/app.ts) | 11 个 case |
| [src/store/modules/component.ts](src/store/modules/component.ts) | 12 个 case |
| [src/store/modules/form.ts](src/store/modules/form.ts) | 4 个 case |
| [src/store/modules/tab.ts](src/store/modules/tab.ts) | 3 个 case |

### 3.2 待审计的 action type

#### app.ts
- `app/accessToken`
- `app/refreshToken`
- `app/routes`
- `app/userInfo`
- `app/routerPath`
- `app/layouts`
- `app/topToolbarHiddenList`
- `app/designerType`
- `contextMenuRedux.APP_CONTEXTMENU`
- `app/sidebarOpened`
- `app/resetState`

#### component.ts
- `component/mode`
- `component/selected`
- `component/fieldType`
- `component/querys`
- `component/dependencies`
- `InteractionPlugin.ACTION_INTERACTION`
- `component/drilldown`
- `component/api`
- `DataFetcherPlugin.GlobalDataSet.ACTION_DATASET_LIST`
- `DataFetcherPlugin.GlobalFetcher.ACTION_GLOBAL_RESPONSE`
- `DataFetcherPlugin.RealtimeDataFlow.ACTION_TYPE`
- `component/resetState`

#### form.ts
- `form/dependencies`
- `form/conditions`
- `form/parmas`（注意：原代码就是这个拼写，疑似 typo）
- `form/resetState`

#### tab.ts
- `tab/tabStore`
- `tab/tabBind`
- `tab/resetState`

---

## 4. 实施步骤

### 步骤 1：grep 全量 dispatch 调用点

对每个 action type，搜索整个 `src/`：
- 静态调用：`dispatch({ type: 'app/accessToken', ... })`
- 动态调用：`dispatch({ type: \`component/${key}\`, ... })` 或 `componentActions[key]`
- 通过 `componentActions` 常量：`dispatch({ type: componentActions.selected, ... })`

### 步骤 2：汇总使用度报告

输出到 `.trae/documents/research/Redux Action使用度审计.md`，表格形式：
| Action | 静态调用数 | 动态调用数 | 通过 componentActions | 总计 | 状态 |

### 步骤 3：与用户对齐清理范围

报告产出后，列出候选清理项，**和用户确认后再删除**。

### 步骤 4：执行清理

- 删除确认无引用的 case
- 同步更新对应 interface 字段（若该字段也无其他使用）
- 修复 `toolbarHiddenList` 命名不一致

### 步骤 5：验证

- `pnpm tsc --noEmit` 零新增错误
- `pnpm start` 运行无报错

---

## 5. 验证清单

- [x] 审计报告产出，覆盖全部 30 个 action type
- [x] 与用户对齐清理范围
- [x] 清理后 `pnpm tsc --noEmit` 无新增错误（仍为 10 个预存在错误）
- [x] `toolbarHiddenList` 命名统一（保留 `topToolbarHiddenList`，删除 `toolbarHiddenList`）
- [x] `packages/container/tabs` 整目录删除（用户已确认废弃）
- [x] `packages组件使用度审计.md` 产出，记录 5 个待确认死代码组件 + 1 个待审计文件
- [x] `component/dependencies` 补充清理（自产自销型死代码，调用方为死代码组件）
- [x] `packages/base/iframe/custom.js` 清理对 `component/dependencies` 的依赖
- [x] 更新 roadmap.md 状态为 done
- [x] 同步更新 memo.md、AGENTS.md、Redux Action使用度审计.md

---

## 6. 实际清理执行

| 类别 | 操作 |
| --- | --- |
| `app.ts` | 删除 7 个死代码 action（`accessToken`/`refreshToken`/`routes`/`userInfo`/`routerPath`/`layouts`/`sidebarOpened`）+ 11 个无用字段 |
| `component.ts` | 删除 4 个死代码 action（`fieldType`/`drilldown`/`api`/`dependencies`）+ 对应字段 |
| `form.ts` | **整个 slice 删除**（4 个 action + 整个文件） |
| `tab.ts` | **整个 slice 删除**（3 个 action + 整个文件。原 `tabStore` 的调用方 `packages/container/tabs/` 被删除后，整个 slice 变为死代码） |
| `modules/index.ts` | 移除 `form` 和 `tab` slice 导入与注册 |
| `exports.ts` | **整个 `componentActions` 常量删除**（10 个里 9 个死代码） |
| `Viewer.jsx` | `componentActions.querys` → `'component/querys'` 字符串字面量 |
| `packages/container/tabs/` | **整目录删除**（3 个文件，用户已确认废弃） |
| `packages/base/iframe/custom.js` | 清理对 `component/dependencies` 的 3 处 dispatch/read 依赖（文件保留） |
| `backup/form.js.bak` + `backup/tab.js.bak` | 同步删除（备份不再需要） |

---

## 7. 风险与回退

### 风险点

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| 动态拼接的 action type 漏判 | 中 | 同时搜索 `dispatch({ type:` 和 `componentActions` 两种模式 |
| 字符串被外部微应用 dispatch | 低 | 项目内 action type 不对外暴露，无此风险 |
| 删除后某个隐藏路径报错 | 中 | 清理范围与用户确认后再执行，必要时回退 |
| 自产自销型死代码误判 | 低 | `component/dependencies` 的调用方 `base/iframe` 已在 packages 死代码审计中确认 |

### 回退方案

- 清理前 git commit 一次
- 必要时 `git revert` 即可恢复

---

## 8. 实施记录

- 2026-07-20：任务创建，开始步骤 1（grep 全量 dispatch 调用点）
- 2026-07-20：完成步骤 1-2，审计报告已输出到 [Redux Action使用度审计](../../research/Redux%20Action使用度审计.md)
  - 总计 30 个 action，其中 **16 个是死代码**（占 53%）
  - 发现 1 个 typo bug：`tab/bind` vs `tab/tabBind`
  - 发现 `componentActions` 常量 10 个里只用了 1 个
  - 发现 `form` slice 整个未被使用（dispatch + useSelector 全零命中）
- 2026-07-20：与用户对齐清理范围（步骤 3）
  - typo bug：判断为死代码，直接删除不修复
  - form slice：整个删除
  - componentActions：全部删除，改为字符串字面量
- 2026-07-20：执行清理（步骤 4），`pnpm tsc --noEmit` 零新增错误
- 2026-07-20：附加调研 `src/packages/` 死代码组件，产出 [packages组件使用度审计](../../research/packages组件使用度审计.md)
  - 用户确认 `packages/container/tabs` 废弃，整目录删除
  - 其他 5 个死代码组件（`base/iframe`、`base/countdown`、`base/index.ts`、`container/rank-panel`、`container/scroll-panel`）按用户要求不删除，仅记录
- 2026-07-20：task-002 标记 done，归档到 `plans/done/`
- 2026-07-20：**补充修复**（用户复核时发现遗漏）
  - 发现 `component/dependencies` 是"自产自销型死代码"（唯一调用方 `packages/base/iframe/custom.js` 是死代码组件）
  - 清理 [component.ts](src/store/modules/component.ts) 中的 `component/dependencies` case + `dependencies` 字段 + initialState
  - 清理 [packages/base/iframe/custom.js](src/packages/base/iframe/custom.js) 中 3 处对 `component/dependencies` 的 dispatch/read（文件本身保留）
  - 同步更新审计报告：死代码 action 数 16 → 17，自产自销型单独说明
  - 修复 task 文档：章节编号去重、实施记录补全、验证清单补齐
- 2026-07-20：**二次补充修复**（用户再次复核时发现）
  - 发现 `tab/tabStore` 也变为死代码：其唯一调用方 `packages/container/tabs/` 在本任务中被整目录删除，导致 `tabStore` 的写入端和读取端全部消失
  - `tab` slice 整个删除（跟 `form` slice 一样的处理），包括 [tab.ts](src/store/modules/tab.ts)、[backup/tab.js.bak](src/store/backup/tab.js.bak)
  - [modules/index.ts](src/store/modules/index.ts) 移除 `tab` 导入和注册
  - 审计报告数字更新：死代码 action 数 17 → 18，占比 57% → 60%
  - `pnpm tsc --noEmit` 仍是 10 个预存在错误，零新增