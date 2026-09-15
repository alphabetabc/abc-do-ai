---
name: 'noc-shaanxi-second-hazard-rectify-data-format'
version: '2.0'
updated: '2026-09-15'
description: 'risk-resolve-plan / risk-whole-plan / risk-plan-detail（隐患整改计划三视图）服务端数据格式：响应结构、rows 字段与数据形态要点。'
---

# risk-resolve-plan / risk-whole-plan / risk-plan-detail 服务端数据格式（隐患整改计划）

## 文档元信息

| 字段     | 值         |
| -------- | ---------- |
| 文档版本 | v2.0       |
| 最后更新 | 2026-09-15 |

数据来源：header 元信息、mock 文件、backend-api-docs/陕西-NOC-202609需求接口文档.md 接口2/3。

---

## 一、risk-resolve-plan 响应外层结构

走 `getViewItemDataApi`（`web/services/request/getViewItemData.ts`）POST 视图服务 `view/getViewItemData`（`baseUrlType: 'sceneViewService'`），参数 `{ viewItemId: 'risk-resolve-plan', viewPageId: 'noc-module-oriented-left-page', viewPageArgs }`，viewPageArgs 直接透传 zoneSelect（含 zoneId/zoneLevel）：

```
{
  code: 200,
  data: {
    viewPageId: 'noc-module-oriented-left-page',
    viewItemId: 'risk-resolve-plan',
    viewItemGroupId: 'risk-resolve-planGroup',
    viewItemData: {
      title: '隐患整改计划',
      header: { counterFieldList: [...] },  // 字段元信息（8 个 counter 字段）
      rows: [ ... ]
    }
  }
}
```

组件取数固定为 `data.viewItemData.rows`。

---

## 二、risk-resolve-plan rows 字段（均为 String 类型，每字段附带 `xxx_format` 镜像字段）

| 字段 | 说明 | 取值 |
| --- | --- | --- |
| indicatorId | 指标 id | 如 '100064'~'100103' |
| indicatorName | x 轴类目（专业名） | 传输网 / 动环 / 核心网 / 网络云 / IP承载网 / 无线接入网 / CMNET / 安全 / 内容网 / 网管系统（10 个专业） |
| moduleId | 模块 id，converter 拆分依据 | '4' 近三个月整改计划 / '5' 本月整改计划 |
| moduleName | 模块名 | 近三个月整改计划 / 本月整改计划 |
| indicatorGroup | 指标组 | '1' 计划 / '2' 已完成 |
| indicatorGroupName | 指标组名 | 计划 / 已完成 |
| indicatorValue | 数值（组件内 `Number()` 转换） | 计数 |
| indicatorUnit | 单位 | '个' |

---

## 三、risk-whole-plan（整体计划安排，2026-09-15 接入）

**契约来源**：backend-api-docs/陕西-NOC-202609需求接口文档.md 接口2。

- viewItemId `risk-whole-plan` / viewItemGroupId `riskWholePlan-Group` / viewPageId `noc-module-oriented-left-page`。
- viewPageArgs：仅 `{ zoneId, zoneLevel }`（区域过滤）。
- rows 字段（四字段 header）：

| 字段 | fieldLabel | 组件消费 |
| --- | --- | --- |
| indicatorName | 指标名称 | **横轴时间**（如 '2026-04'） |
| indicatorValue | 指标值 | 全量未解决隐患统计值（`Number()` 转换） |
| indicatorUnit | 指标单位 | BarChart 右侧数值单位 |
| indicatorGroup | 指标组 | 下钻时透传（whole 场景过滤维度） |

- mock：`public/static/mock/management-overview-second/risk-whole-plan.json`（接口2 真实结构，4 条月度数据）。

---

## 四、risk-plan-detail（整改计划下钻详情，2026-09-15 接入）

**契约来源**：backend-api-docs/陕西-NOC-202609需求接口文档.md 接口3。

### 4.1 请求

- viewItemId `risk-plan-detail` / viewItemGroupId `riskPlanDetail-Group` / viewPageId `noc-module-oriented-left-page`。
- viewPageArgs：

| 参数 | 取值 | 组件组装 |
| --- | --- | --- |
| zoneId / zoneLevel | 区域联动 | |
| riskStatus | 全部 / 已完成 / 计划 | 系列：计划 indicatorGroup '1' → 计划、'2' → 已完成；whole 固定全部 |
| planType | month / 3month / whole | 页签：moduleId '4' → 3month、其余 → month；whole 由 `__planType` 标记 |
| major | 专业名 | month / 3month 时传（rawItem.indicatorName，x 轴类目） |
| indicatorGroup | 接口2 对应组 | whole 时传（rawItem.indicatorGroup，**原样透传，不假设语义**，见 §五注记） |

### 4.2 响应 rows 字段

与 risk-detail 完全一致的 10 字段（hiddenDangerSerialNo / hiddenDangerType / hiddenDangerSubType / hiddenDangerName / major / hiddenDangerLevel / handleDept / resourceName / solveSchedule / rectifyPlanClassify），详见 hazard-solve/data-format.md §4.2。

### 4.3 mock

`public/static/mock/management-overview-second/risk-detail-rectify.json`（独立文件，共用文件 risk-detail.json 勿动）——接口3 真实结构，10 行数据；不区分点击维度（mock 局限）。

---

## 五、数据形态要点

- risk-resolve-plan 每模块（moduleId）为 10 专业 × 2 指标组 = 20 行，两个模块共约 40 行；「计划」与「已完成」按 indicatorGroup 区分，**同专业的两行靠 indicatorName 对齐**（无显式关联键）；行序由服务端保证一致。
- moduleId 语义：'4' 是「近三个月整改计划」（converter 拆为 data3），'5' 是「本月整改计划」（data1）；整体计划安排已剥离至独立视图 risk-whole-plan（原 moduleId '6' 占位方案废弃）。
- risk-whole-plan 每行一个月度统计（indicatorName = 时间），单系列，无 indicatorGroup 区分多系列的诉求。
- **indicatorGroup 注记（whole 下钻）**：risk-plan-detail 在 planType=whole 时仅接受 indicatorGroup（无时间参数），前端把接口2 返回行的 indicatorGroup 原样透传。服务端未明确其取值语义（是否编码时间）且无测试数据；按「原样透传、不假设语义」处理，现场联调如有问题再与后端确认调整（2026-09-15 决策，风险仅记录于此，不在 docs/specs 中体现）。

---

## 六、版本演进说明

| 版本 | 关键变更 |
| ---- | -------- |
| v1.0 | 初始版本：从 hazard-solve / hazard-rectify README 的数据格式章节抽出，独立成文 |
| v1.1 | 从 hazard-data-format.md §三 迁入本模块目录，独立成文 |
| v2.0 | 新增 §三 risk-whole-plan（四字段、indicatorName=时间）、§四 risk-plan-detail 契约（五参数组装表、独立 mock）；moduleId '6' 占位方案废弃记录 |
