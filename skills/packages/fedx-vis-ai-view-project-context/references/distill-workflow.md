# 蒸馏工作流（distill-workflow）

> 把外部项目源码提炼为物料站四件套（manifest / spec / data-model / code / examples）的完整方法论。脚本层实现见 `../scripts/README.md`；本文件是流程与规则的权威描述，新会话/新同事接手从这里读起。

---

## 1. 全景

```
源项目
  │
  ▼
工作流 1 · 批量评价（distill-core/survey.mjs）
  扫描一批模块 → 画像 + 四档预归类 + 相似度聚类 → 直接入库 research/materials.db
  │
  ▼ 工作流 2 · 单体勘察前置（distill-core/profile.mjs <模块路径 | survey-id>）
  对低置信档（尤其 B 档）先深挖：deps/hooks/exports/需内联点 → module_profile 表 + stdout 视图
  → 产出「蒸 / 不蒸」建议 + 依据（2026-11-06 顺序修正，原「立卡后勘察」改为「立卡前勘察」）
  │
  ▼ 人工审定（硬门槛：定档定终态，A/D 档结论当场落库，见 §5.1）
  队列 / 立卡（plans/，过硬门槛①；只为确认要蒸的模块立卡；立卡前先跑 sync-status.mjs）
  │
  ▼
四件套产出（docs/materials/<模块>/）→ pnpm build + dev:preview 验证
  │
  ▼ 硬门槛②（用户验收）
台账回填 / current-sprint 更新 / sync-status.mjs 对账 / 归档 done/<YYYY-MM>/
```

数据层为 `research/materials.db`（SQLite 单库，见 `../research/README.md`）；蒸馏工作流唯一入口是 `../scripts/distill-core/`（survey / profile / sync-status / query，分析能力统一来自其内 `profile-core.mjs`，2026-11-06 task-034 收敛，禁止重写分析能力）。json 日期快照与 temp/ 模式均已退役。

## 2. 四档处置口径（survey 预归类 → 人工审定）

| 档 | 判定信号（置信度递减） | 处置 |
| --- | --- | --- |
| A · 已覆盖 | 与已蒸馏物料同名；import ≥2 个已蒸馏 ui 物料；Box+detail-modal 组合模式；极小同构 | 不蒸馏；典型形态补对应物料 examples/ |
| B · 独立物料 | 有独立可复用 UI 结构（其余默认，**低置信：定档前必须先跑 profile 精读，勘察结论作为立卡/放弃依据，见 §1 顺序**） | 精读确认后立卡蒸馏，category=business |
| C · 多版本形态 | 相似度 ≥0.8 且体量足够；跨中心同名多版本 | 合并蒸馏成一个物料，差异走 Props/examples |
| D · 搁置 | 重依赖白名单命中（fedx-gis/@arcgis/mapbox/cesium/openlayers/echarts-gl）；纯 react 无可复用子组件/Placeholder | 台账标记理由，不做 |

## 3. 零依赖蒸馏规则（内联映射）

历史卡（003–015、018、020）沉淀的等价改写，产出 code/ 时必须遵守：

| 源依赖 | 蒸馏处置 |
| --- | --- |
| `antd` 组件（Progress 等） | div + CSS 重实现（只做源码实际用到的能力子集） |
| `styled-components` | 静态样式进 less；动态色走内联 style |
| `d3`（color / scaleLinear / max） | 模块内内联（hex/rgb 解析 + clamp 线性映射） |
| `classnames` | 模板字符串 |
| `@fedx-web-common/utils`（isEmpty/cloneDeep/isUndefined…） | lodash-es（物料站既有依赖，可直接 import） |
| `@fedx-web-common/react-hooks` | useSize→ResizeObserver；useLatest→useRef 模式；useMemorizedObject→useMemo |
| `useRequest` / services/request | 剥离，数据 Props 化（examples 提供 mock） |
| `useEnvironment` / `TIME_RANGE` / `Box` / `DataStatus` | 容器/请求层，剥离（DataStatus 需要时内联状态壳） |
| 跨模块组件（如 digital-flop 被 column-3d 引用） | 模块内内联，禁止跨物料 import |
| `LinearTextGradient`（min.js 闭源产物） | CSS `linear-gradient + background-clip: text` |
| `echarts` / `echarts-for-react` / `swiper` 等 | 直接依赖允许（与物料站一致），先核对版本兼容 |
| 字体文件（DIN / DingTalk 等） | 不分发，仅 CSS font-family 声明 |

