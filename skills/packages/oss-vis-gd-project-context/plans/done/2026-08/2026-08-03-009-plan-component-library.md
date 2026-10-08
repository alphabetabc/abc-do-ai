# Plan-009：web/components/ui → component-library.md（API 总册 + 索引）

> **日期**：2026-08-03
> **性质**：执行子计划（[Plan-005](./2026-08-03-005-plan-web-components-docs.md) 第 4 子项）
> **目标目录**：`web/components/ui/`（20 个子目录，~100 文件）
> **输出文件**：`docs/design/component-library.md`
> **颗粒度**（用户决策 2026-08-03）：**API 总册 + 索引**（不逐文件细写）

---

## 0. 背景

`web/components/ui/` 是本项目视图层最大头的横向库——边框 / 装饰 / 图表 / 面板 / 地图 / 视频 / swiper 等。用户决策颗粒度为「API 总册 + 索引」，意味着：

- 每个子目录：1 行说明 + 源文件路径 + 主要导出
- 不展开 props、不复制源码
- 不为子目录写单独 README（保持单文件可索引）

## 1. 目标

1 个 docs/ 文件（`docs/design/component-library.md`），按**功能分组**组织 20 个子目录：

| 分组 | 包含子目录 |
|---|---|
| 边框与装饰 | `border/border-1/`、`border/border-2/`、`decoration/background/`、`decoration/decoration-1/`、`decoration/decoration-2/` |
| 布局与基础 | `center/` |
| 数据展示 | `column-3d/`、`digital-flop/`、`data-status/`、`ind-top-n/`、`table/`、`time-display/`、`vertical-infinite-info/` |
| 图表（ECharts 包装） | `echarts/`、`rc-echarts/{bar3d-line,gauge,horizontal-interval-bar-chart,map,pie-3d}/` |
| 屏顶 / 标题 | `screen-title/`、`titles/title-1/` |
| GIS | `emap-gis/` |
| 地图覆盖 | `rc-echarts/map/overlay/` |
| 视频 | `video/`、`video-flv/` |
| 旋转木马 | `swiper-react-core/` |
| 面板与侧栏 | `panel/`、`side-panel/` |
| 图标 | `svg/` |
| 表单 | `select/` |
| iframe 嵌入 | `iframe-loader/` |

## 2. 源目录清单（共 20 个）

> 来源：本次 LS 输出（`web/components/ui/` 子目录）

1. `web/components/ui/border/border-1/` （`index.tsx`）
2. `web/components/ui/border/border-2/` （`border.tsx` + `index.tsx`）
3. `web/components/ui/center/` （`index.tsx`）
4. `web/components/ui/column-3d/` （`index.tsx` + `index.less`）
5. `web/components/ui/data-status/` （`index.tsx` + `images/empty-image-1.png`）
6. `web/components/ui/decoration/background/` （`index.tsx`）
7. `web/components/ui/decoration/decoration-1/` （`index.tsx`）
8. `web/components/ui/decoration/decoration-2/` （`Triangle.tsx` + `index.tsx`）
9. `web/components/ui/digital-flop/` （`index.tsx` + `StyledGradient.tsx` + `StyledStatistic.tsx`）
10. `web/components/ui/echarts/` （`EChartsComponent.tsx`）
11. `web/components/ui/emap-gis/` （8 个 .ts/.tsx：MapContext、MapView、MapWidgets、MapWidgetPoints、MapWidgetRegionOutline、MapWidgetFocusPosition、MapWidgetWFSLayer、emap / emap-loader / emap-scheduler、hooks、styled-root）
12. `web/components/ui/iframe-loader/` （`index.tsx` + `index.less`）
13. `web/components/ui/ind-top-n/` （`Container.tsx` + `Item.tsx` + `index.tsx` + `index.less`）
14. `web/components/ui/panel/` （`PanelHeader.tsx` + `index.tsx` + `index.less`）
15. `web/components/ui/progress-bar/` （`BarStyledContainer.ts` + `index.tsx` + `index.less`）
16. `web/components/ui/rc-echarts/` （多个子目录 + `ReactIntersectionObserver.tsx` + `utils/`）
17. `web/components/ui/screen-title/` （`index.tsx`）
18. `web/components/ui/select/` （`index.tsx`）
19. `web/components/ui/side-panel/` （`index.tsx` + `index.less` + `types.ts`）
20. `web/components/ui/svg/` （`Svg.tsx` + `index.tsx`）
21. `web/components/ui/swiper-react-core/` （多个 .ts/.tsx）
22. `web/components/ui/table/` （`index.tsx` + `index.less`）
23. `web/components/ui/time-display/` （`index.tsx` + `index.less`）
24. `web/components/ui/titles/title-1/` （`index.tsx`）
25. `web/components/ui/vertical-infinite-info/` （`Item.tsx` + `index.tsx` + `index.less` + `images/broadcast-icon.png`）
26. `web/components/ui/video/` （`index.tsx` + `index.less`）
27. `web/components/ui/video-flv/` （`index.tsx`）

