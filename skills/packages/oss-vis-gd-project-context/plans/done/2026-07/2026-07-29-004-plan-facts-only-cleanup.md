# Plan-004：five-major-center 9 件套「只保留事实」清理

> **日期**：2026-07-29
> **性质**：执行计划（基于 plan-003 v2 之后的 user 反馈）
> **前置计划**：
> - [`2026-07-29-003-plan-modules-specs.md`](./2026-07-29-003-plan-modules-specs.md)（v2：仅 five-major-center）
> **触发**：user 反馈 2026-07-29「只填写事实部分，不需要分析下一步迭代等」
> **目的**：清理 9 件套中 AI 推断 / 改进建议 / 实施切片的内容，回归"代码事实"边界

---

## 0. 背景与教训

### 0.1 user 反馈（2026-07-29）

> "我们在基于模板同步生成文档，不需要你帮我提出规划"
> "第一步就是根据范围，完成事实文档，不需要分析下一步迭代等"

### 0.2 我之前的偏差

| 错误 | 性质 |
|---|---|
| 在 plan.md 写 R1–R5 切片（带 PM 决策阻塞、风险矩阵） | **替 PM 拍板** |
| 在 tasks.md 写阶段 A–I + PM1–PM5 改进建议 | **替 PM/TL 派任务** |
| 在 spec.md 写 §8 GAP-* / §9 O-1~O-10 | **强行制造"流程"感** |
| 在 data-model-extensions.md 写 §5 合并状态 / §4 O-* | **替 dev 决策合并策略** |
| 在 as-is-architecture.md 写开放问题 O-1~O-10 | **AI 推断** |
| 在 code-inventory.md 写 L 互链结构 | **属于 docs-link 范畴** |
| 建立 docs-link/ + scan-docs-links.js + 2 个 fix 脚本 | **不属于 9 件套交付** |

### 0.3 正确原则（沉淀）

> ✅ 沉淀到 `.trae/skills/oss-vis-gd-project-context/plans/done/design/docs-function-description.md` §8.5

| 文档 | 写 | 不写 |
| --- | --- | --- |
| pm-requirements-input.md | PM 业务语言 | AI 推断的业务规则 |
| as-is-architecture.md | 代码事实 | 改进建议 / 重构方向 |
| code-inventory.md | 代码清单 | 跨模块互链分析 |
| spec.md | PM 拍板 | R1–R5 切片 / GAP-* |
| acceptance-tests.md | PM + QA | 实施切片 |
| plan.md | PM / TL | AI 提的"建议" |
| tasks.md | PM / TL | AI 派的任务 |
| data-model-extensions.md | dev | 整合策略 / 合并状态 |
| assets/README.md | 谁截图谁写 | AI 生成的图 |

---

## 1. 目标

清理 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center` 9 件套中所有"非事实"内容，回归"代码事实"边界。

**保留**：代码引用 / 文件路径 / 路由表 / 配置字段 / 依赖版本 / 组件清单
**删除**：R1–R5 切片 / PM1–PM5 改进建议 / GAP-* / O-* / 风险矩阵 / 灰度策略 / 后续 plan / 跨 doc 互链

---

## 2. IN 与 OUT

### 2.1 IN（本计划做）

- ✅ 9 件套逐文件清理（保事实 / 删非事实）
- ✅ 保留路径已修正（110 处无需重做）
- ✅ 保留已通过 D-12 验证

### 2.2 OUT（本计划不做）

- ❌ 不动业务代码（与 plan-003 v2 一致）
- ❌ 不动其他 3 模块 spec（plan-004+）
- ❌ 不重建 docs-link/ 目录（不属于 9 件套交付，可保留作为 AI 工具）
- ❌ 不删除 `scan-docs-links.js` 工具（属于 D-13 验证工具，可保留）
- ❌ 不动 `plan-003 v2` 文档（计划文档本身保留作为历史）

---

## 3. 9 件套逐文件清理清单

### 3.1 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/as-is-architecture.md`

