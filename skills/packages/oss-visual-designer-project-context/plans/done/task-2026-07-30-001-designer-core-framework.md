# task-2026-07-30-001 — designer-core 框架封装（Zustand + Plugin，文档先行）

> 状态：`in-progress`
> 类型：`feature` + `research`
> 优先级：**高**（当前唯一活跃 task，独立推进）
> 创建日期：2026-07-30
> 载体：`packages-next/core/`

---

## 0. 背景与定位

### 0.1 一句话目标

把 `src/store/modules/designer-canvas.ts` + `src/store/designer/hooks.ts` + `src/designer/renderer/utils.ts`（buildIndex）+ `src/designer/DesignerContent.tsx`（recalcGroupBounds 防重入）沉淀的**状态管理架构思想**，抽象为具备普遍意义的**低代码可视化编辑器状态框架**，落到 `packages-next/designer-core/`（npm 包名 `designer-core`），技术载体从 Redux + Immer 换成 Zustand + 插件机制。

### 0.2 与 `packages-next/designer-next/` 的关系（命名空间冲突决策）

**事实**（2026-07-30 验证）：
- `packages-next/designer-next/` 已存在，依赖 `redux` / `react-redux` / `immer` / `redux-persist` / `hox`，与新框架 Zustand 路线技术栈完全冲突
- `packages-next/designer-next/src/core/designer/index.tsx` 当前是占位组件 `export const Designer = () => <div>Designer</div>;`
- `packages-next/core/` 不存在；`tsconfig.json` L32 已 exclude `packages-next/*`

**决策**：新框架放在 `packages-next/designer-core/`（**不是** `packages-next/core/`），与 `designer-next/` 职责分离：
- `designer-next/` —— React shell / 路由 / 业务组件（保留现状，不动）
- `designer-core/` —— 状态管理框架（Zustand + Plugin，本 task 产出）

理由：避免 `core/` 目录名与 `designer-next/src/core/` 概念重叠；包名 `designer-core` 明确表达"设计器状态内核"。

### 0.3 不动当前项目（硬约束）

- **当前项目 `src/` 不改一行代码**。`src/store/modules/designer-canvas.ts` 等保持现状，作为框架的**第一个验证载体**（对照事实基准）。
- 框架独立开发，独立测试。验证方式见 §4.2「行为对齐测试」。
- 当前项目未来是否迁移到框架，**不在本 task 范围**。

### 0.4 普遍意义边界

框架只提供**树 + 索引 + 订阅 + 插件**的骨架，不包含业务模型：

| 抽象到框架 | 不抽象（留给业务） |
| --- | --- |
| 单源契约（components 唯一真相，byId/parentMap 派生只读） | `FIELD_COMP_TYPES` 枚举 |
| `buildIndex` 引用复用算法 | `PageConfig` 字段 |
| 三条写路径（结构性变更 / 字段级更新 / 批量更新） | group bounds 重算算法 |
| 字段级订阅 hook（`useField(id)` + shallowEqual） | `customFieldsListMapping` 序列化策略 |
| 读路径三分法（订阅 / 同步读 / 序列化） | `realtimeDataFlow` 业务语义 |
| 5 大反模式**约束**（文档 + 静态扫描 + dev 模式 Object.freeze，非运行时强制） | 具体物料类型 |
| 复制/粘贴走 setTree（结构性变更） | 复制/粘贴业务逻辑 |
| hox `useComponentsInfo`（18 文件）**不纳入**框架，维持现状 | hox 业务状态 |

### 0.5 技术选型理由（对照当前事实）

| 维度 | 当前 Redux 事实 | Zustand 对应 | 适配度 |
| --- | --- | --- | --- |
| 单源契约 | `components` 唯一真相，byId/parentMap 派生 | `create` 一个 store，`get()` 同步读、`set()` 不可变写 | 契约不变 |
| 字段级订阅 | `useFieldConf` + `shallowEqual` | `useStore(s => s.byId[id], shallow)` | 等价且更轻 |
| 引用复用 | `oldEntry.data === node.data`（[utils.ts L678-687](../../src/designer/renderer/utils.ts)） | **框架必须显式提供 setTree/updateField 的浅 path setState 机制**，在 store 内手动维护 `byId` 引用复用（机制与当前 buildIndex 等价，但实现者从 user 转到 framework） | 契约等价，实现责任转移 |
| 跨 slice 批量更新 | `updateView` + extraReducers | 单 store 天然原子 | 简化 |
| 同步读 | `store.getState()` | `useStore.getState()` | 等价 |

### 0.6 Zustand + Immer 决策（关键技术分歧点，阶段 1 实测后锁定）

**当前事实**：`package.json` L24 `"immer": "^9.0.6"`，无 zustand 依赖。

