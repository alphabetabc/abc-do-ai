# 06 — Bug 归档与测试矩阵

> 配套 [00-README.md](./00-README.md) | 关注点：**修复前先查这里，避免重复排查**
>
> **历史归档**：所有 bug 均已修复 🟢。bug 详情通过速查表的修复一句话 + 指向对应 task plan 链接即可。task plan 归档于 `.trae/skills/oss-visual-designer-project-context/plans/done/`。

---

## 0. 速查表

| # | bug | 状态 | 修复 |
| --- | --- | --- | --- |
| 1 | `setComponents` 路径改名丢失 | 🟢 已修 | 单源架构下 components 唯一真相，无 `mergeByIdIntoTree` 覆盖 |
| 2 | `handleAlign` 多选对齐 pre-existing | 🟢 已修 | 改回方案 B（1 次 `setComponents`）+ 单源闭包永远 fresh |
| 3 | `setLevelPath` 丢弃返回值 | 🟢 已修 | task-012-c |
| 4 | `drag2layoutBlock` `updateFieldConfig` 不同步 | 🟢 已修 | 单源后 `updateFieldConfig` 改树 + `buildIndex`，components 永远 fresh |
| 5 | `useDesignerSettingChange` 高频 path 不走 React | 🟢 已删 | task-007 |
| 6 | `runtimeComponentsTrigger` EventBus | 🟢 已删 | task-007 |
| 7 | `useDebounceMergeConfig` 30ms 防抖 | 🟢 已删 | task-008 |
| 8 | `useSyncDesignerUpdate` 全局通知 | 🟢 已删 | task-007 |
| 9 | layer-manager mutation（splice/push） | 🟢 已修 | task-010 |
| 10 | `configuration-panel/page` render 内 mutation | 🟢 已修 | task-011-fix |
| 11 | designer-field `parents.children` mutation | 🟢 已修 | task-010 |
| 12 | `getFieldConf` / `getParent` cloneDeep 滥用 | 🟢 已删 | task-009 |
| 13 | `handleAlign` 闭包覆盖 | 🟢 已修 | 单源后闭包 components 永远 fresh，从根本上消除 |
| 14 | `setState` 丢弃字段 | 🟢 已修 | 拆 `setState` 为 `setComponents` + `setDesignerCanvasState` |
| 15 | `splitGroup` / `generatorGroup` byId 不含 children | 🟢 已修 | 签名扩展：接收 byId + parentMap 参数 |
| 16 | 组点击不到 | 🟢 已修 | 修复 group 选中事件 |
| 17 | 改名丢失 | 🟢 已修 | 单源架构根本解决（components 唯一真相） |
| 18 | 组内成组爆栈 | 🟢 已修 | 修复 `splitGroup` 递归 |
| 19 | 组内对齐跳变 | 🟢 已修 | task-012-d |
| 20 | 保存丢失（拖拽/配置面板改属性） | 🟢 已修 | 单源后 components 永远 fresh + 直接序列化 |
| 21 | 拖拽组内子组件组尺寸不更新 | 🟢 已修 | 单源后 components 永远 fresh，`recalcGroupBounds` 直接读 `parents.children` |
| 22 | mutation 残留 + cloneDeep 滥用 | 🟢 已修 | task-2026-07-28-001 清理剩余 mutation，全部改为不可变操作 |
| 23 | stale tree 防御性读取未统一封装 | 🟢 已修 | 单源架构根本消除：`updateFieldConfig` 改树 + `buildIndex`，components 永远 fresh |
| 24 | layout-block onResize 子组件不级联缩放 | 🟢 已修 | `getResizedComponents` 改用 `getFieldNodeById` 取带 children 节点 |
| 25 | tree 拖拽节点入组/出组后组尺寸不更新 | 🟢 已修 | `useOnDrop` trigger 追加 `dispatch(component/selected)` + `recalcGroupInTree` |

---

