# Task 2026-09-17-001：spec 003 现场真实样例回填（mock 替换 + 请求逻辑反查）

> 关联 spec：docs/specs/003-noc-second-hazard（spec.md §4 契约）
> 关联任务：承接 task-2026-09-15-001（真实接口契约回填与联调）的样例数据部分
> 创建日期：2026-09-17
> 状态：**待审批**

## 1. 背景

现场回传了两组样例数据（`.local-env/` 下，不进 git）：

| 文件                             | 内容                                     |
| -------------------------------- | ---------------------------------------- |
| `.local-env/隐患详情请求.txt`    | 4 组请求样例（纯请求报文）               |
| `.local-env/隐患详情请求(1).txt` | 同 4 组请求 + 真实响应报文成对（约 2MB） |

覆盖 viewItem：

1. `risk-detail`（隐患详情，riskStatus=全部）
2. `risk-whole-plan`（整体计划类型柱状图）
3. `risk-plan-detail` ×3（planType = month / 3month / whole）

## 2. 任务内容

### T1：mock 数据换成真实样例

-   定位 spec 003 前端 mock 先行接入位置（risk-detail / risk-whole-plan / risk-plan-detail 三类 viewItem 的 mock 数据源）。
-   用现场样例的真实响应报文替换现有 mock，保持 mock 数据结构与响应报文一致。
-   验证：页面下钻弹窗、整体计划柱图、整改计划三分类弹窗在 mock 下正常渲染真实样例数据。

### T2：按现场请求样例反查我们的逻辑

对照样例请求参数核对前端 viewPageArgs 构造逻辑，核对点：

| #   | 核对项                         | 现场样例值                                                                                                      |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1   | risk-detail 的 riskStatus 取值 | 中文值（`全部` 等），与 spec 契约 `全部\|已完成\|未完成` 对照                                                   |
| 2   | risk-plan-detail 参数互斥关系  | month/3month 带 `major`（如 `传输网`）不带 `indicatorGroup`；whole 带 `indicatorGroup`（如 `1001`）不带 `major` |
| 3   | planType 取值                  | `month\|3month\|whole`                                                                                          |
| 4   | zoneId / zoneLevel 格式与传递  | `1161128211` / `2`                                                                                              |
| 5   | 响应数据结构消费               | 10 字段 header/data 结构、indicatorName/indicatorValue 四字段结构与前端消费逻辑对照                             |

发现不一致处：能前端修正的直接修，涉及契约歧义的记录到 spec 003 开放问题并反馈用户。

## 3. 验收标准

1. mock 替换后三个 viewItem 场景均可用真实样例渲染。
2. 出具核对结论清单（核对项 × 结论 × 是否修正）。
3. `pnpm run lint` 无报错。
4. spec 003 相关文档（如涉及）按 docs/ 审批机制处理——本任务默认不直接改 docs/，如需更新 spec 003 契约描述另行走审批提案。

## 4. 范围与边界

-   不动服务端/BFF 转发逻辑（如反查发现 BFF 侧问题，记录并反馈，不擅自改）。
-   `.local-env/` 样例文件不进 git；mock 数据直接使用现场样例原样内容，不做脱敏。
-   不涉及 requestId 登记事项（仍归 task-2026-09-15-001）。

## 5. 审批记录

| 轮次 | 时间       | 结论   | 备注                                        |
| ---- | ---------- | ------ | ------------------------------------------- |
| 1    | 2026-09-17 | 已批准 | 用户批准执行（mock 直接用原样数据，不脱敏） |

## 6. 执行记录

### 2026-09-17 执行完成

**T1：mock 数据换成真实样例**

-   定位：mock 位置 `public/static/mock/management-overview-second/`，接入点 `web/services/management-overview-second/share/index.ts`（localMockUrl：risk-detail-solve / risk-detail-rectify / risk-whole-plan）。
-   用一次性 Node 脚本从 `.local-env/隐患详情请求(1).txt` 提取 5 个响应报文（risk-detail / risk-whole-plan / risk-plan-detail ×3，原样未脱敏）：

| mock 文件                | 数据来源                      | 说明                                                                                                                  |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| risk-detail-solve.json   | risk-detail 响应              | 约 2MB，真实明细                                                                                                      |
| risk-whole-plan.json     | risk-whole-plan 响应          | 4 行（indicatorGroup 1001~1004，indicatorName 为日期）                                                                |
| risk-detail-rectify.json | risk-plan-detail（whole）响应 | 现场三个 plan-detail 响应 rows 数为 month=0 / 3month=3 / whole=62，mock 为单静态文件不分参数，选行数最多的 whole 响应 |

-   原 risk-detail.json（多接口共用）未动；提取脚本用后已删除。

**T2：请求逻辑反查结论**

| #   | 核对项                                                                   | 结论                                                                                                                                                                                              | 是否修正   |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | risk-detail 的 riskStatus 取值                                           | 一致。现场样例传 `全部`，契约支持 全部\|已完成\|未完成；我们 hazard-solve 弹窗按柱块系列传 `已完成`/`未完成`，符合契约                                                                            | 否         |
| 2   | risk-plan-detail 参数互斥关系                                            | 基本一致。现场 whole 样例同时传了 `major:"传输网"` + `indicatorGroup:"1001"`，但接口文档约定 major 仅 month/3month 传入；我们 whole 时只传 indicatorGroup，符合文档，不改（后端对多余参数应容忍） | 否         |
| 3   | planType 取值                                                            | 一致（month/3month/whole，见 hazard-rectify/detail-modal 参数构造）                                                                                                                               | 否         |
| 4   | zoneId / zoneLevel                                                       | 一致（字符串，来自 zoneSelect 区域联动）                                                                                                                                                          | 否         |
| 5   | 响应数据结构消费                                                         | **发现不一致**：真实数据 `solveSchedule` 为毫秒时间戳字符串（如 `"1793289600000"`），前端表格原样渲染会显示时间戳数字（原 mock 为 `"2026-09-30"` 日期串，掩盖了该问题）                           | 是（见下） |
| 6   | 附带核对：hazard-solve 系列映射（indicatorGroup '1'→未完成、'2'→已完成） | 样例未覆盖（现场 risk-detail 样例仅 riskStatus=全部，未体现 indicatorGroup 映射），无法验证，留待联调确认                                                                                         | 待联调     |

**代码修正**：`web/pages/management-overview-second/modules/hazard-solve/detail-modal/index.tsx` 与 `hazard-rectify/detail-modal/index.tsx` 的「解决排期」列增加 render，时间戳字符串格式化为 `YYYY-MM-DD`（dayjs，项目既有依赖），非时间戳值原样展示。

**lint**：`pnpm run lint` 无法在当前环境执行——eslint 8.34 加载 `@FlyFeDX/lint-config` 报 "Unexpected top-level property prettier"（读取任何文件前即失败，属环境预置问题，非本次改动引起）。已用 IDE 诊断验证两个改动文件，无错误。

**遗留**：

-   hazard-solve 系列映射待联调验证（上表 #6）。
-   requestId 登记仍归 task-2026-09-15-001。
-   页面渲染验证建议本地起服务后人工过一遍三个下钻场景（mock 已就绪）。