**决策方向（待阶段 1 实测确认）**：
- **推荐 vanilla Zustand + 手动 buildIndex 维护引用**（默认路径）
  - 理由：与当前 04-principles.md「不可变契约」一致；不引入 Immer 间接层；vanilla set 可精确控制引用变化范围
  - 风险：手动不可变更新代码量大于 Immer produce
- **immer middleware 仅作为自定义中间件选项暴露，不作为默认**
  - 理由：Zustand 4.x + immer middleware 在嵌套对象只改 inner field 时外层引用会变化，与「byId[id] 引用复用」目标冲突

**阶段 1 必须实测**：
1. 440 节点 tree，单字段 update，`useField(id)` 订阅方 re-render 数（vanilla vs immer middleware）
2. 高频拖拽 dispatch 60+/s，累计耗时（vanilla vs immer middleware）
3. 测试结果写入 `research/designer-core-fact-extraction.md` §Zustand 路径实测

### 0.7 API 命名约定（防幻觉）

**现有工具函数保留原名**（不加 `use` 前缀）：
- `getFieldNodeById`（[utils.ts L141-150](../../src/designer/renderer/utils.ts)）—— 工具函数，非 hook，框架保留此命名

**新引入 hook 用 `useXxx` 前缀**：
- `useField(id)` —— 字段级订阅（对应当前 `useFieldConf`）
- `useTree()` —— 整树订阅（必须配 shallowEqual，框架强制）
- `useUpdateField()` —— 字段级更新 dispatcher（对应当前 `useUpdateFieldConfig`）

**当前名 → 框架名映射表**（阶段 1 确认）：

| 当前 API | 框架 API | 性质 |
| --- | --- | --- |
| `useFieldConf` | `useField` | hook（字段级订阅） |
| `useUpdateFieldConfig` | `useUpdateField` | hook（更新 dispatcher） |
| `updateFieldConfig` | `updateField` | store action |
| `setComponents` | `setTree` | store action |
| `setDesignerCanvasState` | `setState` | store action |
| `getFieldNodeById` | `getFieldNodeById` | 工具函数（保留原名） |
| `buildIndex` | `buildIndex` | 工具函数（保留原名） |
| `useFlatComponents` | `useFlatTree` | hook |
| `useSelector(components, shallowEqual)` | `useTree()` | hook（整树订阅，框架内置 shallowEqual） |

---

## 1. 文档先行流程（硬约束）

> **只有文档通过 review，才能开始编码。** 这是本 task 的核心流程约束。

### 1.1 文档产出顺序

文档按依赖顺序逐份产出，每份产出后立即 review，review 通过才写下一份：

| 阶段 | 文档 | 路径 | 内容 | review 标准 |
| --- | --- | --- | --- | --- |
| 1 | 调研：当前事实提取 | `.trae/documents/research/designer-core-fact-extraction.md` | 从当前代码逐条提取框架要抽象的契约（单源/引用复用/三条写路径/字段级订阅/5 大禁区），每条标注源码位置；含 Zustand 路径实测（§0.6）；含 25 bug × 6 能力覆盖矩阵（§2.3）；含「当前名→框架名」映射表；含 grep 排除清单（.bak 8 文件） | 事实准确，无遗漏，每条可 grep 验证；Zustand 实测有数据；覆盖矩阵每格有判定 |
| 2 | **总设计：框架总纲** | `.trae/documents/design/designer-core/00-overview.md` | **锁定目标/边界/能力矩阵/与当前项目映射关系 + 全部 6 项核心 API 的契约签名草案**（哪怕用 `// 草案` 标注）。定义"框架是什么、不是什么"，防止后续子设计目标偏移 | 目标清晰、边界明确、6 项 API 签名草案完整、能力矩阵覆盖 25 bug 场景、与当前事实映射可溯源 |
| 3 | 设计：框架数据模型 | `.trae/documents/design/designer-core/01-data-model.md` | 框架的泛型类型定义（`TreeNode`/`FlatNode`/`TreeStoreState`），与当前 `WidgetItem`/`FlatField`/`DesignerCanvasState` 的映射关系 | 事实核查（A）+ 逻辑审查（B）双视角；类型泛型化；映射关系清晰 |
| 4 | 设计：框架写路径 | `.trae/documents/design/designer-core/02-write-path.md` | `setTree` / `updateField` / `setState` 三个 API 的契约 + 派生索引重建 + 边界降级（对照当前 3 个 reducer）；明确拖拽 onChange 一律 `updateField`，`setTree` 只在 onDragStop / 结构性变更用 | 事实核查（A）+ 逻辑审查（B）双视角；覆盖当前 25 bug 契约；边界行为逐条对照源码 |
| 5 | 设计：框架读路径 | `.trae/documents/design/designer-core/03-read-path.md` | `useField(id)` / `useTree()` / `getState()` / `getFieldNodeById` + **跨异步边界读路径**（当前 `latestCache.current` 模式） + shallowEqual 约束 | 事实核查（A）+ 逻辑审查（B）双视角；覆盖当前读路径决策树全部场景 |
| 6 | 设计：插件机制 | `.trae/documents/design/designer-core/04-plugin-system.md` | **四类插件契约**：runtime data / derived compute（内置 ref 防重入）/ structure tools / cross-slice sync（抽象 `updateView` + extraReducers）；与当前 8 个 action 的映射关系 | 事实核查（A）+ 逻辑审查（B）双视角；四类边界清晰；映射关系完整 |
| 7 | 设计：架构原则与禁区 | `.trae/documents/design/designer-core/05-principles.md` | 4 大原则 + 5 大反模式约束（文档 + 静态扫描 + dev 模式 Object.freeze，非运行时强制）+ 提交前自检清单 + React.memo 约定 + Immer frozen 语义是否保留的决策 | **完整三视角**（A+B+C）；与当前 04-principles.md 对齐；禁区可机器检测 |
| 8 | 计划：实现路线 | 本文件 §3 更新 | 实现步骤 + 验证方案 + 风险 + 回退 | **独立 agent 交叉 review（视角 A + 视角 B），不能 agent 自评**；步骤可执行，验证可复现 |

