# task-2026-07-29-007 — designer-state 文档群基于源码事实重写

> 状态：`done`
> 类型：`chore`（文档重构）
> 创建：2026-07-29
> 完成：2026-07-29
> 前置：task-006（文档群结构重构）已完成，但文档内容基于旧文档去历史化，未对照源码验证

---

## 1. 背景

### 1.1 问题

task-006 完成了 `designer-canvas-state/` 目录结构重构，但存在两个层面的问题：

1. **内容层面**：文档内容从旧文档去历史化得来，不是对照源码重新验证的。经源码验证发现 53 处事实偏差。
2. **结构层面**：9 份文档存在职责重叠、割裂数据流、命名模糊等问题：
   - `01-types` 与 `02-state` 边界模糊（FlatField 两处定义）
   - `05-edge-cases` 太薄（122 行）且与 03/04 高度交织
   - `07-principles` 过载（462 行，4 种读者群挤一个文件）
   - `08-view-slices` 与 designerCanvas 是并列 slice，放一起误导读者
   - `00-README` 的"一页纸概览"与 01/02/03 重复 60+ 行

### 1.2 目标

**基于当前源码事实，重构 `designer-state/` 目录（8 份文档），使每条事实都能由源码验证。**

核心改动：
- 目录从 `designer-canvas-state/`（9 份）→ `designer-state/`（8 份）
- 合并 01+02 → `01-data-model.md`（消除 FlatField/WidgetItem 重复定义）
- 拆 05 并入 02/03（边界场景就近归属读写路径）
- 拆 07 → `04-principles.md` + `05-deleted-api.md`（原则与已删除 API 分离）
- 精简 00-README（删除"一页纸概览"，只保留索引+导航）
- view-slices 保留在同目录（`07-view-slices.md`），canvas + view 统一为 designer-state

### 1.3 预期收益

| 维度 | 现状（9 份） | 优化后（8 份） |
| --- | --- | --- |
| 总行数 | 2448 | ~1670（-32%） |
| 最大单文件 | 481 行 | ~320 行 |
| 跨文件跳转（拖拽全流程） | 4 个文件 | 2 个文件 |
| FlatField 定义处 | 2 处 | 1 处 |
| save 序列化描述处 | 3 处 | 1 处 |
| recalcGroupBounds 描述处 | 3 处 | 1 处 |

---

## 2. 新目录结构

```
.trae/documents/design/
└── designer-state/                # 统一目录（canvas + view）
    ├── 00-README.md               # 索引+导航（~60 行）
    ├── 01-data-model.md           # 类型+state+派生索引（~320 行）
    ├── 02-write-path.md           # 写路径+写边界（~280 行）
    ├── 03-read-path.md            # 读路径+读边界（~260 行）
    ├── 04-principles.md           # 原则+禁区+自检（~280 行）
    ├── 05-deleted-api.md          # 已删除 API 速查（~100 行）
    ├── 06-bugs-and-tests.md       # bug 归档+测试矩阵（~80 行）
    └── 07-view-slices.md          # viewCanvas+viewUI（~290 行）
```

### 文档职责对照

| 新文档 | 来源 | 职责 |
| --- | --- | --- |
| `00-README.md` | 原 00（精简） | 纯索引+导航，删除"一页纸概览" |
| `01-data-model.md` | 原 01+02 合并 | 数据是什么：类型定义+state 形状+派生索引+单源契约 |
| `02-write-path.md` | 原 03+05§1/§3 | 怎么改 state：action+reducer+写边界场景 |
| `03-read-path.md` | 原 04+05§2 | 怎么读 state：订阅+同步读+保存序列化+读边界场景 |
| `04-principles.md` | 原 07§0-§10 | 架构原则+禁区+提交前自检（不含已删除 API） |
| `05-deleted-api.md` | 原 07§11 独立 | 已删除 API 速查表（grep 到旧 API 时的权威对照） |
| `06-bugs-and-tests.md` | 原 06 | bug 历史归档+测试覆盖矩阵 |
| `07-view-slices.md` | 原 08 | viewCanvas+viewUI 完整文档 |

