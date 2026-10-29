# Task · 2026-10-28-001-scguarantee-baseservice-split

> 事后补卡：实际改动已先行完成，本卡用于补齐流程记录与文档回填。

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-28-001-scguarantee-baseservice-split` |
| Status | 已完成 |
| 类型 | 编码（配置层） |
| 影响范围 | `public/environment.json`、`public/environment-local.json`、`web/services/shenzhen-communication-guarantee/` 下 7 个 service 文件、`design/002-architecture.md` |
| Roadmap | N/A（小改动） |
| 验收标准 | 模块内 7 个 service 的 `baseUrlType` 均指向 `shenzhenMeetingViewService`，且该 key 在两份 environment 配置中存在；模块内无 `sceneViewService` 残留 |
| 前置依赖 | 无 |

## 目标（Goal）

将深圳保障屏（shenzhen-communication-guarantee）的数据源服务从公用的 `sceneViewService` 拆分为独立的「深圳会议场景视图服务」，为后续该屏切换到独立后端地址做准备。

## 步骤（执行计划）

- **步骤 1：新增服务配置** —— `environment.json` / `environment-local.json` 新增 `shenzhenMeetingViewService`，`direct` 暂同 `sceneViewService`（`http://10.10.6.148:8085`），后续后端出地址只改配置不改代码。
- **步骤 2：替换模块 baseUrlType** —— `web/services/shenzhen-communication-guarantee/` 下 7 个文件（area/section-center、area/section-left、area/trend、components/index、home/center、home/section-left、home/section-right）的 `baseUrlType` 常量由 `sceneViewService` 改为 `shenzhenMeetingViewService`。
- **步骤 3：验证** —— grep 确认模块内无 `sceneViewService` 残留；其他模块不受影响（`getViewItemDataApi` 未显式传时默认仍为 `sceneViewService`）。
- **步骤 4：文档回填** —— `design/002-architecture.md` 关键决策补充「服务地址选择（公用能力）」条目（含链路、在用服务清单、硬约束）。

## 不做清单

- 不改 `getViewItemDataApi` 默认 `baseUrlType`（其他模块仍走 `sceneViewService`）
- 不改 `web/services/request/` 请求层代码
- 不调整任何视图数据结构 / viewItemId

## 决策记录

### 2026-10-28

> - **决策**：新服务命名为 `shenzhenMeetingViewService`（用户原拟 `sceneSMeetingViewService`，含义「深圳会议场景」，由 AI 翻译定名）。
> - **理由**：与 `sceneViewService` 命名风格一致，且与模块名 `shenzhen-communication-guarantee` 呼应。
> - **影响**：只改 environment.json 一处 + 模块内常量；后续换名成本低。
> - **已回写**：是 → `design/002-architecture.md`

> - **决策**：两份 environment 配置必须同步新增 key，只改 service 不改配置会导致生产请求全部失败（`instance.ts` 对 `env[baseUrlType]` 解构 undefined 抛 TypeError）。
> - **影响**：已同步两份配置。
> - **已回写**：是 → `design/002-architecture.md`

## 进度日志

### 2026-10-28

> - environment.json / environment-local.json 新增 `shenzhenMeetingViewService`（direct 暂同旧服务）
> - 模块 7 个 service 文件 `baseUrlType` 全部替换，grep 验证无残留
> - 002-architecture.md 回填「服务地址选择」公用能力说明
> - 本卡为事后补卡（用户要求）

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（事后追认） | 2026-10-28 | 用户 |
| ② 实现验收 | 已通过（grep 验证） | 2026-10-28 | 用户 |

## 引用一致性（归档前必走）

- [ ] `current-sprint.md` —— 移除该任务索引行
- [ ] `backlog.md` —— 未登记，N/A
- [ ] `roadmap.md` —— 无对应条目，N/A