| 段 | 当前内容 | 处理 |
|---|---|---|
| 1. 模块职责 | 路由 + 5 条子路由 | ✅ 保留（事实） |
| 2. 结构总览 | 目录树 | ✅ 保留（事实） |
| 3. 子视图详情 | 5 条路由 + 26 widget 列表 | ✅ 保留（事实） |
| 4. 数据源 | environment.json 字段 | ✅ 保留（事实） |
| 5. 数据流 | mermaid | ✅ 保留（事实） |
| 6. 状态管理 | Context / valtio | ✅ 保留（事实 + ⚠️ 不写使用位置） |
| 7. 性能基线 | designWidth 5760 | ⚠️ 保留事实 + 删"待 PM 补"标注 |
| 8. 技术债务 | TD-1~TD-10 | ✅ 保留（代码观察） |
| 9. 拆分建议 | 不拆子 spec | ✅ 保留（单一事实） |
| 10. 开放问题 | O-1~O-10 | ❌ **删除**（AI 推断） |

### 3.2 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/pm-inputs/pm-requirements-input.md`

| 段 | 当前内容 | 处理 |
|---|---|---|
| 1. 概述 | ⚠️ 待 PM 补 | ✅ 保留（已在留空） |
| §A–§H | 全字段留空 | ✅ 保留（已留空） |
| §I 参考资料 | 列出 as-is / code-inventory 链接 | ✅ 保留（事实） |

### 3.3 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/pm-inputs/code-inventory.md`

| 段 | 当前内容 | 处理 |
|---|---|---|
| A 模块基本信息 | 路径 / 状态 | ✅ 保留（事实） |
| B 入口与依赖 | package.json | ✅ 保留（事实） |
| C 路由 | 5 条 | ✅ 保留（事实） |
| D 页面 | 自渲染 + iframe-page | ✅ 保留（事实） |
| E 组件 | 共享层 + 子中心组件 | ✅ 保留（事实） |
| F API | 静态配置路径 | ✅ 保留（事实） |
| G 数据源 / Mock | environment.json | ✅ 保留（事实） |
| H 状态管理 | Context / valtio | ✅ 保留（事实） |
| I 样式 / 主题 | antd / styled-components | ✅ 保留（事实） |
| J 第三方依赖 | ECharts / fedx-gis | ✅ 保留（事实） |
| K 已知遗留 | 备份文件 | ✅ 保留（事实） |
| L 与其它 artefact 对应 | 链接到 spec.md / plan.md | ❌ **删除**（属于 docs-link 范畴） |
| M 关联文档 | 链接表 | ⚠️ 简化为 9 件套间互链 |

### 3.4 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/spec.md`

| 段 | 当前内容 | 处理 |
|---|---|---|
| 1. 背景与目标 | 待 PM 补 | ✅ 保留（已留空） |
| 2. 角色与权限 | 待 PM 补 | ✅ 保留（已留空） |
| 3. 接口契约索引 | 5 条 GET | ✅ 保留（事实） |
| 4. 界面与交互 | 5 路由 + 26 widgets | ✅ 保留（事实） |
| 5. 数据与领域 | 占位 | ✅ 保留（已留空） |
| 6. 边界情况 | 3 条 | ✅ 保留（事实） |
| 7. 非功能 | 画布尺寸 | ✅ 保留（事实） |
| 8. 依赖与拆分 | 待 PM 补 | ✅ 保留（已留空） |
| 9. 开放问题 | 1.（空） | ✅ 保留（已留空） |

### 3.5 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/acceptance-tests.md`

| 段 | 当前内容 | 处理 |
|---|---|---|
| Feature 路由 | S1–S10 | ✅ 保留（代码事实） |
| 补充验收 | Checklist | ✅ 保留（事实） |
| 与其它 artefact 对应 | 表格 | ❌ **删除**（属于 docs-link 范畴） |

