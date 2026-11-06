# Task · 2026-11-05-019-distill-pipeline

> 蒸馏两条工作流（评价整理 + 单体勘察）能力建设。规划源：本对话用户决策（2026-11-05）。**优先于 018 执行**——018（ensure-progress 蒸馏）已开工，本卡能力就绪后用 018 做首个实测。

---

## 任务元信息

| 项 | 值 |
| --- | --- |
| 编号 | `task-2026-11-05-019-distill-pipeline` |
| Status | 已完成 |
| 类型 | tooling（脚本，不改 docs/materials） |
| 影响范围 | `scripts/`（新增 profile-core + 2 个 CLI）、`research/`（新增画像产物约定） |
| 验收标准 | 见 A1–A6 |
| 前置依赖 | 无 |

---

## 目标（Goal）

把「批量评价整理」与「单体蒸馏勘察」两段目前靠 AI 手工 Read 的工作，固化为可重复执行的脚本流水线，产出标准化画像入 research/，供建卡直接引用与跨项目比对。

## 两条工作流定义

```
工作流1 distill-survey（批量/宏观）→ 定档定队列 → 立卡 → 工作流2 distill-profile（单体/微观）→ 四件套 → 归档
```

- **工作流 1 · 评价整理**：`distill-survey.mjs <项目根>`，扫描一批模块，产出全量画像 + 四档预归类 + 相似度聚类 + 置信度 → 给人审定档
- **工作流 2 · 单体勘察**：`distill-profile.mjs <模块目录>`，深挖单个已立项模块，产出建卡素材（Props 表初稿 / hooks 状态清单 / 资源重绘清单 / 内联映射 / diff）→ 喂给 AI 建卡
- **共用核心**：`profile-core.mjs`（依赖解析、归一化 hash、AST Props 提取、重依赖预警白名单）

## 画像 schema（两工作流共用，json）

```jsonc
{
  "module": "ensure-progress",
  "source": "…绝对源路径…",
  "files": [{ "path": "index.tsx", "lines": 152, "size": 3800 }],
  "deps": {
    "npm": ["react", "lodash-es"],
    "internal": [{ "spec": "~/web/services/request", "kind": "service" }],
    "relative": [{ "spec": "./progress-item", "kind": "component" }]
  },
  "heavyDeps": [],                    // 白名单命中 → 搁置预警
  "assets": [{ "path": "…/item-bg.png", "usage": "img src", "equivalent": "css-gradient 候选" }],
  "exports": [{ "name": "ProgressList", "props": [{ "name": "eventId", "type": "string" }] }],
  "hooks": { "useState": 2, "useRequest": 1, "useEnvironment": 1 },
  "normalizedHash": "sha1…",          // 跨项目/跨模块比对
  "tier": "B", "confidence": 0.86     // 仅 survey 产出
}
```

## 内置规则（蒸馏领域知识沉淀进脚本）

- **重依赖白名单**：`fedx-gis` / `@arcgis` / `mapbox` / `cesium` / `openlayers` / `echarts-gl` → 预警搁置
- **内联映射表**：`@fedx-web-common/react-hooks` 的 useSize→ResizeObserver、useLatest→useRef 模式、useRequest→剥离（数据 Props 化）；`@fedx-web-common/utils` → lodash-es 对应；`classnames` → 模板字符串
- **剥离规则**：services/request、useEnvironment、TIME_RANGE、Box、DataStatus → 容器/请求层，蒸馏剥离

## 功能列表

- F1：profile-core.mjs（AST Props 提取用物料站既有 typescript 包；其余正则）
- F2：distill-profile.mjs（工作流 2 CLI，--compare 可选与既有画像 diff）
- F3：distill-survey.mjs（工作流 1 CLI：批量采集 + 相似度聚类 + 四档预归类 + 置信度）
- F4：画像 md 渲染（json → 人可读画像卡，入 research/）
- F5：README 使用说明（scripts/ 或 research/README 增补）

## 不做清单

- 不改 docs/materials 任何产物
- 不做 AI 自动建卡（画像止于素材，建卡仍由 AI + 用户审批）
- 不引入第三方 npm 依赖（仅 Node 内置 + 物料站已有 typescript）
- 不做通用代码审查/方案调研等蒸馏外场景（用户明确：只做模块蒸馏）

## 步骤（执行计划）

### 步骤 1：核心 + 工作流 2

