# Task · 2026-10-09-005-shenzhen-communication-guarantee-new-widgets

## 任务元信息

| 项       | 值                                                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-09-005-shenzhen-communication-guarantee-new-widgets`                                                                                                                                    |
| Status   | 已完成（2026-10-10 归档）                                                                                                                                                                             |
| 类型     | 编码                                                                                                                                                                                                  |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/**`（新建组件与联动逻辑）、`web/services/shenzhen-communication-guarantee/`（LOG 接口）、`public/static/mock/shenzhen-communication-guarantee/` |
| Roadmap  | 2026 年深圳重要通信保障屏建设（PM 素材 2026-10）                                                                                                                                                      |
| 验收标准 | 见下方验收 checklist（A1–A6）                                                                                                                                                                         |
| 前置依赖 | [task-2026-10-09-004-migrate](./task-2026-10-09-004-shenzhen-communication-guarantee-migrate.md) 已完成（迁移组件在屏可用）                                                                           |

---

## 目标（Goal）

实现信管局**没有对应能力、需新建**的组件与交互逻辑：区域轮巡（图片+名称）、顶部类型过滤三联动（类型→地图图层→轮巡），并做整屏联调收尾与文档回填。

> 「重大保障 LOG」勘误（2026-10-10 用户澄清）：PM 需求稿把 **logo 写成了 LOG**，实为底部 logo 图片（素材 `bottom-logo.png` 已存在，骨架 `sub-pages/index.tsx` 有注释占位「组合 1058」），**不是日志组件**——原步骤 3「guarantee-log 组件+接口」整段删除。logo 展示为挂一张图，不单开步骤，联调走查（步骤 3）时确认挂载即可。

---

## 步骤（执行计划）

### 步骤 1：交互字段与类型过滤联动

- **动作**：`fields.ts` `defineInteractionFields` 声明 `areaTypeFilter` / `activeArea`（已存在，004-03 骨架阶段预置）；top-type-filter 补选中/取消高亮逻辑并广播；center-map、首屏 area-carousel 订阅过滤
- **选中态视觉（用户 2026-10-10 确认）**：全部未选中时 5 卡全高亮；选中一个后，选中卡保持高亮，其余 4 卡 `opacity: 0.7`；再次点击取消选中，恢复全高亮
- **输出**：类型-地图-轮巡三联动
- **等待用户**：否

### 步骤 2：区域轮巡组件

- **动作**：新建共享组件 `sub-pages/components/area-carousel/`（区域图片+名称，自动轮巡，间隔 presets 配置）：首屏版订阅 `areaTypeFilter` 过滤；区域屏版全量轮巡不联动；点击当前项 `activeArea` 切区域屏
- **地图 TOOLTIP 触发（用户 2026-10-10 定案）**：轮巡 activeItem 经 `activeArea` 交互字段注入 center-map（同信管局 today-scheduler→center-map 机制）：按 id 匹配打点生成 overlayInfo，渲染 ActiveOverlayItem（区域图片+名称，与轮巡共用图片源，点击切区域屏），打点激活态放大（源实现 ×2）；004-03 已在任务卡留备忘
- **地图 TOOLTIP UI（用户 2026-10-10 指定）**：TOOLTIP 浮层的 UI 设计也在 005 范围内实施（源 ActiveOverlayItem 结构：ActiveOverlayItemBg 描边光效 + 标题 + 缩略图，视觉按深圳屏设计稿调）
- **输出**：两屏底部轮巡 + 地图 TOOLTIP 联动
- **等待用户**：否

### 步骤 3：联调收尾 + 文档回填

- **动作**：三联动空态处理（某类型无区域）、仅 1 区域静态展示、整屏走查；`pnpm lint`；回填 `design/modules/shenzhen-communication-guarantee/`（事实化）与 docs/specs 交付物
- **输出**：整屏功能完整（mock 数据）
- **等待用户**：是（硬门槛②整体验收）

---

## 功能列表

