# Task · 2026-11-12-001-mvp-renderer-core

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-001-mvp-renderer-core` |
| Status | 已完成（待用户验收②） |
| 类型 | 编码 |
| 影响范围 | `packages/screen-renderer/`（新增包：源码 + playground + 构建配置）、`pnpm-workspace.yaml`（新增）、根 `package.json`（加 `build:renderer`）、`docs/skeleton/src/main.tsx`、`docs/skeleton/src/registry.ts`（新增）、`docs/skeleton/public/vendors/`、`docs/skeleton/public/schemas/` |
| Roadmap | MVP · 里程碑 1（渲染链路） |
| 验收标准 | ① 包内 playground 按 Schema 渲染 3 个 mock 组件，未注册 type 显示占位块；② 骨架通过 `<script>` 加载 IIFE 产物并渲染出 1 个 section |
| 前置依赖 | 无 |

---

## 目标（Goal）

整体链路（本卡落实第 1、2 条）：

1. **渲染器产出 SDK** —— `packages/screen-renderer` 构建为 IIFE，全局 `ScreenRenderer`
2. **骨架使用 SDK** —— 骨架只提供 `registry` + `schemaUrl`
3. **skill 让 AI 完成 schema 或物料开发** —— 归 004 / 005
4. **导出随带产物** —— `export:skill` 把 dist 拷进 `skeleton/public/vendors/`，归 005

本卡范围：把渲染器做成独立包并在包内完成开发与验证，骨架只做一次 script 加载的最小集成验证，不承载渲染器逻辑。

---

## 步骤（执行计划）

### 步骤 1：工作区与包骨架

- **动作**：根加 `pnpm-workspace.yaml`（只含 `packages/*`，**不含** `docs/skeleton`）；建 `packages/screen-renderer/` 的 `package.json`（`@fedx/screen-renderer`，private）、`tsconfig.json`（`"jsx": "react"` classic runtime）、`vite.config.ts`（dev 跑 playground，build 走 library mode）、`index.html`、`playground/`
- **输出**：包骨架可 `pnpm dev` 起来
- **等待用户**：否

### 步骤 2：Schema 类型

- **动作**：定义 `ScreenSchema`：`canvas{width,height,mode}`、`sections[]{id,type,layout{x,y,w,h,zIndex},props,data,events,subscribe}`、`interactions{fields[]}`。`events` / `subscribe` 只留类型，逻辑归 002
- **输出**：`packages/screen-renderer/src/types.ts`
- **等待用户**：否

### 步骤 3：包内基础设施（从骨架复制，不删除原件）

- **动作**：把骨架的 `scaler-container`（含 `utils.ts` / `context.ts` / `overlay-context.ts`）、`section-frame`、`error-boundary` 原样复制进包内，只改 import 路径；`scaler-container` 增加 `onScaleChange?: (scale: number) => void`，挂在现有的抖动静默判定之后（只在真实变化时触发）；新增 `MissingSection`（灰块 + 缺失类型名）
- **输出**：`packages/screen-renderer/src/{scaler-container,section-frame,error-boundary,missing-section}`
- **注意**：这三份在骨架中**保留不动**，供路径 A（复制二开）手写编排使用。接受这份百行级重复——跨 bundle 无法共享组件实例
- **硬规则**：**包内为准，骨架侧冻结**。骨架里的三份只服务路径 A，不再增强；修 bug 只改包内。否则以后必然修一处漏一处
- **等待用户**：否

### 步骤 4：Renderer 与出口

- **动作**：`SchemaRenderer` 遍历 sections → 查 registry → 套 SectionFrame → 合并 `data` + `props`；`canvas` 映射到 `ScalerContainer` 的 `designWidth` / `designHeight` / `mode`；`create({ container, registry, schemaUrl })` 作为 IIFE 全局出口（**入参统一为 `schemaUrl`，内部 fetch**），返回实例，暴露 `on(event, cb)` / `off` / `getScale()` / `destroy()`；事件仅 `scalechange`（`sectionEvent` 归 002）；`create` 时先同步派发一次当前 scale 再渲染 children；每个物料额外收到保留 prop `__scale`
- **输出**：`packages/screen-renderer/src/{renderer,registry,index}`
- **等待用户**：否

### 步骤 5：playground 验证

- **动作**：3 个 mock 组件（纯 div，不依赖 echarts）+ 一份三栏 schema + 1 个未注册 type；`pnpm dev` 目视确认缩放、定位、占位块
- **输出**：`packages/screen-renderer/playground/`
- **等待用户**：否

### 步骤 6：构建 IIFE 产物

- **动作**：library mode，`formats: ['iife']`，`name: 'ScreenRenderer'`；`external: react / react-dom / react-dom/client`，`globals` 必须写**两条**——`'react': 'React'`、`'react-dom': 'ReactDOM'`、`'react-dom/client': 'ReactDOM'`（`react-dom/client` 是独立 specifier，漏映射会导致 `createRoot` 为 undefined）；产出 `dist/screen-renderer.js` + `dist/index.d.ts`；根 `package.json` 加 `build:renderer`
- **输出**：可被 `<script>` 加载的产物
- **等待用户**：否

### 步骤 7：骨架最小接入

- **动作**：产物拷到 `docs/skeleton/public/vendors/screen-renderer/`；`main.tsx` 按「挂全局 React（`window.ReactDOM = { ...ReactDOM, createRoot }`，ESM 默认导出不含 `createRoot`）→ 动态插 script → 调 `ScreenRenderer.create({ container, registry, schemaUrl })`」改写；新增 `docs/skeleton/src/registry.ts`（3 个 mock 组件映射 + 类型导出，供 002/004 扩展）；`public/schemas/demo.schema.json` 放 1 个 mock section；骨架 `tsconfig` 指向 vendors 的 d.ts
- **注意**：`public/vendors/` 必须被 git 跟踪（骨架要整包拷走），检查 `.gitignore` 未误伤
- **输出**：骨架启动即由 renderer 渲染
- **等待用户**：否

### 步骤 8：验证

- **动作**：`pnpm build:renderer` + 包内 `pnpm build`；骨架 `pnpm dev` 目视确认；根 `pnpm build` 不受影响
- **输出**：验证结论
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不做联动（归 002）
- 不做物料 `runtime` 契约（归 003）
- 不引入真实物料与 7 组件（归 004/002）
- 不做导出时拷贝 vendors（归 005）
- 不保留骨架多屏路由（单屏启动，路由代码留存不动）
- 不把 renderer 源码放进骨架
- 不接骨架 `common/api` 的 service 体系（取数只做 `inline` / `url`）

## 验收 checklist

- [x] A1：包内 playground 按 Schema 渲染 3 个 mock 组件，坐标与缩放正确（浏览器实测 scale=1.3046875，三栏定位正确）
- [x] A2：未注册 type 渲染「物料缺失：<type>」占位块，其余 section 不受影响（浏览器实测 mock-not-registered 占位正常）
- [x] A3：`dist/screen-renderer.js` 可在纯 HTML 里 `<script>` 加载并渲染（`packages/screen-renderer/iife-test/` 实测 getScale=2.0875，无控制台错误）
- [x] A4：骨架 `main.tsx` 通过 script 加载产物，渲染出 mock section（`docs/skeleton` dev 实测「Schema 驱动渲染 · 骨架已接管」+ 指标概览面板）
- [x] A5：renderer 包内零 import 骨架代码（`pnpm check:renderer-isolation` 通过）
- [x] A6：根 `pnpm build` 与 `pnpm build:renderer` 均通过
- [x] A7（改判）：`skeleton/public/vendors/` 纳入 `.gitignore`——由 `docs/skeleton` 的 `build`（buildStart 拷贝）与 005 的 `export:skill` 再生，不手工维护产物入库（见变更记录 ①）
- [x] A8：零骨架依赖有脚本兜底：`pnpm check:renderer-isolation`（已挂根 package.json，并登记 `.trae/AGENTS.md` 质量门槛）

## 实现记录（2026-11-12）

- 新增 `pnpm-workspace.yaml`（仅 `packages/*`）+ `packages/screen-renderer/`（源码 / playground / iife-test / 双 tsconfig / vite lib 构建）
- `src/types.ts`：`ScreenSchema` 全量类型（events/subscribe 仅类型占位，归 002）
- 基础设施从骨架**复制**进包（scaler-container / section-frame / error-boundary），import 改包内相对路径；`ScalerContainer` 增加 `onScaleChange`（挂在抖动静默判定后）与 `initialScale`；新增 `MissingSection`
- `src/renderer.tsx`：SchemaRenderer 遍历 sections → registry 查组件（缺料 → MissingSection）→ SectionFrame（含内置极简标题壳）→ props 合并下发；data 支持 `inline` / `url+pick`
- `src/index.tsx`：`create({container, registry, schemaUrl})` IIFE 出口，`on/off/getScale/destroy`；create 同步计算初值 scale 并先派发；`on('scalechange')` 订阅时立即回放当前值
- 构建关键点（踩坑回填）：
  - **去掉 @vitejs/plugin-react**：其 babel 默认 automatic runtime 会把 `react/jsx-runtime`（含 `require("react")`）打进 IIFE，浏览器不可执行；classic transform 交给 esbuild（`esbuild: { jsx: 'transform' }`），另 `define process.env.NODE_ENV`
  - **vite build 会清空 outDir**：d.ts 生成须放在 vite build 之后（`tsc -p tsconfig.declarations.json`）
  - **IIFE 不支持混合导出**：去掉 default export，只具名导出 `create`
- 骨架接入：`src/registry.tsx`（2 个占位物料，002/004 扩展）、`src/renderer-boot.ts`（探测 `window.ScreenRenderer`，失败回落源码 App 并移除空 `#screen-root`）、`main.tsx` 改造、`index.html` 加 UMD React/ReactDOM + IIFE script、`public/screen.json` 示例 schema；vite 增加 `copy-renderer-vendor` 插件（build 时拷 IIFE + react UMD 进 `public/vendors/`）
- **骨架 vite alias 修复（踩坑回填）**：rolldown-vite 的 dev 端对 `@/common/*` 字符串通配与前缀匹配均不生效（build 正常），改为正则形式 alias 后 dev/build 一致可用——此修复独立于渲染器任务，属顺手修复骨架 dev 断裂
- 验证链：playground（mock×3 + 缺料占位）→ iife-test（纯 HTML + CDN React 全局）→ 骨架 dev（UMD + IIFE + registry）全通；`pnpm build` / `pnpm build:renderer` / 骨架 `pnpm build` / `pnpm check:renderer-isolation` 全过

## 变更记录

1. **2026-11-12**：`skeleton/public/vendors/` 改为 gitignore（原卡要求 git 跟踪）。原因：产物可再生（骨架 `build` 时 buildStart 自动从 `packages/screen-renderer/dist` 拷贝；005 的 `export:skill` 会在导出时同样拷入），手工跟踪二进制产物易与源漂移。与仓库「dist/ 不入库」约定一致。
2. **2026-11-12**：骨架 registry 落地为 `registry.tsx`（含 JSX）而非 `registry.ts`；当前 2 个占位物料而非「3 个 mock（布局壳+2 示例）」——视觉壳由 Renderer 内置极简标题栏承担，占位物料在 002/004 由真实物料替换。
3. **2026-11-12**：骨架 tsconfig 不指向 vendors d.ts；`renderer-boot.ts` 内以本地 interface 声明 `window.ScreenRenderer` 类型（产物 d.ts 在 `packages/screen-renderer/dist/index.d.ts`，跨树引用易碎，本地声明即可满足类型安全）。
4. **2026-11-12**：data 合并规则补约定——`pick` 结果为纯对象时展开合并进 props，数组/原始值作为 prop `data` 下发（实测数组 spread 会产生数字键，属设计缺口）。
5. **2026-11-12（用户提出，待后续窗口处理）→ 已由 001-01 承接（2026-11-12 落地）**：`create()` 的 API 形态重构，三点：
   - ① `create()` 不做 fetch——入参 `schemaUrl`（内部 fetch）改为宿主传 `schema` 对象。理由：宿主 schema 接口可能带鉴权/headers；宿主可能已持有 schema（Hermes 生成 / URL 动态拼装），再 fetch 重复；纯对象入参更可测试。
   - ② `create()` 去掉 Promise——fetch 移出后内部已无异步，同步返回实例，不存在「实例未就绪」窗口期。
   - ③ `create()` 即完成 `createRoot` 挂载，schema 择机注入：`renderer.setSchema(schema)`（核心）/ `renderer.load(schemaUrl)`（便捷 fetch，可选）。收益：首屏即挂载不空白；schema 可替换/刷新（002 联动需要）；create 管挂载、setSchema 管内容，职责单一。目标 API：
     ```ts
     const renderer = ScreenRenderer.create({ container, registry }); // 同步
     renderer.setSchema(schema);
     renderer.load(schemaUrl); // 可选
     renderer.on('scalechange', cb); renderer.destroy();
     ```
     实现注意：schema 未注入前 root 渲染空态（不派发 scalechange，getScale() 返回 1）；setSchema 后重算 scale 并派发初值；「订阅即回放」逻辑保留。
   - **状态说明**：用户提出「先不改代码、记录问题回头换窗口处理」。但在此之前，① 的第一版修改已实际落盘（index.tsx / renderer-boot.ts / iife-test/index.html 已改为 `schema` 对象入参 + create 仍包 Promise，`build:renderer` 与骨架 `tsc -b` 已过，浏览器验证未完成）。后续窗口接手时先 `git diff` 确认现状，再按 ①②③ 完整重构。
6. **2026-11-12（用户提出，记录待改）→ 已由 001-01 承接（2026-11-12 落地）**：renderer.tsx 拆分 + FrameShell 职责修正 + widget-shell 使用时机。
   - **拆分（待改）**：renderer.tsx（153 行）职责过多，建议拆为——`use-section-data.ts`（pickValue + useSectionData 数据解析）、`section-item.tsx`（单 section 装配）、`renderer.tsx`（只剩 SchemaRenderer 顶层）。已试拆过一次并验证构建通过，但违反「先记录不改码」约定已回滚；方案留此，换窗口后与 API 重构（第 5 条）一起做。
   - **FrameShell 删除（用户拍板，待改）**：渲染器包内 FrameShell 与骨架分工冲突——骨架 section-frame 注释明确「section-frame 管摆得准挂得稳（位置/大小/zIndex + loading/error 兜底 + ErrorBoundary），视觉壳（标题/边框/皮肤）归 ui-widget-shell 物料」。渲染器包内已有这份定位壳（`packages/screen-renderer/src/section-frame/`，001 从骨架复制），FrameShell 是叠加其上的多余视觉层（内置背景/边框/标题栏，与 widget-shell 撞车且皮肤硬编码）。**修正**：整个删除 FrameShell，渲染器视觉归零——装配链变为 `SectionFrame（定位兜底）→ 物料裸渲染`；schema 的 `frame` 字段留作 002 扩展占位（`shell`/`title`/`extra` 透传给壳物料）；playground 需要观感时在 mock registry 自放壳物料。
   - **widget-shell 何时用（归 002/004）**：`ui-widget-shell` 是物料站物料（毛玻璃壳 + 标题栏 + `--ws-*` 主题变量 + titleBanner 横幅模式），不进渲染器包（隔离规则）。使用机制：宿主 registry 注册后，schema 通过 `section.frame.shell: "ui-widget-shell"` 声明，渲染器查 registry 渲染壳并把 title/extra/shellProps 传入。物理时机：002 落地 `frame.shell` 机制时首次使用，004（真实物料搭屏）大规模使用。备选方案「section 嵌套（children）」已否——嵌套使 layout 坐标语义复杂化，frame 声明式更适合 AI 生成 schema。
7. **2026-11-12（001-02 review 补记，未及时登记的实现偏离）**：① 步骤 7 原要求「main.tsx 挂全局 React → 动态插 script → create」，实际改为 `index.html` 静态加载 UMD React/ReactDOM + IIFE 产物，`main.tsx` 探测 `window.ScreenRenderer`、缺失时回落源码渲染——功能等价且有兜底。② 步骤 7 的 `public/schemas/demo.schema.json` 实际落地为 `public/screen.json`。③ 根 `package.json` 新增 `@types/node@^26`：为 `scripts/check-renderer-isolation.mjs` 等根级 mjs 脚本提供 node 类型（tsc -b 校验根配置树需要）。
8. **2026-11-12（已由 001-02 承接）**：骨架 `package.json` 的 `build` 曾前置 `pnpm --dir ../../ --filter @fedx/screen-renderer build`——骨架拷到隔离环境后 build 硬失败，违反自包含要求。001-02 已移除该前置，恢复 `tsc -b && vite build`；重建 renderer 统一在根仓库跑 `pnpm build:renderer` 后拷入。

## 技术设计（实现要点）

| 项 | 决定 | 原因 |
| --- | --- | --- |
| 包位置 | `packages/screen-renderer` | 物理隔离，编译期挡住跨层 import |
| 工作区范围 | `packages/*`，不含 `docs/skeleton` | 骨架要能被拷到隔离环境独立 install |
| 产物格式 | IIFE（`ScreenRenderer` 全局） | 宿主用 `<script>` 加载，不参与骨架构建 |
| React 来源 | external，映射 `window.React` / `window.ReactDOM` | 避免双实例导致 `Invalid hook call` |
| JSX 运行时 | classic（`jsx: "react"`） | automatic 依赖 `react/jsx-runtime` 全局，IIFE 场景取不到 |
| 加载顺序 | 先挂全局 React → 再插入 script → 再 `create()` | 顺序错会取到 undefined |
| 骨架职责 | 只提供 `registry`（物料映射）与 `schemaUrl` | 骨架是模板，不承载渲染逻辑 |
| 类型 | 包产出 `dist/index.d.ts`，骨架通过相对路径引用 | 产物在 public 下，无 package 解析 |
| 产物入库 | `skeleton/public/vendors/` 必须被 git 跟踪 | 骨架要整包拷到隔离环境，被忽略就缺 SDK |
| 零骨架依赖 | 加 lint/CI 规则：包内禁 import `@/components`、`@/common`、`@/screens` | 人眼判断 A5 不可靠 |
| 数据来源 | 只支持 `data.inline` / `data.url` | 渲染器包内不能 import 骨架 `common/api` |
| 视觉壳 | `section.frame` → Renderer 内置极简壳（标题栏） | 包内无法引用骨架的 `ui-widget-shell` |
| 跨 bundle Context | **不共享**，也不再想办法透传 | `scalechange` 事件供宿主使用；物料通过保留 prop `__scale` 读缩放，**禁止** import 渲染器的 `ScalerContext` |
| 事件派发时机 | `create()` 先同步派发一次初值，之后只在真实变化时派发 | 否则物料首帧初始化（如 echarts）吃到默认值 1 |
| 全屏弹层 | `OverlayRootContext` 同样跨 bundle 失效 | MVP 不用弹层；弹层需求出现时改为事件 + 宿主处理 |

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-12 | 用户（对话批准 "run task001"） |
| ② 实现验收 | 待验收 | — | — |

## 关联

> - 设计文档：`design/mvp/schema-runtime.md`
> - 后续：002（联动）、003（物料契约）、004（4 个物料）、005（导出拷 vendors）