### 3.6 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/plan.md`

**当前状态**：已简化（保留 9 件套事实 + 评审 check，删 R1–R5）
**处理**：✅ 保留

### 3.7 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/tasks.md`

**当前状态**：已简化（保留 9 件套事实 + 「本计划不涉及」）
**处理**：✅ 保留

### 3.8 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/data-model-extensions.md`

| 段 | 当前内容 | 处理 |
|---|---|---|
| 1. 本特性涉及的实体 | 4 个 Config | ✅ 保留（事实） |
| 2. 字段增量 | 链接到 as-is / code-inventory | ✅ 保留（事实） |
| 3. 合并回 design 的约定 | 待定稿合并 | ✅ 保留（模板原状） |
| 4. 开放问题 | 1.（空） | ✅ 保留（已留空） |

### 3.9 `.trae/skills/oss-vis-gd-project-context/plans/docs/specs/five-major-center/assets/README.md`

**当前状态**：极简占位
**处理**：✅ 保留

---

## 4. 执行步骤

| 步 | 任务 | 备注 |
| --- | --- | --- |
| 1 | 清理 as-is-architecture.md §10 开放问题 | 删 O-1~O-10 |
| 2 | 清理 code-inventory.md §L 与其它 artefact 对应 | 删整段 |
| 3 | 清理 acceptance-tests.md 末段 与其它 artefact 对应 | 删整段 |
| 4 | 验证 D-12（grep docs/） | 期望 0 违规 |
| 5 | 验证死链（scan-docs-links.js） | 期望仅 plan-002 遗留 |
| 6 | 同步更新 roadmap.md 操作日志 | — |

---

## 5. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| §L 删了导致 spec 间互链缺失 | design/docs-function-description.md §9 已说明引用关系 |
| 删除开放问题让 PM 评审缺输入 | PM-requirements-input.md §H 已是新版（O-1~O-10 融入） |
| 9 件套间互链断裂 | 9 件套各有"关联文档"段，保留 9 件套内互链 |

---

## 6. 评审检查点

- [ ] 9 件套中 §L / §10 开放问题等"非事实"段已删除
- [ ] 9 件套内"关联文档"段保留（仅 9 件套之间互链）
- [ ] D-12 验证通过
- [ ] scan-docs-links.js 死链数 ≤ 36（plan-002 遗留）
- [ ] roadmap.md 操作日志已更新

---

## 7. 与 docs-link/ 目录的关系

| 项 | 处理 |
| --- | --- |
| `.trae/skills/oss-vis-gd-project-context/references/docs-link/README.md` | **保留**（AI 工具，非项目交付） |
| `.trae/skills/oss-vis-gd-project-context/scripts/scan-docs-links.js` | **保留**（D-13 验证工具） |
| `.trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-fix-*.js` | **保留**（已用于修正 110 处路径，可复用） |
| `.trae/skills/oss-vis-gd-project-context/scripts/2026-07-29-bootstrap-*.js` | **保留**（plan-003 v2 M-1 脚本） |

这些不属于 9 件套交付，但属于 AI 工作流工具，保留。

---

## 8. 关联文档

- `.trae/skills/oss-vis-gd-project-context/plans/done/design/docs-function-description.md` — 9 件套职责边界
- [`.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-003-plan-modules-specs.md`](./2026-07-29-003-plan-modules-specs.md) — 前置计划
- `.trae/skills/oss-vis-gd-project-context/plans/done/roadmap.md` — 路线图
- `.trae/skills/oss-vis-gd-project-context/plans/done/rules/docs-authoring-rules.md` — D-11/D-12 规则

---

## 9. 修订记录

| 日期 | 修订内容 | 出处 |
| --- | --- | --- |
| 2026-07-29 | 初版：清理 9 件套的"非事实"内容 | user 反馈 2026-07-29 |
