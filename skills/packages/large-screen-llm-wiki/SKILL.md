---
name: large-screen-llm-wiki
description: 大屏自然语言生成（NL→DSL）知识库与工作区。当需要查阅/设计大屏 DSL Schema、自然语言到 Schema 的翻译规则、适配层规范、生成链路 Demo 或相关计划文档时使用。
---

# large-screen-llm-wiki

> 目标：把大屏生产从"人工拼装"转为"规则驱动的自然语言生成"，并沉淀成组件无关、可脱离本项目复用的资产（Schema 规范 + 翻译规则 + 适配层规范）。

## 定位

本 skill 是"大屏 + AI"方向的工作区与知识库：

- **计划与方案**：对外提交的工作计划（发展目标 / 执行内容 / 任务表）
- **Schema 规范**：组件无关的大屏 DSL Schema 设计（widget 类型 / 布局 / 联动 / 数据绑定）
- **翻译规则**：自然语言 → Schema 的 prompt 模板、校验与纠错规则
- **适配层规范**：Schema 抽象 widget 类型 → 本项目 ui 组件的映射约定
- **踩坑记录**：生成链路验证过程中的经验沉淀

## 文件索引

| 文件 | 内容 |
| :--- | :--- |
| [draft-plan.md](./draft-plan.md) | 工作计划（对外提交：发展目标 / 总结 / 执行内容 / 任务表 / 架构口径） |
| [wiki/](./wiki/overview.md) | 知识沉淀输出窗口：Schema 规范 / 翻译规则 / 适配层规范 / 案例库 / SOP，兼作提交产出与个人资产积累 |

## 架构口径（一图记住）

```
┌─────────────────────────────────────┐
│  Schema 规范（widget/布局/联动/数据绑定） │ ← 通用：纯结构定义，不含本项目概念
├─────────────────────────────────────┤
│  自然语言 → Schema 的翻译规则           │ ← 通用：prompt 模板、校验规则、纠错策略
├─────────────────────────────────────┤
│  组件适配层（adapter）                  │ ← 本项目：Schema widget 类型 → ui 组件
├─────────────────────────────────────┤
│  现有 large-screen 渲染层              │ ← 本项目：不动
└─────────────────────────────────────┘
```

核心原则：**上面两层不知道下面是谁**。换项目只重写适配层，Schema 规范、翻译规则原样带走。

## 现有基础（本项目可复用资产）

- `web/components/large-screen/`：`createLargeScreen` + `registerWidget({ name, element, layout, group, subscribe })` 声明式注册机制，本质是隐性 DSL
- `web/components/large-screen/utils.ts`：`defineInteractionFields` + 内置字段（`widgetVisible` / `widgetGroup:visibleFilter`）驱动的联动机制
- `web/components/ui/`：echarts 封装、emap-gis、panel、border、decoration 等组件库

## 约束

- Demo 阶段抽象 6–8 个 widget 类型（map / chart-bar / chart-line / chart-pie / kpi-card / list / panel / decoration），够闭环，不过度设计
- 通用性体现在架构口径，不体现在工作量：不做多组件库适配、不做可视化编辑器
- 通用层（Schema、翻译规则）不得引用本项目组件名或业务概念
