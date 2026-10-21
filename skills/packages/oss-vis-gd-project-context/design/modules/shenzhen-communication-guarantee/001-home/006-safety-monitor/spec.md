# 006-safety-monitor · 安全监测（spec）

> 2026-10-21 新增模块（task-2026-10-21-003），位于网络规模（004-area-business）下方。

## 职责

首屏右列底部，安全监测指标静态展示：

- 重保IP异常流量告警：0
- 重保域名DNS异常解析告警：0

## 布局

- PanelRight 744×391，widgets 注册 left 2970 / top 1567 / zIndex 11（网络规模 top 362 + 高 1189 = 底 1551，自然衔接）
- 两指标 space-evenly 左右布局；单个指标纵向：上 value 下 label
- 指标容器 300×247，背景图经 `::before` 绝对定位（top 25px，195×247，`images/ind-bg.png`，z-index -1）

## 组件构成

- 源码：`web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/safety-monitor/`（index.tsx + index.less + images/ind-bg.png）
- `index.tsx`：`useEnvironment` 直读环境配置 key `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-key-safety-monitor` 的 `staticData`，**无 service 层**；未下发时回退源码默认 `DEFAULT_METRICS`（两指标 0）
- 样式（2026-10-21 用户下发标注）：
    - value：渐变文字（白→蓝，`rgba(255,255,255,1)` → `rgba(0,167,255,1)`）、D-DIN-PRO Heavy 900、78px / line-height 78px、letter-spacing 1.51px
    - label：Source Han Sans CN Bold 700、36px / line-height 42px、letter-spacing 1.51px、居中、`white-space: pre-line`（支持配置内 `\n` 换行）

## 数据（纯静态，环境配置可覆盖）

- key：`shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-key-safety-monitor`
- 结构：`{ staticData: [{ label, value }] }`；label 支持以 `\n` 分行（如 `"重保域名DNS\n异常解析告警"`）
- 回退：源码 `DEFAULT_METRICS`（重保IP异常流量告警 0、重保域名DNS异常解析告警 0）
- 与 enableStaticData 模式差异：本模块无接口链路、无轮询，`staticData` 即最终渲染数据（无需 viewItemDataTemplate/回填）

## 交互

静态展示，不参与任何联动（类型过滤/区域轮巡均无关）。

## 边界

- 无接口请求、无 service 层；数值变更走环境配置