---

## 3. 源码验证发现的事实差异清单

> 以下差异已通过 Read/Grep 对照源码当场验证。
>
> **定位策略**：统一为"文件路径 + 函数名/接口名 + 当前行号（标注验证日期）"。行号随代码变更可能失效，函数名是主要定位依据。

### 3.1 state 形状 → `01-data-model.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 1 | `components: WidgetItem[]` | `components: any[]`（源码未给泛型） | `designer-canvas.ts` `DesignerCanvasState` L23 |
| 2 | `page: PageConfig` | `page: any`（源码未给类型） | `designer-canvas.ts` L29 |
| 3 | `realtimeDataFlow: RealtimeDataFlowItem[]` | `realtimeDataFlow: any[]` | `designer-canvas.ts` L31 |
| 4 | `meta: Record<string, any>` | 正确 | `designer-canvas.ts` L35 |
| 5 | initialState.page | 源码含 `customPageSize: { width: 0, height: 0 }`，文档未提及 | `designer-canvas.ts` `initialState` L54-57 |
| 6 | `appScopeId` | 正确 | `designer-canvas.ts` L21 |

### 3.2 类型定义 → `01-data-model.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 7 | WidgetConfig 含轮播字段 | 源码 `WidgetConfig` 只有 6 字段 + index signature；轮播字段在 `group-field/index.jsx` 和 `utils.ts` `generatorGroup` configs（L467-470）中有但不导出为 TS 类型 | `GeneratorWidget.tsx` `WidgetConfig` L9-17 |
| 8 | WidgetItem 含 `parentUniqueId` | 源码 **不含**，该字段是 `flatDesignerList` 运行时注入 | `GeneratorWidget.tsx` `WidgetItem` L24-29 |
| 9 | `WidgetType` 字符串 union | 源码用 `FIELD_COMP_TYPES` 枚举 | `constants.ts` `FIELD_COMP_TYPES` L138-153 |
| 10 | DataSource 类型 | 源码有 `DataSource` 类型，字段结构与 WidgetItem 不同 | `designer-field/types.ts` `DataSource` L3-21 |
| 11 | PageConfig 完整接口 | 源码只导出 `schema` 对象，PageConfig 实际是 `any` | `page/schema.ts` L1 |
| 12 | SchemaConfig 顶层结构 | 源码 `designer-parser/index.jsx` 无 TS interface，是运行时 props 解构 | `designer-parser/index.jsx` L15 |

