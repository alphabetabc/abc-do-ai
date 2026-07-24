# Changelog · noc-shaanxi-emergency-support-center

本文件记录 skill 自身的版本演进历史（与模块技术知识分离）。来源：维护者对照 `web/pages/emergency-support/modules/center/` 的 git 提交做的漂移 review。

> 本文件不记录未来规划/讨论稿——见 SKILL.md「维护原则 2 · 只做增量」。

## v1.11 · 2026-07-24

- **tab1 聚合圆 tooltip 改走 `tooltipTileChildren` prop**（`tab-content-1/components/center-gis/components/gis/index.tsx#L911`）：外层 `<div id="toolTipWindowCircle1">{tooltipWindowCircle()}</div>` 注释掉。`CircleView.tsx` 的 `onCircleViewMouseMove` 内 `document.getElementById(toolPupWindowId) + appendChild` 分支因 `tooltipTileChildren` 已传入（`#L892`）而短路（`if (div && !props.tooltipTileChildren)` 守卫），锚点 div 不再被寻址。调用方仍传 `toolPupWindowId="toolTipWindowCircle1"`（`#L886`）——保留是为了维持与 tab2 的 id 后缀约定（不重叠即可），实际未被消费。
- **tab2 同步：聚合圆 tooltip 改走 `tooltipTileChildren` prop**（`tab-content-2/components/center-gis/components/gis/index.tsx#L780-L793`）：tab2 之前**就没有**外层锚点 div——`<div id="toolTipWindowCircle2">` 直接嵌在 `tooltipTileChildren` 内（`#L781`）。本次同步把 tab2 的 `<GisCustomCircleView>` 调用示例从缺 `tooltipTileChildren` 补齐成完整形态。`toolPupWindowId="toolTipWindowCircle2"`（`#L774`）仍传，仅作 id 后缀约定，实际未被消费。
- **文档同步**：
    - [references/tab-content-1-gis-full.md](references/tab-content-1-gis-full.md)：「Tooltip 节点」段标注锚点 div 已注释 + 改走 `tooltipTileChildren`；版本号 v1.2 → v1.3。
    - [references/tab-content-2-gis-full.md](references/tab-content-2-gis-full.md)：`<GisCustomCircleView>` 示例补全 `tooltipTileChildren` 块 + 标注 tab2 **无外层锚点 div**（id 内嵌在 prop 内）；版本号 v1.2 → v1.3。
    - [references/fedx-gis/circle-view.md](references/fedx-gis/circle-view.md)：tab1/tab2 后缀表里 tab1/tab2 同步标注 `tooltipTileChildren` 来源 + 容器 id 一并标注 `freePointContainer`；「外层 Tooltip div」段标注两个 Tab 都不再用外层锚点 div；「易踩坑」段同步修正 `enableSelfPopup` 描述（tab2 也已传 `enableSelfPopup={true}`）。
- **不涉及代码逻辑变化**：纯重构——tab1 去除一段已因 `tooltipTileChildren` 短路而失效的死代码（注释而非删除，保留回退通道）；tab2 仅同步文档，没有改动。

## v1.10 · 2026-07-23

