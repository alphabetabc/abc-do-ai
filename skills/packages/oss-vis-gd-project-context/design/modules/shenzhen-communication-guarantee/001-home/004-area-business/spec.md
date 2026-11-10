# 004-area-business · 网络规模（spec）

> 2026-10-10 实现完成（004-03）；2026-10-20 反拉终端重构：删小区/退服率、全网/重保双列、静态直出（task-2026-10-20-001）；2026-10-21 按新设计稿落地三张背景图 + Card1/Card2 样式重做（task-2026-10-21-002，**重保专线行按需求删除**）；2026-11-10 接口契约变更：`key-guarantee-area-business` → `homepage-right-network`，出数机制改三维匹配（task-2026-11-10-001，模块名由「重保区域业务」改称「网络规模」）。

## 职责

首屏右侧，**保障区域的汇总统计**（非单区域）：

-   2G / 4G / 5G 基站：深圳全网数（左）+ 重保区域 基站/小区 斜杠双值（右）
-   5G-A 低空站点：单值（站点数 198，接口暂无数据，模板默认值兜底）

（原小区子行与退服率指标已于 2026-10-20 删除；**重保专线行已于 2026-10-21 按需求删除**（less 中 `data-bg='zhongbao'` 样式与 bg-重保.svg 为预留）；原「通感站」行不再展示。）

## 布局

-   PanelRight 744×1189，widgets 注册 left 2970 / top 362
-   内容纵向 space-between 分布；按 viewType 选择呈现组件与背景

### 模块级行排布（自上而下）

```text
┌──────────────────────────────────────────────┐
│              │            重保区域            │
│    2G  ▎ 3627基站        ▏  21基站 / 2468小区 │ ← Card1（bg-基站）
├──────────────┼───────────────────────────────┤
│    4G  ▎ 47200基站       ▏ 293基站 / 2468小区 │ ← Card1（bg-基站）
├──────────────┼───────────────────────────────┤
│    5G  ▎ 49500基站       ▏ 288基站 / 2468小区 │ ← Card1（bg-基站）
├──────────────┴───────────────────────────────┤
│ 5G-A低空站点       198 （整行通栏，不分左右）     │ ← Card2（bg-5g-a）
└──────────────────────────────────────────────┘
       ↑ 深圳（全网）           ↑ 重保区域
```

-   行序 = service 输出数组顺序（2g → 4g → 5g → 5ga），页面按序渲染
-   每行样式/背景由 `viewType`（card1/card2）+ `data-bg={item.key}` 决定
-   Card1 内部：左列 = children[0]（深圳·基站），右列 = children[1] / [2] 斜杠双值（重保·基站/小区）

## 组件构成（2026-10-21 新设计稿）

-   `index.tsx`：`VIEW_RENDERERS` 注册表按 `item.viewType` 分发，未注册类型返回 null
    -   **Card1**（`viewType: card1`，基站行）：名称在左下，指标容器绝对定位底部（`bottom: 70px`）；左侧 children[0] 居中单值（深圳·基站），右侧 children[1]/[2] 以 `A / B` 斜杠拼接（重保区域·基站/小区，第二数字白→绿渐变），背景 `bg-基站`
    -   **Card2**（`viewType: card2`，单值行）：label + num 基线对齐横排（`marginLeft: 30px`），外层 group `data-bg={item.key}` 区分背景（5ga → `bg-5g-a`、zhongbao 预留 → `bg-重保`）
-   `index.less`：背景图 bg-基站 659×290 / bg-5g-a 689×243 / bg-重保 679×210（预留）+ 根节点 `::after` 顶部表头装饰 ind-label.png（651×92）；数值渐变文字（白→蓝），D-DIN-PRO 900 / Source Han Sans CN
-   类型 `AreaBusinessItem`：平铺结构 `{ key, title, viewType, children: [{label, areaName?, value}] }`

## 取数链路与页面消费（2026-11-10 起）

自上而下一条链，各层职责单一：

```text
environment.json（env key：shenzhen-communication-guarantee-view-homepage-right-network）
  │  可覆盖：pollingInterval / staticData / viewItemDataTemplate / viewPageArgs
  ▼
service 层 getNetworkScaleApi（web/services/shenzhen-communication-guarantee/home/section-right.ts）
  │  1. enableStaticData=true → staticData 当 rows 用（跳过接口）
  │  2. 否则 getViewItemDataApi（viewItemId=homepage-right-network）
  │     接口空 → viewItemDataFallbackApi 读 fallback json → 仍空 → 返回模板默认值
  │  3. fillTemplateValues：rows × 模板 三维匹配回填，未命中 metric 保留模板默认 value
  │  输出：AreaBusinessItem[]（渲染即所得，页面无二次转换）
  ▼
页面层 AreaBusiness（web/pages/.../home/modules/area-business/index.tsx）
  │  useRequest(getNetworkScaleApi, { pollingInterval })，5min 轮询（env 可配）
  │  VIEW_RENDERERS[item.viewType] 分发 → Card1 / Card2
  ▼
渲染：children 顺序即呈现位（Card1：[0] 左单值，[1]/[2] 右斜杠双值）
```

要点：

-   **模板默认值有三重兜底身份**：接口未命中该 metric / fallback 也未覆盖 / rows 整体为空时，最终都落到模板 value 展示（5ga 低空站点当前即纯靠模板值展示）
-   **页面层不做任何数据加工**，只消费 service 输出的模板数组；轮询间隔是页面层唯一读的 env 字段
-   **数据结构定义与匹配键字典见同目录 data-model.md**（本文不重复字段表）

## 交互

静态展示 + 5min 轮询刷新，不参与类型联动（统计为保障区域汇总，非按类型过滤）。

## 边界

-   `enableStaticData` 未配置时保持接口请求 + 模板回填（开关可回退）
-   旧 mock `key-guarantee-area-business.json` 保守保留未删
