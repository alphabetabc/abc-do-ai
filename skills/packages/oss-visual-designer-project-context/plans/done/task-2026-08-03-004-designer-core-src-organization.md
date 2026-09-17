# task-2026-08-03-004：designer-core src 目录优化

## 背景

`packages-next/designer-core/src/` 当前除 `plugins/` 和 `__tests__/` 外，11 个源文件全部平铺。导致以下问题：

1. **看不出分层**：基础类型、通用工具、领域工具、Store 核心、React 集成、聚合 API 6 种不同性质的代码混在一起
2. **`utils.ts` 命名误导**：实际只含 38 行的 `shallowEqual`，看起来像"杂项工具箱"
3. **`plugins/` 是唯一清晰的子目录**：4 个 plugin 文件 + types 都按"插件系统"主题分组

## 目标

按"职责分层 + 主题分组"原则重组 src/ 目录，使任意文件能通过路径快速判断其角色。**纯文件移动 + import 路径调整，行为不变**。

## 推荐方案（3 层 + core 内拆 store/utils）

### 目标结构

```
src/
├── __tests__/                              # 测试（保持平铺，仅更新 import 路径）
│   ├── test-utils.ts                       # 同层相对导入保留
│   ├── renderHook.tsx
│   └── *.test.ts / *.test.tsx (10 个)
│
├── plugins/                                # 插件系统（已组织，不变）
│   ├── types.ts
│   ├── createRuntimeDataPlugin.ts
│   ├── createDerivedComputePlugin.ts
│   ├── createStructureToolsPlugin.ts
│   └── createCrossSliceSyncPlugin.ts
│
├── core/                                   # 框架核心（vanilla TS，无 React 依赖）
│   ├── types.ts                            # TreeNode / FlatNode / TreeStoreState / UpdateNodePatch / ROOT_ID
│   ├── store/                              # Store 工厂 + 写路径
│   │   ├── createTreeStore.ts              # TreeStoreApi 工厂
│   │   ├── buildIndex.ts                   # 派生索引构建
│   │   └── write-paths.ts                  # updateNodeImmutable
│   └── utils/                              # 纯工具函数（无状态）
│       ├── tree-utils.ts                   # 树遍历 + setLevelPath + setChildren
│       ├── group-bounds.ts                 # 组尺寸 + createRecalcGroupBounds
│       ├── structure-ops.ts                # 结构操作（group/split/delete/getSelectedKeys）
│       ├── getNodeById.ts                  # 递归查找
│       └── shallowEqual.ts                 # 从 utils.ts 重命名
│
├── react/                                  # React 集成层
│   ├── context.tsx                         # DesignerProvider + useDesigner + useDesignerOptional
│   └── hooks.ts                            # useNode / useTree / useFlatTree / useUpdateNode / useLatestState / useExtra
│
├── createDesigner.ts                       # 顶层聚合 API（跨 core + react，保持顶层）
└── index.ts                                # 公共导出（barrel）
```

### 设计理由

| 层级 | 内容 | 角色 |
|---|---|---|
| `core/types.ts` | TreeNode / FlatNode / ROOT_ID 等基础类型 | 整个框架的"合同" |
| `core/store/` | createTreeStore + buildIndex + write-paths | Zustand store + 写路径实现 |
| `core/utils/` | tree-utils + group-bounds + structure-ops + getNodeById + shallowEqual | 无状态纯函数（可独立单元测试） |
| `react/` | context + hooks | React 绑定（不影响 vanilla API） |
| `createDesigner.ts` | 聚合 hooks + 命令式 API | 顶层入口（跨 core + react） |
| `plugins/` | 4 个 plugin 工厂 + types | 已组织，不变 |

**为什么不直接把 `core/` 下文件平铺**：core 内有 9 个文件，平铺后看不出 store 与 utils 的区别。store 是"框架运行时核心"，utils 是"可独立测试的纯函数"——两类完全不同性质，物理分组有助于代码理解。

**为什么不把 `core/types.ts` 移到顶层**：`types.ts` 是 core 的内部合同，仅 core 内部消费；放到顶层会让外部消费者（react/、createDesigner）误以为它是"公共 API"。

## 详细步骤

### 步骤 1：移动文件（11 个）

| 当前路径 | 目标路径 | 操作 |
|---|---|---|
| `src/types.ts` | `src/core/types.ts` | 移动 |
| `src/utils.ts` | `src/core/utils/shallowEqual.ts` | 移动 + 重命名 |
| `src/getNodeById.ts` | `src/core/utils/getNodeById.ts` | 移动 |
| `src/tree-utils.ts` | `src/core/utils/tree-utils.ts` | 移动 |
| `src/group-bounds.ts` | `src/core/utils/group-bounds.ts` | 移动 |
| `src/structure-ops.ts` | `src/core/utils/structure-ops.ts` | 移动 |
| `src/buildIndex.ts` | `src/core/store/buildIndex.ts` | 移动 |
| `src/write-paths.ts` | `src/core/store/write-paths.ts` | 移动 |
| `src/createTreeStore.ts` | `src/core/store/createTreeStore.ts` | 移动 |
| `src/hooks.ts` | `src/react/hooks.ts` | 移动 |
| `src/context.tsx` | `src/react/context.tsx` | 移动 |
| `src/createDesigner.ts` | `src/createDesigner.ts` | 不移动（保持顶层） |

