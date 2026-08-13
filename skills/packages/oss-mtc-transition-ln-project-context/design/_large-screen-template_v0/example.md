# 大屏 spec 目录结构示例

> 以 038 人员信息大屏为例，展示大屏五件套 + 共享能力派生的完整目录结构。

## 完整目录树

```
docs/
├── specs/
│   ├── 038-bigdata-personnel-display/          ← 大屏五件套（父 spec）
│   │   ├── pm-inputs/
│   │   │   ├── assets/                         ← PM 原始素材
│   │   │   │   ├── 大数据综合展示-人员信息.txt
│   │   │   │   ├── image_20260811161540204.png
│   │   │   │   └── 行政区划字典说明.xlsx
│   │   │   └── pm-requirements-input.md        ← PM 需求输入（A-K 章节）
│   │   ├── spec.md                             ← 规格（含 §8 共享能力登记表）
│   │   ├── plan.md                             ← 实现计划（M1-M5）
│   │   ├── tasks.md                            ← 任务分解（含「前置：共享能力」段）
│   │   ├── data-model-extensions.md            ← DB 列 → 图表数据结构字段映射
│   │   └── acceptance-tests.md                 ← 验收测试
│   │
│   ├── 038-shared-personnel-display/           ← 从 038 派生的共享能力  <----------------------- 公共组件 
│   │   ├── 001-ec-map/                         ← ECharts 地图组件
│   │   │   ├── spec.md                         ← 组件契约（props、行为、三态） 不留代码，demo样例代码
│   │   │   ├── task.md                         ← 开发任务
│   │   │   └── data-model.md                   ← 组件数据结构
│   │   ├── 002-big-screen-shell/               ← 大屏壳组件
│   │   │   ├── spec.md
│   │   │   ├── task.md
│   │   │   └── data-model.md
│   │   └── 003-pie-chart-widget/               ← 环形图组件
│   │       ├── spec.md
│   │       ├── task.md
│   │       └── data-model.md
│   │
│   └── 039-bigdata-petition-display/           ← 第二个大屏（引用共享能力）
│       ├── pm-inputs/
│       │   └── pm-requirements-input.md
│       ├── spec.md                             ← §8 共享能力：引用已有的 038-shared
│       ├── plan.md
│       ├── tasks.md                            ← 「前置：共享能力」段引用已有组件
│       ├── data-model-extensions.md
│       └── acceptance-tests.md
│
├── skills/
│   └── frontend/
│       └── large-screen-shared/                ← 蒸馏后的使用指南（skill）<-----------------不要这个
│           ├── SKILL.md                        ← skill 入口
│           └── modules/                        ← 各组件「怎么用」文档
│               ├── ec-map/                     ← EChartsMap 使用指南
│               │   └── index.md
│               ├── big-screen-shell/           ← BigScreenShell 使用指南
│               │   └── index.md
│               └── pie-chart-widget/           ← PieChartWidget 使用指南
│                   └── index.md
│
└── design/
    ├── api-contracts.md                        ← API 契约（全局权威）
    ├── data-models.md                          ← 数据模型（全局权威）
    ├── architecture.md                         ← 架构（全局权威）
    └── system-overview.md                      ← 系统总览（全局权威）
```

## 流程说明

```
① 038 五件套生成
   PM 输入 → 生成 spec/plan/tasks/data-model-extensions/acceptance-tests
   spec §8 主动识别出 3 个共享能力（ec-map、shell、pie-chart）

② 派生共享 spec
   手动调用派生 prompt → 生成 038-shared-personnel-display/ 下的三件套
   回填 038 spec §8 路径 + tasks 前置引用

③ 共享能力开发完成
   task 完成后 → 调用 skill 蒸馏到 docs/skills/frontend/large-screen-shared/modules/

④ 039 五件套生成
   spec §8 检查 large-screen-shared/modules/ → 已存在，直接引用
   tasks 前置段引用已有共享能力，不重复派生
```
