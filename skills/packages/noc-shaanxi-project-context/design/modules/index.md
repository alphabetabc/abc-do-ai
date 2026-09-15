# 模块索引

> 模块设计文档随源码持续进化，本索引是 `design/modules/` 的入口。

## 1. chinese-database-adapter — 国产数据库适配

帮助 Node.js 项目适配国产数据库（达梦 DMDB、OceanBase、GaussDB、KingBase 人大金仓、GBase），含本项目 midway / fedx-bff 依赖固定策略。

-   [overview.md](./chinese-database-adapter/overview.md) — 版本兼容矩阵、驱动与 resolutions 固定策略
-   [noc-java-refactor-plan.md](./chinese-database-adapter/noc-java-refactor-plan.md) — NOC Java 重构 / KingBase 现场适配计划

## 2. management-overview-first — 中屏管理总览第一屏

`web/pages/management-overview-first/` 模块的设计原则、子组件文档索引与扩展流程。

-   [overview.md](./management-overview-first/overview.md) — 模块入口与子组件文档索引
-   [principles.md](./management-overview-first/principles.md) — 设计原则、跨子模块工作流、已知差异
-   [how-to-extend.md](./management-overview-first/how-to-extend.md) — 新增 / 更新 / 删除子组件文档流程
-   [components/image-gis.md](./management-overview-first/components/image-gis.md) — 中心区 GIS 组件
-   [government-enterprise-business/](./management-overview-first/government-enterprise-business/overview.md) — 政府企业业务子模块（含 overview-v2 与 Detail 详细文档）

## 3. management-overview-second — 中屏管理总览第二屏（面向模块场景）

`web/pages/management-overview-second/` 模块的整体设计文档：页面架构、widget 布局、视图服务数据通道、子模块速查与隐患下钻需求差距。

-   [overview.md](./management-overview-second/overview.md) — 整体文档（架构 / 布局 / 数据通道 / 子模块速查 / 下钻范式 / 技术债）

## 4. ui-streamer-path — StreamerPath 流光路径组件

基于 Canvas 的流光路径动画组件，支持自定义路径、颜色、线宽、运行次数与 API 控制。

-   [overview.md](./ui-streamer-path/overview.md) — 组件能力、API、使用示例
-   [core-implementation.md](./ui-streamer-path/core-implementation.md) — 核心算法与渲染管线
-   [portable/](./ui-streamer-path/portable/README.md) — 可移植自包含版本（拷贝即用）

## 5. web-request — 前端请求管理模块

`web/services/request/` 统一请求层：axios 实例与环境 URL 解析（direct / discover）、本地 mock 重定向、converter 转换机制、视图服务 API。

-   [overview.md](./web-request/overview.md) — 模块结构、核心机制、使用惯例与技术债
-   [dependencies.md](./web-request/dependencies.md) — 依赖与上游能力：baseCreate、environment、dataScheme（DataSchemeLoader）、CacheLoader、useRequest 依赖链与排查指引

## 6. meta-human — 数字人能力

`web/components/large-screen/meta-human/` 数字人（meta-human-sdk）接入层：SDK 动态加载、Provider / useMetaHumanEffect 指令分发、MetaHumanActions 指令清单、环境配置与调试方式。

-   [overview.md](./meta-human/overview.md) — 能力定位、运行机制、指令清单、页面接入与扩展指引

## 7. data-scheme — 数据方案（数据模板）

`web/components/data-scheme/` 数据方案能力：接口方案管理平台对视图服务请求的 URL 重定向（schemeId → 接口映射 → schemeUrl 模板），含环境配置结构、DataSchemeLoader 加载流程、dataSchemeHelper 解析判定链、与 localMockUrl 的区别及排查指引。

-   [README.md](./data-scheme/README.md) — 能力定位、配置、加载与解析流程、链路示例、排查指引
