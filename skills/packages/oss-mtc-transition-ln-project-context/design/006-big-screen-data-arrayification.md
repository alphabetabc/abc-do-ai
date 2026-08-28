# 006 · 大屏 API 数组化设计原则

> 性质：跨 spec 通用设计原则（已拍板，向团队公开文档迁移中）
> 日期：2026-08-28
> 来源：D-DATA-ARRAYIFICATION — 起源 2026-08-14「038 大屏 API 数据结构统一」task 与 2026-08-27「041 模块 4 三维扩展」拍板
> 维护规则：原则变化时即时更新；本文件**非团队可见**（在 `.trae/skills/.../design/`，不入 Git）；稳定后向 `docs/design/api-contracts.md` 顶层（"大屏通用约定"）提 L3 提案审批
> 定位：**API 数据形状通用约定**——定义"大屏 API 响应怎么组织数据"。不重复 004 的架构方法论，也不记录具体端点的字段实现；具体端点形状见各自 spec §3.2/§3.3

---

## 0. 原则陈述（SSOT 锚点）

**大屏 API 的数据字段必须是数组形式**（`Array<{key, name, value, unit, label?, type?}>`），禁止扁平对象、嵌套对象、ECharts `series` 数组原样返回、双组对象、三维对象等任何非数组形态。

**核心动机**：

- 服务端**新增指标**（如新增"昨日敏感件"卡片）→ 数组 append 一项 → 前端 **0 改动**
- 服务端**新增维度**（如为 channels 加 `sms` 字段）→ 数组项加字段 → 前端 `.map` 自动适配
- 服务端**新增时间段或渠道**（如新增"上月同期"对比）→ 数组加项 → 前端 `groupBy` 自动适配
- **空数据**统一为 `[]`（数组），前端无需判空对象 / 判空数组两种场景

**与 ECharts 关系**：本原则不强制 ECharts `option` 形状。前端 `.map(items)` 后**在组件层**自行转换为 ECharts `option`（categories + series）。即"**领域数据是数组，图表内部用 ECharts 形状**"，这是单向映射，不允许反向绑定。

---

## 1. 数组项字段模型（SSOT 字段集合）

```typescript
// 基础项（4 大屏通用）
type BigScreenItem = {
  key: string;       // 唯一标识（如 "veteran" / "2101" / "yesterdayPetition" / "channels_0_wangluo"）
  name: string;      // 显示名称（如 "退役军人总数" / "沈阳市" / "昨日信访量" / "网络"）
  value: number;     // 数值（业务原始值，含后端不做百分比计算）
  unit: string;      // 单位（"人" / "件" / "%" / "次" / "万" / "人次"）
  label?: string;    // 分组标签（分组柱状图图例 / 折线图 X 轴）
  type?: string;     // 类型区分（仅 041 对比大屏用："local" / "beijing" / "total"）
};

// 2026-08-27 三维扩展（仅 041 /summary + /channels 用）
// 不变量: value === local + beijing（若两者都填）
type BigScreenItem3D = BigScreenItem & {
  local?: number;     // 本地（REG_AUTHORITY=2）
  beijing?: number;   // 进京（REG_AUTHORITY=1）
};
```

| 字段 | 必填 | 适用场景 |
|---|---|---|
| `key`   | ✓ | React `key`、后续联动唯一 ID、跨端点去重 |
| `name`  | ✓ | 卡片标题、tooltip、图例、ECharts series 名 |
| `value` | ✓ | 数值（业务原始值，不做百分比） |
| `unit`  | ✓ | tooltip / InfoCard 后缀；不得省略 |
| `label` | ✗ | 仅分组柱状图、折线图带 |
| `type`  | ✗ | 仅 041 三维对比大屏带 |
| `local` | ✗ | 仅 041 `/summary` + `/channels` 带（2026-08-27+） |
| `beijing` | ✗ | 仅 041 `/summary` + `/channels` 带（2026-08-27+） |

**硬约束**：

- `unit` 字段必须逐条携带，不得省略（避免前端组件再做单位推断）
- `value` 不做百分比计算（占比由前端 ECharts 组件按需计算）
- 服务端**不返回** `{}` / `null` —— 任何形状失败退化空数组 `[]`
- 数组项顺序：服务端**保持稳定顺序**（按数据插入顺序；前端 `.map` 隐式依赖）

---

## 2. data 形状（含数组化别名）

```typescript
// 大屏 data 通用形状（统一类型，字段名是端点语义别名）
type BigScreenData = {
  items?: BigScreenItem[];       // 通用（如 /veteran /total /appeal /overview /identity /map /rank /trend）
  summary?: BigScreenItem[];     // 概要卡片（041 /summary）
  channels?: BigScreenItem[];    // 各渠道（041 /channels，每数据点一项）
  regions?: BigScreenItem[];     // 地图区域（038/039/040/041 /map）
  rows?: BigScreenItem[];        // 通用行数组（035 兼容）
};

// 三维扩展（仅 041 /summary + /channels）
type BigScreenData3D = {
  summary?: (BigScreenItem3D)[];     // 3 项，合计 + local + beijing
  channels?: (BigScreenItem3D)[];    // 6 项（2 时间 × 3 渠道），合计 + local + beijing
};
```

