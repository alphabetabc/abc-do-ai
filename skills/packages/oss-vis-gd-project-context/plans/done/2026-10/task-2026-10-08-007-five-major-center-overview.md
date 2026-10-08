# Task · 2026-10-08-007-five-major-center-overview

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-10-08-007-five-major-center-overview` |
| Status | 已完成 |
| 类型 | skill（业务模块文档，无业务代码改动） |
| 影响范围 | skill `oss-vis-gd-project-context` 下 `design/modules/five-major-center/`（README.md → 000-overview/README.md，内容扩充） |
| Roadmap | skill 结构治理延续（task-002 后续） |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-10-08-002（目录结构已就位） |

---

## 目标（Goal）

把 five-major-center/README.md 升级为 `000-overview/README.md` 目录形式，作为五大中心模块的**入口描述**：路由与页面入口、三中心定位与结构、share/box 等共享资源、子文档索引（map-geo 及后续新增），读者从这一份即可获得模块全貌。

---

## 步骤（执行计划）

### 步骤 1：源码调研

- **动作**：Read `web/pages/five-major-center/` 顶层结构（各中心入口文件、路由注册处）与 `share/box`；确认三中心实际页面组成（modules/center 之外还有哪些部分）
- **输出**：调研结论（对话中呈现）
- **等待用户**：否

### 步骤 2：建 000-overview 并迁移扩充

- **动作**：
  - 新建 `design/modules/five-major-center/000-overview/README.md`：模块定位与入口（路由）、三中心结构说明、共享资源（share/box、`web/components/ui/` 组件层指引）、子文档索引表（map-geo + 预留扩展位）
  - 删除现 `five-major-center/README.md`（内容并入 000-overview）
- **输出**：`000-overview/README.md`
- **等待用户**：否

### 步骤 3：索引与引用更新

- **动作**：更新 SKILL.md 场景表（五大中心业务模块总览指向 000-overview）；grep 全 skill 对旧 `five-major-center/README.md` 的引用改为新路径（含 map-geo/README.md 中相对链接 `../README.md` → `../000-overview/README.md`）
- **输出**：索引一致、无死链
- **等待用户**：是（硬门槛②，验收后归档）

---

## 不做清单

- 不改任何 `web/` 业务代码
- 不在 overview 里重复 map-geo 细节（链接过去即可）
- 不为三中心各建子文档（本次只建 000-overview 入口）
- **文档纪律（源自 task-003 验收教训，必须遵守）**：
  - 引用方向：业务文档 → 组件文档；overview 引用 map-geo 子文档用相对链接，组件层文档不被反向改写
  - design/ 文档是长期真实源，**不写任务溯源 / 变更记录 / 过程性信息**（这些只进任务卡）
  - README（000-overview）保持入口薄层：定位 + 快速上手 + 文档索引；内容多时拆主题子文档
  - 不与其他模块 / 组件做对比说明，只描述自身
  - 所有 Props / 方法 / 路径写法先读源码核实（反幻觉守则）

---

## 验收 checklist

- [x] A1：`000-overview/README.md` 存在且包含路由/入口、三中心结构、共享资源、子文档索引四个部分
- [x] A2：旧 `five-major-center/README.md` 已删除，全 skill grep 无残留引用、无死链
- [x] A3：子文档索引含 map-geo，并预留后续扩展说明
- [x] 影响架构 / 硬约束的决策已回写 `design/`（design/README.md modules 规则补充 000-overview 入口目录模式）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（纯 docs 改动，N/A）

---

## 变更记录（执行中偏离任务卡的部分）

以下为用户验收过程中追加的需求，超出原任务卡范围：

1. **「五大 vs 三中心」澄清**：000-overview 新增「中心组成」节，明确产品口径五大中心 = 3 个本地实现中心（cmd-dispatcher / information-hub / comprehensive-display）+ 2 个 iframe 嵌入中心（situation-awareness / real-time-dispatcher）；「三中心结构」改名「本地三中心结构」，新增「iframe 两中心（IframePage）」节
2. **iframe-page 单独成文**：新建 `design/modules/five-major-center/000-overview/iframe-page.md`（工作机制 / 新增方式 / 维护准则），overview 该节精简为一句话 + 链接；首次建在 `five-major-center/iframe-page/README.md`，按用户要求迁入 000-overview/ 目录
3. **IframeLoader 组件文档**：新建 `design/components/004-iframe-loader/README.md`（Props / 行为机制 / 外部脚本 extra-scripts/iframe-loader.js 空实现现状 / 维护准则），SKILL.md 场景表追加；iframe-page.md 补交叉引用（引用方向：业务 → 组件）
4. **配置示例**：iframe-page.md 「新增一个 iframe 中心」节追加 environment.json 的 JSON 示例及字段说明（含 `--url` 备注写法、token 占位符）

其他执行事实：

- map-geo/README.md 实际没有 `../README.md` 相对链接（任务卡预期有），无需修改；graph.json 中 `../README.md` 属 docs 树 design/decisions，与本 skill 无关
- 核实事实：`real-time-discovery-center` 有路由但 environment.json 无 iframe-page 配置（页面为空）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 通过（用户指示执行） | 2026-10-08 | 用户 |
| ② 实现验收 | 通过（用户指示归档） | 2026-10-08 | 用户 |

---

## 关联

> - 前置：`task-2026-10-08-002-design-restructure-map-geo`
> - 同系列：`task-2026-10-08-003~006` 文档细化系列
> - 后续：`task-2026-10-08-008-info-management-bureau-doc`（目录组织参照本次 000-overview 结论）
