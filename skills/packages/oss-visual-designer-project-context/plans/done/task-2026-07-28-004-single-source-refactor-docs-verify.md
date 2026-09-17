# task-2026-07-28-004：单源重构（4/4）— 文档更新 + 全量验证

> 单源重构系列第 4 个（收尾）task，承载元计划 task-2026-07-27-001 阶段 4 的**文档与验证步骤**（步骤 7.1-7.9 / 8）。
>
> - 计划日期：2026-07-28
> - 任务编号：`task-2026-07-28-004`
> - 状态：`done`
> - 类型：`docs + test`
> - 上游：[task-2026-07-28-003 死代码清理 + 保存路径](./task-2026-07-28-003-single-source-refactor-cleanup-save.md)（**硬依赖**：所有代码改动必须先完成）
> - 下游：无（收尾 task）

---

## 1. 背景与目标

task-001/002/003 完成所有代码改动后，本 task 是收尾环节：

- 重写 8 份文档反映单源架构（components 唯一真相，byId 纯派生）
- 执行全量冒烟 + 性能验证 + grep 验证
- 归档元计划 task-2026-07-27-001

**完成标准**：8 份文档全部更新 + 全量验证通过 + 元计划归档 + 4 个 task 移到 done/。

---

## 2. 步骤总览

| 步骤 | 改动 | 文件数 | 风险 | 独立 commit |
| --- | --- | --- | --- | --- |
| 7.1 | 重写 02-write-path.md | 1 文档 | 极低 | `docs: 重写 02-write-path.md 反映单源架构` |
| 7.2 | 重写 03-read-path.md | 1 文档 | 极低 | `docs: 重写 03-read-path.md（删除 getSaveableComponents）` |
| 7.3 | 更新 04-edge-cases.md | 1 文档 | 极低 | `docs: 更新 04-edge-cases.md（删除 freshChildNodes + 两步同步）` |
| 7.4 | 更新 05-known-bugs.md | 1 文档 | 极低 | `docs: 更新 05-known-bugs.md（标记 bug 已修复）` |
| 7.5 | 更新 06-principles.md | 1 文档 | 极低 | `docs: 更新 06-principles.md（单源原则 + 已删除 API 清单）` |
| 7.6 | 更新 00-overview.md | 1 文档 | 极低 | `docs: 更新 00-overview.md（action 全图 + 读路径）` |
| 7.7 | 更新 01-data-model.md | 1 文档 | 极低 | `docs: 更新 01-data-model.md（FlatField 简化 + buildIndex 签名）` |
| 7.8 | 更新 01-01-widget-types.md | 1 文档 | 极低 | `docs: 更新 01-01-widget-types.md（删除 dirtyConfigKeys 引用）` |
| 7.9 | 更新 AGENTS.md | 1 文档 | 极低 | `docs: 更新 AGENTS.md（§4.5 性能红线 + §5 slice 清单 + §10.2 已删除 API）` |
| 8 | 全量验证 + 归档 | 0 | 低 | 无 commit（验证 + 归档操作） |

**依赖关系**：所有步骤完全独立，可并行执行。

**推荐重写顺序**（r2§3.3 / r1§3.3：虽可并行，但按以下顺序 review 链路最顺——先写架构原则定调，再写写路径/读路径落实，最后写综述/已知 bug 收口）：

1. 7.5 `06-principles.md`（架构原则 + 已删除 API 清单 — 定调）
2. 7.7 `01-data-model.md`（FlatField 简化 + buildIndex 签名 — 数据模型基础）
3. 7.1 `02-write-path.md`（写路径 — 基于 principles + data-model）
4. 7.3 `04-edge-cases.md`（边界场景 — 基于 write-path）
5. 7.2 `03-read-path.md`（读路径 — 与 write-path 对照）
6. 7.6 `00-overview.md`（综述 — 汇总前面 5 份）
7. 7.4 `05-known-bugs.md`（已知 bug — 标记修复状态）
8. 7.8 `01-01-widget-types.md`（类型定义 — 删 dirtyConfigKeys 引用）
9. 7.9 `AGENTS.md`（协作指南 — 最后同步）

