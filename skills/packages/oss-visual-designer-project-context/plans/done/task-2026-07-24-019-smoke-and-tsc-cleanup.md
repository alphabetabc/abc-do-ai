# 冒烟测试集中执行 + tsc pre-existing 错误修复 + 引入 vitest + task-010 单测补全

> 计划日期：2026-07-24任务编号：`task-2026-07-24-019` 上游任务：
>
> - [task-2026-07-21-010-layer-manager-utils-immutable](./done/task-2026-07-21-010-layer-manager-utils-immutable.md)（不可变改造代码已 done，但冒烟与单测未执行）
> - [task-2026-07-21-012-utils-cleanup-onvaluechange](./done/task-2026-07-21-012-utils-cleanup-onvaluechange.md)（done，本任务可并行推进）
> - [task-2026-07-21-011-fix-review-issues](./done/task-2026-07-21-011-fix-review-issues.md)（done，tsc 实跑 + 冒烟 + 440 组件 Profiler 验证移交本任务）状态：`done`（2026-07-28，已拆分替代）类型：`test` + `bugfix`

> **⚠️ 本任务已被拆分替代**：
> - **引入 vitest 配置**（§2.2）由 [task-2026-07-29-001-vitest-unit-reducer-single-source](../task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接
> - **task-010 单测补全**（§2.3）—— task-010 已 done，原始目标不再适用
> - **tsc 错误修复**（§2.1）、**浏览器冒烟**（§2.4）、**task-011-fix 验证**（§2.5）、**task-010 文档同步**（§2.6）由其他未来任务承接
>
> 本任务状态标记为 `done` 以表达"目标已被拆分处理"，剩余部分由独立任务按需启动。
>
> **风险等级：中（tsc 错误修复仅限主目录 src/ 下的 pre-existing 问题，packages/\* 不在本次修复范围；jest 不修，改为引入 vitest）**

---

## 1. 背景

task-010（layer-manager + utils 不可变改造）已标记 `done`，代码改造完成，但 §5 验证清单有 3 项遗留：

1. **未新增单元测试**（`src/designer/__tests__/layer-manager-immutable.test.ts`）
2. **未跑 `pnpm test`**
3. **未执行浏览器冒烟清单**（仅做了手动代码审阅）

理由是项目 jest 配置存在多个 pre-existing 问题（`testRunner` 写死 Mac 本地路径 `/Users/lizixin/...`、`oss-ui/lib/index.js` 缺失、`@fedx-vis/utils` ESM 解析失败），且当时未启动 `pnpm start` 验证。**jest 配置问题不修复，改为引入 vitest 替代**（vitest 原生支持 ESM / TypeScript，无需 babel-jest 转译，配置更轻量）。本任务把这 3 项遗留 + 主目录 `src/` 下的 tsc pre-existing 错误 + 引入 vitest 一并处理。

**范围边界（重要）**：

- ✅ 仅修复主目录 `src/` 下的 tsc pre-existing 错误
- ❌ `packages/*` 下的 tsc 错误（`packages/ui/src/material-selector/*`）**不在本次修复范围**，属子包维护范畴，不在主仓 tsc 修复责任内
- ❌ 其他与 task-010 不可变改造、task-011 review 修复不相干的 tsc 问题一概不修
- ❌ **不修复 jest 配置**（`testRunner` Mac 路径 / `oss-ui/lib` / `@fedx-vis/utils` ESM 等问题一律不修），改为引入 vitest 作为新测试 runner

**当前 tsc 错误清单（全部 pre-existing）**：

| 文件 | 行 | 错误码 | 说明 | 是否修复 |
| --- | --- | --- | --- | --- |
| `packages/ui/src/material-selector/index.tsx` | 142 | TS2339 | `sortTypes` 不在 `packages/share/build/deps/enums` 导出中 | ❌ 不修（packages/\*） |
| `packages/ui/src/material-selector/index.tsx` | 235, 244, 254, 262, 297, 298 | TS18047 | `requestRef.current` possibly null | ❌ 不修（packages/\*） |
| `packages/ui/src/material-selector/index.tsx` | 348 | TS2339 | 同 L142 | ❌ 不修（packages/\*） |
| `packages/ui/src/material-selector/LazyImageLoader.tsx` | 11, 12 | TS18047 | `latest.current` possibly null | ❌ 不修（packages/\*） |
| `src/designer/common/dnd/helper.ts` | 37, 46 | TS18047 | `layoutBlock` / `groupField4BusinessCustom` possibly null | ✅ 修复 |
| `src/designer/renderer/designer-field/utils.ts` | 167, 168 | TS18048 | `resizeFields` possibly undefined | ✅ 修复 |

**本任务目标**：

1. 修复 `src/` 下的 4 个 tsc 错误（`packages/*` 不修），使主目录 tsc 错误清零
2. 引入 vitest 替代 jest（不修 jest 配置，新增 vitest 配置 + `pnpm test` 脚本切换到 vitest）
3. 补全 task-010 §5 验证清单中 12 个不可变改造断言（基于 vitest 编写）
4. 执行 task-010 §4 步骤 7 的浏览器冒烟清单
5. 把 task-010 验证清单中的 `[ ]` 全部补齐或标注迁移到本任务

---

## 2. 目标

### 2.1 tsc 错误修复

> 仅修复主目录 `src/` 下的 pre-existing 错误，`packages/*` 不修（见 §1 范围边界）。

- [ ] `src/designer/common/dnd/helper.ts` L37/46：`layoutBlock` / `groupField4BusinessCustom` 加 null 守卫
- [ ] `src/designer/renderer/designer-field/utils.ts` L167/168：`resizeFields` 加 undefined 守卫
- [ ] `pnpm tsc --noEmit` 主目录 `src/` 相关错误清零（`packages/*` 错误可忽略）

### 2.2 引入 vitest 替代 jest

> 不修复 jest 配置（`testRunner` Mac 路径 / `oss-ui/lib` / `@fedx-vis/utils` ESM 等问题一律不修），改为引入 vitest。

- [ ] 安装 `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom`（如已装 testing-library 则复用）
- [ ] 新增 `vitest.config.ts`（或合并到 `vite.config.ts`），配置：
    - `test.environment: 'jsdom'`
    - `test.globals: true`（支持 `describe` / `it` / `expect` 全局，兼容现有测试写法）
    - `test.setupFiles: ['./src/setupTests.js']`（复用现有 setup）
    - `test.include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/**/__tests__/**/*.{js,jsx,ts,tsx}']`
    - `resolve.alias`：与 webpack/tsconfig 对齐（`@Src/` → `src/`、`@fedx-vis/*` → `packages/*`、`@Common/` → `src/common/`）
- [ ] `package.json` 的 `scripts.test` 改为 `vitest run`（保留原 jest 配置块不动，仅切脚本）
- [ ] `pnpm test` 能启动 vitest runner 并发现测试文件
- [ ] 既有测试文件（若有）能在 vitest 下运行（不要求全绿，但要求能跑起来）

### 2.3 task-010 单测补全（基于 vitest）

- [ ] 新增 `src/designer/__tests__/layer-manager-immutable.test.ts`
- [ ] 覆盖 task-010 §4 步骤 5 的 12 个断言用例：
    1. `moveToTop` 后 `finalData !== state.components`
    2. `moveToTop` 后未改兄弟节点引用保持
    3. `moveToTop` 后被移动节点引用变化
    4. `moveToBottom` 对称断言
    5. `moveIndexToUp` 交换相邻两个
    6. `orderBy` 不改原数组
    7. `deleteFieldByUniqueId` 移除中间节点
    8. `deleteFieldByUniqueId` 仅 1 个节点返回 `ROOT_UNIQUE_ID`
    9. `splitGroup` 后 children 数量正确
    10. `generatorGroup` 构造 group 节点
    11. `getFieldOrderBy` 返回与入参同引用
    12. `flatDesignerList` 不再 cloneDeep 节点
- [ ] `pnpm test src/designer/__tests__/layer-manager-immutable` 全部通过

### 2.4 浏览器冒烟（task-010 §4 步骤 7 迁移）

启动 `pnpm start`，按以下清单逐项验证（每项打勾或记录问题）：

- [x] 单选拖拽（position onChange）
- [x] 多选拖拽（drag group with siblings）—— **重点验证 task-010 §3.8 的改写**
- [x] 鼠标拖拽期间不掉帧（DevTools Profiler 看 render 次数）
- [x] 图层"置顶 / 置底 / 上移 / 下移"
- [x] "成组 / 拆组"
- [x] "删除"组件
- [x] "复制"组件
- [x] "锁定 / 解锁"
- [x] "隐藏 / 显示"
- [x] 配置面板 onChange（拖动 slider、输入数字）
- [x] 保存场景 → 后端拿到的 config 与改动一致
- [ ] 440 组件场景性能验证（加载大屏配置，观察拖拽/选中响应时间）

### 2.5 task-011-fix 验证项承接

task-011-fix（done）把以下验证项移交本任务：

- [ ] `pnpm tsc --noEmit` 无新增错误（task-011-fix 改动：toolbar/index.js 加 `useMemo` + `shallowEqual`、hooks.ts 加注释，预期零新增；`packages/*` pre-existing 错误不计）
- [ ] 手动验证：点"生成模板"按钮 → `ModalSaveAsTemp` 弹框正常渲染（task-011-fix high bug 修复项）
- [ ] 440 组件场景 Profiler 验证（已在 §2.4 覆盖）
- [ ] 右键菜单复制/粘贴/删除正常（task-011-3 review 确认 latestCache 同步，需运行时验证）

### 2.6 task-010 文档同步

- [ ] 在 `done/task-2026-07-21-010-layer-manager-utils-immutable.md` §5 验证清单中，把 3 个 `[ ]` 项标注"已迁移到 task-019"

---

## 3. 关键设计决策

### 3.1 tsc 错误修复策略

- **null/undefined 守卫**：优先用 `if (ref.current)` 早返回 + 可选链 `?.`，不引入非空断言 `!`（除非上下文 100% 确定）
- **不改业务逻辑**：只修类型守卫，不动运行时行为
- **范围限定**：仅修 `src/` 下 2 个文件 4 处错误；`packages/ui/src/material-selector/*` 的 10 处错误不修（子包维护范畴，与主仓 task 无关）

### 3.2 引入 vitest 策略（不修 jest）

- **为什么不修 jest**：jest 配置内嵌 `package.json`，`testRunner` 写死 Mac 本地路径 `/Users/lizixin/oss-cli-template/node_modules/jest-circus/runner.js`，换机即失效；`oss-ui/lib/index.js` 缺失、`@fedx-vis/utils` ESM 解析失败需调 `transformIgnorePatterns`，修复成本高且 jest 26 对 ESM 支持差
- **vitest 优势**：原生支持 ESM / TypeScript（无需 babel-jest）、配置极简（一个 `vitest.config.ts`）、与 vite 生态对齐、API 与 jest 兼容（`describe` / `it` / `expect` / `vi.fn`）
- **保留 jest 配置块**：`package.json` 中的 `jest` 字段不删除（避免破坏其他可能依赖的脚本），仅把 `scripts.test` 切到 `vitest run`
- **路径别名**：vitest 的 `resolve.alias` 需与 `tsconfig.json` / webpack 对齐（`@Src/`、`@fedx-vis/*`、`@Common/`），否则测试文件 import 失败
- **jsdom**：用 `jsdom` 环境跑 DOM 相关测试（如 `@testing-library/react`），纯逻辑测试可不指定

### 3.3 单测 fixture 设计

构造 3 层深的 components 树（10 节点左右），fixture 函数每次返回新对象（避免测试间状态污染）：

```ts
const buildFixture = () => [
    {
        uniqueId: 'root',
        type: 'page',
        children: [
            { uniqueId: 'a', type: 'field', data: { config: { left: 0, top: 0 } } },
            { uniqueId: 'b', type: 'field', data: { config: { left: 100, top: 0 } } },
            { uniqueId: 'c', type: 'field', data: { config: { left: 200, top: 0 } } },
            { uniqueId: 'd', type: 'field', data: { config: { left: 300, top: 0 } } },
        ],
    },
];
```

### 3.4 浏览器冒烟不做自动化

理由：项目无 e2e 框架（无 Playwright / Cypress），引入成本高；冒烟清单靠人工执行即可，本任务不扩展自动化覆盖范围。

---

## 4. 详细步骤

### 步骤 1：tsc 错误修复（§2.1）

按文件逐个修，每个文件修完跑一次 `pnpm tsc --noEmit` 确认错误数下降。全部修完后跑 `pnpm build` 确认无 runtime 回归。

### 步骤 2：引入 vitest（§2.2）

1. `pnpm add -D vitest jsdom`（`@testing-library/react` / `@testing-library/jest-dom` 已在 devDependencies，无需重装）
2. 新增 `vitest.config.ts`，配置 `test.environment` / `test.globals` / `test.setupFiles` / `test.include` / `resolve.alias`
3. `package.json` 的 `scripts.test` 改为 `vitest run`
4. 跑 `pnpm test` 确认 vitest runner 能启动并发现测试文件

### 步骤 3：补写单测（§2.3）

按 task-010 §4 步骤 5 的 12 个断言逐个写（用 vitest API），写完跑 `pnpm test src/designer/__tests__/layer-manager-immutable`。

### 步骤 4：浏览器冒烟（§2.4）

启动 `pnpm start`，按清单逐项验证，问题记录到本任务 §5 实施记录。

### 步骤 5：task-010 文档同步（§2.5）

修改 `done/task-2026-07-21-010-layer-manager-utils-immutable.md` §5，把 3 个 `[ ]` 标注"已迁移到 task-019"。

### 步骤 6：收尾

- 本任务文件移到 `plans/done/`
- roadmap.md 状态改为 `done`

---

## 5. 验证清单

- [ ] `pnpm tsc --noEmit` 主目录 `src/` 相关错误清零（`packages/*` pre-existing 错误不修，不在验收范围）
- [ ] `pnpm test` 能启动 vitest runner（不要求全绿，但要求能跑起来）
- [ ] `pnpm test src/designer/__tests__/layer-manager-immutable` 全部通过
- [ ] `pnpm start` 能正常启动
- [ ] 浏览器冒烟清单（§2.4）全部通过或问题已记录
- [ ] task-010 §5 验证清单 3 个 `[ ]` 标注迁移
- [ ] roadmap.md 状态更新
- [ ] 任务文件移到 `plans/done/`

---

## 6. 风险与回退

### 风险点

| 风险                               | 概率 | 影响                     | 缓解                                                                   |
| ---------------------------------- | ---- | ------------------------ | ---------------------------------------------------------------------- |
| tsc 修复改坏 runtime 行为          | 中   | 浏览器冒烟时暴露         | 每个 fix commit 单独验证；`pnpm build` 通过后再推进                    |
| vitest 配置与 webpack 路径别名不一致 | 中   | 测试文件 import 失败     | `resolve.alias` 严格对齐 `tsconfig.json` / webpack 配置                 |
| 单测断言设计错误（误判不可变）     | 中   | 给 task-010 虚假安全感   | 断言要覆盖"顶层引用变化 + 未改兄弟引用保持 + 被改节点引用变化"三个维度 |
| 浏览器冒烟发现 task-010 改造的 bug | 中   | 需回退或补丁             | 记录到 §7 实施记录，必要时开新 task 修复                               |

### 回退方案

- 每个 tsc fix 独立 commit，出问题 `git revert` 单个 commit
- vitest 配置 + `package.json` 脚本改动独立 commit
- 单测文件独立 commit
- 浏览器冒烟发现问题不自动修复，记录后由用户决策是否开新 task

---

## 7. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-24：任务创建（task-019，原 task-013），状态 `planning`，承接 task-010 遗留的冒烟与单测 + 当前 tsc pre-existing 错误修复
- 2026-07-24：范围调整——按用户要求，`packages/*` 下的 tsc 错误（`packages/ui/src/material-selector/*` 共 10 处）不修，仅修主目录 `src/` 下 4 处；其他与 task-010/011 不相干的 tsc 问题一概不修。AGENTS.md 同步补充该边界说明
- 2026-07-24：范围调整——按用户要求，jest 配置不修复（`testRunner` Mac 路径 / `oss-ui/lib` / `@fedx-vis/utils` ESM 等问题一律不修），改为引入 vitest 替代。§2.2 / §3.2 / §4 步骤 2 / §5 / §6 同步更新
- 2026-07-24：编号调整——原 task-013 降级优先级（排在 task-014/015/016 之后执行），重编号为 task-019。理由：本任务是验证性任务（冒烟 + 单测 + tsc + vitest 引入），无功能 bug；冒烟清单可在 task-014/015/016 修完后一起验证，避免重复
- **2026-07-28：状态变更 `planning` → `done`（被拆分替代）**。原因：单源重构（task-2026-07-28-001/002/003）完成后，task-010 不可变改造的相关验证项已通过 task-001/002 实施中的浏览器冒烟覆盖，且 task-019 6 部分目标分散，按需拆分：
    - **引入 vitest 配置**（§2.2）由 [task-2026-07-29-001-vitest-unit-reducer-single-source](../task-2026-07-29-001-vitest-unit-reducer-single-source.md) 承接（合并原 task-012-4/012-5 重写）
    - **task-010 单测补全**（§2.3）—— task-010 已 done 且实施中冒烟已通过，原始目标不再适用
    - **tsc 错误修复**（§2.1）、**浏览器冒烟**（§2.4）、**task-011-fix 验证**（§2.5）、**task-010 文档同步**（§2.6）—— 分散到未来独立任务按需启动（如有需要）