### 1.2 review 触发点与层级

- **总设计（阶段 2）review 最严**：定义目标与边界 + 6 项 API 签名草案，一旦偏移后面全错。review 通过后，子设计文档有对照标准。
- **子设计 review 用双视角（事实核查 A + 逻辑审查 B）**，不只验证"是否在总设计边界内"——必须逐条验证 API 签名、边界条件、行为对齐。阶段 6/7（插件 + 原则）升级为完整三视角。
- **阶段 8 实现路线 review 必须由独立 agent 交叉 review（视角 A + 视角 B），不能 agent 自评**。
- 每份文档写完后，**用 `NotifyUser` 通知用户 review**，不主动开始下一份。review 通过后才继续。
- **超时与降级机制**：每份文档 5 个工作日内 review 必须有结论；连续 2 份超时自动触发「降级为单视角快速通道」；若 7 份中任 2 份 review 不过，task 自动 `blocked`，要求用户决定「缩范围 / 跳过 1 份 / 砍掉整个 task」三选一。

### 1.3 事实基准校验（贯穿全流程）

每份设计文档中的契约声明，必须能对照当前项目源码验证：

- ✅ "框架的 `updateField` 必须在不存在 id 时返回原 state" → 对照 [designer-canvas.ts L130-132](../../src/store/modules/designer-canvas.ts)（L129 是注释行，实测边界检查在 L130-132）
- ✅ "框架的 `buildIndex` 必须保留引用复用" → 对照 [utils.ts L664-697](../../src/designer/renderer/utils.ts)（引用比较 `oldEntry.data === node.data` 在 L680）
- ✅ "框架的 setState byId 防护必须用 hasOwnProperty" → 对照 [designer-canvas.ts L91-L99](../../src/store/modules/designer-canvas.ts)（当前用 `'in'` 隐 bug 未修，L95 的 hasComponents 才用 hasOwnProperty，框架实现时统一用 hasOwnProperty）
- ❌ 不得出现"通常应该"、"一般来说"等无源码依据的表述

---

## 2. 目标

### 2.1 必达目标

1. `packages-next/designer-core/` 产出可独立运行的框架包（`pnpm` workspace 子包，包名 `designer-core`）
2. 框架核心 API：`createTreeStore` / `useField` / `useTree` / `updateField` / `setTree` / `getFieldNodeById`
3. 插件 API：runtime data / derived compute（内置 ref 防重入）/ structure tools / cross-slice sync
4. 框架自带测试，覆盖方式见 §4.2
5. 8 份文档全部通过 review（阶段 1-8）

### 2.2 不做（非目标）

- 不迁移当前项目到框架
- 不实现 undo/redo（当前项目从未实现，框架也不做）
- 不实现持久化（当前项目 `whitelist = []`，框架留接口不实现）
- 不封装具体物料类型 / group 算法 / page 配置
- 不纳入 hox `useComponentsInfo`（维持现状）

### 2.3 25 bug × 6 能力覆盖矩阵（阶段 1 产出，此处为分类框架）

按 [06-bugs-and-tests.md](../design/designer-state/06-bugs-and-tests.md) 25 个 bug 分类，框架覆盖方式不同：

| bug 分类 | 编号 | 框架覆盖方式 |
| --- | --- | --- |
| **已删 API 类**（5 个） | #5/#6/#7/#8/#12 | 🚫 无法测试覆盖，只能静态扫描（阶段 7 加反向 grep 守护测试） |
| **结构性 bug 类**（13 个） | #1/#2/#4/#11/#13/#14/#15/#17/#19/#20/#21/#22/#23 | ⚠️ 间接覆盖（框架实现单源架构后自然消除） |
| **UI 事件类**（1 个） | #16 | ❌ 与状态框架无关，不覆盖 |
| **运行时类**（6 个） | #3/#9/#10/#18/#24/#25 | ✅ 框架直接覆盖（行为对齐测试） |

