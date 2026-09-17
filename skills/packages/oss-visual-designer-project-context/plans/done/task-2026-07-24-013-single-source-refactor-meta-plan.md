# task-2026-07-24-013：单源重构元计划（"做计划的计划"）

> 目标：为 designerCanvas 单源重构制定一个 9 成把握的详细执行方案
>
> 计划日期：2026-07-24
> 任务编号：`task-2026-07-24-013`
> 状态：`in-progress`
> 类型：`research`（产出重构方案，不直接改代码）
>
> **本 task 不改任何源码，只产出一份可 review 的重构方案文档**

---

## 0. 为什么要做这个元计划

task-006→012 的重构引入了 byId/树双源同步机制，产生了 4 个连环 bug（task-012-1/012-2/012-3 + 潜在的 dirtyConfigKeys 累积 / undo-redo / 并发 dispatch / 内存泄漏）。当前路径已进入"补丁套补丁"循环。

单源重构（components 树唯一真相，byId 纯派生）能从根本上消除这些问题，但这是大改动，必须先把方案做到 9 成把握再动手。

**本元计划定义"如何把把握从现状提到 9 成"的过程**。

---

## 1. 元计划总览（6 个阶段）

```
阶段 1：摸清现状（代码 + 文档）
    ↓ 产出：现状清单
阶段 2：定义目标架构
    ↓ 产出：目标设计文档
阶段 3：差距分析
    ↓ 产出：改动清单 + 风险清单
阶段 4：制定详细执行步骤
    ↓ 产出：分步执行方案
阶段 5：制定验证方案
    ↓ 产出：验证清单 + 回退方案
阶段 6：方案 review + 定稿
    ↓ 产出：最终重构 task 文档（task-014）
```

**每个阶段完成后暂停，等你 review 确认后才进入下一阶段。**

---

## 2. 各阶段详细定义

### 阶段 1：摸清现状

**目标**：把所有与双源同步相关的代码和文档全部摸清，不留盲区。

**1.1 代码摸清范围**：

| 摸什么 | 哪里 | 为什么要摸 |
| --- | --- | --- |
| `designerCanvas` reducer 全部 action | `src/store/modules/designer-canvas.ts` | 确定哪些 action 写 byId、哪些写树、哪些两者都写 |
| `mergeByIdIntoTree` 三方向实现 | `src/designer/renderer/utils.ts` L690-L749 | 确定合并逻辑的每个分支 |
| `buildIndex` 实现 | `src/designer/renderer/utils.ts` L765-L807 | 确定派生索引的完整逻辑 |
| `updateFieldConfig` 全部调用方 | grep `updateFieldConfig\|useUpdateFieldConfig` | 确定 17+ 调用方各自改什么字段 |
| `setComponents` / `setState` 全部调用方 | grep `setComponents\|setState` | 确定哪些场景走结构性变更 |
| `getSaveableComponents` 实现 + 调用方 | `src/designer/renderer/utils.ts` + grep | 确定保存路径的合并方向 |
| `recalcGroupBounds` 完整逻辑 | `src/designer/DesignerContent.tsx` L279-L375 | 确定组尺寸重算的 byId/树交互 |
| `beginSkipGroupRecalc` / `endSkipGroupRecalc` | grep | 确定 skip 机制的完整覆盖范围 |
| `dirtyConfigKeys` 所有读写点 | grep `dirtyConfigKeys` | 确定脏字段追踪的所有路径 |
| `useFieldConf` 订阅实现 | `src/store/designer/hooks/` | 确定字段级订阅依赖 byId 的哪些字段 |
| `useFlatComponents` 实现 | `src/store/designer/hooks/` | 确定扁平化订阅的依赖 |
| `parentMap` 所有使用点 | grep `parentMap` | 确定父索引的读写场景 |

**1.2 文档摸清范围**：

| 摸什么 | 哪里 | 为什么要摸 |
| --- | --- | --- |
| 数据模型契约 | `01-data-model.md`（244 行） | 确定树形状 / byId / parentMap / FlatField 的完整契约 |
| 写路径选型 | `02-write-path.md`（408 行） | 确定所有写路径的选型决策和原因 |
| 读路径选型 | `03-read-path.md`（342 行） | 确定所有读路径的选型决策和原因 |
| 边界场景 | `04-edge-cases.md`（295 行） | 确定所有边界场景的处理方式 |
| 已知 bug | `05-known-bugs.md`（224 行） | 确定哪些 bug 与双源同步相关 |
| 架构原则 | `06-principles.md`（428 行） | 确定哪些原则会约束重构方案 |
| view slices | `07-view-slices.md`（292 行） | 确定是否影响 view 侧 |

**1.3 产出**：一份"现状清单"文档，包含：
- 所有写 byId 的路径（action + 调用方）
- 所有写 components 树的路径
- 所有读 byId 的路径
- 所有读 components 树的路径
- dirtyConfigKeys 的完整生命周期
- 现有文档中哪些内容会因重构而过时

**1.4 完成标准**：能用一句话回答"byId 当前被哪些路径写入、哪些路径读取，如果 byId 变成纯派生（只读），哪些路径会断"。

---

### 阶段 2：定义目标架构

**目标**：明确单源重构后的目标设计。

**2.1 要回答的问题**：

