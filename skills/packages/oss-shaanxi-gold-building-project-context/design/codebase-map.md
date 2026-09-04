# 项目结构地图（codebase-map）

> 证据日期：2026-09-04（基于仓库实际探查）
> 用途：`env/AGENTS.md` §3 只保留一行简介，详细结构看本文件。
> 维护：目录结构变化时更新；过期 ≥ 90 天在 sprint 评审时确认。

---

## 顶层一览

```
<project-root>
|-- AGENTS.md   ← 业务文档治理宪法（根 agent）
|-- docs/       ← 业务权威文档树
|-- src/        ← Node 中台源码（BFF + 金楼业务）
|-- web/        ← 前端源码（React 大屏）
|-- public/     ← 静态资源（Cesium / DRACO / 三方 GIS 库、字体、geojson）
`-- .agents/    ← 本 skill 所在
```

## docs/ · 业务权威文档

```
docs/
|-- index.md           ← 文档入口
|-- as-is/             ← 现状证据（stack / api / auth-rbac / data-models / routes-menus / known-debt）
|-- design/            ← to-be 设计（system-overview / api-contracts / data-models / tech-stack / decisions/ADR）
|-- specs/             ← 特性交付（index.md 总目录 + NNN-*/ 五件套）
|-- skills/            ← 与栈匹配的 coding / testing 规范（common / frontend-react / backend-python / ai-tools）
|-- standards/         ← coding / security 标准
`-- workflows/         ← SDD / TDD 流程
```

治理规则见仓库根 `AGENTS.md`（权威顺序、硬门禁、目录白名单）。

## src/ · Node 中台（BFF）

```
src/
|-- configuration.ts   ← 应用装配入口
|-- config/            ← 环境配置（config.default.ts）
|-- controller/        ← 路由控制器（api.ts / index.ts）
|-- middleware/        ← 中间件（ErrorHandler）
|-- mock/              ← 全局 mock
|-- service/           ← 全局 service 层
|-- interface/         ← 全局类型定义
`-- modules/
    └── goldBuilding/  ← 金楼业务模块
        |-- constant/   ← 常量与静态数据（buildingData / cityTopo / 列定义）
        |-- controller/ ← 控制器层（告警 / 资源 / GIS / 孪生实例等）
        |-- service/    ← 服务层（与 controller 一一对应的 API 封装）
        |-- mock/       ← 模块级 mock（告警 / 资源 / 环境等）
        |-- entity/     ← 实体定义（alarmSeverityDefine）
        |-- enum/       ← 枚举
        └── utils/      ← 工具函数
```

## web/ · 前端（React 大屏）

```
web/
|-- common/            ← 全局常量 / 枚举 / HOC / 环境变量
|-- components/        ← 业务组件库
|   |-- earth/         ← 三维地球（核心：stage 舞台系统 / store / 编辑器 / hooks）
|   |-- large-screen/  ← 大屏布局框架（Widget 渲染 / 联动）
|   |-- alarm-container/、info-list-panel/、right-side-components/ 等 ← 面板与图表组件
|   `-- transparent-*  ← 透明风格 UI 基件（drawer / modal / table）
|-- pages/             ← 页面（index / gold-building / demo-building-viewer）
|   `-- gold-building/components/ ← 左树 / 搜索 / 光交接箱 / 分光器 / 楼宇查看器
|-- services/request/  ← HTTP 请求封装（instance / request / types）
|-- store/             ← 全局状态
|-- utils/             ← 工具（CacheLoader / formatString）
`-- images/            ← 图片资源
```

## public/ · 静态资源

- `public/libs/cesium/`——Cesium 引擎及其 Workers / Widgets / 贴图
- `public/dt/libs/`——Basis / DRACO 解码器
- `public/dt/static/hdris/`——天空盒与 HDRI 环境
- `public/static/`——字体、geojson、GIS 图标
