---
name: 'oss-demonstrate-project-bj-cmcc-cmd-dispatcher'
description: "维护和扩展北京移动指挥调度模块（cmd-dispatcher）相关能力，包括自动同步 skill 文档（design/ status/ plans/）。Invoke when developing or extending the Beijing CMCC command dispatch module — adding command types, handlers, dispatch routes, page modules, adjusting dispatch logic — OR updating this skill's own docs as required by the Auto-Maintenance Protocol."
---

# 北京移动指挥调度模块 (BJ-CMCC Cmd Dispatcher)

在 `oss-metahuman-demonstrate-project` 项目中维护与扩展北京移动（BJ-CMCC）指挥调度模块。

## 适用场景

-   新增 / 修改命令类型、handler、分发路由、协议
-   新增 / 修改大屏页面、模块、路由、静态资源
-   与前端大屏、Socket、WebSocket、Mock 数据联调
-   重构命令调度中心的注册表 / 上下文 / 中间件
-   新增 / 修改 mock 数据生成脚本（`scripts/` 下）

## 自动维护协议（Auto-Maintenance Protocol）

本 skill 启用即触发文档自维护。任何对 cmd-dispatcher 模块的代码变更，必须按下列映射同步更新对应文档，**不允许只改代码不刷文档**。

| 触发动作（代码侧）                                             | 必须更新的文档                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| 在 `src/controller/index.ts` 新增 / 删除 / 修改 `@Get` 路由    | `status/current.md`                                           |
| 新增 / 删除 `web/pages/<route>/` 页面目录                      | `status/current.md`                                           |
| 修改 `LargeScreenEnv` 的 `designWidth` / `designHeight` 等配置 | `status/current.md` + `design/003-frontend.md`                |
| 新增命令枚举 / 命名规范调整                                    | `design/002-backend.md`                                       |
| 新增 handler 注册模式（注册表 / 分发器调整）                   | `design/002-backend.md`                                       |
| 新增 / 修改接口入参 / 出参与 Mock 结构                         | `design/002-backend.md` + `status/current.md`（如有示例数据） |
| 新增 / 修改页面目录结构约定                                    | `design/003-frontend.md`                                      |
| 新增 / 修改 `public/static/images/<route>/` 资源目录           | `status/current.md`                                           |
| 新增 / 修改 / 删除 `scripts/` 下的 mock 生成脚本               | `status/current.md`（scripts 清单）+ 对应 `plans/task-*.md`   |

每次变更完成后，按 `status/checklist.md` 自检，并在文档开头标注更新日期。

## 文档目录

> 文档编号约定：000 = 输入 / 起点，001 = 输出 / 终态，002+ = 实现细节。**先输入，后输出**。

-   `design/000-pm-input-spec.md` —— PM 原始需求（标书要点）
-   `design/000-pm-input-meeting.md` —— 需求评审会议纪要
-   `design/001-pm-output.md` —— 最终交付目标（录屏验收基线）
-   `design/002-backend.md` —— 后端开发规范（命令 / handler / 路由 / 数据 / Mock / 日志）
-   `design/003-frontend.md` —— 前端开发规范（页面 / 大屏容器 / 静态资源）
-   `design/frontend/001-modules-params.md` —— 模块参数速查
-   `design/frontend/002-shared-components.md` —— 共享组件
-   `design/frontend/003-map.md` —— 地图模块设计
-   `design/frontend/004-module-wrapper-div.md` —— 外层 wrapper div 模式
-   `design/frontend/005-timeline-history.md` —— 时间轴历史回溯设计
-   `status/current.md` —— 已落地路由、页面、目录与关键配置
-   `status/checklist.md` —— 变更前 / 后自检清单
-   `plans/roadmap.md` —— 实施路线图（目标 / 边界 / 里程碑 / 风险 / 看板）
-   `plans/task-YYYY-MM-DD-NNN-<name>.md` —— 进行中的任务（待 review / 进行中）
-   `plans/done/task-YYYY-MM-DD-NNN-<name>.md` —— 已完成 / 已废弃的任务
-   `templates/task.md` —— task 模板（必选 6 段 + 可选 3 段，按需裁剪）
-   `scripts/gen-*.cjs` —— mock 数据生成脚本（输出到 `public/static/mock/<route>/`）

## scripts 管理约定

-   **位置**：`scripts/`（skill 根下，与 `design/` `plans/` `status/` `templates/` 同级）
-   **命名**：`gen-<输出目标>.cjs`（如 `gen-history-timeline-mock.cjs`），仅用 `.cjs`（CommonJS）避免 ESM 配置耦合
-   **职责**：单脚本 → 单 mock 文件；脚本内硬编码坐标 / 常量来源，不依赖外部 config
-   **输出路径**：脚本通过相对路径 `../../../../public/static/mock/bj-cmcc-cmd-dispatcher/` 写入仓库 public 目录
-   **运行方式**：`node .trae/skills/oss-demonstrate-project-bj-cmcc-cmd-dispatcher/scripts/<name>.cjs`
-   **文档同步**：新增 / 修改脚本时，在 `status/current.md` 的 scripts 清单登记（脚本名 + 用途 + 输出文件），并在对应 `plans/task-*.md` 引用
-   **不进仓库根 `scripts/`**：mock 生成脚本属于 skill 资产，统一放 skill 目录下，避免污染仓库根

## plans 管理约定（基于现有 task 文件）

-   **命名**：`task-YYYY-MM-DD-NNN-<name>.md`，日期为创建日，`NNN` 为 3 位序号（沿用 `roadmap.md` 中 T 编号或日期内顺序）
-   **状态机**（写在文件首行 `> 状态：`）：`待 review` → `进行中` → `已完成` / `已废弃`
-   **生命周期**：完成后整体移入 `plans/done/`；废弃不移但标注 `> 状态：已废弃`
-   **与 roadmap 的关系**：每个 task 对应 `roadmap.md` §X 中的一组 T 编号；roadmap 看板的勾选状态 = task 完成状态之和
-   **与 status 的关系**：每个 task 的「文档同步要求」表格是 `status/current.md` / `status/checklist.md` 的更新清单
-   **与 design 的关系**：每个 task 的「收口：反哺 design」段落（如有）说明需要回填到哪个 design 文档
-   **模板**：新建 task 时复制 `templates/task.md`，按需删除可选小节（八 / 九 / 十）
-   **版本记录**：task 文件**不需要**记录版本号，仅通过 `> 状态：` 字段管理生命周期；版本管理统一由 skill 文档元信息承担

---

## 文档元信息

> 版本：v1.1.0
> 日期：2026-08-25（v1.1.0：新增 scripts 管理约定）
