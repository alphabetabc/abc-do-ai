# 009-cutover-order

> fujian 状态：设计骨架（未实施，与分支代码无关）。fujian 基线复核（task-004）确认割接域仍不存在，判定成立；新模块代码风格参照建议见 010-wireless-person-manager。

> 网络割接单管理模块（需求 V4.1 S2 场景，task-002 判定为新建）。本卡为骨架，实施任务时补齐六要素。
> 判定依据：`pm/001-2026-03-27-network-appointment-optimization/technical-analysis.md`

## 功能（规划）

- 工单列表：多条件查询（含 NCDP 工单号/专业类型/工程来源）、自建可编辑/推送只读、批量导入、导出
- 新建/编辑工单：45+ 字段基本信息、业务影响、网元信息区（14 字段，周期/级联）、会审+一~六级审批配置（自动推荐）、方案模板（CRUD/引用/一键转模板）、附件/拓扑/三张表
- 工单详情：7 大块分区 + NCDP 11 环节/省内 6 环节进度打点
- 检测/稽核/冲突/影响分析结果查看与导出
- 取消工单、检测结果确认

## 结构（规划）

```text
src/pages/cutover-order/
  index.tsx              列表页（VirtualTable）
  order-create/          新建/编辑表单族（.tsx）
  order-detail/          详情页（含打点组件，.tsx）
  control/               弹窗族（导入、网元搜索、审批推荐、结果展示、确认，.tsx）
  model/                 校验与数据转换（.ts）
  service/api.ts         割接域接口层（待后端契约）
  upload/                导入导出（.tsx）
```

> **语言约定（用户指定，2026-11-19）**：本模块一律 TypeScript（.tsx/.ts）。仓内现状 JS/TS 混用（如 src/components/page-container/index.tsx），TS 可行；类型声明就近放文件内，公共类型收敛 `types.ts`。

## 关键实现（规划）

- 状态：hox / 组件内 state（遵循 architecture.md 决策，不用 redux）
- 样式与 UI：oss-ui 组件 + less，PageContainer 页头

### 复用分级（用户强调：优先复用，勿重写）

**① 直接 import（零改动）**：exportExcel（pages/common/export.js）、VirtualTable、initTimer（common/timer）、proxy/request/dataService（common/api）、hox 两 model、PageContainer/ErrorBoundary/LocaleProvider/UserDrag（components/）、GlobalMessage（common/global-message）、区域级联（appointment/options region 模式）。

**② 复制改造（主体代码白拿）**：

| 能力 | 来源 | 用在哪 |
| --- | --- | --- |
| 导入导出全流程 | new-project/upload/index.jsx | 模板/网元/三张表导入（F-001~003/014~016/040~041） |
| 网元搜索弹窗（板卡/端口/ONU 层级） | search-gcss / search-fgss | F-007~009 |
| neInfoConverter / listCycleDispose（周期） | new-project/model/extractFun.js | F-012~013 网元转换（直接 import + 字段映射） |
| checkFun 校验模式 | new-project/model/checkFun.js | 表单校验 |
| 审批弹窗骨架 | new-project/control/project-audit/ | F-018~029（骨架照搬 + 三~六级动态行） |
| 查询区 + column.js 列配置写法 | new-project/index.jsx | 列表页 F-055 |

**③ 必须新写（无对应物）**：45+ 字段表单布局、六级审批动态行、11/6 环节打点组件、详情 7 大块分区。

- 风险与依赖见 technical-analysis.md §6

## 六要素（待实施时补齐）

- 路由与入口：`/cutover-order`（+ 子路由，登记 src/routes/index.js）
- 组件树 / 接口清单 / 枚举依赖 / 数据流 / 维护要点：实施时回填