| 问题 | 选项 | 需要决策 |
| --- | --- | --- |
| byId 是否还能被独立写入？ | A. 完全只读（buildIndex 派生） / B. 保留写入但同步更新树 | 倾向 A |
| `updateFieldConfig` 改树用什么方式？ | A. Immer produce 递归 / B. parentMap 找路径后 produce / C. 其他 | 需评估性能（倾向 B：parentMap 反向追踪 O(depth) 找节点路径，替代方案 A 从 root 递归 O(n) 查找；两者 produce 本身都是 O(depth) 结构共享复制——Immer produce 惰性，只复制被修改路径上的节点，不遍历整树。B 的优势是**找节点**更快，不是 produce 更省；需 440 组件基准测试） |
| `buildIndex` 每次 setComponents 都全量重建？ | A. 全量 O(n) / B. 增量更新 | 先 A，性能不够再 B |
| `mergeByIdIntoTree` 是否删除？ | A. 完全删除 / B. 保留但不用于 setComponents | 倾向 A（完全删除函数本体 + 类型导出 + 三方向常量 nodeWins/byIdWins/fieldPreserve；nodeWins 当前已是死代码，byIdWins 仅 `getSaveableComponents` 用、fieldPreserve 仅 reducer 用，单源后三者一并删除） |
| `dirtyConfigKeys` 是否删除？ | A. 完全删除 / B. 保留用于其他场景 | 倾向 A |
| `fieldPreserve` / `nodeWins` / `byIdWins` 是否删除？ | A. 完全删除 / B. 保留 byIdWins 给保存用 | 倾向 A（保存改用树直接序列化） |
| `recalcGroupBounds` 的 task-012-2 修复（先 update 再 set）是否简化？ | A. 简化为单次 setComponents / B. 保持两步 | 倾向 A（建议保持 `setState({ components })` 调用形式，内部走 setComponents reducer，与 17+ 调用方 API 风格一致） |
| `beginSkipGroupRecalc` / `endSkipGroupRecalc` 是否保留？ | A. 删除 / B. 保留 | 倾向 A（阶段 1 §1.9 已确认是死代码：beginSkip/endSkip 全 src 无调用方，shouldSkip 永远 false） |
| `useFieldConf` 订阅是否变化？ | A. 不变（byId 仍存在，只是派生的） / B. 改为订阅树 | 倾向 A |
| `getSaveableComponents` 是否简化？ | A. 直接序列化树 / B. 保留 byIdWins | 倾向 A |

**阶段 1 补充的 5 个遗漏问题**（阶段 1 现状清单已初步回答）：

| 问题 | 阶段 1 现状清单的回答 | 阶段 2 是否需深入 |
| --- | --- | --- |
| `mergeFieldConfig` / `getGroupSizePosition` / `resetChildrenPosition` / `setChildren` 单源后保留还是删除？ | §1.17：全部保留（结构性变更工具，与双源无关） | 否（已明确） |
| `getFieldNodeById` 单源后保留还是简化？ | §1.17：保留（返回浅引用，单源后 components 永远 fresh，返回值直接可用，无需 freshChildNodes 包装） | 否（已明确） |
| `useOnDrop` 的 2 处真 mutation 是否在单源前修？ | §1.14：阶段 4 决策（倾向方案 B 并入重构） | 是（阶段 4 定） |
| undo/redo 重构后是否能正确工作？ | §1.16：undo/redo 是死字段，未实现，无需考虑兼容性 | 否（已明确） |
| `byId` 是否还能用 `data` 浅引用？ | 单源后 byId 仅在 buildIndex 时新建，data 仍是 node.data 浅引用，理论上更安全 | 否（已明确） |

**2.2 产出**：一份"目标设计文档"，包含：
- 目标数据流图
- 每个 action 的新实现（伪代码）
- 要删除的代码清单
- 要修改的代码清单

**2.3 完成标准**：能回答"重构后 byId 是怎么产生的、谁写它、谁读它、它还会和树脱钩吗"。

---

### 阶段 3：差距分析

**目标**：对比现状和目标，列出所有需要改的点和风险。

**3.1 产出**：

- **改动清单**：每个文件需要改什么，按"删除 / 修改 / 新增"分类
- **调用方影响清单**：17+ 个 `updateFieldConfig` 调用方是否需要改（理想情况下调用方 API 不变，只改 reducer 内部实现）
- **风险清单**：
  - 性能风险：O(n) buildIndex 是否可接受
  - 兼容风险：调用方 API 是否变化
  - 回归风险：哪些已修 bug 可能复现
  - 文档风险：哪些文档需要重写

**3.2 完成标准**：能回答"这次重构要改几个文件、每个文件改什么、最大的风险是什么、怎么缓解"。

---

### 阶段 4：制定详细执行步骤

**目标**：把改动拆成可独立验证的步骤，每步可单独 commit + 回退。

**4.1 拆分原则**：
- 每步改动不超过 5 个文件
- 每步改完能跑 `pnpm tsc --noEmit` + 浏览器冒烟
- 步骤间有依赖关系时明确标注

**4.2 初步步骤框架**（实际内容待阶段 1-3 完成后填充）：

```
步骤 1：补测试（task-012-4/012-5 先做，固定当前行为）
步骤 2：改 updateFieldConfig reducer（改树 + buildIndex）
步骤 3：改 setComponents reducer（删 mergeByIdIntoTree 调用）
步骤 4：改 setState reducer（同上）
步骤 5：改 recalcGroupBounds（简化为单次 setComponents）
步骤 6a：删除已无人调用的合并函数本体 + dirtyConfigKeys + fieldPreserve + nodeWins + byIdWins
         （此时 mergeByIdIntoTree 在步骤 3/4 已无调用方，函数本体安全删除）
步骤 6b：删除 skip 机制（beginSkipGroupRecalc / endSkipGroupRecalc / shouldSkipGroupRecalc / _skipGroupRecalc）
         + 4 个死工具函数（patchFieldConf / getFieldById / getParentIdById / removeFieldFromIndex）
         （阶段 1 §1.9 + §1.13 已确认全部是死代码，无调用方）
步骤 6c：清理备份文件（utils.bak.js / DesignerField.bak.jsx / canvas-graph/index.bak.js）
步骤 7：改 getSaveableComponents（直接序列化树）
步骤 8：更新文档
步骤 9：全量冒烟 + tsc + vitest
```

**步骤 6 拆分理由**：步骤 3/4 之后到步骤 6a 之间，`mergeByIdIntoTree` 函数还在但已无调用方，是合法的中间状态（函数未删但死代码，编译通过、行为正确）。6a/6b/6c 三类清理性质不同：
- 6a 是"双源同步机制本体"删除（mergeByIdIntoTree + dirtyConfigKeys + 三方向常量）
- 6b 是"已存在的死代码"清理（skip 机制 + 4 个工具函数——这些在重构前就是死代码，但顺手在重构中清理避免单独开 task）
- 6c 是"备份文件"清理（不影响逻辑，纯文件清理）

