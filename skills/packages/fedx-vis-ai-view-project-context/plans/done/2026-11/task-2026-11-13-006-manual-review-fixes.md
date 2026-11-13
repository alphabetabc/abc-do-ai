# Task · 2026-11-13-006-manual-review-fixes

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-13-006-manual-review-fixes` |
| Status | 已完成（2026-11-13 用户验收通过，硬门槛②过，已归档） |
| 类型 | 编码 / docs |
| 影响范围 | docs/skeleton/src/**、docs/skeleton/public/{schemas,mock}、docs/skeleton/scripts/、apps/playground/**（新建）、pnpm-workspace.yaml、scripts/check-material-registry.mjs、docs/workflows/*.md |
| Roadmap | MVP 收尾 |
| 验收标准 | 问题清单中的每一项要么修复并验证，要么明确「不修 / 延后」并记录理由 |
| 前置依赖 | task-2026-11-12-001~005（已完成归档）；2026-11-13 机器审查 7 项已全部修复并验证通过 |

---

## 目标（Goal）

承接用户对 MVP 实现（渲染器 + 物料契约 + 骨架接入 + skill Schema 模式）的**人工 review**：把 review 中发现的问题逐条记录在本卡，review 完成后统一决策——修复 / 不修 / 延后，再执行。

---

## 问题记录（用户人工 review，逐条登记）

> 用户 review 时逐条追加；每条给出「位置 + 现象 + 期望」。登记完统一定处置（修 / 不修 / 延后）。

| # | 位置（文件 / 页面） | 问题描述 | 期望 | 处置（待定） |
| - | ---- | ---- | ---- | ---- |
| 1 | docs/skeleton/src/main.tsx、index.html、App.tsx | 双轨入口并存：main.tsx 探测 IIFE 渲染器接管 #screen-root，HashRouter + screens/home 源码屏仅作回落，两套渲染入口并行 | 只保留 Schema 模式，但保留路由：main.tsx 只挂 React App（删 #screen-root 探测/回落）；HashRouter 保留，每个路由一个独立渲染器实例（Route 组件内 create/destroy + fetch 各自 schema） | 修复（已批准） |
| 2 | docs/skeleton/src/screens/home、src/components/{scaler-container,section-frame,interaction-store} | 源码屏退役后，这三个 renderer IIFE 产物已含的组件在骨架侧成了冗余复制件 | 删除 screens/home（含 interactions.ts）及 scaler-container / section-frame / interaction-store 三目录；registry.tsx、物料组件、error-boundary、services 层保留 | 修复（已批准） |
| 3 | docs/skeleton/src/components、public/{schemas,mock} | MVP 测试/演示物料（7 个组件 + home.schema.json + mock）混在产品骨架里，随 skill 发布 | skeleton 只留干净工程壳；研发验证迁至 `apps/playground`，在此发现问题反哺 `docs/` 能力后再发布 skill；MVP 对外演示在 hermes 环境（用户自建，AI 不参与） | 修复（已批准） |
| 4 | docs/skeleton/src/renderer-boot.ts | 渲染器启动器是基础设施工具，却平铺在 src 顶层，与 common/ 分层不一致 | 迁入 `src/common/renderer/`（如 boot.ts），与 common/api、common/environment 同级；导入方改 `@/common/renderer`；src 顶层只留 main.tsx / App.tsx / registry.tsx / 路由组件 | 修复（已批准） |

### 问题 3 处置方案（已与用户对齐）

- `docs/skeleton` 定位为**发布产物**：入口 / 路由 / registry / renderer 接入 / aliases，不含演示物料
- 新建 `apps/playground`（pnpm workspace 子包）：迁入 7 个 MVP 演示组件、`home.schema.json`、mock 数据，作为研发期 schema 渲染链路的端到端验证回路
- 研发流程：playground 发现问题 → 反哺 `docs/`（物料 / renderer / workflow）→ `pnpm export:skill`
- hermes 演示环境由用户自行搭建，AI 不参与

### 问题 1/2 合并处置方案（已与用户对齐）

1. `main.tsx` / `index.html`：删 `#screen-root` 探测回落，入口只挂 React App
2. `App.tsx`：保留 HashRouter；每个 Route 一个「Schema 屏组件」，effect 内创建渲染器实例（props 传 schema URL），unmount 时 destroy；React 全局注入只做一次，多实例共用
3. 删除源码屏及三组件目录（问题 2）
4. 渲染失败时路由页显示错误占位（不空白）
5. 连带更新：「新增屏 = 建 screens/<name> + 追加 Route」约定改为「加 schema + 追加 Route」；renderer-boot.ts schema URL 参数化

