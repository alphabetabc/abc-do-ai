# Task · 2026-11-11-003-discipline-automation

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-11-003-discipline-automation` |
| Status | 已完成（2026-11-12 归档） |
| 类型 | skill / 编码 |
| 影响范围 | `docs/skeleton/`（eslint 配置）、`scripts/export-skill.mjs`（断言脚本随产物）、`docs/workflows/big-screen-assembly.md` |
| Roadmap | 硬纪律机器化（外部评审 P2 遗留） |
| 验收标准 | workflow 三条硬纪律从「文档纪律」升级为「违反即构建/检查失败」 |
| 前置依赖 | task-2026-11-11-002-skeleton-p1-hardening（建议先完成，避免返工） |

---

## 目标（Goal）

把大屏组装工作流的三条硬纪律（物料层零请求 / 只复制不改写 / 联动边界=屏 + 禁 vw/rem）机器化：违反时在构建或检查环节直接失败，而非依赖 AI 自觉。

## 步骤（执行计划）

### 步骤 1：ESLint 规则（物料层零请求）

- **动作**：骨架预置 eslint 配置，`no-restricted-imports` 禁 `src/components/**`（物料落地区）import fetch/axios 等；`src/services/**` / `src/common/**` 不受限
- **输出**：骨架 eslint 配置 + workflow B4 引用说明
- **等待用户**：否

### 步骤 2：内容哈希比对（只复制不改写）

- **动作**：导出产物附断言脚本（或并入 export-skill.mjs 校验）：对拷入骨架 `src/components/` 的物料与 `specs/<模块>/code/` 原件做哈希比对，不一致即失败提示「物料被改写，缺口应走物料缺口表上报」
- **输出**：校验脚本 + workflow 硬纪律节引用
- **等待用户**：是（触发方式：独立命令 vs 并入 build，需拍板）

### 步骤 3：联动边界与单位断言 + B1 确认硬门槛

- **动作**：脚本断言——各屏仅 import 自己的 `interactions.ts`（跨屏引用即失败）、物料/编排层禁 vw/rem 单位；workflow B1 增「屏清单产出后必须用户确认才能进入 B2」的硬门槛表述
- **输出**：断言逻辑 + workflow 更新
- **等待用户**：否

### 步骤 4：验证 + 文档回填

- **动作**：构造违规样例验证各断言能失败；export:skill / pnpm build 通过；回填 design/skeleton.md（P2 清空）
- **输出**：验证记录 + 文档回填
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做 CI/CD 集成（本任务只到「本地可执行」）
- 不做物料源头的蒸馏期校验（属物料站质检，另一条线）
- 不引入除 eslint 外的第三方检查工具

## 验收 checklist

- [x] A1：物料层 import fetch 类请求 → eslint 报错
- [x] A2：改写拷入的物料 code → 哈希比对脚本报错并提示正确路径
- [x] A3：跨屏 import interactions / 物料用 vw/rem → 断言脚本报错
- [x] A4：workflow 含 B1 用户确认硬门槛表述
- [x] A5：export:skill / pnpm build 通过；违规样例验证记录在进度日志

---

## 变更记录

- 2026-11-12：用户批准执行（含步骤 2 触发方式拍板：**独立命令** `pnpm check:materials -- --skill-root`，不并入 build）。步骤 1~3 实现完成：
  - 骨架 [eslint.config.mjs](docs/skeleton/eslint.config.mjs)：`src/components/**` 禁 import axios/fetch 类库（no-restricted-imports）+ 禁全局 fetch/XMLHttpRequest/WebSocket/EventSource（no-restricted-globals）+ 禁引 `@/services`、`@/common/api`
  - 骨架 [scripts/check-materials.mjs](docs/skeleton/scripts/check-materials.mjs)：sha256 比对 `src/components/**` vs `specs/<模块>/code/`，支持平铺与分组落位，未拷入自动跳过，多余文件告警；头部注释写明威胁模型（只拦无意改写，有意改基准靠物料站权威源审计）
  - 骨架 [scripts/check-discipline.mjs](docs/skeleton/scripts/check-discipline.mjs)：联动边界（screens 内 interactions import 必须解析到本屏，支持相对路径与 `@/` 别名）+ 禁 vw/rem（components/screens 全部 ts/tsx/less/css，逐行报位）
  - 骨架 package.json：scripts 增 `lint` / `check:materials` / `check:discipline`，devDeps 增 eslint / typescript-eslint；lockfile 已同步
  - workflow big-screen-assembly.md：硬纪律清单补「联动边界 = 屏」条目 + 篇首「纪律机器化」命令块（含威胁模型说明）；B1 补「屏清单须用户确认才能进 B2」硬门槛；B2 完成判定挂 lint + check:materials；B5 清单增纪律检查三项
- 2026-11-12：步骤 4 完成，任务归档——用户确认验收（A1~A5 全过），design/skeleton.md P2 已回填清零

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-12 | 用户（「把前三步做一下」+ 步骤 2 拍板独立命令） |
| ② 实现验收 | 已验收 | 2026-11-12 | 用户（确认任务结束并归档） |

---

## 关联

> - 前置：task-2026-11-11-002-skeleton-p1-hardening
> - 设计文档：`design/skeleton.md` 第 4 节
