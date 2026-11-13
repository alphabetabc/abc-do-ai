# Task · 2026-11-11-001-skeleton

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-11-001-skeleton` |
| Status | 已完成 |
| 类型 | skill / 编码 |
| 影响范围 | `docs/skeleton/`（新建）、`scripts/export-skill.mjs`、根 `AGENTS.md`、`README.md` |
| Roadmap | skeleton 随 skill 导出（会话讨论新增） |
| 验收标准 | `pnpm export:skill` 产物含可运行的 skeleton/，SKILL.md 组装流程改为基于骨架填充 |
| 前置依赖 | 无 |

---

## 目标（Goal）

在 skill 产物中加入一个大屏项目骨架（skeleton），使 AI 用 `large-screen-builder` 组装大屏时从「已配好工程壳、依赖版本与物料对齐」的骨架开始填充，而不是每次从零拼工程配置。

---

## 步骤（执行计划）

### 步骤 1：创建骨架源目录 `docs/skeleton/`

- **动作**：从仓库自身工程配置裁剪出最小骨架：package.json（依赖版本与物料站对齐：echarts 6.1.0 / antd 6.7 / swiper 11.2.10 / react 18.3）、vite.config.ts（alias `@/components` → `src/components`）、tsconfig.json、index.html、src/main.tsx、src/App.tsx（大屏缩放容器占位）、src/pages/（三段式布局 + 空 section 占位）
- **输出**：`docs/skeleton/` 目录
- **等待用户**：是（技术设计确认后动手）

### 步骤 2：修改 `export-skill.mjs` 拷入骨架

- **动作**：导出时将 `docs/skeleton/` 拷贝到 `dist-skill/large-screen-builder/skeleton/`
- **输出**：更新后的导出脚本
- **等待用户**：否

### 步骤 3：更新 SKILL.md 静态模板（export-skill.mjs 内）

- **动作**：组装流程改为「拷贝 skeleton → 从 specs/<模块>/code/ 拷贝所需物料到骨架 src/components/ → 按 spec/data-model 填充 section」，并同步检查 `docs/workflows/big-screen-assembly.md` 是否需要提及骨架
- **输出**：更新后的 SKILL.md 模板与 workflow 文档
- **等待用户**：否

### 步骤 4：验证 + 文档回填

- **动作**：跑 `pnpm export:skill` 验证产物结构；回填根 AGENTS.md 全景图与目录结构、README
- **输出**：验证通过的 dist-skill 产物 + 更新后的文档
- **等待用户**：是（硬门槛②）

---

## 背景与动机

- 当前 skill 只有 specs + workflows，AI 组装大屏时需自行解决工程配置、依赖版本、缩放容器等问题，与物料假设（精确依赖版本）易错配
- 会话讨论已确认：物料落地为**拷贝式**（AI 把用到的物料 code/ 拷进骨架，产出自包含项目）；骨架**随 skill 一起导出**

## 目标目录结构

```
docs/skeleton/                      # 骨架源（随 export:skill 拷入产物）
├── package.json                    # 依赖版本与物料站对齐（echarts 6.1.0 / antd 6.7 / swiper 11.2.10 / react 18.3）
├── vite.config.ts                  # alias：@/components → src/components
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx                     # 大屏缩放容器占位（等比缩放铺满视口）
    └── pages/
        └── screen-placeholder.tsx  # 三段式布局 + 空 section 占位（AI 往里填物料）

