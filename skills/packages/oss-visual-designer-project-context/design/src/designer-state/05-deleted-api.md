# 05 — 已删除 API 速查

> 配套 [00-README.md](./00-README.md) | 关注点：**grep 到旧 API 时的权威对照**
>
> 以下 API 在单源重构中已从代码库删除，**禁止重新引入**。

---

## 0. 验证标准与方法

### 0.1 验证标准

以下 API 的**活代码调用**应 0 命中：

- ❌ 无 `export function/const X` 定义
- ❌ 无 `X(` 调用
- ✅ 注释中的 task 历史说明允许保留
- ✅ `__tests__/` 中验证已删除的测试用例允许保留

### 0.2 .bak 排除清单（8 个文件）

grep 验证时需排除以下 `.bak` 备份文件（历史快照，不是活代码）：

| # | 文件 |
| --- | --- |
| 1 | `src/designer/renderer/utils.bak.js` |
| 2 | `src/designer/renderer/GeneratorWidget.bak.js` |
| 3 | `src/designer/renderer/DesignerField.bak.jsx` |
| 4 | `src/designer/canvas-graph/index.bak.js` |
| 5 | `src/store/backup/modules-index.js.bak` |
| 6 | `src/store/backup/index.js.bak` |
| 7 | `src/store/backup/component.js.bak` |
| 8 | `src/store/backup/app.js.bak` |

### 0.3 grep 验证方法

```bash
# 示例：验证 mergeByIdIntoTree 是否已删除
# 应只在注释/测试/.bak 中命中
grep -rn "mergeByIdIntoTree" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

---

## 1. 已删除 API（无定义无调用，仅注释/测试残留）

| API | 命中情况 | 原用途 |
| --- | --- | --- |
| `mergeByIdIntoTree` | 注释（`designer-canvas.ts`、`DesignerContent.tsx`）+ 测试 | 把 byId 字段级更新合并到 components 树（三方向：nodeWins / byIdWins / fieldPreserve） |
| `getSaveableComponents` | 无命中 | 保存序列化时把 byId 合并到 tree（byIdWins 方向） |
| `patchFieldConf` | 注释（`utils.ts`、`designer-canvas.ts`） | 工具函数版 patch byId |
| `fieldPreserve` | 注释 + 测试 | mergeByIdIntoTree 的合并方向参数 |
| `dirtyConfigKeys` | 仅测试 | FlatField 字段，记录字段级更新过的 config 字段名 |
| `nodeWins` / `byIdWins` | 随 `mergeByIdIntoTree` 删除 | 三方向字符串字面量 |
| `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` | 仅测试 | skip 机制：设置/清除/检查 skip 标志 |
| `_skipGroupRecalc` | 无活代码 | 模块级变量，skip 标志 |
| `undo` / `redo` | 无命中（死字段） | `DesignerCanvasState` 字段，撤销/重做栈（从未实现） |
| `getFieldById` | 无命中 | 从 byId 读节点（与 `byId[id]` 重复） |
| `getParentIdById` | 无命中 | 从 parentMap 读父节点（与 `parentMap[id]` 重复） |
| `removeFieldFromIndex` | 无命中 | 从 byId/parentMap 删除条目（单源后由 buildIndex 全量重建） |

### 1.1 删除原因

- **双源同步机制**（`mergeByIdIntoTree` / `getSaveableComponents` / `fieldPreserve` / `dirtyConfigKeys`）：单源后 `updateFieldConfig` 改树，components 永远 fresh，无需合并
- **死工具函数**（`patchFieldConf` / `getFieldById` / `getParentIdById` / `removeFieldFromIndex`）：单源后 byId 纯派生，reducer 内 Immer produce 改树 + buildIndex
- **skip 机制**（`beginSkipGroupRecalc` 等）：单源后 `recalcGroupBounds` 简化，`shouldSkipGroupRecalc` 永远 false
- **undo/redo 死字段**：从未实现（无 action 读写）

---

## 2. 已删除 API（注释残留，多文件）

| API | 命中情况 | 替代 |
| --- | --- | --- |
| `useDesigner` | 15 文件注释 | `useSelector` / `useDispatch` / `useFieldConf` |
| `useDesignerSettingChange` | 3 文件注释 | `useFieldConf` |
| `getParent` | 9 文件注释 | `getFieldNodeById` |
| `getFieldConf` | 16 文件注释 | `useFieldConf` |

---

## 3. 禁区 API（代码保留但语义放弃）

| API | 性质 |
| --- | --- |
| `DesignerContext` / `DesignerContext.Provider` | 已删除（Context + 全量 setState 反模式） |
| `DataProvider` 闭包 | 退化为占位组件（仅 `<>{children}</>`） |
| `runtimeComponentsTrigger` | 已删除（EventBus 反模式） |
| `useDebounceMergeConfig` | 已删除（防抖不再需要） |
| `useLevelPath` | 已删除（0 命中，hook 版本） |
| `useFieldNodeById` | 不存在（skill 描述滞后） |
| `useSyncDesignerUpdate` | 已删除（不再需要） |

---

## 4. 澄清：setLevelPath 是活代码

> **`setLevelPath` 不是已删除 API**。

- **定义**：`src/designer/renderer/utils.ts` L152-178
- **性质**：活代码（task-009 不可变版），被 layer-manager 等 3 文件调用
- **已删除的是 `useLevelPath`**（hook 版本，0 命中）

**重写时不得把 `setLevelPath` 列入已删除 API 清单。**

---

## 5. 禁区：禁止绕过 buildIndex 直接赋值 byId/parentMap

```ts
// ❌ 禁止：绕过 buildIndex 直接赋值 byId/parentMap
store.dispatch({ type: 'designerCanvas/setState', payload: { byId: { ...newById } } });
// → reducer 会 console.error + 从 safePayload 中删除 byId

// ❌ 禁止：在 reducer 外用 buildIndex 修改 byId/parentMap
// → 仅 setComponents / setState / updateFieldConfig reducer 内部允许调用 buildIndex

// ✅ 正确：所有 byId/parentMap 更新都通过 reducer 改 components 树 + buildIndex 重建
dispatch(setComponents(newTree));
dispatch(updateFieldConfig(id, patch));
```

详见 [04-principles.md](./04-principles.md) §4 单源契约。

---

## 6. 相关文档

- [00-README.md](./00-README.md) —— 索引页
- [04-principles.md](./04-principles.md) —— 架构原则与禁区
- [06-bugs-and-tests.md](./06-bugs-and-tests.md) —— bug 归档与测试矩阵
