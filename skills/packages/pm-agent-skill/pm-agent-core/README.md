---
version: 1.0.0
date: 2026-06-22
status: 初版定稿
audience: 产品经理 / 智能体开发者 / 团队 leader
---

# pm-agent

> PM 入口 / 调度器 / 知识管理 · 完整设计
> **核心机制**：主动接管 + 透明 + 授权制 + 上下文对齐 + 技术栈无关

---

## 产品定位

pm-agent 是面向**产品经理**的智能体：

| 机制           | 含义                                                          |
| -------------- | ------------------------------------------------------------- |
| **主动接管**   | 智能体主动调度 4 个子智能体执行任务（scan/plan/build/verify） |
| **透明**       | PM 实时看到智能体在做什么（行动前汇报 + 状态栏 + 知情确认）   |
| **授权制**     | 智能体不擅自改 PM 的文件，必须 PM 显式说"请帮我改 X"          |
| **上下文对齐** | 智能体改的内容必须符合 PM 当前聊天上下文，不能文不对题        |
| **技术栈无关** | 不绑 React/Py/Vue/Java，PM 自由选技术栈                       |

**核心口诀**：

> **主动建议、等待授权、动手对齐、不替决策**

---

## 快速开始

1. **读入口**：先读 [`pm-agent.md`](./pm-agent.md) 了解调度器职责
2. **按需读子智能体**：
    - 启动新项目 → [`agents/scan-agent.md`](./agents/scan-agent.md)
    - 做架构设计 → [`agents/plan-agent.md`](./agents/plan-agent.md)
    - 改代码 → [`agents/build-agent.md`](./agents/build-agent.md)
    - 验收 → [`agents/verify-agent.md`](./agents/verify-agent.md)
3. **遇到切换场景** → [`handover/handover-template.md`](./handover/handover-template.md)
4. **跨阶段交付** → [`baseline/architecture-baseline-template.md`](./baseline/architecture-baseline-template.md)
5. **核心机制**（新）：
    - 智能体什么时候可以动手？→ [`methodology/08-pm-authorization.md`](./methodology/08-pm-authorization.md)
    - 改的东西怎么保证文对题？→ [`methodology/09-context-alignment.md`](./methodology/09-context-alignment.md)
    - 智能体什么时候可以打断我？→ [`methodology/10-proactive-interrupt.md`](./methodology/10-proactive-interrupt.md)
6. **方法论参考** → [`methodology/`](./methodology/) 目录（套 A 通用方法论 11 份分册）

---

## 目录结构

```
.trae/pm-agent/
├── pm-agent.md                          # 调度器主入口
├── README.md                            # 本文件
├── agents/                              # 4 个子智能体（按工作流顺序）
│   ├── scan-agent.md                    # 扫描：发现阶段
│   ├── plan-agent.md                    # 规划：设计阶段
│   ├── build-agent.md                   # 改造：执行阶段（最严格：动手三件套）
│   └── verify-agent.md                  # 验收：验收阶段（不擅自回退）
├── handover/                            # 切换包
│   └── handover-template.md             # 切换包标准结构
├── baseline/                            # 架构基线
│   └── architecture-baseline-template.md  # 锁定文档模板
├── knowledge/                           # 知识库（运行时数据）
│   ├── decisions/                       # 决策日志
│   ├── bug-cases/                       # bug 案例
│   ├── anti-patterns/                   # 反模式
│   └── scanning/                        # 扫描报告
├── templates/                           # 复用模板
└── methodology/                         # 套 A 通用方法论（11 份分册）
    ├── 00-overview.md                   # 导读
    ├── 01-roles-and-boundaries.md       # 角色与边界
    ├── 02-staged-decomposition.md       # 阶段化拆解
    ├── 03-standard-deliverables.md      # 标准化产物
    ├── 04-execution-sop.md              # 执行 SOP
    ├── 05-doc-system-design.md          # 文档体系设计
    ├── 06-bug-defense.md                # Bug 防御
    ├── 07-appendix-decision-whitelist.md  # 决策白名单
    ├── 08-pm-authorization.md           # PM 授权机制 ⭐
    ├── 09-context-alignment.md          # 上下文对齐机制 ⭐
    └── 10-proactive-interrupt.md        # 主动打断的正确使用 ⭐
```