# 导出产物中的形态（dist-skill/large-screen-builder/skeleton/，结构与上面一致）
# AI 组装流程：拷贝 skeleton → 从 specs/<模块>/code/ 拷贝所需物料到 src/components/ → 按 spec 填充 section
```

## 功能列表

- F1：`docs/skeleton/` 骨架源（最小集，可 pnpm install 直接跑起来）
- F2：`export:skill` 产物含 `skeleton/`
- F3：SKILL.md 组装流程以骨架为起点
- F4：根 AGENTS.md / README 回填

## 不做清单

- 不做物料 npm 包化 / 发版流程
- 不在骨架里预置状态管理、路由系统、mock 数据规范（按需 AI 自加）
- 不在骨架里内置任何具体物料（保持空壳，物料按需拷入）
- 不改 `docs/materials/` 现有内容

## 非功能需求

- 骨架依赖版本必须与仓库根 package.json 对齐（物料 code/ 假设这些版本）
- 骨架可独立 `pnpm install && pnpm dev` 跑通空页面

## 验收 checklist

- [x] A1：`docs/skeleton/` 存在；`tsc -p docs/skeleton/tsconfig.json` 类型检查通过（独立 `pnpm install && pnpm dev` 运行验证按用户指示跳过，待后续人工验证）
- [x] A2：`pnpm export:skill` 后 `dist-skill/large-screen-builder/skeleton/` 结构完整（含 src/pages 占位）
- [x] A3：SKILL.md 组装流程明确「拷骨架 → 拷物料 → 填充」三步
- [x] A4：`docs/workflows/` 内文档符合「导出产物视角」路径基准（env/AGENTS.md）
- [x] A5：根 AGENTS.md 全景图/目录结构已更新且无死链接
- [x] `pnpm build` 通过（不破坏现有站点）

---

## 审批记录

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-11 | user |
| ② 实现验收 | 已通过 | 2026-11-11 | user（指示归档；P1/P2 遗留项拆至 task-002 / task-003） |

---

## 进度日志（按需追加）

### 2026-11-11

- 立项：会话讨论确认骨架用途（AI 生成大屏）、拷贝式落地、随 skill 导出三项决策
- 硬门槛①通过，开始实施
- 实施完成：`docs/skeleton/`（package.json / vite.config.ts / tsconfig.json / index.html / src/main.tsx / src/App.tsx 极简 scaleFull 缩放 / src/pages/screen-placeholder.tsx 三段式占位）；export-skill.mjs 拷入 skeleton/ 并改写 SKILL.md 构建流程为「骨架起点」；workflows/big-screen-assembly.md 步骤 0/2 补骨架提及；根 AGENTS.md 全景图与目录结构回填
- 验证：`tsc -p docs/skeleton/tsconfig.json` 通过；`pnpm export:skill` 产物含完整 skeleton/（9 文件）；主站 `pnpm build` 通过
- 骨架 vite.config.ts 的 alias 设计决策：`@/components` → src/components，且额外映射 `@/materials/components` → src/components，使物料 code/ 内跨模块别名 import 在骨架中零改写直接工作
- 用户指示跳过骨架独立 install/dev 运行验证（安装命令被环境拒绝，tsc 已覆盖类型层面）
- 修正：删掉手搓的极简缩放占位，直接拷入 scaler-container 物料（`src/components/scaler-container/`），App.tsx 挂载真 ScalerContainer——用户指出物料站有现成能力，不应重复造轮子；workflow 步骤 2 同步改为「骨架起步时此步已完成」；tsc 复验通过、skill 重新导出
- 二次重构（用户反馈「占位会误导，布局层只是能力，接入 PM inputs 业务层才是目标」）：
  - 骨架彻底去蓝图化：删除 screen-placeholder.tsx，App.tsx 只留 ScalerContainer 空容器 + 注释指引，不预设任何布局模板
  - workflow 重构为两层：第一部分布局层能力（L1 坐标系 / L2 联动 / L3 物料接入）+ 第二部分 PM inputs 流程（B1 需求结构化 → B2 开发模块 → B3 定交互 mock → B4 联调请求 → B5 整屏验收）；「真实 API 不在本工作流范围」的排除条款废除，B4 纳入范围但约束「物料层零请求，请求只写宿主编排层」
  - SKILL.md 模板与 skill description 同步为「从 PM inputs 到接好真实数据的大屏」
  - 验证：tsc / export:skill / pnpm build 全过
- 预置交互定义（用户确认「交互的定义要移动进来」）：interaction-store 物料拷入骨架 `src/components/interaction-store/`（后随联动归属调整，见下一条变更记录）；workflow 改为「骨架已预置，填字段即可」
- 多屏路由（用户确认加入 react-router）：App.tsx 改为 BrowserRouter + Routes（一屏一路径，默认重定向首屏 /home）；单屏布局下移到 `src/screens/home/index.tsx`（各屏可不同设计稿尺寸）；package.json 增 react-router-dom ^7.18.5；workflow L1 补「多屏约定」（一屏一目录一路径、屏内切换不开路由）；SKILL.md 模板同步。tsc 因 react-router-dom 未安装（用户指示不装）跳过，待骨架独立 install 时验证
- 联动归属收敛到屏（用户指出「逐个是不是就得收敛到自己的屏里面」）：删除全局 `src/interactions.ts`，单例下移到各屏目录 `src/screens/<name>/interactions.ts`；确立「联动边界 = 屏」：字段表归属各屏不跨屏共享，跨屏传参用 URL query（useSearchParams）；workflow L2 / 多屏约定 / B3 同步。export:skill 通过
- 请求封装（用户要求「骨架屏简单封装一个 fetch 到 src/api，支持 mockUrl 与 fallback」）：新建 `src/api/index.ts`（createService：USE_MOCK 开关选 mockUrl/url，GET 入参序列化 query、POST 走 body，失败且有 fallback 返回兜底并 warn，无 fallback 则 throw）+ `src/api/overview.ts`（示例 service，类型对齐 data-model 示范）；vite.config / tsconfig 补 `@/api` 别名；workflow B4 改为「骨架已预置 createService」。tsc 除 react-router-dom 未安装（用户指示不装）外全过；export:skill 通过（skeleton src 12 文件）
- USE_MOCK 生产禁用（用户指出「一定是在开发环境，生产环境禁用」）：改为 `import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false'`，生产构建恒关 + 死代码消除；workflow B4 同步
- 目录分层（用户要求「common/api + services/xxx」）：`src/api` → `src/common/api/`（请求封装）+ `src/services/home/overview.ts`（具体接口按模块分文件）；别名改 `@/common/*`，`@/components` 改目录形式（避免截住 `@/common/api`）
- environment.json 机制接入（用户给出参考项目 `public/environment.json`）：新建 `src/common/environment.ts`（initEnvironment 在 main.tsx render 前 await，getEnvironment 点路径读取）+ `public/environment.json`（预置 services.overview 示例：enableStaticData / staticData / viewPageArgs）+ `main.tsx` bootstrap 先加载配置再渲染；service 示例示范 getter 内读环境配置、enableStaticData 静态直出（对齐参考项目「反拉终端」模式）。export:skill 通过（skeleton 含 public/environment.json）

