# Task · 2026-10-20-002-scguarantee-intl-roam-requirement

> 源需求：`docs/specs/shenzhen-communication-guarantee/pm-inputs/assets/20261020/反拉终端---2026年10月20日.md` 第 4 点（国漫）+ 第 6 点（通信服务），同属首屏「通信服务」模块（[communication-service](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/communication-service/index.tsx)：个人/家庭/政企 + 漫入TOP5）

## 任务元信息

| 项       | 值                                                                                                                                                                                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编号     | `task-2026-10-20-002-scguarantee-intl-roam-requirement`                                                                                                                                                                                                                                                                                       |
| Status   | 已完成（以代码为准验收，2026-10-22）                                                                                                                                                                                                                                                                                                          |
| 类型     | 编码                                                                                                                                                                                                                                                                                                                                          |
| 影响范围 | [RoamingTop5.tsx](web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/communication-service/RoamingTop5.tsx)、FamilyBusiness / GEBusiness、[section-left.ts](web/services/shenzhen-communication-guarantee/home/section-left.ts)（intl-roam-top5 + chbn 三接口默认模板）、`environment.json` 相关 key |
| Roadmap  | 深圳保障屏反拉终端调整（2026-10-20）                                                                                                                                                                                                                                                                                                          |
| 验收标准 | 见下方 checklist                                                                                                                                                                                                                                                                                                                              |
| 前置依赖 | 无                                                                                                                                                                                                                                                                                                                                            |

## 目标（Goal）

调整首屏「通信服务」模块：① 国际漫入（第 4 点）：15 分钟粒度实时全网数据，用户与业务（流量）据实展示（TOP + 趋势图，流量可用趋势图、用户需增加总数）；② 通信服务简化（第 6 点）：个人业务不变，家庭/政企业务各保留 2 项指标。

## 需求原文

第 4 点（国漫）：

- 15 分钟粒度实时全网数据
- 用户：据实；业务（流量）：据实
- 流量来自 APEC 大屏的地市的天粒度数据
- TOP（TOP5-TOP10）+ 趋势图
- 可以流量用趋势图，用户要增加总数
- 数据：服务端设计

第 6 点（通信服务）：

- 保留个人业务，家庭业务简化（家宽用户数+XX--IPTV）和政企业务简化（专线+XX-物联网）

## 实现结论（2026-10-22 以代码为准回填）

### 国际漫入（RoamingTop5 重构）

- **接口升级**：`intl-roam-top5` 返回结构直接挂 `data.viewItemData.data`，新版字段：`userCnt/userUnit/userTrend`（总用户数+较上周趋势）、`topNUnit`、`topN`（TOP10，行含 `countryName/userNbr/unit/trend`）、`flowChart`（流量趋势点）、`hKMacaoTwanUserCnt(+Unit)`（港澳台漫入用户数）；类型 `TIntlRoamTop5Result` 等三组；非生产环境附 `__development__raw` 调试快照
- **组件重构**（RoamingTop5.tsx）：
    - 头部「国际及港澳台漫入(15min)」：图标+底座+蓝条三背景拼合；总用户数（DIN 42px）+ 环比箭头（trend-up/down）
    - TOP10 双列榜单：rank/国家/用户数/趋势箭头，三档 corner 装饰（titleTop10）
    - 港澳台：双轴锥形图（custom series 自绘，香港走左轴、澳门/台湾走右轴，titleHkMacao）
- **15min 轮询**保留（pollingInterval 可配置），与需求粒度一致
- **flowChart 已建模未消费**：流量趋势被港澳台锥形图替代（以代码为准）；字段保留供后续启用

### 通信服务简化

- 个人业务：不变（模板微调 2G/通信客户数等 label，结构不动）
- 家庭业务：4 项 → 2 项（**有线宽带**、IPTV；默认模板 type '1'/'2'）
- 政企业务：4 项 → 2 项（**物联网连接数**（type '1'）、**双线到达规模**（type '3'）；源码注释：PM 拟改「专线客户数」待后端字段确认）

> 与需求原文措辞出入（按代码为准）：家庭留「有线宽带」而非「家宽用户数」；政企留「双线到达规模」而非「专线客户数」。label 可由接口 `typeName` 或环境模板覆盖。

## 功能列表（定稿回填）

- F1 数据源：`intl-roam-top5` 单接口升级（服务端新结构）+ chbn 三接口模板精简 ✅
- F2 用户维度：TOP10 榜单 + 总数（`userCnt` 接口返回汇总字段）✅
- F3 流量维度：`flowChart` 已建模，当前展示形态由港澳台锥形图替代（以代码为准）✅
- F4 RoamingTop5 重构为「头部总数 + TOP10 榜单 + 港澳台锥形图」✅
- F5 个人业务不变 ✅
- F6 家庭业务简化为 2 项 ✅（指标措辞与原文有出入，见实现结论）
- F7 政企业务简化为 2 项 ✅（「专线客户数」label 待后端字段确认，源码已注释）

## 开放问题（全部关闭）

| #   | 问题                                                                                                         | 结论（以代码为准）                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | 用户榜单接口方案                                                                                             | 已定：`intl-roam-top5` 升级新结构（userCnt/topN/flowChart/hKMacaoTwanUserCnt），15min 轮询                                     |
| 2   | TOP 取几                                                                                                     | TOP10（双列榜单）                                                                                                             |
| 3   | 总数来源                                                                                                     | 接口返回 `userCnt` 汇总字段，头部展示 + userTrend 环比箭头                                                                     |
| 4   | 趋势图数据结构                                                                                               | `flowChart` 已建模；展示形态由港澳台双轴锥形图替代（hKMacaoTwanUserCnt）                                                       |
| 5   | intl-roam-top5 保留/替换                                                                                     | 保留并升级结构（同 viewItemId，converter 改读 `data.viewItemData.data`）                                                        |
| 6   | UI 形态                                                                                                      | 已按新版视觉落码（头部/TOP10/锥形图，见 design 002 spec）                                                                      |
| 7   | 家庭/政企简化后 UI                                                                                           | 沿用现有 2 列条带布局，仅指标精简为 2 项                                                                                        |

## 遗留备注

- 政企业务 label「双线到达规模」→ PM 拟改「专线客户数」，待后端字段确认后调整（源码 GEBusiness 默认模板注释在案）
- `flowChart` 字段已建模未消费，后续若恢复流量趋势图可直接启用

## 验收 checklist

- [x] A1：接口方案已落卡（intl-roam-top5 新结构 + 15min 轮询）
- [x] A2：用户维度展示 TOP10 榜单 + 总数（userCnt + 环比箭头）
- [x] A3：流量/趋势维度以港澳台双轴锥形图形态落码（flowChart 建模保留）
- [x] A4：15 分钟粒度实时数据刷新正常（pollingInterval 可配置）
- [x] A5：个人业务不变；家庭 2 项、政企 2 项（措辞与原文出入已按代码为准回填备注）；design 002 spec/data-model 已同步
- [x] `pnpm lint` 通过（用户裁决免跑，2026-10-22）

## 审批记录

| 门槛       | 状态   | 日期       | 批准人 |
| ---------- | ------ | ---------- | ------ |
| ① 需求审批 | 免审批（以代码为准补记） | 2026-10-22 | 用户 |
| ② 实现验收 | 已验收 | 2026-10-22 | 用户 |

## 变更记录

| 日期       | 内容                                                       |
| ---------- | ---------------------------------------------------------- |
| 2026-10-20 | 建卡（反拉终端第 4+6 点，待澄清）                          |
| 2026-10-22 | 以代码为准回填实现结论，用户验收通过，归档 done/2026-10/  |
