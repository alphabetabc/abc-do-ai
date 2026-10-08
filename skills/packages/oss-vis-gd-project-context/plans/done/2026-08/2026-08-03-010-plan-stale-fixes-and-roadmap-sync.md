# Plan-010：修 4 处遗留「本仓库不含视图 / 视图代码在 @fedx-* 包」+ 同步 roadmap

> **日期**：2026-08-03
> **性质**：执行计划（[Plan-005](./2026-08-03-005-plan-web-components-docs.md) 后续收尾）
> **范围**：`docs/index.md` + `docs/design/{glossary,system-overview,framework-communication}.md` + `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`

---

## 0. 背景

plan-008 只修了 `docs/design/architecture.md`（7 处）的事实表述。grep 重新扫描后，还发现 4 处与「视图代码在 `web/`」事实不符的描述：

| 文件 | 行 | 现表述 | 实际事实 |
|---|---|---|---|
| `docs/index.md` | 53 | "本仓库不含视图组件代码" | 视图组件在 `web/pages/` + `web/components/` + `web/hooks/` |
| `docs/design/glossary.md` | 68 | "视图组件由 `@fedx-*` 包运行时外部加载；本仓库不含视图代码" | 同上 |
| `docs/design/system-overview.md` | 18 | "全部由 fedx-ssr external 加载；本仓库不含视图组件代码" | 同上 |
| `docs/design/framework-communication.md` | 167-168 | "视图组件在运行时从 `@fedx-*` 包 / CDN / 静态目录加载" | 同上 |

> ⚠️ 不修「route 表」中的 `fedx-ssr external`：那是 fedx-ssr 渲染模式配置值（与路由器配置等价的枚举值），非事实陈述。例：`docs/design/system-overview.md:167+` 的路由类型列。

## 1. 目标

| 输出 | 内容 |
|---|---|
| 4 处 docs/ 过时表述 | 改为「视图组件在 `web/`、本仓库维护，由 fedx-ssr 编译加载」 |
| `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` | §1 当前阶段 + §2.4 D-D 系列 + §3 操作日志 同步 plan-005 ~ 010 |

## 2. 改动清单

### 2.1 `docs/index.md` 第 53 行

把：

```text
> ⚠️ **视图层由 fedx-ssr external 加载**（`public/static/mock/screen-list.json` 列出 8 个 screen ID）；本仓库不含视图组件代码——spec.md §5 仅描述契约，不描述视图内部实现。
```

改为：

```text
> 📌 **视图层在 `web/`**（`web/pages/` + `web/components/` + `web/hooks/`，本仓库维护），由 fedx-ssr 编译加载（详见 [`docs/design/architecture.md` §2.3](./design/architecture.md)）。8 个 screen ID 见 `public/static/mock/screen-list.json`。
```

### 2.2 `docs/design/glossary.md` 第 68 行

把：

```text
| fedx-ssr external | — | 本项目视图层加载机制——视图组件由 `@fedx-*` 包运行时外部加载；本仓库不含视图代码 |
```

改为：

```text| fedx-ssr external | fedx-ssr | 本项目视图层渲染模式：外部模式由 fedx-ssr 编译加载 `web/` 下的视图；详见 [`docs/design/architecture.md`](./architecture.md) §2.3 |
```

### 2.3 `docs/design/system-overview.md` 第 5 + 18 行

- 顶部状态：把 `> **最后更新**：2026-07-29` 改为 `> **最后更新**：2026-08-03（视图层表述同步）`
- 第 18 行 TL;DR 表：

  ```text
  | 视图层   | **全部由 fedx-ssr external 加载**（`public/static/mock/screen-list.json` 列出 8 个 screen ID；本仓库不含视图组件代码）              |
  ```

  改为：

  ```text
  | 视图层   | 在 `web/pages/` + `web/components/` + `web/hooks/`，由 fedx-ssr 编译加载（`public/static/mock/screen-list.json` 列出 8 个 screen ID；详见 [`docs/design/architecture.md`](./architecture.md) §2.3） |
  ```

### 2.4 `docs/design/framework-communication.md` 第 167-168 行

```text
- 视图层加载：fedx-ssr external（视图组件在运行时从 `@fedx-*` 包 / CDN / 静态目录加载）
```

改为：

```text
- 视图层加载：fedx-ssr external（编译 `web/pages/` + `web/components/` 内的 React 源码；详见 `docs/design/architecture.md` §2.3 + `docs/design/large-screen-engine.md`）
```

**保留** `fedx-ssr external` 词不变（这是 fedx-ssr 的渲染模式枚举值，不是事实陈述）。

### 2.5 `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`

新增 3 处：

**§1 当前阶段**：

在 plan-003 行的下一行追加：

