# Task · 2026-10-09-001-init-shenzhen-communication-guarantee

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-09-001-init-shenzhen-communication-guarantee` |
| Status | 已完成 |
| 类型 | docs |
| 影响范围 | `docs/specs/shenzhen-communication-guarantee/`（新建目录及骨架文件）、`docs/specs/index.md`（追加索引） |
| Roadmap | <按需回填 roadmap 条目> |
| 验收标准 | 模块目录骨架创建完成且不夹带猜测性业务内容 |
| 前置依赖 | 无 |

---

## 目标（Goal）

在 `docs/specs/` 下初始化「深圳重要通信保障（Shenzhen Important Communication Guarantee）」模块：仅基于 `docs/specs/_template/` 生成目录骨架并登记到 `docs/specs/index.md`，不编写、不猜测任何业务需求内容。

---

## 步骤（执行计划）

### 步骤 1：审批任务卡（硬门槛①）

- **动作**：用户审批本任务卡
- **输出**：Status → 已批准
- **等待用户**：是

### 步骤 2：编写初始化脚本

- **动作**：在 `.trae/skills/oss-vis-gd-project-context/scripts/` 新建 Node.js 脚本（`init-spec-module.js` 或日期式命名），从 `_template/` 复制骨架到 `docs/specs/shenzhen-communication-guarantee/`，替换模块名占位符；幂等可重复执行（D-13 脚本优先）
- **输出**：脚本文件
- **等待用户**：否

### 步骤 3：执行脚本并登记索引

- **动作**：运行脚本生成模块骨架；在 `docs/specs/index.md` 追加该模块索引
- **输出**：`docs/specs/shenzhen-communication-guarantee/` 骨架文件 + 更新后的 index.md
- **等待用户**：否

### 步骤 4：验收（硬门槛②）

- **动作**：用户确认骨架无误；回填任务卡并归档
- **输出**：Status → 已完成，归档至 `done/2026-10/`
- **等待用户**：是

---

## 不做清单

- 不猜测、不编写任何深圳重要通信保障的业务需求 / 功能列表 / 数据模型内容（留待 PM 输入素材）
- 不创建 `web/pages/`、`web/services/` 等业务代码
- 不改动既有其它模块的 spec 文档（index.md 仅追加索引行）

---

## 验收 checklist

- [x] `docs/specs/shenzhen-communication-guarantee/` 目录结构对应 `_template/` 结构，占位符已替换为模块名
- [x] `docs/specs/index.md` 已追加该模块条目，无死链接
- [x] 骨架文件中不含猜测性业务内容（仅模板占位说明）
- [x] 初始化脚本幂等（二次执行不报错、不重复追加）

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | 模块目录 slug 是否用 `shenzhen-communication-guarantee`（还是更短/其它写法）？ | 用户 | 开放 |  |

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-10-09 | 用户 |
| ② 实现验收 | 已通过 | 2026-10-09 | 用户 |

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 移除该任务索引行
- [x] `roadmap.md` —— 按需更新进度（本任务无对应 roadmap 条目，N/A）

---

## 关联

> - 模板：`docs/specs/_template/spec.md` 等
> - 相关 task：task-2026-07-29-004-plan-modules-specs（modules spec 策略）
