# Task · 2026-10-21-003-scguarantee-safety-monitor-module

> 源需求：2026-10-21 用户提出（首屏新增模块）
> 位置参照：[modules/index.ts](../../../../../web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/index.ts) 既有布局坐标

## 任务元信息

| 项       | 值                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-21-003-scguarantee-safety-monitor-module`                                                                       |
| Status   | 已完成（2026-10-21 用户验收通过并归档）                                                                                       |
| 类型     | 编码                                                                                                                          |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/`（新增 safety-monitor 模块）+ `modules/index.ts` 布局登记 |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20）                                                                                          |
| 验收标准 | 见下方 checklist（澄清后细化）                                                                                                |
| 前置依赖 | 无                                                                                                                            |

## 目标（Goal）

首屏新增「安全监测」模块，位于网络规模（area-business）下方。

## 需求要素

- 模块名：安全监测
- 位置：网络规模模块下方（右列）
- 设计稿坐标：宽 744px、高 391px、顶部 1567px、左侧 2970px（源自设计稿标注，实际以布局对齐为准）

## 功能列表

- F1 新增 safety-monitor 模块（新模块目录 + 容器 PanelBgSvg 复用 + index.ts 布局登记）
- F2 模块内容（2026-10-21 用户澄清）：两个安全监测指标——「重保IP异常流量告警：0」「重保域名DNS异常解析告警：0」，数值先按 0
- F3 容器与数据实现（2026-10-21 用户澄清）：container 与网络规模（area-business）一致——复用 PanelBgSvg 容器；数据实现方式比照网络规模模式（enableStaticData 静态直出，源码默认模板 + 环境配置可覆盖）

## 开放问题

| #   | 问题                                                                                   | 负责人    | 状态   | 结论                                                                                                 |
| --- | -------------------------------------------------------------------------------------- | --------- | ------ | ---------------------------------------------------------------------------------------------------- |
| 1   | 模块内容：展示哪些数据项？数据来源（接口/静态）？                                      | 用户/PM   | 已关闭 | 指标已定：重保IP异常流量告警 0、重保域名DNS异常解析告警 0；比照网络规模模式（enableStaticData 直出） |
| 2   | UI 设计稿（背景图/卡片样式）？                                                         | 用户/设计 | 已关闭 | container 与网络规模一致（PanelBgSvg 复用）；内部卡片样式先按现有布局过渡，设计稿出来再调            |
| 3   | 坐标 1567/2970 与现有 area-business 底部是否自然衔接（需以实际布局对齐，坐标仅参考）？ | 用户      | 已关闭 | 自然衔接：网络规模 top 362 + 高 1189 = 底 1551，1567 落位无重叠（2026-10-21 实现验证） |

## 步骤（执行计划）

### 步骤 1：需求澄清（硬门槛①前置）

- **动作**：确认开放问题 1–3
- **输出**：结论回填，功能列表定稿，任务卡转「待审批」
- **等待用户**：是

### 步骤 2：需求审批（硬门槛①）

- **动作**：批准定稿后的任务卡
- **等待用户**：是

### 步骤 3：实现 ✅（2026-10-21 完成）

- **动作**：新增模块（目录骨架 + 布局登记 + 内容实现），service 层按数据来源决定（静态则复用 enableStaticData 模式）
- **输出**：代码变更
- **等待用户**：否
- **实际落地**（2026-10-21 用户裁决：指标左右布局、只有静态数据、上面值下面 label）：
    - 新增 [safety-monitor/index.tsx](../../../../../web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/safety-monitor/index.tsx)：`PanelRight`（title 安全监测，744×391）；数据经 `useEnvironment` 直读环境配置 key `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-key-safety-monitor` 的 `staticData`（**无 service 层**），未下发时回退源码默认 `DEFAULT_METRICS`（重保IP异常流量告警 0、重保域名DNS异常解析告警 0）
    - [safety-monitor/index.less](../../../../../web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/safety-monitor/index.less)：两指标 space-evenly 左右布局，单个指标纵向（上值下 label），指标背景图 `images/ind-bg.png`（用户放入同目录 images，195×247）；value 渐变（白→蓝）D-DIN-PRO Heavy 900 78px / line-height 78px / letter-spacing 1.51px，label Source Han Sans CN Bold 36px / line-height 42px（2026-10-21 用户下发样式标注）
    - [modules/index.ts](../../../../../web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/index.ts)：登记「安全监测」widget，left 2970 / top 1567 / zIndex 11（网络规模 top 362 + 高 1189 = 底 1551，1567 自然衔接）

### 步骤 3.1：配置化 + 样式定稿 ✅（2026-10-21 完成）

- **动作**：按用户后续指示——METRICS 从源码常量迁到环境配置（useEnvironment 直读 + staticData 字段 + 默认值回退）、落地指标背景图与 value/label 精确样式
- **输出**：代码变更
- **等待用户**：否
- **实际落地**：见步骤 3 已合并更新（index.tsx 配置读取、index.less 背景图 195×247 + 78px/36px 样式标注）；环境配置 key 结构：`{ staticData: [{ label, value }] }`

### 步骤 3.2：label 换行 + 用户手动样式微调 ✅（2026-10-21 完成）

- **动作**：label 样式支持配置内 `\n` 换行（`white-space: pre-line`，替换原 nowrap）；用户随后手动微调样式（指标容器加宽 300×247、背景图改 `::before` 绝对定位 top 25px / z-index -1，容纳换行 label 不被背景裁切）
- **输出**：index.less 变更（用户手动 + AI 协同）
- **等待用户**：否

### 步骤 4：验证 + 回填 ✅（2026-10-21 完成）

- **动作**：本地验证 + 文档回填（任务卡 + `design/modules/shenzhen-communication-guarantee/001-home/` 新增 spec + `environment-config.md` 如涉及）
- **输出**：验收结论
- **等待用户**：是（硬门槛②）
- **实际落地**：
    - 用户 2026-10-21 本地验证通过（含环境配置 `environment-local.json` 下发 staticData + label `\n` 换行），任务截止（用户裁决「本 task 到此为止」）
    - 文档落地：新增 [006-safety-monitor/spec.md](../../../design/modules/shenzhen-communication-guarantee/001-home/006-safety-monitor/spec.md)，[001-home/README.md](../../../design/modules/shenzhen-communication-guarantee/001-home/README.md) widget 索引已登记
    - 备注：本模块无 service 层、无接口，`environment-config.md` 未登记新 key（key 结构已记录于 006 spec；后续如统一登记可补）

## 验收 checklist

- [x] A1：安全监测模块出现在网络规模下方，位置尺寸符合设计稿（宽 744 / 高 391 / 顶 1567 / 左 2970，以布局对齐为准）（用户本地验证）
- [x] A2：模块内容按定稿还原：两指标左右布局（上值下 label，ind-bg.png 背景经 ::before 定位，78px/36px 样式 + label pre-line 换行），数值与环境配置 staticData 一致（未下发回退默认 0/0）（用户本地验证，含 \n 换行）
- [x] A3：不影响现有模块布局（右列其它模块无位移回归）（用户本地验证）
- [x] `pnpm lint` 通过（用户验证流程内自行执行）

## 审批记录

| 门槛       | 状态   | 日期       | 批准人                                                        |
| ---------- | ------ | ---------- | ------------------------------------------------------------- |
| ① 需求审批 | 已批准 | 2026-10-21 | 用户（「开始编码」指令，含左右布局/纯静态/上值下 label 裁决） |
| ② 实现验收 | 已验收 | 2026-10-21 | 用户（本地验证通过，「本 task 到此为止」）                   |
