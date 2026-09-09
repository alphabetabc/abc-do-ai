# Task 2026-09-08-002 · 大唐不夜城大屏 spec 五件套

| 字段     | 值                                                            |
| -------- | ------------------------------------------------------------- |
| 状态     | 待审批                                                        |
| 类型     | 文档新增（涉及 `docs/` 写操作，走审批流程）                   |
| 创建日期 | 2026-09-08                                                    |
| 目标     | `docs/specs/002-great-tang-all-day-mall/`（五件套 + as-is.md） |

---

## 一、背景与动机

`docs/specs/index.md` 已登记：其余在用页面（含 great-tang-all-day-mall）补写 spec 时从 002 起编号。大唐不夜城商圈大屏（`web/pages/great-tang-all-day-mall/`）是 6 个在用页面之一，当前没有任何 spec 文档覆盖，需要按 SDD 流程补写「现状蒸馏」型五件套。

## 二、范围

新增 `docs/specs/002-great-tang-all-day-mall/`，文件白名单（复制 `docs/specs/_template/`）：

- `as-is.md` — 现状盘点（证据日期、页面结构、API、冻结项）
- `spec.md` — 规格说明（含「相对 as-is 的差距」，现状蒸馏场景差距可为最小）
- `plan.md`
- `tasks.md`
- `data-model-extensions.md`
- `acceptance-tests.md`

同步修改：

- `docs/specs/index.md` — 登记 002 行（状态：盘点中 → 草稿 → 已落地（现状蒸馏））
- 如盘点涉及实体 / HTTP / 路由：同步更新 `docs/design/data-models.md`、`api-contracts.md`、`system-overview.md` §2.2（以实际盘点结果为准）

## 三、事实来源（反幻觉约束）

| 盘点项     | 来源                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 页面结构   | `web/pages/great-tang-all-day-mall/`（render.tsx、modules/、fields.ts、screen.ts、presets.ts） |
| 业务区块   | modules 下实际目录：business-quality / business-scale / function-zone / legend / meta-human-helper-zone / news / page-title / render-stage-loader / scene-switch / time-display-card |
| 路由       | `src/controller/index.ts`（great-tang-all-day-mall 对应路由）            |
| 接口       | `backend-api-docs/陕西NOC场景接口文档.md` + 页面实际调用的 API 代码     |
| 服务端实现 | `src/modules/noc/`（controller / dto / service / mappers 中与大唐不夜城相关的部分） |

所有内容必须 Read 源码后填写，证据不足处标待填，禁止编造。

## 四、执行步骤

1. 调研：通读页面源码、路由、接口调用，形成盘点笔记。
2. 复制 `_template/` 到 `docs/specs/002-great-tang-all-day-mall/`，先填 as-is.md。
3. 逐份填写五件套（spec.md 须含差距分析；现状蒸馏型以「固化现状 + 待填演进项」为主）。
4. 登记 `docs/specs/index.md`。
5. 自查：链接格式（仓库相对路径纯文本）、无死链、不引用 `noc-shaanxi-project-context`、grep 无其他项目残留。

## 五、Non-goals

- 不改任何源码（src/、web/、public/）。
- 不为其他页面补写 spec（各自独立任务）。
- 不在本 task 内做 git 提交（执行完成后按用户指示提交）。

## 六、验收标准

1. 目录内仅含白名单文件，六份文档无空模板占位残留（待填处有明确指引）。
2. 所有引用为仓库相对路径纯文本，无死链。
3. `docs/specs/index.md` 已登记 002，状态符合枚举。
4. `pnpm run lint` 不受影响（纯文档改动）。

## 七、审批记录

| 日期       | 事项                 | 结论   |
| ---------- | -------------------- | ------ |
| 2026-09-08 | 任务创建，待用户审批 | 待审批 |
