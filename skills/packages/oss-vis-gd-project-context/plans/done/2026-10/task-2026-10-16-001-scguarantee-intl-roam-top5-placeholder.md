# Task · 2026-10-16-001-scguarantee-intl-roam-top5-placeholder

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-16-001-scguarantee-intl-roam-top5-placeholder` |
| Status | 已完成 |
| 类型 | 编码 |
| 影响范围 | `web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/communication-service/RoamingTop5.tsx`；`.trae/skills/oss-vis-gd-project-context/design/modules/shenzhen-communication-guarantee/000-overview/environment-config.md` |
| Roadmap | N/A（小改动） |
| 验收标准 | 初始化请求未返回时 RoamingTop5 渲染环境配置 `defaultRows` 占位；接口返回（含空数组）即覆盖；配置已登记 environment-config.md |
| 前置依赖 | task-2026-10-12-008-00（intl-roam-top5 接口落码） |

---

## 目标（Goal）

首屏「国际漫入TOP5」组件在初始化接口未返回前无内容，需新增一个环境配置 key 作为首帧占位数据，并登记进模块环境配置清单。

---

## 步骤（执行计划）

### 步骤 1：组件接入环境配置占位

- **动作**：`useEnvironment` 改为项目统一 `~/web/hooks/useEnvironment`，传 keyPath `shenzhen-communication-guarantee.homeConfig.shenzhen-communication-guarantee-view-intl-roam-top5` 解构 `defaultRows`；rows 取值 `data ?? (isEmpty(defaultRows) ? [] : defaultRows)`；类型 `as TIntlRoamTop5Row[]`
- **输出**：RoamingTop5.tsx
- **等待用户**：否

### 步骤 2：登记环境配置

- **动作**：environment-config.md 的 `homeConfig` 下新增 `shenzhen-communication-guarantee-view-intl-roam-top5` key（值仅含 `defaultRows`，结构与接口 rows 一致：countryName / userNbr / unit）；同步更新 §2 统计（8→9 个 key）与 viewPageArgs 透传说明
- **输出**：environment-config.md
- **等待用户**：否

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-10-16 | 兜底逻辑由「!isEmpty(data) 覆盖空数组」改回 `data ?? ...`（仅 undefined 时占位） | 用户澄清：配置仅作初始化占位，非接口空数据兜底 | 否 |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（对话内确认） | 2026-10-16 | user |
| ② 实现验收 | 已通过（用户确认占位语义 + IDE 诊断无报错） | 2026-10-16 | user |

---

## 进度日志

### 2026-10-16

> - RoamingTop5.tsx：接入 useEnvironment keyPath 读取 defaultRows，初始化占位；导入源统一为 `~/web/hooks/useEnvironment`（原 fedx-3d-renderer dist 路径与模块内其它组件不一致）
> - environment-config.md：新增 key 并修正统计口径；注明该 key 无 viewPageArgs、service 层不消费，纯组件层占位
> - 本任务未走事前建卡（小改动直接编码），应用户要求事后补卡归档

## 决策记录

### 2026-10-16

> - **决策**：配置 key 采用 `shenzhen-communication-guarantee-view-intl-roam-top5`（与其它视图项 key 统一），值仅含 `defaultRows`；占位用 `??` 而非 `!isEmpty(data)`
> - **理由**：与模块内既有 9 个 key 命名风格一致；service 层失败时返回 `[]`，`??` 保证接口正常返回（含空数组）即覆盖占位，避免占位数据压掉真实「无数据」状态
> - **影响**：配置下发侧按 environment-config.md 中结构下发即可
> - **已回写**：是 → `design/modules/shenzhen-communication-guarantee/000-overview/environment-config.md`

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 登记至「最近完成」
- [x] `backlog.md` —— 未登记过，N/A
- [x] `roadmap.md` —— 小改动，N/A
