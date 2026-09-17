# task-2026-07-24-018-plan-content-facts-sink

> 状态：`done`
> 创建：2026-07-24
> 类型：chore（设计事实沉淀）

---

## 1. 背景

`00-overview.md` §0 明确分层：
- `design/designer-canvas/` — **权威事实文档**
- `plans/done/` — 实现过程记录（仅参考，不作为设计依据）
- `research/` — 探索性调研（非权威事实）

但实际上 **`plans/done/` 里大量事实性细节（决策原因、删了哪些 API、改了什么契约、判定标准）还没有被 design 文档吸收**——使用者被迫"反向依赖 plan"，违反 §0 的设计原则。

task-017 系列（a/b/c）已经建立了 **"research 内容下沉为 design 事实"** 的实践（已 done）。本任务是同一思路的延伸：**把 plan 任务内容（已 done）中的事实性细节下沉到 design**。

### 1.1 已识别的明显缺口（待 阶段 1 验证 + 扩充）

| 缺口位置 | 来源 plan | 现状（design 简略） | 待沉淀（plan 详情） |
| --- | --- | --- | --- |
| `04-edge-cases.md` §1 recalcGroupBounds | task-012-1 | 只给一句结论 | "byIdWins vs nodeWins"决策原因（save 路径为什么用 byIdWins 而 setComponents 走 nodeWins） |
| `06-principles.md` §6 mutation 残留 | task-016 | 只给最终清单（2 处真 mutation） | mutation 白名单判定标准（如何区分 `resetUniqueId`/`generatorField` 白名单 vs 真 mutation） |
| `07-view-slices.md` §1.3 拆 slice 演进 | task-003/004/005 | §4 简略时间线 | 嵌套 Provider 回归的具体症状 + 诊断过程 |
| `02-write-path.md` §4.3 mergeByIdIntoTree | task-012-1 | 当前描述简洁 | 双源合并语义细节（byIdWins/nodeWins 在 Immer frozen 下的安全性论证） |
| `03-read-path.md` 读法对比 | task-007/008/012-c | 已有对照表 | 各读法的"为什么不能互相替代"理由（如 `useStore().getState()` 不能用 `useSelector` 替代的场景） |

---

## 2. 目标

把 `plans/done/` 中 **事实性细节**（不影响后续 task 决策的"过程性内容"保留在 plan）**增量下沉**到 `design/designer-canvas/`，让 design 文档成为完整的事实快照，使用者不需要再翻 plan。

---

## 3. 阶段划分

| 阶段 | 范围 | 输出位置 | 上下文消耗 |
| --- | --- | --- | --- |
| **阶段 1：调研 + 缺口清单** | 读 5 份关键 done plan + 对照 9 份 design 文档，产出"高价值事实缺口清单" | plan 文档 §6 "阶段 1 产出" | **大**（5 计划 + 9 design 文档） |
| **阶段 2：逐条沉淀** | 按重要性顺序逐条写入 design 文档 | design 目录 | **中**（每个 gap 单独写入） |
| **阶段 3：验证 + grep** | grep 一致性检查 + 各 fact-check 表格更新 | plan §7 | 小 |

**执行策略**：
- 阶段 1 完成后**停止**（避免上下文爆表），等用户审阅缺口清单后再启动阶段 2
- 阶段 2 按缺口顺序逐条执行，每条完成后立即 grep 验证
- 阶段 3 与阶段 2 合并进行（每条沉淀后即更新 fact-check 表格）

---

## 4. 阶段 1：调研 + 缺口清单

### 4.1 读 5 份关键 done plan

重点读：
- `plans/done/task-2026-07-21-006-designer-canvas-slice.md`（designerCanvas slice 迁入 Redux）
- `plans/done/task-2026-07-21-007-byid-index.md`（byId 索引 + useFieldConf）
- `plans/done/task-2026-07-21-008-patch-field-config.md`（updateFieldConfig）
- `plans/done/task-2026-07-21-011-drop-usedesigner-compat.md`（删 useDesigner）
- `plans/done/task-2026-07-21-012-a/b/c/utils-cleanup.md`（删 getFieldConf/getParent）
- `plans/done/task-2026-07-20-005-designer-view-merge-into-main-store.md`（view 合并）
- `plans/done/task-2026-07-24-016-audit-cloneDeep-mutations.md`（mutation 审计）
- `plans/done/task-2026-07-24-012-1-manual-fix.md`（保存丢失 + 组尺寸）

