---
name: gd-es-next-header
description: Maintains the top header module of the GD emergency-support main app. Invoke when modifying the AppHeader layout, task selector, real-time notice ticker, or response-level (政府/省级/市级响应) display.
---

# gd-es-next-header

顶部 Header 模块的维护与拓展指南。本文档为索引，详细说明按组件拆分到 `components/` 目录。

## 适用场景

- 修改 `AppHeader` 顶部布局（左/中/右三段结构、标题、样式）
- 修改任务下拉选择（`TaskSelect`）：任务列表、URL `taskId`/`taskName` 同步、`supportTask` 派发
- 修改实时公告滚动条（`Notice`）：30s 轮询、横向滚动、Resizer 重复片段
- 修改响应级别模块（`response-level` + `mission-item`）：政府/省级/市级响应等级、颜色映射、`mission-item` 颜色 / 字号 / 倒角等样式
- 调整轮询间隔、URL 参数处理、与 `widgetFields.supportTask` 全局字段的联动

## 文档索引

按组件快速跳转：

| 需求                                                  | 文档                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| 顶部三段布局、背景色、标题、整体挂载                  | [components/AppHeader.md](components/AppHeader.md)                  |
| 任务下拉、`supportTask` 全局派发、URL 参数同步         | [components/TaskSelect.md](components/TaskSelect.md)                |
| 任务名只读展示（已注释）                              | [components/TaskNameView.md](components/TaskNameView.md)            |
| 实时公告滚动条、30s 轮询、ResizeObserver 自动重复片段  | [components/Notice.md](components/Notice.md)                        |
| 响应级别容器，绝对定位与 `supportTask.eventId` 接入   | [components/ResponseLevel.md](components/ResponseLevel.md)          |
| 政府/省/市级响应等级块、颜色 / Tooltip / 数据请求      | [components/MissionItem.md](components/MissionItem.md)              |
| Header 相关 API（任务列表、公告轮询）                 | [components/Apis.md](components/Apis.md)                            |

## 文件位置

```text
apps/main/app/components/header/
├── index.tsx                                # 顶部 AppHeader 主组件（左/中/右三段布局）
├── TaskSelect.tsx                           # 任务下拉选择（请求任务列表 → 派发 supportTask）
├── TaskNameView.tsx                         # 任务名只读展示（当前在 AppHeader 中已注释）
├── Notice.tsx                               # 实时公告滚动条（30s 轮询 + ResizeObserver）
├── response-level/
│   ├── index.tsx                            # ResponseLevelV2 容器，绝对定位 top:-5 left:850
│   ├── index.css                            # .ResponseLevelV2----root 全局样式
│   └── mission-item/
│       ├── index.tsx                        # MissionItem：政府/省/市级响应三段
│       └── index.css                        # .mission-item 局部样式
└── README（如需补充可加）
```

## 全局依赖

- **状态字段**：`widgetFields.getField("supportTask")` —— 形态为 `{ id, name, wdId, eventStartTime, eventEndTime }`
  - 由 `TaskSelect` 在 `onSuccess` 与 `onChange` 中派发
  - 由 `ResponseLevelV2` 透传 `id` 给 `MissionItem` 作为 `eventId`
  - `TaskNameView`（注释中）从 `supportTask.name` 读取展示文本
- **公共组件/工具**：`ahooks`（`useRequest` / `useSetState` / `useMemoizedFn`）、`antd`（`Select` / `Tooltip`）、`styled-components`、`next/image`、`lodash-es`
- **样式辅助**：`@/utils/cx`、`../style.header`（`styles.header` class）

## 关键速记

### 顶部三段布局（[AppHeader](components/AppHeader.md)）

```text
左：TaskSelect  (任务下拉，minWidth 200, height 50)
中：绝对定位 title「广 东 移 动 应 急 保 障」48px
右：绝对定位 Notice  (公告滚动条 1580×52)
+  浮动：ResponseLevelV2  (top:-5 left:850)
```

### 任务切换流程

```text
URL ?taskId=xxx  →  TaskSelect.useRequest
                →  setState(taskId, taskName)
                →  dispatch(widgetFields.supportTask, {id, name, wdId, eventStartTime, eventEndTime})
                →  订阅者(TaskNameView / ResponseLevelV2) 自动更新
```

详见 [TaskSelect.md](components/TaskSelect.md)。

### 公告滚动实现

```text
useRequest(getNoticeApi, pollingInterval: 30s)
  ↓
ResizeObserver(realNoticeRef)
  ├── scrollWidth > clientWidth? → showDuplicate=true (拼接第二份片段)
  └── 启动 requestAnimationFrame: translateX(-offset) 累计 0.3px/帧，到 offsetMax 归零
```

详见 [Notice.md](components/Notice.md)。

### 响应级别四色映射

```text
Level 1  →  红   rgba(255,88,87)   / bg rgba(255,38,35,.22)
Level 2  →  橙   rgba(249,144,42)  / bg rgba(255,147,11,.2)
Level 3  →  黄   rgba(255,237,0)   / bg rgba(255,237,0,.2)
Level 4  →  蓝   rgba(11,217,255)  / bg rgba(22,153,241,.2)
未匹配   →  白   "rgba(255,255,255,1)"
```

详见 [MissionItem.md](components/MissionItem.md)。

### viewItemId 三件套（`MissionItem`）

```text
viewItemId: "government-response"  →  政府响应
viewItemId: "province-response"    →  省级响应
viewItemId: "region-response"      →  市级响应（按 level=1..4 分组统计）
均挂 viewPageId: "guarantee-left-page"，args: { emerEventId: eventId }
轮询间隔取自 useEnvironment("gd-emergency-support.modules.security-mission.request").interval 默认 300s
```

## 相关入口

- `apps/main/app/components/header/index.tsx`：Header 入口（`AppHeader`）
- `apps/main/request/header.ts`：`getGuaranteeTaskListApi`、`getNoticeApi`
- `apps/main/app/components/fields.ts`：`widgetFields.supportTask`
- `apps/main/public/config/environment.json`：`gd-emergency-support.modules.security-mission.request.interval`

## 常见修改流程

### 调整顶部布局 / 标题

- 改 [components/AppHeader.md](components/AppHeader.md) 中描述的三段结构
- 背景色 / zIndex 集中在 `index.tsx` 第 14–15 行

### 调整任务下拉

- 见 [components/TaskSelect.md](components/TaskSelect.md) "修改任务列表" 段落
- 注意：任务变更目前已去掉 `Modal.confirm` 二次确认，切换即时生效

### 调整公告滚动

- 见 [components/Notice.md](components/Notice.md) "滚动参数" 段落
- 调速：改 `runState.deltaOffset`；改轮询：改 `pollingInterval`

### 调整响应级别样式

- 见 [components/MissionItem.md](components/MissionItem.md) "样式表" 段落
- 全局容器样式在 [components/ResponseLevel.md](components/ResponseLevel.md) 的 `response-level/index.css`

## 版本信息

记录本 skill 的变更历史。各组件的源文件版本与变更历史，详见 `components/` 目录中对应文档末尾的「版本信息」节。

- 项目：`oss-visual-gd-emergency-support-next`

| 版本    | 日期       | 变更说明 |
| ------- | ---------- | -------- |
| v1.0.2  | 2026-06-17 | 同步公告滚动 BUG 修复文档：判断式与 `offsetMax` 调整 |
| v1.0.1  | 2026-06-17 | 路径改为项目根相对；为 7 个组件文档追加「版本信息」节（维护模板） |
| v1.0.0  | 2026-06-17 | 初始版本（SKILL.md 索引 + 7 个组件说明文档） |