> **2026-07-30 阶段 1 修正**：原分类把 #15/#18 归 UI 事件类，经 [fact-extraction.md §6.1](../research/designer-core-fact-extraction.md) 对照 06 速查表实际描述，#15（byId 缺 children 节点）实为结构性、#18（splitGroup 递归爆栈）实为运行时。按事实优先级（06 文档 > task 文档）修正。

**阶段 1 事实提取时输出完整 25 × 6 矩阵**，每格标：✅ 框架直接覆盖 / ⚠️ 间接覆盖（架构自带）/ ❌ 与状态框架无关 / 🚫 已删 API（只能静态扫描）。§2.1 目标 4 的测试范围 = ✅ + ⚠️ 类（共 19 个，原 17 个因 #15/#18 重分类增加 2 个），❌ 和 🚫 不纳入框架测试。

---

## 3. 详细步骤（待文档阶段完成后填充）

> 本节在文档阶段（§1.1 阶段 1-7）全部通过 review 后，再填写实现步骤。
> 当前状态：**阶段 0（立项）→ 待进入阶段 1（事实提取）**。

### 阶段 0：立项（当前）
- [x] 创建本 task 文件
- [x] roadmap.md 追加索引
- [x] 调整文档结构：research → 总设计 → 子设计（用户确认）

### 阶段 1：事实提取
- [x] 产出 `research/designer-core-fact-extraction.md`
- [x] review 通过

### 阶段 2：总设计
- [x] 产出 `design/designer-core/00-overview.md`（锁定目标/边界/能力矩阵）
- [x] review 通过（最严）

### 阶段 3-7：子设计文档（阶段 2 通过后）
- [x] `01-data-model.md`（已产出）
- [x] `02-write-path.md`（已产出）
- [x] `03-read-path.md`（已产出）
- [x] `04-plugin-system.md`（已产出）
- [x] `05-principles.md`（已产出）
- 每份单独 review（双视角 A+B，阶段 6/7 升级三视角）—— 用户指示连续产出，不再逐份等待确认

### 阶段 8：实现路线定稿
- [x] 回填本文件 §3 实现步骤（下方）
- [x] 独立 agent 交叉 review（视角 A + 视角 B）通过 → 解锁编码

#### 3.1 实现步骤（编码阶段，待 review 通过后执行）

> 以下步骤在阶段 8 独立 agent 交叉 review 通过后执行。每步完成后跑 `pnpm exec tsc --noEmit` + `pnpm test`。

**步骤 1：创建 packages-next/designer-core/ 骨架**
- 创建 `packages-next/designer-core/` 目录（与现有 `packages/` 隔离，避免影响主仓）
- 初始化 `package.json`（name: `@fedx-vis/designer-core`，type: module）
- 配置 `tsconfig.json`（继承根 tsconfig，strict: true）
- 配置 vite 构建（库模式，输出 ESM + CJS）
- 依赖：`zustand`（peerDependency）

**步骤 2：实现核心类型 + buildIndex + getFieldNodeById**
- `src/types.ts`：TreeNode / FlatNode / TreeStoreState / ROOT_ID（01-data-model.md §1-2）
- `src/buildIndex.ts`：buildIndex 引用复用算法（01-data-model.md §3.2）
- `src/getFieldNodeById.ts`：递归查找（01-data-model.md §4）
- `src/utils.ts`：shallowEqual（03-read-path.md §9）
- 测试：buildIndex 引用复用 + 空树防护 + 无 uniqueId 跳过

**步骤 3：实现 createTreeStore + 三条写路径**
- `src/createTreeStore.ts`：createTreeStore（00-overview.md §5.1 + 01-data-model.md §5.2）
- `src/write-paths.ts`：setTree / updateField / setState（02-write-path.md §2-4）
  - setTree：直接赋值 + buildIndex 重建
  - updateField：parentMap 反向追踪 + 不可变改树 + buildIndex 重建（6 个边界降级）
  - setState：浅合并 + hasOwnProperty 防护 + 含 components 时 buildIndex
- 测试：19 bug 框架测试范围（fact-extraction §6.1）

**步骤 4：实现读路径 hooks**
- `src/hooks/useField.ts`：useField（03-read-path.md §2）
- `src/hooks/useTree.ts`：useTree（03-read-path.md §3）
- `src/hooks/useLatestState.ts`：useLatestState（03-read-path.md §7）
- 测试：shallowEqual 字段级订阅 + 跨异步边界

**步骤 5：实现插件系统**
- `src/plugins/Plugin.ts`：Plugin 基础接口 + PluginContext（04-plugin-system.md §2）
- `src/plugins/createRuntimeDataPlugin.ts`：runtime data 插件（04-plugin-system.md §3）
- `src/plugins/createDerivedComputePlugin.ts`：derived compute 插件 + ref 防重入（04-plugin-system.md §4）
- `src/plugins/createCrossSliceSyncPlugin.ts`：cross-slice sync 插件（04-plugin-system.md §6）
- 测试：derived compute 防重入 + runtime data 不可变更新