**别名约定**：服务端字段名按端点语义取名（`summary` / `channels` / `regions` / `rows` / `items`），但**内部形状一致**——都是 `BigScreenItem[]` 或 `BigScreenItem3D[]` 的别名。前端组件按需 `.map` 后渲染，**不区分字段名**。

**2026-08-27 三维扩展**（PM 拍板）：

- 仅 041 模块 4-2 (`/summary`) + 模块 4-3 (`/channels`) 在原合计 `value` 上同步输出 `local` + `beijing`
- 不变量：`value === local + beijing`（已加单元测试，见 `task-2026-08-27-057`）
- **向后兼容**：旧调用方可继续只读 `value`，新增 `local` / `beijing` 不破坏既有前端
- 其它大屏（038 / 039 / 040）暂无三维扩展需求；未来加新屏按需扩展

---

## 3. 数组项 → 图表的适配矩阵

| 图表类型 | 用到的字段 | 示例 |
|---|---|---|
| 数字卡片 / 单值卡 | `key` + `name` + `value` + `unit` | `{ key: "veteran", name: "退役军人总数", value: 12345, unit: "人" }` |
| 条形图 / 排名榜 | `key` + `name` + `value` + `unit` | `{ key: "2101", name: "沈阳市", value: 5000, unit: "件" }` |
| 地图散点 / 热力图 | `key` (编码) + `name` + `value` + `unit` | `{ key: "2101", name: "沈阳市", value: 5000, unit: "件" }` |
| 折线图 / 趋势图（多 series） | `name` (系列名) + `label` (X 轴) + `value` + `unit` | `{ key: "trend_0_ws", name: "网上信访", value: 120, unit: "件", label: "2026-01" }` |
| 分组柱状图（二维矩阵） | `name` (X 轴分组) + `label` (图例) + `value` + `unit` | `{ key: "emp_1_1", name: "自主就业义务兵", value: 100, unit: "万", label: "已就业" }` |
| 概要卡片（合计） | `key` + `name` + `value` + `unit` | `{ key: "yesterdayPetition", name: "昨日信访量", value: 320, unit: "件" }` |
| 三维概要卡片（仅 041） | 基础上 `+ local + beijing` | `{ key: "yesterdayPetition", name: "昨日信访量", value: 320, local: 200, beijing: 120, unit: "件" }` |
| 双组对比（折线 / 排名） | `key` + `name` + `value` + `unit` + `type` | `{ key: "trend_0_ws_local", name: "本地-网上信访", value: 80, type: "local", label: "2026-01", unit: "件" }` |

**前端映射策略**：

- 前端组件**统一 `.map(items, render)`**，按 `key` / `name` / `value` 自行派生 ECharts `option`
- 不需要中间转换函数（如 `summaryToCards` / `channelsToCards`）——这些已在 task-058 删除
- 服务端新增数据点 → 数组 append 一项 → 前端 0 改动
- 三维数据：前端按需渲染卡片下方堆叠 2 行副子（`local` + `beijing`），`value` 默认占位

---

## 4. 反模式（禁止）

| 反模式 | 例子 | 问题 |
|---|---|---|
| ❌ 扁平对象 | `{ veteran, officer, officerRatio, ... }` | 服务端加指标必须改前端 |
| ❌ 对象嵌套数组（无统一形状） | `{ regions: [{ statsUnitName, veteran }] }`（早期 038 /map） | 端点间字段不一致，前端特判 |
| ❌ ECharts `series` 数组原样返回 | `{ categories: string[], series: [{ name, data: [] }] }` | 绑死 ECharts 形状，难跨图表复用 |
| ❌ 双组对象（041 早期） | `{ local: { series: [...] }, beijing: { series: [...] } }` | 加第三维度（如 total）要重构 |
| ❌ 三维对象 | `{ total: {...}, local: {...}, beijing: {...} }` | 加维度要重构 |
| ❌ 后端计算百分比 | `{ num: 80, ratio: 0.32 }` | 失去业务原始值，前端无法复用 |
| ❌ 服务端返回 `null` / `{}` | `{ items: null }` 或 `{}` | 前端需双路径判空 |
| ❌ 数组项字段名飘移 | 端点 A 用 `{ label, value }`、端点 B 用 `{ name, value }` | 端点间无法复用渲染器 |

---

## 5. 已落地状态

| 端点 | spec §3.2/§3.3 | data 形状 | 数组化字段名 | 三维扩展 |
|---|---|---|---|---|
| 038 全部 7 端点 | `docs/specs/038-bigdata-personnel-display/spec.md` | `items: [{ key, name, value, unit, label? }]` | `items` | ❌ |
| 039 全部 6 端点 | `docs/specs/039-bigdata-petition-display/spec.md` | `items: [{ key, name, value, unit, label? }]` | `items` | ❌ |
| 040 全部 6 端点 | `docs/specs/040-bigdata-beijing-petition-display/spec.md` | `items: [{ key, name, value, unit, label? }]` | `items` | ❌ |
| 041 模块 4-2 `/summary` | `docs/specs/041-bigdata-petition-comparison-display/spec.md` | `summary: [{ key, label, value, local, beijing, unit }]` | `summary` | ✅ |
| 041 模块 4-3 `/channels` | 同上 | `channels: [{ period, label, value, local, beijing, unit }]` | `channels` | ✅ |
| 041 其它（`/trend` `/appeal` 等） | 同上 | `items: [{ key, name, value, unit, label, type }]` | `items` | type 区分 local/beijing（无 value/local/beijing） |

