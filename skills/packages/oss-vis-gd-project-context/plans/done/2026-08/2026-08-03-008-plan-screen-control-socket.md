# Plan-008：screen-control-socket → 新文件 + 修正 architecture.md

> **日期**：2026-08-03
> **性质**：执行子计划（[Plan-005](./2026-08-03-005-plan-web-components-docs.md) 第 3 子项）
> **目标目录**：`web/components/socket/`
> **输出**：
> - 新文件：`docs/design/realtime-protocol/screen-control-socket.md`
> - 更新：`docs/design/realtime-protocol/README.md`（索引追加）
> - 副作用：修正 `docs/design/architecture.md` §2.3「本仓库不含视图组件代码」表述

---

## 0. 背景

`web/components/socket/` 的 `ScreenControlSocket` **不是 BFF ↔ 浏览器的实时数据通道**（那是 `@midwayjs/socketio` + `src/socket/Socket.ts`，见 `docs/design/realtime-protocol/README.md`）。

它是大屏**操控端↔大屏屏端**的同进程 WebSocket 客户端（端口 9032，**与 BFF 同进程**），用于：

- 操控端发指令给指定屏端（见 `Widget.tsx#L95-L105` 的 `dispatch`）
- 屏端 useMessageChange 订阅指令（见 `Widget.tsx#L85-L93`）

`realtime-protocol/README.md` 当前仅占位，**未描述此通道**。本子计划补齐它，并修正 `architecture.md` §2.3 与事实不符的过时表述。

## 1. 目标

| 输出 | 主题 |
|---|---|
| `docs/design/realtime-protocol/screen-control-socket.md` | 操控端↔大屏屏端 WebSocket 客户端实现细节、消息协议、订阅语义、与 BFF 实时通道的边界 |
| `docs/design/realtime-protocol/README.md` | 在「计划产出」表格追加此文件链接；在 §5 关联文档追加 |
| `docs/design/architecture.md` §2.3 | 修正「本仓库不含视图组件代码」为「**视图组件在 `web/components/`、`web/pages/`、`web/hooks/`，由本仓库维护**」（事实修正，与 `tech-stack.md §2.4` 一致） |

## 2. 源文件（已读）

- `web/components/socket/index.tsx` （`ScreenControlSocket` Provider + `useScreenControlSocketContext`）

待补充读：

- `web/hooks/useSocketIOClient.ts` （`useWebSocketClient`：connect / send / onOpen / onMessage 等）
- `web/hooks/useScreenControlMessageChange.ts` （查看 hooks/ 目录下是否有相关 hook；确认调用方）

## 3. `screen-control-socket.md` 大纲

```
§0 TL;DR（同进程 WebSocket，端口 9032，与 BFF 实时通道区分）
§1 角色与边界
   - 操控端：发指令方（控制面板）
   - 大屏屏端：useMessageChange 订阅方
   - 网络层：原生 WebSocket（不走 socket.io），URL `ws://localhost:9032`
   - 与 BFF 实时通道（@midwayjs/socketio + src/socket/Socket.ts）**完全独立**

§2 实现要点
   - 入口：web/components/socket/index.tsx
   - 组件：ScreenControlSocket(enableScreenControl)
   - 客户端：useWebSocketClient('ws://localhost:9032', { manual: true, onClose, onMessage, onOpen, onError })
   - 消息类型：TMessageType = 'open' | 'message' | 'close' | 'error'
   - 数据载荷：{ id?: string, message: any }
   - 内部事件：Symbol('MESSAGE_TYPE') 防 listener 重名

§3 启用与懒连接
   - <ScreenControlSocket enableScreenControl={false}> → 不 connect，children 立即渲染
   - enableScreenControl={true} → useEffect → ws.connect()；initialized 由 onOpen 翻转
   - initialized=false 时 children 不渲染（避免未连接状态泄漏）

§4 订阅与发送
   - useScreenControlSocketContext() 暴露 { useMessageChange, sendMessage }
   - useMessageChange(callback: ({ data, messageType }) => void) → 监听全部 messageType
   - sendMessage(data) → 原样发送

§5 消息协议示例（按 Widget 引擎用法）
   - 屏端 Widget.dispatch({ action: field, data }) → sendMessage({ action, data })
   - 同屏或它屏 Widget.useMessageChange((e) => { if (e.messageType !== 'open') 处理订阅 })
   - 与 interactive bus 区别：socket 跨屏；WidgetInteraction 仅单页 React 树内