**4.3 产出**：一份"分步执行方案"，每步含具体代码改动 + 验证方式。

**4.4 完成标准**：能回答"每一步改什么、怎么验证、出了问题怎么回退"。

---

### 阶段 5：制定验证方案

**目标**：定义"重构完成后怎么确认没问题"。

**5.1 产出**：

- **回归测试清单**：task-012-4/012-5 的测试全过 + 新增单源不变量测试
- **浏览器冒烟清单**：所有交互场景（拖拽 / 对齐 / 成组 / 拆组 / 撤销 / 保存 / 改名 / 选中）
- **性能验证**（含量化阈值 + 回退标准，见 §5.3）
- **回退方案**：每个步骤的 git revert 路径

**5.2 完成标准**：能回答"怎么确认重构没引入回归、性能没退化、出了问题怎么回退"。

**5.3 性能预算与回退标准**：

> 当前**没有**保存拖拽帧率的量化基线数据（动机说明 §3 已记录）。阶段 1 现状清单 §1.3 仅记录了文档中 buildIndex 440 组件 1-2ms 的设计目标值。**单源重构前必须先建立性能基线**（在阶段 4 步骤 1 之前，或并入 task-019 vitest 引入时一并做），否则重构后无法对比"重构前 vs 重构后"。

**5.3.1 性能基线建立（重构前必做）**：

用 Performance API（或 task-019 引入的 vitest bench）实测当前双源架构的以下指标，作为重构后对比基线：

| 指标 | 测量方式 | 场景 |
| --- | --- | --- |
| `buildIndex` 耗时 | `performance.mark/measure` 包裹 buildIndex 调用 | 440 组件 setComponents |
| `updateFieldConfig` 总耗时 | `performance.mark/measure` 包裹 reducer 执行 | 单次字段级更新 |
| 拖拽期间 React 渲染帧率 | Chrome DevTools Performance tab 录制 | 拖动单个组件 5 秒 |
| 拖拽期间 CPU 占用 | Performance tab 录制 | 同上 |

**5.3.2 重构后可接受阈值（初稿，阶段 5 根据基线实测调整）**：

| 指标 | 阈值 | 不达标时的回退措施 |
| --- | --- | --- |
| `buildIndex` 平均耗时 | ≤ 3ms（P95 ≤ 5ms） | 引入增量 buildIndex（仅更新变化路径的 byId 条目） |
| 拖拽期间 React 渲染帧率 | ≥ 50fps（基线若 ≥ 55fps 则要求不降 5fps+） | 对 60Hz 路径 `updateFieldConfig` 加 throttle / rAF 节流 |
| 单次 `updateFieldConfig` 总耗时 | ≤ 3ms | 同上，或对 `produce` 改树路径做 memoize |
| `updateFieldConfig` 在 60Hz 路径的 CPU 占用 | 不超过基线 × 1.5 | throttle / rAF |

**5.3.3 60Hz 路径风险评估**（阶段 1 §1.4 已识别）：

`updateFieldConfig` 调用方中，`designer-field/index.tsx` L214/L230 的 `onDragStop` 拖拽路径是 **60Hz 触发**（react-rnd 拖拽期间每帧 onChange）。单源后该路径从 O(1) patch byId 变为 O(depth) produce 改树 + O(n) buildIndex × 60Hz。

- 若实测 buildIndex 1-2ms × 60Hz = 60-120ms/秒 CPU 占用，**可能可接受**（React 渲染开销远大于此）
- 若实测不可接受（帧率 < 50fps），回退措施：对 `useUpdateFieldConfig` 的拖拽路径加 `requestAnimationFrame` 节流，或对 `updateFieldConfig` reducer 内 buildIndex 做 lazy 化（dispatch 时不立即 buildIndex，下一帧统一 build）——**这是调用方代码改动**，阶段 2 决策时需评估

---

### 阶段 6：方案 review + 定稿

**目标**：你 review 前 5 个阶段的产出，确认方案可行，产出最终重构 task。

**6.1 产出**：
- 一份正式的 `task-2026-07-24-014-single-source-refactor.md`（放到 plans/ 根目录）
- 包含完整的背景 / 目标 / 步骤 / 验证 / 风险 / 回退
- roadmap.md 追加索引

**6.2 完成标准**：

1. 你说"可以开始做了"，才进入实际执行
2. **回顾性自检**（保证方案完整性）：对照以下三份产出，逐条确认 task-014 中有至少一个执行步骤对应，无遗漏项：
    - **阶段 1 现状清单**：每个代码摸清项（§1.1-§1.17）的死代码/待改点是否都被阶段 4 步骤覆盖？特别是：
        - §1.9 skip 机制 → 步骤 6b
        - §1.13 patchFieldConf 等 4 个死工具函数 → 步骤 6b
        - §1.13 nodeWins 死代码方向 → 步骤 6a
        - §1.14 useOnDrop 2 处真 mutation → 步骤中是否有对应清理（方案 B 并入重构）
        - §1.16 undo/redo 死字段 → 步骤中是否一并清理
        - §1.17 结构性变更工具函数 9 个 → 确认全部保留，不在删除清单中
        - §2.1 每份文档的删除/重写比例 → 步骤 8"更新文档"是否细分到每份文档
    - **阶段 3 风险清单**：每个风险是否有对应的缓解措施或验证步骤？
    - **阶段 5 验证清单**：每个性能阈值/回退标准是否在 task-014 的验证章节中有对应？

**6.3 自检 checklist 模板**（task-014 定稿前填写）：