---

## 实施规格（2026-11-13 批准后细化，防漂移——实施窗口按此执行，偏离即回门槛①）

> 依赖顺序：M1 → M2 → M3 → M4 → M5；每个里程碑末跑验证命令，全绿再进下一个。

### M1 · playground 建立（问题 3 地基）

1. `pnpm-workspace.yaml` 的 packages 追加 `'apps/*'`
2. 新建 `apps/playground/`，从 docs/skeleton 拷贝工程底座（package.json / vite.config.ts / tsconfig.json / eslint.config.mjs / index.html / src 结构），包名 `@fedx/playground`
3. **迁入**（从 skeleton 移动，非复制）：
   - 7 个演示组件：src/components/{screen-title, rank-list, data-table, time-axis, indicator-view, echarts-map, echarts-hor-bar}
   - `public/schemas/home.schema.json`、`public/mock/overview.json`、`public/static/map/geojson/210100.geojson`
   - `src/services/home/`（mock 数据源）
4. playground 的 `src/registry.tsx` 同步迁入并注册 7 物料；App/入口先用最简形态（后续 M2 由骨架改造反哺）
5. `public/vendors/screen-renderer/` **不迁**——playground 依赖根仓库 `pnpm build:renderer` 后手动同步，或用脚本从 `packages/screen-renderer` 产物目录拷贝（实施时定，倾向写一行 pnpm script `sync:renderer`）
6. 迁移后 skeleton 对应文件删除；**skeleton 的 `public/vendors/`、`public/environment.json`、`src/common/`、`src/components/error-boundary`、`src/registry.tsx`（清空注册表但保留结构）保留**
7. **一致性铁律**：playground 与 skeleton 的工程底座（依赖版本 / 构建与 ts 配置 / 别名 / renderer 接入方式 / 纪律脚本）必须持续对齐——playground 是骨架的「加料镜像」，两工程结构漂移 = 验证失去代表性。M2 骨架改造（SchemaScreen / common/renderer 等）落地后，playground 同步跟进相同结构。后续任一侧改底座，另一侧同批跟进

### M2 · 骨架入口收敛（问题 1/2/4 核心）

1. `src/renderer-boot.ts` → `src/common/renderer/boot.ts`；导出保持 `bootScreenRenderer(container, schemaUrl)` 签名，**schema URL 改参数**（删模块级 `SCHEMA_URL` 常量或保留为默认值）
2. React 全局注入（window.React / window.ReactDOM）抽出为模块级单例 `ensureRendererGlobal()`，多路由实例共用，**幂等**
3. 新建 `src/SchemaScreen.tsx`（或 `src/screens/schema-screen.tsx`，实施时定，倾向 src 顶层）：props `{ schemaUrl: string }`；effect 内 create → fetch schema → setSchema；unmount 时 destroy；**渲染失败（加载脚本失败 / fetch 失败 / create 抛错）渲染错误占位（ErrorBoundary 或本地 state），不回落源码屏（源码屏已删，无回落物）**
4. `src/App.tsx`：HashRouter 保留；Route 改挂 `<SchemaScreen schemaUrl="/schemas/home.schema.json" />` 之类（骨架内 schema 路径仅作示例注释，实际由宿主放）
5. `src/main.tsx`：删 `#screen-root` 探测 / 回落逻辑，只剩 `await initEnvironment()` + `ReactDOM.createRoot(#root).render(<App />)`（保留不包 StrictMode 的注释与理由）
6. `index.html`：删 `#screen-root` div 及相关注释，只留 `#root`
7. **删除**：`src/screens/home/`（index.tsx + interactions.ts）、`src/components/{scaler-container, section-frame, interaction-store}` 三目录
8. **保留**：`src/components/error-boundary`（错误占位可能复用）、`src/common/`、`src/services/`（问题 2 已定）