> 实际上不止 20 个：含嵌套子目录（如 `rc-echarts/` 下还有 7 个子目录），最终条目 ≈30 行。

## 3. 已抽样读的入口文件（确认能力）

- `border-1/index.tsx` —— `<Border1 width height title businessTag children>`（styled-components）
- `border-2/index.tsx` —— SVG `<Border2>`（内部 `Border` + `Svg` 包装）
- `center/index.tsx` —— `<Center flexDirection>` flex 居中容器
- `column-3d/index.tsx` —— `<Column3d width color percent unit value>` d3 渐变 + svg
- `data-status/index.tsx` —— `<DataStatus loading data render emptyDescription>` + `<LazyShow>`
- `digital-flop/index.tsx` —— `<DigitalFlop value precision suffix>` + `<StyledLinearGradient>`
- `echarts/EChartsComponent.tsx` —— `<EChartsComponent imageData style replaceMerge>`（注意：此版本仅是占位 option，业务方不推荐直接用）

> 其余 20+ 个子目录仅在文档中标注能力类型 + 源文件路径；**不展开 props**。

## 4. `component-library.md` 大纲

```
§0 TL;DR（27+ 个 UI 子目录，按 13 组分类）
§1 依赖矩阵（每个组件 group 的核心依赖）
   - 边框/装饰：styled-components + 常量路径
   - ECharts 包装：@fedx-vis/react-echarts（来自 web/components/large-screen/lib） + echarts 5.6
   - GIS：fedx-gis + EMap v2
   - 视频：flv.js / hls（**待 PM 确认实际依赖**）
   - 旋转木马：swiper 11.2.10
   - 面板与侧栏：antd 5
   - 图标：iconfont（`static/iconfont/iconfont.js`）

§2 边框与装饰
   §2.1 `web/components/ui/border/border-1/index.tsx` —— `<Border1 width height title businessTag children>`；styled-components `<fieldset>` + `<legend>` + CSS `::before/::after` 装饰
   §2.2 `web/components/ui/border/border-2/{border.tsx,index.tsx}` —— SVG `<Border2>`；内部 `<Border>` + `<Svg>` 容器；`defaultSize` 由 `border.tsx` 暴露
   §2.3 `web/components/ui/decoration/background/index.tsx` —— 装饰背景
   §2.4 `web/components/ui/decoration/decoration-1/index.tsx` —— 装饰 1
   §2.5 `web/components/ui/decoration/decoration-2/{Triangle.tsx,index.tsx}` —— SVG 三角组合

§3 布局与基础
   §3.1 `web/components/ui/center/index.tsx` —— `<Center flexDirection>` flex 居中容器（styled-components）

§4 数据展示
   §4.1 `web/components/ui/column-3d/index.tsx` + `index.less` —— `<Column3d width color percent unit value>`；d3 scaleLinear + svg polygon（3D 视觉）
   §4.2 `web/components/ui/digital-flop/{index.tsx,StyledGradient.tsx,StyledStatistic.tsx}` —— `<DigitalFlop value precision='auto' suffix>`；react-countup 数字滚动 + `<StyledLinearGradient>` 渐变包装
   §4.3 `web/components/ui/data-status/index.tsx` + `images/empty-image-1.png` —— `<DataStatus loading data render emptyDescription>` + `<LazyShow>`；包 `fedx-ui` 的 `DataStatusUI`
   §4.4 `web/components/ui/ind-top-n/{Container.tsx,Item.tsx,index.tsx,index.less}` —— 排名列表（Container + Item 组合）
   §4.5 `web/components/ui/table/index.tsx` + `index.less` —— 表格
   §4.6 `web/components/ui/time-display/index.tsx` + `index.less` —— 时间显示
   §4.7 `web/components/ui/vertical-infinite-info/{Item.tsx,index.tsx,index.less,images/broadcast-icon.png}` —— 竖向无限滚动信息列表
   §4.8 `web/components/ui/progress-bar/{BarStyledContainer.ts,index.tsx,index.less}` —— 进度条

§5 图表（ECharts 包装）
   §5.1 `web/components/ui/echarts/EChartsComponent.tsx` —— ⚠️ 占位 option 实现，**不推荐生产使用**；业务统一用 `rc-echarts/*`
   §5.2 `web/components/ui/rc-echarts/`
      §5.2.1 `ReactIntersectionObserver.tsx` —— IntersectionObserver 包装（用于图表懒加载）
      §5.2.2 `bar3d-line/`, `gauge/`, `horizontal-interval-bar-chart/`, `map/`, `pie-3d/` —— 5 类图表，每类 `index.tsx` + `utils.ts`
      §5.2.3 `utils/{calculateYAxisRange.ts,index.ts}` —— Y 轴范围计算工具
      §5.2.4 `map/{index.tsx,option.tsx,images/texture-map-1-2.png,overlay/index.tsx}` —— 地图 + 覆盖组件

§6 屏顶 / 标题
   §6.1 `web/components/ui/screen-title/index.tsx`
   §6.2 `web/components/ui/titles/title-1/index.tsx`

§7 GIS
   §7.1 `web/components/ui/emap-gis/` —— 整个 GIS 子系统（8+ .ts/.tsx）：
      - `MapContext.tsx` —— 地图 Context
      - `MapInstanceRef.tsx` —— 地图实例 ref
      - `MapView.tsx` —— 地图视图
      - `MapWidgets.tsx` + `MapWidgetFocusPosition.tsx` + `MapWidgetPoints.tsx` + `MapWidgetRegionOutline.tsx` + `MapWidgetWFSLayer.tsx` —— 5 个地图 widgets
      - `emap.ts` + `emap-loader.ts` + `emap-scheduler.ts` —— EMap 加载 / 调度
      - `hooks.ts` —— GIS hooks
      - `styled-root.tsx` —— 根样式

§8 视频
   §8.1 `web/components/ui/video/index.tsx` + `index.less` —— 视频播放器（具体实现库**待 PM 确认**）
   §8.2 `web/components/ui/video-flv/index.tsx` —— FLV 流播放（**未在 package.json 发现 flv.js 依赖**，待代码核实是否动态加载）

§9 旋转木马
   §9.1 `web/components/ui/swiper-react-core/` —— 完整 swiper 11 包装（**自研 React 适配层，不依赖 swiper/react**）
      - `index.tsx`, `swiper.tsx`, `swiper-slide.tsx`, `virtual.tsx`, `context.tsx`, `get-children.tsx`, `types.ts`
      - `shared/`：`get-changed-params.ts`, `get-params.ts`, `mount-swiper.ts`, `params-list.ts`, `update-on-virtual-data.ts`, `update-swiper.ts`, `utils.ts`

§10 面板与侧栏
   §10.1 `web/components/ui/panel/{PanelHeader.tsx,index.tsx,index.less}` —— 面板（PanelHeader + Panel 主壳）
   §10.2 `web/components/ui/side-panel/{index.tsx,index.less,types.ts}` —— 侧边面板

§11 图标
   §11.1 `web/components/ui/svg/{Svg.tsx,index.tsx}` —— SVG 尺寸容器

§12 表单
   §12.1 `web/components/ui/select/index.tsx` —— 下拉选择

§13 iframe 嵌入
   §13.1 `web/components/ui/iframe-loader/{index.tsx,index.less}` —— iframe 加载器（含 loading 占位）

§14 不在本目录的等价 UI（避免重复说明）
   - antd 5.26.7 + fedx-ui 2.1.5 提供的基础控件（Button / Input / Form / Table / Modal / Drawer / Dropdown 等）：见 `docs/design/tech-stack.md §2.2`
   - `digital-flop` 在 `web/components/ui/digital-flop/index.tsx` 与 `web/components/large-screen/` 内部多次重导出，**用法等价**但路径不同——业务方使用 `web/components/ui` 公共入口
   - `echarts/EChartsComponent.tsx` 是占位实现，**所有真实图表走 `rc-echarts/*`**

§15 与 docs 已有位置的关系
   - 与 `docs/design/tech-stack.md §2.2/§2.3` 依赖对应
   - 与 `docs/design/large-screen-engine.md §5` Widget 引擎引用（如 `<DigitalFlop>` 在 Widget 中的 mount 形式）
   - 与 `docs/specs/five-major-center/as-is-architecture.md` 引用（具体 widget 用到哪些 ui 子组件）
   - 与 `docs/design/api-contracts.md` 不直接关系（UI 纯展示）

§16 关键文件位置表（总览）

| 子目录 | 源文件 | 备注 |
|---|---|---|
| 表中项目 ≈ 30 个子目录 + sub-sub 直接列表，见上面的分组章节 | | |

## 5. 执行步骤

| 步 | 动作 |
|---|---|
| 1 | 抽样补读 emap-gis 全 8 个 .tsx/.ts 的入口（MapView.tsx 必读；其余查 exports） |
| 2 | 抽样补读 swiper-react-core/index.tsx、swiper.tsx |
| 3 | 在 `video-flv/index.tsx` 与 `video/index.tsx` 中确认是否引用 flv.js / hls（验证 package.json 未列入的事实） |
| 4 | 写 `docs/design/component-library.md`（按 §4 大纲 17 节；表格化呈现，不展开 props） |
| 5 | 在 `docs/design/README.md` 索引表追加 1 行 |
| 6 | Rule 2/4 grep 验证 |

## 6. 不做（OUT）

- ❌ 不为每个 UI 子目录写单独 README（用户决策：单文件可索引）
- ❌ 不展开 props 表（按用户决策颗粒度）
- ❌ 不重写 `digital-flop` / `center` 等组件代码（**事实记录，不实施重构**）
- ❌ 不写 antd/fedx-ui 内部组件文档（已在 `tech-stack.md`）
- ❌ 不替 PM 决定 swiper-react-core 是不是"应替换为 swiper/react"（保留代码事实）

## 7. 完成定义

- [ ] `docs/design/component-library.md` 写入（≥17 节）
- [ ] 所有 ui 子目录都在文档中有索引行（≥27 行项目）
- [ ] `docs/design/README.md` 索引追加
- [ ] Rule 2/4 验证通过

## 8. 关联文档

- [Plan-005](./2026-08-03-005-plan-web-components-docs.md) 上游
- `docs/design/large-screen-engine.md` 引擎层
- `docs/design/tech-stack.md` 依赖与版本
- `.trae/rules/docs-authoring-rules.md`

## 9. 修订记录

| 日期 | 修订内容 | 出处 |
|---|---|---|
| 2026-08-03 | 初版 | Plan-005 拆分 |