```
□ 阶段 1 §1.1-§1.17 每个代码摸清项 → task-014 步骤 X 对应
□ 阶段 1 §2.1 8 份文档（不含 01-01）→ task-014 步骤 8 细分到每份
□ 阶段 1 §4.3 额外发现 7 条 → task-014 步骤对应（skip 机制 / 4 死函数 / nodeWins / 备份文件 / task-015 取消 / undo/redo 死字段 / 9 个保留函数）
□ 阶段 3 风险清单每条 → task-014 风险章节有缓解措施
□ 阶段 5 §5.3 性能阈值 4 项 → task-014 验证章节有测量方式 + 回退措施
□ 阶段 5 §5.3.1 性能基线建立 → task-014 步骤中在重构前有建基线步骤
```

---

## 3. 未执行的前置计划

以下 3 个 task 在单源重构之前已存在但尚未执行。元计划必须知晓它们，在阶段 1（摸清现状）和阶段 4（制定详细步骤）中评估它们与单源重构的关系。

### 3.1 task-015：stale tree 防御性读取统一封装

- **文档**：[task-2026-07-24-015-stale-tree-defensive-reading.md](./task-2026-07-24-015-stale-tree-defensive-reading.md)
- **状态**：`planning`
- **内容**：封装 `safeReadChildNodes` / `safeReadFieldConf` 工具函数，统一处理"读 components 树可能拿到 stale data"的问题；审计 6 个文件的 children 读取位置
- **与单源重构的关系**：这是在"双源同步"前提下打的补丁。单源重构后 byId 永远是树的派生（只读），不存在 stale tree，`safeRead*` 可能不再需要
- **元计划中的处理**：阶段 1 摸清现状时确认 safeRead 的使用范围；阶段 4 判断是"先做 015 再重构"还是"直接重构让 015 自然消失"

### 3.2 task-016：清理 mutation 残留 + cloneDeep 滥用

- **文档**：[task-2026-07-24-016-audit-cloneDeep-mutations.md](./task-2026-07-24-016-audit-cloneDeep-mutations.md)
- **状态**：`planning`
- **内容**：清理 `useOnDrop.ts` L28/L61 的 2 处真 mutation（unshift + splice）+ 审计 `dnd/helper.ts` L60 和 `DataSetList.tsx` L120 的 2 处 cloneDeep
- **与单源重构的关系**：mutation 是不可变契约问题，与双源无关。单源重构后 `updateFieldConfig` 要用 Immer produce 改树，如果还有 mutation 残留会冲突
- **元计划中的处理**：阶段 1 摸清 mutation 现状；阶段 4 判断 016 是否作为单源重构的前置步骤

### 3.3 task-019：冒烟 + tsc + vitest + task-010 单测补全

- **文档**：[task-2026-07-24-019-smoke-and-tsc-cleanup.md](./task-2026-07-24-019-smoke-and-tsc-cleanup.md)
- **状态**：`planning`
- **内容**：修复 `src/` 下 4 处 tsc pre-existing 错误 + 引入 vitest（替代 jest）+ 补全 task-010 的 12 个不可变改造断言 + 浏览器冒烟清单
- **与单源重构的关系**：vitest 引入是 task-012-4/012-5（纯函数 + reducer 测试）的前置依赖，而 012-4/012-5 是单源重构的"固定当前行为"基础。tsc 修复和冒烟清单可复用于单源重构的验证
- **元计划中的处理**：阶段 4 判断 vitest 引入是否作为单源重构的前置步骤；阶段 5 验证方案复用 019 的冒烟清单
- **拆分建议**：task-019 包含的三部分性质不同，建议拆分处理：
    - **子任务 1（tsc 修复）+ 子任务 2（vitest 引入）**：作为单源重构的**强前置**（阶段 4 步骤 1 之前完成）——tsc 错误会掩盖重构引入的新错误；vitest 是 task-012-4/012-5 测试的运行环境
    - **子任务 3（冒烟清单 + task-010 断言）**：可在单源重构完成后做（阶段 5 复用）——冒烟清单是验证手段，不是前置依赖
    - 拆分理由：混在同一个 task 里会让"先做哪部分"的判断变复杂；tsc + vitest 是"基础设施"，冒烟清单是"验证手段"

### 3.4 待决策的执行顺序

以下顺序**仅为初步框架**，实际顺序在阶段 4（制定详细步骤）中根据阶段 1-3 的分析结果最终确定：

```
方案 A（先补丁后重构）：
  task-019（vitest + tsc）→ task-016（mutation 清理）→ task-012-4（测试）
  → task-2026-07-27-001 单源重构 → task-019 剩余（冒烟）
  → ~~task-015~~（可能取消）

方案 B（直接重构）：
  task-019（vitest + tsc）→ task-012-4（测试）
  → task-2026-07-27-001 单源重构（含 mutation 清理）
  → task-019 剩余（冒烟）
  → ~~task-015~~（取消）+ ~~task-016~~（并入重构）
```

**阶段 1 的决策依据**（阶段 4 最终定夺）：

| 维度 | 方案 A（先补丁后重构） | 方案 B（直接重构） |
| --- | --- | --- |
| mutation 清理工作量 | 独立 task-016 先做 | 并入单源重构（阶段 1 §1.14 确认仅 2 处真 mutation：useOnDrop L29/L61，工作量小） |
| 代码基线一致性 | 重构前会出现"修了 mutation 但没改双源"的中间状态 | 重构时一次性改完，无中间状态 |
| 任务编排复杂度 | 多一个 task（016） | 少一个 task（016 并入） |
| 与动机一致性 | 补丁套补丁（与动机 §6 冲突） | 从根上重写（与动机 §10 一致） |
| 测试基础设施 | 先稳测试基础设施再改源码 | 同样先稳测试基础设施（task-019 vitest + tsc 是两者的共同前置） |

**倾向方案 B**（直接重构），理由：mutation 仅 2 处工作量小；方案 A 的中间状态不利于回归测试；与"单源重构从根上重写"的动机一致。**但最终决策在阶段 4**——方案 A 在"测试基础设施先稳"的场景下也有合理性。

---

## 4. 阶段间的依赖与暂停点