- F1：顶部类型选中→高亮→地图图层与底部轮巡联动过滤；再点→取消恢复全部
- F2：区域轮巡（首屏受类型联动、区域屏全量），图片+名称，可点击切屏
- F3：地图 TOOLTIP（区域图片+名称，轮巡触发，点击切区域屏）

## 不做清单

- ~~重大保障 LOG~~（勘误：PM 稿 LOG 实为 logo，挂图已就位，不建组件）
- 后端真实接口对接
- 指标集补充后的增量范围

## 业务规则

- 单选语义：任一时刻最多一个类型选中；`areaTypeFilter: null` 为全部
- 仅 1 个区域时停止轮巡静态展示
- 类型字典顺序固定：会场、参访区、酒店、交通枢纽、其它

## 验收 checklist

- [x] A1：类型点击→高亮，地图与轮巡联动过滤；再点→取消恢复
- [x] A2：某类型下无区域时空态正常（地图保持深圳底图无打点；首屏轮巡返回 null）
- [x] A3：区域轮巡图片+名称正确轮巡，点击可切区域屏
- [x] A4：地图 TOOLTIP 随轮巡显示（图片+名称），点击切区域屏
- [x] A5：代码质量以 IDE 诊断为验收手段（无诊断错误；用户 2026-10-10 指示不跑 `pnpm lint`）
- [x] A6：文档回填完成（design 事实化：000-overview 002-006 共享组件、001-home/001/003/007、002-area/002；docs/specs 交付物按 9 件套分工另行推进）
- ~~`env/AGENTS.md` 声明的质量门槛命令已通过（`pnpm lint`）~~（用户明确本次不跑，以 IDE 诊断替代）

## 技术设计（阶段二回填）

- 交互字段：`areaTypeFilter: AreaType | null`、`activeArea: GuaranteeArea | null`（见 design 000-overview §4）
- area-carousel 参考 today-scheduler 轮播节奏与 stadium-thumb-image 缩略图视觉（参考非复制）
- ~~guarantee-log~~ 已删（勘误：LOG 实为 logo 图片，非日志组件）

### 步骤 2 实现事实（2026-10-10，已落码待验收）

- **共享组件** `sub-pages/components/area-carousel/`：
    - `AreaCarousel`：antd Carousel 滑窗（dots=false、超屏出箭头）+ `useIntervalTimer` 定时轮巡（间隔 environment `shenzhen-communication-guarantee.homeConfig.areaCarousel.interval` 分钟，默认 15）+ hover 暂停/离开恢复 + 激活卡高亮 + `calculateGoToSlideIndex` 滑窗跟随 + `defaultActiveItemId` 初始项 + 仅 1 区域不轮巡
    - `AreaThumbImage`：图片三级降级——接口 `imageUrl` → `${staticAssets.areaThumbnail}/${name}.png`（= `IMAGE_PATH/shenzhen-communication-guarantee/area-thumb/`）→ `default-thumb.png`
    - `useAreaCarouselData`：取数 hook（`getHomeAreaPointApi` 15 分钟轮询 + interval 读取），两屏壳共用，禁止跨屏 import（用户 2026-10-10 要求）
    - 卡片视觉（用户 2026-10-10 定稿）：flex 左右结构（图左、名称右、垂直居中）；仅名称无类型标签；名称 `rgba(206,223,255,1)` / Source Han Sans CN / 36px / 500，超长省略
    - 尺寸双规格（`size` prop）：首屏 `large` 586.5×159、图 180×135；区域屏 `default` 500×159、图 180×135；两屏均初始 3 张（`maxSliderCount=3`）
