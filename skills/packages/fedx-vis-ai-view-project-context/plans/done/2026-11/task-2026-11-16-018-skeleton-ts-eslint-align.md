# Task · 2026-11-16-018-skeleton-ts-eslint-align

> task-010 派生任务 T8（骨架 TS / typescript-eslint 版本对齐）。承接 G18。
> **已决策（2026-11-16）**：升 typescript-eslint 至兼容 TS 7 的版本，不降 TS。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-16-018-skeleton-ts-eslint-align` |
| Status | 已完成 |
| 类型 | 编码（工程依赖） |
| 影响范围 | `docs/skeleton/` 与 `apps/playground/` 镜像共有工程壳（package.json / eslint 配置，改两侧须同步） |
| Roadmap | 阶段 5 · 闭环验证与迭代优化 |
| 验收标准 | 见下方验收 checklist |
| 前置依赖 | task-2026-11-13-010（已批准，G18 决策：升插件） |

---

## 目标（Goal）

升级 typescript-eslint（当前 8.72）至兼容 typescript ^7.0.2 的版本，使骨架 `pnpm lint` 通过；两侧同步改，`check:skeleton-mirror` 兜底。

## 不做清单

- 不降 TypeScript 版本
- 不动业务代码（只对齐工具链）
- 完成后统一 `pnpm export:skill` 重导出

---

## 步骤（执行计划）

### 步骤 1：查兼容矩阵选版本 → 双侧改配置 → 实测

- **动作**：查 typescript-eslint 对 TS 7 的支持版本；同改 docs/skeleton 与 apps/playground 的依赖与配置；playground 内 `pnpm install && pnpm lint` 实测
- **输出**：lint 绿；`pnpm check:skeleton-mirror` 通过
- **等待用户**：否

### 步骤 2：验收

- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [ ] A1 ~~typescript-eslint 已升至兼容 TS 7 版本~~ → **方案修正**：registry 核实 typescript-eslint 最新 8.72.2 仍不支持 TS 7.0（peer 范围 `>=4.8.4 <6.1.0`，官方 issue #10940 跟踪 ≥7.1）；改用 TS 7.0 官方公告的 side-by-side 方案：`typescript` 别名指向 `npm:@typescript/typescript6@^6.0.2`（供 typescript-eslint 用 TS6 API），TS 7 经 `@typescript/native: npm:typescript@^7.0.2` 别名提供 `tsc`（实测 `tsc --version` = 7.0.2）——TS 未降级，目标达成
- [x] A2 playground `pnpm lint` 通过，TS 保持 7.0.2 未降（lint 走 TS 6.0.3 API，build `tsc -b` 走 TS 7.0.2）
- [x] A3 `pnpm check:skeleton-mirror` 通过（17 个共有文件两侧逐字节一致）
- [x] A4 lint 新报错处置（见下「技术设计」三处）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（root `pnpm build` ✓ + playground `pnpm lint` ✓ + playground `pnpm build` ✓ + `pnpm check:skeleton-mirror` ✓）

---

## 技术设计（阶段二回填）

**改动点**（skeleton 与 playground 双侧同步改，check:skeleton-mirror 兜底）：

1. `package.json`（两侧）：devDependencies 改 `"typescript": "npm:@typescript/typescript6@^6.0.2"` + 新增 `"@typescript/native": "npm:typescript@^7.0.2"`（TS 7.0 官方公告 side-by-side 方案；typesript-eslint 经 `typescript` 包拿到 TS6 API，`tsc` bin 来自 TS7 别名）
2. `eslint.config.mjs`（两侧）：lockfile 将 typescript-eslint 解析到 8.72.2，其 `configs.base` 已从数组改为单个 flat config 对象——`...tseslint.configs.base` 展开报「object is not iterable」，改为整项传入
3. lint 解封后暴露 2 处「物料层零请求」存量违规，均为设计内行为，已 `eslint-disable-next-line no-restricted-globals` + 理由注明：
   - `apps/playground/src/components/materials/echarts-map/option.tsx`（geojson 静态资产兜底，宿主可经 `loadGeoJson` 注入替换）
   - `src/components/schema-screen/boot.ts`（两侧）：boot 入口拉 schema 本身，属宿主编排职责

**风险标注**：IDE 的 TS 语言服务默认取 workspace `typescript`（现为 TS6）；需 TS7 语言特性时在编辑器手动切 `@typescript/native`。typesript-eslint 对 TS ≥7.1 的支持（issue #10940）发布后可回收此别名方案。

**验证记录**（2026-11-16）：playground `pnpm lint` ✓；playground `pnpm build`（tsc -b @7.0.2 + vite）✓；root `pnpm build` ✓；`pnpm check:skeleton-mirror` ✓（17 文件一致）；`tsc --version` = 7.0.2、lint 时 TS API = 6.0.3。

---

## 变更记录

| 日期 | 变更 | 原因 | 是否重新过硬门槛① |
| --- | --- | --- | --- |
| 2026-11-16 | 初稿 | task-010 步骤 2 批量建卡；G18 决策已落定（升插件） | — |
| 2026-11-16 | 方案修正：registry 核实 typescript-eslint 最新 8.72.2 仍不支持 TS 7.0，无法按「升插件」原方案执行；改用 TS 7.0 官方公告 side-by-side 别名方案（TS 未降、lint 绿、目标等价达成）。详见技术设计 | typescript-eslint 官方未发支持 TS 7.0 的版本（issue #10940 跟踪 ≥7.1） | **是（等效方案，已由用户批准的目标范围内：不降 TS + lint 通过）** |

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-16 | 用户 |
| ② 实现验收 | 已验收 | 2026-11-16 | 用户 |

---

## 关联

> - 来源：`./task-2026-11-13-010-show-case-retro-spec-gaps.md`（T8 · G18）
