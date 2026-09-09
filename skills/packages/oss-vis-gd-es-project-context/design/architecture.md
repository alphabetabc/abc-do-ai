# architecture.md

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Next.js 16 (App Router)、React 19 |
| 语言 | TypeScript 5 |
| UI | Ant Design 5、styled-components |
| 样式 | Tailwind CSS 4、PostCSS |
| 地图 | EMap v2、WFS / WMS |
| 可视化 | ECharts、ECharts-GL、ECharts-Liquidfill、D3 |
| 状态 | Zustand + immer |
| 请求 | axios、ahooks、SWR |
| 工具 | dayjs、lodash-es、blueimp-md5、react-draggable |
| 包管理 | pnpm workspace（pnpm@9.0.0） |
| 规范 | ESLint 9（@oss/eslint-config） |

## 包边界

```text
apps/main              主应用：大屏入口，端口 3012，PM2 部署
packages/ui            @oss/ui：跨应用共享组件，需在 src/index.ts 导出
packages/eslint        @oss/eslint-config：统一 ESLint flat 配置
packages/docs-api-backend   后端接口文档（权威契约）
packages/docs-custom-view   视图服务数据定义、字段、图例规范
packages/docs-gis      GIS 图层查询与渲染说明
```

主应用通过 transpilePackages 编译 @oss/ui，改组件源码支持热更新。ESLint 配置改动后需重启 IDE 生效。

## 仓库结构概要（apps/main/app）

各功能模块的详细维护文档索引见 `design/modules/README.md`。

- `components/header`：任务选择、通知、响应级别。
- `components/left`：响应级别、值班排班、风险预警、应急资源、实时影响、保障进度、调度任务。
- `components/center`：区域选择 + 双 GIS 视图（dispatch-gis 应急传输 / warn-gis 预警感知）。
- `components/right`：网络规模、乡镇受损、调度任务、Tab 切换。
- `components/ui`：通用组件（emap-gis 地图底座、styled-*、box、data-status 等）。
- `common/`：initializer、环境、地图配置；`hooks/`：自定义 hooks。

关键共享文件：`app/components/fields.ts`（跨模块交互字段注册表）、`app/store.ts`。

## 关键决策

- 大屏适配：5760×1080 设计稿，CSS 变量等比缩放，不按断点响应式。
- 地图底座：apps/main/app/components/ui/emap-gis 统一承载 EMap 加载、WFS 图层、动画点、弹窗；业务 GIS 组件（dispatch-gis、warn-gis）复用该底座。
- 数据获取：类型化请求层 + SWR/ahooks，轮询用 useIntervalTimer。
- 运行时配置：public/config/ 下 default / prod / environment 三层。
- 部署：apps/main/ecosystem.config.js（PM2）。
