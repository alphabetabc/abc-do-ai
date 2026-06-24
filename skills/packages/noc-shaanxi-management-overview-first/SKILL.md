---
name: 'noc-shaanxi-management-overview-first'
version: '2.0'
updated: '2026-06-24'
description: '中屏管理总览第一屏（management-overview-first）模块的唯一技能入口与持续进化索引。负责组织子组件文档、新增判定、跨子模块协作规则。'
---

# 管理总览第一屏技能（索引入口）

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v2.0     |
| 最后更新 | 2026-06-24 |

本技能是 `web/pages/management-overview-first/` 的**唯一索引入口**。SKILL.md 只承担**快速定位**职责，详细规则与扩展流程拆分到独立文档：

- 设计原则、跨子模块工作流、已知差异 → [`principles.md`](./principles.md)
- 如何新增 / 更新 / 删除子组件文档 → [`how-to-extend.md`](./how-to-extend.md)

本技能随源码**持续进化**——任何源码改动都应在对应的子组件文档里同步体现。

---

## 一、模块位置

```
web/pages/management-overview-first/
├── index.less            # 全屏样式
├── metaHumanPresets.ts   # 数字人预设
├── render.tsx            # 渲染入口
└── modules/
    ├── screen.ts         # 屏幕配置（区域、缩放等）
    ├── fields.ts         # 字段定义
    ├── enum.ts           # 枚举定义
    ├── index.ts          # 模块导出
    ├── page-title/       # 顶部标题
    ├── zone-select/      # 区域选择
    ├── meta-human-helper-zone/ # 数字人辅助区
    ├── center/           # 中心区域（核心，含 tab1/2/3）
    │   └── components/
    │       ├── tab-button/
    │       ├── tab-content-1/components/  # tab1：网络覆盖 + GIS（含 center-gis）
    │       ├── tab-content-2/             # tab2：卡片布局
    │       └── tab-content-3/components/  # tab3：飞线 + 数据中心列表
    ├── family-business/            # 家庭业务
    ├── personal-business/          # 个人业务
    └── government-enterprise-business/  # 政府企业业务
```

---

## 二、子组件文档索引

判定与维护流程详见 [`how-to-extend.md`](./how-to-extend.md)。下表是当前已登记的子组件。

### 2.1 纯组件类（`components/`）

| 子组件                       | 文档                                                 | 源码位置                                                                                          | 一句话能力                              |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| image-gis（中心区 GIS 组件） | [components/image-gis.md](./components/image-gis.md) | `web/pages/management-overview-first/modules/center/components/tab-content-1/components/center-gis/` | 网络覆盖图层、流光动画、图例控制、地图交互 |

### 2.2 业务模块类（`modules/`）

| 子模块                                            | 入口                                                                                                              | 源码位置                                                                       | 一句话能力                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| government-enterprise-business（政府企业业务模块） | [modules/government-enterprise-business/SKILL.md](./modules/government-enterprise-business/SKILL.md)              | `web/pages/management-overview-first/modules/government-enterprise-business/` | 6 种政企业务的概览（椭圆轨道）和详情页（配置驱动渲染）    |

> 暂未登记的子模块（个人业务 / 家庭业务 / 中心区其它 tab 等）按需新增，详见 [`how-to-extend.md`](./how-to-extend.md)。

---

## 三、调用时机速查

**优先调用本技能当：**

- 用户提出**跨子模块**的修改（涉及多个子模块需要协调）
- 用户**首次描述**该屏相关需求，希望了解有哪些子模块可独立维护
- 需要调整 `render.tsx` 装配顺序、`screen.ts` 区域配置、`index.less` 全屏样式
- 需要新增 / 更新 / 删除子组件文档（按 [`how-to-extend.md`](./how-to-extend.md) 流程）

**直接查阅子组件文档当：**

- 修改目标明确落在某个子模块（如"修改 ImageGis 的图例顺序"）

---

## 四、关联技能（引用方式：skill id）

引用其他技能时仅写 **skill id**，不带文件路径：

- `@noc-shaanxi-management-overview-first`（本技能）
- `@noc-shaanxi-ui-streamer-path`（流光路径组件技能，本屏多处使用）
- `@noc-shaanxi-chinese-database-adapter`（国产数据库适配技能，按需查阅）

> 引用规则详见 [`how-to-extend.md` §七](./how-to-extend.md#七跨技能引用约定)。

---

## 五、详细文档入口

| 文档                                          | 内容                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| [`principles.md`](./principles.md)             | 设计原则、跨子模块工作流、核心职责速查、已知差异                                  |
| [`how-to-extend.md`](./how-to-extend.md)       | `components/` vs `modules/` 判定流程、新增 / 更新 / 删除流程、文档模板、版本号约定 |

---

## 六、版本演进说明

| 版本  | 关键变更                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| v1.0  | 初始版本：建立 `management-overview-first` 总技能目录                                                                |
| v1.1  | `image-gis` 详细文档从内联改为外置，迁移至 `components/image-gis.md`                                                |
| v1.2  | 新增 `modules/` 子目录；政府企业业务模块三份文档迁入 `modules/government-enterprise-business/`                       |
| v1.3  | 删除独立子技能 `image-gis/` 与 `noc-shaanxi-first-government-enterprise-business/`，所有子组件文档统一收纳在本技能内 |
| v2.0  | **大版本重构**：SKILL.md 转为纯索引入口；新增 `principles.md`（设计原则 / 工作流 / 差异）与 `how-to-extend.md`（持续进化指南）；跨技能引用改为 skill id 形式 |