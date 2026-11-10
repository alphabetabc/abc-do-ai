# Task · 2026-11-09-041-chart-basics-batch

> Epic task-035 第 2 批 · 子卡批次 2/4「图表基建 + 卡片底座」。源项目：`oss-mtc-transition-ln/frontend/src/components/large-screen/`。覆盖 db `module_survey` #75 / #76 / #78 / #79 / #86 / #72 六行 `queued`。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-09-041-chart-basics-batch` |
| Status | 已完成 |
| 类型 | feature |
| 影响范围 | `docs/materials/components/rc-echarts/echarts-hor-bar/`、`echarts-ver-bar/`、`echarts-pie/`、`echarts-radar/`；**现有 `echarts-map/`（增量并入 ec-map 差异能力）**；`docs/materials/components/ui/ui-info-card/`；本 epic 卡索引 |
| 验收标准 | 5 个新物料四件套齐全 + `echarts-map` 增量更新（4 个 Props + spec/data-model + 交互示例）+ `pnpm build` 通过 + `pnpm dev:preview` 各页面渲染 console 无 error + db #72/#75/#76/#78/#79/#86 落 distilled |
| 前置依赖 | 040 批次（基建剩余）先行——ui-info-card 与 ec-map 是业务模块的通用底座 |

## 目标

一次性蒸馏图表基建 6 件：横条图、竖柱图、饼图、雷达图（echarts 系，4 个新物料）+ 信息卡片容器（通用底座）+ ec-map（与现有 `echarts-map` 同源，**并入而非新建**），形成业务模块可复用的图表层。

## 逐模块清单

| # | 模块 | db | 源路径 | 产物路径 | 关键处理 |
| --- | --- | --- | --- | --- | --- |
| 1 | hor-bar-chart | #75 | `frontend/src/components/large-screen/hor-bar-chart` | `components/rc-echarts/echarts-hor-bar` | 源为自绘 DOM + CSS 条形图（非 echarts），逻辑等价迁移仍归 rc-echarts 分组（spec 写明「非 echarts 实现」避免误导）；保持 `HorBarItem` / `HorBarChartProps`，追加配色 / 间距 / 标签样式 Props；spec「相关物料」**交叉引用** `horizontal-interval-bar-chart` 并写选择依据（要 DOM 级标签控制 → hor-bar；要多系列错位 → interval-bar），后者 spec 同步反向引用 |
| 2 | ver-bar-chart | #86 | `frontend/src/components/large-screen/ver-bar-chart` | `components/rc-echarts/echarts-ver-bar` | `echarts-for-react` + `echarts`（物料站已有 3.0.6 / 6.1.0）→ 直接使用；保持 `VerBarGradientStop` / `VerBarSeries` / `VerBarGroup` / `VerBarChartProps`；单文件 1025 行，实现期建议拆分 option 构造与容器渲染（同物料内相对 import）；spec「相关物料」**交叉引用** business `chart-bar-pie`，写明分层定位（本物料为通用分组柱件，chart-bar-pie 为 section 组合件，其柱部分可由本物料充当） |
| 3 | pie-chart | #78 | `frontend/src/components/large-screen/pie-chart` | `components/rc-echarts/echarts-pie` | `echarts-for-react` 使用；保持 `PieChartDataItem` / `PieChartProps`；4 张贴图（pie-bg / pie-center / legend-path / pie-demo）→ 占位图走 `_assets/` |
| 4 | radar-chart | #79 | `frontend/src/components/large-screen/radar-chart` | `components/rc-echarts/echarts-radar` | `@ant-design/plots`（物料站未装）→ 按 2026-11-06 拍板**改写为 echarts radar 直线段**（官方文档核实 9/10 特性原生覆盖、indicator.max 更优，仅 smooth 不支持，用户接受直线段；零新依赖不引入 plots）；保持 `RadarChartIndicator` / `RadarChartSeriesDataItem` / `RadarChartSeries` / `RadarChartProps` |
| 5 | info-card | #76 | `frontend/src/components/large-screen/info-card` | `components/ui/ui-info-card` | 纯 react + CSS，无外部依赖；保持 `TitleBgType` / `InfoCardProps`，追加标题底图类型 / 内容区对齐 Props；2 张标题底图 → 占位图走 `_assets/` |
| 6 | ec-map | #72 | `frontend/src/components/large-screen/ec-map` | 并入现有 `components/rc-echarts/echarts-map`（**取消新建**，2026-11-09 用户拍板） | 源 `ec-map` 与现有 `echarts-map` 物料为**同源组件**（`useECMapOption` / `overlay` / `useCreateOverlayContext` / `mapConfig` 解析逻辑一一对应，现有物料即该族源码的 Props 化蒸馏产物）；仅把源版多出的 4 个能力点增量并入现有物料：`visualMap` Props、`geoSelectedMode` + `onGeoSelectChanged`（geo 原生选中）、`onBlankClick`（zrender 空白点击）、`onDblClick`（双击下钻，含 stale-closure 修复注释）；同步更新 `echarts-map` 的 spec.md / data-model.md Props 表并补交互示例；db #72 matched_material 指向 `echarts-map` |