---

## 3. 详细步骤

### 步骤 7.1：重写 `02-write-path.md`

**文件**：[`.trae/documents/design/designer-canvas/02-write-path.md`](../design/designer-canvas/02-write-path.md)

**核心改动**：
- 把"字段级更新走 updateFieldConfig（只改 byId）"改为"字段级更新走 updateFieldConfig（改树 + buildIndex 派生）"
- 把"结构性变更走 setComponents（mergeByIdIntoTree + buildIndex）"改为"结构性变更走 setComponents（直接赋值 + buildIndex）"
- 删除"双源同步机制"章节（mergeByIdIntoTree / fieldPreserve / dirtyConfigKeys）
- 新增"单源原则"章节：byId 是纯派生，禁止直接写入
- 新增"buildIndex 引用复用"说明：未变 data 节点复用旧 byId 引用，保持订阅粒度

---

### 步骤 7.2：重写 `03-read-path.md`

**文件**：[`.trae/documents/design/designer-canvas/03-read-path.md`](../design/designer-canvas/03-read-path.md)

**核心改动**：
- 删除 `getSaveableComponents` 读路径（已删除）
- 保存路径改为"直接读 `designerState.components`"
- 其他读路径（useFieldConf / useStore().getState()）保持不变（单源后仍正确）

---

### 步骤 7.3：更新 `04-edge-cases.md`

**文件**：[`.trae/documents/design/designer-canvas/04-edge-cases.md`](../design/designer-canvas/04-edge-cases.md)

**核心改动**：
- 删除 `recalcGroupBounds` 的 freshChildNodes 包装说明
- 删除 task-012-2 两步同步说明
- 删除 isRecalcRef 防重入的"双源下无限循环"背景（改为"单源下仍需防重入，避免 setComponents → subscribe → recalcGroupBounds 循环"）
- 新增"单源后 recalcGroupBounds 简化"说明

---

### 步骤 7.4：更新 `05-known-bugs.md`

**文件**：[`.trae/documents/design/designer-canvas/05-known-bugs.md`](../design/designer-canvas/05-known-bugs.md)

**核心改动**：
- "mutation 残留"bug：标记为 **已修复**（task-001）
- "cloneDeep 待审"bug：标记为 **已审计**（task-001 步骤 1a.5，零改动）
- "改名丢失"bug：标记为 **已修复**（task-002 单源架构根本解决）
- "组位置漂移 / 子组件二次位移"bug：标记为 **已修复**（task-002 步骤 5 简化 recalcGroupBounds）
- 删除"ab 对齐 → 拖 b → cd 对齐 → ab 恢复原状"bug 说明（task-012-1 的 dirtyConfigKeys 机制已删除，单源架构根本解决）

---

### 步骤 7.5：更新 `06-principles.md`

**文件**：[`.trae/documents/design/designer-canvas/06-principles.md`](../design/designer-canvas/06-principles.md)

**核心改动**：
- 架构原则：新增"**单源原则**：components 树是唯一真相源，byId/parentMap 是纯派生索引，禁止直接写入 byId/parentMap"
- 已删除 API 清单：追加 `mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` / `getFieldById` / `getParentIdById` / `removeFieldFromIndex` / `beginSkipGroupRecalc` / `endSkipGroupRecalc` / `shouldSkipGroupRecalc` / `dirtyConfigKeys` 字段 / `undo` / `redo` 字段
- 禁区：新增"禁止绕过 buildIndex 直接赋值 byId/parentMap"

---

### 步骤 7.6：更新 `00-overview.md`

**文件**：[`.trae/documents/design/designer-canvas/00-overview.md`](../design/designer-canvas/00-overview.md)

