# Finding-002：AGENTS.md 正文写作计划（D-11 ~ D-14）

> **日期**：2026-07-29
> **性质**：第二轮 research Stage A 结论
> **作用范围**：沉淀到 `/AGENTS.md` 的全部条目（项目定位 / 实现习惯 / 硬约束）
> **前置 finding**：[`2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) §3.5 已给出占位符替换初版
> **规则约束**：本文件结论须遵守 `.trae/rules/docs-authoring-rules.md` Rule 1 / Rule 2 / Rule 3（事实优先 / docs 隔离 / AGENTS.md 边界）
> **路线图**：`.trae/skills/oss-vis-gd-project-context/plans/roadmap.md` §2 决策表 D-11 ~ D-14

---

## 0. TL;DR

| 维度            | 结论                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------ |
| 项目定位        | 前端单体（BFF + SSR + 大屏可视化），支持独立部署和 iframe 嵌入（**非 qiankun 微前端**）      |
| 当前重点模块    | 应急保障大屏（gd-emergency-support）+ 五大中心（five-major-center）                       |
| 模块代码根路径  | `src/`（BFF + SSR + 视图）+ `public/static/mock/`（前端 mock）+ `public/environment.json`（环境配置）|
| 技术栈          | React 18.1.0 + antd 5.26.7 + valtio 1.11.2 + fedx-ssr 0.5.0 + midway 3 + ECharts 5 + fedx-gis 1.6.9 + Socket.IO |
| 包管理器        | **pnpm**（`pnpm-lock.yaml` 已存在；`scripts` 沿用 `npm` 命名兼容 pnpm）                    |
| 公共组件库      | fedx-ui 2.1.5 + @fedx-web-common/react-hooks/utils + @fedx-vis/react-echarts + @fedx-vis/react-large-screen |
| API 请求约定    | `@midwayjs/axios`（BFF 层封装）+ `@fedx-bff/core`（SSR 渲染入口）                          |
| 微前端          | **未启用**（删除模板该条目；独立部署 + 第三方 iframe 嵌入为主）                            |
| 按钮鉴权        | **本项目未发现 AuthButton 组件**（删除模板该条目，待 PM 确认）                            |
| 模板硬约束保留  | 阶段 1–3 只写 docs / 不编造 API / 状态机先写 spec.md / 不使用 docs-new/ 等 4 条全部保留   |
| 模板硬约束删除  | qiankun / AuthButton / npm legacy-peer-deps / oss-web-common / Hox / oss-ui 等 6 条删除  |
| 新增硬约束（待 PM 拍板） | 「mock 阶段禁止直接换主依赖」「第三方 iframe 需评审」「emergencySupportNeTypes 配置变更需评审」3 条 |

---

## 1. Q-001 模板硬约束的保留 / 改写 / 删除

### 1.1 模板硬约束逐条审核

> 来源：模板 `AGENTS.md` 第 27–39 行「必须遵守 / 禁止」段

| ID    | 模板原条目                                                                            | 类别     | 本项目处理              | 理由                                                          |
| ----- | ------------------------------------------------------------------------------------- | -------- | ----------------------- | ------------------------------------------------------------- |
| H-1   | 阶段 1–3：只写 `docs/`，不改业务代码（阶段 4 除外）                                    | 必须遵守 | ✅ **原样保留**          | Brownfield 模式通用约束，本项目已落入阶段 1–3                   |
| H-2   | 未在 `plan.md` 登记的切片，不做结构性重构                                              | 必须遵守 | ✅ **原样保留**          | 通用约束                                                      |
| H-3   | API 字段以 `api-contracts.md`、OpenAPI 或代码已有类型为准；未知标「待确认」             | 必须遵守 | ✅ **原样保留**          | 通用约束；本项目 `api-contracts.md` 尚未落盘                   |
| H-4   | 状态机、权限、字典规则先写入 `spec.md` 再改代码                                        | 必须遵守 | ✅ **原样保留**          | 通用约束                                                      |
| H-5   | 新模块复制 `docs/specs/_template/` 或参照 `fault-report/`，在 `specs/index.md` 登记    | 必须遵守 | ✅ **原样保留**（微调措辞）| 参考对象改为本项目首个登记模块（如 `emergency-support-dashboard`）|
| H-6   | 编造未在契约或类型中出现的 API 路径与响应字段                                          | 禁止     | ✅ **原样保留**          | 通用约束                                                      |
| H-7   | 顺带重构无关模块、未登记依赖的「顺手」升级                                            | 禁止     | ✅ **原样保留**          | 通用约束                                                      |
| H-8   | 跳过 `as-is-architecture.md` 直接大规模改数据流或目录                                  | 禁止     | ✅ **原样保留**          | Brownfield 模式通用                                            |
| H-9   | 使用 `docs-new/` 等非 `docs/` 路径作为规格正文                                         | 禁止     | ✅ **原样保留**          | 通用约束                                                      |
| H-10  | （实现习惯段）支持 qiankun 子应用模式                                                  | 实现习惯 | ❌ **删除**              | 本项目 package.json 无 qiankun 依赖（finding §2.2）             |
| H-11  | （实现习惯段）使用 `<AuthButton authKey="模块:操作" sendLog>`                          | 实现习惯 | ❌ **删除**              | 全仓 `src/` 未发现 AuthButton 组件                             |
| H-12  | （实现习惯段）依赖安装 `npm install --legacy-peer-deps`                                | 实现习惯 | ✏️ **改写** 为 `pnpm install` | `pnpm-lock.yaml` 已存在；scripts 沿用 `npm` 命名兼容 pnpm |
| H-13  | （实现习惯段）公共组件库优先使用 `oss-web-common`（VirtualTable / router / Enums）    | 实现习惯 | ✏️ **整段改写**          | 本项目使用 fedx-ui + @fedx-web-common                          |

### 1.2 保留条款清单（原样进入 `/AGENTS.md`）

```
H-1  阶段 1–3 只写 docs
H-2  未登记切片不做结构性重构
H-3  API 字段以 api-contracts.md 为准
H-4  状态机/权限/字典规则先写 spec.md
H-5  新模块复制 _template/ 或参照 emergency-support-dashboard
H-6  不编造 API 路径与字段
H-7  不顺手重构无关模块
H-8  不跳过 as-is-architecture.md 直接改数据流
H-9  不使用 docs-new/ 等非 docs/ 路径
```

### 1.3 改写 / 删除条款清单（不进入 `/AGENTS.md`）

| 删除 / 改写项    | 原因                                  | 替代表达                                       |
| ---------------- | ------------------------------------- | ---------------------------------------------- |
| H-10 qiankun 子应用 | package.json 无依赖                   | 删除该条；「实现习惯」段不再提微前端           |
| H-11 AuthButton  | 全仓未发现                            | 删除该条                                       |
| H-12 npm legacy   | 项目用 pnpm                           | 改为「**依赖安装**：`pnpm install`（lock 已存在）」 |
| H-13 oss-web-common | 本项目未使用                         | 改为「**公共组件库**：fedx-ui + @fedx-web-common」  |

---

## 2. Q-002「项目定位」一栏

> 模板原文：`类型 / 当前重点模块 / 模块代码根路径 / 协作模式` 四行

### 2.1 替换结论

| 模板占位符        | 替换值（本项目）                                                                                  | 事实依据                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **类型**          | 前端单体（BFF + SSR + 大屏可视化），支持独立部署和 iframe 嵌入（**非 qiankun 微前端**）            | `src/configuration.ts`（midway + fedx-bff）+ `config.ts`（mode: 'csr'）+ 路由层（finding §2.1）                            |
| **当前重点模块**  | 应急保障大屏（gd-emergency-support）+ 五大中心（five-major-center）                                | `src/controller/index.ts` 路由层 + `public/environment.json.gd-emergency-support.modules`（7 个子模块）                  |
| **模块代码根路径**| `src/`（BFF + SSR + 视图）+ `public/static/mock/`（前端 mock）+ `public/environment.json`（配置） | `src/` 树结构（src/controller、src/service、src/interface、src/mock、src/socket、src/modules/）+ `public/static/mock/` 40+ JSON |
| **协作模式**      | 存量模块 **文档化 → 按 spec 切片重构**（见 [docs/workflows/brownfield-module-refactor.md](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support/docs/workflows/brownfield-module-refactor.md)） | finding §0 / §4.1 Brownfield 模式 + 模板 workflows/brownfield-module-refactor.md                              |

### 2.2 AGENTS.md 项目定位段（草稿）

> ⚠️ 此为 v0.1 草稿，待 PM 评审后落盘

```
## 项目定位

- **类型**：前端单体（BFF + SSR + 大屏可视化），支持独立部署和 iframe 嵌入（非 qiankun 微前端）
- **当前重点模块**：应急保障大屏（gd-emergency-support）+ 五大中心（five-major-center）
- **模块代码根路径**：`src/`（BFF + SSR + 视图）+ `public/static/mock/`（前端 mock）+ `public/environment.json`（配置）
- **协作模式**：存量模块 **文档化 → 按 spec 切片重构**（见 docs/workflows/brownfield-module-refactor.md）
```

> 💡 **路径说明（待评审）**：路由层全部注册在 `src/controller/index.ts`（src/controller/index.ts:24-30）；视图层页面推测位于 `src/pages/` 或由 `screen-config` 动态加载（finding 阶段 1 待定位）。

---

## 3. Q-003「实现习惯」一栏

> 模板原文：第 41–50 行（实现习惯 9 条）

### 3.1 逐条替换结论

| 模板条目                          | 本项目处理  | 替换值                                                                                                            |
| --------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 前端栈：React 16 + Hox + oss-ui    | ✅ 替换     | **React 18.1.0 + valtio 1.11.2 + fedx-ui 2.1.5 + antd 5.26.7**（`react-router-dom` 5.2.0 沿用）                  |
| 提示词：claude-cursor/prompts.md  | ✅ 保留路径 | 不变；详见 [docs/skills/ai-tools/claude-cursor/prompts.md](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support/docs/skills/ai-tools/claude-cursor/prompts.md) |
| 代码规范                          | ✅ 保留路径 | 不变；详见 docs/standards/coding-standards.md（plan-002 步骤 7 按本项目栈微调）                                     |
| **依赖安装**                      | ✏️ 改写     | **`pnpm install`**（`pnpm-lock.yaml` 已存在；`scripts` 沿用 `npm` 命名兼容 pnpm；`npm run start / build / prod / lint` 全部可用） |
| **公共组件库**                    | ✏️ 整段重写 | 优先使用 `fedx-ui`（@fedx/ui 大屏基础组件）+ `@fedx-web-common/react-hooks` / `@fedx-web-common/utils`（hooks & 工具）+ `@fedx-vis/react-echarts` / `@fedx-vis/react-large-screen`（可视化） |
| **API 请求**                      | ✏️ 整段重写 | BFF 层统一封装：使用 `@midwayjs/axios`（已在 `src/configuration.ts` 装配）+ `@fedx-bff-web/ssr-core` 渲染入口（`src/controller/index.ts`）；前端通过 BFF 暴露的 `/api/index`、`/api/detail/:id` 访问（详见 [docs/design/api-contracts.md](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support/docs/design/api-contracts.md)，plan-003 整合） |
| **微前端**（qiankun 子应用）       | ❌ 删除     | **本项目未启用 qiankun**；若需跨应用嵌入走 `iframe` 模式（详见 [docs/design/framework-communication.md](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support/docs/design/framework-communication.md)，plan-002 步骤 5 决策） |
| **按钮鉴权** AuthButton           | ❌ 删除     | **本项目未发现 AuthButton 组件**；按钮级鉴权需求待 PM 确认（O-2 决策前不写）                                       |
| 实时数据（模板未提，本项目新增）   | ➕ 新增     | Socket.IO 双向通道（`@midwayjs/socketio` + `socket.io-client`）；详见 [docs/design/architecture.md §X](file:///e:/oss-fe-git/phoenix/oss-visual-gd-emergency-support/docs/design/architecture.md)（plan-002 步骤 4 重写） |

### 3.2 AGENTS.md 实现习惯段（草稿）

> ⚠️ 此为 v0.1 草稿，待 PM 评审后落盘

```
## 实现习惯

- 前端栈：见 docs/design/tech-stack.md（**React 18.1.0 + valtio 1.11.2 + fedx-ui 2.1.5 + antd 5.26.7**）
- 提示词：docs/skills/ai-tools/claude-cursor/prompts.md
- 代码规范：对齐 docs/standards/coding-standards.md
- **依赖安装**：`pnpm install`（lock 已存在；scripts 沿用 `npm` 命名兼容 pnpm）
- **公共组件库**：优先使用 `fedx-ui` + `@fedx-web-common/{react-hooks,utils}` + `@fedx-vis/react-{echarts,large-screen}`
- **API 请求**：BFF 层统一封装于 `@midwayjs/axios` + `@fedx-bff-web/ssr-core`；前端访问 `/api/index` 与 `/api/detail/:id`
- **实时数据**：Socket.IO 双向通道（`@midwayjs/socketio` + `socket.io-client`）
- ~~微前端~~：**本项目未启用 qiankun**；跨应用嵌入走 iframe
- ~~按钮鉴权~~：**本项目未发现 AuthButton 组件**；需求待 PM 拍板
```

---

## 4. Q-004 新增本项目特有的硬约束（待 PM 拍板）

### 4.1 候选新增约束清单

> 来源：扫描 `src/` + `public/` + `package.json` 后归纳的「本项目特有的、可被破坏的约束」

| ID    | 候选约束                                                                                                            | 触发场景                                                                                                          | 待 PM 拍板项 |
| ----- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------- |
| N-1   | **mock 阶段禁止直接替换真实接口**——`src/mock/` 与 `public/static/mock/` 的变更必须先在 `spec.md` §5 标注「mock → 真实」迁移计划 | `src/mock/index.ts` / `src/mock/detail.ts` + `public/static/mock/*.json`（40+ 文件）                            | 是否采纳？ |
| N-2   | **第三方 iframe 嵌入需评审**——`environment.json.iframe-page` / 各中心 URL 必须先在 spec 登记再启用                   | `public/environment.json` 中态势感知中心 / 节假日保障 / 抗台防汛 / 全运会 / 高速 / 高铁均为外部 iframe            | 是否采纳？ |
| N-3   | **`emergencySupportNeTypes` 配置变更需评审**——故障类型 / 应急物资 / 抢修队伍 / 台风等级字典修改需评审               | `public/environment.json.emergencySupportNeTypes` 是核心业务字典，下游 7 个大屏模块依赖                            | 是否采纳？ |
| N-4   | **信管局视图自动轮播参数变更需评审**——`viewSwitchInterval` / 自动模式影响演示效果                                   | `public/environment.json.info-management-bureau.viewSwitchInterval`（15s）                                        | 是否采纳？ |
| N-5   | **大屏分辨率 / 浏览器兼容矩阵需评审**——信管局 5760×1080、应急 4K 等大屏分辨率是产品硬件约束                        | 当前代码无兼容性矩阵；新增 / 修改大屏组件时若不关注，会出现错位                                                    | 是否采纳？ |
| N-6   | **视图层入口文件位置（src/pages/ vs 动态加载）需在阶段 1 摸排**——不在 AGENTS.md 写硬约束；写到 `as-is-architecture.md` | finding §2.1 仅推测路由层在 `src/controller/index.ts`，视图层入口待 `src/` 树搜索确认                              | 不进 AGENTS.md（写 spec） |

### 4.2 推荐项

> ⚠️ N-1 ~ N-5 全部为「推荐项」，需 PM 拍板；本阶段研究输出**默认按全部采纳**起草 AGENTS.md，并标注「待 PM 评审」。

**推荐理由**：

- N-1：mock 数据迁移是高风险动作（finding §6「mock 数据驱动 vs 真实接口驱动 边界模糊」）；提前沉淀可避免「顺手改 mock」
- N-2：iframe 外部依赖多（节假日 / 抗台防汛 / 全运会 / 高速 / 高铁 / 态势感知），无评审会引入不可控页面
- N-3：NE 类型字典是大屏数据建模的 SSOT（finding §2.3.4），变更影响范围广
- N-4：演示效果参数，PM 应拍板而非开发自行调整
- N-5：大屏硬件约束是产品验收标准

### 4.3 AGENTS.md 新增硬约束段（草稿）

> ⚠️ 此为 v0.1 草稿，待 PM 评审

```
## 本项目特有硬约束（待 PM 评审）

- **mock 阶段禁止直接替换真实接口**：`src/mock/` 与 `public/static/mock/` 的变更必须先在 `spec.md` §5 标注「mock → 真实」迁移计划
- **第三方 iframe 嵌入需评审**：`environment.json.iframe-page` / 各中心 URL 必须先在 spec 登记再启用
- **`emergencySupportNeTypes` 配置变更需评审**：故障 / 应急物资 / 抢修队伍 / 台风等级字典修改需评审
- **信管局视图自动轮播参数变更需评审**：`viewSwitchInterval` 影响演示效果
- **大屏分辨率 / 浏览器兼容矩阵变更需评审**：信管局 5760×1080、应急 4K 等是产品硬件约束
```

---

## 5. AGENTS.md 完整草稿（v0.1，待 PM 评审）

> ⚠️ 以下为基于 Q-001 ~ Q-004 结论整合的**完整草稿**；供 PM 评审后由 plan-002 步骤 1 落盘。

```markdown
# oss-visual-gd-emergency-support — Agent 指令

> 复制模板后替换 `{占位符}`。文档根为 **`docs/`**。

## 项目定位

- **类型**：前端单体（BFF + SSR + 大屏可视化），支持独立部署和 iframe 嵌入（非 qiankun 微前端）
- **当前重点模块**：应急保障大屏（gd-emergency-support）+ 五大中心（five-major-center）
- **模块代码根路径**：`src/`（BFF + SSR + 视图）+ `public/static/mock/`（前端 mock）+ `public/environment.json`（配置）
- **协作模式**：存量模块 **文档化 → 按 spec 切片重构**（见 [docs/workflows/brownfield-module-refactor.md](docs/workflows/brownfield-module-refactor.md)）

## 文档根路径

- 权威文档目录为 **`docs/`**。
- 入口：[docs/index.md](docs/index.md)

## 权威顺序（冲突时）

1. `docs/specs/{模块}/spec.md` + `acceptance-tests.md`（目标行为）
2. `docs/design/api-contracts.md` + `data-models.md`
3. `docs/specs/{模块}/as-is-architecture.md`（现状；重构推进后标注过时段落）
4. `docs/specs/{模块}/pm-inputs/pm-requirements-input.md`（业务语言）
5. `docs/design/tech-stack.md`、`architecture.md`
6. `docs/skills/` 下与所选栈匹配的 `coding.md` / `testing.md`

## 必须遵守

- **阶段 1–3**：只写 `docs/`，不改业务代码（阶段 4 除外）
- 未在 `plan.md` 登记的切片，不做结构性重构
- API 字段以 `api-contracts.md`、OpenAPI 或代码已有类型为准；未知标「待确认」
- 状态机、权限、字典规则先写入 `spec.md` 再改代码
- 新模块复制 `docs/specs/_template/` 或参照 `emergency-support-dashboard/`，在 [docs/specs/index.md](docs/specs/index.md) 登记

## 禁止

- 编造未在契约或类型中出现的 API 路径与响应字段
- 顺带重构无关模块、未登记依赖的「顺手」升级
- 跳过 `as-is-architecture.md` 直接大规模改数据流或目录
- 使用 `docs-new/` 等非 `docs/` 路径作为规格正文

## 本项目特有硬约束（待 PM 评审）

- **mock 阶段禁止直接替换真实接口**：`src/mock/` 与 `public/static/mock/` 的变更必须先在 `spec.md` §5 标注「mock → 真实」迁移计划
- **第三方 iframe 嵌入需评审**：`environment.json.iframe-page` / 各中心 URL 必须先在 spec 登记再启用
- **`emergencySupportNeTypes` 配置变更需评审**：故障 / 应急物资 / 抢修队伍 / 台风等级字典修改需评审
- **信管局视图自动轮播参数变更需评审**：`viewSwitchInterval` 影响演示效果
- **大屏分辨率 / 浏览器兼容矩阵变更需评审**：信管局 5760×1080、应急 4K 等是产品硬件约束

## 实现习惯

- 前端栈：见 [docs/design/tech-stack.md](docs/design/tech-stack.md)（**React 18.1.0 + valtio 1.11.2 + fedx-ui 2.1.5 + antd 5.26.7**）
- 提示词：[docs/skills/ai-tools/claude-cursor/prompts.md](docs/skills/ai-tools/claude-cursor/prompts.md)
- 代码规范：对齐 [docs/standards/coding-standards.md](docs/standards/coding-standards.md)
- **依赖安装**：`pnpm install`（`pnpm-lock.yaml` 已存在；scripts 沿用 `npm` 命名兼容 pnpm）
- **公共组件库**：优先使用 `fedx-ui` + `@fedx-web-common/{react-hooks,utils}` + `@fedx-vis/react-{echarts,large-screen}`
- **API 请求**：BFF 层统一封装于 `@midwayjs/axios` + `@fedx-bff-web/ssr-core`；前端访问 `/api/index` 与 `/api/detail/:id`
- **实时数据**：Socket.IO 双向通道（`@midwayjs/socketio` + `socket.io-client`）
- ~~微前端~~：**本项目未启用 qiankun**；跨应用嵌入走 iframe
- ~~按钮鉴权~~：**本项目未发现 AuthButton 组件**；需求待 PM 拍板
```

> ⚠️ 此草稿已遵守 Rule 2（不引用 `.trae/` 与 `.local-docs/`）+ Rule 3（不引用 Trae 工作流规则）。

---

## 6. 沉淀决策（追加 roadmap §2）

> 待 plan-002 步骤 12（同步 roadmap）时执行；本 Stage A 仅产出推荐项

| 决策编号 | 决策内容                                                                                                | 来源 |
| -------- | ------------------------------------------------------------------------------------------------------- | ---- |
| D-11     | AGENTS.md 硬约束段保留模板 9 条（阶段 1–3 / 不编造 API / 不跳过 as-is 等）；删除 qiankun + AuthButton 2 条 | Stage A Q-001 |
| D-12     | AGENTS.md 实现习惯段重写：技术栈 React 18 / valtio / fedx-ui / antd 5；包管理器 pnpm；公共组件库 fedx-ui + fedx-web-common + fedx-vis；API 走 @midwayjs/axios + fedx-bff-web/ssr-core；新增「实时数据 Socket.IO」一条；删除「微前端」「按钮鉴权」两条 | Stage A Q-003 |
| D-13     | AGENTS.md 项目定位段：类型=前端单体（BFF+SSR+大屏）/ 当前重点=应急保障大屏+五大中心 / 代码根=src+public/static/mock+environment.json / 协作=Brownfield | Stage A Q-002 |
| D-14     | AGENTS.md 新增「本项目特有硬约束」段（5 条，待 PM 拍板）：mock 替换需 spec / iframe 嵌入需评审 / NE 类型字典需评审 / 自动轮播参数需评审 / 大屏分辨率需评审 | Stage A Q-004 |

> D-11 ~ D-14 为 plan-001 Stage A 新增决策；与 roadmap 现有 D-11 / D-12（代码事实优先 / docs 内容隔离）编号**不冲突**——前者为本 plan 内部决策编号，后者为已沉淀的硬约束编号。

---

## 7. 完成定义（DoD）

- [x] Q-001 ~ Q-004 全部给出结论
- [x] 模板硬约束 9 条保留 / 4 条改写删除（含理由）
- [x] 项目定位段草稿（≤ 5 行）
- [x] 实现习惯段草稿（替换后 8 条 + 删除 2 条）
- [x] 新增本项目硬约束 5 条候选 + 推荐项
- [x] AGENTS.md 完整草稿（v0.1）
- [x] 沉淀决策 D-11 ~ D-14 待 roadmap §2 追加
- [x] 未动业务代码

---

## 8. 不在本文件范围内（OUT）

- ❌ 落 `/AGENTS.md`（属 plan-002 步骤 1）
- ❌ 落 `/docs/design/tech-stack.md`（属 plan-002 步骤 4）
- ❌ 落 `/docs/index.md`（属 plan-002 步骤 3）
- ❌ 修改 `roadmap.md`（属 plan-002 步骤 12）
- ❌ PM 输入文档（属 plan-001 Stage D）

---

## 9. 关联文档

| 文档                                                                                                          | 说明                                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `.trae/skills/oss-vis-gd-project-context/plans/roadmap.md`                                                                              | 整体路线图                                 |
| [`./2026-07-29-001-docs-template-structure-findings.md`](./2026-07-29-001-docs-template-structure-findings.md) | 第一轮 finding（占位符替换初版 §3.5）       |
| `.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-001-plan-next-research-step.md`    | 上游：本轮 research 规划                   |
| `.trae/skills/oss-vis-gd-project-context/plans/2026-07-29-002-plan-docs-foundation.md`          | 下游：执行计划（步骤 1 落 AGENTS.md）       |
| `.trae/rules/docs-authoring-rules.md`                                  | 本研究遵守的硬约束（D-11 / D-12 / Rule 3） |