### 步骤 2：更新 src/core/* 内部 import（9 处）

| 文件 | 旧 import | 新 import |
|---|---|---|
| `core/store/createTreeStore.ts` | `./types` | `../types` |
| `core/store/createTreeStore.ts` | `./buildIndex` | `./buildIndex`（同目录） |
| `core/store/createTreeStore.ts` | `./getNodeById` | `../utils/getNodeById` |
| `core/store/createTreeStore.ts` | `./write-paths` | `./write-paths`（同目录） |
| `core/store/createTreeStore.ts` | `./plugins/types` | `../../plugins/types` |
| `core/store/buildIndex.ts` | `./types` | `../types` |
| `core/store/write-paths.ts` | `./types` | `../types` |
| `core/utils/tree-utils.ts` | `./types` | `../types` |
| `core/utils/group-bounds.ts` | `./types` | `../types` |
| `core/utils/structure-ops.ts` | `./types` | `../types` |
| `core/utils/getNodeById.ts` | `./types` | `../types` |

### 步骤 3：更新 src/react/* 内部 import（4 处）

| 文件 | 旧 import | 新 import |
|---|---|---|
| `react/hooks.ts` | `./types` | `../core/types` |
| `react/hooks.ts` | `./utils` | `../core/utils/shallowEqual` |
| `react/hooks.ts` | `./createTreeStore` | `../core/store/createTreeStore` |
| `react/context.tsx` | `./createDesigner` | `../createDesigner` |

### 步骤 4：更新 src/createDesigner.ts（3 处）

| 旧 import | 新 import |
|---|---|
| `./types` | `./core/types` |
| `./createTreeStore` | `./core/store/createTreeStore` |
| `./hooks` | `./react/hooks` |

### 步骤 5：更新 src/plugins/types.ts（1 处）

| 旧 import | 新 import |
|---|---|
| `../types` | `../../core/types` |

### 步骤 6：重写 src/index.ts（公共导出）

按 6 大类分组导出：
1. 聚合 API（createDesigner / DesignerProvider / useDesigner）
2. 核心类型（ROOT_ID / TreeNode / FlatNode / TreeStoreState / UpdateNodePatch）
3. Store factory（createTreeStore）
4. 工具函数（buildIndex / getNodeById / shallowEqual + 5 个 utils + 5 个 group-bounds + 5 个 structure-ops + 2 个 hooks helper）
5. Hooks（useNode / useTree / useFlatTree / useUpdateNode / useLatestState / useExtra）
6. 插件系统（4 类）

### 步骤 7：更新 src/__tests__/* 测试文件 import（~24 处）

每个测试文件的 `../xxx` → `../../core/xxx` 或 `../../react/xxx`：
- `./test-utils` 保持（同一目录）
- `./renderHook` 保持（同一目录）
- `../types` → `../../core/types`
- `../xxx` → `../../core/utils/xxx`（如 tree-utils、group-bounds、structure-ops、getNodeById、shallowEqual）
- `../xxx` → `../../core/store/xxx`（如 createTreeStore、buildIndex、write-paths）
- `../hooks` → `../../react/hooks`
- `../createDesigner` → `../../createDesigner`

### 步骤 8：验证

```bash
pnpm --filter @fedx-vis/designer-core typecheck
pnpm --filter @fedx-vis/designer-core test
```

期望：
- typecheck 通过（0 error）
- test 通过（183 tests pass，无回归）

## 风险

| ID | 风险 | 缓解 |
|---|---|---|
| R1 | import 路径遗漏（漏改一处导致 typecheck 失败） | 步骤 7 完成后跑 typecheck；如有错误按报错定位 |
| R2 | 测试文件 import 遗漏 | typecheck + test 双重验证 |
| R3 | `index.ts` barrel export 顺序错乱（不影响功能但影响体验） | 按 group 顺序导出 + 注释分组 |
| R4 | `__tests__/renderHook.tsx` 引用的 source 路径可能引用 `../xxx`，需同步更新 | 步骤 7 统一处理 |
| R5 | 文档（`docs/api/`、`docs/guide/`）有引用源码路径的链接（如 `./structure-ops.ts`） | typecheck 通过后再决定是否需要更新文档（本期不动文档） |
| R6 | 移动文件后 git history 断裂 | 用 `git mv` 保留 history（若文件尚未 commit 则接受重新生成 history） |
| R7 | `shallowEqual` 从 `utils.ts` 重命名为 `shallowEqual.ts` 后，外部包（如 `designer-next`）若引用了 `@fedx-vis/designer-core` 的 `shallowEqual` 子路径（不通过 index.ts barrel）会断 | 检查外部 consumer 是否走 barrel；本期不假设有直接子路径引用 |