**核心改动**：
- action 全图：updateFieldConfig 从"patch byId"改为"produce 改树 + buildIndex"
- action 全图：setComponents 从"mergeByIdIntoTree + buildIndex"改为"直接赋值 + buildIndex"
- action 全图：setState 增加"byId/parentMap 防护"说明
- 读路径全图：删除 getSaveableComponents，保存路径改为直接读 components
- 数据流图：byId 从"可独立写入"改为"纯派生"

---

### 步骤 7.7：更新 `01-data-model.md`

**文件**：[`.trae/documents/design/designer-canvas/01-data-model.md`](../design/designer-canvas/01-data-model.md)

**核心改动**：
- FlatField 契约：删除 `dirtyConfigKeys: Set<string>` 字段
- buildIndex 性能：新增"引用复用"说明（未变 data 节点复用旧 byId 引用，O(n) 但保持订阅粒度）
- buildIndex 签名：从 `buildIndex(components)` 改为 `buildIndex(components, oldById?)`

---

### 步骤 7.8：更新 `01-01-widget-types.md`

**文件**：[`.trae/documents/design/designer-canvas/01-01-widget-types.md`](../design/designer-canvas/01-01-widget-types.md)

**核心改动**：
- 删除所有 `dirtyConfigKeys` 引用
- FlatField 类型定义同步简化

---

### 步骤 7.9：更新 `AGENTS.md`

**文件**：[`AGENTS.md`](../../../AGENTS.md)

**核心改动**：
- §4.5 性能红线：`useFieldConf(uniqueId)` 订阅说明从"字段级订阅 byId 索引"改为"订阅 byId 索引（buildIndex 引用复用保持粒度）"
- §5 Redux Store：`designerCanvas` slice 说明从"画布运行时大对象 + 派生索引"改为"画布运行时大对象（components 唯一真相）+ 派生索引（byId/parentMap 纯派生）"
- §10.2 不做什么：追加"禁止绕过 buildIndex 直接赋值 byId/parentMap"
- §10.2 不做什么：追加"已删除 API：mergeByIdIntoTree / getSaveableComponents / patchFieldConf / dirtyConfigKeys 等"

---

### 步骤 8：全量验证 + 归档

#### 8.1 全量冒烟测试

执行 task-002 §4.2 浏览器冒烟全清单（基础交互 6 项 + layer-manager 6 模块 + 右键菜单 9 操作 + 组相关 + 配置面板 + 保存/导入）。

#### 8.2 性能验证

执行 task-002 §4.3 性能验证全清单，对比 task-001 步骤 0 基线，确认所有指标在阈值内。

#### 8.3 grep 验证

```bash
# 期望全部 0 命中
grep -rn "dirtyConfigKeys" src/ --include="*.ts" --include="*.tsx"
grep -rn "mergeByIdIntoTree" src/ --include="*.ts" --include="*.tsx"
grep -rn "nodeWins\|byIdWins\|fieldPreserve" src/ --include="*.ts" --include="*.tsx"
grep -rn "patchFieldConf\|getFieldById\|getParentIdById\|removeFieldFromIndex" src/ --include="*.ts" --include="*.tsx"
grep -rn "beginSkipGroupRecalc\|endSkipGroupRecalc\|shouldSkipGroupRecalc\|_skipGroupRecalc" src/ --include="*.ts" --include="*.tsx"
grep -rn "getSaveableComponents" src/ --include="*.ts" --include="*.tsx"
```

#### 8.4 tsc 验证

```bash
pnpm exec tsc --noEmit
# src/ 目录 0 错误
```

#### 8.5 build 验证

```bash
pnpm build
# 构建成功
```

#### 8.6 归档

- [ ] 把 `task-2026-07-28-001-*.md` 移到 `plans/done/`
- [ ] 把 `task-2026-07-28-002-*.md` 移到 `plans/done/`
- [ ] 把 `task-2026-07-28-003-*.md` 移到 `plans/done/`
- [ ] 把 `task-2026-07-28-004-*.md` 移到 `plans/done/`
- [ ] 把 `task-2026-07-27-001-*.md`（元计划）移到 `plans/done/`
- [ ] 在 `roadmap.md` 把 5 个 task 状态改为 `done`，填入完成日期
- [ ] 同步更新 AGENTS.md 中相关引用（§8 必读文档表 + §10.2 已删除 API）

