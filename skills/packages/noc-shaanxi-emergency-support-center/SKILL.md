---
name: 'noc-shaanxi-emergency-support-center'
description: '维护 oss-noc-shaanxi 中屏 emergency-support/modules/center 模块（中屏保障中心：TabButton 日常/突发切换、TabContent1 日常保障 Path+GIS、TabContent2 突发保障 GIS、地图图例枚举、widgetFields 派发）。当用户在中屏保障中心目录下新增、修改、排查组件，或修改 TabChangeEnum / LegendEnum / MapTypeEnum 时调用此技能。'
---

# 中屏保障中心模块维护技能（中屏 emergency-support / center）

本技能用于维护 `web/pages/emergency-support/modules/center` 下的"中屏保障中心"模块，涵盖日常保障、突发保障两个 Tab 的地图渲染、图例切换、地市下钻、GIS 弹窗、右屏联动派发等能力。

## 维护原则（必须遵守）

> 这一节是所有后续维护工作的**最高优先级**约束。无论谁（包括我自己）维护这份 skill，都必须遵守。

1. **不幻想（No Fabrication）**
    - 文档里写的**每一条代码、每一个字段、每一行号**都必须能在源文件中找到
    - 不能凭推测写代码逻辑，不能凭记忆写 API 字段
    - 写文档前先 `Read` 实际代码，写完再 `Read` 一次核对
    - 不确定的字段名 / 行号，宁可不写也不要猜

2. **只做增量（Incremental Only）**
    - skill 只记录**当前代码中已存在**的能力
    - 不记录"将来要做""打算做""应该做"的能力
    - 不记录未实现的设计稿 / 方案稿 / 讨论稿里的内容
    - 如果能力**曾被讨论但未实现**，单独标"未实现 / 不要按需求文档去补"，并明确原因

3. **不自以为是优化（No Unsolicited Refactor）**
    - 维护者**不要主动重构**现有代码
    - 不要因为"看起来更优雅"就改写法
    - 不要把 `??` 改成 `||`、`!==` 改成 `===` 之类的小调整
    - 一切以"现状"为准记录，不要把"我认为应该这样"写进去

4. **改代码必同步改文档（Code ↔ Doc 1:1）**
    - 任何代码改动必须**同步**反映在 skill 文档里
    - 同一字段在文档里多次出现时，必须**全部**同步更新
    - 反向：文档改动必须**先**改代码、再改文档（不允许"先改文档占位"）
    - 漂移 review 是每次 skill 升级的**强制步骤**（参见下方「修改 / 排查 checklist」第 6 条）

5. **tab1 ↔ tab2 严格隔离**
    - tab1 的 skill 文档**不写** tab2 内容（包括"计划""对比""差异"），反之亦然
    - 跨 Tab 共有逻辑在各自的文档里**分别记录**，不抽公共文档
    - 唯一的例外：`GisLegend` 跨 Tab 复用（已在「跨 Tab 复用」条目里说明）

6. **不主动查 git（No Unsolicited Git Lookup）**
    - 除非用户**明确**说"同步别人更新""拉一下最新""diff 一下""看 git 状态"等指示，否则不要主动跑 `git status` / `git log` / `git diff` / `git fetch` / `git stash` / `git show` 等命令
    - 用户没说就查 git，会把无关输出塞进上下文、干扰判断、还可能踩到「Git Safety Protocol」红线
    - 维护者只在用户**给出同步信号**时执行 git 类命令；其他时间一律用 `Read` / `Grep` / `Glob` / `SearchCodebase` 读当前 working tree
    - 这条规则对所有维护者（包括我自己）生效

