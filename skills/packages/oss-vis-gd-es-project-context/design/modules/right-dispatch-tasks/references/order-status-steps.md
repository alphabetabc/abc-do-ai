# 工单状态 Steps（最后一列，内联函数）

工单表格最后一列 `dataIndex: "orderStatus"` 通过 `render: renderOrderStatusSteps` 渲染成横向 Steps。本文档细化这一**内联函数**的所有维护、拓展点。

> ⚠️ **非独立文件**：`renderOrderStatusSteps` 与 `calculateStepsWidth` 是定义在 `dispatch-summary/index.tsx`（L42-L84）内的**内联函数**，**没有**独立的 `order-status-steps.tsx` 组件文件。本 md 仅作为该内联逻辑的维护参考；如需抽组件见 [§抽组件建议](#抽组件建议推荐演进方向)。

> **父组件**：[dispatch-tasks/dispatch-summary/index.tsx](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.tsx)
> **父 skill**：[gd-es-next-right-dispatch-tasks](./SKILL.md)

---

## TL;DR（30 秒）

| 维度         | 速记                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| **位置**     | [dispatch-summary/index.tsx#L42-L83](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.tsx#L42-L83) |
| **类型**     | 当前内联 `renderOrderStatusSteps` + `calculateStepsWidth` 函数（**未抽组件**）              |
| **数据契约** | `Array<{ name: string; value: string; time: string }>`                                     |
| **3 个状态** | `"1"`=finish（绿） / `"0"`=wait（白） / `"异常结束"`=金黄分支                                |
| **宽度算法** | `Math.min(550, length === 1 ? 75 : 29 + length * 56)`                                     |
| **外层**     | `<div style={{ width }}>` + `<Tooltip>` + `<Steps size="small" direction="horizontal">`    |

---

## 当前源码（行 42-83）

```typescript
const calculateStepsWidth = (length: number) => Math.min(550, length === 1 ? 75 : 29 + length * 56);

// 渲染工单状态Steps
const renderOrderStatusSteps = (orderStatus: Array<{ name: string; value: string; time: string }>) => {
    const steps: any = orderStatus.map((status) => {
        return {
            title: status.name,
            content: status.name,
            status: status.value === "1" ? "finish" : "wait",
            className: status.name === "异常结束" ? "dispatch-summary-steps-item-abnormal" : undefined,
        };
    });
    const pendingIndex = orderStatus.findIndex((status) => status.value === "0");
    const current = pendingIndex === -1 ? orderStatus.length - 1 : pendingIndex;
    const stepsWidth = calculateStepsWidth(orderStatus.length);
    const stepsTooltip = (
        <div style={{ whiteSpace: "pre-line", lineHeight: "1.8", padding: "2px 4px" }}>
            {orderStatus.map((status, index) => {
                return (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ textAlign: "left", width: 56 }}>{status.name}</span>
                        <span style={{ textAlign: "right" }}>{status.time}</span>
                    </div>
                );
            })}
        </div>
    );
    return (
        <div style={{ width: `${stepsWidth}px` }}>
            <Tooltip title={stepsTooltip}>
                <Steps
                    className="dispatch-summary-bottom-table-steps"
                    current={current}
                    labelPlacement="vertical"
                    items={steps}
                    direction="horizontal"
                    size="small"
                />
            </Tooltip>
        </div>
    );
};
```

调用方（工单表格，无线专业 / 传输专业各一处）：

```typescript
{
    title: "工单状态",
    dataIndex: "orderStatus",
    key: "orderStatus",
    width: 450,   // 无线专业 450 / 传输专业 520
    align: "center",
    render: renderOrderStatusSteps,
},
```

---

## 数据契约

### 后端 `orderStatus` 字段

| 字段    | 类型     | 含义                                                    |
| ------- | -------- | ------------------------------------------------------- |
| `name`  | `string` | 步骤名（如"派单"/"接单"/"到场"/"抢通完成"/"异常结束"） |
| `value` | `string` | `"1"` = 已完成 / `"0"` = 未完成（**字符串**）            |
| `time`  | `string` | 步骤时间，Tooltip 中按行展示                            |

> ⚠️ **`value` 是字符串**（非布尔）—— 与 `"true"`/`"false"` 的常见约定不同；判断时严格相等 `=== "1"`。

### 推断的 `current` 索引逻辑

```typescript
const pendingIndex = orderStatus.findIndex((status) => status.value === "0");
const current = pendingIndex === -1 ? orderStatus.length - 1 : pendingIndex;
```

| 后端数据形态                               | `pendingIndex` | `current`             | 视觉                       |
| ------------------------------------------ | -------------- | --------------------- | -------------------------- |
| 全部 `"1"`                                 | `-1`           | `length - 1`          | 全部亮绿，最后一项高亮     |
| 含首个 `"0"`（如 `[1,1,0,0]`）             | `2`            | `2`                   | 前 2 项绿，第 3 项当前项   |
| 全部 `"0"`（如 `[0,0,0]`）                 | `0`            | `0`                   | 第 1 项当前项（白），其余白 |
| 任意 `"异常结束"` 步骤                     | 与上同         | 与上同                | 该项换金黄                  |

---

## 渲染分支表

| `value` | `name`         | Steps `status` | `className`                              | 图标背景                  | 文字色                    |
| ------- | -------------- | -------------- | ---------------------------------------- | ------------------------- | ------------------------- |
| `"1"`   | 任意           | `finish`       | —                                        | 绿 `rgba(61, 255, 99, 0.2)` | 绿 `rgba(61, 255, 99)`  |
| `"0"`   | 任意           | `wait`         | —                                        | 半透明白色                | 白 `rgba(255, 255, 255, 0.8)` |
| 任意    | `"异常结束"`   | 由 `value` 决定 | `dispatch-summary-steps-item-abnormal`  | 金黄 `rgba(251, 212, 103)` | 金黄 `rgba(251, 212, 103)` |

> **优先级**：`className` 判断在前（基于 `name`），与 `value` 解耦。因此异常步骤可以同时是 `"1"`（已完成异常归档）或 `"0"`（异常未完结）——样式都换金黄。

---

## 宽度算法（`calculateStepsWidth`）

```typescript
Math.min(550, length === 1 ? 75 : 29 + length * 56)
```

| 步骤数 `length` | 实际宽度                  | 备注                                |
| --------------- | ------------------------- | ----------------------------------- |
| `1`             | `75`                      | 单步短宽                            |
| `2`             | `Math.min(550, 141) = 141` | `29 + 2*56`                         |
| `3`             | `Math.min(550, 197) = 197` | —                                   |
| `4`             | `Math.min(550, 253) = 253` | —                                   |
| `5`             | `Math.min(550, 309) = 309` | —                                   |
| `6`             | `Math.min(550, 365) = 365` | —                                   |
| `7`             | `Math.min(550, 421) = 421` | —                                   |
| `8`             | `Math.min(550, 477) = 477` | —                                   |
| `9+`            | `550`（封顶）             | 超长步骤被压缩，依赖样式 `overflow: hidden` |

> ⚠️ 上限 `550` 与表格列宽 `450`（无线）/ `520`（传输）**不匹配**——Steps 容器会**溢出列宽**，靠 `overflow: hidden` + Steps 内部 `flex: 1` 自适应压缩。修改宽度算法时务必同步核对表格列宽。

---

## Tooltip 渲染

Steps 整体套 `<Tooltip>`，悬停显示 `orderStatus` 每行的 `name + time`：

```tsx
<div style={{ whiteSpace: "pre-line", lineHeight: "1.8", padding: "2px 4px" }}>
    {orderStatus.map((status, index) => (
        <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ textAlign: "left", width: 56 }}>{status.name}</span>
            <span style={{ textAlign: "right" }}>{status.time}</span>
        </div>
    ))}
</div>
```

| 元素       | 样式                                                  | 说明                                |
| ---------- | ----------------------------------------------------- | ----------------------------------- |
| 外层       | `whiteSpace: "pre-line"`, `lineHeight: 1.8`           | 支持换行、垂直间距宽松              |
| 行容器     | `display: flex`, `justifyContent: space-between`     | 左右两端对齐                        |
| 左 `name`  | `textAlign: "left"`, `width: 56`                     | **固定 56px** —— 长步骤名会被截断   |
| 右 `time`  | `textAlign: "right"`                                 | 跟随容器右端                        |

---

## 样式（覆盖 fedx-ui Steps）

所有样式集中在 [dispatch-summary/index.css](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.css) `.dispatch-summary-bottom-table-steps` 系列：

### 通用

```css
.dispatch-summary-bottom-table-steps {
    width: 100% !important;
    overflow: hidden !important;
    white-space: nowrap;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item {
    padding-left: 0 !important;
    overflow: hidden;
    flex: 1;
    min-width: 0;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-icon {
    box-sizing: border-box !important;
    border: 1px solid rgba(61, 255, 99, 0.6) !important;
    background: rgba(61, 255, 99, 0.2) !important;
    width: 20px !important;
    height: 20px !important;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-wait .fedx-ui-steps-item-icon {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border: 1px solid rgba(255, 255, 255, 0.6) !important;
}

.dispatch-summary-bottom-table-steps .anticon {
    color: rgba(61, 255, 99, 1);
    font-size: 12px !important;
}
```

### 连接线（tail）

```css
.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-tail {
    position: relative !important;
    top: 10px !important;
    width: 62px !important;
    margin-inline-start: 47px !important;
    flex: 1;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-tail::after {
    background-color: rgba(61, 255, 99, 0.6) !important;       /* 已完成连线 */
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-wait .fedx-ui-steps-item-tail::after {
    background-color: rgba(255, 255, 255, 0.6) !important;     /* 未完成连线 */
}
```

### 文字

```css
.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-content {
    margin-top: 6px !important;
    margin-right: -20px !important;
    font-size: 0 !important;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-title {
    margin-top: 0 !important;
    white-space: nowrap;
    overflow: hidden;
    color: rgba(255, 255, 255, 0.8) !important;     /* 默认白 */
    font-family: Source Han Sans CN !important;
    font-size: 12px !important;
    font-weight: 400 !important;
    line-height: 18px !important;
    letter-spacing: 0 !important;
    text-align: left !important;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-wait .fedx-ui-steps-item-title {
    color: rgba(255, 255, 255, 0.8) !important;
}
```

### 异常结束（金黄）

```css
.dispatch-summary-bottom-table-steps .dispatch-summary-steps-item-abnormal .fedx-ui-steps-item-icon {
    background: rgba(247, 181, 1, 0.27) !important;
    border: 1px solid rgba(251, 212, 103, 1) !important;
}

.dispatch-summary-bottom-table-steps .dispatch-summary-steps-item-abnormal .fedx-ui-steps-item-title,
.dispatch-summary-bottom-table-steps .dispatch-summary-steps-item-abnormal .anticon {
    color: rgba(251, 212, 103, 1) !important;
}
```

> ⚠️ 当前**没有**为异常结束步骤定义独立的 `tail` 颜色 —— 沿用 finish（绿）或 wait（白）。若需要让异常步骤的连线也变金黄，需扩展 CSS 规则。

---

## 任务入口

| 任务                          | 触点位置                                                                              | 备注 |
| ----------------------------- | ------------------------------------------------------------------------------------- | ---- |
| **改名称映射**                | `renderOrderStatusSteps` 内 `name === "异常结束"`                                     | —    |
| **改值映射**                  | `status.value === "1" ? "finish" : "wait"`                                            | 严格字符串判断 |
| **改宽度上限**                | `calculateStepsWidth` 中 `Math.min(550, ...)`                                        | 同步核对列宽 |
| **改单步宽度**                | `length === 1 ? 75 : ...`                                                            | —    |
| **改步骤间距系数**            | `29 + length * 56`                                                                   | —    |
| **改 Tooltip 文本宽度**       | `width: 56`                                                                          | 长步骤名会截断 |
| **改 Tooltip 行高 / 间距**    | `lineHeight: "1.8"`, `padding: "2px 4px"`                                            | —    |
| **改完成 / 未完成颜色**       | `.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-icon`                       | 同步 `.anticon`、`.fedx-ui-steps-item-tail::after` |
| **新增异常分支样式**          | `.dispatch-summary-steps-item-abnormal`                                              | 需追加 `.fedx-ui-steps-item-tail::after` |
| **新增状态（如 `process`）**  | Steps `status` 支持 `wait`/`process`/`finish`/`error`                                | 需在映射里加分支 |
| **拆为独立组件**              | 见 [§抽组件建议](#抽组件建议)                                                          | 当前是内联函数 |

---

## 抽组件建议（推荐演进方向）

**当前痛点**：
- `renderOrderStatusSteps` 是 `DispatchSummary` 内联闭包，依赖 `Tooltip`、`Steps`、行内样式；
- 无线专业和传输专业两处表格列都引用同一个函数，复用 OK，但**测试与样式覆盖不集中**；
- 修改一处样式需要同时改 `index.css` 内多组选择器。

**抽组件方案**（按代价由低到高）：

### 方案 A：抽到同文件内的命名组件（最低代价）

```typescript
// dispatch-summary/OrderStatusSteps.tsx（同目录）
interface Props {
    orderStatus: Array<{ name: string; value: string; time: string }>;
    maxWidth?: number;
}

export const OrderStatusSteps: React.FC<Props> = ({ orderStatus, maxWidth = 550 }) => {
    // 复用 calculateStepsWidth / render 逻辑
    // ...
};
```

两处 `render: renderOrderStatusSteps` 改为 `render: (v) => <OrderStatusSteps orderStatus={v} />`。

### 方案 B：抽到独立目录 + 独立 css

```
dispatch-summary/
├── OrderStatusSteps/
│   ├── index.tsx
│   └── index.css     ← .dispatch-summary-bottom-table-steps 系列集中此处
├── index.tsx
└── index.css
```

并把 `.dispatch-summary-bottom-table-steps` 与 `.dispatch-summary-steps-item-abnormal` 从 `dispatch-summary/index.css` 移走，**主 css 只留表格布局**。

### 方案 C：完全脱离 DispatchSummary，做通用组件

放 `apps/main/app/components/common/OrderStatusSteps/`，接受更通用 props（如 `statusMap` 自定义颜色），跨模块复用。

> **不建议一上来就做 C**：当前 Steps 与 fedx-ui 的样式覆盖耦合较深，过早通用化会增加抽象成本。

---

## 排错（Q&A）

| #   | 症状                              | 一句话定位                                                                  |
| --- | --------------------------------- | --------------------------------------------------------------------------- |
| Q1  | Steps 全显示为 wait（白色）       | 后端 `value` 全为 `"0"`（未完成）；检查数据源                                |
| Q2  | Steps 全显示为 finish（绿色）      | 后端 `value` 全为 `"1"`；`current` 落到 `length - 1`                       |
| Q3  | 异常结束步骤没有金黄色             | `name` 不是 `"异常结束"` 字面量；后端命名变化                               |
| Q4  | 异常步骤显示绿色而非金黄          | `className` 被覆盖；检查 Steps `items` 映射 + `index.css` 选择器优先级      |
| Q5  | Steps 容器超出列宽（被截断）      | `calculateStepsWidth` 上限 550 > 列宽 450/520；表格 cell 需 `overflow: hidden` |
| Q6  | Steps 整体不显示                  | `orderStatus` 为 `undefined`/`[]`；`render` 接收空数据时 Steps 仍渲染空容器 |
| Q7  | Tooltip 不显示                    | `<Tooltip>` 未正确包裹 Steps；检查 z-index（fedx-ui Steps 内部 icon 可能覆盖）|
| Q8  | Tooltip 时间显示乱码              | 后端 `time` 字段格式不规范；可在 render 中 `dayjs(status.time).format(...)` 兜底 |
| Q9  | 步骤文字被截断                    | `fedx-ui-steps-item-title` 默认 `white-space: nowrap` + `overflow: hidden`；CSS 已覆盖 |
| Q10 | 调整列宽后 Steps 错位              | Steps 容器 `width` 是固定像素，**不会**跟随列宽变化；要么改 `calculateStepsWidth` 上限，要么改列宽 |

---

## 场景指南

### 场景 1：新增异常分支（如 `timeoutEnd`、`cancelEnd`）

1. 在 `renderOrderStatusSteps` 的 `map` 内扩展 `className` 三元：
   ```typescript
   className: ["异常结束", "timeoutEnd", "cancelEnd"].includes(status.name)
       ? "dispatch-summary-steps-item-abnormal"
       : undefined,
   ```
2. （可选）在 `index.css` 内追加 `.dispatch-summary-steps-item-{type}` 系列样式。
3. **不要改 `value` 映射**——异常分支样式与 `value` 解耦。

### 场景 2：调整 Steps 整体宽度上限

1. 改 `calculateStepsWidth` 内的 `Math.min(550, ...)` → 新上限（如 600）。
2. 同步核对表格列宽：
   - 无线专业：`orderColumns[L407] width: 450`
   - 传输专业：`orderColumns[L466] width: 520`
3. 若新上限 > 列宽，确认表格 cell `overflow: hidden` 生效（当前 css 默认 `overflow: auto`）。

### 场景 3：增加 `process` 状态（进行中）

antd Steps 支持 `process` 状态（蓝色图标）。当前 `value` 只 `"1"`/`"0"` 两种：

```typescript
// 后端扩展 value: "1"=finish / "2"=process / "0"=wait
status: status.value === "1" ? "finish" : status.value === "2" ? "process" : "wait"
```

并新增 `.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-process .fedx-ui-steps-item-icon` 样式。

### 场景 4：Tooltip 内显示完整时间格式

当前 `status.time` 直接展示。若需要统一格式：

```tsx
{status.time && dayjs(status.time).isValid()
    ? dayjs(status.time).format("YYYY-MM-DD HH:mm:ss")
    : status.time}
```

> 建议改在 `stepsTooltip` 的 `.map` 内，保持数据契约不变。

### 场景 5：抽组件后的样式迁移

1. 新建 `OrderStatusSteps/index.css`，把 `.dispatch-summary-bottom-table-steps` 与 `.dispatch-summary-steps-item-abnormal` 全部移走。
2. `dispatch-summary/index.css` 删除对应块。
3. `OrderStatusSteps/index.tsx` 顶部 `import "./index.css"`。
4. 验证两步表格列 Steps 视觉无变化。

### 场景 6：单元格点击 Steps 派发到 GIS

当前 Steps 只渲染 + Tooltip。如需点击单步派发 GIS：

1. 给 `<Steps>` 包 `<div onClick>`（注意冒泡到 `Table.onRow`，需 `stopPropagation`）。
2. 通过 `widgetFields.getField("dispatchTasks:orderStepClick")` 派发。
3. **必须**同步 GIS 订阅方 + `fields.ts` 注册新字段。

---

## 相关文件

| 文件                                                                                       | 角色               |
| ------------------------------------------------------------------------------------------ | ------------------ |
| [dispatch-summary/index.tsx](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.tsx) | 定义 `renderOrderStatusSteps` + 调用方 |
| [dispatch-summary/index.css](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.css) | 所有 Steps 样式覆盖（绿/白/金黄）   |
| [dispatch-tasks/index.tsx](apps/main/app/components/right/dispatch-tasks/index.tsx)         | 父组件（顶部日期/专业）  |
| [`api.md`](./api.md)                                                                       | `getEmergencyDispatchOrderApi` 返回 `orderStatus` |

## 版本信息

- 初始版本：1.0.0（2026-07-13）
- 维护者：Emergency Support Team
- 父 skill：`gd-es-next-right-dispatch-tasks`