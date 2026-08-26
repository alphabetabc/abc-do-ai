# 后端开发规范 (Backend Conventions)

适用于北京移动指挥调度模块（cmd-dispatcher）的后端代码开发。

> 注：本项目当前暂无服务端（详见 [001-pm-output.md](./001-pm-output.md) §六），本规范作为未来接入服务端时的预留约定。

## 涉及目录

- `src/controller/` —— HTTP 控制器与路由
- `src/socket/` —— Socket / WebSocket 连接与消息分发
- `src/service/` —— 业务服务
- `src/mock/` —— Mock 数据
- `src/interface/` —— TypeScript 类型定义

---

## 1. 命令定义

- 统一使用枚举 / 常量集中维护命令类型，避免硬编码字符串散落各处。
- 命令命名遵循 `业务域.动作` 形式，例如：`dispatch.start`、`dispatch.cancel`、`dispatch.redirect`。

## 2. 处理器注册

- 采用「注册表 + 分发器」模式：每个命令一个 handler，统一在注册中心注册。
- handler 应保持单一职责，复杂流程可拆分为子步骤。
- 异步处理需捕获异常并通过统一的错误通道回传。

## 3. 分发路由

- 路由匹配优先级：精确命令 > 命名空间通配 > 默认兜底。
- 路由失败必须落到默认处理器，避免静默丢弃。
- 新增页面路由时，需在 `src/controller/index.ts` 增加 `@Get('/xxx')`。

## 4. 数据与协议

- 入参 / 出参结构统一在 `src/interface/detail.ts` 中定义类型。
- Mock 数据放在 `src/mock/` 对应业务子目录下，保持与正式接口结构一致。

## 5. 联调与日志

- 关键命令需在 `src/socket/Socket.ts` 中打印 `command`、`payload`、`traceId`。
- 联调时优先复用 `public/static/mock/` 下已有数据，减少前后端阻塞。

## 已有基础

- `src/socket/Socket.ts` —— Socket 连接与消息分发基础
- `src/controller/api.ts` —— 控制器层
- `src/mock/detail.ts` —— Mock 数据

---

## 文档元信息

> 版本：v1.0.0
> 日期：2026-08-24