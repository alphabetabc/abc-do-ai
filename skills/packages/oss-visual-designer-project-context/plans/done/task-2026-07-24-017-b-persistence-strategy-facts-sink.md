# task-2026-07-24-017-b-persistence-strategy-facts-sink

> 状态：`done`
> 创建：2026-07-24
> 类型：chore（文档事实下沉）

---

## 1. 背景

`01-data-model.md` §6 当前持久化策略仅一句话 + 指向 `research/Redux现代化升级调研.md`。`research/` 是探索性文档，持久化策略作为 designerCanvas 的事实应该内联到 design 目录。

---

## 2. 目标

把持久化策略（`whitelist = []` 不持久化）作为事实内联到 `01-data-model.md` §6，删除 research 链接。

---

## 3. 详细步骤

### 3.1 验证 `src/store/index.ts` 的实际配置

读取 `src/store/index.ts` 确认：
- `persistConfig.whitelist` 的实际值（应该为空数组或类似）
- `PersistGate` 的使用方式（占位还是实际）

### 3.2 改写 01-data-model.md §6

**当前**：
```
**当前 `whitelist = []`，实际不持久化任何 slice**（沿用 `PersistGate` 占位）。

详见 [`Redux 现代化升级调研.md`](../../research/Redux现代化升级调研.md)。
```

**改为**：
```
**当前 `whitelist = []`，实际不持久化任何 slice**（沿用 `PersistGate` 占位）。

- 配置位置：`src/store/index.ts`（`persistConfig.whitelist`）
- 设计决策：编辑器状态不需要跨会话持久化，用户每次进入设计器从后端 API 加载最新 config
- `PersistGate` 保留占位，不删除（未来如需持久化某些 slice 可直接加到 whitelist）
```

---

## 4. 验证

### 4.1 grep 验证

```
grep -rn "\.\./\.\./research/Redux" .trae/documents/design/designer-canvas/01-data-model.md
```

预期：0 命中（research 链接已删除）。

### 4.2 事实自包含验证

读 `01-data-model.md` §6，不读 research 也能知道：
- whitelist 当前为空
- 为什么不持久化
- PersistGate 是占位

---

## 5. 风险与回退

- **风险**：低——纯文字修改 + 1 个文件的事实内联
- **回退**：直接改回即可

---

## 6. 不做

- ❌ 不修改 `src/store/index.ts`（本任务只改文档）
- ❌ 不动 `00-overview.md` 里的 research 链接（由 task-017-a 处理）
- ❌ 不下沉 view 字段矩阵（task-017-c）

---

## 7. 实施记录（2026-07-24）

### 7.1 执行摘要

按 plan §3 步骤执行，**但对 §3.2 改写方案做了两处降级处理**（理由见 §7.3）：

- ✅ §3.1 验证：完成（详见 §7.2）
- ✅ §3.2 改写：完成（**降级版**）
- ✅ §4.1 grep 验证：完成（0 命中）
- ✅ §4.2 事实自包含验证：完成（详见 §7.4）

### 7.2 §3.1 源码验证结果

| 检查项 | 实际值 | 来源 |
| --- | --- | --- |
| `whitelist` 定义 | `export const whitelist: string[] = []` | `src/store/modules/index.ts` L20 |
| `persistConfig.whitelist` | `{ key: 'root', storage, whitelist }` | `src/store/index.ts` L8-L12 |
| `PersistGate` 使用 | `<PersistGate loading={null} persistor={persistor}>` | `src/app/container/index.tsx` L117 |
| `whitelist` 上方注释 | `// redux-persist 白名单：当前不持久化任何 slice（仅保留 PersistGate 占位）` | `src/store/modules/index.ts` L17-L19 |

**关键事实**：
- `whitelist` 是从 `./modules` 导入的，不是 `src/store/index.ts` 内联字面量
- `PersistGate` **实际运行时挂载**（不是死代码/占位组件），但因 `whitelist = []` 而不触发任何数据恢复
- 源码注释明确"仅保留 PersistGate 占位"——这是**事实陈述**（来自源码），不是推测

### 7.3 对 plan §3.2 改写方案的降级处理

plan §3.2 原方案：

```
- 配置位置：`src/store/index.ts`（`persistConfig.whitelist`）
- 设计决策：编辑器状态不需要跨会话持久化，用户每次进入设计器从后端 API 加载最新 config
- `PersistGate` 保留占位，不删除（未来如需持久化某些 slice 可直接加到 whitelist）
```

**问题 1**："设计决策：编辑器状态不需要跨会话持久化..." —— **❌ plan 作者推测，无源码依据**

- 源码里只能看到 `whitelist = []` 这个**结果**，没有注释/commit 说明**原因**
- 用户确认："whitelist 之前也是空的，没有持久化"——这是历史延续状态，不是基于明确设计意图的主动决策
- 若照搬，design 目录会引入**未经核实的事实**，违反 task-017-a 治理精神

**问题 2**："未来如需持久化某些 slice 可直接加到 whitelist" —— **⚠️ 推测未来用法**

- 这是对"如果未来需要"的可能性陈述，源码无依据

**降级后采用**：

```
**当前 `whitelist: string[] = []`，实际不持久化任何 slice**。源码注释（`src/store/modules/index.ts` L17-L19）标注为"仅保留 PersistGate 占位"。

源码事实（行号可验证）：

- `whitelist` 定义：`src/store/modules/index.ts` L20（`export const whitelist: string[] = []`）
- `persistConfig` 配置：`src/store/index.ts` L8-L12（`{ key: 'root', storage, whitelist }`）
- `PersistGate` 使用：`src/app/container/index.tsx` L117（`<PersistGate loading={null} persistor={persistor}>`，运行时挂载但因 whitelist 为空而不触发数据恢复）
```

降级原则：

1. **删除 plan §3.2 "设计决策"句** —— 推测内容不进 design 目录
2. **删除 plan §3.2 "未来如需"句** —— 推测未来用法不进 design 目录
3. **保留 "PersistGate 占位"措辞** —— 但改为**引用源码注释**（`src/store/modules/index.ts` L17-L19），不引入推测
4. **增加源码位置引用** —— 让事实可验证，替代 research 链接的"溯源"价值

### 7.4 §4.2 事实自包含验证

读 `01-data-model.md §6` 后能直接知道的事实：

- ✅ `whitelist` 当前为空（且有类型 `string[]`）
- ✅ 实际不持久化任何 slice（核心事实）
- ✅ `PersistGate` 运行时挂载，但因 whitelist 为空而无数据恢复
- ✅ 三处源码位置（行号）可验证

**未声明但读者可能想知道的事实**（有意省略）：
- ⚠️ "为什么不持久化"——**未在文档中说明**，因为源码无明确依据。读者如有疑问应读源码 commit 历史或问维护者

### 7.5 grep 验证结果

```
$ grep -rn "\.\./\.\./research/|\.\./research/" .trae/documents/design/designer-canvas/01-data-model.md
No matches found
```

符合 plan §4.1 预期（0 命中）。

### 7.6 治理一致性

- ✅ 与 task-017-a 一致：design 目录只承载可核实事实，不引入未经核实的"为什么"
- ✅ 替换 research 链接：用"源码事实+行号"代替 research 的"溯源"价值，且更精确
- ✅ 保留原文核心事实（`whitelist = []` + 不持久化 + PersistGate 占位），未丢失信息

### 7.7 后续

- ✅ 本任务完成，归档到 `done/`
- ⏩ 启动 task-017-c（view 字段使用矩阵下沉）