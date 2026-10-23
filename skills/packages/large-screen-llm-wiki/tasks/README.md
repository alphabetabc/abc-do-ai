# tasks/ 任务目录 · 大屏自然语言生成

> 对应 [../draft-plan.md](../draft-plan.md) 任务表，拆为可执行任务文件。
> 每个任务文件统一结构：**目标 / 输入 / 步骤 / 输出 / 验收 / 依赖**。
> 输入 = 做之前要读的东西；输出 = 做完必须存在的产物（含落盘路径）。

## 任务索引

| 阶段 | 任务文件                                                                   | 名称                     | 计划窗口      | 状态   |
| :--- | :------------------------------------------------------------------------- | :----------------------- | :------------ | :----- |
| 一   | [T1.1-component-inventory.md](./T1.1-component-inventory.md)               | 组件能力盘点             | 10.26 – 11.01 | 未开始 |
| 一   | [T1.2-widget-types.md](./T1.2-widget-types.md)                             | 抽象 widget 类型定义     | 11.01 – 11.07 | 未开始 |
| 一   | [T1.3-layout-interaction-binding.md](./T1.3-layout-interaction-binding.md) | 布局/联动/数据绑定规范   | 11.07 – 11.10 | 未开始 |
| 一   | [T1.4-adapter-spec.md](./T1.4-adapter-spec.md)                             | 适配层规范设计与打通验证 | 11.10 – 11.13 | 未开始 |
| 二   | [T2.1-prompt-template.md](./T2.1-prompt-template.md)                       | 翻译 prompt 模板设计     | 11.13 – 11.20 | 未开始 |
| 二   | [T2.2-validation-rules.md](./T2.2-validation-rules.md)                     | 校验与纠错规则           | 11.20 – 11.27 | 未开始 |
| 二   | [T2.3-e2e-demo.md](./T2.3-e2e-demo.md)                                     | 端到端 Demo 闭环         | 11.27 – 12.04 | 未开始 |
| 三   | [T3.1-scenario-templates.md](./T3.1-scenario-templates.md)                 | 场景模板扩展             | 12.04 – 12.15 | 未开始 |
| 三   | [T3.2-pitfall-cases.md](./T3.2-pitfall-cases.md)                           | 踩坑与规则沉淀           | 12.15 – 12.24 | 未开始 |
| 三   | [T3.3-sop-final.md](./T3.3-sop-final.md)                                   | SOP 终稿与 skill 收口    | 12.24 – 12.31 | 未开始 |

> 日期口径：本表与 [../draft-plan.md](../draft-plan.md) 任务表一致（2026-10-23 调整后），两处如再不一致，以本 README 为准并同步 draft-plan。

## 总体路径（2026-10-23 定稿）

```
阶段一（本项目内）：完成 wiki skill —— 盘点 → Schema v1 → 适配层规范
        ↓
空项目（用户后续提供，待定路径）
        ├─ 阶段二 Demo 落地：一句话 → Schema → 校验 → 渲染（通用组件，不搬本项目组件库）
        ├─ 交付物容器：给领导的 skill / SOP / Demo 全部放空项目
        └─ 复用性验证提前：空项目从零跑通 = "换项目只重写适配层"的活证据
```

- **顺序**：先在本项目完成阶段一（Schema 抽象的输入源在这里），空项目从阶段二（T2.3 Demo）接入
- **空项目适配层口径**：用通用组件（echarts 原生 + 简单布局）实现轻量适配，证明 Schema 不绑定任何组件库
- **交付叙事**：独立 skill + 空项目验证 Demo + 规则层不依赖现有工程，换项目直接用
- **空项目开发方式**：空项目同样由 AI IDE（Trae / WorkBuddy 类）驱动开发。因此本 skill 的 wiki 资产（Schema 规范、翻译规则、SOP）即是空项目里 AI 助手的"输入上下文"——接手空项目的代理读本 skill 即可开工，无需人类重新解释。T2.3 在空项目开工时，第一步就是把本 skill（或其副本/引用）作为代理上下文注入
- **待办**：空项目路径未定（用户后续提供），T2.3 / T3.3 的落盘位置届时更新

## 输出物落盘约定（汇总）

| 产物                        | 落盘位置                                           | 可带走等级          |
| :-------------------------- | :------------------------------------------------- | :------------------ |
| 组件能力清单                | `wiki/03-adapter/inventory/`                       | B                   |
| Schema v1（widget 类型）    | `wiki/01-schema/widget-types.md`                   | A                   |
| Schema v1（布局/联动/绑定） | `wiki/01-schema/layout-interaction-binding.md`     | A                   |
| Schema 完整类型定义         | `wiki/01-schema/schema-v1.ts`（或 .json）          | A                   |
| 适配层规范                  | `wiki/03-adapter/adapter-spec.md`                  | B                   |
| prompt 模板 v1              | `wiki/02-translation/prompt-template.md`           | A                   |
| 校验与纠错规则              | `wiki/02-translation/validation-rules.md`          | A                   |
| 校验器脚本                  | `wiki/02-translation/scripts/`（纯 Node 内置依赖） | A                   |
| Demo 与案例                 | `wiki/04-cases/`                                   | A/B（案例虚构脱敏） |
| SOP 终稿                    | `wiki/05-sop/reuse-guide.md`                       | A                   |

> 等级定义见 [../wiki/overview.md](../wiki/overview.md)：A=纯通用资产 / B=含技术细节需小改可复用 / C=仅本项目。

## 外部上下文约定

- 职场沟通 / 对领导汇报策略等**非技术上下文，本 skill 一律不存储**
- 需要时由**用户主动提供**相关上下文；新会话接手技术任务时无需等待此类输入，直接按本 README 开工

## 周同步与红线

- 每周一次三段式同步（完成/风险/下一步），开头一句人话判断；草稿也发
- 每个任务验收前过红线自查：不漏项目名/业务概念、通用层（01/02）零泄漏、文档标可带走等级