```
阶段 1（摸清现状）
    ↓ 暂停 → 你 review 现状清单
阶段 2（定义目标架构）
    ↓ 暂停 → 你 review 目标设计
阶段 3（差距分析）
    ↓ 暂停 → 你 review 改动清单 + 风险清单
阶段 4（制定详细步骤）
    ↓ 暂停 → 你 review 执行方案
阶段 5（制定验证方案）
    ↓ 暂停 → 你 review 验证方案
阶段 6（定稿）
    ↓ 你确认 → 产出 task-014，开始执行
```

**每个暂停点我会通知你，等你确认后才继续。**

---

## 5. 文档整理问题

你提到 designer-canvas 文档"又厚又难维护"（9 个文件共约 3000 行）。这与单源重构相关：

- **重构后**：`mergeByIdIntoTree` / `dirtyConfigKeys` / `fieldPreserve` / skip 机制都会删除或简化，文档中关于这些的内容（02-write-path 约 408 行的 1/3、04-edge-cases 约 295 行的 1/2、05-known-bugs 约 224 行的 1/2）都会大幅缩减
- **阶段 1 摸清文档时**：我会同步标注"哪些内容重构后会过时"，为后续文档精简做准备
- **memo.md 已有"文档去重整合"想法**：重构后一并处理

---

## 6. 时间预期

不做时间估算（项目规则要求），但定义**完成标准**：

- 阶段 1-5 的产出文档完成后，你能在 1-2 小时内 review 完并判断"是否可以开始执行"
- 如果 review 后把握不到 9 成，回到对应阶段补充

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：元计划创建。定义 6 个阶段（摸清现状 → 定义目标 → 差距分析 → 详细步骤 → 验证方案 → 定稿），每阶段完成后暂停等你 review。本 task 不改源码，只产出重构方案。
- 2026-07-24：新增 §3"未执行的前置计划"，把 task-015（safeRead 封装）/ task-016（mutation 清理）/ task-019（冒烟 + tsc + vitest）并入元计划。初步分析它们与单源重构的关系，但不判断是否执行——等阶段 1-3 摸清现状后在阶段 4 决策执行顺序。
- 2026-07-27：**阶段 1（摸清现状）完成**。产出 [阶段1-现状清单.md](../research/refactor-single-source/阶段1-现状清单.md)（约 460 行），覆盖：
    - 代码现状 15 节：reducer 8 action / mergeByIdIntoTree 三方向 / buildIndex / updateFieldConfig 15 调用方 / setComponents 18 调用点 / setState 调用方 / getSaveableComponents 3 保存路径 / recalcGroupBounds 完整算法 / skip 机制 / dirtyConfigKeys 生命周期 / hooks / parentMap 16 文件 / 4 个死代码工具函数 / mutation 2 处 + cloneDeep 2 处
    - 文档现状：8 份文档约 2496 行，标注每份的单源后删除/重写比例（04-edge-cases 85% / 02-write-path 50% / 01-data-model 40% / 03-read-path 35% / 06-principles 30% / 00-overview 30% / 05-known-bugs 25% / 07-view-slices 5%）
    - 双源 vs 单源数据流图
    - 完成标准自检：一句话回答 byId 被谁写谁读、变纯派生后哪些路径会断（仅 updateFieldConfig reducer 的 patch byId 分支会断，其余读路径不断）
    - **额外发现**：skip 机制（beginSkip/endSkip）是死代码（无调用方）；patchFieldConf/getFieldById/getParentIdById/removeFieldFromIndex 4 个工具函数是死代码；nodeWins 方向是死代码；task-015 单源后整个不再需要
    - **暂停等 review**，确认无盲区后进入阶段 2（定义目标架构）
- 2026-07-27：**优化阶段 1 产出**。按阶段 1 暂停后的 review 反馈优化 7 处：
    - **第 1 项（必须）**：补充摸清 undo/redo reducer 实现 → **重大发现：undo/redo 是完全未实现的死字段**（reducer 只有 `undo: []` / `redo: []` 字段定义，无任何 action 读写；toolbar 的 `handleClear` 被注释掉；无撤销/重做按钮）。动机说明 §4.2 的"undo/redo 未验证"潜在问题实际不存在。现状清单新增 §1.16。
    - **第 2 项（必须）**：对齐文档行数 → 9 份文档共 2980 行（精确统计），现状清单 §2.1 补入漏掉的 `01-01-widget-types.md`（482 行，与双源无关）。
    - **第 3 项**：阶段 2 决策矩阵补 5 个遗漏问题 → 元计划 §2.1 新增"阶段 1 补充的 5 个遗漏问题"表（mergeFieldConfig 等工具函数 / getFieldNodeById / useOnDrop mutation / undo/redo / byId 浅引用），阶段 1 现状清单 §1.17 已初步回答。
    - **第 4 项**：明确方案 A vs B 决策依据 → 元计划 §3.4 新增 5 维度对比表，倾向方案 B（直接重构），最终决策在阶段 4。
    - **第 5 项**：task-019 拆分建议 → 元计划 §3.3 新增拆分方案（tsc + vitest 为强前置，冒烟清单为验证手段）。
    - **第 6 项**：动机说明 §10 增加"风险与缓解"列 → 新增 §10.1 风险与缓解表（性能 / 兼容性 / 撤销栈 / 回归 / 文档 5 维度）。
    - **格式修复**：现状清单 §3.1 数据流图注明 setState 走相同流程；补充 §3 性能量化说明；§4.2 undo/redo 条目标记为已消除风险。
    - 现状清单 §1.17 新增"结构性变更工具函数"表（9 个函数单源后全部保留）；§4.3 额外发现补第 6/7 条。