### 4.2 对照 9 份 design 文档识别缺口

对每份 design 文档的每个 §N 节，识别：
- "只有结论没原因"的位置 → 沉淀"决策原因"
- "只有清单没判定标准"的位置 → 沉淀"判定标准"
- "只有时间线没症状"的位置 → 沉淀"具体症状"

### 4.3 排序 + 产出

- 按"对后续 task 影响"排序（高/中/低）
- 写入本 plan §6 阶段 1 产出
- **只列前 5-8 条**（避免缺口清单本身爆炸）

---

## 5. 阶段 2：逐条沉淀（用户审阅缺口清单后启动）

### 5.1 单条沉淀流程

对每个高价值 gap：
1. 读源 plan 对应章节（限定上下文）
2. 读 design 文档目标位置 + **grep 其他 8 份 design 文档**搜索相关关键词（防止跨文档矛盾）
3. 写 design（仅增量补充，**不重写已有内容**）
4. 更新 `00-overview.md` §6.1 fact-check 表格（如适用）
5. grep 验证：① design 文档新内容是否一致 ② plan 文档原内容是否被准确引用 ③ **跨文档一致性**（关键词在所有 9 份 design 文档的描述无矛盾）

### 5.2 沉淀示例（04-edge-cases.md §1）

**当前**（design）：
> 组内对齐时用 `setComponents + beginSkipGroupRecalc/endSkipGroupRecalc` 防 stale。

**沉淀后**：
> 组内对齐时用 `setComponents + beginSkipGroupRecalc/endSkipGroupRecalc` 防 stale。
>
> **为什么不用 `updateFieldConfig` 字段级更新**：组尺寸需要由 `recalcGroupBounds` 重算，依赖 `byId` 中**所有子节点**的最新 FlatField（不只是被改的那个），单字段 patch 会让组尺寸 stale。task-012-1 决策：组内对齐走 `setComponents` 整树替换（nodeWins 方向），save 走 `getSaveableComponents`（byIdWins 方向）。详见 [04-edge-cases.md §1](./../../design/designer-canvas/04-edge-cases.md) + 任务 [task-012-1](../plans/done/task-2026-07-24-012-1-manual-fix.md)。

### 5.3 阶段 2 停止条件

- 5 条高价值 gap 全部沉淀完成 → 进入阶段 3
- 上下文接近上限 → 停止，把进度写到 plan §6 阶段 2 产出

---

## 6. 阶段 1 产出

### 6.0 plan §4.1 引用的事实修正

执行前发现 plan §4.1 引用文件路径有 2 处小笔误，**不**影响阶段 1 结论，但记录在案：

| plan 引用 | 实际路径 | 实际状态 |
| --- | --- | --- |
| `plans/done/task-2026-07-24-016-audit-cloneDeep-mutations.md` | 同名 | `planning`（**未 done**，但 §1 + §3 已写出实施就绪的审计结论） |
| `plans/done/task-2026-07-24-012-1-manual-fix.md` | 同名 | `in-progress`（实施完成，等待浏览器验证；事实细节有效） |

阶段 1 仍然读了这两份 plan（按 plan §1 "已识别明显缺口" 表），因为 §1-§3 写出的事实性细节（审计结论、mergeByIdIntoTree 决策、freshChildNodes 模式）即使未 done 也是"已决策/已实施"的事实。

---

### 6.1 高价值事实缺口清单（8 条）

> 按"对后续 task 影响" + "design 内部矛盾严重性"双因素排序。每条包含：缺口位置 / 设计文档现状 / 待沉淀内容 / 来源 plan / 优先级。
>
> **背景**：task-017 a/b/c 已把 research 内容 + 持久化策略 + view 字段使用矩阵下沉到 design。**当前 design 文档密度已经很高**——大部分 plan 中的"实现过程"已在 design 中有结论。本次仅沉淀"决策原因/症状细节/判定标准"等**事实性细节**。
>
> **排序原则**（review 反馈采纳）：
> - **design 内部矛盾**（如缺口 7：00 说"2 处" vs 05 说"8 处"）**优先于**单纯"补充细节"——矛盾会让使用者得到错误信息
> - **决策原因**（缺口 4）**优先于**症状细节（缺口 1/2/3）——决策原因影响未来同类决策

