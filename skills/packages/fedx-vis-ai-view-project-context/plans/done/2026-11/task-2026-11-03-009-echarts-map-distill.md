# Task · 2026-11-03-009-echarts-map-distill

> 蒸馏 `rc-echarts/map` 为物料站四件套。台账母任务：`./task-2026-11-03-002-component-inventory.md`（rc-echarts 拆项第二张卡）。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-009-echarts-map-distill` |
| Status | 已完成（验收通过，归档） |
| 类型 | docs |
| 影响范围 | `docs/materials/components/rc-echarts/echarts-map/`（新增四件套）、`./task-2026-11-03-002-component-inventory.md`（备注列回填） |
| Roadmap | 阶段 3（蒸馏执行） |
| 验收标准 | 四件套齐全且 `pnpm build` 通过、examples 在 `pnpm dev:preview` 可渲染（含 OverlayItem 定位） |
| 前置依赖 | echarts@^6 + echarts-for-react@^3（已装）；data-status 物料已由同事产出（`docs/materials/components/ui/ui-data-status/`） |

---

## 目标（Goal）

把源项目 `web/components/ui/rc-echarts/map`（EChartsMap：ECharts geo 三层地图 + HTML Overlay 挂件体系）蒸馏为物料站模块 `docs/materials/components/rc-echarts/echarts-map/`，供大屏中央地图位复用。

## 背景与动机

- 台账剩余组件中**真实引用最多**（约 10 处调用，横跨 5 个业务大屏：指挥调度/综合展示/信息枢纽/深圳通信保障/信息管理局，全在中央地图位）
- 前置 data-status 物料已产出，依赖打通
- 是 008 之后 rc-echarts 拆项的第二张卡

## 功能列表

- F1：manifest.json（name/description/tags/category=`map`）
- F2：spec.md（Props 表：adcode/dataSource/geoSilent/geoItemColor/showGeoLabel/tooltip/seriesBuilder/geoBuilder/ecRef/onClick/useRawEvent/getOverlayContainer/context/className/children；OverlayItem Props：longitude/latitude/rootStyle/contentStyle/mutableLngLat/onPositionChange 等）
- F3：data-model.md（TProps 类型、geojson 加载契约（adcode→STATIC_PATH）、OverlayContext 结构、状态流转 loading/success/error）
- F4：code/（index.tsx + overlay/index.tsx + option.tsx + images/texture-map-1-2.png）
- F5：examples/（基础 scatter 地图 + OverlayItem HTML 挂件示例，mock 数据 + 内置 geojson）

## 不做清单

- 不蒸馏 emap-gis（GIS 体系，另立任务）
- 不搬 `~/web/common/map-config`（adcode→名称映射表，物化为例子内 mock 或 Props 化，任务内决策）
- 不实现 `useRequest`/`useSetState`/`useLatest`/`useMemoizedFn` 的完整 ahooks 等价物——按最小面内联实现
- geojson 数据源：源项目走 `${STATIC_PATH}/map/geojson/<adcode>.geojson` 静态服务；物料 example 自带精简 geojson（不依赖外部服务），生产用法在 spec 中说明
- 不引入新 npm 依赖

---

## 步骤（执行计划）

### 步骤 1：四件套产出

- **动作**：提炼 code/（ReactECharts → `echarts-for-react`；`@fedx-web-common` hooks 内联；DataStatus 引用同模块物料无法跨模块 import → 按物料站隔离约定改为模块内自带轻量 status 壳或直接内联）→ spec/data-model/manifest → examples（含 mock + 精简 geojson）
- **输出**：`docs/materials/components/rc-echarts/echarts-map/`
- **等待用户**：否

### 步骤 2：验证

- **动作**：`pnpm build` → `pnpm dev:preview` 确认地图渲染、OverlayItem 定位跟随、无 console error
- **等待用户**：否

### 步骤 3：回填与归档

- **动作**：台账 002 备注 map 行标注完成；更新 current-sprint；归档本卡
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：四件套齐全，manifest category=map
- [x] A2：code/ 可直接 import，无 `~/web`、`@fedx-web-common`、`large-screen/lib` 引用
- [x] A3：`pnpm build` 通过
- [x] A4：examples 在 dev:preview 渲染正常（三层 geo 边框 + scatter + OverlayItem HTML 定位）
- [x] A5：台账 002 对应条目备注已更新

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | user（「执行task009」） |
| ② 实现验收 | 已通过 | 2026-11-03 | user（「这个任务 可以了 就这样吧」） |

---

## 进度日志（按需追加）

### 2026-11-03

- 建卡。源码勘察完成（index.tsx 182 行 / overlay 220 行 / option.tsx 260 行 + 纹理图 1 张）。关键依赖面：`useSetState/useLatest/useMemoizedFn/useRequest`（@fedx-web-common）、`isEmpty/isEqual`（@fedx-web-common/utils）、`classnames`、`~/web/services/request.loadJson`、`~/web/common/map-config`、`~/web/common/constants`、`../../data-status`。
- 引用勘察完成：约 10 处业务调用（五大中心 ×3 + 深圳通信保障 + 信息管理局），用法集中在 EChartsMap + OverlayItem + seriesBuilder/geoBuilder 定制。

### 2026-11-03（实现）

- 四件套产出：`docs/materials/components/rc-echarts/echarts-map/`（manifest / spec / data-model / code{index(export 桶),map,status-shell,option,overlay/index,utils,images} / examples{basic,overlay-html,guangdong.json}）。
- 结构拆分（用户要求）：EChartsMap 主组件放 `code/map.tsx`，状态壳独立 `code/status-shell.tsx`，`code/index.tsx` 只负责 re-export。
- 蒸馏决策落地：
  - hooks/工具（useSetState/useLatest/useMemoizedFn/isEmpty/isEqual/cx）内联到 `code/utils.ts`；useRequest 以 useEffect + cancelled 标志最小实现；
  - ReactECharts → `echarts-for-react`（onChartReady + replaceMerge(['geo','series']) 保留）；
  - geojson 加载契约 Props 化：`loadGeoJson`（默认 fetch `DEFAULT_GEOJSON_URL_TEMPLATE`），示例自带精简手绘广东边界（`examples/guangdong.json`，仅渲染验证用）；
  - `~/web/common/map-config` → `mapConfig` Props；`constants.STATIC_PATH` / window 调试挂载删除；
  - DataStatus 跨模块 import 违反隔离约定 → `index.tsx` 内联 MapStatusShell（loading/success/error）。
- 类型修复 3 轮：Overlay 引擎上下文拆出 `OverlayEngine` 类型；OverlayItemContext.pos 放宽为 `number[] | null`；geojson 扩展名改 `.json`（TS 无法解析 `.geojson` 模块）。
- 验证：`pnpm build` 通过；dev:preview 浏览器验证 PASS（两个示例三层 geo + scatter + 「广州 · 12 站点」等 HTML 挂件渲染，console 无错误；首次浏览器桥偶发超时，复测未复现）。

### 2026-11-03（tab 切换 bug 排查与修复）

- 现象：详情页切走再切回（remount）后，console 报 `matrix.js copy null` TypeError（echarts 6.1.0），地图消失。
- 排查过程（含两次误判，记录备查）：
  - 误判 1：以为是隐藏容器 0 尺寸 → 加 ResizeObserver 门控，无效且引入「啥都看不见」回归，已撤；
  - 误判 2：以为是社区 `echarts-for-react` 卸载竞态（其 'finished' 回调对已 dispose 容器再 init/setOption 确实无守卫）→ 按源项目 `@fedx-vis/react-echarts` 蒸馏了带 isUnmount 守卫 + DPR patch 的 ReactECharts.tsx，仍崩——非根因，该文件已删、换回社区包（用户决策，保持 echarts 6.1.0）。
- 真正根因：`useRegisterMap` 已注册分支（`code/option.tsx`）把 `ec.getMap()` 返回的包裹对象 `{ geoJson, geoJSON }` 错误地包成 `{ data: ... }` 再 resolve，`.then` 拿到非 GeoJSON 本体，重新 `registerMap` 解析不出 features → 空区域。首次挂载走 fetch 分支正常，remount 命中已注册分支才触发。echarts 6 下空区域 → dataRect 0×0 → 奇异矩阵 `matrixInvert` 返回 null → `legacyCopyOverallTrans` 无守卫 copy null 即报错；echarts 5 同 bug 表现为静默空白。
- 修复：`Promise.resolve(registeredMap['geoJson'])` 直接取 GeoJSON 本体（option.tsx 单行改动）。构建 + tab 往返验证通过，用户验收。

---

## 关联

> - 台账母任务：`./task-2026-11-03-002-component-inventory.md`
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
> - 前置物料：`docs/materials/components/ui/ui-data-status/`（同事产出）