- **`<GisCustomCircleView>` 自定位模式**（`web/components/ui/oss-gis/CircleView.tsx`）：新增 prop `enableSelfPopup?: boolean`，配套新增 `useEffect` 用 `mapContext.getPixelFromCoordinate([source[0].longitude, source[0].latitude])` + `mapContext.on('postrender', updatePosition)` 让容器自己跟随地图缩放/平移（tab1 启用）。容器 id 切到 `'freePointContainer'`；默认（不传）保持 `'pointContainer'`。
- **修复 tab2 容器被 useEffect 覆盖 display 的 bug**：`web/components/ui/oss-gis/CircleView.tsx#L75-L79` 的早返回**不再写** `domRef.current.style.display = 'none'`（注释掉而非删除，保留现场）。`display` 现在统一由内联 `style={{ display: visible === true && !isEmpty(source) ? 'block' : 'none' }}` + 顶层 `if (!visible || !source?.length) return null;`（`#L102-L104`）控制。tab2（不传 `enableSelfPopup`）从此正常显示。
- **`useEffect` 内增加空守卫**（`CircleView.tsx#L86-L88`）：`updatePosition` 起手 `if (!dom) return;`，防止 `domRef.current` 在清理阶段为空时写入样式。
- **`isEmpty` 引入**（`CircleView.tsx#L5, #L123`）：`import { isEmpty } from '@fedx-web-common/utils';`；内联 display 条件由 `visible === true` 改为 `visible === true && !isEmpty(source)`，与顶层早返回 / `useEffect` 早返回语义对齐。
- **tab1 调用方同步**（`tab-content-1/components/center-gis/components/gis/index.tsx#L872-L873`）：`<GisCustomCircleView enableSelfPopup ... />` 显式传 `enableSelfPopup`。
- **tab2 调用方同步**（`tab-content-2/components/center-gis/components/gis/index.tsx#L770-L771`）：`<GisCustomCircleView enableSelfPopup={true} ... />` 显式传 `enableSelfPopup`（tab2 写法更显式，区别于 tab1 的 shorthand）。
- **文档同步**：
    - [references/fedx-gis/circle-view.md](references/fedx-gis/circle-view.md)：结构重排——`GisCustomCircleView` 提到首位讲项目当前在用，`fedx-gis 原版 CircleView` 放到末尾并标注「**当前未使用**」；新增 `enableSelfPopup` 自定位模式小节；tab1/tab2 后缀表新增 `enableSelfPopup` 与 `容器 id` 两列；修正「tab2 用 fedx-gis 原版」的过时描述。
    - [references/tab-content-1-gis-full.md](references/tab-content-1-gis-full.md)：`<GisCustomCircleView>` 章节同步 `enableSelfPopup`（props 表 + 自定位 useEffect 完整代码 + 行为要点 + 用法示例 + 注意事项）；同步修正「与 tab2 的差异」里「tab2 仍在用 fedx-gis 原版 CircleView」的过时描述。
    - [references/tab-content-2-gis-full.md](references/tab-content-2-gis-full.md)：新增 `<GisCustomCircleView>` 聚合圆组件小节（tab2 不传 `enableSelfPopup`，容器 id 保持 `pointContainer`）。
    - [references/tab-content-1-aggregate-points.md](references/tab-content-1-aggregate-points.md) § 改动点表：`零改动 → 传 enableSelfPopup`。
    - [references/tab-content-2-aggregate-points.md](references/tab-content-2-aggregate-points.md) § 5.6：标注 tab1 v1.10 起传 `enableSelfPopup`，tab2 不传。
- **维护原则**（[SKILL.md](SKILL.md)）：新增第 6 条「不主动查 git（No Unsolicited Git Lookup）」——除非用户明确指示「同步别人更新」之类的信号，否则不跑 `git status/log/diff/fetch/stash/show`，一律用 `Read/Grep/Glob/SearchCodebase` 读 working tree。

## v1.9 · 2026-07-23

- **图片引用模式变更**（commit `94aef85b0544dda18de0f6093bed019a819f29a0`，short `94aef85`，作者 `sunhuanzhe@boco.com.cn`，2026-07-23 16:25）：`center-path/index.tsx` 把系列 1/系列 2 的标签背景图从字符串路径 `/static/images/emergency-support/gis-三角体.png` + `gis-tip背景.png` 改为 `import gisTriangle / gisTipBackground from '../../images/...'`，webpack 一起打包。同步修正 SKILL.md「图片引用」规则、`center-path.md`「静态资源路径」表。新增两张图片 `center-path/../../images/gis-三角体.png` (650 B) 与 `center-path/../../images/gis-tip背景.png` (3191 B)。
- **中屏背景图条件渲染**（commit `2bd9eee`）：`center-path/index.tsx` + 两个 `center-gis/index.tsx` 引入 `useEnvironment().emergencySupportGisConfig.showSatelliteBackgroundMap`，按开关在根 `<div>` 上挂 `style.backgroundImage = url(constants.IMAGE_PATH + '/emergency-support/卫星地图.png')`。对应 `.less` 中原本写死的 `background: url(...)` 被注释，只保留 `background-repeat/position/size` 三个属性。新增 `import { constants } from '~/web/common/constants'` 与 `useEnvironment` 解构。
- **图例文字改称**（commit `2bd9eee`）：`CenterPath.Radio` 中：
    - `LegendEnum.siteRoom`：`基站-机房退服` → `物理站退服`
    - `LegendEnum.trans`：`断点中断` → `传输中断`
    - `GisLegend` value `'1000501'`：`基站-机房退服` → `物理站退服`
- **退服基站气泡样式分支**（commit `2d6cdee`，tab-content-1 center-path）：`CenterPath` 的系列 2 label `formatter` 增加 `isSiteAlarm` 判断（同时有 `value1/value2/value3` 且**没有** `value4`），命中时使用新的 `value2Site`/`value3Site`/`sep` 样式（颜色 `#FFA940` / `#FF4D4F` / `#9BFF00`，分隔符 `/` 与数值同色），不再走原 `value2`/`value3`/`value4` 格式。同时 `center-path/index.less` 中：
    - `.legend-child .text-site-4G`：`#29ff67` → `#FFA940`
    - `.legend-child .text-site-5G`：`#39f8ff` → `#FF4D4F`
    - 新增 `.legend-child .text-site-sep { color: #9BFF00; }`
    - Radio.Group 中 `site` 文本结构改为多段 `<span className="text-site-sep">/</span>` 拼接