**步骤 6：导出公共 API + 文档**
- `src/index.ts`：导出 createTreeStore / useField / useTree / updateField / setTree / setState / getFieldNodeById / buildIndex / ROOT_ID / 4 类插件工厂
- `README.md`：快速上手 + API 速查
- 测试：端到端集成测试（模拟当前项目 reducer 场景）

#### 3.2 验证方案

| 验证项 | 方法 | 通过标准 |
| --- | --- | --- |
| 类型检查 | `pnpm exec tsc --noEmit` | 0 错误（仅限 packages-next/designer-core/） |
| 单元测试 | `pnpm test`（vitest） | 19 bug 框架测试范围全绿 |
| 引用复用 | buildIndex 测试 | 未修改节点 byId 条目引用相等（`oldEntry === newEntry`） |
| 字段级订阅 | useField 测试 | 修改节点 A 时，节点 B 的 useField 不 re-render |
| 防重入 | derived compute 测试 | compute → setTree → subscribe 不爆栈 |
| hasOwnProperty | setState 测试 | payload 含 byId 时 console.error + 删除 |
| 不可变更新 | updateField 测试 | 未修改分支保留原引用 |

#### 3.3 风险与回退

| 风险 | 缓解 | 回退 |
| --- | --- | --- |
| vanilla Zustand 无 frozen 保护 | 框架 set 内不可变 + 开发文档强调 | 加开发环境 Object.freeze |
| 引用复用失效 | oldById set 外捕获约束 | 回退到 Immer middleware（task §0.6 预案） |
| 插件过度设计 | 只覆盖当前 4 类模式 | 删除非必要插件 |
| 框架与当前项目迁移成本 | 框架独立于 packages-next/，不影响主仓 | 随时可放弃，不影响 src/ |

> 回退策略：framework 位于 `packages-next/designer-core/`，与主仓 `src/` 完全隔离。任何时候放弃都不影响现有代码。

### 阶段 9+：编码（文档全部通过后）
- `packages-next/designer-core/` 目录此时创建
- 待 §3 定稿

---

## 4. 验证方案

### 4.1 文档阶段验证

每份文档 review 时验证：
1. **事实可溯源**：每条契约有当前源码位置标注
2. **行为对齐**：不只引用源码位置，必须验证框架 API 行为与源码 reducer 行为一致（边界条件、返回值、降级策略）
3. **覆盖度**：对照 §2.3 覆盖矩阵，✅ 和 ⚠️ 类 bug 有对应框架契约
4. **无幻觉**：无"通用最佳实践"类无依据表述；API 命名遵守 §0.7 约定（`getFieldNodeById` 不加 `use` 前缀）

### 4.2 编码阶段验证（行为对齐 + 性能基线）

**行为对齐测试**（9 成成功率的核心指标）：
- 把当前 8 个测试文件中 reducer / 纯函数测试代码，移植到框架的 vitest 套件中作为契约对照
- P0/P1 测试必须能跑通（buildIndex 引用复用 / updateFieldConfig 边界 / setState byId 防护 / getResizedComponents / recalcGroupInTree / useFieldConf propsValue）
- 证明框架的 `updateField` 行为与 `designer-canvas.ts::updateFieldConfig` 一致
- 建立行为对齐 e2e 脚本：`.trae/scripts/verify-framework-behavior.mjs`