### M3 · 校验脚本重定向（问题 2/3 连带，闭环 review 发现的 5 个缺口）

1. 根 `scripts/check-material-registry.mjs`：校验目标从骨架 registry 改为 **playground registry**（`apps/playground/src/registry.tsx`）；manifest 源不变
2. 骨架 `scripts/check-discipline.mjs`、`scripts/check-materials.mjs` → **迁至 playground `apps/playground/scripts/`**（断言对象 screens/components 已随物料迁移）；骨架 scripts 目录清空后删除
3. 骨架 package.json scripts 同步删 `check:materials` / `check:discipline`；playground package.json 增对应 scripts

### M4 · workflow 文档失真修复（问题 1/2/3 连带）

> workflow 文档会被 export-skill 原样拷入 skill，失真即污染交付物。按「导出产物视角」写路径（见 env/AGENTS.md 路径基准）。

1. `docs/workflows/schema-mode.md`：
   - §项目初始化 第 5 步：`src/renderer-boot.ts` 的 SCHEMA_URL 表述 → 改为新路径 + 参数化用法
   - 第 4 步 registry 注册表述核对（结构未变，仅确认路径）
   - 「骨架内置约定」中 renderer-boot 路径引用同步更新
   - 新增屏约定（如文档内有「建 screens/<name>」表述）→ 「加 schema 文件 + App.tsx 追加 Route（挂 SchemaScreen）」
2. `docs/workflows/big-screen-assembly.md`：grep 排查 `screens/`、`renderer-boot`、`SCHEMA_URL`、`scaler-container` 等失真引用，逐一修正
3. `docs/skeleton/` 内 README / 注释（如有）同步排查

### M5 · 验证（硬门槛② 前置）· 结果回填（2026-11-13）

- [x] 根：`pnpm build`（站点）✅
- [x] 根：`pnpm build:renderer` 产物已同步（本次未改 renderer 代码，无需重建；playground vendors 经 `pnpm sync:renderer` 从 packages/screen-renderer/dist 同步，export:skill 亦已刷新 skeleton vendors）✅
- [x] 根：`pnpm check:renderer-isolation` ✅
- [x] 根：`pnpm check:material-registry`（已重定向 playground，7/7 通过）✅
- [x] playground：`pnpm build`（tsc + vite）通过；`pnpm dev` 浏览器验证——7 section 全渲染（标题栏 / 排行榜 / 指标卡 / 柱状图 / 表格 / 时间轴 / 地图 canvas）、联动闭环（点击排行榜「沈河区」→ 指标卡 active 切换）、console 无 error ✅
- [x] playground：`check:discipline` / `check:materials` 可跑且通过（discipline 断言二补 100vw/100vh 全屏覆盖层豁免——specs 原件冻结内容；materials 20 文件哈希比对无改写）✅
- [x] ~~skeleton：`pnpm build` / `pnpm dev` 待用户装依赖后验证~~ → **改为镜像保证（用户裁决 2026-11-13：同样东西不验证两次，验证职责归 playground）**：新增 `pnpm check:skeleton-mirror`，skeleton / playground 共有工程壳 13 文件（main/App/SchemaScreen/common/error-boundary/配置四件套等）逐字节一致即证明同构，playground 验证一次覆盖 skeleton；空 registry 场景由同构 + 静态构建推断，宿主 install 后自行起屏。首跑即抓到 vite.config.ts 注释漂移并已统一 ✅
- [x] `pnpm export:skill` 产出 dist-skill，抽查通过：skeleton/src 无演示物料（仅 error-boundary + common + 空 registry + App/main/SchemaScreen）、public 仅 vendors + environment.json，workflows/ 无 renderer-boot / SCHEMA_URL / screen-root / screens/home 失真引用 ✅
- [x] grep 验证：docs/skeleton 下无 `screens/home`、`#screen-root`、`renderer-boot` 残留（仅 boot.ts 的 DEFAULT_SCHEMA_URL 示例常量，属预期）✅