## 本批通用约定（2026-11-09 用户拍板）

- **分组与命名**：基础 UI → `components/ui/ui-*`；echarts 图表 → `components/rc-echarts/echarts-*`；大屏业务 → `business/*`
- **Props 化**：允许为可配置性新增 Props（配色 / 尺寸 / 位置 / 数据形态等），偏离 distill-workflow「不新增 Props」不变式，属用户批准的例外；新增项逐条记入 `spec.md`
- **图片**：源站贴图一律不搬运，占位图统一走 `docs/materials/_assets/` 共享目录
- **import**：跨物料引用一律别名 `@/materials/**`；同物料内相对路径

## 不做清单

- 不改源项目代码（只读勘察）
- 不搬运源站真实接口地址 / 密钥（数据一律 mock 化）
- 不跨物料 import（组合关系走 examples 演示）
- 零新 npm 依赖（`@ant-design/plots` 不引入；echarts 系用站内已有版本）
- 不做 request / polling 层

## 步骤

1. 逐模块蒸馏四件套；radar 走 echarts 直线段重写并对照源指标映射（indicator / series / max）；ec-map 的 4 个差异 Props 增量并入现有 `echarts-map` 物料（spec / data-model / 示例同步更新）
2. `pnpm build` + `pnpm dev:preview` 逐页验证（横条 / 竖柱 / 饼 / 雷达 / 地图新增交互 / 信息卡片），console 无 error
3. db 回填：#72 / #75 / #76 / #78 / #79 / #86 → `distilled` + matched_material + reason
4. epic 排队表 + `current-sprint.md` 索引更新 → 归档 `done/2026-11/`

## 验收 checklist

- [x] A1：5 个新物料四件套齐全（echarts-hor-bar / echarts-ver-bar / echarts-pie / echarts-radar / ui-info-card），`manifest.json` 的 category 取自 AGENTS 词表；**不新建 echarts-ec-map**
  - 修正：ui-info-card 经 2026-11-10 用户拍板并入 `ui-widget-shell`（titleBanner + ln-screen-skin 皮肤），独立物料取消——实际新建 4 个（hor-bar / ver-bar / pie / radar），其余两件分别并入既有物料（ui-widget-shell / echarts-map）
- [x] A2：radar 为 echarts 直线段实现（无 `@ant-design/plots` 依赖），指标语义与源一致
- [x] A3：ec-map 4 个差异能力（visualMap / geoSelectedMode+onGeoSelectChanged / onBlankClick / onDblClick）已并入现有 `echarts-map`，spec / data-model Props 表同步，无请求层导出
- [x] A4：`pnpm build` 通过；`pnpm dev:preview` 渲染 console 无 error（用户浏览器确认 + 逐示例实测）
- [x] A5：db 六行落 `distilled` + reason（#72/#75/#76/#78/#79/#86，2026-11-10）；新增 Props 逐条记入 `spec.md`

## 执行进度（2026-11-09）

- [x] #1 echarts-hor-bar（db #75）四件套完成，build + 预览验证通过
- [x] #2 echarts-ver-bar（db #86）四件套完成，build + 预览验证通过（console 无 error）
- [x] #3 echarts-pie（db #78）四件套完成，build + 预览验证通过（console 无 error；贴图占位化 + fullName 死路径修复 + 深蓝底内建，见 spec §6）
  - 2026-11-10 缺陷修复：basic 示例默认 right 对齐 + 450 默认宽下，「退役军官 44.9%」扇区中点落在右半圆，label 引出画布右缘被裁；且该均匀占比数据任意 startAngle 都无法让三个中点全落左半圆。改为 `width={860} height={230} pieAlign="center"`（源站 pie-demo.png 贴图即 label 两侧分布形态），浏览器复验 3 个 label 完整、无换行、console 无 error；spec §7 同步回填
