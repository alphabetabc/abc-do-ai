# task-2026-07-31-004 — designer-core 代码质量小改

> 状态：`done`
> 类型：`refactor`
> 优先级：**低**
> 创建日期：2026-07-31
> 完成日期：2026-07-31
> 前置：task-2026-07-31-001（已完成）

---

## 1. 背景

task-2026-07-31-001 修复了 B1-B8 核心问题，但 review 报告（r2/r4）指出的若干代码质量小改项未覆盖。本 task 处理低风险代码整洁度改进，不改变行为。

---

## 2. 需修复的问题

| # | 问题 | 位置 | 来源 |
|---|---|---|---|
| C1 | `buildIndex` 中 `as TFlat` 类型断言绕过 TS 检查 | `buildIndex.ts` L50 | r4 §3.2 建议 2 |
| C2 | 错误日志级别不统一（深度超限用 console.error 建议改 warn；插件 ctx 未绑定时静默失败建议 warn） | `write-paths.ts` L48 / `createRuntimeDataPlugin.ts` | r4 §5.4 |
| C3 | `cleanup` 顺序与 init 顺序相同，通常应为先进先出反序 | `createTreeStore.ts` L234-239 | r4 §2.5 观察 3 |
| C4 | `updateNodeImmutable` 作为公共 API 导出，扩大 API 表面积 | `index.ts` L50 / `write-paths.ts` | r2 §3.2 |

---

## 3. 实施步骤

### 步骤 1：修复 buildIndex 的 as TFlat 类型断言（C1）

**问题**：`buildIndex.ts` L50 `{ ... } as TFlat` 绕过 TS 检查。

**修复**：改为显式构造，让 FlatNode 类型自然推导。需评估是否能去掉 `as TFlat`——FlatNode 是 interface，对象字面量赋值给 `Record<string, TFlat>` 时 TS 会检查结构，`as TFlat` 可能是必要的类型窄化。若无法去掉，改为 `as unknown as TFlat` 并加注释说明原因。

### 步骤 2：统一错误日志级别（C2）

**问题**：
- `write-paths.ts` L48 深度超限用 `console.error`，但这是降级而非错误，建议 `console.warn`
- `createRuntimeDataPlugin.ts` 多处 `if (!ctx) return;` 静默失败，建议 `console.warn`

**修复**：
- L48 改为 `console.warn`
- `createRuntimeDataPlugin.ts` 的 `if (!ctx) return;` 加 `console.warn('[runtimeDataPlugin] ctx 未绑定，操作已跳过')`

### 步骤 3：cleanup 改为反序执行（C3）

**问题**：`createTreeStore.ts` L234-239 destroy 时 cleanup 按注册顺序执行，惯例应为先进先出反序。

**修复**：destroy 时 `[...cleanups].reverse().forEach(fn => fn())`。

### 步骤 4：决策 updateNodeImmutable 导出（C4）

**问题**：`updateNodeImmutable` 是内部辅助函数，但通过 `index.ts` L50 作为公共 API 导出，设计文档未定义。

**决策**：评估是否有外部调用方。若无外部调用，从 `index.ts` 删除导出（降为内部函数）；若有或未来需要，在文档补充定义。

**验证**：Grep `updateNodeImmutable` 确认调用方。

---

## 4. 验证

- [x] `pnpm test`：82 测试全绿
- [x] `pnpm typecheck`：0 错误
- [x] `pnpm build`：成功（dist/index.js 16.97 kB）

---

## 7. 实施记录

| 步骤 | 文件 | 改动 |
|---|---|---|
| C1 | `buildIndex.ts` L50 | `as TFlat` → `as unknown as TFlat` + 注释说明类型窄化原因 |
| C2 | `write-paths.ts` L48 | `console.error` → `console.warn`（深度超限是降级而非错误） |
| C2 | `createRuntimeDataPlugin.ts` L92/L106/L121/L132/L142 | 5 处 `if (!ctx) return;` 加 `console.warn('[runtimeDataPlugin] ctx 未绑定，操作已跳过')` |
| C3 | `createTreeStore.ts` L228-232 | cleanup 改为 `[...cleanups].reverse().forEach(fn => fn())`（先进先出反序） |
| C4 | `index.ts` L49-50 | 删除 `updateNodeImmutable` 公共导出（降为内部函数，无外部调用方） |
| C2 同步 | `write-paths.test.ts` L207 | 测试 `console.error` spy → `console.warn` spy（对齐 C2 改动） |

### C4 决策依据

Grep `updateNodeImmutable` 确认调用方：
- `createTreeStore.ts` 内部 import（保留）
- `write-paths.test.ts` 动态 `import('../write-paths')`（从源文件直接导入，不受 index.ts 导出删除影响）
- 无外部业务代码调用

结论：删除公共导出安全，降为内部函数。设计文档未定义此 API，不应扩大公共 API 表面积。

---

## 5. 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| C1 去掉 as TFlat 导致类型推断失败 | 中 | 低 | typecheck 验证 |
| C3 cleanup 反序改变行为 | 低 | 低 | 插件 cleanup 应无顺序依赖，测试验证 |
| C4 删除 updateNodeImmutable 导出破坏外部调用 | 低 | 低 | 框架尚未被外部使用 |

---

## 6. 不做的事

- 不改插件 cleanup 的实现逻辑（只改执行顺序）
- 不改 buildIndex 的引用复用算法（只改类型断言写法）