### 风险标注

- renderer-boot 迁移 + 签名参数化：唯一外部引用方是 main.tsx（将改写）与 workflow 文档（M4 覆盖）；风险低
- playground 的 vendors 同步若选择手动拷贝，须在 playground README（或 package.json script 注释）写明来源命令，防止用旧产物
- check-material-registry 重定向影响 env/AGENTS.md 质量门槛描述 → M3 后**必须同步更新 env/AGENTS.md** 的门槛清单（新增 playground 相关命令）

---

## 步骤（执行计划）

### 步骤 0：登记问题（当前阶段）

- **动作**：用户人工 review，把发现的问题逐条填入上方「问题记录」表（可直接改本文件，或口头告知由 AI 代填）
- **输出**：完整问题清单
- **等待用户**：**是**

### 步骤 1：处置评审（硬门槛①）

- **动作**：对每条问题给出处置建议（修复成本 / 影响面 / 是否属于 MVP 边界），用户拍板
- **输出**：每条问题的处置结论 + 更新后的影响范围
- **等待用户**：**是**

### 步骤 2：修复与验证

- **动作**：按批准的处置清单逐项修复；每项附验证方式（构建 / check 脚本 / 浏览器）
- **输出**：修复代码 + 验证结论回填本卡
- **等待用户**：否（步骤 1 已定案）

### 步骤 3：回填与归档

- **动作**：任务卡回填验收 checklist；涉及渲染器改动的重跑 `build:renderer` 并同步 vendors；硬门槛②后归档
- **输出**：归档至 `plans/done/2026-11/`
- **等待用户**：是（硬门槛②）

---

## 实施记录（2026-11-13，M1~M4）

- **M1 playground**：pnpm-workspace.yaml 增 `apps/*`；skeleton 全量拷贝为 `apps/playground`（包名 `@fedx/playground`）；新增 `scripts/sync-renderer.mjs` + `pnpm sync:renderer`（从 packages/screen-renderer/dist 同步 vendors，产物缺失报错退出，防旧产物）；skeleton 侧删除 7 演示组件、schemas/mock/static、services/home
- **M2 入口收敛**：`renderer-boot.ts` → `src/common/renderer/boot.ts`（签名 `bootScreenRenderer(container, schemaUrl)` 参数化，React 全局注入 `ensureRendererGlobal()` 幂等单例、失败不缓存可重试）；新建 `src/SchemaScreen.tsx`（effect create→fetch→setSchema，unmount destroy，失败渲染错误占位）；App.tsx 改 HashRouter + Route 挂 SchemaScreen；main.tsx 删 `#screen-root` 探测回落；index.html 只留 `#root`；删 screens/home 与 scaler-container/section-frame/interaction-store；registry.tsx 清空保留结构
- **M3 脚本重定向**：根 check-material-registry.mjs 指向 `apps/playground/src/registry.tsx`（文案同步）；check-discipline.mjs / check-materials.mjs 迁至 apps/playground/scripts/（skeleton scripts 目录已删）；skeleton package.json 删两 script，playground 增对应 + sync:renderer
- **M4 文档**：schema-mode.md §初始化 5/6 步 + 骨架内置约定改写为新结构（SchemaScreen / common/renderer/boot.ts / 加 schema+Route 约定）；big-screen-assembly.md 三处失真修正（L3 起步说明、每屏一路径双模式、interaction-store 从 specs 拷入）；两份 AGENTS.md 同步（仓库结构 apps/、renderer 注释、质量门槛 playground 命令、check:material-registry 目标）
- **附带修正**：playground home.schema.json 的 rank 区块补 `events: [{on: onClick, dispatch: activeItem}]`（无 pick，整行 payload 派发）——浏览器实测联动闭环；check-discipline 断言二补 100vw/100vh 全屏覆盖层豁免（scaler-container 全屏态，specs 原件冻结）