```text
- ✅ plan-005 ~ plan-010（web/components 视图基础设施 → docs/design/）已全部完成（5 计划 + 5 新设计文档 + 1 README/§3 索引 + 1 glossary 修正 + 1 framework-comm 修正 + 1 architecture.md 7 处修正）
```

**§2.4 D-D 系列**（plan-005 ~ 010 沉淀）：

新增 section（在 §2.3 之后）：

```text
### 2.4 D-D 系列（plan-005 ~ 010 web/components 视图基础设施文档化）

| #   | 决策                                                                                                       | 来源                       |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| D-D1 | 5 个 web/components 子目录（data-scheme / initializer / large-screen / socket / ui）落到 `docs/design/`，**不进 `docs/specs/<module>/`**——这些是视图基础设施非业务模块 | user 决策 2026-08-03（plan-005 AskUserQuestion） |
| D-D2 | `web/components/ui/` 颗粒度「API 总册 + 索引」：单文件 `component-library.md` 按 13 分组列子目录路径，不为每个子目录单独写 README | user 决策 2026-08-03（plan-005 AskUserQuestion） |
| D-D3 | 视图层在 `web/pages/` + `web/components/` + `web/hooks/`，由 fedx-ssr **编译加载**（非 external 加载）；替代此前「本仓库不含视图组件代码 / 视图代码在 `@fedx-*` 包」错误表述 | plan-008 §5 architecture.md 修正 + plan-010 §2.1~2.4 后续修正 |
| D-D4 | 大屏引擎 `<LargeScreenEnv>` Provider 树（8 层）落 `docs/design/large-screen-engine.md`（不进 specs/）；与 `docs/skills/five-major-center-interaction-trigger/SKILL.md` 互补（机制 vs 调用） | plan-007 user 决策 |
| D-D5 | 操控端↔屏端 WebSocket 通道（端口 9032 `ws://localhost`）落 `docs/design/realtime-protocol/screen-control-socket.md`；与 BFF↔浏览器通道（`@midwayjs/socketio`）完全独立 | plan-008 §1 设计约定 |
| D-D6 | 即便是「同进程内 WebSocket」，端口 9032 与 BFF `fePort` 不同——保留代码事实（URL `ws://localhost`），不替 PM 拍板「应该走 BFF 端口」 | plan-008 §6 |
| D-D7 | meta-human 模块仅描述「机制」（SDK 加载 / Provider / 3 个全局 trigger）；具体 action 调用示例在 `web/components/large-screen/meta-human/readme.md` 与 `docs/skills/.../SKILL.md`，本计划**不复制** | plan-007 §6 + D-15 |
```

**§3 操作日志**：追加 6 条（plan-005/006/007/008/009/010），每条 ≤ 1 行；plan-005/006/007/008/009 视作「回顾性记录」，plan-010 为新操作。

## 3. 步骤

1. 按 §2.1 改 `docs/index.md`
2. 按 §2.2 改 `docs/design/glossary.md`
3. 按 §2.3 改 `docs/design/system-overview.md`（含顶部状态行）
4. 按 §2.4 改 `docs/design/framework-communication.md`
5. 按 §2.5 改 `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`（§1 / §2.4 / §3）
6. Rule 2/4 验证 + 全局 grep 复查无「本仓库不含视图」残留

## 4. 不做（OUT）

- ❌ 不动 `docs/design/system-overview.md` 第 167-251 行的路由类型列（`fedx-ssr external` 是 fedx-ssr 配置值）
- ❌ 不动 `docs/operations/troubleshooting.md` 第 28 行（`fedx-ssr external 加载超时` 是故障标签，非事实陈述）
- ❌ 不动 `docs/design/framework-communication.md` 第 29 行（是 Web 大节标题之外的同类提及，与外部依赖无关）
- ❌ 不动 `docs-link/README.md` 与 `graph.json`（拓扑快照，非事实陈述）
- ❌ 不动 plan-001/002/003/004 已归档内容

## 5. 验收（DoD）

- [ ] 4 处过时表述已修
- [ ] `grep -rn "本仓库不含视图\|视图代码在 @fedx-" docs/` 无结果
- [ ] roadmap §1 / §2.4 / §3 已更新
- [ ] Rule 2/4 验证通过
- [ ] 不在 docs/ 之外写新文件

## 6. 关联文档

- [Plan-005](./2026-08-03-005-plan-web-components-docs.md) 上游总览
- [Plan-008](./2026-08-03-008-plan-screen-control-socket.md) architecture.md 修正的延续
- `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` §3 操作日志

## 7. 修订记录

| 日期 | 修订内容 | 出处 |
|---|---|---|
| 2026-08-03 | 初版 | user 反馈 2026-08-03（plan-005~010 收尾） |