---

## 核心流程

```
PM 提需求
   ↓
pm-agent 接需求
   ↓
工作流设计（任务依赖分析 + 并行派发 + 互斥锁）
   ↓
【08 授权检查】+【09 上下文对齐】+【10 主动报告】
   ↓
派发 → scan-agent → 扫描报告（PM 显式要求扫描）
   ↓
派发 → plan-agent → 架构计划（PM 确认进入 plan 阶段）
   ↓
派发 → build-agent → 4 件套产物（PM 显式授权后）
   ↓
派发 → verify-agent → 验收报告（PM 确认进入 verify 阶段）
   ↓
pm-agent 锁定基线（git tag + 锁定文档）
   ↓
交付
```

---

## 核心机制（新）

| 机制              | 文档                                                                 | 关键约束                                          |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| **08 PM 授权**    | [08-pm-authorization.md](./methodology/08-pm-authorization.md)       | 智能体不擅自改文件，必须 PM 显式说"请帮我改 X"    |
| **09 上下文对齐** | [09-context-alignment.md](./methodology/09-context-alignment.md)     | 改的内容必须符合 PM 当前聊天上下文                |
| **10 主动打断**   | [10-proactive-interrupt.md](./methodology/10-proactive-interrupt.md) | 智能体可以主动打断，但必须有意义（冷静期 5 分钟） |

**三者形成闭环**：

- 08 决定"能不能动手"
- 09 决定"动的手对不对"
- 10 决定"什么时候可以主动说话"

---

## 切换场景

| 场景       | 触发               | 处理                          |
| ---------- | ------------------ | ----------------------------- |
| Context 满 | 上下文窗口达到阈值 | 生成切换包 → 派新子智能体接手 |
| 多人协作   | 多 PM / 多任务     | 工作区隔离（独立命名空间）    |
| 长任务暂停 | PM 说"暂停"        | 冻结状态 + 写交接包           |

详见 [`handover/handover-template.md`](./handover/handover-template.md)

---

## 知识沉淀

- 子智能体自动追加/修订/合并 `knowledge/`
- 必须留 diff 记录
- pm-agent 做版本化与冲突检测
- 不允许静默修改
- 详见 [`pm-agent.md` §5 知识管理](./pm-agent.md#5-知识管理)

---

## 与套 A 通用方法论的关系

| 套                  | 定位              | 用途                       |
| ------------------- | ----------------- | -------------------------- |
| 套 A `methodology/` | 通用方法论        | 跨项目、跨场景的普适原则   |
| 套 B 本目录         | pm-agent 具体设计 | 指导 pm-agent 的开发与使用 |

- 套 A 是"道"——讲该按什么原则做
- 套 B 是"术"——讲 pm-agent 这个具体智能体怎么实现
- 套 B 的设计思想**部分来源**于套 A 的方法论
- 详见 [`methodology/00-overview.md`](./methodology/00-overview.md)

---

## 扩展指南

- **新增子智能体**：参照 `agents/*.md` 对称结构，新增后更新 `pm-agent.md` §3
- **新增知识分类**：参照 `knowledge/` 四分类，新增后更新 `pm-agent.md` §5
- **新增模板**：放进 `templates/`，引用方登记
- **新增核心机制**：参照 08/09/10 的结构，新增 `methodology/<编号>-<机制名>.md`
- **修订套 A 原则**：在 `methodology/` 下追加新原则，遵循"独立可成立"原则

---

## 维护

- 本目录的所有文件进版本控制
- 关键变更打 git tag
- 详见 [`methodology/05-doc-system-design.md`](./methodology/05-doc-system-design.md)
- 不可改边界：见 [`pm-agent.md` §5.5](./pm-agent.md#55-不可写边界)
