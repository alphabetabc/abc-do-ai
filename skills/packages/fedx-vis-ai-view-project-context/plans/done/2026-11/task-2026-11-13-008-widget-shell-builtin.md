# Task · 2026-11-13-008-widget-shell-builtin

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-008-widget-shell-builtin` |
| Status | 已完成（2026-11-13 用户验收通过，归档） |
| 类型 | 编码 / docs |
| 影响范围 | `packages/screen-renderer/**`（SectionLayout 类型 + section-frame 渲染层）、`apps/playground/public/schemas/home.schema.json`（验证用例）、`docs/workflows/schema-mode.md`（契约成文）、防漂移校验脚本 |
| Roadmap | 渲染器能力增强（Schema 模式视觉壳） |
| 验收标准 | schema 的 section 可声明式启用视觉壳（title / extra / 渐变描边等），渲染链 SectionFrame → WidgetShell → 物料；未启用时行为与现状逐字节等价 |
| 前置依赖 | 无硬前置；建议在 task-007（逆蒸馏管道）之后或并行（互不触碰） |

---

## 目标（Goal）

把 `ui-widget-shell` 物料的视觉壳能力内置到渲染器 SectionFrame 层，schema 的每个 section 通过声明式配置获得统一「标题栏 + 内容区」视觉壳——消掉 section 嵌套需求，schema 保持平铺结构。

---

## 背景与动机

- 真实设计稿的大屏分区几乎都带视觉壳（标题栏 / 边框 / 皮肤），但 playground 演示物料各自内置简壳，schema 生态没有统一壳能力
- 两条路线对比后定案：widget-shell 做容器物料（需 schema 平铺 → 树的嵌套改造，伤筋动骨）**否决**；内置渲染器（与 SectionFrame 先例一致——编排壳内置于 IIFE，宿主 src 不持复制件）**采纳**（用户 2026-11-13 拍板方向）
- SectionFrame 管「摆得准 + 挂得稳」，widget-shell 管「好看」——两层本就同点渲染，合并进 IIFE 是自然收敛

---

## 功能列表

- F1 **Schema 契约扩展**：`SectionLayout` 新增可选 `title?: string` 与 `shell?: { enabled?, extra?, borderGradient?, borderGradientDirection?, titleBanner? }`；`shell` 未传或 `enabled: false` 或 `title` 未传时壳隐藏、内容撑满（与 WidgetShell 现有 `showTitle` 语义对齐）
- F2 **渲染器内置**：`packages/screen-renderer` 内置 WidgetShell 实现（结构 + `--ws-*` CSS 变量主题化原样保留），SectionFrame 渲染层变为 `SectionFrame → WidgetShell（可选）→ 物料`；IIFE 产物同步 skeleton / playground vendors
- F3 **防漂移**：渲染器内置实现与物料站 `docs/materials/components/ui/ui-widget-shell/code/` 的实现建立一致性保障（方案二选一，见开放问题 1）
- F4 **契约成文**：`docs/workflows/schema-mode.md` 补 section 壳字段说明 + 换肤指引（`--ws-*` 变量在宿主侧注入方式）
- F5 **验证用例**：playground home.schema.json 至少 2 个 section 启用壳（1 个含 title + borderGradient，1 个纯 title），1 个保持无壳作对照

---

## 不做清单

- **不做 section 嵌套**（schema 保持平铺；容器型组合留待未来真实需求再评估）
- 不改物料站 `ui-widget-shell` 物料的工程代码模式用法（宿主不走渲染器时仍用物料拷贝；物料保留）
- 不做壳的皮肤预设库（只保 CSS 变量入口，皮肤由宿主覆盖）
- 不做 per-section 换肤的 schema 字段（换肤走宿主 CSS 变量，不进契约）

---

## 步骤（执行计划）

### 步骤 1：方案评审（硬门槛①）

- **动作**：确认 F1 字段设计（尤其 `title` 放 section 顶层还是 shell 内）、F3 防漂移方案选型（开放问题 1）、不做清单
- **输出**：批准结论
- **等待用户**：是

### 步骤 2：渲染器实现（F1 + F2 + F3）

- **动作**：SectionLayout 扩展 → renderer 内置 WidgetShell → `pnpm build:renderer` 同步两处 vendors → 防漂移保障落地
- **输出**：渲染器新版本 + 产物同步
- **等待用户**：否

### 步骤 3：文档与验证（F4 + F5）

- **动作**：schema-mode.md 契约成文；playground schema 加验证 section；浏览器实测（壳显示 / 隐藏 / 渐变描边 / 对照组行为不变）
- **输出**：文档 + 演示验证截图结论
- **等待用户**：否

### 步骤 4：验收（硬门槛②）

- **动作**：跑全部门槛命令 + export:skill 抽查 schema-mode.md 为新版
- **输出**：验收结论 + 归档
- **等待用户**：是

---

## 开放问题

| # | 问题 | 负责人 | 状态 | 结论 |
| - | ---- | ------ | ---- | ---- |
| 1 | F3 防漂移方案：(a) renderer 源码直接 import 物料站 code/（构建期收敛，需处理包依赖边界，注意 check:renderer-isolation 禁 import 骨架但物料站不在禁区）vs (b) 双份实现 + 哈希 mirror 校验（同 check:skeleton-mirror 思路） | AI 提方案 / 用户拍板 | 开放 |  |
| 2 | `title` 放 section 顶层（快捷）还是收进 `shell`（内聚）——倾向顶层（高频字段，类似 layout 的 x/y/w/h） | 用户 | 开放 |  |

---

## 验收 checklist

- [x] A1：启用壳的 section 渲染出标题栏 + 视觉壳，`extra` / `borderGradient` 生效（hor-bar 卡片：标题「事件类型分布」+ extra「单位：件」+ SVG 渐变描边 + 半透明背景，浏览器实测截图确认）
- [x] A2：未启用壳 / 未传 title 的 section 与改动前渲染逐像素一致（对照组：`document.querySelectorAll('.sr-widget-shell').length === 2`，其余 section 无壳包裹，DOM 结构不变——壳在 SectionFrame 内层 children 外包裹，未启用时直接透传 children）
- [x] A3：`--ws-*` 变量在宿主侧覆盖可换肤（机制已实现：CSS 变量定义在 `.sr-widget-shell` 类上，宿主覆盖即可；playground 演示覆盖经验收不补）
- [x] A4：`pnpm check:renderer-isolation` / `check:skeleton-mirror` / `check:material-registry` 通过（export:skill 后复跑确认）
- [x] A5：`pnpm export:skill` 产物中 schema-mode.md 含壳契约（dist-skill 内 10 处视觉壳相关内容命中）
- [x] A6：~~F3 防漂移校验~~ 按 D1 决策取消（渲染器自有实现，不建 mirror）
- [x] `env/AGENTS.md` 声明的质量门槛命令已通过（renderer 隔离 / skeleton 镜像 / 物料注册表三项 + `pnpm build:renderer` 全过）

## 进度日志

- 2026-11-13 门槛①通过（D1/D2/D3 拍板）
- 2026-11-13 实现完成：
  - `packages/screen-renderer/src/types.ts`：`SectionLayout` 新增 `title` / `shell`（`SectionShellDecl`）；移除未被消费的 `frame?: SectionFrameDecl` 占位（其注释本就预告「扩展为 shell/title」，本次契约落地后由 `layout.title/shell` 取代；`SectionFrameDecl` 类型及导出一并删除）
  - `packages/screen-renderer/src/widget-shell/index.tsx`（新增）：渲染器自有 WidgetShell——类名 `sr-widget-shell` 前缀（避免与物料版类名互踩），`--ws-*` 变量体系保留；CSS 经 `<style>` 幂等注入 document.head（IIFE 无独立 css 文件）；横幅预设图为渲染器内置 data URI SVG（normal/long/max 三档）；`url()` 双引号坑沿用物料版经验
  - `packages/screen-renderer/src/section-frame/index.tsx`：新增可选 `shellConfig` prop，启用时 `SectionFrame → WidgetShell → 物料`，未启用时 DOM 与现状一致
  - `packages/screen-renderer/src/renderer/section-item.tsx`：从 `layout.title/shell` 计算启用条件（任一存在且 `enabled !== false`）传入 SectionFrame
  - `packages/screen-renderer/iife-test/iife.schema.json`：`frame` 用法迁移为 `layout.title + shell.borderGradient`
  - `docs/workflows/schema-mode.md`：字段表补 `layout.title` / `layout.shell`，新增「section 视觉壳」小节（字段表 + 启用条件 + `--ws-*` 换肤指引），示例 JSON 同步
  - `apps/playground/public/schemas/home.schema.json`：hor-bar 加 title + extra + borderGradient、table 加纯 title，其余 section 无壳对照
- 2026-11-13 浏览器实测 PASS（详见 A1/A2 证据）；export:skill 产物抽查 PASS；待用户门槛②验收

---

## 技术设计（2026-11-13 门槛①拍板后细化）

### 已拍板决策

| # | 决策 | 用户结论 |
| --- | --- | --- |
| D1 | 防漂移：**不做同步机制**。renderer 内置的 WidgetShell 是渲染器自有实现（从内置起属于渲染器）；物料站 `ui-widget-shell` 保留原样供工程代码模式使用，两者各自独立演进，不建 mirror 校验 |
| D2 | `title` 放 **section 顶层**（与 x/y/w/h 同级的高频字段）；`shell` 对象只收视觉配置 |
| D3 | 物料自带壳时（如物料组件内置了标题栏），schema 中配置关闭内置壳（不传 title / 不传 shell 即不启用），物料自渲染 |

### 改动点清单（依赖顺序）

1. **类型**（`packages/screen-renderer/src/types.ts`）：`SectionLayout` 新增：
   - `title?: string`（顶层，快捷高频）
   - `shell?: { enabled?: boolean; extra?: string; borderGradient?: boolean | string[]; borderGradientDirection?: 'tl-br' | 'tr-bl' | 'bl-tr' | 'br-tl'; titleBanner?: 'normal' | 'long' | 'max' | string | false }`
   - 壳启用条件：`title` 或 `shell` 任一存在即启用（`shell.enabled === false` 显式关闭——物料自带壳场景 D3）
2. **渲染器**（`packages/screen-renderer/src/section-frame/` 或同层新建 `widget-shell/`）：
   - 参考 `docs/materials/components/ui/ui-widget-shell/code/WidgetShell.tsx + WidgetShell.css` 的结构与 `--ws-*` 变量体系**重写为渲染器自有实现**（参考语义，非拷贝依赖——D1 决策两份独立）
   - SectionFrame 渲染层变为：定位壳 → （启用时）WidgetShell 包裹 → 物料组件；不启用时渲染输出与现状 DOM 结构一致（对照组验收 A2）
   - 注意 WidgetShell.css 中 titleBanner 的 `url()` 必须带双引号（Vite data URI 转义坑，见物料 spec.md 交互行为节）
3. **构建同步**：`pnpm build:renderer` → 产物自动同步 skeleton + playground 两处 vendors
4. **文档**（`docs/workflows/schema-mode.md`）：canvas 字段表后补 section 级 `title` / `shell` 字段说明 + 壳关闭时机（物料自带壳）+ `--ws-*` 换肤指引（宿主 CSS 变量覆盖）
5. **验证用例**（`apps/playground/public/schemas/home.schema.json`）：2 个 section 启用壳（1 个 title + borderGradient，1 个纯 title），其余保持无壳作对照
6. **验证命令链**：`pnpm build:renderer` → `pnpm check:renderer-isolation` → `pnpm check:skeleton-mirror` → `pnpm check:material-registry` → playground `pnpm dev` 浏览器实测 → `pnpm export:skill` 抽查 schema-mode.md

### 风险标注

- WidgetShell 实现进 IIFE 后包体积略增（纯 CSS + 少量 TSX，预期 < 5KB）
- schema 契约新增字段为可选，旧 schema 零影响（向后兼容）
- 不改物料站 ui-widget-shell 任何文件（D1）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（D1 不做防漂移同步 / D2 title 顶层 / D3 物料自带壳时可关内置壳） | 2026-11-13 | 用户 |
| ② 实现验收 | 已验收通过（A1~A5 自验通过；A6 按 D1 决策取消；A3 换肤机制成立，playground 演示覆盖不补） | 2026-11-13 | 用户 |

---

## 引用一致性（归档前必走）

- [x] `current-sprint.md` —— 移除该任务索引行
- [x] `roadmap.md` —— 无渲染器能力条目（阶段 1~5 均为蒸馏主线），不适用
- [x] `env/AGENTS.md` —— 未新增门槛命令，无需更新

---

## 关联

> - 相关物料：docs/materials/components/ui/ui-widget-shell/（spec.md 的 Props 表是字段设计的事实来源）
> - 相关约定：AGENTS.md「packages/screen-renderer 编排壳内置于 IIFE bundle」；big-screen-assembly.md L150 的两层分工表述
