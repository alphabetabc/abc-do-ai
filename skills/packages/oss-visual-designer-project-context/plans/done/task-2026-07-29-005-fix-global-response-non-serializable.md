# task-2026-07-29-005：修复 globalResponse 存入 Error 实例导致 Redux serializableCheck 告警

> 修复 Redux state 中 `component.globalResponse` 存入不可序列化的 Error 类实例问题
>
> 计划日期：2026-07-29
> 任务编号：`task-2026-07-29-005`
> 状态：`done`
> 类型：`bugfix`
> 来源：task-2026-07-28-007 排查 `app.designerType` Symbol 问题时附带发现

---

## 1. 背景

### 1.1 现象

Redux DevTools / RTK `serializableCheck` 中间件告警：

```
A non-serializable value was detected in the state, in the path: `component.globalResponse.<operationId>.error`
```

### 1.2 根因

[`GlobalDataFetcher.ts`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L105-L112) 的 `fetcher.onChange` 回调把 `response` 整体 dispatch 到 store：

```ts
fetcher.onChange((response) => {
    dispatch({
        type: ACTION_GLOBAL_RESPONSE,
        data: {
            [item.operationId]: response,
        },
    });
});
```

而 `SingleRequest`（[`packages/request/src/single-request/index.ts`](../../packages/request/src/single-request/index.ts#L147)）在请求失败时传入 `{ status: 'error', error: err }`，`err` 通常为 Error 类实例（含 `.stack`、`.message`，不可序列化）。`err` 来自 `runPromise`（[`packages/utils/src/runPromise.ts`](../../packages/utils/src/runPromise.ts#L7-L16)）透传的 Promise reject reason，类型取决于 API 实现，不保证是 Error 实例，但 Error 实例是最常见场景。

### 1.3 回调签名与状态机

`SingleRequest.onChange` 回调的完整签名（[`single-request/index.ts#L30`](../../packages/request/src/single-request/index.ts#L30)）：

```ts
type TOnChangeCallback = (result: { status: TStatus; error?: any; response?: any }) => void;
```

`SingleRequest` 内部只在三种状态触发回调（[`single-request/index.ts#L135-L153`](../../packages/request/src/single-request/index.ts#L135-L153)）：

| 触发时机 | 回调入参 | `response` 字段 | `error` 字段 |
| --- | --- | --- | --- |
| 请求开始（非轮询） | `{ status: 'loading', response: null }` | `null` | `undefined` |
| 请求失败 | `{ status: 'error', error: err }` | `undefined` | Error 实例 |
| 请求成功 | `{ status: 'success', response }` | 业务数据 | `undefined` |

> ⚠️ **边界说明**：`loading` 状态下回调入参为 `{ status: 'loading', response: null }`（入参对象非 null，`.response` 属性为 null）。当前 `SingleRequest` 不会传入 null 入参，对入参对象解构不会崩溃。但修复代码仍加 null 守卫作为**防御性编程**，保护"入参为 null/undefined"的未知场景，守卫无害且合理。

`TResponseStatus`（[`src/plugins/types.ts#L16`](../../src/plugins/types.ts#L16)）额外包含 `'empty'`，但该状态由消费方 [`GlobalDataFilter.tsx#L36-L42`](../../src/formily/widgets/dynamic-data/dataset-list/GlobalDataFilter.tsx#L36-L42) 派生，`SingleRequest` 不产生，不影响修复。

**轮询场景**：`SingleRequest` 支持轮询（`pollingInterval`）。首次请求触发 `loading`，后续轮询重试因 `isPollingQuiet=true`（[`single-request/index.ts#L133-L136`](../../packages/request/src/single-request/index.ts#L133-L136)）不再触发 `loading`；但轮询失败仍走 `error` 回调（`err` 为 reject reason），修复代码同样生效。

### 1.4 影响分析

#### 消费方排查（完整）

全局响应共有 **3 条消费路径**，全部不读 `.error` 字段：

1. **`getResponseFromGlobalResponse`**（[`GlobalDataFetcher.ts#L242-L267`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L242-L267)）：只解构 `{ response }`，读取 `response.rows` / `response.extraResponse`。`.error` 未被访问。
2. **`useGlobalFetcherResponse`** → **`DataFetcher.ts`**（[`DataFetcher.ts#L180-L182`](../../src/plugins/data-fetcher/DataFetcher.ts#L180-L182) 调用 `useGlobalFetcherResponse`，[`DataFetcher.ts#L285-L288`](../../src/plugins/data-fetcher/DataFetcher.ts#L285-L288) 调用 `getResponseFromGlobalResponse`）：全局响应的**主要消费方**，最终走 `getResponseFromGlobalResponse`，同路径 1。注：`DataFetcher` 的 `onFetchError` 处理的是局部请求错误，不读取 `globalResponse.error`。
3. **`GlobalDataFilter.tsx`**（[`GlobalDataFilter.tsx#L34`](../../src/formily/widgets/dynamic-data/dataset-list/GlobalDataFilter.tsx#L34)）：只解构 `{ status, response }`。`.error` 未被访问。

#### 子页面传播路径

`useInjectGlobalFetcherResponse2nextPage`（[`GlobalDataFetcher.ts#L274-L288`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L274-L288)）订阅整个 `component.globalResponse` 对象，并通过 `subStore.dispatch` 转发到子页面 store。已核实主 store（[`src/store/index.ts`](../../src/store/index.ts#L19-L29)）与子页面 store `createPageStore`（[`src/store/index.ts`](../../src/store/index.ts#L48-L66)）的 `ignoredActions` 均未包含 `component/globalResponse`，修复前子页面 store 同样会告警；修复后因主 store 的 error 已序列化，转发到子页面的也是序列化对象，子页面 store 同步受益。

#### 影响结论

- **不会崩溃**（修复后），但污染 Redux state，触发 serializableCheck 告警，影响 devtools 时间旅行。
- **触发条件**：全局数据集请求失败时（非高频路径）。
- **改动安全性**：所有消费方均不读 `.error`，改动无破坏性影响。
- **修复点唯一性**：`useGlobalFetcher()` 唯一调用方为 [`InitDataQuery/index.tsx#L59`](../../src/designer/data-query/InitDataQuery/index.tsx#L59)，`new SingleRequest` 全仓库仅 [`GlobalDataFetcher.ts#L90`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L90) 一处，修复点唯一。

---

## 2. 目标

1. `component.globalResponse` 中不存入不可序列化的 **Error 类实例**（其他非序列化 reject 值不在本次范围）
2. 不影响现有消费方逻辑（`.error` 字段未被消费，改动安全）
3. 保留错误信息可用性（转为 `{ message, stack }` 普通对象；注：`stack` 在生产构建中可能被裁剪，不保证完整可用，但满足可序列化要求）
4. 假设 `error` 来自主页面 realm，跨 iframe realm 的 `instanceof Error` 失效不在本次范围

---

## 3. 详细步骤

### 步骤 1：实施修复

**改动文件**：[`src/plugins/data-fetcher/GlobalDataFetcher.ts`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L105-L112) `fetcher.onChange` 回调。

**改动前**（L105-L112）：

```ts
fetcher.onChange((response) => {
    dispatch({
        type: ACTION_GLOBAL_RESPONSE,
        data: {
            [item.operationId]: response,
        },
    });
});
```

**改动后**：

```ts
fetcher.onChange((response) => {
    // 处理 loading 状态下 response 为 null 的情况，以及 error 为 Error 实例的不可序列化问题
    let serializableResponse = response;
    if (response && response.error instanceof Error) {
        const { error, ...rest } = response;
        serializableResponse = { ...rest, error: { message: error.message, stack: error.stack } };
    }
    dispatch({
        type: ACTION_GLOBAL_RESPONSE,
        data: {
            [item.operationId]: serializableResponse,
        },
    });
});
```

**设计要点**：

1. **null 守卫**：`response &&` 短路保护，避免 `loading` 状态下 `response: null` 解构崩溃。
2. **instanceof Error 判断**：仅当 `error` 是真正的 Error 实例时才转换；字符串、普通对象等原样保留（fallback）。
3. **保留可序列化信息**：转为 `{ message, stack }` 普通对象，满足 serializableCheck 要求。
4. **reducer 浅合并**（[`GlobalDataFetcher.ts#L296-L302`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L296-L302)）：只更新当前 `operationId`，不会污染其他 operationId 的响应。
5. **修复位置选择**：在 `onChange` 回调转换而非 `SingleRequest` 源头（L147）转换，是因为 `packages/request` 是对外 API，不宜随意改（AGENTS.md §10.2）。

### 步骤 2：类型检查

```bash
pnpm exec tsc --noEmit
```

预期：零新增错误（仅限 `src/` 目录，忽略 `packages/*` pre-existing 错误）。

### 步骤 3：浏览器冒烟验证

#### 3.1 成功路径

1. `pnpm start` 启动开发服务器
2. 打开设计器，配置一个全局数据集（指向正常可用的 API）
3. 观察：数据正常加载并展示
4. 打开 Redux DevTools，确认 `component.globalResponse.<operationId>` 形状正常

#### 3.2 失败路径（验证修复目标）

**构造失败场景**（任选其一）：

- **方法 A（推荐）**：将全局数据集的 API 地址改成一个返回 500 的接口，或一个不存在的端口（如 `http://localhost:9999/not-exist`）
- **方法 B**：在浏览器 DevTools 的 Network 面板，对该请求设置 Block request URL
- **方法 C**：断开网络（离线模式）后触发请求

**验证**：

1. 触发全局数据集请求失败
2. 打开浏览器 Console，确认**不再出现** `A non-serializable value was detected` 告警
3. 打开 Redux DevTools，查看 `component.globalResponse.<operationId>.error`，确认是普通对象 `{ message, stack }` 而非 Error 实例
4. 确认 `status` 字段仍为 `'error'`，消费方行为不变（`GlobalDataFilter` 显示错误态）

#### 3.3 loading 路径（验证 null 守卫）

1. 配置一个响应较慢的全局数据集 API
2. 刷新页面，在请求发出瞬间观察 Console
3. 确认 loading 状态正常 dispatch，无异常
4. Redux DevTools 中 `component.globalResponse.<operationId>` 应为 `{ status: 'loading', response: null }`

---

## 4. 验证清单

- [ ] `pnpm exec tsc --noEmit` 零新增错误
- [ ] 全局数据集请求成功 → 数据正常展示
- [ ] 全局数据集请求失败 → 无 serializableCheck 告警，`.error` 为普通对象
- [ ] 全局数据集请求 loading 中 → 无解构崩溃，`.response` 为 `null`
- [ ] 子页面通过 `useInjectGlobalFetcherResponse2nextPage` 收到的 error 也是可序列化对象（在子页面打开 Redux DevTools 检查子页面 store，或检查 Console 是否有子页面 serializableCheck 告警）
- [ ] roadmap.md 状态更新为 `in-progress`（开工时）→ `done`（完成时）

---

## 5. 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 消费方依赖 `.error` 是 Error 实例 | 极低 | 类型判断失败 | 已确认 3 条消费路径均不读 `.error` |
| `error` 不是 Error 实例（如字符串） | 低 | `instanceof` 不命中，原样 dispatch | 已有 fallback：非 Error 实例时不转换 |
| `loading` 状态入参为 null 导致解构崩溃 | 低 | 运行时崩溃 | 当前代码路径不会触发（入参为对象非 null）；null 守卫为防御性编程，保护未知场景 |
| `stack` 在生产构建被裁剪 | 中 | 错误堆栈信息缺失 | 不影响 serializableCheck；`message` 仍可用 |
| 子页面 store 传播异常 | 极低 | 子页面收到非序列化 error | reducer 浅合并，修复后子页面同步受益 |
| API reject 非 Error 的不可序列化值 | 低 | serializableCheck 告警残留 | 本次仅修复 Error 实例场景；如需彻底消除，可增加 `JSON.parse(JSON.stringify(error))` 兜底（但有性能/数据丢失权衡） |
| 跨 realm `instanceof Error` 失效 | 低 | 跨 iframe error 不被转换 | 假设 error 来自主页面 realm（§2 目标 4），跨 realm 不在本次范围 |

### 回退

- 单文件单函数改动，`git revert <commit>` 回退，revert 后刷新页面即可恢复。

---

## 6. 实施记录

> 实施过程中按时间顺序追加。

- 2026-07-29：任务创建。task-2026-07-28-007 排查 `app.designerType` Symbol 问题时发现此问题。经全面排查确认 `globalResponse` 是唯一真实风险（其余 Symbol 均为 false positive）。
- 2026-07-29：计划 review 优化。修正 3 处事实偏差（`TResponseStatus` 完整定义、`DataFetcher.ts` 主消费方遗漏、`useInjectGlobalFetcherResponse2nextPage` 子页面传播路径）；修复潜在 bug（`loading` 状态 `response: null` 解构崩溃，加 null 守卫）；补充可执行的验证步骤（失败场景构造方法、loading 路径验证）。
- 2026-07-29：交叉 review 修复。修正 1 处高优先级：§1.3 loading 崩溃论证前提错误（入参对象非 null，null 守卫定位为防御性编程，风险表概率从高降为低）。修正 3 处中优先级：§1.2 `runPromise` err 不保证是 Error 实例（目标措辞收敛）、§1.4 子页面 store serializableCheck 配置核实结论（主 store 与 createPageStore 均未忽略 component/globalResponse）、§1.2 与 §3 行号统一为 L105-L112。补充 7 处低优先级：onFetchError 澄清、修复位置决策理由（packages/request 对外 API）、跨 realm 假设声明、轮询场景说明、子页面验证步骤具体化、回退表述严谨化、useGlobalFetcher 唯一调用方。
- 2026-07-29：实施修复。按计划 §3 步骤 1 修改 [`GlobalDataFetcher.ts`](../../src/plugins/data-fetcher/GlobalDataFetcher.ts#L105-L118) `fetcher.onChange` 回调，加入 `response && response.error instanceof Error` 守卫，将 Error 实例转为 `{ message, stack }` 普通对象。执行 `pnpm exec tsc --noEmit`：`src/` 目录零新增错误，仅剩 `packages/ui/` 10 个 pre-existing 错误（属子包维护范畴，AGENTS.md §10.2 规定不修）。文件级 diagnostics 零告警。浏览器冒烟验证（§3.2/§3.3）待用户执行。
- 2026-07-29：用户完成浏览器冒烟验证（成功路径 + 失败路径 + loading 路径），确认 serializableCheck 告警消除、`.error` 为普通对象、null 守卫正常。已 commit 修复（仅 `GlobalDataFetcher.ts`，`.trae/` 文档按项目约定不纳入 git）。任务归档至 `plans/done/`，roadmap 状态置为 `done`。