### 3.3 写路径 → `02-write-path.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 13 | action 全表 8 个 | 正确 | `designer-canvas.ts` reducer L67-215 |
| 14 | setComponents reducer | 需删除"旧（双源）"注释残留 | `designer-canvas.ts` `setComponents` case L68-80 |
| 15 | updateFieldConfig reducer | 需验证 MAX_DEPTH=100、parentMap 反向追踪、modified 标记 | `designer-canvas.ts` `updateFieldConfig` case L117-178 |
| 16 | setComponents 签名 | `setComponents = (components: any[]) => ({...})` | `designer-canvas-actions.ts` L29-32 |
| 17 | updateFieldConfig 签名 | `updateFieldConfig = (uniqueId: string, patch: any) => ({...})` | `designer-canvas-actions.ts` L43-46 |
| 18 | setDesignerCanvasState 签名 | `setDesignerCanvasState = (payload: Partial<DesignerCanvasState>) => ({...})` | `designer-canvas-actions.ts` L15-18 |
| **18b** | **setDesignerCanvasState 调用方** | **4 个调用方**：DesignerContent.tsx L14,159,171,174；toolbar/index.js L8,337；page/index.jsx L4,28,37；layers-tree/index.tsx。**第三条写路径**，reducer 内走 setComponents 同逻辑 | 同上 |
| 19 | generatorField | `generatorField(fields, type = 'field', opts = {}, resetChildrenUniqueId = false)` | `utils.ts` L69-92 |
| 20 | generatorGroup | `generatorGroup(fields, byId, parentMap, selected, rootParent)` — 5 参数 | `utils.ts` L437-483 |
| 21 | splitGroup | `splitGroup(fields, byId, parentMap, selected, rootParent)` — 5 参数 | `utils.ts` L484-516 |
| 22 | getSelectedKeys | `getSelectedKeys(byId, parentMap, keys)` — 3 参数 | `utils.ts` L307-321 |
| 23 | deleteFieldByUniqueId | `deleteFieldByUniqueId(parentChildren, uniqueId)` | `utils.ts` L275-303 |
| 24 | setChildren | `setChildren(fields, id, children)` | `utils.ts` L100-122 |
| 25 | mergeFieldConfig | `mergeFieldConfig(fields, opts, value)` — opts 含 `{ parentId, level, replace }` | `utils.ts` L208-237 |
| 26 | setLevelPath | `setLevelPath(nodes, parentNode, key = 'drillDownLevel'): any[]` — **活代码**（task-009 不可变版），被 layer-manager 等 3 文件调用 | `utils.ts` L152-178 |
| 27 | getFieldOrderBy | `getFieldOrderBy(fields, id)` 返回 `{ index, components }` | `utils.ts` L265-273 |
| 28 | orderBy | `orderBy(arr, next, prev)` | `utils.ts` L247-253 |
| **28b** | **getFieldNodeById** | `getFieldNodeById(components: any[], uniqueId: string): any \| null` — task-012-c 核心函数，替代已删 getParent。15 个调用方。不 cloneDeep | `utils.ts` L141；注释 L124-130 |
| 29 | handleAlign | 实际位于 `canvas-graph/index.tsx` `handleAlign` L312，走 `store.getState().designerCanvas.byId` 同步读 + setComponents | `canvas-graph/index.tsx` L312-417 |

### 3.4 读路径 → `03-read-path.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 30 | useFieldConf | `useFieldConf = (uniqueId: string) => useSelector(...)` | `hooks.ts` `useFieldConf` L86-90 |
| 31 | useUpdateFieldConfig | 返回 `(uniqueId, patch) => void` | `hooks.ts` `useUpdateFieldConfig` L102-110 |
| 32 | useFlatComponents | 返回 `[flatComponents]`（不是 `[flatComponents, forceUpdate]`） | `hooks.ts` `useFlatComponents` L189-193 |
| 33 | useRealtimeDataFlow | 返回 `{ record, del }` | `hooks.ts` L131-147 |
| 34 | useCustomFieldsList | 返回 `{ get, record, del }` | `hooks.ts` L159-177 |
| 35 | 保存序列化 | 直接读 `designerState.components`，`customFieldsListMapping` 序列化为 `{}` | `DesignerContent.tsx` `handleSave` L350-363 |
| 36 | 保存路径 | 2 保存点 + 1 postMessage + 2 preview 侧：① DesignerContent.tsx L344；② saveAsTemp-modal L56-59；③ designer-scene-monitor L37-47；④ useMaterialData.ts；⑤ useCompDetailData4Designer.ts | Grep 验证 |

### 3.5 边界场景 → `02-write-path.md` + `03-read-path.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 37 | recalcGroupBounds | `store.subscribe` 回调，**内部调用 `setState({ components: results })` wrapper**（L160-176），含 components 键时走 `dispatch(setComponents(...))` | `DesignerContent.tsx` L287-321；setState wrapper L160-176 |
| 38 | isRecalcRef | `useRef(false)`，recalcGroupBounds 开头检查、setComponents 前后置位 | `DesignerContent.tsx` L284-319 |
| 39 | recalcGroupBounds 触发 | 读 `getState().component.selected`，检查 selected[0] 父组尺寸 | `DesignerContent.tsx` L291-310 |
| 40 | recalcGroupInTree | `useOnDrop.ts` L22-35，拖拽出组/入组场景 | `useOnDrop.ts` L22-35 |
| 41 | getResizedComponents | onResize 时用 getFieldNodeById 取完整节点传给 syncGroupSize2Children | `designer-field/utils.ts` L152-178 |
| **41b** | **键盘快捷键** | handleKey2Save（ctrl+s）+ handleDelete（delete），`window.addEventListener('keydown')` | `DesignerContent.tsx` L387-428 |
| **41c** | **3 个异常输入边界** | ① updateFieldConfig 传不存在 id：L129 边界检查；② setComponents 传空数组：L166 补 realtimeDataFlow:[] 和 customFieldsListMapping:{}；③ setState 同时传 components 和 byId：L89-93 console.error + 删除 byId | `designer-canvas.ts` L89-93,L129；`DesignerContent.tsx` L166 |

