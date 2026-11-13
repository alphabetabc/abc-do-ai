# Task · 2026-11-12-005-skill-schema-mode

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-12-005-skill-schema-mode` |
| Status | 已完成 |
| 类型 | skill / docs |
| 影响范围 | `docs/workflows/schema-mode.md`（新增）、`scripts/export-skill.mjs`（SKILL.md 模板 + 拷贝 renderer 产物）、`docs/workflows/big-screen-assembly.md`（注明模式分支）、导出产物 `skeleton/public/vendors/screen-renderer/` |
| Roadmap | MVP · 外部生成入口 |
| 验收标准 | skill 产物含 schema-mode 规则与 renderer 产物；产物拷到空目录可独立运行；Hermes 按规则产出的 JSON 可被渲染器直接加载 |
| 前置依赖 | task-2026-11-12-001（Schema 类型）、task-2026-11-12-003（物料契约） |

---

## 目标（Goal）

给 `large-screen-builder` 增加「输出 Schema」的模式，让外部 Hermes 知道：有哪些 type 可用、每个能配什么、什么不允许。

---

## 步骤（执行计划）

## 技术设计与实现记录（2026-11-13）

- `docs/workflows/schema-mode.md`：Schema 结构示例与字段表、可用 type 唯一来源（`specs/<模块>/manifest.json` 的 `runtime` 块）、六条硬约束（清单内 type / 不生成组件代码 / 设计稿 px / 数据与 props 分离 / 联动只走字段表 / 不执行逻辑）、项目初始化六步、骨架内置约定（React 单实例：禁止 index.html 静态引 vendor react 脚本；geojson 路径 `/static/map/geojson/{adcode}.geojson`；渲染器脚本路径）、缺口占位处理、验收清单。
- `scripts/export-skill.mjs`：
  - 导出前先 `pnpm build:renderer`，把 `packages/screen-renderer/dist/` 整目录拷入 `docs/skeleton/public/vendors/screen-renderer/`（本地开发与导出同一路径；顺带移除了 004 后已废弃的 vendors 下 react.js / react-dom.js）
  - 新增守卫：骨架 `package.json` 含 `workspace:*` 依赖即抛错
  - specs 拷贝不再过滤 `manifest.json`（schema-mode 的 type 清单来源）
  - SKILL.md 模板加「两种产出（先选模式，再开工）」表：选择条件 + 判断依据（`runtime.schemaable`），原「构建流程」节标题标注为工程代码模式
- `docs/workflows/big-screen-assembly.md`：顶部加模式分支注记，链到 schema-mode.md。

### 与任务卡的偏差（以现状为准）

- 卡内写 `src/registry.ts`，实际为 `src/registry.tsx`（schema-mode.md 按实际路径书写）。
- 初始化流程补入 004 新增的 React 单实例约定与 geojson 依赖。

### 验证结论

- `pnpm export:skill` 通过（52 模块）。
- 产物核验：`workflows/schema-mode.md` 存在；`specs/<模块>/manifest.json` 已随产物导出；`skeleton/public/vendors/screen-renderer/` 含 `screen-renderer.js` + 全量 d.ts；产物骨架 `package.json` 无 `workspace:*`；仓库内 vendors 已被 git 跟踪。
- **A4 独立运行**：产物 skeleton 拷到空目录（`%TEMP%\lsb-verify-005`）→ `pnpm install`（10.2s）→ `pnpm build` 通过 → `pnpm dev` 浏览器验证：7 组件全部渲染（标题实时时钟 / 指标卡 / 地图 geojson 200 / 排名 / 条形 / 表格 / 时间轴），console 零 error；地图区域点击经 echarts click 回调链派发 `activeItem`（康平县→沈河区），排名列表高亮联动生效。
- **A5 Schema 可加载**：以规则产物 `home.schema.json`（仅含清单内 type、props 全在 propsContract 内）验证通过。**限制**：真实 Hermes 端到端生成未在本环境执行（无 Hermes 接入），规则文档已按其可执行性书写，留待实际接入后回归。


### 步骤 1：写 schema-mode.md

- **动作**：内容为——Schema 结构（字段与示例）、可用 type 清单的来源（`manifest.runtime`）、props 契约读取方式、`events` / `subscribe` 写法、硬约束（只能引用清单内 type；不得生成组件代码；坐标用设计稿 px）
- **动作**：补「项目初始化」流程——① 拷 `skeleton/` 到目标目录 ② `pnpm install`（自带 `public/vendors/screen-renderer`，无需构建 renderer）③ 按 schema 的 type 缺口，从 `specs/<模块>/code/` 拷物料进 `src/components/` ④ 在 `src/registry.ts` 注册 ⑤ 写入/接收 schema.json ⑥ `pnpm dev` 出屏
- **动作**：写明「Schema 模式下物料原样拷贝、不改内部实现」，否则 `propsContract` 与实现漂移，后续生成的 schema 会失效；要改物料须回源仓库改后重新导出
- **动作**：写明两种产出及其节奏——Schema 运行时加载、秒级生效；物料需进骨架 `src/components` 并重新 build。AI 写物料时，如需缩放读保留 prop `__scale`，**禁止** import 渲染器的 `ScalerContext`，也不假定宿主存在 `useScreenScale`
- **输出**：`docs/workflows/schema-mode.md`
- **等待用户**：否

### 步骤 2：SKILL.md 增加分支

- **动作**：`export-skill.mjs` 的 SKILL.md 模板加「两种产出」说明：工程代码（复制二开）/ Schema（受控装配），并链到对应 workflow
- **输出**：更新后的模板
- **等待用户**：否

### 步骤 3：旧 workflow 标注

- **动作**：`big-screen-assembly.md` 顶部注明「本流程为工程代码模式；Schema 模式见 schema-mode.md」
- **输出**：更新后的 workflow
- **等待用户**：否

### 步骤 4：导出时随带渲染器产物

- **动作**：`export-skill.mjs` 增加一步——先执行 `pnpm build:renderer`，把 `packages/screen-renderer/dist/` 拷到 `skeleton/public/vendors/screen-renderer/`；拷贝 `dist/index.d.ts`；确认产物中骨架 `package.json` 无 `workspace:*` 依赖
- **注意**：本地开发用同一路径；改 renderer 后必须重跑 `build:renderer` 并重新拷贝，否则骨架仍在用旧产物
- **输出**：自包含的骨架（物料 + 渲染器产物 + schema），可在隔离环境独立 `pnpm install && dev`
- **等待用户**：否

### 步骤 5：验证

- **动作**：`pnpm export:skill` 确认产物含新文档与 `skeleton/public/vendors/screen-renderer/`；把产物拷到一个空目录独立 install 跑起来；用一份真实需求让 Hermes 生成一次 Schema，喂给渲染器验证
- **输出**：验证结论
- **等待用户**：是（硬门槛②）

---

## 不做清单

- 不改 Hermes 本身
- 不写页面内 AI 对话
- 不做 Schema 校验器（MVP 靠渲染器兜底）

## 验收 checklist

- [x] A1：`dist-skill/large-screen-builder/workflows/schema-mode.md` 存在
- [x] A2：SKILL.md 明确两种产出的选择条件
- [x] A3：产物含 `skeleton/public/vendors/screen-renderer/`，骨架 `package.json` 无 `workspace:*`，且 vendors 已被 git 跟踪
- [x] A4：产物拷到空目录可独立 `pnpm install && dev` 跑起来
- [x] A5：按规则生成的 Schema 不含清单外 type，渲染器可加载
- [x] A6：`pnpm export:skill` 通过

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-13 | 用户 |
| ② 实现验收 | 已验收通过 | 2026-11-13 | 用户 |

## 关联

> - 前置：`task-2026-11-12-001-mvp-renderer-core.md`、`task-2026-11-12-003-mvp-material-contract.md`
> - 现有流程：`docs/workflows/big-screen-assembly.md`