## 1. 测试覆盖矩阵

**运行命令**：`pnpm test`（等价 `vitest run`），共 72 个测试用例全部通过。

| # | 测试目标 | 优先级 | 测试文件 | 用例数 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | `buildIndex` 引用复用 | P0 | `src/designer/renderer/__tests__/utils-buildIndex.spec.ts` | 7 | 回归 task-002 步骤 2（buildIndex 移到 produce 外） |
| 2 | `updateFieldConfig` 边界 | P0 | `src/store/modules/__tests__/designer-canvas-updateFieldConfig.spec.ts` | 10 | reducer 契约：不存在 uniqueId / 空 patch / ROOT 防护 / 浅合并 |
| 3 | `setState` byId 防护 | P0 | `src/store/modules/__tests__/designer-canvas-setState.spec.ts` | 7 | 单源原则：byId/parentMap 不允许直接赋值 |
| 4 | Bug #1：`syncGroupSize2Children` 对 FlatField | P1 | `src/designer/renderer/designer-field/__tests__/getResizedComponents.spec.ts` | 8 | 回归 task-2026-07-28-006（取带 children 节点） |
| 5 | Bug #2：`recalcGroupInTree` 纯函数组合 | P1 | `src/designer/aside-panel/layers-tree/tree/__tests__/useOnDrop.spec.ts` | 10 | 回归 task-2026-07-28-007（拖拽后组尺寸重算） |
| 6 | Bug #3：`propsValue` useMemo 依赖 | P1 | `src/designer/renderer/designer-field/__tests__/useFieldConf-propsValue.spec.ts` | 6 | 回归 task-2026-07-28-008（补充 children 依赖） |
| 7 | `setComponents` 直接赋值 | P2 | `src/store/modules/__tests__/designer-canvas-setComponents.spec.ts` | 12 | 单源验证 + fieldPreserve/mergeByIdIntoTree 已删除（源码扫描） |
| 8 | `recalcGroupBounds` 简化 | P2 | `src/designer/__tests__/recalcGroupBounds.spec.ts` | 10 | 无 freshChildNodes / beginSkipGroupRecalc（源码扫描） |

> 测试设计原则：直接测 reducer / 纯函数（不通过 store），避免 redux-persist / middleware 干扰。

> ⚠️ **关于 commit hash 引用**：本目录文档中的回归测试说明原引用具体 commit hash（如 `0a385e5` / `93fcfe1`），squash 后这些 hash 已失效，已改为 task 编号引用。`plans/done/` 下的 task 文件作为历史实施记录仍保留原始 hash（记录当时的事实），grep 到时请注意 squash 后无法 `git show` 这些 hash。

---

## 2. 排查 checklist（新增 bug 时）

新增 bug 时按以下 checklist 排查，看是否是已知问题：

- [ ] 是 "读不到最新值" 类？看 [03-read-path.md](./03-read-path.md)
- [ ] 是 "保存后字段丢失" 类？看 [03-read-path.md](./03-read-path.md) §保存序列化
- [ ] 是 "组操作异常" 类？看 [02-write-path.md](./02-write-path.md) §recalcGroupBounds
- [ ] 是 "拖拽异常" 类？看 [02-write-path.md](./02-write-path.md) §recalcGroupInTree（单源后闭包永远 fresh，无 stale 风险）
- [ ] 是 "性能问题" 类？看 [04-principles.md](./04-principles.md)（mutation / cloneDeep）
- [ ] 是 "render 内 mutation" 类？看 §0 速查表 #22

---

## 3. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [02-write-path.md](./02-write-path.md) —— 写路径
- [03-read-path.md](./03-read-path.md) —— 读路径
- [04-principles.md](./04-principles.md) —— 架构原则与禁区
- [05-deleted-api.md](./05-deleted-api.md) —— 已删除 API 速查
- 任务归档：`.trae/skills/oss-visual-designer-project-context/plans/done/`
