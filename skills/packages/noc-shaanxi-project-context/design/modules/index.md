# 模块索引

> 模块设计文档随源码持续进化，本索引是 `design/modules/` 的入口。

## 1. chinese-database-adapter — 国产数据库适配

帮助 Node.js 项目适配国产数据库（达梦 DMDB、OceanBase、GaussDB、KingBase 人大金仓、GBase），含本项目 midway / fedx-bff 依赖固定策略。

- [overview.md](./chinese-database-adapter/overview.md) — 版本兼容矩阵、驱动与 resolutions 固定策略
- [noc-java-refactor-plan.md](./chinese-database-adapter/noc-java-refactor-plan.md) — NOC Java 重构 / KingBase 现场适配计划

## 2. management-overview-first — 中屏管理总览第一屏

`web/pages/management-overview-first/` 模块的设计原则、子组件文档索引与扩展流程。

- [overview.md](./management-overview-first/overview.md) — 模块入口与子组件文档索引
- [principles.md](./management-overview-first/principles.md) — 设计原则、跨子模块工作流、已知差异
- [how-to-extend.md](./management-overview-first/how-to-extend.md) — 新增 / 更新 / 删除子组件文档流程
- [components/image-gis.md](./management-overview-first/components/image-gis.md) — 中心区 GIS 组件
- [government-enterprise-business/](./management-overview-first/government-enterprise-business/overview.md) — 政府企业业务子模块（含 overview-v2 与 Detail 详细文档）

## 3. ui-streamer-path — StreamerPath 流光路径组件

基于 Canvas 的流光路径动画组件，支持自定义路径、颜色、线宽、运行次数与 API 控制。

- [overview.md](./ui-streamer-path/overview.md) — 组件能力、API、使用示例
- [core-implementation.md](./ui-streamer-path/core-implementation.md) — 核心算法与渲染管线
- [portable/](./ui-streamer-path/portable/README.md) — 可移植自包含版本（拷贝即用）