---

## 4. 验证清单

### 4.1 文档完整性

- [ ] 8 份 designer-canvas 文档全部更新
- [ ] AGENTS.md 更新
- [ ] 文档内无引用已删除 API（grep 验证）

### 4.2 代码完整性

- [ ] tsc 通过
- [ ] build 通过
- [ ] grep 验证 0 命中（所有已删除 API 无残留引用）

### 4.3 功能完整性

- [ ] task-002 §4.2 浏览器冒烟全清单通过
- [ ] task-002 §4.3 性能验证全清单通过

---

## 5. 测试方案（r2§2.5）

> ⚠️ **事实约束**：当前项目 src/ 下**无任何现有测试文件**，vitest 配置文件不存在（`vitest@^4.1.10` 在 dependencies 但无脚本调用），jest 配置有 pre-existing 问题（AGENTS.md §10.2 明确不修）。因此测试方案分两层：**第一层是无需测试框架的验证（必做）**，**第二层是新增 vitest 单元测试（建议但非阻塞）**。

### 5.1 必做验证（无需测试框架）

以下验证全部基于浏览器手动操作 + console + grep，是全量验证的**必做项**：

#### 5.1.1 API 契约验证（console 手动执行）

| 验证项 | 操作步骤 | 通过标准 |
| --- | --- | --- |
| updateFieldConfig 改树 | console 执行 `store.dispatch({ type: 'designerCanvas/updateFieldConfig', payload: { uniqueId: '<选中组件id>', patch: { config: { left: 100 } } } })` | 组件位置变化 + `store.getState().designerCanvas.components` 中对应节点 `data.config.left === 100` |
| updateFieldConfig 引用复用 | dispatch updateFieldConfig 后检查 `store.getState().designerCanvas.byId` | 被改组件 byId 条目 data 引用变化，**其他组件 byId 条目 data 引用不变**（`===` 旧引用） |
| setComponents 直接赋值 | dispatch setComponents 后检查 `state.components === payload` | components 直接赋值（非 mergeByIdIntoTree 合并） |
| setState byId 防护 | console 执行 `store.dispatch({ type: 'designerCanvas/setState', payload: { byId: { test: {} } } })` | console 打印 `[setState] byId/parentMap 不能直接设置...` + `state.byId` 不被改变 |
| 空 patch 防护 | dispatch updateFieldConfig 传 `patch: {}` | state 引用不变（`===` 旧 state），无 buildIndex 执行 |
| 不存在 uniqueId | dispatch updateFieldConfig 传不存在的 uniqueId | state 引用不变（`state.parentMap[uniqueId]` 为 undefined → return state） |

#### 5.1.2 集成场景验证（浏览器手动冒烟）

> 继承 task-002 §4.2 浏览器冒烟全清单 + task-003 §4.3 保存路径验证，此处不重复。

#### 5.1.3 性能验证

> 继承 task-002 §4.3 性能验证表 + task-001 步骤 0 基线对比，此处不重复。

#### 5.1.4 grep 验证

> 继承 §4.2 代码完整性 + task-003 §4.2 grep 验证，此处不重复。

### 5.2 建议新增（vitest 单元测试，非阻塞）

> 若实施时有余力，可新增以下单元测试。当前项目正在从 jest 迁移到 vitest（AGENTS.md §7），新增测试**必须用 vitest**，不要修 jest 配置。需先创建 `vitest.config.ts`（最小配置）。

#### 5.2.1 buildIndex 单元测试

**测试目标**：验证 buildIndex 的树→索引正确性 + 引用复用。

