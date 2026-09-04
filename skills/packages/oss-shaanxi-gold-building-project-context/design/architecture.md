# architecture.md · 技术栈 + 模块边界

> **init 草稿 · 待显式确认后生效**（2026-09-04 init）
>
> 证据来源：`package.json`、`docs/as-is/stack.md`、`docs/as-is/known-debt.md`、`docs/design/architecture.md`。
>
> 本文件只描述本项目当下的技术栈与模块边界；任何「计划换成 xxx」写到 `docs/specs/{编号}/spec.md` 的「相对 as-is 的差距」段。

---

## 技术栈总览

> 版本取自 `package.json`；仓库采用 pnpm 单仓（非 monorepo，无 `packages/`、`apps/`；`src/` 为 BFF、`web/` 为前端）。

| 层 | 选型 | 版本 | 备注 |
| --- | --- | --- | --- |
| 运行时 | Node.js + MidwayJS 3 | `@midwayjs/core@3.11.11` | BFF/SSR 同进程；Koa 适配 |
| 语言 | TypeScript | `^4.0.0` | 严格模式未在仓库根声明（见 `docs/as-is/known-debt.md` §4） |
| 包管理 | pnpm | `8.6.2` | `packageManager` 字段已锁 |
| 前端框架 | React + React DOM | `18.1.0` / `18.1.0` | SSR 渲染 |
| 路由 | react-router-dom | `5.2.0` | 与 React 18 配套 |
| UI 组件库 | antd + `@ant-design/pro-components` | `5.1.2` / `^2.6.48` | + `fedx-ui@2.1.6` 内部包 |
| 3D 渲染 | cesium + fedx-3d-renderer | `1.111.0` / `0.3.73` | + `@fedx-gis3d/react-cesium@0.0.1` |
| 图表 | echarts + echarts-liquidfill | `^5.5.0` / `^3.1.0` | - |
| 状态管理 | valtio | `1.13.0` | 替代 redux/mobx |
| 数据请求 | @midwayjs/axios | `^3.11.11` | - |
| 后端 ORM | typeorm | `^0.3.17` | `@midwayjs/typeorm@3.11.11` |
| 主库 | mongodb | `^6.8.0` | 动态数据集合 |
| 构建工具 | fedx | 内部 | `pnpm start` / `pnpm build` |
| 进程管理 | pm2 | `^4.5.4` | `pm2.config.js` |
| Lint | eslint + standard-react-ts | `^1.0.5` | - |
| 样式 | styled-components | `^6.1.12` | - |
| SSR 核心 | @fedx-bff-web/ssr-* | `^0.6.x` | 内部 BFF 框架 |

## 模块边界

> 目录结构与各目录职责见 `codebase-map.md`；本节只写跨模块约束（来自 `docs/as-is/stack.md` §2）。

| 模块 | 禁止 |
| --- | --- |
| `src/controller/` | 直连 DB；写业务规则 |
| `src/service/` | 持有 HTTP 上下文（ctx） |
| `src/middleware/` | 写业务规则 |
| `src/modules/goldBuilding/` | 跨特性直接 import；绕开 controller 直接走 service |
| `web/components/` | 持有路由；调 API |
| `web/pages/` | 复用为组件；写通用工具 |
| `web/services/` | 直接 `fetch` 业务接口 |
| `web/store/` | 持久化、IO |
| `public/` | 源码；可执行脚本 |

**模块互斥**：

- 前端组件不得 import `web/pages/*`。
- 后端 service 之间禁止循环依赖；跨特性走 controller / 事件。
- `src/modules/goldBuilding/controller/*Api.ts` 是 BFF 入口，禁止直接在 React 端 import（前端走 `web/services/`）。

## 关键设计决策

- **BFF + SSR 同仓**：渲染与聚合在同一进程（`@fedx-bff-web/ssr-core`）；前端首屏 SSR，交互端 hydration。
- **3D 资产走公共 CDN 路径**：`public/libs/cesium/Assets/`、`public/dt/static/` 静态托管。
- **数据真源暂为 Mock**：`public/static/gis-3d/mock/city/*` 提供城市级 qmd / geojson；接生产 API 后只换 `web/services/` 实现。
- **状态局部化**：UI 状态用 valtio；业务数据走服务端，组件不缓存跨页面状态。
- **公开演示优先**：无 RBAC、无 token；任何引入登录态的方案先开 ADR。

## 依赖管理约束

- 锁定 pnpm 版本：`packageManager: pnpm@8.6.2`。
- `@midwayjs/*` 全部 `^3.11.11`，升级主版本必须先 ADR。
- 内部 BFF 包 `@fedx-bff-web/*` 跟随集团主版本，跨主版本升级需同步升级 `@fedx-bff/core`。
- 🚫 禁引入新的 ORM、状态库、HTTP 客户端（详见 `vision.md` §禁止清单）。
- 🚫 禁引入新的图表库；统一用 ECharts 与 fedx 内部 3D 渲染器。

## C4 Level 2（Component · 按需展开）

-
