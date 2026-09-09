# NetworkScale 组件演进史

> 📌 **本文档是"历史档案"，只记录组件演进过程中的设计变更与历史方案**。
> 当前架构 / 配置 / 渲染流程请看：
>
> - 配置：[presets-config.md](./presets-config.md)
> - 渲染：[main-render-flow.md](./main-render-flow.md)
> - 原则：[principles.md](./principles.md)
> - 子组件：[sub-components.md](./sub-components.md)

---

## 1. 组件概览（v1.0 原始形态）

**组件名称**：NetworkScale（网络规模 - 实时影响）
**位置**：`apps/main/app/components/right/network-compact/network-scale/`
**功能**：展示应急保障场景下的网络实时影响数据（无线 / 动环 / 传输 / 集客 / 家客）

### 1.1 目录结构（v1.0）

```
network-scale/
├── index.tsx              # 主组件
├── presets.ts             # 数据模板 + 样式声明
├── SimpleCard.tsx         # 单指标卡片
├── MultiCard.tsx          # 多指标卡片
├── Detail.tsx             # 详情弹窗（折线图 + 柱状图）
├── FaultListTable.tsx     # 故障清单表格
├── DetailChartOption.tsx  # 图表配置
├── index.css              # 样式
└── id-mapper.xml          # API 路由映射
```

> 💡 v1.0 没有独立的 `CarouselNormal` / `CarouselSection` 组件，轮播逻辑混在 `index.tsx` 中。

### 1.2 数据获取（v1.0）

通过 `getNetworkSituationApi` 拉取，**并行请求两个 API**：

| API                           | 用途         |
| ----------------------------- | ------------ |
| `network-situation`           | 指标统计数据 |
| `wireless-situation-resource` | 资源数统计   |

合并后通过 `groupId` / `groupLabel` 字段在组件中组装显示。

---

## 2. 演进时间线

### v1.0 — 初始版本

- 支持无线 / 动环 / 传输 / 集客 / 家客数据展示
- 实现卡片组件和详情弹窗
- 支持多区域级别
- **使用 `groupId: "14-15"` 扁平化方案**（详见 §3）

### v1.1 — 扁平化方案 → 组合视图方案（已废弃 → 当前）

- ❌ 移除 `groupId` / `groupLabel` 字段
- ✅ 引入 `groupViews: [{ id, children, viewType }]`
- ✅ 引入 `groupViewType: "carouselSection"` 配置项
- ✅ 拆分出 `CarouselNormal` / `CarouselSection` 独立组件
- ✅ 引入"配置驱动"原则（详见 [principles.md](./principles.md)）

### v1.2 — 重构（当前）

- ✅ 移除 `idMap` 硬编码（已确认冗余，见 [principles.md §2](./principles.md#2-反面案例idmap-硬编码)）
- ✅ `Detail` 强制 remount（`key={detail-${zoneId}}`）
- ✅ 引入 `currentActiveIndItem` 区域匹配守卫

---

## 3. 旧方案：groupId 扁平化（已废弃，勿用）

> ⚠️ **本节描述的是 v1.0 旧方案，仅作历史参考**。当前所有新功能必须使用 `groupViews.children`。

### 3.1 旧方案设计

通过 `groupId` 关联组合指标：

```typescript
{
    id: "14",
    label: "传输一干/二干",
    unit: "个",
    detailTitle: "传输一干/二干",
    groupId: "14-15",           // ← 旧字段
    groupLabel: "传输一干/二干"   // ← 旧字段
},
{
    id: "15",
    label: "传输一干/二干",
    unit: "个",
    detailTitle: "传输一干/二干",
    groupId: "14-15",
    groupLabel: "传输一干/二干"
}
```

### 3.2 旧 → 新迁移对照

| 旧字段（删除）      | 新字段（替代）                                                    |
| ------------------- | ----------------------------------------------------------------- |
| `groupId: "14-15"`  | `groupViews: [{ id: "14/15", children: [{id:"14"}, {id:"15"}] }]` |
| `groupLabel: "..."` | `groupViews[].label`                                              |

**迁移步骤**：

1. 删除 `items[].groupId` / `items[].groupLabel`
2. 新增 `groupViews: [...]` 字段（详见 [presets-config.md §1.4](./presets-config.md#14-添加组合指标推荐方式)）
3. 组件无需修改

### 3.3 为什么废弃

- 旧方案让"业务规则"（14+15=组合）散落在 `items` 的每条记录中
- 新方案在 `groupViews` 中显式声明组合关系，**更清晰、更易扩展**
- 旧方案无法支持 `carouselSection`（分段轮播）

---

## 4. 相关资源（历史 / 外部）

- **API 文档**：http://10.10.2.8:9091/project/1179/
- **Mock 数据**：`/static/mock/emergency/`
- **环境配置**：`apps/main/public/config/environment.json`
- **数据库表映射**：`apps/main/app/components/right/network-compact/network-scale/id-mapper.xml`（v1.0 遗留，v1.2 已迁移到 `right.ts` 的 `apiList`）