| # | 缺口位置 | 设计文档现状 | 待沉淀（事实性细节） | 来源 plan | 优先级 |
| --- | --- | --- | --- | --- | --- |
| 1（修订） | `07-view-slices.md §4.3`（task-005 迁移历史） | L202 一句话提了"react-redux 7.x `useSelector` 取最近 Provider 的 store"，**没解释症状模式 + 备选方案评估** | **症状模式**（不下沉 12 个文件具体清单）：`useSelector(s => s.component.selected)` 返回 undefined → 拖拽/选中/对齐静默失效；`useDispatch` 静默无效；**3 种备选方案评估**：A 合并到主 store（选）/ B 写 useMainStoreSelector 绕 Provider（不改架构但漏改风险高）/ C 升 react-redux 8（要 React 18+，升级链太深）；**为什么选 A**——单点修改 + 调用方零改动 + view 状态跨 designer 保留是更友好的默认 | task-005 §1.1-1.3 | **中**（review 建议从"高"降为"中"：原优先级偏高，缺口 7 更紧急） |
| 2（已核实） | `01-data-model.md §2 FlatField` + `04-edge-cases.md §0` | L179 一行表格项"data.drillDown 不进 byId"，**没解释为什么 + buildIndex 实际成本** | buildIndex 性能：**已核实 task-007 L89 原文**"440 组件：约 1-2ms（一次递归 + 两次 reduce）"；调用频率"拖入/删除/group/split——用户操作频率，不在 onChange 高频路径上"；drillDown 不进 byId 的原因（"只遍历 node.children 不遍历 data.config.drillDown" + drillDown 是配置数据非渲染树 + level 由 setLevelPath 单独维护） | task-007 §3.1（方案 B3 选型）+ §3.3（性能 L89）+ §4.1（buildIndex 实现） | **高** |
| 3 | `03-read-path.md §2 useFieldConf` | 只说"字段级订阅 byId"，**没解释 designer-field 切换时为什么保留 `fieldById ?? propsDataSource` fallback** | useDesignerSettingChange 旧实现有 2 个 setSetting 来源（EventBus + ownerSetting），useFieldConf 只覆盖第 1 个；**ownerSetting 回退通过 propsDataSource fallback 处理**（防"byId[id] 不存在的过渡帧 NPE"）；决策点：Redux 订阅不漏通知，propsDataSource 仅作 fallback | task-007 §3.4 | **高** |
| 4（升级） | `06-principles.md §6.2`（mutation 已清理清单） | 只写"task-010 修"，**没解释为什么 task-006 阶段不一起修** | **8 条中最有价值的"决策原因"**：task-006 阶段 getFieldConf/getParent/getFieldOrderBy 内部都 `_.cloneDeep` 后再返回，mutation 改的是 clone **不污染 state**（Immer 安全）；task-009 删 cloneDeep 时这些 mutation 会爆雷，因此同步改造——这是 "**工具函数内部 mutation 的隐式保护**"事实；**未来警示**：删除任何 cloneDeep 前必须先审计其内部 mutation 是否还受保护 | task-006 §4 步骤 4 + §7 实施记录 | **高**（review 建议从"中"升为"高"：影响未来"能否删 cloneDeep"决策） |
| 5（修订） | `02-write-path.md §2.4`（**成组/拆组/选中工具函数签名**——非 layer-manager 整体） | 表格里 `generatorGroup`/`splitGroup`/`getSelectedKeys` 写了新签名 `(fields/byId, parentMap, keys, ...)`，**没解释签名变更 vs 保留的边界** | **区分 2 类工具函数**（review 反馈修正）：①**成组/拆组/选中工具**（generatorGroup/splitGroup/getSelectedKeys）—— task-012-c 强制改签名，接收 byId/parentMap；②**layer-manager 整体函数**（lock/visible/move/copy/delete）—— task-012-b 决策"**不强制改**签名 `(state, selected, handle?)`"，函数内部用 `store.getState()` 读 byId/parentMap，**保持调用方零改动**；备选方案（强制改签名）会改动 5 个调用方，回归风险高 | task-012-b §3.1 + task-012-c §2.1 | **中** |
| 6 | `01-data-model.md §5.1 setLevelPath` + `02-write-path.md §3.3` | L185 提了"drillDownLevel 重置语义已永久放弃"，**没解释"为什么可放弃"** | grep `onValueChange.*,\s*[1-9]` 仅命中 .bak 文件；活跃代码中所有 onValueChange 都传 `level = 0`（默认）；**drillDown level>0 实际无活跃调用方**；如未来真需要 drillDown 字段级更新，按 plan §3.3 加 `updateFieldConfigDeep` | task-008 §3.3 + §7 Review 修正 | **中** |
| 7（升级） | `05-known-bugs.md §1.3`（task-016 待清理清单） | L83-89 还列着原始 8 处 mutation 清单（lock L10/L24 / visible L10/L24 / move L19-L44），**没明确说"实际已大部分修复"**——**与 `00-overview.md §6.1` L236 "仅剩 2 行"自相矛盾** | task-016 实际审计结论（2026-07-24）：8 处 mutation **已修 6 处**（lock/visible 已修 task-009，move 已修 task-010，designer-field parents.children 已修 task-010，configuration-panel/page render 内 mutation 已修 task-011-fix，designer-scene-monitor / saveAsTemp 已修 task-012-1）；**仅剩 useOnDrop L28 unshift + L61 splice 共 2 行真 mutation**；cloneDeep 4 处待审 → 实际 2 处待审（dnd/helper L60、DataSetList L120）+ 2 处白名单合理使用（resetUniqueId / generatorField / resetObjectSealed / fetchMaterialSchema） | task-016 §1.1 + §1.2 | **高**（review 升级：design 内部矛盾严重——00-overview 说"2 处"，05-known-bugs 还列"8 处"，使用者会得到错误信息） |
| 8（**新增漏 2**） | `02-write-path.md §4.2-4.4`（mergeByIdIntoTree 双向合并语义） | §4.2 给了"nodeWins 新树是 fresh / byIdWins tree 全 stale"的**结论**，**没解释"为什么 setComponents 时新树是 fresh"** 这个关键判断 | **byIdWins vs nodeWins 决策原因**（plan §1.1 表第一行就提了但原 8 条清单漏覆盖）：① setComponents 路径——新树由 `mergeFieldConfig` 产出，节点 data 是 `{ ...oldData, config: { ...oldConfig, ...newConfig } }`，**operation fields 在新树是 fresh，未触碰字段是 stale**（nodeWins 简化策略保留旧行为，避免回归）；② save 路径——tree 全 stale（没经过 setComponents），byId 全 fresh（累计所有 updateFieldConfig 更新）→ byIdWins；**未触碰字段的差异**是 §3.4 待修的"改名丢失" bug 根因（task-014 修） | task-012-1 §2（问题 3 根因）+ §3.1（Step 1.2 实现） | **中** |

