# 详细设计文档链接

> 本文件是 pm-agent Skill 的"详细文档导航"，列出所有相关设计的完整路径

---

## 套 B：pm-agent 具体设计（`./pm-agent-core/`）

### 主入口
- [pm-agent.md · 调度器主入口](./pm-agent-core/pm-agent.md) — 必读 · 9 大节 · 完整职责
- [README.md](./pm-agent-core/README.md) — 整体使用说明

### 4 子智能体
- [scan-agent.md](./pm-agent-core/agents/scan-agent.md) — 扫描智能体
- [plan-agent.md](./pm-agent-core/agents/plan-agent.md) — 规划智能体
- [build-agent.md](./pm-agent-core/agents/build-agent.md) — 改造智能体（动手三件套）
- [verify-agent.md](./pm-agent-core/agents/verify-agent.md) — 验收智能体（不擅自回退）

### 模板
- [handover/handover-template.md](./pm-agent-core/handover/handover-template.md) — 切换包
- [baseline/architecture-baseline-template.md](./pm-agent-core/baseline/architecture-baseline-template.md) — 锁定基线

### 知识库（运行时数据）
- `knowledge/decisions/` — 决策日志
- `knowledge/bug-cases/` — bug 案例
- `knowledge/anti-patterns/` — 反模式
- `knowledge/scanning/` — 扫描报告

---

## 套 A：通用方法论（`./pm-agent-core/methodology/`）

### 基础原则
- [00-overview.md](./pm-agent-core/methodology/00-overview.md) — 导读 + 整体框架
- [01-roles-and-boundaries.md](./pm-agent-core/methodology/01-roles-and-boundaries.md) — 角色与边界
- [02-staged-decomposition.md](./pm-agent-core/methodology/02-staged-decomposition.md) — 阶段化拆解
- [03-standard-deliverables.md](./pm-agent-core/methodology/03-standard-deliverables.md) — 标准化产物
- [04-execution-sop.md](./pm-agent-core/methodology/04-execution-sop.md) — 执行 SOP（含动手三件套）
- [05-doc-system-design.md](./pm-agent-core/methodology/05-doc-system-design.md) — 文档体系设计
- [06-bug-defense.md](./pm-agent-core/methodology/06-bug-defense.md) — Bug 防御
- [07-appendix-decision-whitelist.md](./pm-agent-core/methodology/07-appendix-decision-whitelist.md) — 决策白名单

### 三大核心机制（新）
- [08-pm-authorization.md](./pm-agent-core/methodology/08-pm-authorization.md) — PM 授权机制 ⭐
- [09-context-alignment.md](./pm-agent-core/methodology/09-context-alignment.md) — 上下文对齐机制 ⭐
- [10-proactive-interrupt.md](./pm-agent-core/methodology/10-proactive-interrupt.md) — 主动打断的正确使用 ⭐

---

## 引用规范

- 单层引用：所有引用直接从 SKILL.md 链接到目标文件
- 避免链式引用（A → B → C）
- 100 行以上的文件在目标文件顶部加目录

---

## 维护

- 本文件随 pm-agent 设计更新而更新
- 引用失效时立即修复
- 新增文件时同步加链接