### 2026-11-11 · 外部模型设计评审（结论入档）

换模型对 skill 做设计评审，报告结论已核实。**结论：链路设计成立，但「拷贝式接入零改写」承诺在当前导出产物上未闭环。** 主要发现：

- **P0 硬缺陷（不修则承诺虚假）**：
  - D1/D2：10+ 处物料 code 依赖 `@/materials/_assets/*`，导出产物无 `_assets` 目录、别名无映射 → 相关物料拷入即 build 失败
  - D3：13 个物料 `import './index.less'`，骨架 package.json 未装 less
  - D4：示例 service `localMockUrl` 指向 `/mock/overview.json`，骨架无 `public/mock/`
  - D5：carousel-view 跨模块 import 带额外 `ui/` 与 `/code` 层级，与 L3 拷贝路径约定不一致
  - D6：interaction-store spec 写 `fields.cantCode`，实际 API 只有 `getField` → 照 spec 写会崩（spec 与 code 脱节）
- **P1 结构性缺口**：
  - B1→B2 最薄弱：PM 文字 → 坐标/物料选型无推导规则（无栅格/边距/z-index 约束，无设计稿时验收不可判定）
  - 屏清单缺 7 类字段：数据源表、资源依赖表、非联动交互清单、跨屏 query 参数表、层级表、状态降级规范、验收锚点
  - 预置边界两头越界：缺 SectionFrame 布局壳 / ErrorBoundary / mock 闭环 / types 目录约定；package.json 全量依赖与 L3「按需安装」矛盾；BrowserRouter 静态部署 404 未写约束
- **P2 纪律机器化**：三条硬纪律均为「文档纪律」（违反不失败）——建议 ESLint no-restricted-imports（物料层零请求）、内容哈希比对（只复制不改写）、脚本断言（联动边界=屏、禁 vw/rem）、**B1 产出后强制用户确认硬门槛**

→ 后续改造按 P0/P1/P2 立独立任务，本任务仅入档结论不实施。骨架设计说明落档 `design/skeleton.md`。
- **P0 缺陷修复**（用户指示在本任务内修复，未另立任务）：
  - D1/D2（_assets 缺失）：export-skill.mjs 增加导出 `docs/materials/_assets` → 产物根 `_assets/`；骨架 vite.config.ts / tsconfig.json 增别名 `@/materials/_assets` → `src/components/_assets`，拷贝约定「产物 `_assets/` 整目录拷入 `src/components/_assets/`」
  - D3（缺 less）：骨架 package.json devDependencies 增 `less@^4.9.1`（与物料站根对齐）
  - D4（无 mock 目录）：新建 `docs/skeleton/public/mock/overview.json`（形状对齐示例 service 的 converter 入参 `[{type,num}]`）
  - D5（拷贝路径层级不一致）：workflow L3 与 SKILL.md 模板重写为「按别名层级落位」规则：平铺物料 → `src/components/<模块>/`；`@/materials/components/<分组>/<模块>` → `src/components/<分组>/<模块>/`；`@/materials/_assets` → `src/components/_assets/`
  - D6（spec 与 code 脱节）：interaction-store spec.md 使用范式第 3/4 条 `fields.cantCode` 改为 `fields.getField('cantCode')`（对齐 code 实际 API）
  - 验证：export:skill 通过（_assets 随产物导出，48 模块）；`pnpm build` 通过；骨架 tsc 仅剩已知 react-router-dom 未安装报错（用户此前指示不装，待独立 install 验证）

---

## 关联

> - 相关 workflow：`scripts/export-skill.mjs`、`docs/workflows/big-screen-assembly.md`
