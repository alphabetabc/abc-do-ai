# 002-communication-service · 通信服务（spec）

## 职责

首屏左侧，深圳维度（非区域维度）的通信服务指标：个人业务、家庭业务、政企业务、国际漫入 TOP5。

## 布局

- 设计稿 Frame 48095765：宽 720 × 高 1564，left 130 / top 362
- 容器：`PanelLeft`（含标题「通信服务」）；四块业务纵向排布在本面板内
- panel-content：padding 38px 40px，flex column，row-gap 40px

## 组件构成

| 组件文件               | 导出名             | 指标                                                   | 接口函数                                | viewItemId                 |
| ---------------------- | ------------------ | ------------------------------------------------------ | --------------------------------------- | -------------------------- |
| `IndBox.tsx`           | `IndBox`           | 小标题容器（竖线+背景+标题+内容区）                    | —                                       | —                          |
| `PersonalBusiness.tsx` | `PersonalBusiness` | 个人业务：总用户数、5G、4G、物联网、其它               | `getPersonalBusinessApi`                | `chbn-business-personal`   |
| `FamilyBusiness.tsx`   | `FamilyBusiness`   | 家庭业务：家宽、IPTV、爱家TV、固话                     | `getFamilyBusinessApi`                  | `chbn-business-home`       |
| `GEBusiness.tsx`       | `GEBusiness`       | 政企业务：专线客户、5G专网项目、物联网客户、车联网客户 | `getGEBusinessApi`                      | `chbn-business-government` |
| `RoamingTop5.tsx`      | `RoamingTop5`      | 国际漫入 TOP5（按用户数统计）                          | `getIntlRoamTop5Api`（已接，2026-10-12） | `intl-roam-top5`           |

接口信息见同目录 `data-model.md`。

## 样式规格（设计稿值）

### IndBox 小标题

- 竖线：4px 宽，`rgba(37, 200, 246, 1)`
- 背景：`rgba(37, 200, 246, 0.1)`
- 标题文字：`rgba(255,255,255,1)` / Source Han Sans CN / 36px / weight 500 / line-height 56px / letter-spacing 0 / 左对齐
- `--titleHeight`：56px（内容区高度 calc(100% - 56px)）

### PersonalBusiness（饼图 + 图例）

- 饼图容器：180×180，radius [70, 90]，padAngle 3
- 中心文字：label 28px Source Han Sans CN / value 32px DIN `rgba(113,152,211,1)` / unit 24px
- 图例项（50% 宽，2 列）：
    - label：28px / weight 500 / letter-spacing 2px / `rgba(255,255,255,1)`
    - 色点：20×20 圆形
    - value：32px DIN / `rgba(113,152,211,1)` / weight 500
    - unit：28px Source Han Sans CN / `rgba(255,255,255,1)`（2026-10-13 现场优化统一 28px）
- 饼图 tooltip（2026-10-13 现场优化）：背景 `rgba(0,0,0,0.7)`，边框 `rgba(0,153,255,0.5)`，文字白 32px

### FamilyBusiness / GEBusiness（标题块 + 值条带）

- item：50% 宽 × 92.67px，flex，align-items center，column-gap 20px
- 标题块：121.07×90.67px，背景 `business-ind-icon.png`，28px Bold `rgba(238,247,254,1)` / weight 700 / letter-spacing 0，flex 居中
- 值条带（40% 宽）：36px DIN Medium / `rgba(255,255,255,0.8)` / weight 500 / letter-spacing 1.62px，底部 skewX(-35deg) 蓝条 `rgba(5,93,200,1)` opacity 0.64
- unit：28px Source Han Sans CN `rgba(255,255,255,1)`（2026-10-13 现场优化统一 28px）

### RoamingTop5（三档行条带；2026-10-13 现场优化）

- 面板标题：国际漫入TOP5
- 列头「用户数」：28px Source Han Sans CN / weight 500 / letter-spacing 0 / 右对齐
- 行：65px 高，margin-block 10px，padding 0 10px 0 25px
- 三档背景：`roaming-top5-bg-1/2/3.svg`（top-0/1/2 分别对应 1/2，其余 3）
- label：28px Source Han Sans CN / weight 500，不固定宽度（原 110px ellipsis 方案废弃），margin-right 10px
- 进度条：100% 宽 × 4px，底色 `rgba(107,107,107,1)`，填充 `rgba(5,93,200,1)`
- value：36px DIN / `rgba(113,152,211,1)` / weight 500，千分位（`toLocaleString('en-US')`）
- unit：24px / 白色 / margin-left 5px / margin-top 5px（2026-10-14 新增，取接口 `unit` 字段，如 "个"）

## 素材

| 文件                           | 用途                                          |
| ------------------------------ | --------------------------------------------- |
| `images/business-ind-icon.png` | 家庭/政企 标题块背景（原 chbn-ind-icon.png）  |
| `images/roaming-top5-bg-1.svg` | 漫入TOP5 第 1 行背景（原 chbn-top5-bg-1.svg） |
| `images/roaming-top5-bg-2.svg` | 第 2 行背景                                   |
| `images/roaming-top5-bg-3.svg` | 第 3–5 行背景                                 |

## 交互

静态展示，无交互（不参与类型联动——统计维度是深圳地市整体）。

## 边界

- 漫入 TOP5 不足 5 条：按实际条数展示
- 漫入 TOP5 接口未开发前用组件内 `MOCK_DATA` 假数据，不写 mock、零自造 API
