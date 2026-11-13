# Task · 2026-11-13-008-skill-blindtest-fixes

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-008-skill-blindtest-fixes` |
| Status | 已完成（待用户验收） |
| 类型 | skill / 编码 / docs 混合 |
| 影响范围 | `docs/workflows/big-screen-assembly.md`、`docs/workflows/schema-mode.md`、`scripts/export-skill.mjs`、`packages/screen-renderer/src/`（schema 类型 + 渲染器）、`docs/skeleton/` 与 `apps/playground/`（镜像同步）、`docs/materials/**/manifest.json`（部分模块补 runtime 块）、`SKILL.md` 生成内容（export-skill.mjs 内静态段） |
| Roadmap | 阶段 4 skill 打磨 / 阶段 5 闭环验证 |
| 验收标准 | 外部模型盲测复测不再出现本次 5 个问题；全部校验命令通过 |
| 前置依赖 | task-006、task-007（已完成归档） |

---

## 目标（Goal）

修复外部模型盲测（test-1 / test-2，见 `design/mvp/`）暴露的 5 个 skill 设计问题，使 skill 产物对"四类输入还原大屏"场景的能力边界与文档承诺一致。

---

## 背景与动机

用相同 prompt 让两个外部模型在限定范围内盲推"四类输入 → 大屏"的作业流程，产出 test-1.html / test-2.html（存于 `design/mvp/`）。两份推导与 mvp-sop.html 主干收敛，验证了 skill 文档可被正确理解；但交叉暴露 5 个真实缺陷/缺口。

---

## 功能列表（F1~F5 对应 5 个问题）

- **F1 纪律命令产物缺口**：`big-screen-assembly.md` 引用的 `check:materials` / `check:discipline` 未随骨架导出。修法（二选一，实施时按可行性定，倾向前者）：
  - A. 把 `docs/skeleton/scripts/check-materials.mjs`、`check-discipline.mjs` 及其 package.json scripts 纳入骨架随 skill 导出（注意与 playground 镜像同步，`check:skeleton-mirror` 必须覆盖这两个文件）
  - B. 改 `big-screen-assembly.md`，使用侧只承诺 `pnpm lint`，其余校验注明"研发侧仓库才有"
- **F2 设计素材 Schema 通道**：`SchemaSection` 无素材字段、`canvas.background` 只收颜色。修法（倾向 A+B 组合）：
  - A. schema 层新增素材能力：`canvas.backgroundImage`（URL）+ section 级 `assets`（可选，若渲染器成本过高则只做 backgroundImage）；同步 `packages/screen-renderer/src/types`、渲染实现、`schema-mode.md` 字段说明
  - B. `schema-mode.md` / SKILL.md 明确声明：素材经 propsContract 声明的图标/图片类 Prop 注入；未声明的素材在 Schema 模式不可消费（引导走工程代码模式）
- **F3 Schema 积木面扩充**：为高频物料补 `runtime` 块（至少：carousel-view、gauge、digital-flop；实施时按 spec 复杂度取 2~3 个，propsContract/dataContract/events 必须与实际 Props 严格一致）。补齐后需过 `check:material-registry`（registry 键同步 playground）并在 playground schema 中新增至少一个新 type 的验证用例
- **F4 物料计数口径**：`module-index.md` 头部声明统计口径（总数、含/不含 `_templates` 与 `_assets`）；export-skill.mjs 若硬编码数量则改为构建时统计
- **F5 回流闭环指路**：`big-screen-assembly.md` / SKILL.md 的"缺口处理"处显式链接 `material-extract.md`，把"占位上报即终结"改为"占位上报 → 可按 material-extract 回流"

---

## 不做清单

- 不做素材管理平台 / 素材库（仅 schema 通道 + 文档预期管理）
- 不为全部 46 个非 schemaable 物料补 runtime 块（仅 F3 点名的高频 2~3 个）
- 不引入新 npm 依赖
- 不改 screen-renderer 的既有 propsContract 校验逻辑（只增字段，不改语义）
- 盲测流程本身不固化为例行机制（另行讨论，不在本卡）

---

## 技术设计与实施记录（2026-11-13）

- **F1（选 A）**：`apps/playground/scripts/check-materials.mjs` / `check-discipline.mjs` 字节级拷入 `docs/skeleton/scripts/`；`docs/skeleton/package.json` 增 `check:materials` / `check:discipline` scripts；`scripts/check-skeleton-mirror.mjs` 的 MIRROR_FILES 增两文件（镜像基线从 15 → 17 个文件）。
- **F2（backgroundImage only）**：`packages/screen-renderer/src/types.ts` `SchemaCanvas` 增 `backgroundImage?: string`；`renderer/index.tsx` 以 CSS `url()` + `100% 100%` 拉伸渲染（图在色上，可共存）。未做 section 级 assets（开放问题 2 结论：先不做）。`schema-mode.md` 增字段说明 + 新增"素材（图片 / 图标）在 Schema 模式的边界"节（F2-B）；SKILL.md 静态段同步；`design/mvp/schema-runtime.md` 回写。
- **F3（选 gauge + ui-digital-flop，carousel-view 因跨模块 swiper 依赖复杂度放弃）**：两物料 manifest 增 `runtime` 块（type：`gauge` / `digital-flop`；propsContract 严格对齐 spec.md，digital-flop 的 `suffix` ReactNode prop 显式排除并在 constraints 注明）；playground 拷入两物料 code 并注册 registry；`home.schema.json` 新增两个 section（`value` 经 `data.inline` 下发）。schemaable 总数 7 → 9。
- **F4**：`export-skill.mjs` `buildModuleIndexMd` 构建时统计并输出口径声明行（总数 52 / schemaable 9 / 不含 `_templates`、`_assets`），无硬编码数字。
- **F5**：`big-screen-assembly.md` 两处（硬纪律"物料只复制不改写"、产物清单"物料缺口表"）与 `schema-mode.md` 物料缺口处理节、SKILL.md 静态段，均显式链接 `material-extract.md`。
- **附带修复**：playground 既有 10 个物料拷贝与 specs 原件存在 CRLF/LF 行尾差异（非本卡引入，导致 `check:materials` 在 playground 侧失败），用 specs 原件字节级覆盖后通过。
- 验证背景图素材：`apps/playground/public/static/bg-grid.svg`（径向渐变 + 网格，playground 独有，不随 skill 导出）。

---

## 验收 checklist

- [x] A1 `pnpm export:skill` 后，`dist-skill/large-screen-builder/skeleton/package.json` 的 scripts 含 F1 承诺的校验命令（check:materials / check:discipline，scripts/ 下两文件随骨架导出）
- [x] A2 schema 支持 `canvas.backgroundImage`；playground `home.schema.json` 以 `/static/bg-grid.svg` 实测通过（浏览器验证：背景图 url() 生效、200 加载、无渲染报错；未做 section assets）
- [x] A3 gauge / digital-flop 两个新 runtime.type 过 `check:material-registry`（9 物料 9 键），home.schema.json 各有用例（gauge 72% 仪表盘、digital-flop 128,456 翻牌数字均渲染，截图证据存会话）
- [x] A4 `module-index.md` 口径声明为构建时清点（52 个 / schemaable 9），与 specs 实际一致
- [x] A5 workflows 文档缺口处理处可见 material-extract.md 指路（big-screen-assembly 两处 + schema-mode 一处 + SKILL.md）
- [x] A6 `pnpm build` / `pnpm build:renderer` / `check:renderer-isolation` / `check:material-registry` / `check:skeleton-mirror` 全过；另 playground `build` / `check:materials` / `check:discipline` 全过
- [x] A7 复测自查（实施者按 test-1/test-2 检查点）：5 个问题逐项有对应产物/文档修复，能力边界（素材、schemaable 面、纪律命令、计数、回流）均已闭环
- [x] 影响架构 / 硬约束的决策已回写 `design/`（schema-runtime.md canvas 字段 + 示例）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | F1 选 A（脚本随骨架导出）还是 B（改文档承诺）？ | 用户 | 已决 | A（用户审批时按倾向采纳） |
| 2 | F2 是否做 section 级 assets，还是仅 canvas.backgroundImage？ | 用户 | 已决 | 仅 backgroundImage |
| 3 | F3 具体补哪几个物料的 runtime 块？ | 用户 | 已决 | gauge + ui-digital-flop（carousel-view 跨模块依赖复杂，不在本卡） |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-13 | 用户 |
| ② 实现验收 | 已通过 | 2026-11-13 | 用户 |

---

## 关联

> - 盲测产物：`design/mvp/test-1.html`、`design/mvp/test-2.html`、`design/mvp/mvp-sop.html`
> - 前置：task-006（playground 镜像）、task-007（material-extract 回流管道，F5 引用其产物）