## 回退

按 git revert 单 commit 回退。所有变更应在同一 commit 内完成以保证一致性：
1. `git revert HEAD` 即可

若 commit 未合并：直接 `git reset --hard HEAD~1`（用户授权后）。

## 实施记录

### 完成日期：2026-08-03

### 执行步骤

1. ✅ 创建目录 `core/store/`、`core/utils/`、`react/`
2. ✅ 移动 11 个源文件 + 重命名 `utils.ts → shallowEqual.ts`
3. ✅ 更新 `core/*` 内部 import（11 处）
4. ✅ 更新 `react/*` 内部 import（4 处）
5. ✅ 更新 `createDesigner.ts` 和 `plugins/types.ts` import（4 处）
6. ✅ 重写 `index.ts` barrel export（按 6 大类分组）
7. ✅ 更新 `__tests__/*` import（22 处，脚本批量替换）
8. ✅ 验证 typecheck + test 通过

### 实施期发现 vs 计划偏差

**偏差 1**：4 个 plugin 文件未在计划中列出（计划只列了 `plugins/types.ts`）
- 实际：`createDerivedComputePlugin.ts` / `createRuntimeDataPlugin.ts` / `createStructureToolsPlugin.ts` / `createCrossSliceSyncPlugin.ts` 都从 `../types` import 基础类型
- 修复：4 个文件都加 `../types` → `../core/types`

**偏差 2**：测试文件 import 路径批量写错 `../../core/xxx`（应为 `../core/xxx`，因测试在 `src/__tests__/` 内）
- 实际：从 `src/__tests__/xxx.ts` 到 `src/core/types.ts` 只需 `../core/types`（一级），而非 `../../core/types`（两级会到 `packages-next/` 目录）
- 修复：用 PowerShell 脚本批量替换 `../../core/` → `../core/`、`../../plugins/` → `../plugins/`、`../../react/` → `../react/`、`../../index` → `../index`

**偏差 3**：`write-paths.test.ts` 第 198 行有一处动态 `import('../write-paths')` 未匹配到批量替换规则
- 修复：手动改为 `await import('../core/store/write-paths')`

**未修复（与本 task 无关）**：
- `tree-utils.test.ts(223,9): error TS2578: Unused '@ts-expect-error' directive.` —— 预存在问题，按 AGENTS.md §10.2 "不要主动修复 packages/* 下 tsc pre-existing 错误" 同款原则，不修。

### 文件清单

- 新建目录：`src/core/store/`、`src/core/utils/`、`src/react/`
- 移动 + 重命名文件：11 个源文件 + `utils.ts → shallowEqual.ts` 重命名
- 更新 import：~41 处（core/* 11 处 + react/* 4 处 + createDesigner.ts 3 处 + plugins/* 5 处 + __tests__/* 22 处 + write-paths.test.ts 1 处）
- 重写：`src/index.ts`

总影响：约 50 处变更（含 12 个文件移动 + 41 处 import + index.ts 重写）。

### 验证结果

```
pnpm --filter @fedx-vis/designer-core typecheck  → exit 0
pnpm --filter @fedx-vis/designer-core test      → 183 tests passed (10 test files)
```

无回归。

### 后续任务候选

- 不需要（结构优化是终态）

### 文档同步更新（2026-08-03 追加）

按 AGENTS.md §9.5 "完成实施后，同步更新文档使其与代码一致"，已更新以下文档：

| 文档 | 更新内容 |
|---|---|
| `packages-next/designer-core/docs/guide/state-management-design.md` | §514-516 行 3 处路径：types.ts → core/types.ts，buildIndex.ts → core/store/buildIndex.ts，createTreeStore.ts/write-paths.ts/hooks.ts 同步移动，context.tsx → react/context.tsx |
| `.trae/documents/design/designer-core/00-overview.md` | §291 行 context.tsx → react/context.tsx；§310 行 hooks.ts → react/hooks.ts |
| `.trae/documents/research/节点类型变体研究.md` | §281 行 types.ts → core/types.ts；§394-395 行 types.ts/buildIndex.ts 同步移动 |

### 未更新的历史计划文档（按 §9.5 故意保留）

`plans/done/` 下的历史 task 文档（如 `task-2026-07-30-001-designer-core-framework.md` 包含 `src/types.ts`、`src/utils.ts`、`src/hooks/useField.ts` 等早期路径）保留不动。这些是历史快照，记录的是当时的规划决策，修改会破坏时间线。后续若有新需求可新建 task 引用。

### 与 task-002/003 的关系

- task-002 落地的 `group-bounds.ts`、`mergeFieldConfig`、`createRecalcGroupBounds` 被移动到 `core/utils/group-bounds.ts`，行为不变
- task-003 落地的 `structure-ops.ts` 5 个函数被移动到 `core/utils/structure-ops.ts`，行为不变
- 本任务纯物理移动，逻辑零变更