---

**§6.1 修订说明**（相对第一版 8 条清单）：

1. **缺口 8（legacyForceForceUpdate 双重通知）已删除**——review 建议：已删 API 历史细节无价值，违反"design 是当前事实快照"定位；如未来有人查证，去翻 `task-006 §3.1` plan 即可
2. **缺口 1 优先级"高"→"中"**——review 建议：与缺口 7 比，"症状模式补充"没有"内部矛盾"紧急
3. **缺口 1 描述修订**：明确"沉症状模式，不沉 12 个文件具体清单"（避免与 §6.2 排除项矛盾）
4. **缺口 2 加"已核实"标注**：task-007 L89 原文有"440 组件：约 1-2ms（一次递归 + 两次 reduce）"（review 误判数字没来源）
5. **缺口 4 优先级"中"→"高"**——review 建议：影响未来"能否删 cloneDeep"决策
6. **缺口 5 描述修订**：区分 task-012-c 改签名的工具（generatorGroup/splitGroup/getSelectedKeys）vs task-012-b 不强制改签名的 layer-manager 整体函数
7. **缺口 7 优先级"中"→"高"**——review 升级：design 内部矛盾（00 说"2 处" vs 05 说"8 处"）
8. **新增缺口 8（漏 2）**：byIdWins vs nodeWins 决策原因——plan §1.1 表第一行就提了但原清单漏覆盖

---

### 6.2 排除项（明确"不下沉"的 plan 内容）

> 按 plan §1 "事实性 vs 过程性" 分类表，**过程性内容**保留在 plan，不下沉到 design。