- 2026-07-27：**元计划阶段 4-6 补强**（基于对阶段 1 产出的事实复核）：
    - **阶段 4 §4.2 步骤框架**：原步骤 6 拆为 6a（删合并函数本体 + dirtyConfigKeys + 三方向常量）/ 6b（删 skip 机制 + 4 个死工具函数）/ 6c（清理备份文件），避免漏掉阶段 1 §1.9 + §1.13 + §4.3 发现的死代码清理。原步骤 8"清理 skip 机制"重复，删除。
    - **阶段 5 §5.3 性能预算**：新增 §5.3.1 性能基线建立（重构前必做，用 Performance API 实测当前双源架构基线）+ §5.3.2 重构后可接受阈值（buildIndex ≤ 3ms / 帧率 ≥ 50fps / updateFieldConfig ≤ 3ms，附回退措施）+ §5.3.3 60Hz 路径风险评估（designer-field onDragStop 拖拽 60Hz 触发，单源后从 O(1) patch 变 O(n) buildIndex × 60Hz，可能需 throttle）。
    - **阶段 6 §6.2 回顾性自检**：新增"对照阶段 1 现状清单 + 阶段 3 风险清单 + 阶段 5 验证清单，逐条确认 task-014 有对应步骤"环节 + §6.3 自检 checklist 模板。
    - **阶段 2 §2.1 决策矩阵**：修正第 2 项"减少 produce 遍历范围"为"parentMap 找节点 O(depth) 替代递归 O(n)"（Immer produce 惰性，不遍历整树）；第 4 项 mergeByIdIntoTree 删除范围明确为"函数本体 + 类型导出 + 三方向常量"。
- 2026-07-27：**阶段 2（定义目标架构）完成**。产出 [阶段2-目标架构设计.md](../research/refactor-single-source/阶段2-目标架构设计.md)（约 500 行），覆盖：
    - 目标数据流图：components 树唯一真相源 → buildIndex O(n) 派生 byId/parentMap（只读），删除 7 类机制（mergeByIdIntoTree / dirtyConfigKeys / 三方向常量 / getSaveableComponents / freshChildNodes 包装 / 两步同步 / skip 机制 + 4 死工具函数）
    - 设计决策矩阵 15 项：元计划 §2.1 的 10 个核心决策（byId 完全只读 / updateFieldConfig 改 produce+parentMap 反向追踪 / buildIndex 全量 / mergeByIdIntoTree 完全删除 / dirtyConfigKeys 删除 / 三方向常量删除 / recalcGroupBounds 简化为单次 setComponents / skip 机制删除 / useFieldConf 订阅不变 / getSaveableComponents 直接序列化树）+ 阶段 1 补充的 5 个遗漏问题（9+10+1 个工具函数全保留 / getFieldNodeById 保留 / useOnDrop mutation 方案 B 并入 / undo/redo 死字段无需兼容 / byId data 浅引用保留）
    - 删除/修改/保留代码清单：utils.ts 删 10 函数 + 1 字段；designer-canvas.ts 删 patch byId 分支 + 2 死字段；DesignerContent.tsx 删 freshChildNodes + 两步同步 + skip 分支；3 个保存路径改直接序列化；hooks.ts + 20 个工具函数零改动
    - 60Hz 路径性能评估：onDragStop 1-2ms × 60Hz = 60-120ms/秒 CPU，可能可接受；回退措施按 rAF 节流 → lazy buildIndex → 增量 buildIndex 优先级
    - 完成标准自检：§7.2 决策矩阵 15 项全决策；§7.3 与阶段 1 §1.1-§1.17 逐节对应
    - **暂停等 review**，确认决策合理后进入阶段 3
- 2026-07-27：**阶段 3（差距分析）完成**。产出 [阶段3-差距分析.md](../research/refactor-single-source/阶段3-差距分析.md)（约 980 行），定位为"对阶段 1+2 做事实复核 + 挑刺"，覆盖：
    - **4 个增量发现**（阶段 1+2 未覆盖）：
        - §1.1 重大修正：60Hz 路径描述错误——真实热路径是 onResize（10Hz setComponents）而非 onDragStop（60Hz updateFieldConfig 是误判，实际 onDrag 期间不 dispatch，onDragStop 仅拖拽结束 1 次）
        - §1.3 新风险：useOnDrop L28/L61 真 mutation 与单源后 setComponents reducer 的 Immer 不可变契约冲突，必须并入重构（方案 B）
        - §1.4 隐 bug：`'components' in action.payload` 原型链隐患，改 `Object.prototype.hasOwnProperty.call(...)`（reducer L94 + DesignerContent L154 同步）
        - §1.5 引用传递细节：buildIndex 应在 produce 内接收 draft.components（不是 action.payload），Immer 允许读 draft 引用
    - 改动清单（§2）：核心逻辑 4 文件（designer-canvas.ts / utils.ts / DesignerContent.tsx / useOnDrop.ts）+ 保存路径 3 文件（DesignerContent L414 / saveAsTemp-modal / designer-scene-monitor）= 共 7 文件；含详细伪代码（parentMap 反向追踪 + MAX_DEPTH=100 防循环 + find 返回值检查 + 浅合并行为说明）
    - 调用方影响（§3）：updateFieldConfig 15 调用方 / setComponents 18 调用点 / setState 调用方 / getSaveableComponents 3 保存路径 / parentMap 16 文件 / byId 使用方——**全部 API 零改动**（reducer 内部实现变，签名不变）
    - 风险清单（§4）：性能 3 项（基线缺失 / 真实热路径 / setComponents 全订阅）+ 兼容 3 项 + 回归 5 项（改名丢失 / 位置漂移 / 保存丢失 / 对齐跳组 / 导入配置重建）+ 文档 8 份 + 实施 5 项（含 cloneDeep 与 Immer 冻结交互风险）
    - 阶段 4-6 前置建议（§5）：步骤 -1 排查 useSaveCompDetailData4Designer.ts 独立 buildIndex（隐式调用方盲区）+ 步骤 0 建性能基线 + 步骤 1a 修 useOnDrop mutation + 步骤 6a/7 顺序调整（先删 getSaveableComponents 再删 mergeByIdIntoTree，避免引用失效）+ 步骤依赖关系图
    - 完成标准自检：§6.2 改动清单完整性（删除 10 函数 + 2 字段 + 6 段 + 3 处 import + 4 备份文件；修改 3 action + 2 mutation + 7 文件 + 8 文档）+ §6.4 与阶段 1+2 逐节对应
    - **7 个增量贡献**（§6.5）：60Hz 修正 / mutation 冲突 / `'components' in` 隐 bug / buildIndex 引用传递 / 真实性能评估 / 5 实施风险 / useSaveCompDetailData4Designer 盲区——均需在阶段 4 步骤 + 阶段 5 验证 + 阶段 6 自检中显式覆盖
    - **暂停等 review**，确认 6 个修正/新发现已纳入阶段 4 步骤后进入阶段 4（制定详细执行步骤）
