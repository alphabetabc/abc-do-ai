# Task · 2026-08-13-020-interaction-store-实现

> 状态：✅ 完成
> 类型：编码
> 创建：2026-08-13
> 前置：task-010（✅ ScalerContainer）、task-011（✅ EChartsMap）
> 关联依据：`design/components/003-interaction-store/index.md`

---

## 0. 任务信息

| 项 | 值 |
| --- | --- |
| 编号-slug | 2026-08-13-020-interaction-store-实现 |
| 任务类型 | 编码 |
| 影响范围 | `frontend/src/components/large-screen/interaction-store/index.ts`（新建） |
| 验收标准 | ① 文件创建且 tsc 编译通过；② `defineFields` 类型推导正确（getField 返回精确类型）；③ `useSubscribe` 使用 `useShallow` 无副作用；④ `dispatch` / `setState` 正确写入 runtime；⑤ 导出 `createInteractionStore` / `defineFields` / `FieldDescriptor` / `InteractionState` |

---

## 1. 步骤

### 步骤 1：创建 interaction-store 模块

- **动作**：按设计文档 §5 实现参考，创建 `frontend/src/components/large-screen/interaction-store/index.ts`，包含：
  - `FieldDescriptor` 接口（`name + value + [key: string]: any`）
  - `InteractionState` 接口（`runtime + dispatch + setState`）
  - `defineFields()` 工厂（泛型推导 `NameToFieldMap` / `ValueToFieldMap`，返回 `getField` + `fields`）
  - `createInteractionStore()` 工厂（zustand store + `useSubscribe` + `useDispatch`）
  - `useSubscribe` 使用 `useShallow`（`zustand/react/shallow`），不在 selector 内写 ref
  - 导出：`createInteractionStore`、`defineFields`、`FieldDescriptor`、`InteractionState`
- **输出**：`frontend/src/components/large-screen/interaction-store/index.ts`
- **🛑 等待用户**：否

### 步骤 2：tsc 编译验证

- **动作**：在 `frontend/` 下执行 `npx tsc --noEmit`，确认无类型错误
- **输出**：终端编译结果（0 errors）
- **🛑 等待用户**：否

### 步骤 3：类型推导验证

- **动作**：在同一文件底部或临时测试文件中，写一段类型验证代码确认 `defineFields` 的 `getField` 返回精确类型（非 `any`）：
  ```typescript
  const fields = defineFields([
      { name: "cantCode", value: "cant_code", label: "行政区划代码" },
  ]);
  const f = fields.getField("cantCode");
  // f 应被推导为 { name: "cantCode"; value: "cant_code"; label: string } 而非 any
  ```
  验证后删除临时代码
- **输出**：类型验证通过（鼠标 hover 确认类型正确）
- **🛑 等待用户**：否

### 步骤 4：设计文档同步检查

- **动作**：对照 `design/components/003-interaction-store/index.md` §5 实现参考，确认实现与设计文档一致；如有微调（如 null 安全处理），回写设计文档
- **输出**：设计文档与代码一致（或已同步更新）
- **🛑 等待用户**：否

---

## 2. 依据

| 来源类型 | 路径 | 引用章节 |
| --- | --- | --- |
| skill | `design/components/003-interaction-store/index.md` | §2 核心 API、§5 实现参考 |
| skill | `design/004-big-screen-architecture.md` | §3.1 已有组件表、§4 交互联动协议 |
| 项目 | `frontend/src/store/user.ts` | zustand v5 使用风格参考 |
| 项目 | `frontend/src/features/layout/useTabsStore.ts` | zustand v5 使用风格参考 |
| 依赖 | `frontend/package.json` | `zustand@^5.0.13`（已安装） |

---

## 3. 约束

1. **不引入 immer**——runtime 是扁平 key-value，用展开运算符（与项目现有 store 风格一致）
2. **不在 selector 内写 ref**——`useSubscribe` 必须用 `useShallow`（`zustand/react/shallow`）
3. **不跨大屏共享**——每个大屏页面各调用一次 `createInteractionStore()`，不导出全局单例
4. **模块内局部态不进 store**——指标下钻等只影响组件自身的状态用 `useState`
5. **纯 TS 文件**——无 JSX，文件名 `index.ts`（不是 `index.tsx`）
6. **遵循 kebab-case 目录约定**——`interaction-store/`

---

## 4. 状态记录

| 日期 | 变更 |
| --- | --- |
| 2026-08-13 | task 创建 |
| 2026-08-13 | ✅ 完成验收：tsc 编译 0 errors；类型推导验证通过（getField 返回精确类型）；代码与设计文档 §5 一致；临时测试文件已清理 |