**不变式**：零新 npm 依赖（除非物料站已有）、不跨模块 import、不新增 Props（保持源 Props 面）、不分发静态资源（图片给 CSS 等价候选）。

## 4. 四件套规范

- `manifest.json`：name / description / tags / category（取自 AGENTS.md 分类词表，先补词表再用新类）
- `spec.md`：为什么存在、Props 表（与 code 实际接口一致）、交互与动画说明、零依赖声明
- `data-model.md`：Props 类型、边界行为（如 percent clamp）、内联实现契约
- `code/`：可直接 import 运行；tsc strict 通过
- `examples/`：每文件一个示例，default export，自带 mock，覆盖基础 / 定制 / 动态三类

## 5. 验证与归档

1. `pnpm build`（tsc + vite 全量）
2. `pnpm dev:preview` 浏览器实测：渲染形态、动画、**console 无 error**
3. 硬门槛②通过后：台账「备注」列回填 → current-sprint 移除索引 → 归档 `plans/done/<YYYY-MM>/`，卡内引用改 `../../`
4. 机器产物（画像/对比）入 `../research/`，任务卡只写结论；research 产物跨项目保留，供下次 survey `--compare` 比对相似模块

### 5.1 db 终态回填清单（归档前必走，2026-11-06 收口教训固化）

`sync-status` 只回填「能对账到同名物料」的行，且**跳过人工决策态**（queued / shelved / enhanced）——对账 ≠ 回填。因此归档时必须人工把 db 改到终态：

- [ ] 蒸馏交付：`queued` → `distilled`，写 `matched_material`（decided_by 标明来源卡）
- [ ] 关卡不蒸馏（A 已覆盖 / D 搁置 / 精读后放弃）：→ `shelved`，`reason` 写结论与依据卡号；可核实到物料的写 `matched_material`（如 A 档 iframe-view → ui-iframe-loader）
- [ ] A 档「补 examples」下沉：reason 写明目标物料与 example 文件（如 019 info-card → echarts-map example）
- [ ] 终态断言：该源项目全表 `not-started = 0` 且 `queued = 0`（每行要么 distilled 要么 shelved+reason）

> A/D 档结论的落库时机：定档人工审定时或立卡/关卡时，**最迟不得晚于归档**。禁止只改 plans 不改 db——db 是唯一状态事实源。

## 6. 历史实践索引

| 模式 | 卡 |
| --- | --- |
| 零依赖内联先例（d3/classnames） | done/2026-11/task-2026-11-03-011-column-3d-distill.md |
| antd Progress → div+CSS | done/2026-11/task-2026-11-03-012-progress-bar-distill.md |
| echarts 物料（含 gl 兼容验证） | done/2026-11/task-2026-11-04-013~015 |
| 依赖白名单放行（echarts-gl 实测共存） | done/2026-11/task-2026-11-04-015-pie-3d-distill.md |
| 业务模块（A 档 examples 化） | done/2026-11/task-2026-11-05-018/020 |
| B 档独立物料（业务 section 直蒸馏） | done/2026-11/task-2026-11-06-029/030 |
| 极小同构双版合并为 ui 物料（差异走 Props） | done/2026-11/task-2026-11-06-023/024（network-quality + network-scale → ui-indicator-carousel） |
| 精读后放弃（容器+请求层为主 / 模式级无独立结构） | done/2026-11/task-2026-11-06-031/032 |
| db 收敛（materials.db 唯一事实源 + 脚本唯一入口） | done/2026-11/task-2026-11-06-033/034 |
| db 终态回填遗漏教训（sync 跳过人工态，归档必须人工落终态） | epic 001 收口（2026-11-06，见 §5.1） |