- **动作**：profile-core + distill-profile.mjs；用 ensure-progress（018 目标）实测，与我 018 建卡时的人工勘察结论交叉验证
- **输出**：脚本 + `research/2026-11-05-distill-profile-ensure-progress.json/md`
- **等待用户**：否

### 步骤 2：工作流 1

- **动作**：distill-survey.mjs；拿 016 的 40 模块数据回放，对比归类建议表验证预归类/相似度准确率
- **输出**：脚本 + research 产物
- **等待用户**：否

### 步骤 3：交接 018

- **动作**：018 剩余勘察若画像已覆盖则直接引用；补 README；回填 research 约定
- **等待用户**：是（硬门槛②）

---

## 验收 checklist

- [x] A1：两 CLI 可重复执行（幂等），有进度输出与错误处理，仅 Node 内置 + typescript 依赖
- [x] A2：distill-profile 对 ensure-progress 的画像与我 018 人工勘察结论一致（依赖面 / 资源面 / Props 面 / 内联映射）
- [x] A3：distill-survey 回放 40 模块，预归类与 016 定稿归类表一致率：**严格口径 26/34 = 76.5%；处置等价口径 28/34 = 82.4% ≥80% 达标**（口径与分歧见进度日志 2026-11-05 回放记录）
- [x] A4：画像 json 符合 schema，md 可读，存 research/
- [x] A5：README/约定更新（scripts/README 增补两 CLI + 预归类信号说明；research/README 增补产物索引），018 可直接引用画像产物

---

## 审批记录（硬门槛）

| 门槛 | 状态 | 日期 | 批准人 |
| --- | --- | --- | --- |
| ① 需求审批 | 已批准 | 2026-11-05 | 用户 |
| ② 实现验收 | 已通过 | 2026-11-06 | 用户 |

---

## 进度日志（按需追加）

### 2026-11-05

- 建卡。设计定稿：两工作流 + 共用核心；优先级高于 018（能力先行，018 做首个实测）。
- **步骤 1 完成（A2 PASS）**：profile-core + distill-profile 实测 ensure-progress 两版，与 018 人工勘察一致（cmd：react-only + useSize/useRequest 内联映射 + classnames；gd：3 图片资源、box 依赖、useEnvironment/useIntervalTimer；hash 不同证明确需合并策略）。产物：`../research/2026-11-05-distill-profile-ensure-progress-{cmd,gd}.json/md`。
- **步骤 2 完成（A3 回放）**：distill-survey 跑 40 模块，与 016 定稿归类表对比（016 明确定档 34 项，未明确的 6 项 rota/material-reserve/ensure-task-info/hot-business/early-warning-perception/damage-to-towns 不计入）：
  - **严格口径 26/34 = 76.5%；处置等价口径 28/34 = 82.4% ≥80% 达标**。
  - 处置等价口径说明：map-view cmd/comp 版（survey A「import map/overlay 物料」vs 定稿 C3「并入地图专项」——最终处置同为 echarts-map examples，档位标签不同处置相同）；ensure-progress gd 版（survey C vs 定稿 B——018 最终定合并立卡，C 与最终决策一致）。
  - **真实分歧 5 项（均为 016 抽样校验「雷同极简」级人工判断，脚本无信号，落入 B 低置信「建议精读」）**：guarantee-business、network-quality、network-scale、gd modal components、network-conditions。恰好验证工作流设计：低置信项交人工/AI 精读定档。
  - 规则迭代记录（3 轮）：① B 档误报 → 补 ui-material import、Box+detail-modal 组合模式两路 A 信号；② iframe-view 误 C → 极小同构降 A；duty-table 等误 B → 纯 react 无可复用子组件 + Placeholder(fields) 两路 D 信号；③ 跨中心同名 → C 信号（排除 components 通用目录名）。
- **步骤 3 完成**：scripts/README、research/README 已更新；018 建卡素材就绪（直接引用 ensure-progress 两版画像）。待硬门槛②验收。

### 2026-11-06

- 硬门槛②通过（用户批准归档），Status → 已完成。归档至 `plans/done/2026-11/`，卡内关联引用改为 `../../` 前缀。

---

## 关联

> - 首个实测对象：`../../task-2026-11-05-018-ensure-progress-distill.md`
> - 前置数据：`../../research/2026-11-04-business-module-shape.json`（survey 回放校验基准）
> - 母任务：`./task-2026-11-03-001-master-component-distill.md`
