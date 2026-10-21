# zero-excellent · 四零双优保障目标（共享组件）

> 源码：`web/pages/shenzhen-communication-guarantee/sub-pages/components/zero-excellent/`。2026-10-20 反拉终端第 7 点新增（task-2026-10-20-004，提交 9a9a3bb），挂载于 `sub-pages/index.tsx` 头部中位槽位 `header-zero-excellent`，纯展示组件、不参与 widget 体系与交互字段。

## 职责

中顶部保障目标展示：APEC LOGO 标识 + 「四零」「双优」两张轮播卡，突出「零」「优」二字。

- 四零：重大网络事故 / 重大安全事件 / 重大客户投诉 / 负面焦点事件
- 双优：客户感知 / 社会评价

## 组件构成

- `ZeroExcellent`（index.tsx）：`useState` + `setInterval` 自驱动轮播，两卡索引各自独立递增，同一 `ROTATE_INTERVAL = 3000ms`；卸载时 `clearInterval`
- 布局：flex 横排（gap 40px）——左侧 logo（logo.svg 自带「四零双优」文字，186×112）+ 右侧两张轮播卡（banner.svg 打底，542×63，上下双光带，文字叠加）
- 素材：`images/logo.svg` / `images/banner.svg`（本地静态资源，无接口）

## 轮播与样式要点

- 轮播形式：四零/双优两卡并行、各自 3s 逐条轮巡；文案切换走 `key` 重挂载触发 `zero-excellent-fade`（0.45s 上浮淡入）
- 「零」/「优」突出：`highlight` 样式——YouSheBiaoTiHei 68px；零 = 青色 `rgba(127,239,255,1)` + 青色光晕；优 = 绿色 `rgba(140,255,196,1)` + 绿色光晕；分别固定在卡片两端（space-between / flex-start / flex-end 三态，文字距边缘 80px）
- 正文文字：Source Han Sans CN 42px/700，白色

## 数据与交互

- 无接口、无配置（文案为源码常量 `ZERO_LIST` / `EXCELLENT_LIST`）
- 无交互、不订阅 fields.ts

## 关联变更（同任务）

- 顶部天气卡（[001-weather-card](../001-weather-card/spec.md)）移除挂载：`sub-pages/index.tsx` 不再引用 WeatherCard，组件目录与 `getWeatherDataApi` 链路保留可回退
- HEADER_TITLE 改为「深圳APEC会议通信保障」
