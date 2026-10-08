# Finding-004：4 个核心模块的 spec 拆分策略（D-19 ~ D-21）

> **日期**：2026-07-29
> **性质**：第二轮 research Stage C 结论
> **作用范围**：沉淀 `/docs/specs/<module>/` 的拆分组织方式
> **前置 finding**：[`2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) §2.3（业务模块识别）+ §2.4（服务端能力）+ §5.1（O-6 / O-7 / O-11）
> **关联 finding**：[`2026-07-29-003-docs-mvp-structure.md`](./2026-07-29-003-docs-mvp-structure.md) §1（最小结构）、§4（新增目录）
> **规则约束**：`.trae/rules/docs-authoring-rules.md` Rule 1（代码事实优先）
> **路线图**：`.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` §2 决策表 D-19 ~ D-21

---

## 0. TL;DR

| 模块                         | slug                           | 推荐拆分             | 理由（事实驱动）                                                                                                  |
| ---------------------------- | ------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 应急保障大屏（7 子模块）     | `emergency-support-dashboard` | **伞形 + 7 子 spec** | 7 子模块在 `environment.json.gd-emergency-support.modules` 独立配置；视图层全部由 fedx-ssr external 加载（src/ 无视图代码） |
| 五大中心（3 子中心）         | `five-major-center`            | **伞形 + 3 子 spec** | 3 子中心规模差异大（指挥调度 1 屏+2 iframe / 综合展示 1 屏+4 iframe / 态势感知 1 iframe）；独立 carousel 配置       |
| 信管局视图（4 类子视图）     | `info-management-bureau`       | **单 spec（不拆）**  | 4 类子视图共享同一 settings 列表 / 轮播 / 首页配置；业务域单一（赛事通信保障）                                       |
| GIS 大屏地图                 | `gis-entry`                    | **独立 spec**        | 独立技术栈（EMap v2 + fedx-gis）；不嵌入 emergency-support-dashboard；与五大中心共享 GIS 配置                       |
| 信息情报中心（待确认）       | `information-hub-center`       | ⏸️ **延后到 Stage E 摸排** | mock 目录存在 30+ 文件但 `environment.json` 路由未注册；可能已废弃 / 待迁移 / fedx-ssr external 加载              |

**最终 spec 目录树**：

```
docs/specs/
├── index.md                      ← 登记本表
├── spec-split-guide.md
├── _template/                    ← 五件套 + pm-inputs/
├── emergency-support-dashboard/  ← 伞形（总览 + capability-map + as-is + spec §9 子 spec 索引）
│   ├── capability-map.md
│   ├── as-is-architecture.md
│   ├── pm-inputs/{pm-requirements-input.md, code-inventory.md, assets/}
│   ├── spec.md                   ← §9 列出 7 个子 spec 入口
│   ├── plan.md
│   ├── tasks.md
│   ├── acceptance-tests.md
│   └── data-model-extensions.md
├── emergency-support-dashboard/{ensure-progress,security-mission,duty-table,early-warning-perception,emergency-resources,network-conditions,damage-to-towns}/  ← 7 个子 spec（每个复制 _template/）
├── five-major-center/            ← 伞形
│   ├── ...（同 emergency-support-dashboard 伞形结构）
│   └── spec.md §9 列出 3 子 spec：cmd-dispatcher-center / comprehensive-display-center / situation-awareness-center
├── five-major-center/{cmd-dispatcher-center,comprehensive-display-center,situation-awareness-center}/  ← 3 子 spec
├── info-management-bureau/       ← 单 spec（不拆子 spec）
│   └── ...（完整五件套 + pm-inputs/）
└── gis-entry/                    ← 独立 spec
    └── ...（完整五件套 + pm-inputs/）
```

**文件总数**（spec 部分，不含 _template/ 与公共文档）：
- 伞形 2 个 × 5 件套 + capability-map + as-is + pm-inputs(2) = 11 文件 × 2 = 22 文件
- emergency-support-dashboard 子 spec 7 个 × 5 件套 = 35 文件
- five-major-center 子 spec 3 个 × 5 件套 = 15 文件
- info-management-bureau 单 spec = 7 文件（含 pm-inputs/）
- gis-entry 单 spec = 7 文件（含 pm-inputs/）
- **合计 86 文件**（plan-003 阶段 2 的目标产出）

---

## 1. 事实摸排（本研究的输入）

### 1.1 视图层加载机制（关键事实）

| 维度         | 发现                                                                                       | 文件位置                                |
| ------------ | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| `src/` 全树  | **仅含 BFF + SSR + mock + socket + modules**；**无 `src/pages/` 或 `src/views/`**          | `src/` （`LS` 命令结果）                 |
| 路由注册     | 8 条路由注册在 `src/controller/index.ts`，全部走 `@fedx-bff-web/ssr-core.render`（CSR fallback） | `src/controller/index.ts:23-30` |
| 视图层来源   | 由 fedx-ssr 运行时从外部 CDN / 静态目录加载（`screen-list.json` 列出 8 个 screen ID：screen1~screen8） | `public/static/mock/screen-list.json`            |
| 视图代码位置 | **本仓库未含视图层代码**（视图从 `@fedx-*` 外部包加载）                                       | —                                       |

> ⚠️ 这是 finding §2.1 没明确指出的关键事实：本仓库**没有视图层代码**——所有视图组件在 fedx-ssr 运行时从外部资源加载。

### 1.2 emergency-support-dashboard 7 子模块（来自 environment.json:1581-1634）

| 子模块 key              | 中文名     | 刷新间隔 | 数据来源                                                                          |
| ----------------------- | ---------- | -------- | --------------------------------------------------------------------------------- |
| `ensure-progress`       | 保障进展   | 120s     | `src/controller/api.ts` `/api/index`（IndexData）                                |
| `security-mission`      | 保障任务   | 120s     | 同上                                                                              |
| `duty-table`            | 值班表     | 120s     | 同上                                                                              |
| `early-warning-perception` | 预警感知 | 120s     | 同上                                                                              |
| `emergency-resources`   | 应急资源   | 120s     | 同上                                                                              |
| `network-conditions`    | 网络情况   | 120s     | `src/controller/api.ts` `/api/detail/:id`（DetailData）                          |
| `damage-to-towns`       | 乡镇受损   | 120s     | 同上（`townshipNeTypes` 字典配合）                                                |

> 💡 **事实**：7 子模块**共享 BFF 同一接口**（`/api/index` 或 `/api/detail/:id`）；不同子模块通过 `id` 区分；接口形状由 `src/interface/{index,detail}.ts` 定义。
> 这意味着**伞形 spec 的 §5「数据流」**会有大量共享内容，**子 spec 不必重复写 BFF 契约**，仅写「该子模块专属字段 / 视图需求」。

### 1.3 five-major-center 3 子中心（来自 environment.json:1279-1433）

| 子中心 key                  | 视图类型             | carousel 子视图                                                                                              |
| --------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `cmd-dispatcher-center`     | 地图大屏 + iframe   | 指挥调度中心（map）+ 节假日保障（iframe URL: `:9011/share?shareId=3607`）+ 抗台防汛保障（**iframe 自嵌本项目应急保障大屏** `?hideNav=true&maxTabsCount=1&theme=dark&debug=true`）|
| `comprehensive-display-center` | 地图大屏 + iframe   | 综合展示（map）+ 人员流动 + 全运场馆 + 高速大屏 + 高铁专网（4 个 iframe，URL 模式 `:8030/guangdong-games` / `:9011/share?shareId=3387`）|
| `iframe-page.situation-awareness-center` | 纯 iframe  | 态势感知中心（URL: `http://super100.gmcc.net/nsuper-cloud/cloud`）                                            |

> 💡 **事实**：3 子中心规模差异极大——
> - cmd-dispatcher-center：**1 屏 + 2 iframe（含 1 自嵌）**—— 业务复杂
> - comprehensive-display-center：**1 屏 + 4 iframe** —— 业务最复杂（iframe 数量最多）
> - situation-awareness-center：**纯 1 iframe** —— 业务最简单（无视图代码）
>
> 因此**每个子中心都是独立的「视图契约 + iframe 清单」**，应拆为独立 spec。

### 1.4 info-management-bureau 4 类子视图（来自 environment.json:1478-1579）

| 子视图             | 配置段                      | 业务说明                                                                                                |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| 开闭幕式（`open` / `close`） | `openAndCloseConfig`        | 中下保障资源 + 专线规模 / 传输规模视图；area 含 6 个区域 ID；settings 列表 4 个时间点（十五运开幕/闭幕 + 残特奥开幕/闭幕）|
| 比赛日（`gameMatch`）| `gameMatchConfig`           | 当日赛程 + 刷新间隔 15 分钟                                                                              |
| 首页（`home`）      | `homeConfig`                | 首页区域（单个 area = `1671775762`）+ 切换按钮样式                                                       |
| 倒计时（`cutdownTime`） | `viewManager.manualView` | `cutdownTime: 123`（秒）+ `cutdownBeforeText: "全运会进行中"`                                            |

> 💡 **事实**：4 类子视图**共享同一 settings 列表**（4 个时间点 + 4 个体育场 ID）、**共享 viewSwitchInterval = 15s**、**共享轮播逻辑**——业务域单一（赛事通信保障），可作为单 spec 的 §5 / §6 章节，不拆子 spec。

### 1.5 gis-entry（独立路由）

| 维度       | 事实                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| 路由       | `/gis-entry` + `/gis-entry-guangdong-sdk`                                                  |
| 配置       | `EMapConfig`（GIS 地图）+ `GisConfig`（底图备用）                                          |
| 技术栈     | fedx-gis 1.6.9 + EMap v2 + fedx-3d-renderer                                                 |
| 与其他模块关系 | 与五大中心**共享 GIS 配置**；`five-major-center.cmd-dispatcher-center.centerCarousel.list[0]`（"指挥调度中心"）的 `viewType: map` 即 gis-entry 视图 |

> 💡 **判断**：gis-entry 是**独立技术栈**（EMap + fedx-gis），独立路由，独立视图；**不嵌入** emergency-support-dashboard；与五大中心是「共享配置 + 不同视图」关系——应独立 spec。

### 1.6 information-hub-center（信息情报中心 / 待确认）

| 维度       | 发现                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| mock 目录  | `public/static/mock/information-hub-center/`（30+ JSON 文件）存在                                                  |
| environment.json 路由 | **未注册**（grep 仅命中 5 个路由配置：`five-major-center` / `info-management-bureau` / `gd-emergency-support` 等）|
| 命名       | 「information-hub-center」中文名不确定（推断「**信息情报中心**」或「**情报信息中心**」）                              |
| mock 内容  | 投诉响应 / 隐患排查 / 网络事件 / 机房安全 / 设备运行等（与应急保障有一定关联，但更偏日常运维）                       |

> ⚠️ **状态不明**：
> - 选项 A：已废弃（前端 mock 留存，后端 / 路由已下线）—— 不建 spec
> - 选项 B：路由 / 配置在某处被独立注册（可能在 fedx-ssr external 资源中）—— 需 Stage E 摸排
> - 选项 C：归入五大中心未登记的第 4 子中心 —— 需 Stage E 摸排
> - **本 Stage C 不下结论**，标记「**待 Stage E 摸排**」。

---

## 2. Q-201 4 个核心模块的 spec 组织方式（推荐）

### 2.1 推荐矩阵

| 模块                         | 推荐组织方式                | 理由                                                                                       |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| emergency-support-dashboard | **伞形 spec + 7 子 spec**   | 7 子模块视图独立配置 + 共享 BFF 契约；伞形 spec 写共享部分，子 spec 写各子模块特有字段 / 视图需求 |
| five-major-center            | **伞形 spec + 3 子 spec**   | 3 子中心规模差异大；每个子中心独立 carousel + 独立 iframe 清单                                |
| info-management-bureau       | **单 spec（不拆）**          | 4 类子视图共享 settings + 轮播 + 首页配置；业务域单一                                         |
| gis-entry                    | **独立 spec**                | 独立技术栈 + 独立路由 + 与其他模块共享配置但不共享视图                                          |

### 2.2 拆分判定阈值（一般规则）

> 给 plan-003 阶段 2 提供「是否拆子 spec」的判断标准

| 拆分条件                                                            | 触发时拆分子 spec                              |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| 子模块有独立的视图 / 路由 / 配置项                                  | ✅ 拆                                           |
| 子模块有独立的 mock 数据目录（≥ 5 个 JSON 文件）                     | ✅ 拆                                           |
| 子模块之间共用同一 BFF 接口 + 同一 mock 文件                          | ❌ 不拆（作为伞形 §章节）                        |
| 子模块共享同一 settings / 轮播 / 状态机                              | ❌ 不拆                                          |
| 子模块代码量 < 200 行 + 简单展示                                     | ❌ 不拆（作为父 spec §小节）                      |
| 子模块是 iframe 嵌入（无视图代码）                                  | ✅ 拆（iframe 契约清单作为独立 spec）            |

---

## 3. Q-202 emergency-support-dashboard 是否拆子 spec？

### 3.1 判断

**推荐：拆为 7 子 spec**

### 3.2 事实依据

| 依据                          | 详情                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **视图独立**                   | fedx-ssr external 加载，每个子模块对应独立视图（screen-list 8 个 screen 中 7 个对应应急保障大屏）                   |
| **配置独立**                   | `environment.json.gd-emergency-support.modules.<key>.request.interval` 可独立调整                                  |
| **数据源独立（部分）**         | `ensure-progress / security-mission / duty-table / early-warning-perception / emergency-resources` 走 `/api/index`；`network-conditions / damage-to-towns` 走 `/api/detail/:id` |
| **字典独立**                   | `emergencySupportNeTypes` vs `townshipNeTypes` 两个独立字典模块（finding §2.3.4）                                  |
| **业务域独立**                 | 7 子模块业务含义不同（进展 / 任务 / 值班 / 预警 / 资源 / 网络 / 乡镇）                                                |

### 3.3 伞形 vs 子 spec 的分工

| 内容                              | 写在伞形 spec                       | 写在子 spec                |
| --------------------------------- | ---------------------------------- | -------------------------- |
| 项目定位 / 共享 IA                | ✅                                  |                            |
| BFF 契约（`/api/index`、`/api/detail/:id`）| ✅                                  |                            |
| 共享字典（`emergencySupportNeTypes`）| ✅                                  |                            |
| 路由 `/gd-emergency-support`     | ✅                                  |                            |
| 共享视图框架 / fedx-ssr 加载约定  | ✅                                  |                            |
| **子模块字段定义**               |                                    | ✅（按子模块 key）          |
| **子模块视图需求**               |                                    | ✅（如 `network-conditions` 的右屏模态框配置 `emergencySupportNetworkConditionsModal`） |
| **子模块验收标准**               |                                    | ✅                          |
| **子模块任务切片（R1–R5）**      |                                    | ✅                          |

---

## 4. Q-203 info-management-bureau 是否拆子 spec？

### 4.1 判断

**推荐：不拆，作为单 spec**

### 4.2 事实依据

| 依据                                | 详情                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **共享 settings 列表**              | 4 个时间点（十五运开幕/闭幕 + 残特奥开幕/闭幕）共享同一 `settings` 配置                                              |
| **共享 viewManager**                | `manualView` + `viewSwitchInterval = 15s` + `enableViewAnimation` + `enableOpenDayIsFirstDay` 全局生效              |
| **共享轮播逻辑**                    | `open / gameMatch / home / cutdownTime` 4 类视图**轮播展示**，而非独立路由                                          |
| **业务域单一**                      | 「赛事通信保障」—— 围绕十五运 + 残特奥，无跨业务域                                                                  |
| **代码量预期小**                    | 4 类视图共享 settings + viewManager 代码，单 spec 足够                                                              |

### 4.3 spec 章节组织（推荐）

```
docs/specs/info-management-bureau/
├── spec.md
│   ├── §1 总览
│   ├── §2 用户旅程
│   ├── §3 数据模型（赛事 / 体育场 / 保障资源）
│   ├── §4 接口契约
│   ├── §5 视图层
│   │   ├── §5.1 开闭幕式（open + close）
│   │   ├── §5.2 比赛日（gameMatch）
│   │   ├── §5.3 首页（home）
│   │   └── §5.4 倒计时（cutdownTime）
│   ├── §6 配置项（settings + viewManager + viewSwitchInterval + openAndCloseConfig + gameMatchConfig + homeConfig）
│   ├── §7 验收标准
│   ├── §8 Gap（as-is → to-be）
│   ├── §9 子 spec 索引（**N/A：本模块不拆子 spec**）
│   └── §10 开放问题
```

---

## 5. Q-204 gis-entry 是否合并到 emergency-support-dashboard？

### 5.1 判断

**推荐：独立 spec，不合并**

### 5.2 反对合并的理由

| 反对点                | 详情                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **独立路由**          | gis-entry 有 `/gis-entry` 与 `/gis-entry-guangdong-sdk` 两条独立路由（`src/controller/index.ts:26,30`）          |
| **独立技术栈**        | EMap v2 + fedx-gis 1.6.9 + fedx-3d-renderer；与 emergency-support-dashboard 的 fedx-ui + antd 5 + valtio 不同       |
| **配置独立**          | `EMapConfig`（独立）+ `GisConfig`（备用底图）；emergency-support-dashboard 用 `gdEmergencySupportMap`（独立）      |
| **业务域不同**        | GIS 是「地图 + 空间数据」业务；emergency-support-dashboard 是「应急保障仪表盘」业务                                |
| **与五大中心的关系**  | `five-major-center.cmd-dispatcher-center.centerCarousel.list[0]` 的 `viewType: map` 即 gis-entry 的复用；说明 gis-entry 独立存在，是被复用的「GIS 视图组件」|

### 5.3 推荐做法

- gis-entry **独立 spec**
- 在 `system-overview.md` 中显式说明 gis-entry 与 emergency-support-dashboard / five-major-center 的复用关系
- 在 `five-major-center` 的伞形 spec §6 中引用 `gis-entry` spec（避免重复写 GIS 配置）

---

## 6. information-hub-center（待 Stage E 摸排）

### 6.1 已知事实

- mock 目录 `public/static/mock/information-hub-center/` 存在 30+ JSON
- 命名暗示「**信息情报中心**」/「**情报信息中心**」（finding §2.3 没列入五大中心子项）
- 内容涉及：投诉响应 / 隐患排查 / 网络事件 / 机房安全 / 设备运行 / 值班计划等

### 6.2 摸排方向（plan-001 Stage E）

| 摸排项                                              | 方法                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 路由是否在某处注册？                                | `grep -r "information-hub-center" src/ public/` + 搜 fedx-ssr external 配置                    |
| 是否归入五大中心未登记的第 4 子中心？                | 对比 `environment.json.five-major-center` 子项数量                                              |
| 是否为已废弃模块？                                  | 检查 mock 数据最近修改时间 + 是否有非 mock 数据源                                              |
| 是否归入 emergency-support-dashboard 子模块？        | 对比 `environment.json.gd-emergency-support.modules` 7 个 key                                  |
| 后端契约（`docs-api-backend/`）是否有相关接口？      | `grep -r "情报\|information-hub\|信息情报" docs-api-backend/`                                  |

### 6.3 摸排结论的处理

| 摸排结论                               | 处理方式                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 已废弃                                  | 不建 spec；在 `system-overview.md` 注明「mock 留存但路由未启用」                                |
| 归入五大中心                            | 重新分类到 `five-major-center.information-hub-center` 子 spec                                   |
| 独立模块                                | 在 4 核心模块中追加为第 5 个伞形 spec                                                           |
| 归入 emergency-support-dashboard 子模块 | 并入对应子 spec                                                                                |

> **本 Stage C 不下结论**；Stage E 摸排后再补 D-19 / D-20 / D-21 决策项。

---

## 7. 沉淀决策（追加 roadmap §2）

| 决策编号 | 决策内容                                                                                                                                              | 来源 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| D-19     | **emergency-support-dashboard**：伞形 spec + 7 子 spec（ensure-progress / security-mission / duty-table / early-warning-perception / emergency-resources / network-conditions / damage-to-towns） | Stage C Q-202 |
| D-20     | **five-major-center**：伞形 spec + 3 子 spec（cmd-dispatcher-center / comprehensive-display-center / situation-awareness-center）                       | Stage C §2.1 + Q-203 |
| D-21     | **info-management-bureau**：单 spec（不拆子 spec，4 类子视图作为 spec.md §5 章节）；**gis-entry**：独立 spec（不合并到 emergency-support-dashboard）         | Stage C Q-203 + Q-204 |

---

## 8. 完成定义（DoD）

- [x] Q-201 ~ Q-204 全部给出结论（事实驱动）
- [x] 视图层加载机制（fedx-ssr external + src/ 无视图代码）已识别
- [x] emergency-support-dashboard 7 子模块独立性已论证
- [x] five-major-center 3 子中心规模差异已论证
- [x] info-management-bureau 共享性已论证
- [x] gis-entry 独立性已论证
- [x] information-hub-center 标记「待 Stage E 摸排」
- [x] spec 目录树完整（86 文件估算）
- [x] 沉淀决策 D-19 ~ D-21 待 roadmap §2 追加
- [x] 未动业务代码
- [x] 未引用 `.trae/` 与 `.local-docs/`（Rule 2）

---

## 9. 不在本文件范围内（OUT）

- ❌ 落各模块 spec.md 正文（属 plan-003 阶段 2）
- ❌ information-hub-center 定性结论（属 plan-001 Stage E）
- ❌ 写 acceptance-tests / data-model-extensions（属 plan-003 阶段 2）

---

## 10. 关联文档

| 文档                                                                                                                                  | 说明                                       |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`                                                                                                      | 整体路线图                                 |
| [`./2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md)                       | 第一轮 finding（业务模块识别 §2.3）         |
| [`./2026-07-29-002-agents-md-content-plan.md`](./2026-07-29-002-agents-md-content-plan.md)                                           | 上游 Stage A 结论                          |
| [`./2026-07-29-003-docs-mvp-structure.md`](./2026-07-29-003-docs-mvp-structure.md)                                                   | 上游 Stage B 结论（specs/_template）         |
| `.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-003-plan-modules-specs.md`                                      | 下游：plan-003 业务模块 spec 落地计划       |