### 3.6 view slices → `07-view-slices.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 42 | ViewCanvasState | 8 字段：scale/lines/startX/startY/rulerWidth/rulerHeight/width/height | `view-canvas.ts` L16-33 |
| 43 | ViewUIState | 8 字段：tabsKey/layerCollapsed/layersTreeCollapsed/materialsListCollapsed/settingCollapsed/canvasToolbarCollapsed/visible/isShowReferLine | `view-ui.ts` L14-31 |
| 44 | viewCanvas hooks | 8 个字段级 hook | `hooks.ts` L50-57 |
| 45 | viewUI hooks | 8 个字段级 hook | `hooks.ts` L61-68 |
| 46 | updateView | `createAction<DesignerViewPayload>('designerView/updateView')`，两 slice 通过 extraReducers 监听 | `view-actions.ts` L13-15 |
| 47 | useSetView | 用 `batch(() => dispatch(updateView(partial)))` | `hooks.ts` L36-46 |
| 48 | resetViewCanvas/resetViewUI | 两 slice 各自有 reset action | `view-canvas.ts` L53；`view-ui.ts` L51 |

### 3.7 FlatField / buildIndex → `01-data-model.md`

| # | 当前文档 | 源码事实 | 源码位置 |
| --- | --- | --- | --- |
| 49 | FlatField | `{ uniqueId: string; type: string; parentId: string; data: { config: any; [key: string]: any } }` — 正确 | `utils.ts` `FlatField` L642-647 |
| 50 | buildIndex 签名 | `buildIndex(components: any[], oldById?: Record<string, FlatField>)` 返回 `{ byId, parentMap }` | `utils.ts` `buildIndex` L664-697 |
| 51 | buildIndex 引用复用 | L678-687：`oldEntry.data === node.data` 时复用旧条目 | `utils.ts` L678-687 |
| 52 | buildIndex 不遍历 drillDown | 只遍历 `node.children` | `utils.ts` L654-656 |
| 53 | ROOT_UNIQUE_ID | `export const ROOT_UNIQUE_ID = '-'` | `utils.ts` L22 |
| **53b** | **循环引用** | 不做检测，依赖 Immer 保证无环 | `utils.ts` `buildIndex` L664-697 |

### 3.8 已删除 API → `05-deleted-api.md`

> **验证标准**：以下 API 的**活代码调用**应 0 命中（无 `export function/const X` 定义、无 `X(` 调用）；注释中的 task 历史说明和 `__tests__/` 中验证已删除的测试用例允许保留。
>
> **.bak 排除清单**（8 个文件）：`renderer/utils.bak.js`、`renderer/GeneratorWidget.bak.js`、`renderer/DesignerField.bak.jsx`、`canvas-graph/index.bak.js`、`store/backup/modules-index.js.bak`、`store/backup/index.js.bak`、`store/backup/component.js.bak`、`store/backup/app.js.bak`

#### 3.8.1 已删除 API（无定义无调用，仅注释/测试残留）

