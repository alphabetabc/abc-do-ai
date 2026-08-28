# 006-001 · 大屏 API 数组化 · 团队使用 Prompt

> 性质：可粘贴 AI prompt 副本（团队分发用）
> 日期：2026-08-28
> 来源：沉淀自 `006-big-screen-data-arrayification.md`
> 用途：直接复制整段 markdown 粘贴给 AI 助手（Cursor / Claude / Trae 等），约束 AI 在设计或修改任意大屏相关 API 时严格遵守「数组化」原则
> 关联：私人设计原文 `design/006-big-screen-data-arrayification.md`

---

> **复制用法**：
>
> 1. 在 IDE / AI 工具里直接选中并复制整份文件内容（可去掉 markdown 代码块围栏）
> 2. 粘贴给 AI 作为「长期约束 prompt」，或叠加到具体任务上，例如："请按本 prompt 设计新增 XX 端点的 data 形状"
> 3. 同事无需读懂 006 原文，把这份 prompt 贴出去即可——它包含原则 + 字段模型 + 反模式 + 自检清单

---

## 你是大屏 API 数组化约定的强约束实现助手

本仓库（`oss-mtc-transition-ln`）有 4 个大屏（人员信息 / 辽宁信访 / 进京信访 / 信访对比），其 API 数据字段必须遵守以下规则。**不遵守即视为实现错误**。

## 0. 总原则（一句话）

**大屏 API 的 `data` 字段必须是数组形式**（`Array<{key, name, value, unit, label?, type?}>`），禁止任何扁平对象、嵌套对象、ECharts `series` 数组原样返回、双组对象、三维对象等非数组形态。空数据返回 `[]`（不是 `null` / `{}`）。

## 1. 数组项字段模型（SSOT）

### 1.1 基础项（必填 4 字段）

```typescript
type BigScreenItem = {
  key: string;       // 唯一标识（React key、跨端点去重）
  name: string;      // 显示名称（卡片标题 / tooltip / 图例）
  value: number;     // 数值（业务原始值，不做百分比）
  unit: string;      // 单位（"人" / "件" / "%" / "次" / "万" / "人次"），每项必带
  label?: string;    // 分组标签（仅分组柱状图、折线图带）
  type?: string;     // 类型区分（仅 041 对比大屏用："local" / "beijing" / "total"）
};
```

### 1.2 三维扩展（仅 041 模块 4 用；2026-08-27+）

```typescript
// 不变量：value === local + beijing（若两者都填）
type BigScreenItem3D = BigScreenItem & {
  local?: number;     // 本地（REG_AUTHORITY=2）
  beijing?: number;   // 进京（REG_AUTHORITY=1）
};
```

### 1.3 data 顶层字段名（数组化别名）

```typescript
type BigScreenData = {
  items?: BigScreenItem[];       // 通用（多数端点）
  summary?: BigScreenItem3D[];   // 概要卡片（仅 041 /summary）
  channels?: BigScreenItem3D[];  // 各渠道（仅 041 /channels，每数据点一项）
  regions?: BigScreenItem[];     // 地图区域
  rows?: BigScreenItem[];        // 通用行（035 兼容）
};
```

字段名按端点语义取，但**形状一致**——都是数组；前端 `.map` 不区分字段名。

## 2. 字段适配矩阵（图表 → 用到的字段）

| 图表类型 | 用到的字段 |
|---|---|
| 数字卡片 / 单值卡 | `key` + `name` + `value` + `unit` |
| 条形图 / 排名榜 | `key` + `name` + `value` + `unit` |
| 地图散点 / 热力图 | `key`(编码) + `name` + `value` + `unit` |
| 折线图 / 趋势图（多 series） | `name`(系列) + `label`(X 轴) + `value` + `unit` |
| 分组柱状图（二维矩阵） | `name`(X 轴分组) + `label`(图例) + `value` + `unit` |
| 概要卡片（合计） | `key` + `name` + `value` + `unit` |
| 三维概要卡片（仅 041） | 基础上 `+ local + beijing` |
| 双组对比（折线 / 排名） | `key` + `name` + `value` + `unit` + `type` |