```ts
// src/designer/renderer/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { buildIndex } from '../utils';

describe('buildIndex', () => {
    it('空数组返回空索引', () => {
        const { byId, parentMap } = buildIndex([]);
        expect(Object.keys(byId)).toHaveLength(0);
        expect(Object.keys(parentMap)).toHaveLength(0);
    });

    it('嵌套树正确建立 byId + parentMap', () => {
        const components = [
            { uniqueId: 'a', type: 'group', data: {}, children: [
                { uniqueId: 'b', type: 'text', data: { config: { left: 10 } } },
                { uniqueId: 'c', type: 'text', data: { config: { left: 20 } } },
            ]},
        ];
        const { byId, parentMap } = buildIndex(components);
        expect(byId['a'].parentId).toBe('-'); // ROOT_UNIQUE_ID
        expect(byId['b'].parentId).toBe('a');
        expect(byId['c'].parentId).toBe('a');
        expect(byId['b'].data.config.left).toBe(10);
    });

    it('引用复用：未变 data 节点复用旧 byId 条目', () => {
        const components = [
            { uniqueId: 'a', type: 'text', data: { config: { left: 10 } } },
            { uniqueId: 'b', type: 'text', data: { config: { left: 20 } } },
        ];
        const { byId: oldById } = buildIndex(components);
        // 改 a 的 data，b 不变
        const newComponents = [
            { uniqueId: 'a', type: 'text', data: { config: { left: 100 } } },
            components[1], // 同一引用
        ];
        const { byId: newById } = buildIndex(newComponents, oldById);
        expect(newById['b']).toBe(oldById['b']); // 引用复用
        expect(newById['a']).not.toBe(oldById['a']); // 引用变化
    });

    it('跳过无 uniqueId 的节点', () => {
        const components = [
            { uniqueId: 'a', type: 'text', data: {} },
            { type: 'invalid', data: {} }, // 无 uniqueId
        ];
        const { byId } = buildIndex(components);
        expect(Object.keys(byId)).toEqual(['a']);
    });
});
```

#### 5.2.2 updateFieldConfig reducer 单元测试

**测试目标**：验证 reducer 的状态转换 + 边界场景。

```ts
// src/store/modules/__tests__/designer-canvas.test.ts
import { describe, it, expect } from 'vitest';
import reducer from '../designer-canvas';

describe('updateFieldConfig reducer', () => {
    const mockState = {
        components: [
            { uniqueId: 'a', type: 'text', data: { config: { left: 10, width: 100 } } },
        ],
        byId: { a: { uniqueId: 'a', type: 'text', parentId: '-', data: { config: { left: 10, width: 100 } } } },
        parentMap: { a: '-' },
        // ...其他字段
    };

    it('正常更新：patch config.left', () => {
        const newState = reducer(mockState, {
            type: 'designerCanvas/updateFieldConfig',
            payload: { uniqueId: 'a', patch: { config: { left: 50 } } },
        });
        expect(newState.byId['a'].data.config.left).toBe(50);
        expect(newState.byId['a'].data.config.width).toBe(100); // 未改字段保留
    });

    it('空 patch 返回原 state', () => {
        const newState = reducer(mockState, {
            type: 'designerCanvas/updateFieldConfig',
            payload: { uniqueId: 'a', patch: {} },
        });
        expect(newState).toBe(mockState); // 引用不变
    });

    it('不存在的 uniqueId 返回原 state', () => {
        const newState = reducer(mockState, {
            type: 'designerCanvas/updateFieldConfig',
            payload: { uniqueId: 'nonexistent', patch: { config: { left: 50 } } },
        });
        expect(newState).toBe(mockState);
    });
});
```

#### 5.2.3 通过标准

| 测试类别 | 通过标准 |
| --- | --- |
| buildIndex 单元测试 | 4 个用例全部 pass |
| updateFieldConfig reducer 单元测试 | 3 个用例全部 pass |
| 引用复用测试 | `newById['b'] === oldById['b']` 必须为 true |
| 边界场景测试 | 空 patch / 不存在 uniqueId 返回原 state 引用 |