§6 端口与网络假设
   - 端口常量 `WS_PORT = 9032`（同 BFF fePort）
   - URL 硬编码 ws://localhost — 操控端与屏端必须同源（开发期同 localhost；生产可改为公网）
   - 不支持鉴权（裸 WebSocket）；生产环境需在网关 / 反向代理层补 Token

§7 失败与降级
   - onClose / onError → emit({ messageType: 'close' | 'error' }) → Widget 自行决定
   - 未启用 enableScreenControl → 整个子树 children 不渲染
   - 服务端不存在 → 屏端 useMessageChange 永远不触发（无重连）

§8 关键文件位置表

§9 与 docs 既有位置的关系
   - 与 docs/design/realtime-protocol/README.md 互补（本文补前端；README 列后端通道）
   - 与 docs/design/architecture.md §2.3 同步
   - 与 docs/design/tech-stack.md §3.3（同进程端口冲突说明）
   - 与 docs/specs/five-major-center（消费方，Widget dispatch 通过 socket 路由）

§10 关联文档
```

## 4. `realtime-protocol/README.md` 改动

- §3「业务实现位置」追加一行：`web/components/socket/index.tsx` —— 前端 ScreenControlSocket（操控端↔大屏屏端）
- §4「计划产出」表格，把 `socket-events.md` 改为已产出（本计划的 socket-events.md）
- §5 关联文档追加 `docs/design/realtime-protocol/screen-control-socket.md`

## 5. `architecture.md` §2.3 修正

把：

```markdown
### 2.3 前端层（fedx-ssr external）

> ⚠️ **本仓库不含视图组件代码**

| 子层      | 来源                                                   | 备注                                                                  |
```

改为：

```markdown
### 2.3 前端层（fedx-ssr external 加载）

> 📌 **视图组件在 `web/`**（本仓库维护），由 fedx-ssr 编译加载：`web/pages/`（页面）、`web/components/`（基础设施：initializer / large-screen / data-scheme / socket / ui）、`web/hooks/`（共用 hooks）、`web/environment/`（环境配置）。

| 子层      | 来源                                                   | 备注                                                                  |
```

并把"⚠️ 本仓库不含视图组件代码"措辞全部移除（grep 验证）。

§0 TL;DR 表中"视图层 | **全部由 fedx-ssr external 加载**；本仓库不含视图组件代码"行，改为：

> "视图层 | 由 `web/` 维护，fedx-ssr 编译加载（详见 `docs/design/large-screen-engine.md`）"

## 6. 执行步骤

| 步 | 动作 |
|---|---|
| 1 | 读 `web/hooks/useSocketIOClient.ts` + `web/hooks/useScreenControlMessageChange.ts` |
| 2 | 写 `docs/design/realtime-protocol/screen-control-socket.md`（按 §3） |
| 3 | 改 `docs/design/realtime-protocol/README.md`（按 §4） |
| 4 | 改 `docs/design/architecture.md` §0 / §2.3（按 §5） |
| 5 | `grep -rn "本仓库不含视图" docs/` 验证无残留 |
| 6 | Rule 2/4 grep 验证 |

## 7. 不做（OUT）

- ❌ 不实现后端 WebSocket 服务端（端口 9032 由谁监听是 infrastructure 范畴，本计划不追）
- ❌ 不修改 `useSocketIOClient` 实现
- ❌ 不重写 `realtime-protocol/README.md` 整文（仅改相关段）

## 8. 完成定义

- [ ] `docs/design/realtime-protocol/screen-control-socket.md` 写入（≥10 节）
- [ ] `docs/design/realtime-protocol/README.md` 已加索引条目
- [ ] `docs/design/architecture.md` §2.3 修订完成 + grep 验证无「本仓库不含视图」残留
- [ ] Rule 2/4 验证通过

## 9. 关联文档

- [Plan-005](./2026-08-03-005-plan-web-components-docs.md)
- `docs/design/realtime-protocol/README.md`
- `docs/design/architecture.md`
- `.trae/rules/docs-authoring-rules.md`

## 10. 修订记录

| 日期 | 修订内容 | 出处 |
|---|---|---|
| 2026-08-03 | 初版 | Plan-005 拆分 |
