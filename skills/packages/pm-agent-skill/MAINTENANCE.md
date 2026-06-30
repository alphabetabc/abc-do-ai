---
version: 1.0.0
date: 2026-06-26
status: 生效
audience: pm-agent 维护者 / 智能体开发者
---

# MAINTENANCE · pm-agent-skill 维护规则

> 用途：统一 pm-agent-skill 所有文档的维护规范（frontmatter / 变更流程 / 维护周期）
> 维护人：pm-agent 维护者
> 适用：所有 .md 文档 + beehive-skill.json

---

## 1. 文档 frontmatter 必填字段

所有 .md 文档顶部必须有以下字段：

```yaml
---
version: <x.y.z>
date: YYYY-MM-DD
status: <生效 / 草稿 / 归档 / 待 review>
audience: <目标读者>
maintainer: <维护人 / 团队>
---
```

### 1.1 字段说明

| 字段 | 格式 | 说明 |
|------|------|------|
| `version` | semver `x.y.z` | 文档版本，breaking change 升 major |
| `date` | YYYY-MM-DD | 最后更新日期 |
| `status` | 枚举 | `生效` / `草稿` / `归档` / `待 review` |
| `audience` | 文本 | 目标读者（如"产品经理" / "智能体开发者"）|
| `maintainer` | 文本 | 责任人 / 团队（可选）|

### 1.2 状态值定义

- **生效**：当前对外可用的版本
- **草稿**：编写中，未发布
- **归档**：历史版本，仅供参考，新需求不再基于此
- **待 review**：被识别为可能过时，需要 review 决定升级 / 归档

---

## 2. 变更流程

### 2.1 L1 不可改（skill 核心层）

涉及以下内容的修改需要**新建版本文件 + git tag**：

- `SKILL.md`
- `OPTIMIZATION-PLAN.md`
- `pm-agent-core/pm-agent.md`
- `pm-agent-core/agents/*.md`
- `pm-agent-core/baseline/*`
- `MAINTENANCE.md`（本文档）

**流程**：

1. 新建 `pm-agent.md.v2.md` 之类的版本文件
2. 原文件标记 `status: 归档` + 顶部加"已归档，请使用 v2"
3. 引用方更新到新版本
4. git tag：`pm-agent-core-v2.0.0`
5. 通知所有相关方

### 2.2 L2 禁止智能体直接改（方法论 / 模板层）

涉及以下内容的修改需走**标准 PR 流程**：

- `pm-agent-core/methodology/*.md`
- `templates/*.md`
- `pm-agent-core/PM-QUICKSTART.md`

**流程**：

1. 创建分支：`feature/<文档名>-<变更简述>`
2. 提交 PR，标题格式：`[docs] <文档名>: <变更简述>`
3. 至少 1 个 reviewer 批准（建议与文档 audience 对应的角色）
4. commit message 引用 issue：`Refs #123`
5. 合并后更新文档 frontmatter 的 `version` / `date`
6. 重大变更：更新 `OPTIMIZATION-PLAN.md` 状态

### 2.3 L3 可自由写入（运行时数据）

智能体运行时可自由写入以下目录：

- `knowledge/*`
- `handover/*`

**流程**：

- 智能体按各自触发点自动写入
- 不需要 PR
- 保留 git diff 记录
- 定期 review 知识库

### 2.4 不可改边界的 canonical 定义

权威定义见 [pm-agent.md §5.5](./pm-agent-core/pm-agent.md#55-不可改边界canonical)。

---

## 3. 维护周期

| 维护类型 | 周期 | 触发 |
|---------|------|------|
| **日常 review** | 每周 | 维护者快速浏览 PR / issue |
| **Phase review** | 每个 Phase 验收时 | 全面 review 方法论 / 模板是否需要更新 |
| **季度 review** | 每季度 | review 反模式 / 决策白名单是否需新增 / 降级 |
| **年度 review** | 每年 | review 整体定位、是否需要重构 |
| **触发 review** | 事件触发 | 重大 bug / 用户反馈集中 / 工具重大更新 |

---

## 4. 版本号规范

采用 [Semantic Versioning](https://semver.org/)：

- **Major（x）**：breaking change（如不可改边界变更 / 核心机制重构）
- **Minor（y）**：新增功能（如新增 1 个原则 / 1 个子智能体）
- **Patch（z）**：bug fix / 文档错别字 / 措辞调整

**版本号同步**：

- SKILL.md frontmatter 的 `version` 与所有核心文档保持一致
- 工具自身版本通过 `beehive-skill.json` 的 `version` 字段管理
- 两者**不强制绑定**（skill 文档可以独立迭代）

---

## 5. 反模式（维护相关）

- ❌ 改完文档不更新 `version` / `date` / `status`
- ❌ 跳过 reviewer 直接合并 L2 文档
- ❌ L1 文档"悄悄"修改不打 tag
- ❌ 智能体运行时往 `methodology/` / `templates/` 写东西
- ❌ 归档文档不标记"已归档"导致新人误用
- ❌ frontmatter 缺字段导致后续 review / 引用混乱
- ❌ 决策变更不写"决策日志"（应在 `knowledge/decisions/` 留档）

---

## 6. 引用

- 不可改边界 canonical 定义 → [pm-agent.md §5.5](./pm-agent-core/pm-agent.md#55-不可改边界canonical)
- SKILL.md → [SKILL.md](./SKILL.md)
- 优化方案历史 → [OPTIMIZATION-PLAN.md](./OPTIMIZATION-PLAN.md)
- PM 入门 → [pm-agent-core/PM-QUICKSTART.md](./pm-agent-core/PM-QUICKSTART.md)
