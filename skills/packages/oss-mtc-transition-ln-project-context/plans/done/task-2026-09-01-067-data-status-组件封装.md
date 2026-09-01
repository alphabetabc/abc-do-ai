# Task · 2026-09-01-067-data-status-组件封装

> 状态：✅ 完成
> 类型：编码
> 创建：2026-09-01
> 前置：无
> 关联依据：仓库根 `AGENTS.md` §3 前端目录约定 / §5 大屏开发通用要点 / §6 命名与代码风格；技能 `oss-mtc-transition-ln-project-context` 下 `design/004-big-screen-architecture.md`（共享组件定位）

---

## 0. 任务信息

| 项        | 值                                                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号-slug | 2026-09-01-067-data-status-组件封装                                                                                                                                                                                                                                             |
| 任务类型  | 编码                                                                                                                                                                                                                                                                            |
| 影响范围  | `frontend/src/components/large-screen/data-status/index.tsx`（当前空文件，待写入）；视方案新增 `types.ts`；**不修改** `status.tsx` / `raw-data-status/` 子目录                                                                                                                  |
| 验收标准  | ① `data-status/index.tsx` 落地可运行的封装实现；② 类型完备（含 `DataStatusProps`）；③ 可完整替代 trend/index.tsx 的 `<Spin spinning>` + Empty 覆盖层三态样板；④ `pnpm tsc --noEmit` 0 新增错误；⑤ `docs/` 下 `.trae/` / `agents.md` / `.local-` / `task-\d+` 0 命中（任务自检） |

---

## 1. 设计定稿（2026-09-01 用户拍板）

### 1.1 背景

封装一个数据状态组件，替代各模块（如 `petition-comparison/trend/index.tsx`）手写的三态样板：

- loading：`<Spin spinning={loading}>` 包裹内容（保留布局占位，避免大屏卡片塌陷）
- 空态：`absolute inset: 0` 居中覆盖 `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />`
- 错误态：同覆盖层形式显示「加载失败」

### 1.2 对外 API（定稿）

```tsx
interface DataStatusProps<T = unknown> {
    /** 请求 loading 状态 */
    loading?: boolean;
    /** 请求结果数据，内部判空 */
    dataSource?: T | null | undefined;
    /** 请求错误；有 error 优先显示错误态，其次空态 */
    error?: unknown;
    /** 空态描述文案 */
    emptyDescription?: string; // 默认「暂无数据」
    /** 错误态描述文案 */
    errorDescription?: string; // 默认「加载失败」
    children?: React.ReactNode;
}
```

### 1.3 判定规则（定稿）

1. `loading === true` → `<Spin spinning>` 包裹 children（children 始终渲染，保留占位）
2. `error` 非空（真值）→ 错误态覆盖层
3. `dataSource` 为空 → 空态覆盖层。**空判定内置约定**：`null` / `undefined` / 空数组（`length === 0`）/ 空对象（`Object.keys(x).length === 0`）/ 空字符串，均视为空
4. 否则 → 正常渲染 children

### 1.4 结论：不基于 status.tsx 二次开发

评估结论（2026-09-01）：`status.tsx` 由调用方自己算 `status` 字符串、loading 为独立块而非包裹层、图片/样式风格不匹配大屏暗底。直接复用无法消除三态样板，故在 `data-status/index.tsx` 新写薄组件（不 import status.tsx，仅依赖 antd Spin/Empty）。

### 1.5 替代效果示例（trend/index.tsx L117-142 → 目标写法）

```tsx
<DataStatus loading={loading} error={error} dataSource={trendData}>
    <div style={{ width: '100%', height: 235 }}>
        {hasData && <ReactECharts ... />}
    </div>
</DataStatus>
```

> 注：本 task 只交付组件；trend 等模块的**替换接入**不属本 task 范围（后续各模块顺带替换）。

---

## 2. 步骤

### 步骤 1：封装方向拍板 ✅

- **动作**：与用户对齐封装定位与对外 API。
- **输出**：§1 设计定稿（loading + dataSource + 可选 error 三参传入、Spin 包裹 children、内置空判定含空数组/空对象/null/undefined、落地 `data-status/index.tsx`）。
- **🛑 等待用户**：已通过（2026-09-01）。

### 步骤 2：编码实现

- **动作**：按 §1 定稿在 `frontend/src/components/large-screen/data-status/index.tsx` 落地组件 + 类型导出（泛型 `DataStatusProps<T>`，空判定 helper）。
- **输出**：`data-status/index.tsx`（+ 必要时 `types.ts`）。
- **🛑 等待用户**：否。

### 步骤 2.1：status.tsx 改为函数式组件（2026-09-01 用户新增）