## 追加实施（2026-11-13 下午 · playground 镜像化，用户裁决「playground 是骨架的镜像，不分两支」）

**背景**：M1「skeleton 全量拷贝为 playground」发生在 M2 骨架改造之前，plan 中「M2 由骨架改造反哺 playground」未落为可验证执行项，导致 playground 长期停留在旧双轨架构（main.tsx 探测 #screen-root + screens/home 源码屏 + 三编排壳复制件）；且此前 playground 浏览器验证走的是旧入口，未覆盖新 SchemaScreen 链路。renderer 产物同步亦存在「dev 不拉最新」缺口。

- **镜像化**：playground 的 main.tsx / App.tsx / index.html / SchemaScreen.tsx / common/renderer/boot.ts 替换为 skeleton 同版（App 仅注释差异）；删 renderer-boot.ts、screens/、scaler-container / section-frame / interaction-store 三目录；registry 保持 7 物料注册（check-material-registry 校验目标不变）
- **renderer 产物同步收敛（单一机制）**：根 `build:renderer` 链式调用新脚本 `scripts/sync-renderer-vendors.mjs`，构建后自动同步 dist → skeleton + playground 两处 vendors；两 app 的 vite copy-renderer-vendor 插件去掉 `apply:'build'` 并改为整目录同步——`pnpm dev` 启动即拉最新产物（dev 日志实测「已同步 dist → vendors」）；废弃 playground 本地 `sync:renderer` 脚本（避免双机制）
- **连带修复（skeleton 侧潜伏错）**：boot.ts 的 `@/registry` 别名在两 app 的 tsconfig/vite 均未映射（skeleton 因未跑过构建未暴露），改为相对导入 `../../registry`，两份同步
- **重新验证（覆盖此前走旧入口的验证）**：playground `pnpm build`（tsc + vite）通过；dev 浏览器实测——`#/home` 走 HashRouter → SchemaScreen（DOM 无 #screen-root，确认单轨）、7 section 全渲染、点击排行榜「沈河区」→ 指标卡 active 切换、console 无 error；export:skill 重新导出，dist 内 skeleton/boot.ts 与源一致
- **文档同步**：根 AGENTS.md（build:renderer 自动同步说明）、env/AGENTS.md（playground 定位改「骨架的镜像」、产物同步机制、删 sync:renderer 表述）

### 追加 · src 布局收敛（2026-11-13，用户反馈「src 太散乱」）

三个渲染核心文件收敛到 `src/components/` 下，两侧（skeleton / playground）同步：

- `src/SchemaScreen.tsx` → `src/components/schema-screen/index.tsx`（App 改 `import SchemaScreen from '@/components/schema-screen'`）
- `src/common/renderer/boot.ts` → `src/components/renderer/boot.ts`（registry 导入顺带改回别名 `@/components/registry`——components 层别名本就存在，先前相对导入是为绕开 common 层别名缺口，收敛后不再需要）
- `src/registry.tsx` → `src/components/registry.tsx`
- 连带更新：check-material-registry / check-skeleton-mirror 的 registry 路径与文件清单、schema-mode.md（注册步骤 + React 单实例约定的 boot 路径）、两 app 的 index.html / vite.config.ts 注释、根 AGENTS.md 命令表；export:skill 已重导
- 验证：mirror（13 文件一致）/ material-registry（7/7）/ discipline / materials / playground build 全过；dev 浏览器冒烟——7 section 渲染、排行联动、console 零 error
- 收敛后 src 顶层只剩 main.tsx / App.tsx，common/ 只剩 environment + api（纯环境/请求基础设施）

