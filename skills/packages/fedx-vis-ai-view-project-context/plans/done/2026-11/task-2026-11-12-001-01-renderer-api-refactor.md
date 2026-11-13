# Task · 2026-11-12-001-01-renderer-api-refactor

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-001-01-renderer-api-refactor` |
| Status | 进行中（待验收②） |
| 类型 | 编码 |
| 影响范围 | `packages/screen-renderer/src/`（index.tsx / renderer.tsx / types.ts / 新增拆分文件）、`docs/skeleton/src/renderer-boot.ts`、`packages/screen-renderer/iife-test/index.html`、`packages/screen-renderer/playground/` |
| Roadmap | MVP · 里程碑 1（渲染链路） · 001 的修正任务 |
| 验收标准 | create API 重构（同步 + setSchema 择机注入）+ FrameShell 删除 + renderer.tsx 拆分，全链路验证通过 |
| 前置依赖 | task-2026-11-12-001（已完成待验收②；其变更记录⑤⑥为本卡输入） |

---

## 目标（Goal）

对 task-001 落地后的渲染器做三处修正：① `create()` API 形态重构（去 fetch / 去 Promise / create 即挂载 + setSchema 择机注入）；② 删除 FrameShell，渲染器视觉归零；③ renderer.tsx 拆分。起因均为用户 review 提出的问题，已记录于 001 变更记录⑤⑥，本卡将其转为可执行任务。

---

## 背景

- **现状注意**：001 变更记录⑤的「schema 对象入参」第一版修改已实际落盘（index.tsx / renderer-boot.ts / iife-test 已改，create 仍包 Promise）。开工前先 `git diff` 确认现状，本卡在其基础上继续 ②③。
- **FrameShell 问题**：渲染器内置的 FrameShell（背景/边框/标题栏）与骨架 section-frame 注释声明的分工冲突——「section-frame 管摆得准挂得稳，视觉壳（标题/边框/皮肤）归 ui-widget-shell 物料」。它皮肤硬编码、与 widget-shell 撞车、存在双壳风险。用户已拍板：**整个删除**。

---

## 步骤（执行计划）

### 步骤 1：`create()` API 重构

- **动作**：
  - `CreateOptions` 改为 `{ container, registry }`（同步返回 `RendererInstance`，去 Promise）
  - create 内即 `createRoot` 挂载，schema 未注入前渲染空态（不派发 scalechange，`getScale()` 返回 1）
  - 实例新增 `setSchema(schema: ScreenSchema)`：注入/替换 schema 并重渲染，setSchema 后重算 scale 并派发初值
  - 实例新增 `load(schemaUrl: string): Promise<void>`（便捷 fetch → setSchema，可选能力）
  - `on('scalechange')` 订阅即回放逻辑保留
- **目标 API**：
  ```ts
  const renderer = ScreenRenderer.create({ container, registry }); // 同步
  renderer.setSchema(schema);
  renderer.load(schemaUrl); // 可选
  renderer.on('scalechange', cb);
  renderer.getScale();
  renderer.destroy();
  ```
- **输出**：`packages/screen-renderer/src/index.tsx` + types.ts（RendererInstance 接口）
- **等待用户**：否

### 步骤 2：FrameShell 删除

- **动作**：删除 renderer.tsx 内的 FrameShell；装配链变为 `SectionFrame（定位兜底）→ 物料裸渲染`；`section.frame` 字段在 types.ts 保留作 002 扩展占位（`shell`/`title`/`extra` 透传给壳物料），渲染器暂不消费；playground 若需观感，mock registry 自放壳物料
- **输出**：renderer.tsx 减层；`docs/skeleton/public/screen.json` 若 frame.title 失效需同步清理
- **等待用户**：否

### 步骤 3：renderer 拆分为目录模块

- **动作**：`renderer.tsx` 拆为 `renderer/` 目录（与 scaler-container / section-frame 等既有目录模块一致的形态）：
  ```text
  src/renderer/
  ├── index.tsx          # SchemaRenderer 顶层（~30 行），对外出口
  ├── use-section-data.ts  # pickValue + useSectionData 数据解析
  └── section-item.tsx   # 单 section 装配（定位壳 + 物料渲染 + props 合并）
  ```
- **输出**：`packages/screen-renderer/src/renderer/` 三文件；index.tsx（包出口）的 import/re-export 路径从 `./renderer` 改 `./renderer/index`（或保持 `./renderer`，目录形式下两者等价，核对即可）
- **等待用户**：否

### 步骤 4：宿主侧同步

- **动作**：`docs/skeleton/src/renderer-boot.ts` 改为「宿主 fetch schema → create → setSchema」（fetch 失败仍回落源码 App）；`iife-test/index.html` 同步；骨架本地 interface 类型声明同步（setSchema/load 签名）
- **输出**：宿主接入代码与渲染器新 API 对齐
- **等待用户**：否

### 步骤 5：验证 + 文档回填

- **动作**：`pnpm build:renderer` + `pnpm check:renderer-isolation` + 根 `pnpm build`；playground / iife-test / 骨架 dev 三层浏览器验证；回填本卡与 001 变更记录（标注已由本卡承接）
- **输出**：验证结论 + 文档回填
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做 `frame.shell` 壳物料的实际接入（归 002，本卡只留 types 占位）
- 不做联动 events/subscribe（归 002）
- 不做真实物料（归 004）
- 不改 scaler-container / section-frame / error-boundary / missing-section（职责不变）

---

## 验收 checklist

- [x] A1：`create()` 同步返回实例，无 Promise；schema 未注入时页面空态无报错，`getScale()` 返回 1
- [x] A2：`setSchema(schema)` 注入后正常渲染；重复 setSchema（换 schema）可重渲染（代码路径支持，iife-test/骨架实测单次注入）
- [x] A3：`load(url)` 便捷加载可用（iife-test 实测）
- [x] A4：FrameShell 已删——`section.frame.title` 不再产生任何视觉，playground/骨架无双层壳
- [x] A5：renderer.tsx 拆分完成，SchemaRenderer 顶层 ≤40 行（实为 ~31 行）
- [x] A6：三层验证通过（playground / iife-test 纯 HTML / 骨架 dev）
- [x] A7：`pnpm build:renderer` / `pnpm check:renderer-isolation` / 根 `pnpm build` 全过
- [x] A8：001 变更记录⑤⑥标注「已由 001-01 承接」

### 验证记录（2026-11-12）

- 构建：`pnpm build:renderer`（6.82 kB IIFE）、`pnpm check:renderer-isolation`、根 `pnpm build` 全过；产物已拷入 `docs/skeleton/public/vendors/screen-renderer/`
- 骨架（:5198）：ScreenRenderer 接管，2 section 渲染、无标题壳、console 无错、`scalechange 0.8698` —— PASS
- playground（:5199）：4 区块（标题/指标卡/条形图/物料缺失占位）正确、无壳、无错 —— PASS
- iife-test：`load(url)` 后渲染 hello 块，`scalechange 1 → 2.0875`、`getScale = 2.0875`，无错 —— PASS
- 附带：playground 与骨架 `screen.json` 已清掉死配置 `frame.title`；`renderer-boot.ts` 回落路径补 `renderer.destroy()`

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（用户指令「执行」） | 2026-11-12 | 用户 |
| ② 实现验收 | 待验收 | — | — |

---

## 关联

> - 来源：`plans/task-2026-11-12-001-mvp-renderer-core.md` 变更记录⑤⑥
> - 后续：002（frame.shell 壳物料机制 / 联动）、004（widget-shell 大规模使用）
