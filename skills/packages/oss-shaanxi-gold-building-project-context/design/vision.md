# vision.md · 北极星 + 禁止清单

> **init 草稿 · 待显式确认后生效**（2026-09-04 init）
>
> 证据日期：2026-09-04。证据来源：`docs/as-is/README.md`、`docs/specs/001-gold-building/as-is.md`、`docs/design/system-overview.md`。
>
> 本文件承载本项目的方向锚点与长期禁项。冲突时优先级：`vision.md` > `architecture.md` > `user-story-map.md`（roadmap 在 `plans/roadmap.md`，不参与本优先级链）。

---

## 一句话定位

本项目是**陕西综合资源**下的**金牌楼宇（要客资源可视化）**数字孪生展示平台：基于 MidwayJS + React + Cesium 的 BFF/SSR 单仓后台，提供金楼 3D 场景、资源管理、告警监控、环境监测等可视化能力。

## 北极星指标（North Star Metric）

> 待定（项目方提供）

建议候选（待项目方确认/替换）：

- **核心旅程完成度**：`/gold-building` 路径下“加载 3D → 查看告警 → 查看资源详情 → 查看环境”四步全完成的会话占比。
- **存量指标**：`/gold-building` 页面首屏 < 3s、`/api/goldBuilding/*` P95 < 500ms（沿用 `docs/design/architecture.md` §1）。

## 长期愿景（3~5 年）

- **标杆场景**：成为陕西综合资源下数字孪生展示的基线模板。
- **能力外延**：以金楼为种子，把 3D 资源/告警/环境能力复用到同集团其他综合资源场景。
- **数据真实化**：从 Mock 数据过渡到生产 API（解冻条件见 `docs/as-is/known-debt.md` §3）。

> 数值化目标（用户数 / 场景数等）：**待定**。

## 禁止清单（Do-Not · 项目级 · 长期不变项）

> 来自仓库根 `AGENTS.md` 与 `docs/as-is/known-debt.md`，本节沉淀为本项目 AI 协作侧的硬约束。

- 🚫 不引入新 ORM（TypeORM 0.3 + MongoDB 已锁，禁 Prisma / Sequelize / Mongoose-only 等）。
- 🚫 不上线 RBAC / 用户登录 / 强制改密 —— 本期为公开演示系统（见 `docs/as-is/auth-rbac.md` §1）。
- 🚫 不在 `/gold-building` 与 `/demo-building-viewer` 之外新增公开路由 —— 现网只有这三条公开入口（见 `docs/as-is/routes-menus.md` §1）。
- 🚫 不改生产路径前缀 `/coverage_scene`（见 `docs/as-is/routes-menus.md` §2）。
- 🚫 不升 `@midwayjs/*`、`cesium`、`antd`、`react` 主版本 —— 升级先开 ADR。
- 🚫 不绕过 as-is 门禁；`docs/specs/{编号}/as-is.md` 未填完不得标可实现、不得编码。

## 关键假设

| 假设 | 验证方式 | 失效动作 |
| --- | --- | --- |
| 金楼是陕西综合资源下唯一需要 3D 展示的场景，模板可横向复用 | 下一个综合资源子项目立项时检验 | 拆出独立的 `<other-resource>-visual-*` 仓库 |
| 公开演示模式可继续承载演示流量，不需 RBAC | 演示环境 SLA 监控；观测是否出现越权访问投诉 | 重新评估 RBAC（解冻 known-debt §3） |
| Mock → 生产 API 的切换只换数据源，不换前端协议 | 接入真实 API 后做