- **跨屏上下文** `sub-pages/components/view-context.tsx`：`ViewContext`（`activeArea` / `setActiveArea` / `switchViewByArea` / `switchView`）；`SubPageView`（sub-pages/index.tsx）持有 `activeArea` state 并注入 Provider，切屏 `switchViewByArea` 同时携带区域上下文
- **首屏壳**（home/modules/area-carousel）：widget `subscribe` 订阅 `areaTypeFilter`，非 null 按 `areaType` 过滤（空态返回 null）；自动轮巡 `dispatch(activeArea)` 广播供 center-map TOOLTIP；点击 `switchViewByArea` 切区域屏
- **区域屏壳**（area/modules/area-carousel）：全量轮巡不联动；点击 `setActiveArea` 切当前区域；`defaultActiveItemId=activeArea?.id` 跟随切屏进入的区域
- **地图 TOOLTIP**：已接线——center-map widget `subscribe.activeArea`，`overlayInfo` 按 id 匹配打点，激活打点 ×2（180/-64）+ zlevel +10，浮层点击 `switchViewByArea` 切屏；浮层 `ActiveOverlayItem.tsx`（OverlayItem + mutableLngLat，bottom 165，图片复用 `AreaThumbImage`）；浮层样式用户 2026-10-10 手工定稿（556 宽、标题 40px/700、图 516×330 `object-fit: contain`、CSS 背景边框，信管局 ActiveOverlayItemBg SVG 光效组件已删除未采用）
- presets：`staticAssets.areaThumbnail` 新增（area-thumb 静态目录）

### 步骤 1 实现事实（2026-10-10，已落码待验收）

- **top-type-filter**：`scale-item-card.tsx` 重写为交互版（`useState(activeType)` 点击切换 / 再点取消，选中后其余卡 `opacity: 0.7`，`onFilterChange` 回调）；`index.tsx` 点击 `dispatch(widgetFields.getField('areaTypeFilter'), 类型名)`，null 为全部
- **center-map 图层过滤**：seriesBuilder 按 `mapPointTypes` 类型分图层生成 series，`areaTypeFilter` 非 null 且不等于图层类型名时该 series 返回 null；widget 增加 `subscribe.areaTypeFilter`
- **首屏轮巡过滤**：home area-carousel 订阅 `areaTypeFilter` 按 `areaType` 过滤（空态返回 null）
- 打点本身 `silent: true`，切屏入口为 TOOLTIP 浮层点击（原「打点点击切屏」未实施，以浮层点击覆盖 F3 验收语义）

### 步骤 2 文档回填

- design `001-home/007-area-carousel/`、`002-area/002-area-carousel/` 的 spec + data-model 已事实化更新（布局尺寸、组件构成、取数收敛、图片降级）

## 变更记录

| 日期       | 变更                                                                                                                                                                           | 原因                                        | 是否重新过硬门槛① |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ----------------- |
| 2026-10-09 | 从原 build 合并卡拆出                                                                                                                                                          | 用户要求任务拆小                            | 是                |
| 2026-10-10 | 删除步骤 3 guarantee-log；A4 改为地图 TOOLTIP 联动验收。勘误：需求稿「重大保障 LOG」实为 **logo 图片**（PM 笔误），非日志组件，挂图走联调确认                                  | 用户澄清「Log 就是一个 logo，是 PM 写错了」 | 否（减范围）      |
| 2026-10-10 | 步骤 2 落码：共享组件/两屏壳/view-context/TOOLTIP 浮层组件；卡片视觉与尺寸双规格定稿（首屏 586.5×159、区域屏 500×159，均 3 张、图 180×135，名称 36px）；取数 hook 收敛共享目录 | 用户逐项确认视觉尺寸                        | 否（范围内细化）  |
| 2026-10-10 | 步骤 1 落码：top-type-filter 交互版 + areaTypeFilter 广播、center-map 图层过滤、首屏轮巡过滤（三联动打通）；design 001-top-type-filter / 003-center-map 文档同步事实；A1–A6 勾选归档 | 用户确认归档（硬门槛②）                     | 否                |

## 审批记录

| 门槛       | 状态                                    | 日期       | 批准人 |
| ---------- | --------------------------------------- | ---------- | ------ |
| ① 需求审批 | 已批准（整卡批准，先做步骤 2 轮播组件） | 2026-10-10 | 用户   |
| ② 实现验收 | 已验收（用户确认归档；lint 按用户指示以 IDE 诊断替代）              | 2026-10-10 | 用户   |

---

## 关联

> - 前置：[task-2026-10-09-004-migrate](./task-2026-10-09-004-shenzhen-communication-guarantee-migrate.md)
> - 设计文档：`design/modules/shenzhen-communication-guarantee/`