| API | 命中情况 |
| --- | --- |
| `mergeByIdIntoTree` | 注释（designer-canvas.ts、DesignerContent.tsx）+ 测试 |
| `getSaveableComponents` | 无命中 |
| `patchFieldConf` | 注释（utils.ts、designer-canvas.ts） |
| `fieldPreserve` | 注释 + 测试 |
| `dirtyConfigKeys` | 仅测试 |
| `nodeWins` / `byIdWins` | 随 mergeByIdIntoTree 删除 |
| `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` | 仅测试 |
| `_skipGroupRecalc` | 无活代码 |
| `undo` / `redo` | 无命中（死字段） |
| `getFieldById` / `getParentIdById` / `removeFieldFromIndex` | 无命中 |

#### 3.8.2 已删除 API（注释残留，多文件）

| API | 命中情况 | 替代 |
| --- | --- | --- |
| `useDesigner` | 15 文件注释 | useSelector / useDispatch / useFieldConf |
| `useDesignerSettingChange` | 3 文件注释 | useFieldConf |
| `getParent` | 9 文件注释 | getFieldNodeById |
| `getFieldConf` | 16 文件注释 | useFieldConf |

#### 3.8.3 禁区 API（代码保留但语义放弃）

| API | 性质 |
| --- | --- |
| `DesignerContext` / `DesignerContext.Provider` | 已删除 |
| `DataProvider` 闭包 | 退化为占位组件 |
| `runtimeComponentsTrigger` | 已删除 |
| `useDebounceMergeConfig` | 已删除 |
| `useLevelPath` | 已删除（0 命中） |
| `useFieldNodeById` | 不存在（skill 描述滞后） |

#### 3.8.4 澄清：setLevelPath 是活代码

> **`setLevelPath` 不是已删除 API**。它是活代码（task-009 不可变版），定义在 `utils.ts` L152-178，被 layer-manager 等 3 文件调用。已删除的是 `useLevelPath`（hook 版本）。重写时**不得把 setLevelPath 列入已删除 API 清单**。

---

## 4. 重写策略

### 4.1 核心原则

1. **源码为准**：每条事实标注源码位置（文件路径 + 函数名/接口名 + 当前行号 + 验证日期）
2. **区分"源码类型"和"概念模型"**：源码中很多字段是 `any`，文档应说明"源码类型"和"运行时实际结构"
3. **不贴大段代码**：单段引用不超过 5 行；超过 5 行的 reducer 只描述关键逻辑 + 链接到源码行号范围
4. **工具函数签名精确**：标注源码参数名和默认值；参数类型若源码为 any 则标注 any，概念类型在注释中补充

### 4.2 各文档定位

| 文档 | 定位 |
| --- | --- |
| `00-README.md` | 纯索引+导航，**删除"一页纸概览"**（避免与 01/02/03 重复） |
| `01-data-model.md` | 合并原 01+02。数据是什么：类型定义+state 形状+派生索引+单源契约。FlatField 只定义一次 |
| `02-write-path.md` | 合并原 03+05§1/§3。怎么改 state：action+reducer+写边界场景（recalcGroupBounds/isRecalcRef/异常输入）。保留 setDesignerCanvasState 章节 |
| `03-read-path.md` | 合并原 04+05§2。怎么读 state：订阅+同步读+保存序列化+读边界场景。保留 getFieldNodeById 章节 |
| `04-principles.md` | 原拆出。架构原则+禁区+提交前自检（不含已删除 API） |
| `05-deleted-api.md` | 原 07§11 独立。已删除 API 速查表，grep 到旧 API 时的权威对照 |
| `06-bugs-and-tests.md` | 保留。bug 历史归档+测试覆盖矩阵，标注"历史归档" |
| `07-view-slices.md` | 原 08。viewCanvas+viewUI 完整文档，与 canvas 并列但在同目录 |

---

## 5. 详细步骤

### 阶段 0：目录迁移

**操作**：
- 新建 `.trae/documents/design/designer-state/` 目录
- 删除旧的 `designer-canvas-state/` 目录下的 9 份文档（内容将在后续阶段基于源码重写，不沿用旧内容）
- 原 `designer-canvas/` 目录（task-006 前的旧文档）保留作为历史归档