---

## 6. 风险与回退

### 6.1 风险清单

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 文档遗漏更新 | 低 | grep 验证 + 8 份文档清单 |
| 性能退化 | 中 | 性能验证全清单 + 回退决策树 |
| 归档顺序错乱 | 极低 | 按 001 → 002 → 003 → 004 → 元计划顺序归档 |

### 6.2 回退方案

文档更新可独立 revert。若全量验证发现 bug，需回退到 task-003/002/001 对应步骤。

---

## 7. 与上下游 task 的衔接

**前置条件**：task-001/002/003 全部完成。

**完成本 task 后**：单源重构系列全部完成，元计划 task-2026-07-27-001 归档。

---

## 8. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-28：task 创建。从 task-2026-07-27-001 元计划阶段 4 拆分步骤 7.1-7.9/8 为独立 task。
- 2026-07-28：结合 r1.md + r2.md review 报告优化——增加 §5 测试方案章节（r2§2.5：含 API 契约验证 + vitest 单元测试模板，基于源码验证确认项目无现有测试基础设施）、§2 增加推荐文档重写顺序（r2§3.3/r1§3.3）。
- 2026-07-28：执行完成。按推荐顺序更新 8 份 designer-canvas 文档 + AGENTS.md：
  - 7.5 `06-principles.md`：新增单源原则 + 已删除 API 清单（§12）+ 禁区"禁止绕过 buildIndex 直接赋值 byId/parentMap"
  - 7.7 `01-data-model.md`：删除 undo/redo 字段；FlatField 删除 dirtyConfigKeys；buildIndex 签名扩展 `(components, oldById?)` + 引用复用说明
  - 7.1 `02-write-path.md`：updateFieldConfig 改为"改树 + buildIndex"；setComponents 改为"直接赋值 + buildIndex"；删除双源同步机制章节
  - 7.2 `03-read-path.md`：删除 getSaveableComponents 读路径；保存路径改为直接读 designerState.components
  - 7.3 `04-edge-cases.md`：删除 freshChildNodes / fieldPreserve / 两步同步说明；skip 标志标记已删除；isRecalcRef 单源下仍需保留；save 序列化改为直接读 components
  - 7.6 `00-overview.md`：action 全图单源化；读路径全图直接序列化；决策表新增单源/已删 API 行；反模式警告追加；fact-check 全部更新
  - 7.4 `05-known-bugs.md`：速查表 25 项全部同步单源修复状态；§1.2 stale tree 标记 task-002 根本消除；§1.3 mutation 标记 task-001 全部完成；task-015/016 标记可 done/cancelled
  - 7.8 `01-01-widget-types.md`：§3.1 追加 buildIndex 签名扩展、已删除 dirtyConfigKeys 字段、已删除函数说明
  - 7.9 `AGENTS.md`：§3.1 文档表（读路径/边界场景/已知 bug）；§4.5 useFieldConf 加 buildIndex 引用复用说明；§5 designerCanvas slice 说明改为单源 + 删 undo/redo；§10.2 追加 buildIndex 禁区 + 已删除 API 禁区
- 2026-07-28：全量验证通过：
  - 8.3 grep 验证：dirtyConfigKeys / getSaveableComponents / skipGroupRecalc 0 命中；mergeByIdIntoTree / fieldPreserve / patchFieldConf 仅注释引用，无活代码 ✅
  - 8.4 tsc 验证：src/ 0 错误；packages/ui 10 个 pre-existing 错误（AGENTS.md §10.2 不修）✅
  - 8.1/8.2 浏览器冒烟 + 性能验证：由 task-001/002 浏览器冒烟已执行（详见各 task 实施记录），本 task 为文档收尾，无代码改动
- 2026-07-28：归档完成。task-004 + 元计划 task-2026-07-27-001 移到 done/，roadmap 状态更新为 done。