7. **人员信息只在 CHANGELOG 出现（Author Info Goes to CHANGELOG Only）**
    - `SKILL.md` / `references/**/*.md` 的目标读者是「未来想接入/维护/拓展这个模块的工程师」，他们关心**功能本身**——字段含义、组件 props、调用约定、坑点
    - **作者信息（`xxx@boco.com.cn` 之类）一律不进非 CHANGELOG 文档**；作者归属属于 review 轨迹的一部分，写在 [CHANGELOG.md](CHANGELOG.md) 里即可
    - commit SHA 可以出现在非 CHANGELOG 文档——它是「这项能力何时被引入」的功能性背景，不是人员信息；日期、PR 号、邮箱、用户名都不进
    - 例外：CHANGELOG.md 允许写「作者 / 日期 / 全 SHA / commit title」四要素，且仅在「git 锚点」表格与「v?.?」条目标题处出现一次

## 适用范围

- 根目录：`e:\oss-fe-git\phoenix\oss-noc-shaanxi\web\pages\emergency-support\modules\center\`
- 涉及的代码变更都应在此目录内进行；外层目录的修改须显式说明并最小化。

## 目录结构（必须牢记）

```
center/
├── index.tsx                       # 中屏保障中心容器：Tab 切换 + 智能问答 Modal
├── index.less
├── enum.ts                         # TabChangeEnum / LegendEnum / MapTypeEnum
└── components/
    ├── tab-button/                 # 日常/突发切换按钮（读 URL ?tab= 初始化）
    │   ├── Button.tsx              # 样式按钮组件（styled-components）
    │   ├── index.tsx
    │   └── index.less
    ├── tab-content-1/              # 日常保障：省/地市 Path 地图 + 下钻到 GIS
    │   ├── index.tsx               # CenterPath + CenterGis 切换
    │   ├── index.less
    │           ├── images/                 # tab1 专用图片（funnel-bg / event-* / modal-bg 等日常保障）
    │   └── components/
    │       ├── center-path/        # ECharts Path 地图（省/地市气泡）
    │       │   ├── index.tsx       # CenterPath：图例切换、双击下钻、右屏派发
    │       │   └── index.less
    │       └── center-gis/         # 日常保障 GIS 地图
    │           ├── index.tsx       # CenterGis：返回上一层 + 乡镇返回区县
    │           ├── index.less
    │           └── components/
    │               ├── gis/                       # 实际地图渲染
    │               ├── detail/                    # GIS 详情面板
    │               ├── gis-legend/                # GIS 图例
    │               ├── el-tooltip-base/           # 基础 Tooltip 样式
    │               └── el-tooltip-circle/         # 圆形 Tooltip 样式
    └── tab-content-2/              # 突发保障 GIS 地图
        ├── index.tsx               # CenterSuddenGis 壳
        ├── index.less
        └── components/              # 注：tab-content-2 下无 images/ 目录
            └── center-gis/         # 结构与 tab1 对齐，但不是复用——逻辑不同
                ├── utils/
                │   └── buildAggregatedPoints.ts  # tab2 跨图层聚合（独立于 tab1）
                └── components/
                    ├── gis/
                    ├── detail/
                    ├── el-tooltip-base/
                    └── el-tooltip-circle/
```

> 两个 `tab-content-*/components/center-gis/` 目录结构相似，但**没有复用关系**：
>
> - `tab-content-1/center-gis/index.tsx` —— 日常保障 GIS，外层有「返回上一层」、「乡镇地图返回区县」 (`zoneTownSelect`) 等逻辑
> - `tab-content-2/center-gis/index.tsx` —— 突发保障 GIS，仅作为 `<Gis />` 渲染壳，不含返回逻辑
>
> 修改时请严格按目录隔离，不要跨 Tab 抽公共组件，除非用户明确要求重构。

## 核心枚举（enum.ts）

```ts
export enum TabChangeEnum {
    tab1 = 'tab1-日常保障',
    tab2 = 'tab2-突发保障',
}

export enum LegendEnum {
    site = 1, //基站退服
    room = 2, //机房停电
    trans = 3, //传输中断,断电光缆
    bras = 4, //BRAS退服
    olt = 5, //OLT退服
    // line = 6, //专线中断（预留，未启用）
    siteRoom = 7, //物理站退服（曾用名「基站-机房退服」，commit 2bd9eee 改称；中心 Path 上 Radio 显示文字为「物理站退服」，GIS Legend 中 value 1000501 的 Checkbox 名称同样改称）
}