- **突发保障 GIS 区域 Tab 三档宽度**（commit `2d6cdee`，tab-content-2 center-gis/components/gis）：`<div className="area">` 下的 `.child` / `.title` / `.title-selected` 改为按 `dataFilterArea.length`（1/2/3）动态挂 `full-width` / `half-width` / `third-width` 类，避免只配 1-2 个区域时 Tab 过窄或满 3 个时溢出。对应 `.less` 新增 9 个档位 class。同时：
    - `.title` 默认 `width` 由 `200px` 改 `230px`
    - `.title-selected` 默认 `font-size` 由 `48px` 改 `42px`
    - `.area-setting` 加 `z-index: 1`

## v1.8 · 2026-07-16

- 维护者当时做了常规修正，本文件尚未引入，CHANGELOG.md 在 v1.9 才补建（之前 SKILL.md 末尾虽引用但文件不存在）。历史记录以 `references/*.md` 顶部 version 标注为准。

---

## git 锚点（2026-07-23 drift review 截止位）

### 仓库状态

- HEAD：`e7626269c9bb0541b9af569ec1c966b0026bc241`
- 分支：`feature-240631` → `origin/feature-240631`
- working tree：clean

### 已纳入本次 review 的最近 10 个 commit（按时间倒序，全是 `web/pages/emergency-support/modules/center/` 范围）

```
git log -10 --oneline -- web/pages/emergency-support/modules/center/
```

输出快照（已固化在 CHANGELOG v1.9 上下文里的状态）：

| SHA | 日期 | 主题 | 本次处理 |
|---|---|---|---|
| `94aef85b0544dda18de0f6093bed019a819f29a0`（short `94aef85`） | 2026-07-23 16:25 | 中屏地图打点背景图调整 — 作者 `sunhuanzhe` | v1.9 修改 center-path + images/ |
| `2e2c01b` | 2026-07-23 | Merge (no-op) | 跳过 |
| `2d6cdee` | 2026-07-23 | 中屏打点显示调整 | v1.9 (tab-content-2 GIS 三档宽度) |
| `2bd9eee` | 2026-07-22 | 中屏地图优化需求 | v1.9 (卫星背景 inline style / 图例文字改称) |
| `0d85052` | 2026-07-14 | 跨类型聚合图层的能力 | 已文档化（aggregate-points 系列 reference） |
| `d44dedd` | 2025-12-05 | fedx-gis import path 改 `'fedx-gis/dist/gis-2d'` | 已对齐 fedx-gis/index.md |
| `33f6f2c` | 2025-12-05 | 地图显示调整 | 当前 reference 已覆盖 |
| `d346f07` | 2025-08-06 | 图例 `> 5` → `> 6` 上限 | 已在 SKILL.md「不动原则」留底 |
| `79683fe` | 2025-08-05 | 抢修显示调整 | 当前 reference 已覆盖 |
| `3326ae9` | 2025-08-04 | 地图定位调整 | 当前 reference 已覆盖 |

**最旧下限锚点**：`3326ae9`（本次 review 的「下限」commit，即"比这个还老的 center/ 提交不需要再过一遍"）。

### 找"别人在你停笔后新提交的代码"的命令

下次 session 进入维护者命令时，按下面顺序跑一遍，对照**本次 review 覆盖点**快速判断冲突：

```bash
# 1) 同步远端
git fetch origin feature-240631

# 2) 看 working tree 是否在你停笔期间已被同步进改动
git status --short

# 3) 关键命令：本次 review 之后 新增 / 新影响 center/ 目录的提交
git log 3326ae9..origin/feature-240631 -- web/pages/emergency-support/modules/center/

# 4) 如果只想看文件级 diff（与"已记录改动"对照）:
git diff --stat 3326ae9..origin/feature-240631 -- web/pages/emergency-support/modules/center/
```

**判冲突要点**：

- 如果新提交的 commit 涉及本文件但**不是**已知漂移点的同位置同字段 → 必读 diff
- 如果新提交移到 `tab-content-2/.../gis/`（v1.9 改过）但同样在改 region Tab 宽度 → 跟 `full/half/third-width` 规则核对
- 如果新提交移到 `center-path/index.less` 的 `.text-site-*` → 跟 v1.9 颜色历史核对
- 如果新提交修改 `legendValue` 阈值（之前 `> 6`）→ 同步 SKILL.md「不动原则」

### 三条不变锚点

`94aef85` 之前最长稳定的位置（无漂移风险，定位用）：

- `tab-content-1/.../gis/index.tsx:543` — `useEffect([neTypeCheckList])`，v1.9 未改；写死了 `neTypeList.map(... isShow: neTypeCheckList.indexOf(item) >= 0)` 作为 `gisFunc.showLayer` 入参
- `tab-content-1/center-gis/index.tsx` 根 `<div className="emergency-support-center-gis-root">` — v1.9 之后多了 `style.backgroundImage`
- `tab-content-2/center-gis/components/gis/index.tsx:740+` — `<div className="area">` 的 `widthClass` 三档分支

