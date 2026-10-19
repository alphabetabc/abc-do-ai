# Task · 2026-10-16-002-scguarantee-home-polish

## 任务元信息

| 项       | 值                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-16-002-scguarantee-home-polish`                                                                                                                                                                                                                                                                                                                                                                                                |
| Status   | 已完成（用户验证通过，已归档）                                                                                                                                                                                                                                                                                                                                                                                                               |
| 类型     | 编码                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/index.tsx` + `index.less`（回首页热区）；`web/services/shenzhen-communication-guarantee/home/section-left.ts` + `.trae/skills/.../000-overview/environment-config.md`（其他→2G用户数）；`web/pages/.../communication-service/RoamingTop5.tsx` + environment-config.md（titleUnit / pollingInterval）；`web/pages/.../components/container/panel.less` + `panel-bg-svg.tsx`（模糊修复） |
| Roadmap  | N/A                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 验收标准 | 见验收 checklist                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 前置依赖 | task-2026-10-16-001（intl-roam-top5 环境配置占位）                                                                                                                                                                                                                                                                                                                                                                                           |

---

## 目标（Goal）

首屏多处小优化（均在首屏范围内）：左上角回首页入口、个人业务「其他」改为「2G用户数」、漫入TOP5 标题后缀可配置、漫入TOP5 轮询间隔可配置、左侧面板文字模糊修复。

---

## 步骤（执行计划）

### 步骤 1：左上角回首页热区（背景层）

- **动作**：在背景层组件（sub-pages/components/background）左上角 logo 位置叠一个透明点击热区（无边框无样式，非可视按钮），点击切回首屏（复用 ViewDimensionsTypes.Home 切换逻辑）；两屏均挂载，首屏点击无副作用；热区尺寸先给初始值，由用户自行调整
- **输出**：background 组件改动
- **等待用户**：否

### 步骤 2：个人业务「其他」→「2G用户数」

- **动作**：改 section-left.ts 中 getPersonalBusinessApi 默认模板 parts type "5" 的 label；同步 environment-config.md 中对应模板
- **输出**：源码模板 + 文档两处
- **等待用户**：否

### 步骤 3：漫入TOP5 标题后缀与轮询间隔（可配置）

- **动作**：环境配置 `shenzhen-communication-guarantee-view-intl-roam-top5` key 新增 `titleUnit` 字段（默认 `（15min）`，含括号整体可配），标题渲染为「国际漫入TOP5{titleUnit}」；同 key 再增 `pollingInterval` 字段（轮询间隔毫秒，默认 15 分钟），替代源码硬编码 `TIME_RANGE.MINUTE * 15`；同步 environment-config.md
- **输出**：RoamingTop5.tsx + 文档
- **等待用户**：否

---

## 步骤 4：左侧面板文字模糊修复

- **动作**：移除 panel.less 中 `.scg-animate-panel` 的 `backdrop-filter: blur(20px)`，改在 PanelBgSvg 内用 SVG 滤镜实现等效磨砂玻璃质感（feTurbulence + feDisplacementMap 或半透明渐变叠加模拟），使文字不再处于 backdrop-filter 合成层内；视觉效果保持接近现状，由用户最终确认
- **输出**：panel.less + panel-bg-svg.tsx
- **等待用户**：否

---

## 不做清单

- 不改 15min 轮询间隔（现状已是 `TIME_RANGE.MINUTE * 15`，本任务仅使其可配置，默认值不变）
- 不动左下角 ScreenSwitch 现有交互
- 不改 top5 行内单位渲染（已支持接口 `unit` 字段）

---

## 验收 checklist

- [x] A1：区域屏点击左上角 logo 热区回到首屏；首屏点击同一位置无副作用；热区尺寸/位置参数便于用户调整
- [x] A2：个人业务饼图图例中 type "5" 项显示「2G用户数」
- [x] A3：漫入TOP5 标题显示「国际漫入TOP5（15min）」，titleUnit 环境配置可覆盖
- [x] A4：pollingInterval 环境配置可覆盖轮询间隔，未配置时默认 15 分钟
- [x] A5：左侧面板文字与右侧同等清晰度；磨砂质感视觉接近原状（用户确认）
- [x] IDE 诊断无报错；`design/modules/.../environment-config.md` 已回填

---

## 实现记录（2026-10-16）

- **步骤 1**：热区未放 background 组件（background 是 styled-div 且 `pointer-events: none`），改挂在 `sub-pages/index.tsx`（此处可直接访问 onMenuClick 切屏逻辑）。`<div className="home-logo-hotzone" onClick={() => onMenuClick(ViewDimensionsTypes.Home)} />`，样式在 `sub-pages/index.less` `.home-logo-hotzone`（用户终调为 left:0 / top:0 / 202×202，z-index:1001，cursor:pointer）
- **步骤 2**：section-left.ts type "5" label 改「2G用户数」；environment-config.md 同步。注意：环境配置若已下发旧模板（label「其他」）会覆盖源码默认值，生产需同步改下发侧
- **步骤 3**：RoamingTop5.tsx 从同一 key 解构 `titleUnit` / `pollingInterval`；`pollingInterval: pollingInterval || TIME_RANGE.MINUTE * 15`；标题 `` `国际漫入TOP5${titleUnit ?? '（15min）'}` ``。environment-config.md 已登记两字段及默认值；`public/environment-local.json` 本地配置同步补齐（含 areaCarousel 秒单位修正）
- **步骤 4（最终方案，经两轮迭代）**：
    - 初版：panel.less 移除 backdrop-filter + PanelBgSvg 加 feTurbulence 噪点磨砂 → 用户反馈视觉偏透/偏白，调参两轮仍不理想（噪点无法还原「模糊背后背景」的效果）
    - 终版：backdrop-filter: blur(10px) 挂到 `.scg-animate-panel` 的 `&::before`（absolute 铺满 + z-index:-1），磨砂层在 panel-title / panel-content 之下，文字不在过滤元素子树内、不进独立合成层，保持清晰；PanelBgSvg 恢复原状（噪点实验代码已清理）；panel.less 注释已更新说明该机制
    - 技术要点：backdrop-filter 必须挂在独立于内容层的元素（伪元素/兄弟节点）上；若挂内容容器本身，整个子树被拉进合成层，非整数倍缩放下文字二次缩放变模糊
- **验证**：IDE 诊断改动文件均无报错；eslint 因项目 eslint 配置本身加载失败（@FlyFeDX/lint-config 无 prettier 插件）无法运行，非本次改动引入

---

## 开放问题

| #   | 问题                                               | 负责人 | 状态 | 结论                                              |
| --- | -------------------------------------------------- | ------ | ---- | ------------------------------------------------- |
| 1   | 回首页按钮视觉样式（图标/文字/尺寸）是否有设计稿？ | user   | 关闭 | 用户确认：透明热区即可，尺寸自调                  |
| 2   | top5 标题单位默认值是否为「人」？                  | user   | 关闭 | 用户确认：titleUnit=（15min）整体可配，无独立单位 |

---

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 已批准 | 2026-10-16 | user   |
| ② 实现验收 | 已通过 | 2026-10-16 | user   |