| 类别 | 例 | 不下沉原因 |
| --- | --- | --- |
| 各 task 的"实施记录" | task-006 §7 / task-011 §7 / task-012-1 §8 | 时间戳 + commit 列表，纯过程 |
| 各 task 的"风险与回退方案" | task-008 §6 / task-012-b §6 | 当时决策的风险评估，对未来 task 价值低 |
| 各 task 的"具体行号修改清单" | task-011 §4 步骤 4 列出 16 个文件分批 | 已通过 commit 历史可查；design 只说"统一从 @Src/store/designer 导入" |
| 备选方案的完整代码 | task-005 §1.3 备选方案 B/C 的代码 | design 只说"为什么选 A 不选 C"，不写完整代码 |
| task-006 §4 步骤 4 A/B/C 类 mutation 分类 | A 类 2 处真 bug / B 类 6 处推迟 / C 类 8 处工具函数内 | 已修的事实无需保留 A/B/C 分类；只说"task-006 阶段 cloneDeep 保护，因此部分 mutation 推迟"即可 |
| 各 task 的冒烟测试 checklist | task-008 §4 步骤 6 / task-011 §4 步骤 8 | 一次性验证清单，已完成 |
| 调研依赖 + 预计工时 | task-006 头部 "1.5 天（含 0.5 天 buffer）" | 估算类信息 |
| task-005 §1.2 12 个文件受影响清单 | 列了 12 个具体文件 + 错行 | 已修，无未来参考价值；只保留"嵌套 Provider 行为"事实即可 |
| task-011 §3.3 的 7 个切换模板 | 7 种 useDesigner() 替换写法 | 已切换完成，design 只说"统一从 @Src/store/designer 导入 + 用 useSelector/useDispatch/useFieldConf" |
| task-011 §3.1.1/3.1.2 reducer 代码 + action creator 代码 | 完整实现 | 代码就是事实，不需在 design 重复 |
| task-012-1 §3.5 实施顺序 | 步骤 1-4 排序 | 过程性 |

---

### 6.3 阶段 2 启动门槛 + 启动顺序

- ✅ 缺口清单 = 8 条（≥ 3 条门槛）→ **建议启动阶段 2**

**阶段 2 启动顺序**（review 反馈修订：先修矛盾后补缺失）：

| 步骤 | 缺口 | 优先级 | 改动文件 | 上下文成本 |
| --- | --- | --- | --- | --- |
| 1 | **缺口 7** | 高（**修 design 内部矛盾**） | `05-known-bugs.md §1.3`（mutation 清单修正）+ 同步 `00-overview.md §6.1` fact-check 表（如有偏差） | 中 |
| 2 | **缺口 4** | 高（**关键决策原因**） | `06-principles.md §6.2`（"工具函数内部 mutation 隐式保护"事实 + 未来警示） | 小 |
| 3 | **缺口 2** | 高（**性能数据 + drillDown 决策**） | `01-data-model.md §2` + `04-edge-cases.md §0`（buildIndex 1-2ms + drillDown 不进 byId 原因） | 中 |
| 4 | **缺口 3** | 高（**useFieldConf fallback 决策**） | `03-read-path.md §2`（ownerSetting 回退 + propsDataSource fallback） | 小 |
| 5 | **缺口 8（漏 2）** | 中（**mergeByIdIntoTree 决策原因**） | `02-write-path.md §4.2-4.4`（byIdWins vs nodeWins 原因 + 未触碰字段差异） | 中 |
| 6 | **缺口 5** | 中（**签名决策边界**） | `02-write-path.md §2.4`（区分 task-012-c 改签名工具 vs task-012-b 不改签名 layer-manager） | 小 |
| 7 | **缺口 6** | 中（**drillDown level>0 结论**） | `01-data-model.md §5.1` + `02-write-path.md §3.3`（grep 结论 + 未来扩展路径） | 小 |
| 8 | **缺口 1** | 中（**症状模式补充**） | `07-view-slices.md §4.3`（嵌套 Provider 症状模式 + 备选方案 ABC 评估） | 小 |

**排序原则**（review 反馈采纳）：
- **步骤 1-2 修"矛盾 + 决策原因"**（高紧迫性）
- **步骤 3-5 修"高价值事实"**（性能 + 字段级 + 写路径核心决策）
- **步骤 6-8 修"中价值补充"**（签名边界 + drillDown 扩展 + 症状模式）

### 6.4 阶段 1 验证

- ✅ 已读 9 份 design 文档（00/01/01-01/02/03/04/05/06/07）
- ✅ 已读 8 份 plan 文档（005/006/007/008/011/012-a/012-b/012-c + 016/012-1 共 10 份，含 2 份非 done）
- ✅ 已 grep 验证 6 个关键事实（legacyForceUpdate / drillDown / buildIndex 性能 / ownerSetting / 嵌套 Provider / useOnDrop L28/L61）
- ⚠️ plan §4.1 引用的 task-016 / task-2026-07-24-012-1 实际未 done，已在 §6.0 标注，但事实细节仍然有效