**验证**：
- [ ] `designer-state/` 目录存在且为空
- [ ] `designer-canvas-state/` 目录已删除
- [ ] `designer-canvas/` 目录保留

### 阶段 1：重写 `01-data-model.md`

**操作**：
- 合并原 01-types + 02-state，去重（FlatField 只定义一次，WidgetItem 只定义一次）
- 修正 WidgetConfig：从源码 `GeneratorWidget.tsx` `WidgetConfig` L9-17 提取 6 字段
- 修正 WidgetItem：删除 `parentUniqueId`（运行时注入）
- 修正 WidgetType：改为 `FIELD_COMP_TYPES` 枚举引用
- 修正 PageConfig：说明源码是 `any`
- 修正 SchemaConfig：说明源码无 TS interface
- 新增 DataSource 类型
- 修正 DesignerCanvasState：标注源码精确类型（`any[]`）+ 概念类型
- 逐字段列出 initialState
- FlatField / buildIndex / ROOT_UNIQUE_ID 章节对照源码验证
- 单源契约 + 持久化
- 每个类型标注源码位置

**验证**：
- [ ] WidgetConfig 与 `GeneratorWidget.tsx` `WidgetConfig` L9-17 一致
- [ ] WidgetItem 不含 `parentUniqueId`
- [ ] WidgetType 引用 `FIELD_COMP_TYPES`
- [ ] PageConfig 说明源码是 `any`
- [ ] DataSource 与 `designer-field/types.ts` `DataSource` L3-21 一致
- [ ] SchemaConfig 说明源码无 TS interface
- [ ] DesignerCanvasState 与 `designer-canvas.ts` L19-36 一致
- [ ] initialState 与 `designer-canvas.ts` L38-62 一致
- [ ] FlatField 与 `utils.ts` `FlatField` L642-647 一致
- [ ] buildIndex 与 `utils.ts` `buildIndex` L664-697 一致
- [ ] setComponents 同步保证与 `designer-canvas.ts` L68-80 一致
- [ ] FlatField 只定义一次（无重复）

### 阶段 2：重写 `02-write-path.md`

**操作**：
- 合并原 03-write-path + 05-edge-cases §1/§3
- action 全表：8 个 action，每个标注源码行号
- setComponents reducer：关键逻辑 + 源码链接（不贴完整代码）
- updateFieldConfig reducer：关键逻辑 + 源码链接
- **保留 setDesignerCanvasState 章节**：第三条写路径，4 个调用方
- 工具函数签名表：13 个函数（含 getFieldNodeById），精确到参数名和默认值
- handleAlign：定位 `canvas-graph/index.tsx` L312
- recalcGroupBounds：store.subscribe 回调 + setState wrapper
- isRecalcRef：useRef(false) + 置位时机
- recalcGroupInTree：useOnDrop.ts L22-35
- getResizedComponents：getFieldNodeById 取完整节点
- 键盘快捷键：ctrl+s / delete
- 3 个异常输入边界

**验证**：
- [ ] 8 个 action 与 `designer-canvas.ts` reducer L67-215 一致
- [ ] setComponents reducer 关键逻辑与 L68-80 一致
- [ ] updateFieldConfig reducer 关键逻辑与 L117-178 一致
- [ ] 13 个工具函数签名与源码一致
- [ ] setDesignerCanvasState 4 个调用方列出
- [ ] handleAlign 定位 `canvas-graph/index.tsx` L312
- [ ] recalcGroupBounds + setState wrapper 说明
- [ ] isRecalcRef 与 L284-319 一致
- [ ] recalcGroupInTree 与 L22-35 一致
- [ ] getResizedComponents 验证
- [ ] 键盘快捷键覆盖
- [ ] 3 个异常输入边界覆盖
- [ ] 不含完整 reducer 代码（只链接）

### 阶段 3：重写 `03-read-path.md`