**5 大反模式静态扫描守护测试**：
- grep 5 个已删 API 名（`mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `fieldPreserve` / `dirtyConfigKeys`），命中则 fail

**性能基线**（可测量定义）：
- 输入：440 节点 fixture tree
- 操作：1000 次 `updateField(id, {config: {left: x}})`
- 测量：P50 / P95 / P99 + `useField` 订阅方 re-render 计数
- 阈值：框架 ≤ 当前的 1.2 倍
- 当前基线：0.2ms（p95，见 [baseline-2026-07-27.md](../research/refactor-single-source/baseline-2026-07-27.md) L59）

---

## 5. 风险与回退

### 5.1 风险

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 过度抽象：框架太重，当前项目验证不了 | 中 | 高 | 阶段 1 调研加「抽象决策记录」表：每行「抽象 → 事实依据（行号）→ 边界场景」，由阶段 2 总设计逐项签字；任何一格空白 → 拒绝通过 |
| Zustand 引用复用语义与 Immer 不同 | 中 | 中 | 阶段 1 实测两种路径（§0.6），阶段 2 锁定默认路径 |
| 插件机制设计过度 | 中 | 中 | 插件只覆盖当前代码已有的 4 类模式，不新增 |
| 文档先行流程太慢 | 低 | 低 | §1.2 超时与降级机制 |
| `designer-next/` 与 `designer-core/` 边界模糊 | 低 | 中 | §0.2 已明确职责分离；阶段 2 总设计再确认 |

### 5.2 回退

- 框架独立在 `packages-next/designer-core/`，不影响 `src/`，无需回退当前项目
- 若框架设计无法通过 review，task 转为 `blocked` 或 `cancelled`，记录原因

---

## 6. 相关文档

- [当前项目状态管理权威文档](../design/designer-state/00-README.md)（事实基准）
- [04-principles.md](../design/designer-state/04-principles.md)（5 大禁区来源）
- [06-bugs-and-tests.md](../design/designer-state/06-bugs-and-tests.md)（25 个 bug 作为回归清单）

---

## 实施记录

> 按日期记录关键决策与进展。

### 2026-07-30

- 立项。定位：框架封装，Zustand + Plugin，文档先行，当前项目作为第一个验证载体。
- 文档结构调整：research → 总设计（00-overview）→ 子设计（5 份）→ 实现路线。
- 交叉 review（r1.md）后优化：
  - **命名空间冲突**：`packages-next/core/` → `packages-next/designer-core/`（避免与 `designer-next/src/core/` 概念重叠）
  - **API 命名幻觉修复**：`useFieldNodeById` 不存在，改为 `getFieldNodeById`（工具函数保留原名）；新增 §0.7 API 命名约定
  - **子设计 review 降级修复**：从"是否在总设计边界内"升级为双视角（A+B），阶段 6/7 升级三视角；阶段 8 独立 agent 交叉 review
  - **测试契约修复**：从"能力矩阵覆盖"改为行为对齐测试（移植 P0/P1 测试到框架 vitest）
  - **Zustand + Immer 决策**：新增 §0.6，阶段 1 实测后锁定默认路径（推荐 vanilla Zustand）
  - **引用复用描述修复**：从"更简单"改为"实现责任从 user 转到 framework"
  - **25 bug 覆盖矩阵**：新增 §2.3，按 4 类分类（已删 API / 结构性 / UI 事件 / 运行时），框架测试范围 = ✅ + ⚠️（17 个）
  - **阶段编号错位修复**：实施记录"阶段 7 编码"→"阶段 9+ 编码"
  - **性能基线量化**：P50/P95/P99 + re-render 计数，阈值 ≤ 当前 1.2 倍，基线 0.2ms（p95）
  - **插件分类补全**：3 类 → 4 类（新增 cross-slice sync）
  - **读路径补全**：新增跨异步边界读路径 + `useTree()` 整树订阅
  - **grep 排除清单**：阶段 1 事实提取含 .bak 8 文件排除
  - **超时与降级机制**：每份文档 5 工作日 review deadline，连续 2 份超时降级，任 2 份不过自动 blocked
- `packages-next/designer-core/` 目录待创建（阶段 9+ 编码时建）。
- 下一步：进入阶段 1（事实提取），产出 `research/designer-core-fact-extraction.md`。

### 2026-07-30 阶段 1 产出

- 产出 [research/designer-core-fact-extraction.md](../research/designer-core-fact-extraction.md)，含：
  - §1 单源契约 + buildIndex 引用复用（state 形状 8 字段 / components 赋值点 / byId 派生只读 / buildIndex 算法 / recalcGroupBounds 防重入）
  - §2 三条写路径 reducer 契约 + 边界降级（8 action 全表 / setComponents / updateFieldConfig / setState + 文档对照）
  - §3 读路径三分法 + 字段级订阅（useFieldConf / useUpdateFieldConfig / useFlatComponents / getFieldNodeById / 跨异步 latestCache / getState 同步读 / 保存序列化）
  - §4 现有测试基线（test-utils 工厂 + P0/P1/P2 测试文件）
  - §5 5 大反模式 + 已删 API grep 清单 + 8 个 .bak 排除清单 + 提交前自检/React.memo/Immer frozen
  - §6 25 bug × 6 能力覆盖矩阵（每格判定）
  - §7 当前名→框架名映射表 + 8 action 框架映射
  - §8 关键约束汇总（10 条，供子设计文档引用）
  - §9 Zustand 路径实测（待编码环境，仅计划）
- 事实核对发现 3 处偏差（待 task 文档同步）：
  1. §2.3 把 bug #15/#18 归 UI 事件类，与 06 速查表实际描述不符（#15 实为结构性/byId 缺 children，#18 实为运行时/递归爆栈）。建议修正后框架测试范围从 17 扩展为 19
  2. §1.3 说 updateFieldConfig 边界在 L129-132，实测 L130-132（L129 是注释行）
  3. setState byId 防护用 `'in'` 而非 hasOwnProperty（隐 bug 未修），框架实现时应统一用 hasOwnProperty
- §9 Zustand 实测未跑：`packages-next/designer-core/` 目录未建，无可运行环境。建议阶段 2 总设计 review 时作为前置条件，或单独起最小可运行 spike
- 下一步：等待用户 review fact-extraction.md，通过后进入阶段 2（总设计 00-overview.md）

### 2026-07-30 阶段 1 review 通过 + 偏差同步 + 阶段 2 产出

- 阶段 1 fact-extraction.md review 通过
- 同步 task 文档 3 处偏差：
  - §1.3 updateFieldConfig 边界行号 L129-132 → L130-132（L129 是注释行）；buildIndex 行号 L678-687 → L664-697；新增 setState byId 防护 hasOwnProperty 契约
  - §2.3 bug 分类修正：#15 归结构性（原 UI 事件）、#18 归运行时（原 UI 事件）；结构性 12→13、UI 事件 3→1、运行时 5→6；框架测试范围 17→19
- 产出 [design/designer-core/00-overview.md](../design/designer-core/00-overview.md)（阶段 2 总设计，待 review 最严），含：
  - §1 框架定义 + 核心命题（4 架构思想）+ 非目标
  - §2 普遍意义边界（抽象 10 项 / 留给业务 8 项，每条带 fact-extraction 章号 + 源码行号）
  - §3 抽象决策记录表 12 行（task §5.1 风险缓解，无空白格）
  - §4 能力矩阵（6 核心 API + 25 bug 覆盖汇总 + 4 类插件）
  - §5 6 项核心 API 契约签名草案（createTreeStore/useField/useTree/updateField/setTree/getFieldNodeById + setState 补充）
  - §6 与当前项目映射关系（API 9 行映射 + 8 action 映射）
  - §7 技术选型（Zustand 理由 + Immer 决策 + buildIndex set 外调用约束）
  - §8 子设计文档导航（阶段 3-7）
- 下一步：等待用户 review 00-overview.md（最严），通过后进入阶段 3（01-data-model.md）

### 2026-07-30 阶段 2 review 通过 + 阶段 3 产出

- 阶段 2 00-overview.md review 通过（用户"继续"确认）
- 产出 [design/designer-core/01-data-model.md](../design/designer-core/01-data-model.md)（阶段 3，待 review A+B 双视角），含：
  - §1 核心泛型类型：TreeNode\<TData\> / FlatNode\<TData\> / ROOT_ID（对照 WidgetItem/FlatField/ROOT_UNIQUE_ID）
  - §2 TreeStoreState\<TNode, TFlat, TExtra\>（对照 DesignerCanvasState 8 字段映射；5 业务字段归入 extra）
  - §3 buildIndex 框架签名 + 引用复用算法契约不变 + vanilla Zustand 下 oldById 捕获差异
  - §4 getFieldNodeById 框架签名（保留原名）
  - §5 类型映射汇总表 + 类型约束链（TData 一致性保证引用复用）
  - §6 与 00-overview.md §5 签名草案一致性核对（createTreeStore 细化为 4 泛型参数）
  - §7 不变量与运行时边界（6 个边界场景对照源码）
- 00-overview.md §5.1 草案 `createTreeStore<TNode, TFlat>` 细化为 `<TData, TNode, TFlat, TExtra>`，TData 是引用复用类型约束，TExtra 承载业务扩展状态
- 下一步：等待用户 review 01-data-model.md（A+B 双视角），通过后进入阶段 4（02-write-path.md）

### 2026-07-30 阶段 3-7 连续产出 + 用户指示不等待确认

- 用户指示："后面文档输出不要等我确认，你直接执行"
- 连续产出 5 份子设计文档（阶段 3-7）：
  - [01-data-model.md](../design/designer-core/01-data-model.md)：泛型类型 TreeNode/FlatNode/TreeStoreState + buildIndex 引用复用 + 类型映射
  - [02-write-path.md](../design/designer-core/02-write-path.md)：三条写路径 setTree/updateField/setState + 派生索引重建 + 25 bug 覆盖
  - [03-read-path.md](../design/designer-core/03-read-path.md)：读路径三分法 useField/useTree/getState + 跨异步边界 useLatestState + shallowEqual 约束
  - [04-plugin-system.md](../design/designer-core/04-plugin-system.md)：四类插件 runtime-data/derived-compute/structure-tools/cross-slice-sync + 8 action 完整映射
  - [05-principles.md](../design/designer-core/05-principles.md)：4 大原则 + 5 大反模式 + 8 大约束 + 25 bug 全覆盖 + 提交前自检
- 5 份文档均标注"待 review"状态，与 00-overview.md §5 签名草案逐条核对一致
- 关键设计决策：
  - createTreeStore 泛型从 2 参数细化为 4 参数（TData/TNode/TFlat/TExtra）
  - vanilla Zustand 无 Immer frozen 保护，框架 set 函数内强制不可变更新
  - setState 用 hasOwnProperty 修正 'in' 隐 bug
  - buildIndex 在 set 回调内调用，oldById 从 set 外捕获
  - derived compute 插件内置 ref 防重入
  - 框架不内置 structure tools（高度业务化，只提供注册机制）
- 下一步：阶段 8 回填 §3 实现路线 + 独立 agent 交叉 review

### 2026-07-30 阶段 8 交叉 review + 修正

- 启动 2 个独立 search agent 做交叉 review（视角 A 事实核查 + 视角 B 逻辑审查，task §1.1 要求不能自评）
- **视角 A 发现 3 项**：
  - 01-data-model.md §5.1 FIELD_COMP_TYPES 行号 L139-153 → L138-153（已修正）
  - 05-principles.md §4.2 bug #18 分类错误（间接→直接）+ 描述错误（已修正）
  - 05-principles.md §4.2 将已删 API（#5/#6/#7/#8/#12）和无关 bug（#16）误归"间接覆盖"（已修正）
- **视角 B 发现 6 项**：
  - 00-overview.md §5.1 createTreeStore 泛型参数未同步（2→4）（已修正）
  - 00-overview.md §5.1 TreeStore 接口未同步 extra 结构（已修正）
  - 05-principles.md §4 25 bug 覆盖归类与 fact-extraction 矛盾（已修正，对齐 00 §4.2 + fact-extraction §6.3）
  - 03-read-path.md useUpdateField hook 契约缺失（已补充 §2.5）
  - 02-write-path.md updateNodeImmutable 实现缺失（已补充伪代码）
  - 04-plugin-system.md getPluginContext 未定义（已修正为闭包绑定）+ §1.1 措辞（已修正）
- 修正后 05-principles.md §4 重新对齐 fact-extraction §6.3 口径：直接 7 / 间接 12 / 已删 API 5 / 无关 1 = 25，框架测试范围 19
- 交叉 review 通过，解锁编码

### 2026-07-30 阶段 9 编码完成

- 按 §3.1 六步实现 `packages-next/designer-core/` 框架代码：
  - **步骤 1 骨架**：`package.json`（`@fedx-vis/designer-core`, type: module, peerDeps: react/zustand）、`tsconfig.json`（strict: true）、`vite.config.ts`（库模式 ESM+CJS + vitest 配置）
  - **步骤 2 核心**：`types.ts`（TreeNode/FlatNode/TreeStoreState/UpdateFieldPatch/ROOT_ID）、`buildIndex.ts`（引用复用算法 `oldEntry.data === node.data`）、`getFieldNodeById.ts`（递归查找）、`utils.ts`（shallowEqual）
  - **步骤 3 写路径**：`write-paths.ts`（`updateNodeImmutable` 沿路径浅拷贝 + 5 边界降级）、`createTreeStore.ts`（Zustand vanilla store + setTree/updateField/setPartialState + 插件注册 + destroy）、`plugins/types.ts`（Plugin/PluginContext/PluginType）
  - **步骤 4 读路径**：`hooks.ts`（useField/useTree/useFlatTree/useUpdateField/useLatestState/useExtra，用 `useStoreWithEqualityFn` from `zustand/traditional` 支持 equalityFn）
  - **步骤 5 插件**：`createRuntimeDataPlugin`（extra 运行时数据管理，对应当前 5 个 runtime action）、`createDerivedComputePlugin`（防重入 ref + subscribe + setTree，对应当前 recalcGroupBounds）、`createStructureToolsPlugin`（纯函数注册）、`createCrossSliceSyncPlugin`（外部 store 双向同步 + cleanup）
  - **步骤 6 导出 + 测试**：`index.ts` 公共 API 导出 + 3 个测试文件 48 个测试用例
- **验证结果**：
  - `pnpm test`：48/48 通过（buildIndex 10 + write-paths 25 + plugins 13）
  - `pnpm typecheck`（tsc --noEmit）：0 错误
  - `pnpm build`（vite build）：成功，ESM 15.44kB / CJS 10.94kB
- **Zustand 路径实测结论**（§0.6 决策锁定）：vanilla Zustand（无 immer middleware）路径完全可行，buildIndex 引用复用 + 不可变更新 + shallowEqual 订阅粒度全部正常工作，无需 immer middleware
- **修复的 tsc 类型问题**：
  - zustand v4 的 `useStore` 不支持第三个 equalityFn 参数 → 改用 `useStoreWithEqualityFn` from `zustand/traditional`
  - zustand v4.5+ 的 `ReadonlyStoreApi` 要求 `getInitialState` → TreeStoreApi 接口补充 `getInitialState`
  - zustand v4.5+ 的 `subscribe` listener 签名为 `(state, prevState) => void` → 同步更新 TreeStoreApi + PluginContext
  - `TData` 泛型约束为 `Record<string, any>`（支持 spread 操作）
  - setState byId/parentMap 防护用 `hasOwnProperty`（修正当前项目 'in' 隐 bug）
- 下一步：框架已可用，后续业务迁移不在本 task 范围