---

## 7. 整体验证（阶段 2 完成后）

### 7.1 grep 验证（每条沉淀后立即执行）

- 对每条沉淀：grep design 文档新内容是否一致
- 对每条沉淀：grep plan 文档原内容是否被准确引用

### 7.2 fact-check 表格更新

- 每条沉淀完成后，更新 `00-overview.md` §6.1 fact-check 表格（新增 ✅ 行）

### 7.3 不一致处理

- 如 design 新内容与 plan 原内容矛盾 → 以 code 为准（00-overview.md §6.3）
- 如发现 design 文档其他位置遗漏 → 追加到缺口清单

### 7.4 阶段 2 完成验证（2026-07-24）

8 步沉淀全部完成，grep 一致性检查通过：

| 步骤 | 缺口 | 改动文件 | grep 验证 |
| --- | --- | --- | --- |
| 1 | 缺口 7 | `05-known-bugs.md §0/§1.3` + `06-principles.md §6.2/§6.3/§6.4` + `04-edge-cases.md §6` | ✅ "8 处 mutation" 矛盾已消解，5 处描述一致（均说"已修 6 处，剩 2 行"） |
| 2 | 缺口 4 | `06-principles.md §6.4`（新增） | ✅ "隐式保护事实 + 未来警示"已沉淀 |
| 3 | 缺口 2 | `01-data-model.md §2 + §2.1` | ✅ buildIndex 性能 + drillDown 不进 byId 原因已沉淀，3 处描述一致 |
| 4 | 缺口 3 | `03-read-path.md §2.4`（新增） | ✅ propsDataSource fallback 决策已沉淀 |
| 5 | 缺口 8 | `02-write-path.md §4.2.1`（新增） | ✅ byIdWins vs nodeWins 决策原因已沉淀，30 处描述一致 |
| 6 | 缺口 5 | `02-write-path.md §2.4.1`（新增） | ✅ 签名决策边界已沉淀 |
| 7 | 缺口 6 | `01-data-model.md §5.1.1`（新增） | ✅ drillDown level>0 grep 结论已沉淀 |
| 8 | 缺口 1 | `07-view-slices.md §4.3`（扩充） | ✅ 嵌套 Provider 症状模式 + 3 备选方案 ABC 评估已沉淀 |

**跨文档一致性**：grep 关键事实（useOnDrop L28/L61、byIdWins/nodeWins、drillDown 不进 byId）在所有 9 份 design 文档描述无矛盾。

**fact-check 表格**：`00-overview.md §6.1` L236 已有 mutation 审计行（"仅剩 useOnDrop L28/L61 共 2 行真 mutation"），与本次沉淀一致，无需额外更新。

---

## 8. 风险与回退

- **风险**：低——纯文档修改，不动代码
- **风险**：中——可能误把"过程性内容"沉淀到 design（破坏分层）
    - 对策：每条沉淀前判断"是事实还是过程"，过程性内容**不下沉**（参考 §1 分类表）
- **回退**：单条沉淀独立可回退（每条写入单独 commit）

---

## 9. 不做

- ❌ 不修改 `src/` 任何代码（纯文档修改）
- ❌ 不修改 `plans/done/` 任何 plan 文档（按规则 §9 "❌ 不修改 plan 作为历史调研保留"）
- ❌ 不修改 `research/` 文档
- ❌ 不做"plan→design 全文搬运"——只沉淀**事实性细节**，过程性内容保留在 plan
- ❌ 不动 `07-view-slices.md §7` 字段使用矩阵（task-017-c 已沉淀）
- ❌ 不动 `01-data-model.md §6` 持久化策略（task-017-b 已沉淀）
- ❌ 不动其他 research 链接措辞（task-017-a 已沉淀）
- ❌ **完成阶段 1 后不自动继续阶段 2**（避免上下文爆表，由用户审阅缺口清单后启动）

---

## 10. 决策溯源

- "事实下沉"模式：参考 task-017-a/b/c 的 research→design 沉淀实践
- "分层原则"：参考 `00-overview.md` §0 权威性声明 + §6 fact-check 流程
- "过程性 vs 事实性"分类：参考本 task §1 分类表