export enum MapTypeEnum {
    path = 1, // 省/地市 ECharts Path 地图
    gis = 2, // GIS 地图
}
```

> 新增图例值时请同步检查 `center-path/index.tsx` 的 `onScatterClick` switch 分支，避免遗漏右屏联动。

## widgetFields 派发约定

来自 `../fields`，所有派发字段名均通过 `widgetFields.getField('xxx')` 获取。常用：

| 字段                                                        | 触发时机                                    |
| ----------------------------------------------------------- | ------------------------------------------- |
| `zoneSelect`                                                | 地图下钻 / 返回上一层 / 初始化省            |
| `center:tabChange`                                          | TabButton 切换                              |
| `centerAreaId` / `centerAreaNeIds`                          | 切回 tab1 时重置                            |
| `rightTabChanged` / `rightSecondTabChanged`                 | 气泡点击 → 切换右屏 Tab                     |
| `rightSecondTabAlarmParams`                                 | 派发告警参数（无线/动环/BRAS/OLT/基站机房） |
| `rightSecondTabTransType` / `rightSecondTabTransZoneParams` | 传输断点联动                                |
| `leftRepairNoticeParams`                                    | 外部抢修等级跳转 GIS                        |

> 修改派发逻辑时，必须先 `Read` `../fields.ts` 确认字段名和约定格式，不要凭记忆写。

## 区域 / 行政区级别

参考 `~/web/services/emergency-support/enum` 的 `ZoneLevelEnum`：

- `province` → `region`（双击省地图下钻到地市）→ `city`（双击地市 → 跳 GIS）→ `town`
- 切换级别时同步更新 `provinceId / regionId / cityId`（provinceId 始终来自 `useEnvironment().province.provinceId`）

## 修改 / 排查 checklist

每次改动请按以下顺序自检：

1. **Tab 容器**：[index.tsx](web/pages/emergency-support/modules/center/index.tsx) — Tab 切换时 `props.currentTabType` 是否正确透传，`useEffect` 派发省 `zoneSelect` 是否仍生效。
2. **TabButton**：[tab-button/index.tsx](web/pages/emergency-support/modules/center/components/tab-button/index.tsx) — URL `?tab=2` 的初始化与切回 tab1 是否重置了 `centerAreaId` / `centerAreaNeIds`。
3. **日常保障 Path**：[center-path/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-path/index.tsx) — 图例 Radio 切换、三类 `useRequest` 的 `ready` 与 `refreshDeps`、双击 `drillMap` 的级别判断、气泡点击 `onScatterClick` 的 switch 分支。
4. **日常 / 突发 GIS**：分别在 [center-gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-1/components/center-gis/index.tsx) 和 [center-gis/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/components/center-gis/index.tsx) 下，乡镇地图返回区县 (`zoneTownSelect`)、返回上一层、`Gis` 子组件 props。
5. **样式 / 图片**：less 文件命名 `<组件目录>/index.less`；图片放 `images/`。引用方式有两种：
    - `center-path/index.tsx` 系列标签背景图：**`import gisXxx from '../../images/gis-xxx.png'`**（webpack 一起打包，使用图片变量直接放到 `backgroundColor.image`）
    - `center-gis/index.{tsx,less}` 根容器的卫星背景（`卫星地图.png` 等是否显示由 `emergencySupportGisConfig.showSatelliteBackgroundMap` 控制）：`<div>` 上挂 `style={{ backgroundImage: showSatelliteBackgroundMap ? \`url(${constants.IMAGE_PATH}/emergency-support/卫星地图.png)\` : '' }}`，并且 `.less` 里只用 `background-repeat / background-position / background-size`，`background-image` 这条写法在 `.less` 里**不要重复**（CSS 会盖过 inline style）
    - `Button.tsx` 使用 `constants.IMAGE_PATH` 拼接 `${constants.IMAGE_PATH}/emergency-support/xxx.png`
6. **skill 文档漂移 review**（每次升级 skill 必做）：
    - `Read` 受影响源文件 → 与文档 1:1 对照
    - 检查所有 prop 是否完整（包括 `false` 默认值）
    - 检查所有 `/* ... */` 占位符、伪代码、`?? / || / !== / ===` 简化
    - 检查所有 `file:///e:/...tsx#L#` 行号引用（行号错位会导致点击跳转失败）
    - 检查 tab1 ↔ tab2 边界（不要混写）
    - 漂移 review 通过后才能 bump 版本号、写 changelog

## 常见操作注意事项

- **新增图例**：先改 `LegendEnum` → 在 `center-path/index.tsx` 的 `Radio.Group` 增加项 → 在 `onScatterClick` switch 增加分支 → 如果需要新 `useRequest`，使用 `~/web/hooks/useIntervalTimer` 的 `TIME_RANGE` + `isDefined` `ready` 守卫。
- **新增 Tab**：在 `TabChangeEnum` 新增键值，修改 `index.tsx` 顶层渲染分支，TabButton 增加按钮。
- **新增图片**：放 `images/` 目录；命名小写连字符（如 `alarm-access1.png`）；如确实需要中文文件名（如 `gis-三角体.png`、`gis-tip背景.png`），仍可在 `import` 形式下使用，但要保证 `import` 路径与文件名一一对应。
- **图片引用**有三种模式，按位置选用：
    - `center-path/index.tsx` 系列 1/系列 2 标签背景图：**`import gisXxx from '../../images/xxx.png'`** → `backgroundColor.image: gisXxx`（commit `94aef85` 之后；之前是绝对路径 `/static/images/emergency-support/xxx.png`，已废弃）
    - `center-path/index.tsx` + 两个 `center-gis/index.tsx` 的**卫星地图背景**：按 `useEnvironment().emergencySupportGisConfig.showSatelliteBackgroundMap` 决定根 `<div>` 是否挂 `style.backgroundImage = url(IMAGE_PATH + '/emergency-support/卫星地图.png')`（commit `2bd9eee` 之后；`.less` 中的 `background: url(...)` 已注释，避免和 inline style 冲突）
    - `Button.tsx`：`constants.IMAGE_PATH` 拼接 `${constants.IMAGE_PATH}/emergency-support/xxx.png`
- **不要** 在此模块直接修改 `~/web/services/emergency-support/` 或上级 `pages/emergency-support/` 容器代码；如确有必要，与用户确认后再改动。
- **跨 Tab 复用**：两个 Tab 的 GIS 组件不应抽公共组件，但 `GisLegend` 是唯一例外——tab2 的 `Gis` 直接从 `../../../../../tab-content-1/components/center-gis/components/gis-legend` 引用。新增复用组件前请与用户确认。
- 修改完必须 `Read` 受影响的 `.tsx / .less` 文件确认类型与样式一致，避免 build 失败。

## 详细组件文档（references）

每个组件的详细文档拆分到 `references/` 目录，便于按需查阅、不污染入口上下文。

### 组件层

- [fields-dispatch.md](references/fields-dispatch.md) — `widgetFields` 派发总表、派发方向、Payload、neType→Tab 映射
- [center-index.md](references/center-index.md) — 中屏容器（index.tsx）：Tab 切换样式、智能问答 Modal、初始化省派发
- [tab-button.md](references/tab-button.md) — 日常 / 突发 Tab 切换：URL `?tab=` 初始化 + 切回 tab1 的重置
- [tab-content-1.md](references/tab-content-1.md) — 日常保障 Tab：Path / GIS 切换状态机、外部抢修跳转
- [center-path.md](references/center-path.md) — `CenterPath` ECharts Path 地图：图例切换、双击下钻、单击气泡派发
- [tab-content-1-center-gis.md](references/tab-content-1-center-gis.md) — 日常保障 GIS 壳组件：返回上一层 + 乡镇回流开关
- [tab-content-1-gis-full.md](references/tab-content-1-gis-full.md) — 日常保障 GIS 实际渲染：6 类图层、网元点击、抢修回流
- [tab-content-1-aggregate-points.md](references/tab-content-1-aggregate-points.md) — **日常保障跨图层跨 neType 聚合**：`rawNeType` 概念、网格桶算法、新 VectorLayer、弹层点击派发
- [tab-content-2.md](references/tab-content-2.md) — 突发保障 Tab 壳
- [tab-content-2-center-gis.md](references/tab-content-2-center-gis.md) — 突发保障 GIS 壳组件（**无返回按钮**，与 tab1 不同）
- [tab-content-2-gis-full.md](references/tab-content-2-gis-full.md) — 突发保障 GIS 实际渲染：区域配置、抢修回流、`pointClick` switch 差异
- [tab-content-2-aggregate-points.md](references/tab-content-2-aggregate-points.md) — **突发保障跨图层跨 neType 聚合**：`rawNeType` 概念、网格桶算法、新 VectorLayer、弹层点击派发

### API 层（HTTP / 视图项接口）

- [api/index.md](references/api/index.md) — 中屏保障中心 API 总览
- [api/center-path.md](references/api/center-path.md) — `getPathMapJson / getPathMapConfigJson / getMiddleMapAlarmDataApiNew / getMiddleMapMachineryRoomDataApi / getMiddleMapTransDataApi`
- [api/tab-content-1-gis.md](references/api/tab-content-1-gis.md) — 日常保障 GIS 全部接口（13 个），含 `pointClick` 详情选择逻辑
- [api/tab-content-2-gis.md](references/api/tab-content-2-gis.md) — 突发保障独有 + 与 tab1 共用接口，`zoneSelect: {}` 模式、缺动环分支等差异

### fedx-gis 层（node_modules）

只整理本项目**实际用到**的导出：

- [fedx-gis/index.md](references/fedx-gis/index.md) — 用到的 import 总览
- [fedx-gis/map-container.md](references/fedx-gis/map-container.md) — `MapContainer` props + `getMap()` 时机
- [fedx-gis/vector-layer.md](references/fedx-gis/vector-layer.md) — `VectorLayer` props 详解、source 结构
- [fedx-gis/tile-layers.md](references/fedx-gis/tile-layers.md) — `TileArcgisRestLayer` / `XYZTileLayer` 二选一
- [fedx-gis/circle-view.md](references/fedx-gis/circle-view.md) — `CircleView` 聚合圆圈 + `toolPupWindowId` 后缀
- [fedx-gis/gis-func.md](references/fedx-gis/gis-func.md) — `gisFunc.setMapCenter / setMapZoom / showLayer` 用法

## 调用入口关键词

当你看到用户以下意图时，立即使用本技能：

- "修改中屏保障中心 / 中屏地图 / 中屏 GIS / 中屏 Path / 中屏 Tab"
- "新增中屏图例 / 中屏气泡 / 中屏联动右屏"
- "排查中屏双击下钻 / 中屏智能问答 / 中屏 Tab 切换"
- 涉及 `emergency-support/modules/center` 目录下任何文件的新增、修改、bug 排查

> **当前 skill 版本：v1.11 · 2026-07-24**
>
> skill 自身的演进历史已挪到 [CHANGELOG.md](CHANGELOG.md)，不再放在 SKILL.md 里（避免污染模块技术知识）。v1.11 同步 tab1 + tab2 聚合圆 tooltip 改走 `tooltipTileChildren`（tab1 外层 `toolTipWindowCircle1` 锚点 div 已注释；tab2 本就无外层锚点 div，仅同步文档；两边 `toolPupWindowId` 仍保留作 id 后缀约定）。