**操作**：
- 合并原 04-read-path + 05-edge-cases §2
- 7 个 hook 精确签名 + 源码位置
- **保留 getFieldNodeById 章节**：task-012-c 核心函数，15 个调用方
- 保存序列化：2 保存点 + 1 postMessage + 2 preview 侧
- useFieldConf 适用范围 / 不适用场景
- 读路径决策树 + 易错点

**验证**：
- [ ] 7 个 hook 签名与 `hooks.ts` 一致
- [ ] getFieldNodeById 章节保留，签名 + 调用方说明
- [ ] 保存序列化与 `DesignerContent.tsx` `handleSave` L350-363 一致
- [ ] 保存点路径：`designer-scene-monitor/index.tsx` L37-47
- [ ] useFieldConf 适用范围与 `hooks.ts` L70-85 一致

### 阶段 4：重写 `04-principles.md`

**操作**：
- 从原 07 拆出 §0-§10（不含 §11 已删除 API）
- 4 大原则：对照源码验证
- 5 大禁区：对照源码验证
- 提交前自检清单
- 指向 `05-deleted-api.md` 的链接

**验证**：
- [ ] 4 大原则与源码一致
- [ ] 5 大禁区与源码一致
- [ ] 不含已删除 API 清单（指向 05-deleted-api.md）

### 阶段 5：重写 `05-deleted-api.md`

**操作**：
- 从原 07 §11 独立
- 对齐完整清单（16+ 个 API），逐个 Grep 验证
- 验证标准：活代码调用 0 命中（注释/测试允许）
- **setLevelPath 澄清**：明确是活代码，不得列入
- 补充禁区 API：DesignerContext / DataProvider / runtimeComponentsTrigger / useDebounceMergeConfig / useLevelPath / useFieldNodeById
- grep 验证方法说明

**验证**：
- [ ] 已删除 API 每条 Grep 验证活代码 0 命中（排除 .bak，注释/测试允许）
- [ ] setLevelPath 未列入
- [ ] 禁区 API 补充完整

### 阶段 6：重写 `06-bugs-and-tests.md`

**操作**：
- 对照 25 个 bug + 8 个测试文件（72 个用例），逐个验证状态
- 标注"历史归档"

**验证**：
- [ ] 25 个 bug 状态逐个验证
- [ ] 8 个测试文件存在性验证

### 阶段 7：重写 `07-view-slices.md`

**操作**：
- ViewCanvasState 8 字段 + ViewUIState 8 字段
- 16 个字段级 hook
- updateView 跨 slice 机制
- useSetView 用 batch
- resetViewCanvas / resetViewUI

**验证**：
- [ ] ViewCanvasState 与 `view-canvas.ts` L16-33 一致
- [ ] ViewUIState 与 `view-ui.ts` L14-31 一致
- [ ] hook 数量 16 个与 `hooks.ts` L50-68 一致

### 阶段 8：最终验证

> **前置依赖**：阶段 1-7 全部完成。

**操作**：
- grep 验证文档中标注的源码行号是否准确
- grep 验证无历史标记残留
- grep 验证内部链接指向存在的文件
- 更新 task 状态

**验证**：
- [ ] 文档中每个源码行号可验证
- [ ] grep `已消除` / `已废弃` / `task-002 前` 0 命中
- [ ] grep `mergeByIdIntoTree` 仅在 `05-deleted-api.md`
- [ ] 内部链接全部指向存在的文件

### 阶段 9：更新 `00-README.md` + 外部引用

> 00-README 最后更新，避免前序文档回改导致概览过时。

**操作**：
- 00-README.md：索引表 + 常见任务对照表（不含一页纸概览）
- AGENTS.md §3.1 / §8 / §10.2：更新文件名和路径（`designer-canvas-state/` → `designer-state/`）
- AGENTS.md §5：viewCanvas/viewUI 行指向 `designer-state/07-view-slices.md`

**验证**：
- [ ] 00-README 索引表包含全部 8 份文档
- [ ] AGENTS.md 引用全部更新为 `designer-state/`
- [ ] 无断链

---

