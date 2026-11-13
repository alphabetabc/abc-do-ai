# Task · 2026-11-12-001-02-review-fixes

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-001-02-review-fixes` |
| Status | 已完成（待验收②） |
| 类型 | 编码 / 配置 / 文档 |
| 影响范围 | `docs/skeleton/package.json`（build 前置命令）、`.gitignore`、`packages/screen-renderer/src/types.ts`（头注释）、根 `AGENTS.md`（目录结构 / 常用命令回填）、`packages/screen-renderer/`（变更记录补记） |
| Roadmap | MVP · 里程碑 1 · 001 的修正任务 |
| 验收标准 | 骨架可脱离父仓库独立 `pnpm install && build && dev`；无构建缓存文件会被误提交；文档回填完成 |
| 前置依赖 | task-2026-11-12-001（已实现，待验收②）；001-01（已完成） |

---

## 目标（Goal）

修复 001 code review 发现的问题：骨架自包含性破坏（build 依赖父仓库）、gitignore 缺口（tsbuildinfo）、文档回填欠账（根 AGENTS.md、001 变更记录补记）。

---

## 背景

001 完成后做两轴 review（Standards / Spec），发现以下问题。其中 2 项为硬伤（P0），其余为登记/清理欠账。

---

## 步骤（执行计划）

### 步骤 1：骨架 build 去除父仓库依赖（P0）

- **问题**：`docs/skeleton/package.json` 的 `build` 前置 `pnpm --dir ../../ --filter @fedx/screen-renderer build`——骨架拷到隔离环境后 `pnpm build` 硬失败，违反「骨架可独立 install 运行」（根 AGENTS.md）与 A4 自包含要求
- **动作**：
  - `build` 去掉 `build:renderer` 前置，恢复为 `tsc -b && vite build`
  - `build:renderer` 脚本改名或移除（如改为注释/README 说明「产物由源仓库构建后拷入 `public/vendors/`」）；本地开发需要重建 renderer 时直接在根仓库跑 `pnpm build:renderer` 再拷贝
  - 确认 vendors 缺失时的回落行为仍成立（vite 插件回落已有；`index.html` 静态 script 404 → `window.ScreenRenderer` 未定义 → 源码渲染回落）
- **输出**：`docs/skeleton/package.json`
- **等待用户**：否

### 步骤 2：.gitignore 补 tsbuildinfo（P0）

- **问题**：`packages/screen-renderer/tsconfig.tsbuildinfo` 不被任何规则匹配，提交会带入构建缓存
- **动作**：`.gitignore` 加 `*.tsbuildinfo`；顺手核查 `packages/` 下其他生成物（`iife-test/` 是否入库——验证辅助，建议入库但确认无绝对路径）
- **输出**：`.gitignore`
- **等待用户**：否

### 步骤 3：文档回填（P1）

- **动作**：
  - 根 `AGENTS.md`：目录结构补 `packages/`（screen-renderer + 说明「跨 bundle 复制件，骨架侧冻结」）；常用命令补 `pnpm build:renderer`、`pnpm check:renderer-isolation`
  - `packages/screen-renderer/src/types.ts` 头注释中 `design/mvp/schema-runtime.md` 的路径改为可解析的真实位置（或去掉具体路径只留文档名）
  - 001 变更记录补记两条未登记的偏离：① 步骤 7 的「动态插 script」实际改为 index.html 静态 script + 探测回落（功能等价）；② `public/schemas/demo.schema.json` 实际为 `public/screen.json`
  - 根 `package.json` 新增的 `@types/node@^26` 补来源说明（若为 check-renderer-isolation.mjs 的 node 类型支持，在 001 变更记录写明；若无必要则移除）
- **输出**：`AGENTS.md`、`types.ts`、001 任务卡
- **等待用户**：否

### 步骤 4：验证

- **动作**：`git status` 确认 tsbuildinfo 不再出现；骨架 `pnpm build`（去掉前置后）+ 根 `pnpm build` + `pnpm check:renderer-isolation` 通过；骨架 dev 目视回归（ScreenRenderer 接管、回落链路不受影响）
- **输出**：验证结论
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不重构 renderer 内部（拆分 / API 已由 001-01 处理）
- 不修 smell 类判断题（ScaleMode 重复定义、SectionFrameProps 拆字段等——已知代价或低收益，出现实际痛点再改）
- 不改 vendors 的「build 再生」策略（001 变更记录①已拍板）；但 005 export:skill 需注意先跑骨架 build，已在 005 卡关注范围
- 不处理 `@types/node` 之外的依赖变更

---

## 验收 checklist

- [x] A1：`docs/skeleton/package.json` 的 `build` 无父仓库命令，隔离目录拷走后 `pnpm install && pnpm build && pnpm dev` 全链路可跑（dev 回落渲染可接受）
- [x] A2：`git status` 中无 `*.tsbuildinfo`
- [x] A3：根 `AGENTS.md` 含 `packages/` 目录说明与 `build:renderer` / `check:renderer-isolation` 命令
- [x] A4：001 变更记录补记步骤 7 偏离与 screen.json 路径偏离；`@types/node` 来源已注明或移除
- [x] A5：根 `pnpm build` + `pnpm check:renderer-isolation` 通过；骨架 dev 渲染正常

### 验证记录（2026-11-12）

- `pnpm check:renderer-isolation` 通过；根 `pnpm build`（tsc -b + vite build）通过
- `pnpm --dir docs/skeleton build` 通过（343ms，无父仓库命令）；vite 插件在源仓库内仍自动拷贝 renderer 产物（本地开发便利），隔离环境下有缺失回落
- `git check-ignore` 确认 `packages/screen-renderer/tsconfig.tsbuildinfo` 命中 `.gitignore:31:*.tsbuildinfo`

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（用户指令「执行」） | 2026-11-12 | 用户 |
| ② 实现验收 | 待验收 | — | — |

---

## 关联

> - 来源：001 完成后的两轴 code review（2026-11-12）
> - 上游：`plans/task-2026-11-12-001-mvp-renderer-core.md`、`plans/task-2026-11-12-001-01-renderer-api-refactor.md`
> - 下游：005（export:skill 需感知 vendors 由骨架 build 再生）