### 追加 · src 布局收敛二轮（2026-11-13，用户定稿物料归口）

- 物料归 `src/components/materials/`：7 个演示目录迁入，`registry.tsx` 放 materials 根；error-boundary 仍留 components/（基础设施非物料）
- `components/renderer/boot.ts` 并入 `src/components/schema-screen/`（渲染器启动器是 Schema 屏的内部实现，schema-screen/index.tsx 改相对导入 `./boot`，boot 对 registry 用 `@/components/materials/registry`）
- **别名落位连带调整**：`@/materials/components/**` 与 `@/materials/_assets/**` 的 vite/tsconfig 映射从 `src/components/**` 改指 `src/components/materials/**`（两 app 同步）——宿主按别名层级拷物料仍零改写，只是落点统一到 materials/
- 连带更新：check-material-registry / check-skeleton-mirror 路径与清单、schema-mode.md（补物料 / 注册步骤 / React 单例）、big-screen-assembly.md（L3 落位规则 + check:materials 说明）、export-skill.mjs 的 SKILL.md 文本（顺带修正一处 M4 漏改：`src/screens/<name>` 失真表述 → schema + Route 挂 SchemaScreen）、根 AGENTS.md
- 验证：mirror（13 文件）/ material-registry（7/7）/ materials / discipline / playground build / export:skill 全过；dev 浏览器冒烟——7 section、排行联动、console 零 error
- 最终布局：`src/` 顶层仅 main/App；`components/` = schema-screen（含 boot）+ materials（含 registry）+ error-boundary；`common/` = environment + api

### 追加 · 路由收敛为 screens 页面层约定（2026-11-13，用户纠正）

- 中途错误方向（已废弃）：抽象 `src/routes.tsx` 路由表 + `ScreenRoute` 类型由 App 自动生成 Route——过度设计，用户裁决回归常规页面层约定
- 最终形态：**一屏 = `src/screens/<name>/index.tsx`**（组件内声明该屏 schemaUrl，包 `SchemaScreen`）；`App.tsx` 只做 import + 挂 Route，不内联 element 内容；两侧 `screens/home/index.tsx` 与 `App.tsx` 逐字节同版（纳入 mirror，14 文件）
- skeleton 出厂含 `screens/home/` 作模板（schema 文件由宿主放入后即出屏）；工程代码模式同目录约定，`index.tsx` 内直接写 App 级布局即可，App 挂法不变
- 连带更新：schema-mode.md 步骤 5（建屏 + 放 schema）、big-screen-assembly.md 多屏约定、export-skill SKILL.md 文本
- 验证：mirror（14 文件）/ playground build / export:skill 全过；dev 冒烟——7 section、排行联动、console 零 error

### 追加 · 设计文档同步（2026-11-13，收尾）

- `design/mvp/schema-runtime.md` 同步本任务实现：§5.3 boot 路径、§8.1 skeleton 保留定位、§8.2 定位调整（发布产物 + playground 验证回路）、§8.5 目录图重绘 / workspace 约束补 apps/* / 物料落位 materials/、变更记录补 2026-11-13 行
- 验收决策记录：skeleton 不再单独装依赖验证（同构即同证，用户裁决），由 `check:skeleton-mirror` 保证与 playground 逐字节一致

## 不做清单

- 不重新做机器审查已修复的 7 项（schema 校验 / frame 对齐 / check 脚本 / AbortController / 回调 ref / warnings / React UMD 残留），除非人工 review 发现修复本身有问题
- 不扩大到 MVP 边界外的新能力（引导页 / NL→Schema 提示词等另立任务）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准（2026-11-13，用户批准问题 1~4 全部修复） | 2026-11-13 | 用户 |
| ② 实现验收 | 已通过（2026-11-13，用户验收通过并指示归档） | 2026-11-13 | 用户 |

---

## 关联

> - 前置：`task-2026-11-12-001~005`（均已归档至 `plans/done/2026-11/`）
> - 设计：`design/mvp/schema-runtime.md`
