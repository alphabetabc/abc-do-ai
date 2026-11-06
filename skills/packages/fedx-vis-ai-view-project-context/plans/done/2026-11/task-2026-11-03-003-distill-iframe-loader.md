# Task · 2026-11-03-003-distill-iframe-loader

> 首个蒸馏试点：`web/components/ui/iframe-loader` → `docs/materials/components/ui/ui-iframe-loader/` 四件套，产出后用户验收样板。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-03-003-distill-iframe-loader` |
| Status | 已完成 |
| 类型 | docs + code |
| 影响范围 | `docs/materials/components/ui/ui-iframe-loader/`（新增模块）、`current-sprint.md` |
| Roadmap | 阶段 4（分模块文档化与代码蒸馏）首个试点 |
| 验收标准 | 四件套齐全（manifest/spec/data-model/code/examples）、example 可运行、源码无外部项目依赖 |
| 前置依赖 | `task-2026-11-03-002`（台账，进行中；用户认领台账第二部分，本卡并行） |

---

## 目标（Goal）

把源项目 `web/components/ui/iframe-loader` 蒸馏为自包含物料模块，作为团队后续批量蒸馏的**样板**。

## 源组件分析结论（蒸馏依据）

- **核心能力**：url 模板 token 替换（`access_token`/`sso_token`）+ 外部脚本桥（`window['__iframe-loader-script__']` 动态加载、轮询等待、可取消）+ 居中 iframe 布局
- **蒸馏剥离**：`@fedx-web-common/react-hooks`（useRequest）、`~/web/services/request`、`~/web/common/constants`（STATIC_PATH）、`classnames`、`FedxDataStatus` —— 全部换为内置实现/props 注入
- **保留语义**：url 变化重新加载并取消前次请求、脚本加载失败回退直通、iframe onLoad/onError 桥接
- **发现问题**：源码 `onBackClick` prop 声明但从未使用 → 蒸馏版不保留，spec 中记录

## 不做清单

- 不蒸馏 `data-status`（独立台账条目，另行任务）
- 不改动源项目代码
- 不实现多 example（首版 1 个 basic）

## 步骤

1. ✅ 源码分析（见上）
2. 产出四件套：manifest.json / spec.md / data-model.md / code/IframeLoader.tsx / examples/basic.tsx
3. 用户验收样板（硬门槛②）

## 验收 checklist

- [x] A1：四件套 + manifest 齐全，字段符合 AGENTS.md 物料规范
- [x] A2：`code/IframeLoader.tsx` 无任何 `~/`、`@fedx-*` 依赖，可直接 import 运行
- [x] A3：example 自带 mock，无外部服务依赖
- [x] A4：用户验收通过（样板定稿，作为后续蒸馏参照）

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-03 | 用户（指定 iframe-loader 试点） |
| ② 实现验收 | 已通过 | 2026-11-03 | 用户（迭代后验收：拆分 code/、修复 waitForFn 类型与语义 bug、站点 tab 渲染/返回/URL 参数、分类改为 embed） |

## 关联

> - 台账：`./task-2026-11-03-002-component-inventory.md`
> - 源码：`web/components/ui/iframe-loader/index.tsx`（oss-visual-gd-emergency-support）