- **动作**：用户已将 `raw-data-status/` 内文件上提到 `data-status/` 目录（status.tsx / types.d.ts / cropper.css / index.css / data-\*.ts / index.md）；将 `status.tsx` 的类组件 `DataStatus` 改写为函数式组件，保持现有 props 与渲染逻辑不变（含 `STATUS` 常量导出方式对齐）。
- **输出**：`data-status/status.tsx`（函数式版本）。
- **🛑 等待用户**：否。

### 步骤 3：验收

- **动作**：
    1. `cd frontend && pnpm tsc --noEmit`：确认 0 新增错误（基线错误除外）。
    2. 复用件核对：确认未绕过定稿 API，空判定覆盖空数组/空对象/null/undefined/空字符串。
    3. 任务自检：`Grep "\.trae/\|agents\.md\|\.local-\|task-\d+" docs/` 0 命中。
- **输出**：验收勾选清单 + 若有问题回退步骤 2 修复。
- **🛑 等待用户**：否。

### 步骤 4：归档

- **动作**：任务完成后，将本文件移至 `plans/done/`，更新 `plans/roadmap-2026-08-11-big-screen.md` §3 任务索引状态 + §5 变更记录。
- **输出**：`plans/done/task-2026-09-01-067-data-status-组件封装.md` + roadmap §3/§5 更新。
- **🛑 等待用户**：否。

---

## 3. 依据（任务来源）

| 来源类型 | 路径                                                                                     | 引用章节                                                  |
| -------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| skill    | 技能 `oss-mtc-transition-ln-project-context` 下 `design/004-big-screen-architecture.md`  | §共享组件定位                                             |
| skill    | 技能 `oss-mtc-transition-ln-project-context` 下 `plans/roadmap-2026-08-11-big-screen.md` | §2.1 当前活跃分支（基础组件分支）                         |
| docs     | 仓库根 `AGENTS.md`                                                                       | §3 前端目录约定 / §5 大屏开发通用要点 / §6 命名与代码风格 |

---

## 4. 状态记录

| 日期       | 变更                                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01 | task 创建                                                                                                                                                                                                                                                                  |
| 2026-09-01 | 步骤 1 完成：方向拍板（loading + dataSource + error / Spin 包裹 / 内置空判定 / 落地 index.tsx / 不复用 status.tsx）；验收标准删除 eslint 项；状态 ⚪ → 🟡                                                                                                                  |
| 2026-09-01 | 新增步骤 2.1：用户已上提 `raw-data-status/` 文件至 `data-status/`；status.tsx 类组件改写为函数式组件（props 与渲染逻辑不变）                                                                                                                                               |
| 2026-09-01 | 步骤 2.1 完成：status.tsx 函数化（STATUS 改顶层常量随组件导出 `export { DataStatus, STATUS }`）；tsc 0 错误                                                                                                                                                                |
| 2026-09-01 | 步骤 2 完成：`index.tsx` 落地 `DataStatus` 泛型组件（loading + dataSource + error + emptyDescription / errorDescription，Spin 包裹 children，空/错态 absolute 覆盖层 Empty.PRESENTED_IMAGE_SIMPLE，isEmptyData 覆盖 null/undefined/空串/空数组/空对象，数字 0 视为有数据） |
| 2026-09-01 | 步骤 3 验收：tsc 0 错误 ✅；API 与定稿一致 ✅；docs/ 检出 task-061/066 等引用为**历史遗留**（前序会签落行），本 task 未改 docs/ 无新增污染 ⚠️                                                                                                                              |
| 2026-09-01 | 步骤 4：task 归档 done/ + roadmap §3/§5 同步 |
| 2026-09-01 | 归档后迭代（用户 review 驱动）：① 移除空字符串判空（isEmptyData 只判 null/undefined/空数组/空对象）；② 渲染形态两次调整后定稿：loading 用 `<Spin spinning>` 包裹 children（保留布局占位），**仅 error/empty 走独立分支且 children 不渲染**（互斥，避免空数据干扰 children 内部逻辑）；③ 新增 `emptyImage` / `errorImage` 可选 props（antd Empty image 类型，默认 PRESENTED_IMAGE_SIMPLE）；④ 新增步骤 5：接入一个业务组件实测效果（trend/index.tsx） |
| 2026-09-01 | 步骤 5 完成：trend/index.tsx（041 模块1 信访量趋势）接入 DataStatus——删手写 `<Spin spinning>` + Empty 覆盖层 + hasData 计算共 24 行三态样板；tsc 0 错误；task 移回 plans/ 根待用户查看效果 |
| 2026-09-01 | 收尾（用户效果确认 OK）：① `index.tsx` 改命名导出 `export { DataStatus }`（去 default），trend/index.tsx 引用同步 `import { DataStatus }`；② status.tsx 组件改名单独导出（与 DataStatus 区分；用户最终定名 `FedxDataStatus`，`export { FedxDataStatus, STATUS }`）；③ tsc 0 错误；④ 用户确认本 task 结束，归档 done/ |                                                                                                                                                                                                                              |
