# 金楼可视化页面（/gold-building）文档 · 索引

> 页面路径：`web/pages/gold-building/`
> 通用三维地球组件文档：见 `design/frontend/earth/`（common-layer / business-layer）
> 证据日期：2026-11-05（基于当日逐文件实读 + docs/specs/001、003 全量提炼）
> 背景：项目方不再主动维护 `docs/specs/001-gold-building` 与 `docs/specs/003-vip-customer`，本目录为其知识的**唯一延续权威**。

| 文档 | 范围 | 什么时候读 |
| --- | --- | --- |
| `page-code.md` | 页面入口三件套、布局、全部业务组件（搜索/图层树/光交箱/分光器/开通级别/要客履历卡/楼宇 3D 弹窗）、接口清单、mock 体系、交互协议、已知问题 | 开发/调试金楼页面任何组件、接接口、排查点击链路时 |
| `open-level-capability.md` | 快装服务能力（四档星级判定）需求、接口契约、验收要点（提炼自 docs/specs/001-gold-building） | 改 GoldBuildingViewer 星级逻辑 / query-for-page-judge-three-star 接口时 |
| `vip-customer.md` | 要客可视化（图层/搜索/三级定位/关联资源/履历卡/楼外光缆段）需求、数据模型、接口契约、遗留事项（提炼自 docs/specs/003-vip-customer） | 开发要客相关任何能力时 |

两套知识的关系：

- `page-code.md` 描述**代码现状**（含 mock 与未完成点）；`vip-customer.md` 描述**需求目标口径**。两者冲突时以 page-code.md 的源码事实为准，但需求口径（字段枚举、范围过滤规则）以 vip-customer.md 为准。
- 页面级 earth（`web/pages/gold-building/components/earth/`）是「数据编排 + 业务状态」薄壳，渲染引擎在通用层 `web/components/earth/business-gold-building/`，其文档见 `design/frontend/earth/business-layer.md`。