## 6. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 源码行号随代码变更失效 | 中 | 读者按行号找不到 | 文件路径 + 函数名双重定位 + 验证日期 |
| 源码类型是 any，文档给了概念类型 | 中 | 读者以为有类型保护 | 明确标注"源码类型"vs"概念类型" |
| 目录迁移破坏外部引用 | 中 | 链接失效 | 阶段 9 统一更新 AGENTS.md 引用 |
| setLevelPath 误列入已删除 API | 高 | 误删活代码 | §3.8.4 明确澄清 |
| 合并文档时遗漏内容 | 中 | 事实丢失 | 逐阶段验证清单兜底 |

### 回退

- 每阶段独立 commit，可单独 revert
- 原 `designer-canvas/` 目录保留作为历史归档（内容未对照源码验证，仅作应急参考）

---

## 7. 不做的事

- ❌ 不修改源码（纯文档改动）
- ❌ 不给源码加 TS 类型
- ❌ 不删除原 `designer-canvas/` 目录
- ❌ 不贴大段源码代码（单段引用不超过 5 行）
- ❌ 不沿用旧文档内容（全部基于源码重写）

---

## 8. 执行前置条件

- [x] 用户 review 本计划并确认
- [x] 确认目录结构方案（`designer-state/` 8 份）
- [x] 确认"源码类型 vs 概念类型"的处理方式
- [x] 确认 handleAlign 调用路径（`canvas-graph/index.tsx` L312）
- [x] 确认 setLevelPath 是活代码

---

## 9. 实施记录

### 2026-07-29 执行完成

**阶段 0-9 全部完成**：

1. **阶段 0**：新建 `designer-state/` 目录，删除 `designer-canvas-state/` 9 份文档
2. **阶段 1**：`01-data-model.md` — 合并原 01+02，修正 WidgetConfig（6 字段）、WidgetItem（不含 parentUniqueId）、WidgetType（FIELD_COMP_TYPES 枚举）、PageConfig（源码 any）、SchemaConfig（无 TS interface）、DataSource、DesignerCanvasState、initialState（含 customPageSize）、FlatField、buildIndex、ROOT_UNIQUE_ID
3. **阶段 2**：`02-write-path.md` — 合并原 03+05§1/§3，8 个 action 全表、3 个 reducer 关键逻辑、13 个工具函数签名表、handleAlign、recalcGroupBounds、isRecalcRef、recalcGroupInTree、getResizedComponents、键盘快捷键、3 个异常输入边界
4. **阶段 3**：`03-read-path.md` — 合并原 04+05§2，7 个 hook 签名、getFieldNodeById、保存序列化（5 个保存点）、读路径决策树
5. **阶段 4**：`04-principles.md` — 从原 07 拆出 §0-§10，4 大原则 + 5 大禁区 + 提交前自检（不含已删除 API）
6. **阶段 5**：`05-deleted-api.md` — 从原 07 §11 独立，16+ 个 API、setLevelPath 澄清为活代码、禁区 API 补充
7. **阶段 6**：`06-bugs-and-tests.md` — 25 个 bug 速查表 + 8 个测试文件矩阵（72 用例）
8. **阶段 7**：`07-view-slices.md` — ViewCanvasState 8 字段 + ViewUIState 8 字段 + 16 个字段级 hook + updateView 跨 slice
9. **阶段 8**：最终验证 — 8 份文档齐全、无历史标记残留、内部链接全部有效
10. **阶段 9**：`00-README.md` + `AGENTS.md` 18 处引用更新（`designer-canvas-state/` → `designer-state/`）

**源码验证**：所有事实均通过 Read/Grep 对照源码当场验证（designer-canvas.ts / view-canvas.ts / view-ui.ts / view-actions.ts / GeneratorWidget.tsx / utils.ts / hooks.ts / designer-canvas-actions.ts / DesignerContent.tsx / constants.ts / designer-field/types.ts / page/schema.ts / designer-parser/index.jsx / useOnDrop.ts / canvas-graph/index.tsx）。