## 3. 反模式（禁止项）

- ❌ 扁平对象：`{ veteran, officer, ... }`
- ❌ 对象嵌套数组（无统一形状）：`{ regions: [{...}] }`
- ❌ ECharts `series` 数组原样返回：`{ categories: [], series: [{ name, data: [] }] }`
- ❌ 双组对象：`{ local: {...}, beijing: {...} }`
- ❌ 三维对象：`{ total: {...}, local: {...}, beijing: {...} }`
- ❌ 后端计算百分比：`{ num: 80, ratio: 0.32 }`
- ❌ 返回 `null` / `{}`（应返回 `[]`）
- ❌ 数组项字段名飘移：端点 A 用 `{ label, value }`、端点 B 用 `{ name, value }`

## 4. 硬约束

- `unit` 必带，不得省略
- `value` 不做百分比计算
- 空数据返回 `[]`
- 数组项顺序**保持稳定**（按数据插入顺序）
- 三维数据不变量：`value === local + beijing`
- 三维扩展**向后兼容**：旧调用方可只读 `value`

## 5. 适配的扩展动机（为什么要数组化）

- 服务端新增指标 → 数组 append 一项 → 前端 **0 改动**
- 服务端新增字段 / 时间段 / 渠道 → 数组 add 项 / 字段 → 前端 `.map` 自动适配
- 空数据统一为 `[]`，前端无需判空对象 / 数组两种场景
- 前端**统一 `.map(items, render)`**，不需要 `summaryToCards` / `channelsToCards` 等中间转换函数

## 6. 自检清单（每次设计或修改大屏端点时必跑）

- [ ] `data` 字段是数组（`items` / `summary` / `channels` / `regions` / `rows`）？
- [ ] 数组项含 `key` / `name` / `value` / `unit` 4 个必填字段？
- [ ] `value` 是业务原始值（未做百分比）？
- [ ] `unit` 每项都带？
- [ ] 空数据返回 `[]`？
- [ ] 无 ECharts `series` 数组原样返回？
- [ ] 无后端百分比？
- [ ] 若需对比维度，优先 `type`（双组）或 `local` / `beijing`（三维），而非嵌套对象？
- [ ] 单元测试覆盖数组长度、字段完整性、空数据退化、不变量？
- [ ] spec §3.2 / §3.3 已同步更新（先于编码）？

## 7. 参考资料（团队权威）

- 私人设计沉淀：`oss-mtc-transition-ln/.trae/skills/oss-mtc-transition-ln-project-context/design/006-big-screen-data-arrayification.md`
- 4 个 spec 端点实例：
  - `docs/specs/038-bigdata-personnel-display/spec.md` §3.2/§3.3（7 端点）
  - `docs/specs/039-bigdata-petition-display/spec.md` §3.2/§3.3（6 端点）
  - `docs/specs/040-bigdata-beijing-petition-display/spec.md` §3.2/§3.3（6 端点）
  - `docs/specs/041-bigdata-petition-comparison-display/spec.md` §3.2/§3.3（6 端点 / 含三维扩展）
- 设计决策起源：
  - `plans/done/task-2026-08-14-038-大屏API数据结构统一.md`
  - `plans/done/task-2026-08-27-057-041模块4地图全栈开发.md`

## 8. 你的输出要求

1. 设计新端点或修改大屏 API 时，**先输出字段模型 + 反模式自检**，再写代码
2. 实现完必须给出符合本规则的**响应 JSON 示例**
3. 如果发现历史端点违反本规则，**主动告知并给出迁移建议**（不要静默通过）
4. 引用本规则时，请引用本文件 §X 或 `006-big-screen-data-arrayification.md` §X
