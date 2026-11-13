# Task · 2026-11-12-003-mvp-material-contract

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-003-mvp-material-contract` |
| Status | 已完成（用户验收通过 2026-11-12） |
| 类型 | docs / 编码 |
| 影响范围 | `docs/materials/**/manifest.json`（已用物料加 `runtime`）、`docs/skeleton/src/registry.tsx`（校验对象）、`scripts/check-material-registry.mjs`（新增校验） |
| Roadmap | MVP · 物料契约 |
| 验收标准 | 已用物料具备 `runtime` 契约；registry 键与 manifest 的 `type` 一致，不一致时校验脚本报错 |
| 前置依赖 | task-2026-11-12-001-mvp-renderer-core（registry 已存在） |

---

## 目标（Goal）

给物料补「能被 Schema 引用」的元信息，让 type、props、事件有单一事实来源，避免 registry 与 manifest 两处漂移。

---

## 步骤（执行计划）

### 步骤 1：定契约结构

- **动作**：在 manifest 增加可选块 `runtime{ schemaable, type, propsContract, events[], constraints[] }`；`propsContract` 只描述可配项（类型、默认值、枚举），不重复全套 Props
- **动作**：`constraints` 记录跨 bundle 约束，首批固定两条——① 物料**禁止** import 渲染器的 `ScalerContext`，需要缩放时读保留 prop `__scale`（不要求宿主提供 hook）；② 物料不接收 `sectionEvent` 之外的全局状态
- **输出**：契约字段说明（写入 `design/mvp/schema-runtime.md` 第 5 节）
- **等待用户**：否

### 步骤 2：给已用物料补契约

- **动作**：`echarts-map` / `indicator-view` / `echarts-hor-bar` 三个先补；`events` 记录可派发的事件名与 payload 形状
- **输出**：3 个 `manifest.json`
- **等待用户**：否

### 步骤 3：一致性校验

- **动作**：新增 `scripts/check-material-registry.mjs`：读所有 manifest 汇总 `runtime.type`，与 `docs/skeleton/src/registry.tsx` 的键比对；双向检查——registry 的键必须能在某个 manifest 找到，声明了 `schemaable` 的物料必须已注册
- **注意**：校验脚本放仓库根 `scripts/`，不进骨架（骨架导出后不需要它）
- **输出**：校验脚本 + 故意不一致的失败验证
- **等待用户**：否

### 步骤 4：验证

- **动作**：跑校验脚本；`pnpm build:renderer` + `pnpm build`
- **输出**：验证结论
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做完整的 props 表单元信息（设计器用）
- 不改物料代码与 spec 正文
- 不给全部 45 个物料补契约（只补被 Schema 引用的）

## 验收 checklist

- [x] A1：3 个已用物料含 `runtime` 块，字段齐全（含 `constraints`、`dataContract`、`events[].payload`）
- [x] A2：脚本可双向检出不一致——registry 键 → manifest 为严格报错（负例 `no-such-material` 实测 exit 1）；manifest `schemaable` → registry 当前为告警（用户批准：placeholder 未接 004，先告警不阻断）
- [x] A3：契约层保障——脚本只汇总 `runtime` 块（无 runtime / `schemaable !== true` 不进入 type 列表）；skill 侧推荐规则由 005 消费该字段
- [x] A4：`pnpm build:renderer` 与 `pnpm build` 均通过（另 `pnpm check:material-registry`、`pnpm check:renderer-isolation` 通过）

## 实现记录（2026-11-12）

- 契约结构定稿：`runtime{ schemaable, type, dataContract, propsContract, events[{name,payload,description}], constraints[] }`；`propsContract` 只列 `sections[].props` 白名单，回调不写进 propsContract，`events[].name` 与 `sections[].events[].on` 对齐
- 3 个 manifest 补齐 runtime：`echarts-map`（4 个事件 + 8 个配置项）、`indicator-view`（1 个事件 + 9 个配置项）、`echarts-hor-bar`（0 事件 + 14 个配置项）
- 新增 `scripts/check-material-registry.mjs`：遍历 `docs/materials/**/manifest.json`（跳过 `_templates`）汇总 `runtime.type`；正则解析骨架 `screenRegistry` 顶层键；检查 type 全局唯一、schemaable 必有 constraints、registry 键必须命中 manifest（`placeholder-*` 豁免）、schemaable 未注册告警
- 挂载命令：根 `package.json` 增 `check:material-registry`；同步 `env/AGENTS.md` 质量门槛与根 `AGENTS.md` 常用命令表
- 设计文档：`design/mvp/schema-runtime.md` §4 契约示例与判定规则重写、§3.2 `sections[].events` 行补充 `on` 对齐要求
- 注：骨架注册表实际文件是 `registry.tsx`（卡片原写 `registry.ts`），脚本按实际路径读取

## 技术设计（实现要点）

| 改动 | 文件 | 说明 |
| --- | --- | --- |
| 契约结构 | `docs/materials/<分组>/<模块>/manifest.json` | `runtime.schemaable` 缺省 false，存量物料不受影响 |
| 校验 | `scripts/check-material-registry.mjs` | 读 manifest 汇总 type 列表，与 `docs/skeleton/src/registry.tsx` 源码文本比对；放仓库根，不进骨架 |

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-12 | 用户（「执行下一个task」+ 选择「schemaable 未注册先告警」） |
| ② 实现验收 | 已验收 | 2026-11-12 | 用户（对话「归档，然后执行下一个task」） |

## 关联

> - 前置：`task-2026-11-12-001-mvp-renderer-core.md`
> - 后续：004（新建物料按此契约编写）、005（skill 读取契约）