- 2026-07-27：**阶段 4（制定详细执行步骤）完成**。产出 [阶段4-分步执行方案.md](../research/refactor-single-source/阶段4-分步执行方案.md)（约 1210 行），覆盖：
    - **阶段 4 代码复核**（本阶段对阶段 1+2+3 的进一步挑刺）：直接 Read 7 个核心源文件（reducer / utils / DesignerContent / useOnDrop / designer-field / hooks / canvas-graph / recursion-components / 3 保存路径 / useSaveCompDetailData4Designer）+ Grep 验证
    - **新增 2 个阶段 1+3 遗漏的 mutation 点**：
        1. `drag2layoutBlock.ts:49` 直接 mutation `layoutBlockNode.children = ...`（onDragStop → dropToGroup 路径）
        2. `syncLayoutBlockSize2Children` (element.tsx:58-120) 内部全 mutation（`_.set` + `child.children = ...`），3 个调用方（drag2layoutBlock / useOnDrop / setChildren2LayoutBlock→DropContainer）
    - **3 个阶段 3 假设复核**：Immer 9.0.6 确认；RecursionComponents 假设（A7）确认正确；useSaveCompDetailData4Designer.ts **不是真正的双源**（自建 byId/parentMap 用于 generatorGroup 参数，不读 Redux state）
    - **步骤依赖关系图**：10 主要步骤 + 2 前置步骤 + 8 文档子步骤 = 20 个独立 commit 单元
    - **每步完整闭环**："改什么 / 怎么验证 / 怎么回退"
    - **元计划 §4.1 拆分原则遵循检查**：每步 ≤ 4 文件 + 每步 tsc + 依赖关系标注
    - **步骤 6 / 6a 顺序调整已显式标注**：先删 getSaveableComponents 再删 mergeByIdIntoTree（避免引用失效）
    - **拆分步骤 6 → 6/6a/6b/6c**（避免单 commit 混合不同性质清理）：6 删 getSaveableComponents 函数 + 改 3 保存路径 / 6a 删 mergeByIdIntoTree + dirtyConfigKeys + 三方向常量 / 6b 删 skip 机制 + 4 死工具函数 + undo/redo / 6c 删 4 备份文件
    - **完成标准自检**：每步改什么/验证/回退 ✅；阶段 1+2+3 完成标准覆盖 ✅；元计划 §4.1 拆分原则 ✅
    - **7 个增量贡献**列于 §5：drag2layoutBlock mutation / syncLayoutBlockSize2Children 内部 mutation / DropContainer 第 3 路径 / useSaveCompDetailData4Designer 复核 / Immer 9.0.6 确认 / RecursionComponents 假设确认 / toolbar handleClear 顺手清理
    - **暂停等 review**，确认 7 个新增/调整已纳入后进入阶段 5（验证方案）
- 2026-07-27：**阶段 4 第二轮 review 优化完成**。处理两份外部 review 报告共 **36 项反馈**（高优先级 4 项 + 中优先级 17 项 + 低优先级 15 项，去重后）。优化清单：
    - **（高·契约冲突）**：步骤 2 updateFieldConfig 从 O(1) 变 O(n) 与 useFieldConf shallowEqual 订阅粒度冲突——**缓解方案落地**：`buildIndex(components, oldById)` 内部对未变 data 节点复用旧 byId 引用 + 性能验收表 7 项（buildIndex/updateFieldConfig/setComponents/拖拽帧率/缩放帧率/对齐 N=10/对齐 N=440）+ 退化超阈值回退路径（方案 B 批量 setComponents / 方案 C 增量 buildIndex / 回退双源架构）
    - **（高·依赖错）**：步骤 6a 强依赖关系修正为步骤 3+4+6（mergeByIdIntoTree 3 个调用方合计），§2.1 依赖图同步更新
    - **（高·盲区）**：步骤 2 + 步骤 8 冒烟清单新增 layer-manager 6 模块（copy/visible/lock/delete/move/group）+ context-menu 9 操作 + layers-tree + Ctrl+S/Delete 快捷键
    - **（高·数据结构错）**：步骤 2 伪代码 draft.components 是数组，遍历用 currentChildren 而非 node.children（修正后会直接抛 TypeError 的阻断 bug）
    - **（高·验收标准缺失）**：步骤 2 + 步骤 8 性能阈值表 7 项（基线对比 + 退化阈值 + 回退路径）
    - **（高·单源原则风险）**：步骤 4 setState reducer 增加 byId/parentMap 直接赋值防护（console.error + safePayload 过滤）
    - **（高·Immer 语义）**：步骤 2 伪代码 produce 内全部 `return state` 改 `return;`（Immer 惯例）
    - **14 项中优先级**：步骤 5 硬依赖警告 + recalcGroupBounds 注释清理 L299-L348 + 步骤 6a canvas-graph 注释清理 L323-L329 + 步骤 6c 扩展到 src/store/backup/ 4 文件 + 步骤 1a 拆为 4 个独立 commit + 步骤 1a.5 cloneDeep 审计 + 步骤 1a.1 NaN 防护 + 步骤 3 InitDataQuery 冒烟 + 步骤 6/6a 文件路径修正 + 步骤 6 回退依赖说明 + 步骤 7 推荐顺序 + 步骤 8 50fps 阈值依据 + 回退依赖图 §4.1.1 + §1.2 element.tsx:123 表述 + 步骤 5 并发假设 A1/A2
    - **10 项低优先级**：DropContainer L64 → L63 行号修正 + 步骤 7 路径 `src/../design/` → 相对路径 + 步骤 7.9 核查 01-01-widget-types.md + "三方向常量" → "三方向字符串字面量" + 步骤 6 import 顺序标注 + §0 步骤数修正 10→11 + 步骤 -1 commit 信息矛盾修正 + 步骤 1b 与 6b undo/redo 语义关联 + 步骤 2/3/4 revert 冲突警告 + 步骤 2 node.children undefined 防御 + 步骤 2 alignment 性能分析
    - **已知架构债务 §7.1**：setChildren2LayoutBlock 隐式 store 依赖 + recalcGroupBounds 隐式依赖，**不阻塞本次重构**，记录为后续优化项
    - **§0 步骤总数更新**：10→11 主要步骤，20→22 独立 commit 单元（含 1a 拆 5 子步骤 + 7.9 核查）
    - **§4.1.1 新增回退依赖图**：明确 6a 与 3/4/6 的反向回退顺序（步骤 6a → 步骤 6 → 步骤 4 → 步骤 3 → 步骤 5 → 步骤 2 → 步骤 1a/1b）
    - **暂停等第三轮 review**，确认 36 项已逐项处理后进入阶段 5（验证方案）
