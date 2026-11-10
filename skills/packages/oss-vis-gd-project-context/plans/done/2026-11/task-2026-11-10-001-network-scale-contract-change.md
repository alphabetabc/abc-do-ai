# Task · 2026-11-10-001-network-scale-contract-change

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-10-001-network-scale-contract-change` |
| Status | 已完成 |
| 类型 | 编码 |
| 影响范围 | `web/services/shenzhen-communication-guarantee/home/section-right.ts`、`public/static/mock/shenzhen-communication-guarantee/`（新增 mock） |
| Roadmap | N/A |
| 验收标准 | 网络规模模块按新接口契约（viewItemId=`homepage-right-network`）正确取数并回填模板 |
| 前置依赖 | 服务端新接口文档（api-doc.md「八、右侧-网络规模」）已下发 |

---

## 目标（Goal）

首屏右侧「网络规模」从旧接口（`key-guarantee-area-business`，`{type,num,retireNum}`）切换到新接口（`homepage-right-network`，`{areaName,indicatorName,indicatorType,indicatorValue,indicatorUnit}`），前端模板与回填逻辑适配新契约。

---

## 步骤（执行计划）

### 步骤 1：已完成的部分（用户已改 / 本会话已改）

- **动作**：函数重命名 `getKeyGuaranteeAreaBusinessApi` → `getNetworkScaleApi`；`viewItemId` 换为 `homepage-right-network`；`fillTemplateValues` 改为 `indicatorType+indicatorName` 双维匹配、取 `indicatorValue`
- **输出**：section-right.ts（已部分修改）
- **等待用户**：否（已做）

### 步骤 2：剩余收尾（执行方案）

- **动作**：
  1. **模板重排**（section-right.ts `viewItemDataTemplate`）：每类 children 排为 3 条——`基站(深圳)`（Card1 左列）、`基站(重保区域)` + `小区(重保区域)`（Card1 右列斜杠双值），喂满现有 Card1 消费结构、UI 不动；`AreaBusinessMetric` 加 `areaName` 字段、删 `valueField`（取值统一 `indicatorValue`）；`fillTemplateValues` 补 `metric.areaName === row.areaName` 匹配条件。`5ga`（5G-A低空站点）card2 模板项**保留**（新契约暂无对应字段，走模板默认值静态显示，后端补发后改 key 接入）
     - 交付环境配置（environment.json / environment-local.json）的 `viewItemDataTemplate` 若下发需同步新结构；旧 key 下的模板与 staticData 迁至新 key
  2. **环境配置**：`public/environment.json` 的 `homeConfig` 下 key `shenzhen-communication-guarantee-view-key-guarantee-area-business` 重命名为 `shenzhen-communication-guarantee-view-homepage-right-network`，`staticData` 行结构同步改为新 rows（`{areaName, indicatorName, indicatorType, indicatorValue, indicatorUnit}`）；section-right.ts 内 `getEnvironment` key、`loggerText`（改「首屏-右屏-网络规模」）、`localMockUrl`、`fallbackUrl`（`open-close-ceremonies-view-homepage-right-network`）同步换新
  3. **新 mock**：新建 `public/static/mock/shenzhen-communication-guarantee/homepage-right-network.json`，按 api-doc.md「八、右侧-网络规模」样例 rows + 既有 mock 包壳格式（`{code, message, data: {viewPageId, viewItemId, viewItemGroupId, viewItemData: {header, rows}}}`）
  4. **调用方**：`web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-business/index.tsx` import 与 `useRequest` 改用 `getNetworkScaleApi`
  5. **fallback 占位**：`public/static/fallback/shenzhen-communication-guarantee/` 下补 `_open-close-ceremonies-view-homepage-right-network.json` 占位文件，并同步 `api-item-map.md`（沿用 2026-10-29 fallback 任务惯例）
  6. **旧 mock 处理**：`key-guarantee-area-business.json` 保守保留（不做清单）
  7. `pnpm lint` 验证
- **输出**：上述文件变更
- **等待用户**：是（本任务卡审批）

---

## 不做清单

- 不改 UI 展示结构（areaName 深圳/重保区域双列暂不体现在模板，接口数据按 indicatorType 聚合展示，同指标多区域以最后一行为准——见开放问题 1）
- 不动 `docs-api-backend/` 文档（服务端契约为权威输入）
- 不删除旧 mock `key-guarantee-area-business.json`（其他地方可能引用，保守保留）

---

## 业务规则

- **匹配（三维）**：`item.key === String(row.indicatorType).toLowerCase()` 且 `metric.label === row.indicatorName` 且 `metric.areaName === row.areaName` 时回填 `metric.value = row.indicatorValue`；`areaName` 替代旧 `valueField` 的定位职责，label 退为纯展示；取值字段统一 `indicatorValue`（模板不再配 `valueField`）
- **呈现映射（用户确认）**：Card1 左列 `leftMetric` = 深圳，右列 `rightMetrics` = 重保区域；每类 children 排 3 条——`基站(深圳)` / `基站(重保区域)` / `小区(重保区域)`，正好喂满现有 Card1 消费结构、UI 不动
- **兜底机制（模板默认值）**：接口 rows 匹配不中的 metric 保留模板 `value` 静态显示——`5ga`（5G-A低空站点，card2）即用此机制保留：新契约暂无对应数据，显示默认值 198，后端将来补发（indicatorType/areaName 对上）即自动被接口值覆盖，零额外代码
- `enableStaticData=true` 静态直出逻辑保留，`staticData` 需按新 rows 结构下发

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | areaName（深圳/重保区域）双列是否要在 UI 区分展示？当前实现不区分 | 用户 | 已关闭 | 区分：Card1 左列=深圳（leftMetric），右列=重保区域（rightMetrics）；UI 结构不动，回填加 areaName 维度 |
| 2 | indicatorValue 为字符串，是否需转 Number？当前原样回填 | 用户 | 已关闭 | 调用方 `toMetricValue` 已做 `Number(value) || 0` 转换，service 层原样回填即可 |

---

## 验收 checklist

- [x] A1：`pnpm lint` 通过（用户豁免：review 代替，2026-11-10）
- [x] A2：local mock / fallback 路径均指向 `homepage-right-network`，无旧 viewItemId 残留（section-right.ts 内）
- [x] A3：调用方编译无 TS 错误（无引用旧函数名）
- [x] A4：回填 `design/modules/shenzhen-communication-guarantee/001-home/004-area-business/`（spec + data-model 均已按三维匹配机制 + 模板默认值兜底 + 5min 轮询重写）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-10 | 用户 |
| ② 实现验收 | 已验收 | 2026-11-10 | 用户 |
