# Task · 2026-11-13-010-show-case-retro-spec-gaps

> **验证上下文（前提，必须说清）**：本卡所有结论仅基于 **skill（dist-skill/large-screen-builder/，只读）+ show-case（apps/show-case/）** 两处的实战验证得出——AI 按此上下文约束工作（只读这两个目录、不改 skill），验证视角是「一个只拿到 skill 和 PM spec 的 AI 能否走通大屏搭建」。卡内 G 编号如后续与物料站 / 渲染器源码（packages/screen-renderer 等）核对出现出入，以实际源码为准并回写本卡。

> show-case 首屏（ops-monitor 运营监控大屏，Schema 模式）实战验证的经验沉淀卡。
> 目的不是记录开发过程，而是固化一份可勾选的问题台账：**PM spec 应提供什么** / **供给侧缺什么（按责任方编号）** / **流程纪律** / **踩坑速查**。
> 后续任务（物料回流、spec 模板强化）以本卡编号（G1…、P1…）为事实来源。

> **★ 方向定调（2026-11-13 用户拍板）**：**Schema 模式是领导想要的交付形态**——大屏由 `public/schemas/<name>.schema.json` 声明（canvas / sections / interactions），渲染器装配渲染，布局与数据调整改 JSON 即生效。后续开发、skill 演进、给领导的演示均以 Schema 模式为准；工程代码模式仅作为超出 schema 表达力时的兜底。
> 推论：主路径上的缺口（G2.2 系）优先级高于物料样式类缺口；物料回流时须同步补 schema 契约（manifest.runtime.type + registry 注册），否则主形态接不上。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-010-show-case-retro-spec-gaps` |
| Status | 进行中 |
| 类型 | docs（经验沉淀，无代码改动） |
| 影响范围 | 仅本文件；后续派生回流任务另开卡 |
| Roadmap | 阶段 5 · 闭环验证与迭代优化（验证反馈回填） |
| 验收标准 | ① 二节每条缺口（G1…）归属唯一责任方、带状态与派生卡指针；② 派生任务逐条引用 G 编号，无悬空无遗漏；③ 四节每条踩坑可复现验证（现象/根因/解法三要素齐） |
| 前置依赖 | show-case ops-monitor 屏开发（apps/show-case/，已完成 8/8 分区初版） |

---

## 目标（Goal）

把 show-case 实战中暴露的需求侧缺口（PM spec）、供给侧缺口（skill 物料/渲染器/骨架）与工程踩坑（及已验证的解法）结构化沉淀，避免下一次真实开发重蹈覆辙。

---

## 一、PM spec 应提供什么（需求侧 checklist）

> 本次开发中「读 spec 不够、开发中途追问用户」的点。下轮接 PM spec 时先按此表核对，缺一项问一项，不猜。

### 1. 布局与坐标（最高优先级）

- [ ] **每个分区的精确坐标 + 尺寸**（x/y/w/h，设计稿 px 基准）。本次退服趋势 500×301、地图 810×651 @ (555,108) 等全部靠用户逐条给标注；spec 初稿只有粗分区。
- [ ] **分区间的层叠关系**（如概要卡叠在地图容器内顶部，无独立壳）。
- [ ] **分区编号 ↔ 分区名的对照表**，避免「3.5 概要卡」这类引用歧义。
- [ ] 明确哪些分区**共享容器**（如左下区域分布横贯左列+中列下方）、哪些独立。

### 2. 视觉素材

- [ ] **素材文件名与用途一一对应**（spec 曾把 center-ind-bg.png 误写为「中屏-ind-bg」，开发侧靠 glob 才对上）。
- [ ] **素材是「直接消费」还是「视觉参照」要分清单**（v1.1 已补：§4.1 / §4.2 拆分）。
- [ ] 组件级贴图（卡片背景、标题横幅）必须写明**贴到哪个组件、什么尺寸**，而不是只给一张图（否则开发容易自绘 SVG 替代——本次被用户明确否决：PM 给的 PNG 必须直接用）。
- [ ] 整屏背景图与「分区自带背景」的边界：哪些分区透背景（毛玻璃）、哪些自带底图。

### 3. 容器与皮肤样式

- [ ] 模块容器通用样式要写具体 CSS 值（本次：`backdrop-filter: blur(20px); background: rgba(1, 30, 59, 0.5)`，靠用户口述补入）。
- [ ] 标题栏形态边界：有无装饰线 / 导航 / tab / 图标位（本次逐项删：品牌导航、header-icons、标题两侧装饰都不要）。

### 4. 内容语义

- [ ] 图表系列名 / 类目清单 / 区域字典 / 设备类型名等**业务字典**，或明确标注「待确认」并列成 Q 表（本次 Q1–Q6 模式可行，但要进 spec 正文编号可引用）。
- [ ] 指标文案的精确措辞（本次「退服数」后缀、饼图「不需要居中」等都是开发中途口述修正——这类措辞级需求 spec 应一次给全）。
- [ ] 数据契约草案（字段名/结构）——有草案则 mock 与 schema 同步成本大幅降低。

### 5. 交互行为

- [ ] **分区间交互联动**必须显式声明（本次缺失：点击地图选中区域 → 周围分区的数据/高亮如何变化，spec 只字未提，交互形态全靠开发中途追问）。每条交互应写明：触发源分区 → 动作（点击/hover）→ 响应分区 → 数据变化契约 → 取消选中行为。
- [ ] 交互的默认态：初始选中的区域、未选中时周围分区展示什么（全量 or 空）。

### 6. 流程纪律（给 PM 的使用说明）

- 开发中拍板的需求变更**双向同步回 spec 正文**（已拍板写需求，不写过程痕迹；缺失项进修订记录）——spec 会被拿去给领导演示，必须保持「自洽的需求文档」而非「过程记录」。
- 修订记录编号（v1.x）逐条可追溯，正文引用修订号。

---

## 二、供给侧缺口台账（G 编号，按责任方分三组）

> 每条缺口：编号 · 现象 · 本次临场解 · 状态（待回流 / 待修文档 / 待实现 / 待决策）。派生任务（五节）按编号引用。

### 2.1 物料缺口与能力缺陷

| 编号 | 缺口 / 缺陷 | 本次临场解 | 状态 |
| --- | --- | --- | --- |
| G1 | 整屏背景图物料缺失 | `bg-image`（img 铺满 section，pointerEvents:none），极简通用 | 待回流（候选名 bg-image） |
| G2 | 纯文字标题栏（无装饰）缺失；现有 screen-title 带装饰，不适配「背景图自带装饰」场景 | `title-plain` | 待回流 |
| G3 | 分组指标卡（昨天/今天 × N 设备，贴图卡片）缺失；petition-comparison-channel 的 ChannelCard 强制渲染「进京/本地」副指标且无开关——物料可配置性不足的典型案例 | `period-cards`（148×75 贴 left-ind-bg.png，分组横幅 left-title-bg.png） | 待回流 |
| G4 | 概要指标卡（贴图 247×103，日历图标+大数值+标签）缺失；indicator-view 无贴图 props，样式硬编码 less | `center-ind-cards` | 待回流 |
| G5 | 纯折线趋势图物料（平滑折线+面积渐变）缺失 | 用 `bar3d-line` 顶（Bar3D.Cube3 + line 混合） | 待新建（候选名 line-trend-chart） |
| G6 | `indicator-view` 可配置性不足：背景/内边距/贴图硬编码，props 无 `cellBgUrl` / `style` 透传 | 未用（用 G4 临场顶） | 待增强 |
| G7 | `echarts-pie` 容器内建深蓝渐变底 + 外轮廓装饰图，没有 props 能关干净（backgroundImage/centerIcon 可关，容器底必须宿主 CSS 覆盖） | 宿主 CSS 覆盖 | 待增强 |
| G8 | `petition-comparison-channel` 副指标行无条件渲染 | 未用 | 待增强 |
| G9 | 物料容器多为内联 style 定宽高（如 ls-pie-chart 默认 450×200），宿主覆盖需 `!important`；应支持「撑满父容器」模式 | 双类 + `!important` | 待增强（回流时一并修） |
| G10 | 物料几何依赖 props 宽高：饼图中心/侧列表按 props width/height 计算，容器改 100% 后仍要传精确内容区尺寸，两套尺寸打架 | props 传内容区精确尺寸 468×268 | 待增强（回流时一并修） |
| G11 | `echarts-ver-bar` Y 轴刻度未整化（自 backlog.md 并入） | — | 待增强 |

### 2.2 渲染器 / schema-mode（主路径，定调后优先级最高）

| 编号 | 缺口 | 本次临场解 | 状态 |
| --- | --- | --- | --- |
| G12 | **`data.url` 不被渲染器支持**（bundle 内 0 处 url 拉取逻辑），但 schema-mode.md 与物料 spec 的 data 契约写了 url 形态——文档与实现不符，**文档级幻觉源**（AI 按文档写 url 会静默失效）。定调推论：Schema 模式是主交付形态，此缺口阻塞真实数据接入，**建议实现而非删文档** | mock 数据内嵌 props | 待实现（倾向实现） |
| G13 | WidgetShell 主题（blur40/灰底）内置于 IIFE 且后加载压过宿主规则，宿主必须双类选择器 hack 换肤。定调推论：主形态下每个宿主都踩，应提供**壳主题 CSS 变量全集文档或 schema 级 theme 覆盖入口** | `.sr-widget-shell.sr-widget-shell` 双类提特异性 | 待登记方案（建议升为派生卡） |
| G14 | 缺「空态/加载态」schema 级约定（PM spec §6 要求不白屏，目前靠物料各自处理） | 物料各自处理 | 待约定 |
| G19 | **分区间联动能力（地图选区 → 周围分区数据变化）**：渲染器机制已核验并在 ops-monitor 屏打通首例——schema `interactions` 声明字段 `selectedRegion` + 地图 section `events: [{on:'onClick', dispatch:'selectedRegion', pick:'data.name'}]`（echarts-map 的 onClick 出口存在，按 mapConfig 解析出 `{data:{name,adcode}}`）+ 退服占比 section `subscribe:['selectedRegion']` 注入 props。echarts-pie 不消费联动 prop，按 P1 新建宿主包装物料 `echarts-pie-region`（echarts-pie 的 region 包装，按 selectedRegion 派生数据）+ registry 注册。**剩余缺口**：仅一条链路验证；取消选中等边界行为未约定；未覆盖更多订阅分区 | 首例已打通（点击地图城市 → 退服占比数据变化） | 首例已打通，待扩展 |

### 2.3 工程骨架

| 编号 | 缺口 | 本次临场解 | 状态 |
| --- | --- | --- | --- |
| G15 | 骨架模板自带 `src/screens/home/index.tsx` 引用不存在的 `/schemas/home.schema.json` 且未挂路由——死代码，下轮照抄会误判 | 未处理 | 待清理（或骨架模板决定是否保留 home 占位屏） |
| G16 | `_assets/` 拷贝出现嵌套 `_assets/_assets/`（16 个重复 SVG）——拷贝事故，疑 skill 指引 _assets 拷贝步骤有歧义 | 未处理 | 待清理 + 核对 skill 指引措辞（skill 目录只读，修正在上游 docs 后重导出） |
| G17 | `public/mock/ops-monitor/` 下 7 份 mock JSON 是死资产（G12 确认 url 不生效后未接线）——留着会误导下轮开发以为可走远端加载 | 未处理 | 待决策：清理，或保留并标注「G12 实现后的 dataSource 契约样例」 |
| G18 | 骨架 typescript ^7.0.2 与 typescript-eslint 8.72 不兼容，pnpm lint 失败。选项：降 TS（回 5.x，稳但旧）vs 升 eslint 插件（新，需验证兼容性） | 阻塞登记 | **待用户决策** |

---

## 三、流程纪律（从经验中固化的规则，非一次性坑）

> 违反后果见四节对应踩坑条目；规则本身下轮直接执行。

- **P1 不改写物料**：物料能力不足时，新建宿主临场物料 + registry 注册 + 缺口登记回流（G 编号）；禁止在宿主直接 patch 物料源码，禁止自绘 SVG 替代 PM 给的贴图。（源：坑 #6）
- **P2 spec 双向同步**：开发中拍板的需求变更同步回 PM spec 正文（需求态措辞），缺失项进修订记录；spec 是演示文档不留过程痕迹。（源：坑 #8）
- **P3 坐标不猜**：一律等 PM 设计稿标注（精确 px），spec 缺则先问后做。（源：坑 #7）
- **P4 接 spec 先过一节 checklist**：缺一项问一项，不猜。

---

## 四、踩坑速查表（纯工程问题）

> 格式：现象 → 根因 → 已验证解法。下轮遇到同类问题直接查表。（调试注意点也归此表）

| # | 现象 | 根因 | 解法 |
| --- | --- | --- | --- |
| 1 | 背景图挂 body 下、不随缩放、非 1920×1080 | 背景放视口层，脱离画布坐标系 | 背景做成**画布内 section**（bg-image 物料，0,0,1920,1080，z 底层），随 ScalerContainer 等比缩放 |
| 2 | 宿主 CSS 换肤（毛玻璃）被压 | 渲染器 IIFE 内置 WidgetShell 主题在宿主样式**之后**加载，同特异性后者胜 | 双类选择器 `.sr-widget-shell.sr-widget-shell` 提特异性；已实测 6 壳全部生效（根治见 G13） |
| 3 | 物料容器改 100% 不生效 | 物料用内联 style 定宽高 | 双类 + `!important`；物料几何按 props 宽高算的话 **props 也要传内容区精确尺寸**（壳 500×332 → 内容区 468×268 = 减 padding 2×16 / 标题 40 + padding 2×12，数值源自渲染器 CSS 变量默认值）（根治见 G9/G10） |
| 4 | schema 改了页面没变 | public 下 JSON 浏览器缓存 | 强刷 / URL 加 `?v=N`；schema-mode.md 应写明该调试注意点（并入 G12 派生卡的文档修正范围） |
| 5 | data.url mock 全部不生效 | 渲染器不支持 url 拉数 | mock 内嵌 props（根因即 G12） |

---

## 五、派生任务（后续另开卡，本卡只登记不执行；逐条引用 G 编号）

- [ ] T1 物料回流批：G1 bg-image / G2 title-plain / G3 period-cards / G4 center-ind-cards → docs/materials/（按 material-extract 流程）；**回流验收含 schema 契约**：manifest.runtime.type + registry 注册（方向定调推论）
- [ ] T2 物料可配置性增强：G6 indicator-view / G7 echarts-pie（贴图 props、关背景 props、容器自适应）+ G8 petition-comparison-channel 副指标开关 + G11 echarts-ver-bar Y 轴刻度整化
- [ ] T3 G12 实现（优先）或删文档：渲染器支持 `data.url` 拉数 + schema-mode.md 修正（补缓存 #4 / 换肤 #2 / 尺寸 #3 说明）
- [ ] T4 G13 WidgetShell 主题：CSS 变量化或 schema 级 theme 入口（主形态下高频踩坑，建议升优先级）
- [ ] T5 G5 line-trend-chart 物料（平滑折线+面积渐变）——开发 spec 已备：apps/show-case/docs/specs/line-trend-chart-spec.md（演示时开发，当前 bar3d-line 降级占位）
- [ ] T6 G14 空态/加载态 schema 级约定
- [ ] T7 G15 home 死代码清理 / G16 `_assets/_assets/` 清理 + skill 指引核对（skill 只读，修正走上游 docs → 重导出）/ G17 mock 死资产处置（决策：清理或标注保留）
- [ ] T8 G18 骨架 TS/typescript-eslint 版本对齐（**待用户决策**：降 TS vs 升 eslint 插件）
- [ ] T9 G19 分区间联动扩展：首例（地图→退服占比）已打通，剩余：取消选中/默认态行为约定、扩展更多订阅分区（概要卡/区域分布等）、`echarts-pie-region` 回流评估（schema 联动契约沉淀进物料 spec）

---

## 步骤（执行计划）

### 步骤 1：沉淀本卡（已完成）

- **动作**：四份清单（spec checklist / G 台账 / 纪律 / 踩坑表）+ 派生任务登记（T1–T9 挂 G 编号）
- **输出**：本文件
- **等待用户**：是——请审阅：① 方向定调段推论是否准确；② G 台账有无遗漏/归属错误；③ G17 / G18 两项待决策

### 步骤 2：派生任务全部执行（T1–T9，后续窗口续接）

- **范围**：T1–T9 全部处理完成（含 G17 / G18 两项用户决策）
- **执行顺序建议**：G18 决策 → T8（TS/eslint 对齐，否则 lint 一直红）→ T3 / T4 / T6（渲染器主路径）→ T1 / T2 / T9（物料回流与增强）→ T7（清理）
- **收尾硬要求**：全部修复落上游（docs/ / packages/ / skeleton）后，**必须 `pnpm export:skill` 重导出**——skill 是导出产物，不重导出则下游拿到旧版
- **完成判据**：T1–T9 全勾 + 重导出完成 → 用户即可带新版 skill 进入 hermes 环境做干净的真实验证
- **本窗口到此为止**：T1–T9 各自另开任务卡过门槛①后执行，不在本窗口展开

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-13 | 初稿（基于 ops-monitor 屏开发全程） | 用户要求沉淀缺失问题 | — |
| 2026-11-13 | v2.3：新增步骤 2（T1–T9 全量执行计划：顺序建议 + export:skill 重导出硬要求 + hermes 验证完成判据）；本窗口到此为止，派生任务后续窗口续接 | 用户确认：处理完本卡全部问题后方可进 hermes 测试 | 否（步骤规划，无需求变更） |
| 2026-11-13 | v2.2：二节 2.2 新增 G19（分区间联动：首例已打通——ops-monitor 屏地图选区→退服占比，代码已核验：schema interactions 声明 + echarts-map events.dispatch + echarts-pie-region 订阅派生），五节新增 T9（扩展与边界约定） | 用户要求把地图↔周围联动能力在卡中体现 | 否 |
| 2026-11-13 | v2.1：一节新增「5. 交互行为」checklist（分区间交互联动 + 默认态，本次地图选区联动 spec 未声明） | 用户指出 PM spec 未写交互 | 否 |
| 2026-11-13 | v2 重排：二节缺口统一 G 编号按责任方分三组；纪律条款（P1–P4）从踩坑表抽出升独立清单；踩坑表只留纯工程坑；派生任务 T1–T8 挂 G 编号；补录 G11（原 backlog 悬空引用）/ G15 home 死代码 / G16 _assets 嵌套 / G17 mock 死资产；验收标准改可勾选项；方向定调补两条推论（data.url 升优先级、回流含 schema 契约） | 用户要求调整格式（问题散落三清单、无编号挂钩、踩坑表混粒度） | 否（纯文档重排，无需求变更） |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 待审批 |  |  |

---

## 关联

> - 现场：`apps/show-case/`（ops-monitor 屏 + 宿主临场物料 4 个）
> - PM spec：`apps/show-case/docs/pm/spec.md`（v1.3）
> - 屏清单 / 任务卡：`apps/show-case/docs/specs/spec.md` / `task.md`