- 2026-07-27：**阶段 4 临时 review 报告引用清理**。两轮 review 报告（`.local-review/r1.md` + `r2.md`）是临时文件，不应嵌入阶段 4 文档。用 Node.js 脚本批量清理（`.trae/scripts/strip-r1r2-refs.mjs` + `strip-r1r2-task013.mjs`）：
    - 阶段 4 文档 84 处 `r1.x.y` / `r2.x.y` → 0 处
    - task-2026-07-27-001.md 13 处 → 0 处（含 `.local-review/r1.md` / `r2.md` 路径引用 + 阶段 3 旧引用 `r1.4` / `r1.5`）
    - 保留 priority + 描述（高/中/低优先级 + 具体描述），仅删 r1/r2 编号
    - **暂停点**：等用户 review 阶段 4 + 决策 4 项（D1 跳过第三轮 review / D2 推进顺序 / D3 基线测量方式 / D4 buildIndex 签名扩展）
- 2026-07-27：**阶段 5 路径选择**。用户决策：
    - **D1**：跳过第三轮 review（信任已两轮 36 项修复 + r1/r2 引用清理的成果）
    - **D2/D3/D4**：暂缓——先执行"路径 A"准备动作（步骤 -1 + 步骤 0）
    - 用户观点："`.trae/` 文档没有 git 跟踪 → 历史 task-012-4/5/015/016/019 引用都不重要 → 只需把 task-2026-07-27-001 视为今天的主任务即可"
    - 结论：**继续在 task-2026-07-27-001 下推进**，不新建独立 task 文件
- 2026-07-27：**执行步骤 -1：验证 `useSaveCompDetailData4Designer.ts` 非双源**。
    - **Read** [`src/pages/hooks/useSaveCompDetailData4Designer.ts`](../../../../src/pages/hooks/useSaveCompDetailData4Designer.ts)（63 行）
    - 关键证据：
        - L18 `const components = pageConfig.components;` —— 从 `pageInfo.config`（外部 props）读，**不是 Redux state**
        - L30 `const { byId, parentMap } = buildIndex(components);` —— **自建** byId/parentMap，**不是读 Redux state.byId/parentMap**
        - L32 `generatorGroup(components, byId, parentMap, selected, ...)` —— 把自建 byId/parentMap 传给 generatorGroup 作为参数
    - **全仓 Grep `buildIndex(` 验证**：
        - `src/store/modules/designer-canvas.ts:85` —— reducer 内调用（阶段 4 步骤 2/4 改造位置）
        - `src/store/modules/designer-canvas.ts:98` —— reducer 内调用（同上）
        - `src/designer/renderer/utils.ts:784` —— 函数定义（阶段 4 步骤 2 扩展签名）
        - `src/pages/hooks/useSaveCompDetailData4Designer.ts:30` —— 唯一自建 caller（**零改动**）
        - `src/designer/renderer/utils.bak.js:635` —— 备份文件（步骤 6c 删除）
    - **结论**：
        - ✅ `useSaveCompDetailData4Designer.ts` 不是真正的双源消费者
        - ✅ 单源化后 byId 仍是 buildIndex 的派生（仅来源从 Redux state 改为 components tree），函数行为不变
        - ✅ buildIndex 签名扩展 `(components, oldById)` 不影响此处（它接收 components 单参数）
        - ✅ **零改动确认**
    - **额外收获**：
        - `pnpm exec tsc --noEmit` 结果：src/ 0 错误，packages/ui 10 错误（pre-existing，与本 task 无关）
        - 阶段 4 步骤 1a+ 跑通 tsc 的基线已具备（src/ 0 错误）
    - **commit 信息**：无（验证步骤，零改动）
    - **下一步**：执行步骤 0（浏览器性能基线测量，需手动操作）
- 2026-07-27：**步骤 0 准备：性能基线脚本就绪**。
    - 创建 [`perf-baseline.js`](../research/refactor-single-source/perf-baseline.js)（114 行）—— 浏览器 DevTools Console 注入式测量脚本
    - 创建 [`baseline-2026-07-27.md`](../research/refactor-single-source/baseline-2026-07-27.md) 模板 —— 用户填入实测数据
    - 测量覆盖：5 个场景（empty/small/medium/large/xlarge）× 4 个指标（buildIndex/mergeByIdIntoTree/setComponents/updateFieldConfig）+ 4 个对齐规模（N=10/50/220/440）
    - 脚本已用动态 import 适配 Vite/webpack 模块解析（不依赖全局 window 暴露）
    - **等待用户手动执行**：
        1. `pnpm start` 启动 dev server
        2. 打开浏览器到 designer 路由
        3. DevTools Console 粘贴 `perf-baseline.js` 整段执行
        4. 等输出 `[BASELINE DONE]`
        5. 把 console 输出复制到 `baseline-2026-07-27.md` 对应表格
    - 脚本只读不写，**零代码改动风险**
    - **下一步**：等用户实测完成后填入 baseline 数据 → 进入阶段 5 验证方案编写
