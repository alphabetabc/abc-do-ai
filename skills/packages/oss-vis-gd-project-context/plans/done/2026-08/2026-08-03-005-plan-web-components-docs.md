# Plan-005：web/components 视图基础设施 → docs/design/（总览）

> **日期**：2026-08-03
> **性质**：执行总览计划
> **触发**：user 反馈 2026-08-03「把 `web/components/{data-scheme,initializer,large-screen,socket,ui}` 沉淀到 docs/」
> **目标**：把 5 个视图基础设施目录落到 `docs/design/` 下；任务量大，分 4 个子计划分文件托管
> **关联规则**：`.trae/rules/docs-authoring-rules.md`（D-11 代码事实 / D-12 docs 隔离 / D-14 路径格式 / D-15 skill 边界）

---

## 0. 背景

`docs/design/architecture.md` §2.3 仍表述「本仓库不含视图组件代码」（plan-001 阶段 1 摸排遗留）。但 `web/` 下实际完整存在视图基础设施：

- `web/components/data-scheme/` 数据方案重写
- `web/components/initializer/` 启动序列
- `web/components/large-screen/` 大屏引擎（widget + 缩放 + 交互 + meta-human）
- `web/components/socket/` 操控端 WebSocket
- `web/components/ui/` UI 组件目录

这些不是业务模块（不进 `docs/specs/<module>/`），是横切基础设施，落点应在 `docs/design/`。

> 用户决策（2026-08-03）：
>
> - 归属映射 → **5 个全部落 `docs/design/`**
> - UI 颗粒度 → **API 总册 + 索引**（不逐文件细写）

## 1. 目标与子计划

| 子计划 | 源目录 | 输出 docs/ 文件 |
|---|---|---|
| [006](./2026-08-03-006-plan-app-bootstrap-and-data-scheme.md) | initializer + data-scheme | `docs/design/app-bootstrap.md` + `docs/design/data-scheme.md` |
| [007](./2026-08-03-007-plan-large-screen-engine.md) | large-screen（含 meta-human） | `docs/design/large-screen-engine.md` |
| [008](./2026-08-03-008-plan-screen-control-socket.md) | socket | `docs/design/realtime-protocol/screen-control-socket.md` + 更新 `realtime-protocol/README.md` 索引 |
| [009](./2026-08-03-009-plan-component-library.md) | ui | `docs/design/component-library.md` |

子计划 008 还含一个**副作用**：同步修正 `docs/design/architecture.md` §2.3「本仓库不含视图组件代码」的过时表述。

## 2. 不做（OUT）

- ❌ 不动业务代码（`web/`、`src/`、`public/`、`package.json`、`*.config.*`）
- ❌ 不进 `docs/specs/<module>/`（业务模块规格由其它 plan 管）
- ❌ 不重写 `docs/design/architecture.md`（仅修 §2.3 单段）
- ❌ 不动 `docs/skills/frontend/react/coding.md`
- ❌ 不写 UI 组件的逐文件文档（按用户决策颗粒度）
- ❌ 不创建 `docs/skills/` 内新 skill（Rule 5：本计划不产 skill 文件）

## 3. 执行顺序

| 步 | 子计划 | 可并行 |
|---|---|---|
| 1 | 006（启动 + 方案，2 个文件） | ✅ |
| 2 | 007（大屏引擎，最大） | ✅ |
| 3 | 008（操控 socket + arch 修正，2 个文件） | ✅ |
| 4 | 009（UI 总册） | ✅ |
| 5 | 全局验证（Rule 2 / 4 / 5） | 必须等 1-4 完 |

## 4. 横切事实（5 子计划共用）

| 维度 | 事实 |
|---|---|
| 前端框架 | React 18.1.0 + valtio 1.11.2 + fedx-ui 2.1.5 + antd 5.26.7 + styled-components 6.1.1 |
| 状态管理 | valtio + Context + useSetState + useMemoizedFn |
| 路径别名 | `~/web/...`（tsconfig-paths） |
| 通用 hooks | `useLatest` / `useSetState` / `useMemoizedFn` / `useRequest` / `useEventEmitter` 来自 `@fedx-web-common/react-hooks` |
| 通用 utils | `get` / `pick` / `merge` / `isNil` / `isEmpty` / `isEqual` / `cloneDeep` / `logger.default` 来自 `@fedx-web-common/utils` |
| 日志约定 | `logger.default.info({ message, ... })` / `.warn(...)` / `.error(...)` |

各子计划的 docs/ 文档应保留该横切事实的引用锚（`docs/design/tech-stack.md`、`docs/design/architecture.md`）。

## 5. 完成定义（DoD）

- [ ] 5 个新 docs/ 文档全部产出
- [ ] `docs/design/architecture.md` §2.3 时表述已修正（指向本总览）
- [ ] `docs/design/realtime-protocol/README.md` 索引已加 screen-control-socket 条目
- [ ] Rule 2 验证通过：`grep -rn "\.trae" docs/` 与 `\.\.local-docs` 无结果
- [ ] Rule 4 验证通过：`grep -rn "(file:///\|file:///e:/\|\.\./\.\./\.\./" docs/` 无结果
- [ ] 不引入任何 `.trae/` / `docs-new/` / `scripts/` 输出
- [ ] 没有把 5 个 docs/ 文档写到 `docs/` 之外

## 6. 风险与缓解

| # | 风险 | 缓解 |
|---|---|---|
| R-1 | `web/components/ui/` 子目录多（≈20 个），逐个详写工作量大 | 按用户决策：API 总册 + 索引，每个子目录 1 行 |
| R-2 | `web/components/large-screen/meta-human/` 与已有 `docs/specs/five-major-center-interaction-trigger/SKILL.md` 主题重叠 | 本计划只描述**引擎机制**；Skill 已在 SKILL.md 落地，本计划不重写 |
| R-3 | `web/components/socket/` 的 WebSocket 服务端（端口 9032）与 BFF 端口不同，文档易混淆 | 在 008 明确标注：此为**同进程内**的端口（9032）而非跨服务 |
| R-4 | 修改 `architecture.md` §2.3 可能影响其它文档对其的引用 | 用 `grep -rn "本仓库不含视图" docs/` 验证无残留 |
| R-5 | 5 个 docs/ 文件全部基于代码事实（Rule D-11） | 写每段时以代码 `web/components/.../XXX.tsx#Lyy` 形态标注源；不允许 AI 推断 |

## 7. 关联文档

| 文档 | 说明 |
|---|---|
| [Plan-006](./2026-08-03-006-plan-app-bootstrap-and-data-scheme.md) | initializer + data-scheme 子计划 |
| [Plan-007](./2026-08-03-007-plan-large-screen-engine.md) | large-screen-engine 子计划 |
| [Plan-008](./2026-08-03-008-plan-screen-control-socket.md) | screen-control-socket 子计划 |
| [Plan-009](./2026-08-03-009-plan-component-library.md) | component-library 子计划 |
| `.trae/rules/docs-authoring-rules.md` | D-11/12/14/15 硬约束 |
| `docs/design/architecture.md` | 待修 §2.3 |
| `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` | 操作日志 |

## 8. 修订记录

| 日期 | 修订内容 | 出处 |
|---|---|---|
| 2026-08-03 | 初版（5 文件 → 4 子计划） | user 反馈 2026-08-03 |
