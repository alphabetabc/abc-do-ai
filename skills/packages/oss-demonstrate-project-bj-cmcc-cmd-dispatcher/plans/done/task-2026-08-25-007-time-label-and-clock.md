# Task 007 — 退服恢复时间范围 label + 右上角实时时钟

> **前置**：
>
> -   [done/task-2026-08-25-006-timeline-history.md](../done/task-2026-08-25-006-timeline-history.md) TimelineHistory 已落地
>
> **关联文档**：
>
> -   前端规范：[../../design/003-frontend.md](../../design/003-frontend.md)
> -   当前状态：[../../status/current.md](../../status/current.md)
> -   自检清单：[../../status/checklist.md](../../status/checklist.md)
>
> **日期**：2026-08-25
> **状态**：已完成

---

## 一、目标

1. 在 `modules/service-recovery/index.tsx` 的 `退服恢复情况.png` 上叠加一个时间范围 label，格式为 `yyyy-mm-dd hh:mm:ss 至 yyyy-mm-dd hh:mm:ss`（起点 = 当前时间往前 2 小时，终点 = 当前时间）。
2. 新增一个时钟模块，在大屏右上角显示实时时分秒（复用全局 `web/components/ui/time-display` 的 `TimeDisplay` 组件），叠加在背景图之上。

## 二、背景 / 现状盘点

| 项 | 状态 |
|---|---|
| TimelineHistory | ✅ 已落地（task006），mount 时快照 24 个时间点（覆盖前 2 小时），但无显式的"时间范围"文字 label |
| 退服恢复情况.png | ✅ 已通过 `ServiceRecoveryPanel` 渲染（`LEFT=53 / TOP=822 / WIDTH=1790 / HEIGHT=238`） |
| 实时时钟组件 | ✅ 全局已有 `web/components/ui/time-display`（`TimeDisplay`），但 `render.tsx` 尚未引入 |
| 右上角调试信息块 | ⚠️ `render.tsx` 第 63-76 行有 `currentLevel` 调试块（right:24, top:24），时钟模块需与之错开或替换 |

## 三、落地方案

### 3.1 退服恢复时间范围 label

在 `modules/service-recovery/index.tsx` 中新增一个浮在图片上的绝对定位 `<div>`：

- **内容**：`{startTime} 至 {endTime}`，格式 `yyyy-mm-dd hh:mm:ss`
- **时间计算**：mount 时一次性快照（与 TimelineHistory 的 `buildDefaultPoints` 同策略，避免长会话漂移）
  - `endTime = new Date()`（mount 时刻）
  - `startTime = new Date(endTime.getTime() - 2 * 60 * 60 * 1000)`（往前 2 小时）
- **格式化**：用 `dayjs`（项目已有依赖 `@fedx-web-common/utils`）格式化为 `YYYY-MM-DD HH:mm:ss`
- **定位**：初始放在图片左上角区域（`left: LEFT + 40, top: TOP + 10`），zIndex: 100，用户后续微调
- **样式**：白色文字、16px、Microsoft YaHei（与 TimelineHistory label 风格一致）

### 3.2 右上角实时时钟模块

新增 `modules/clock/index.tsx`：

- **组件**：复用 `web/components/ui/time-display` 的 `TimeDisplay`
- **可见层级**：全局（所有 Level 可见，不设 `MY_LEVELS` 守卫）
- **定位**：`position: absolute, right: 24, top: 24, zIndex: 100`（叠在背景图之上；Background 的 zIndex=10，时钟 100 > 10 可见）
- **尺寸**：宽 300px、高 40px（TimeDisplay 内部 Space 自适应）
- **样式**：通过外层 div 定位 + TimeDisplay 内部 less 已有的样式

在 `render.tsx` 中：
- import `ClockModule`
- 在 stage 容器内、调试信息块之前挂载
- 调试信息块（`currentLevel = ...`）下移到 `top: 70` 避免与时钟重叠

### 3.3 文件改动

| 文件 | 类型 | 改动 |
|---|---|---|
| `web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx` | 改 | 新增时间范围 label div |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/clock/index.tsx` | 新增 | 时钟模块入口 |
| `web/pages/bj-cmcc-cmd-dispatcher/render.tsx` | 改 | import + 挂载 ClockModule；调试块下移 |
| `status/current.md` | 改 | 模块清单追加 clock |

## 四、不在本次范围

- ❌ 时间范围 label 的实时刷新（mount 时快照，不随时间推移自动更新）
- ❌ 时钟模块的样式深度定制（复用 TimeDisplay 默认样式，仅定位）
- ❌ 时钟与 store 状态联动

## 五、验收标准

1. `modules/service-recovery/index.tsx` 渲染出时间范围 label，格式 `yyyy-mm-dd hh:mm:ss 至 yyyy-mm-dd hh:mm:ss`
2. 起点时间 = mount 时刻往前 2 小时；终点时间 = mount 时刻
3. `modules/clock/index.tsx` 存在并导出 `ClockModule`
4. `render.tsx` 挂载 `ClockModule`，右上角显示实时时分秒
5. 时钟在所有 Level 下可见
6. 时钟叠加在 Background（zIndex:10）之上
7. TS 编译 0 错误

## 六、文档同步要求

| 触发动作 | 必须更新 |
|---|---|
| 新增模块 `clock` | `status/current.md`（模块清单） |
| service-recovery 新增 label | `status/current.md`（service-recovery 模块说明） |
| 本 task 收口 | `status/checklist.md` 追加本 task 收口自检段 |

## 七、看板

- [x] service-recovery 新增时间范围 label
- [x] 新建 modules/clock/index.tsx
- [x] render.tsx 挂载 ClockModule + 调试块下移
- [x] 同步 `status/current.md`
- [x] 按 `status/checklist.md` 自检

---

## 文档元信息

> **日期**：2026-08-25
> **状态**：已完成
