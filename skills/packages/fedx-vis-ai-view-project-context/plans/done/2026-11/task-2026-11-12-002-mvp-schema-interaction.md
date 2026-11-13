# Task · 2026-11-12-002-mvp-schema-interaction

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-002-mvp-schema-interaction` |
| Status | 已完成（用户验收通过 2026-11-12） |
| 类型 | 编码 |
| 影响范围 | `packages/screen-renderer/src/{renderer,interaction-store,index}.ts`、`packages/screen-renderer/playground/` |
| Roadmap | MVP · 里程碑 1（联动） |
| 验收标准 | 点地图区域 → 派发字段 → 左右指标数值变化 |
| 前置依赖 | task-2026-11-12-001-mvp-renderer-core |

---

## 目标（Goal）

让 Schema 能声明联动：`events` 把组件回调转成字段派发，`subscribe` 把字段值注入订阅方 props。不写任何业务代码。

---

## 步骤（执行计划）

### 步骤 1：字段表与包内 store

- **动作**：把骨架的 `src/components/interaction-store` 复制进包内（与 001 的 scaler/section-frame 同理，跨 bundle 无法共享）；`interactions.fields` → `defineFields`；每份 Schema 用 `createInteractionStore()` 建一次实例，作为 props 传给 `SchemaRenderer`
- **注意**：`SchemaRenderer` 增加可选入参 `store?`；001 若未预留，在本卡内扩展签名（同迭代内可接受）
- **输出**：`packages/screen-renderer/src/interaction-store/` + Renderer 内 store 实例
- **注意**：骨架原件保留不动，供路径 A 使用
- **等待用户**：否

### 步骤 2：事件派发

- **动作**：按 `events: [{ on, dispatch, pick }]` 给组件注入包装回调；`pick` 是 payload 取值路径（如 `info.adcode`），避免 JSON 里写函数
- **输出**：事件包装逻辑
- **等待用户**：否

### 步骤 3：字段订阅

- **动作**：按 `subscribe: ['region']` 用 `useSubscribe` 取当前值，合并进 props（约定注入名与字段同名）
- **输出**：订阅注入逻辑
- **等待用户**：否

### 步骤 4：`sectionEvent` 出口

- **动作**：字段派发后，除包内 store 更新外，同时通过 001 的 emitter 向宿主派发 `sectionEvent`（载荷 `{ field, value, sectionId }`），供宿主做 URL 同步等自定义处理
- **输出**：`renderer.on('sectionEvent', cb)` 可用
- **等待用户**：否

### 步骤 5：playground 补联动

- **动作**：playground 的 mock 地图声明 `onClick → dispatch region`；左右两个 mock 声明 `subscribe region`，按 region 换一组 mock 值
- **输出**：更新后的 playground schema
- **等待用户**：否

### 步骤 6：验证

- **动作**：`pnpm build:renderer` + 包内 `pnpm dev` 手点地图确认联动；`pnpm build` 通过
- **输出**：验证结论
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做跨屏联动（走 URL query，不属本次）
- 不做联动条件表达式（只做单字段直传）
- 不改地图与指标物料的内部实现（只用其现有 `onClick` / `dataSource`）

## 验收 checklist

- [x] A1：playground 中点 mock 地图区域后，左右组件显示对应区域数据（浏览器实测：点「广东」→ 左侧「接入设备 2416」、右侧 `region = 440000`；点「四川」→ 548 / 510000）
- [x] A2：字段未派发时订阅方不报错（`interactions[].default` 在 store 创建时填入 runtime，首帧即为 `110000`，控制台无错误）
- [x] A3：联动配置全在 JSON 中，Renderer 内无业务字面量（`src/` 内无 `region` 等业务字面量，仅 `playground/` 有）
- [x] A4：`renderer.on('sectionEvent')` 能收到 `{ field, value, sectionId }`（浏览器控制台实测 `field="region", value="440000", sectionId="center-map"`）
- [x] A5：`pnpm build:renderer` 与 `pnpm build` 均通过（另 `pnpm check:renderer-isolation` 通过）

## 实现记录（2026-11-12）

- `src/interaction-store/`：从骨架复制并按 Schema 模式适配——`defineFields` 改具体类型（name/value 双键查找）、`createInteractionStore(fields)` 创建时按 `default` 填 runtime 初值、新增非 hook 的 `dispatch(nameOrValue, payload)` / `setState` / `resolveField`（未登记字段按 name 直存）；骨架原件未动
- `src/types.ts`：`SchemaInteractionField` 定稿为 `{ name; value?; default? }`（原 001 占位 `{ field; default }`）；新增 `SectionEventPayload`
- `src/renderer/section-item.tsx`：`subscribe` → `store.useSubscribe` 注入同名 prop（覆盖静态 props）；`events` → 包装回调 `pickValue(payload, pick)` → `store.dispatch` → `onSectionEvent`
- `src/renderer/index.tsx`：新增可选入参 `store?` 与 `onSectionEvent?`；未传 store 时按 `schema.interactions` 自建（直接使用 SchemaRenderer 的场景）
- `src/index.tsx`：`create()` 持有 store，`setSchema` 时重建（换屏不串值）；`RendererEvent` 扩为 `scalechange | sectionEvent` 并改为按事件名推导载荷（`RendererEventMap`）；导出 `createInteractionStore` / `defineFields` / 相关类型
- `playground/main.tsx`：新增 mock-map（点击派发 `info.adcode`）、左右 mock 订阅 `region` 换值；`onSectionEvent` 打日志便于验收
- 依赖：`packages/screen-renderer/package.json` 增 `zustand@^5.1.0`（与根版本一致，lockfile 已更新）
- 设计文档同步：`design/mvp/schema-runtime.md` 的 interactions 示例与字段说明改为 `{ name, value?, default }`
- 用户 review 后拆分（2026-11-12）：原单文件按职责拆为 `interaction-store/fields.ts`（字段描述符 / `toFieldDescriptors` / `defineFields`）+ `interaction-store/store.ts`（运行时 store 与 hooks）+ `interaction-store/index.ts`（barrel 出口）；对外引用路径不变，`pnpm build:renderer` 复验通过

## 技术设计（实现要点）

| 改动 | 文件 | 说明 |
| --- | --- | --- |
| store 复制 | `packages/screen-renderer/src/interaction-store/` | 从骨架复制，骨架原件保留 |
| store 下发 | `packages/screen-renderer/src/renderer.tsx` | `createInteractionStore()` 每份 Schema 一个实例，避免跨屏串值；以 props 传递，不用 Context |
| 事件包装 | 同上 | `props[event.on] = (payload) => dispatch(field, get(payload, event.pick))` |
| 订阅注入 | 同上 | `useSubscribe` 在 section 外层组件调用（hooks 规则），结果合并进 props |
| 事件出口 | `packages/screen-renderer/src/index.ts` | 复用 001 的 emitter，派发 `sectionEvent` |
| playground | `packages/screen-renderer/playground/` | `interactions.fields: [{name:'region', value:'region_code'}]` |

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-12 | 用户（对话批准「执行task002」） |
| ② 实现验收 | 已验收 | 2026-11-12 | 用户（对话「归档task002」） |

## 关联

> - 前置：`task-2026-11-12-001-mvp-renderer-core.md`
> - 复制来源：`docs/skeleton/src/components/interaction-store/index.ts`（复制后骨架原件保留）