> **当前覆盖**：4 个大屏 spec 全部对齐本原则；038/039/040 三维扩展暂不需要；041 部分端点已三维扩展。

---

## 6. 落地缺口（需走 L3 提案审批升级到团队正式文档）

| 缺口 | 影响 | 提议路径 |
|---|---|---|
| 本原则未上升到 `docs/design/api-contracts.md` 顶层 | 新增第 5 屏时 Agent 不会自动看到本约定 → 重复拍板 | L3 提案到 `plans/roadmap-2026-08-11-big-screen.md §6`：在 `api-contracts.md §7` 之前新增「大屏通用约定」章节，沉淀本文 §0–§4 |
| `AGENTS.md §5` 未引用本文 | 不通读 `design/006` 的 Agent 不知道本原则 | L2 提案：在 §5「开发通用要点」新增「6. 大屏 API 数据结构强制数组化」，引用本文 + 4 个 spec §3.2 |
| 035 月报历史端点（`api-contracts §7.35–§7.40`）未审计 | 可能存在非数组形状端点混在大屏域 | L3 提案：审计 035 6 端点，对齐本原则（如必要） |
| 041 之外的端点无三维扩展 | 暂不需要 | 暂缓；未来加新屏按需扩展（沿用 041 模式） |

> **现状**：本原则仅在 4 个 spec 的 §3.2/§3.3 实例中存在，并以 task-058 + task-057 的形式写在 `plans/done/`。**未**凝练到顶层 `docs/` 设计文档。

---

## 7. 变更记录

| 日期 | 变更 | 来源 task |
|---|---|---|
| 2026-08-14 | 原则第 1 次拍板：6 种混乱形态统一为 `items` 数组（`{ key, name, value, unit, label?, type? }`） | `task-2026-08-14-038-大屏API数据结构统一` |
| 2026-08-17 | 数组化优势在前端落地：`groupByPeriod` / `orderChannels` 自动适配 | `task-2026-08-17-041-4大屏页面入口初始化` |
| 2026-08-27 | 原则扩展：「彻底数据点化」（每数据点一项）+ 三维扩展（`value` / `local` / `beijing`） | `task-2026-08-27-057-041模块4地图全栈开发` |
| 2026-08-27 | 前端 `summaryToCards` / `channelsToCards` 中间转换函数删除 | `task-2026-08-27-058-041模块4子任务概要情况卡片与各渠道卡片实现` |
| 2026-08-28 | 沉淀到 `.trae/skills/.../design/006-big-screen-data-arrayification.md` | 本文 |

---

## 8. 与其他文档的关系

| 文档 | 关系 |
|---|---|
| `design/004-big-screen-architecture.md` | 004 管"架构方法论"；本文件管"API 数据形状"，是其子原则 |
| `design/002-big-screen-decisions.md` | 本原则源头决策（D-DATA-ARRAYIFICATION）应在 002 独立登记一条 D（建议新增 D10） |
| `design/001-big-screen-dev-guide.md` | 001 管"docs 体系"；本文与大屏 API 设计耦合，不重复 |
| `docs/specs/038-041/spec.md §3.2/§3.3` | 本文为 SSOT；各 spec 是实例 |
| `docs/design/api-contracts.md §7` | 未来 L3 提案将本文 §0–§4 晋升到该文档顶层 |
| `AGENTS.md §5` | 未来 L2 提案在「开发通用要点」新增 1 条引用本文 |
| `docs/specs/042-components-common/002-ec-map` 等 | 前端通用组件按本文约定派生 ECharts option，不耦合响应形状 |

---

## 9. 自检清单（新建/调整大屏端点时）

新建或调整大屏端点时，开发者（含 AI Agent）必须自检：

- [ ] `data` 字段是数组（`items` / `summary` / `channels` / `regions` / `rows`）？
- [ ] 数组项含 `key` / `name` / `value` / `unit` 4 个必填字段？
- [ ] `value` 是业务原始值（未做百分比计算）？
- [ ] `unit` 字段每项都带（人 / 件 / % / 次 / 万 / 人次）？
- [ ] 空数据返回 `[]`（而非 `null` / `{}`）？
- [ ] 无 ECharts `series` 数组原样返回？（绑死图表形状）
- [ ] 无后端计算百分比？
- [ ] 若需对比维度，优先 `type` 字段（双组）或 `local`/`beijing` 字段（三维），而非嵌套对象？
- [ ] 单元测试覆盖数组长度、字段完整性、空数据退化、不变量（如 `value === local + beijing`）？
- [ ] spec §3.2 / §3.3 已同步更新（先于编码）？
