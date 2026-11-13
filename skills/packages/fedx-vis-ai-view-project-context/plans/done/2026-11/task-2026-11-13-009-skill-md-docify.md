# Task · 2026-11-13-009-skill-md-docify

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-009-skill-md-docify` |
| Status | 已完成（2026-11-13 用户验收通过，归档） |
| 类型 | 编码 / docs |
| 影响范围 | `docs/_SKILL.md`（新建，正文迁入）、`scripts/export-skill.mjs`（buildSkillMd 简化为读文件 + 注 frontmatter）、`docs/workflows/schema-mode.md`（如消重需要微调） |
| Roadmap | 工程治理 / skill 产物收敛 |
| 验收标准 | SKILL.md 正文由 `docs/_SKILL.md` 维护，脚本只注 frontmatter；export:skill 产物内容与现状等价（或消重后更瘦且无信息丢失）；module-index.md 仍由脚本生成 |
| 前置依赖 | 无 |

---

## 目标（Goal）

把 SKILL.md 的 44 行静态模板字符串从 export-skill.mjs 内嵌迁到 `docs/_SKILL.md`，消除「改文档要动脚本」与「正文与 workflows 双份维护漂移」两个问题。

---

## 背景与动机

- `buildSkillMd()`（export-skill.mjs L73-116）是硬编码模板字符串：素材边界、模式判断等段落与 docs/workflows/*.md 重复，上次 backgroundImage 需求就同时改了两处
- 仓库哲学是「docs/ 纯内容、export 原样拷贝」，SKILL.md 是唯一例外，走脚本内嵌
- 用户 2026-11-13 定方向：迁 `docs/_SKILL.md`（`_` 前缀与 `_templates` / `_assets` 同族，listModules 天然跳过，不会误导出）

---

## 功能列表

- F1 **正文迁移**：SKILL.md 正文（frontmatter 之后全部）迁入 `docs/_SKILL.md`
- F2 **脚本简化**：`buildSkillMd()` 改为读 `docs/_SKILL.md` + 注入 frontmatter（`name` / `description` 仍由脚本持有，属构建元数据）；文件缺失时明确报错
- F3 **消重**：正文中与 workflows 重复的段落（素材边界、模式判断细则）改为指向 `workflows/schema-mode.md` 的链接，SKILL.md 只留索引 + 导航，信息不丢失
- F4 **module-index 不动**：`_module-index.md` 仍由脚本从 manifest 清点生成（构建时事实，勿手改），本任务不改其逻辑

---

## 不做清单

- 不把 module-index.md 做成 docs 静态文件（生成物性质，手工维护必漂移）
- 不动 export-skill.mjs 其余逻辑（renderer 构建 / vendors 拷贝 / workspace 依赖校验 / skeleton 过滤）
- 不改 skill 的 name / description

---

## 步骤（执行计划）

### 步骤 1：审批（硬门槛①）

- **动作**：确认 F3 消重尺度（链接替代 vs 保留全文）、_SKILL.md 落位（`docs/_SKILL.md` 顶层）
- **输出**：批准结论
- **等待用户**：是

### 步骤 2：迁移与简化（F1-F3）

- **动作**：建 docs/_SKILL.md（消重后正文）→ 改 buildSkillMd → 删脚本内旧模板
- **输出**：代码变更
- **等待用户**：否

### 步骤 3：验证（硬门槛②）

- **动作**：`pnpm export:skill` → 对比 dist-skill/SKILL.md 与迁移前产物 diff（确认等价或消重合理）；全门槛命令通过
- **输出**：验证结论 + 归档
- **等待用户**：是

---

## 技术设计（阶段二回填）

- 正文唯一来源：`docs/_SKILL.md`（`_` 前缀与 `_templates` / `_assets` 同族；listModules 只扫 `docs/materials/`，天然不收集）
- `buildSkillMd()` 改 async：读 `docs/_SKILL.md` + 注 frontmatter（name/description 仍由脚本持有）；调用处 `await buildSkillMd()`；文件缺失时 throw 明确报错
- F3 消重落点：「判断依据 / 素材边界 / 物料缺口回流」三段复述 → 一行指引指向 `workflows/schema-mode.md` 对应节；schema-mode.md 已含全部细节，无信息丢失
- module-index.md 生成逻辑不动（manifests 未变 ⇒ 产物字节级一致）

## 实施记录（2026-11-13）

1. 新建 `docs/_SKILL.md`（消重后正文）
2. export-skill.mjs：删 44 行内嵌模板，`buildSkillMd()` 改读文件 + 注 frontmatter；修复迁移引入的缺 `await` bug（writeFile 收到 Promise 报 ERR_INVALID_ARG_TYPE）
3. 验证：
   - `pnpm export:skill` 成功（52 物料导出）
   - 产物 SKILL.md 与迁移前 diff：仅消重的 3 段 → 1 行（+1/-5），其余逐字节一致
   - 产物无 `_SKILL.md` 泄漏（A2）
   - `check:renderer-isolation` / `check:material-registry`（9↔9）/ `check:skeleton-mirror`（17/17）全过

## 验收 checklist

- [x] A1：`docs/_SKILL.md` 存在且为正文唯一来源；export-skill.mjs 无内嵌模板字符串
- [x] A2：`docs/_SKILL.md` 不被 listModules 收集（`_` 前缀跳过验证）
- [x] A3：export:skill 产物 SKILL.md 含正确 frontmatter + 全部正文；消重段落有对应链接、无信息丢失
- [x] A4：产物 module-index.md 与迁移前一致（生成逻辑与 manifests 均未动）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-13 | 用户 |
| ② 实现验收 | 已验收通过 | 2026-11-13 | 用户 |

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 移除该任务索引行
- [x] `env/AGENTS.md` —— docs/ 目录约定未新增对 `_SKILL.md` 的强制说明，无需更新

---

## 关联

> - 相关 task：task-2026-11-13-008-widget-shell-builtin（同样触碰 skill 产物链，互不冲突可并行）
> - 相关文件：scripts/export-skill.mjs L73-116（迁移对象）
