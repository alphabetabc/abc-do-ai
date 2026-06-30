---
version: 1.0.0
date: 2026-06-26
status: 生效
audience: pm-agent / 智能体开发者
---

# 命名映射表 · 模板

> 用途：维护项目级"URL ↔ API ↔ 数据文件 ↔ 视图文件"四联动映射
> 维护时机：plan-agent 完成规划时初始化、build-agent 新增路由时更新
> 谁来维护：plan-agent 初始化，build-agent 更新，verify-agent 校验

---

## 命名映射表：<项目名>

**维护人**：<填写项>
**最后更新**：<YYYY-MM-DD>
**适用范围**：<项目路径 / 模块名>

### 核心约定

| 类型 | 规范 | 示例 |
|------|------|------|
| URL 路径 | kebab-case | `/customer-list` |
| API 函数 | camelCase + 业务前缀 | `getCustomerList` |
| 数据文件 | camelCase + 业务名 | `customerList.json` |
| 视图文件 | PascalCase + 业务名 | `CustomerList.vue` |
| 组件 | PascalCase | `TimeRangePicker.vue` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |

---

## 映射表

| URL 路径 | API 函数 | 数据文件 | 视图文件 | 组件 | 状态 | 备注 |
|---------|---------|---------|---------|------|------|------|
| `/customer-list` | `getCustomerList` | `customerList.json` | `CustomerList.vue` | - | ✅ | |
| `/customer-detail/:id` | `getCustomerDetail` | `customerDetail.json` | `CustomerDetail.vue` | - | ✅ | |
| `/customer-edit/:id` | `updateCustomer` | - | `CustomerEdit.vue` | `CustomerForm.vue` | ✅ | |
| `/operation-dashboard` | `getOperationStats` | `operationStats.json` | `OperationDashboard.vue` | `KpiCard.vue` | ✅ | |
| `/promotion/main-hall` | `getMainHallConfig` | `mainHallConfig.json` | `MainHall.vue` | `CountdownTimer.vue`<br>`CouponCard.vue` | ✅ | 营销活动页 |
| `/promotion/category-hall` | `getCategoryHallList` | `categoryHallList.json` | `CategoryHall.vue` | `ProductList.vue` | ⚠️ 进行中 | Pad 端未做 |
| ... | ... | ... | ... | ... | ... | ... |

---

## 冲突记录

| URL 路径 | 冲突类型 | 旧命名 | 新命名 | 决策 | 决策日期 |
|---------|---------|-------|-------|------|---------|
| `/customer-list` | 与历史组件同名 | `CustomerTable` | `CustomerList` | 沿用 `List` 避免与 `CustomerTable` 混淆 | YYYY-MM-DD |
| ... | ... | ... | ... | ... | ... |

---

## 反模式（命名相关）

- ❌ URL 用 camelCase（应 kebab-case）
- ❌ API 函数无业务前缀（应 `getCustomerList` 而非 `getList`）
- ❌ 视图文件用 camelCase（应 PascalCase）
- ❌ 数据文件命名与 API 函数不一致
- ❌ 同一业务概念在不同模块命名不同（如 `customer` / `client` / `user` 混用）

---

## 引用

- 命名四联动原则 → [methodology/03-standard-deliverables.md §2](../pm-agent-core/methodology/03-standard-deliverables.md)
- 不可序列化字段 → [methodology/03-standard-deliverables.md §5](../pm-agent-core/methodology/03-standard-deliverables.md)
- 命名冲突优先级 → [methodology/03-standard-deliverables.md §9](../pm-agent-core/methodology/03-standard-deliverables.md)