- [x] #4 echarts-radar（db #79）四件套完成，build + 预览验证通过（console 无 error）
  - 按拍板改写为 echarts radar 直线段（零新依赖，不引入 @ant-design/plots）；`indicator.max` 原生覆盖源的归一化 0-100 补偿逻辑（已删除）；Props 面全量保持，`padding` 语义重定义为正值间距（默认 60）、`areaOpacity` 默认统一 0.25，调整逐条记入 spec §6
- [x] #5 ui-info-card（db #76）**已并入现有 `ui-widget-shell`（2026-11-10 用户拍板），独立物料取消**
  - 初版按独立物料蒸馏完成（纯 react + CSS 零依赖；'long' 档死路径修复；`url()` 双引号缺陷修复）；随后用户指出与 widget-shell 结构同构，经讨论拍板：不建 v2、不改名，**原地增强 widget-shell 吸收该形态**
  - 落地：widget-shell 新增 `titleBanner` Prop（'normal'/'long'/'max' 占位图档 + 自定义 URL + 左侧双斜线装饰 + 关闭下边框；`url()` 双引号坑规避经验记入 spec §交互行为）；新增 `examples/ln-screen-skin.tsx`（深蓝 `--ws-*` 变量覆盖 + extra 数值组 + flush 贴边）复刻原 info-card 全部场景；spec.md / data-model.md / manifest.json 同步更新
  - `docs/materials/components/ui/ui-info-card/` 目录已删除；db #76 收口时 matched_material 指向 `ui-widget-shell`
  - 验证：`pnpm build` 通过；浏览器实测 `?m=ui-widget-shell` 5 个示例（含 ln-screen-skin：横幅背景 + 斜线 + 数值 38,654）渲染正常，console 无 error
- [x] #6 ec-map 并入 echarts-map（db #72）完成，build + 预览验证通过（console 无 error）
  - 4 个差异能力增量并入：`visualMap` 透传（option 层）；`geoSelectedMode` + `onGeoSelectChanged`（geo 原生选中，select 样式 + geoselectchanged 解析）；`onBlankClick`（zrender 命中标志 + 容器合成事件兜底判定）；`onDblClick`（解析同 onClick，含 series-map 类型）
  - 事件回调统一 ref 化，规避源项目 stale-closure 根因（dblclick 闭包捕获首帧 props），已写注释并记入 spec/data-model
  - 示例 `visual-map-select.tsx` 四合一（密度着色 + 多选 + 双击下钻 + 空白返回），地图数据为源项目真实辽宁 geojson（210000 十四市 + 210100 沈阳十三区县，用户提议替换手绘广东）；basic / overlay 类示例保留手绘广东（标注坐标按其配准）
  - 浏览器实测：双击沈阳下钻成功且区县真实渲染（canvas 绘制内容 + 区县命中测试），空白点击返回省级，选中变化日志正常，console 无 error
- db 回填统一留待批次收口

## 收口记录（2026-11-10）

- db 六行落 `distilled` + matched_material + reason：#72→echarts-map、#75→echarts-hor-bar、#76→ui-widget-shell、#78→echarts-pie、#79→echarts-radar、#86→echarts-ver-bar（decided_by=user）
- 示例数据全量换源项目真实辽宁 geojson（210000 / 210100，161KB/71KB），手绘广东数据与 guangdong.json 已清理
- visual-map-select 示例布局修正（用户反馈「宽高奇怪」）：地图 flex:1 minWidth:480、日志定宽 300、统一 height 420
- 用户浏览器确认整体效果后批准收口归档

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-09 | 用户 |
| ② 实现验收 | 已验收 | 2026-11-10 | 用户（浏览器确认后批准归档） |

## 关联

> - Epic：./task-2026-11-06-035-big-screen-ln-distill.md
> - 上一批：[task-040 基建剩余](./task-2026-11-09-040-ui-data-status-time-display-enhance.md)
> - 下一批：[task-042 C 合并](./task-2026-11-09-042-petition-c-merge-batch.md)
