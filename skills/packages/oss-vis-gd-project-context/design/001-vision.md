# 001-vision.md

## 项目定位

广东移动_应急保障可视化大屏（`oss-visual-gd-emergency-support`）：面向应急通信保障场景的可视化大屏前端，覆盖应急保障、五大中心、信息管理局、GIS 入口等多个大屏页面模块。

## 北极星

让开发者能在本仓内快速定位任意大屏模块并按 spec 推进迭代：页面、接口层、mock 一一对应，改动可 lint / build 验证，skill 内设计文档自足可查。

## 禁止清单

- 不编造 API / 字段：接口以 `web/services/` 与 `docs-api-backend/` 为准，查不到写「待定」。
- 不动业务代码除非任务明确要求；文档任务不修改 `web/`、`public/` 业务源码。
- 不引入新第三方依赖解决一次性任务；批处理优先 Node.js 内置 API 脚本（D-13）。
- 不在 skill 内复述 `.trae/rules/` 的硬约束正文，只给指针。
- 大屏数据 mock 与真实接口切换依赖 `baseUrlType` + `localMockUrl` 机制，禁止绕过 `web/services/request/` 直接裸 fetch。

## 关键假设

- 部署目标为 pm2 多进程 + koa-static-cache，静态资源走 `./build` 与 `./public`。
- 大屏终端为固定分辨率浏览器环境，交互以展示为主。
- `docs/` 为对外交付物；skill 内 design 文档为本仓协作的深度事实来源。
