# mvp · Schema 驱动的运行时大屏（设计草案）

> 状态：**草案，未冻结**。依据：领导（金博）MVP 要求 + 2026-11-11 三轮对话澄清。
> 上游文档：[vision.md](../vision.md) / [architecture.md](../architecture.md) / [skeleton.md](../skeleton.md)

---

## 0. 结论先行

领导要的 MVP 不是「AI 生成一个大屏工程」，而是**一套运行时**：输入（自然语言 / 引导页参数）产出 **Schema**，渲染器按 Schema 从物料库装配组件，还原出一块带基础联动的大屏。

这决定了本仓库要同时服务**两条消费路径**，共用同一批物料：

| | 路径 A · 复制二开（现状） | 路径 B · Schema 装载（MVP 新增） |
| --- | --- | --- |
| 产物 | 可编辑的工程（tsx 源码落进宿主项目） | 可配置的实例（JSON 描述，代码在运行时装配） |
| 定制方式 | 复制后直接改代码 | 只能改 props / 配置，组件内部不可改 |
| 能力天花板 | AI 的编码能力 | 物料的 props 表达能力 |
| 定制成本位置 | 改一处，只影响当前屏 | 改物料，影响所有引用该物料的屏 |
| 复用性 | 低（每块屏各自演进） | 高（一次改库、全量生效） |
| 适用 | 长尾、一次性、强定制 | 标准件、批量、可回归 |

两条路径不是替代关系。路径 A 是我们的现有优势和兜底能力，路径 B 是领导要验证的方向。**MVP 只验证 B 的闭环，不要求 B 覆盖 A 的全部场景。**

---

## 1. 术语与关系

| 术语 | 定义 | 现有对应物 |
| --- | --- | --- |
| 物料 | 可被装配的最小可视单元，含源码 + 规格 + **配置契约** | `docs/materials/<分组>/<模块>/` |
| 模板 | 一份预填好的完整 Schema（画布 + 布局 + 组件清单），是「以终为始」的终态 | 暂无；屏清单 md 是它的自然语言前身 |
| Schema | 大屏的机器可执行描述（JSON），渲染器的唯一输入 | 暂无 |
| 渲染器 | 读 Schema → 查注册表 → 装配组件 → 还原大屏 | 暂无；`docs/skeleton/` 具备全部底层能力 |
| SDK | **加载 Schema 的入口**（一个 `<Renderer schema={...}/>` 或一个 URL 参数），不是平台能力 | 暂无 |

四者关系一句话：

```
模板 = 预填的 Schema
物料 = Schema 里 type 的取值域
SDK  = 加载 Schema 的入口
```

推论：Schema 里出现的 `type` 必须能在物料库查到，否则渲染器只能降级为占位。**物料覆盖度直接决定模板能否拼出来**——这正是 9 个组件（task-008 后：6 新 3 旧 + gauge / digital-flop 扩充）演示要验证的边界。

---

## 2. 分层架构

```text
【运行时链路】
  输入层                 Schema                   渲染器                     大屏
  自然语言对话  ─┐        画布 / 分区 / 联动       注册表查询                   9 个组件
  引导页参数    ─┴──►     （唯一输入）      ──►    定位 · 数据 · 联动   ──►     基础交互
                                                      ▲
                                                      │ 按 type 取组件
                                                  物料库
                                                  （3 旧 + 4 新）
                                                      ▲
【生产链路】                                            │ 入库
                                       自然语言建组件 ──┘
```

两条链路必须都成立，演示才算闭环：**光有渲染器没有新料，只能证明「能复用」；光有建组件没有入库，Schema 引用不到。**

---

## 3. Schema 草案

### 3.1 结构

```json
{
  "version": "0.1",
  "canvas": {
    "width": 1920,
    "height": 1080,
    "mode": "scaleFull",
    "background": "#0b1020",
    "backgroundImage": "/static/bg.svg"
  },
  "interactions": [
    { "name": "region", "value": "region", "default": "210100" }
  ],
  "sections": [
    {
      "id": "map",
      "type": "echarts-map",
      "layout": { "x": 560, "y": 120, "w": 800, "h": 760 },
      "frame": { "title": "区域分布" },
      "props": { "map": "china" },
      "data": { "url": "/mock/overview.json", "pick": "mapSeries" },
      "events": [{ "on": "regionClick", "dispatch": "region" }],
      "subscribe": []
    },
    {
      "id": "left-indicator",
      "type": "indicator-view",
      "layout": { "x": 40, "y": 120, "w": 460, "h": 300 },
      "frame": { "title": "指标概览" },
      "props": {},
      "data": { "inline": { "items": [] } },
      "events": [],
      "subscribe": ["region"]
    }
  ]
}
```

### 3.2 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `version` | 是 | Schema 版本，渲染器据此做兼容判断 |
| `canvas` | 是 | 设计稿尺寸、缩放模式（映射 `ScalerContainer` 的三个 Props）、背景色 + 背景图 `backgroundImage`（URL，整图背景 100% 拉伸，图在色上） |
| `interactions` | 否 | 屏内联动字段表（映射 `defineFields`）；字段项为 `{ name, value?, default? }`——`name` 是 `events.dispatch` / `subscribe` 引用的语义名，`value` 是 runtime 存储键（缺省同 `name`），`default` 是未派发前的兜底初值；缺省表示无联动 |
| `sections[].id` | 是 | 屏内唯一，用于定位错误与占位 |
| `sections[].type` | 是 | 物料库的运行时标识，**不是 UI 标题** |
| `sections[].frame` | 否 | 视觉壳声明（`title` / `extra`），由 Renderer 内置极简壳渲染；不写则无壳 |
| `sections[].layout` | 是 | 设计稿像素坐标，由 `SectionFrame` 绝对定位 |
| `sections[].props` | 否 | 透传物料的静态配置项，取值域由物料配置契约约束 |
| `sections[].data` | 否 | 数据声明。MVP 仅两种：`inline` 直接内联、`url` 由渲染器 fetch（`pick` 取子路径）；**不接**宿主 `common/api` 的 service 体系 |
| `sections[].events` | 否 | 组件回调 → 联动字段派发；`on` 必须命中物料 `runtime.events[].name` |
| `sections[].subscribe` | 否 | 订阅的联动字段，变化时作为 props 注入组件 |

### 3.3 设计约束（三条硬线）

1. **Schema 只声明、不执行逻辑。** 不出现表达式、脚本、条件分支。需要逻辑就下沉到物料的 props 语义或 `transform` 的命名实现。
2. **数据与 props 分离。** `data` 由编排层（渲染器）拉取并经 props 下发，物料层零请求——沿用现有硬纪律。
3. **联动只走字段表。** 不引入第二个事件总线，复用 `interaction-store`，联动边界仍是「屏」。

> 未定项：`transform` 是「宿主工程里的具名函数」还是「Schema 侧声明式映射」，MVP 建议先用具名函数（实现成本最低），后续再评估。

---

## 4. 物料配置契约

路径 B 的物料必须多一层机器可读描述，否则 AI 无法生成合法 Schema、渲染器无法校验。

在现有 `manifest.json` 上增加**可选** `runtime` 块（路径 A 不读它，零影响）：

```json
{
  "name": "IndicatorView 指标卡组",
  "category": "indicator",
  "description": "…",
  "tags": ["indicator", "指标卡"],
  "runtime": {
    "schemaable": true,
    "type": "indicator-view",
    "dataContract": "IndicatorItem[]",
    "propsContract": {
      "title": { "type": "string", "required": true },
      "dataSource": { "type": "array", "required": true },
      "indItemWidth": { "type": "number", "default": 370 }
    },
    "events": [
      { "name": "onClick", "payload": "IndicatorItem", "description": "指标卡点击" }
    ],
    "constraints": [
      "禁止 import 渲染器的 ScalerContext；需要缩放时读保留 prop __scale",
      "不接收 sectionEvent 之外的全局状态；联动值只经 subscribe 注入"
    ]
  }
}
```

判定规则：

- 无 `runtime` 或 `schemaable: false` → 只能走路径 A，渲染器不索引，skill 也不推荐。
- `schemaable: true` → 必须同时具备 `type`、`propsContract`、`dataContract`、`constraints`，否则视为契约不完整。
- `propsContract` 只列**配置项**（即 `sections[].props` 的白名单），数据经 `data` / `dataSource` 下发；回调不写进 propsContract。
- `events[]` 条目为 `{ name, payload, description }`：`name` 是组件回调 prop 名（`sections[].events[].on` 必须命中），`payload` 是载荷结构（供 AI 写 `pick` 路径），无回调的物料写空数组。
- `constraints` 是固定两条通用约束，审查物料时按此判定（不得依赖渲染器内部 Context / 全局状态）。
- `type` 在全局唯一；registry 一致性由 `pnpm check:material-registry` 校验：registry 键必须在某个 manifest 的 `runtime.type` 存在（`placeholder-*` 占位豁免）；`schemaable` 但未注册为**错误**（004 已完成 7 组件接入）。

---

## 5. 渲染器设计

### 5.1 职责映射（复用现有资产，不重写）

> **2026-11-12 更新**：下列能力**复制**进 `packages/screen-renderer`（跨 bundle 无法共享组件实例），骨架中保留原件供路径 A 使用。详见 8.5。

| 渲染器职责 | 复用的现有能力 | 缺什么 |
| --- | --- | --- |
| 画布与缩放 | `skeleton` 的 `ScalerContainer`（`canvas` → 三个 Props） | 由 Schema 驱动而非硬编码 |
| 分区定位与错误隔离 | `SectionFrame`（内置坐标 + loading/error + `ErrorBoundary`） | 由 `sections[].layout` 填充 |
| 视觉外壳 | `ui-widget-shell`（标题栏 / 边框 / 皮肤） | Schema 模式改为 Renderer 内置极简壳（`section.frame`）；路径 A 仍套 `ui-widget-shell`（见 8.3 修订） |
| 联动 | `interaction-store`（`defineFields` / `useDispatch` / `useSubscribe`） | 由 `interactions` 与 `events/subscribe` 驱动 |
| 数据 | 无（渲染器包内不能 import 骨架 `common/api`） | **新增：`data.inline` / `data.url` 两种最小实现** |
| 组件查找 | 无 | **新增：注册表（宿主传入）** |
| 物料装载 | 无 | **新增：静态注册（MVP 不做运行时加载）** |

### 5.2 运行时流程

1. 校验 Schema 版本与必填字段，失败即整屏错误页（不静默降级）。
2. 建联动单例，按 `interactions` 填充字段表。
3. 遍历 `sections`：查注册表 → 命中则装配，未命中渲染占位并标注 `id` 与 `type`。
4. 按 `sections[].data` 取数：`inline` 直接使用、`url` 走 fetch 并按 `pick` 取子路径；不接 `common/api` 的 service 体系。
5. 把 `props` + 数据 + 订阅字段合并后下发给组件；组件回调按 `events` 派发。
6. 单 section 异常由 `ErrorBoundary` 隔离，不白屏。

### 5.3 宿主集成约定：React 单实例（2026-11-13）

IIFE 产物 external 了 `react` / `react-dom`，运行时从 `window.React` / `window.ReactDOM` 取；物料组件由宿主工程打包，天然使用宿主自己的 React。**两份 React 会让物料里的 hooks 与渲染器 reconciler 的 dispatcher 不匹配**（`Invalid hook call`）。

约定：宿主在加载 IIFE 产物**之前**，把自己这份 React / ReactDOM（含 `createRoot`）注入全局；再动态 `script` 加载渲染器。骨架的实现是 `src/components/schema-screen/boot.ts`（幂等注入，多路由实例共用），`index.html` 不静态引 vendor 脚本。

> 已知边界：这要求宿主与渲染器的 React **主版本一致**；MVP 固定 React 18，升级需同步两端。

---

## 6. 物料生产与入库（4 个新组件）

| 步 | 动作 | 产出 |
| --- | --- | --- |
| 1 | 自然语言描述目标组件 | 组件需求（业务职责 + 数据形状 + 交互） |
| 2 | 生成组件源码 | `code/*.tsx`（自包含、可运行） |
| 3 | 补规格 | `spec.md` / `data-model.md` / `examples/` |
| 4 | 补配置契约 | `manifest.json` 的 `runtime` 块 |
| 5 | 入库并被注册表索引 | 可被 Schema 引用 |

与现有蒸馏流程的差别只在第 4 步：**没有 `runtime` 块，物料就只对路径 A 可见。** 这是路径 B 唯一的增量成本，也是它「只能配置、不能二开」的代价所在。

---

## 7. MVP 边界

### 7.1 做

- 一块 7 组件大屏：4 个新建（入库后可引用）+ 3 个已有
- 引导页：宽高、分辨率、布局、主色等基础参数 → `canvas`
- 自然语言 → Schema 的最小提示词约束
- 渲染器装配 + 一处基础联动（点地图 → 左右指标变化）
- 一份「目标大屏」的 Schema 样例，作为模板种子

### 7.2 不做

- 平台化能力：多租户、权限、版本管理、Schema 在线编辑器
- 组件在线可视化配置面板（用 JSON / 表单最简形态）
- 跨屏传参、轮巡、主题切换等增强交互
- 物料覆盖全量组件（只保证演示所需的 9 个）
- 骨架项目二次开发（改为 Schema 为入口，见 8.3 拍板②）

### 7.3 演示脚本（对齐领导验收）

1. 引导页填参数 → 得到画布
2. 自然语言描述 4 个组件 → 入库
3. 生成 / 套用模板 → 得到完整 Schema
4. 渲染器加载 → 出 7 组件大屏
5. 点地图区域 → 左右指标随联动字段变化

---

## 8. 与现有资产的关系

### 8.1 保留

- `docs/materials/` 四件套与蒸馏流程：路径 A 完全不受影响
- `ScalerContainer` / `SectionFrame` / `ErrorBoundary` / `interaction-store`：复制进渲染器包内复用；`common/api` **不复用**（跨 bundle 无法 import，取数改由 `data.inline` / `data.url` 自理）
- `docs/skeleton/`：Schema 模式工程壳，随 skill 导出（定位见 8.2；源码屏与编排壳宿主复制件已删，编排壳内置于渲染器 IIFE）

### 8.2 定位调整

- `docs/skeleton/` 定位为**发布产物**（路径 B 的渲染器宿主工程壳）：入口 / 路由（HashRouter，一屏 = `src/screens/<name>/index.tsx` + App 一条 Route，屏组件内声明 schemaUrl）/ `components/materials/registry` / renderer 接入 / 别名，**不含演示物料**（registry 出厂为空、无演示 schema）
- `apps/playground/`（`@fedx/playground`，pnpm workspace 子包）是**研发验证回路**：与 skeleton 工程壳逐字节镜像（`pnpm check:skeleton-mirror` 校验 17 个共有文件），额外持有 9 个演示物料 + `home.schema.json` + mock 作端到端验证；在此发现问题先反哺 `docs/` 再 `export:skill`，不随 skill 导出
- 骨架源码屏（`screens/home/` 源码版）与 `scaler-container` / `section-frame` / `interaction-store` 宿主侧复制件已删除（编排壳内置于渲染器 IIFE）
- 物料站的价值从「供源码拷贝」扩展为「供源码拷贝 + 供配置契约」
- `large-screen-builder` skill 的职责扩展为两条：教 AI 复制物料搭屏（A）、约束 AI 生成合法 Schema（B）

### 8.3 已拍板事项（2026-11-11）

| # | 事项 | 结论 | 说明 |
| --- | --- | --- | --- |
| ① | 领导要求「表头 / 切换按钮等能力下沉到组件内部」 | **不采纳，沿用现有编排套壳方案**（`SectionFrame` 管定位与兜底、`ui-widget-shell` 管视觉） | 用户拍板：该要求源于对实现细节的误解，按现行分工不变 |
| ② | 「摒弃骨架项目二次开发」 | **不基于骨架做二次开发，改为以 Schema 为入口** | 骨架只作为渲染器宿主，业务全部进 Schema |
| ③ | 「暂不含 SDK」 | **SDK 定位为 Schema 的加载入口**，形态极薄 | 不做也可演示；做也只是 `<Renderer schema>` 或 URL 参数 |

> 2026-11-12 修订：渲染器独立成包后无法引用骨架的 `ui-widget-shell`。Schema 模式的视觉壳改为 `section.frame` + Renderer 内置极简壳；路径 A（复制二开）不变，仍套 `ui-widget-shell`。
> 2026-11-13 边界澄清：MVP 渲染器**暂不消费 `section.frame`**（types.ts 已注明「002 扩展」），标题/extra 由物料自身 props（如 `screen-title.title`、`rank-list.title`）承载；`section.frame` 字段留作 002 的壳声明扩展位，渲染器收到不报错也不渲染壳。

### 8.4 领导认可后的两条生产线（2026-11-11 二次确认）

领导认可「Hermes 按 skill 规则生成 Schema → 页面渲染」的主流程，并明确划出两条产出线：

| 维度 | 组件线（物料生产） | 页面线（大屏搭建） |
| --- | --- | --- |
| 产出物 | **代码**（tsx 实现） | **JSON**（schema 文件） |
| 生效时机 | 构建期，必须重新打包 | 运行时，导入即生效 |
| 谁来做 | 开发写 + 评审 | Hermes / 业务方填写 |
| 变更影响 | 所有引用该物料的屏 | 仅当前这一块屏 |
| 迭代频率 | 低、重 | 高、轻 |

由此得出三条执行约束：

1. **组件少而稳、Schema 多而活**——组件变更的回归面远大于 Schema。
2. **加了组件必须重新打包**，这是静态注册的固有成本，MVP 接受。
3. **Schema 需作为资产管理**：入版本库、可 diff、可评审、可回滚，避免散落在聊天记录和本地文件里。

> 缺口：`large-screen-builder` skill 目前只有「输出工程代码」的规则，需新增「Schema 模式」——Schema 结构规范、可用 type 清单、每个物料的 props 契约、以及「只能引用清单内 type」的硬约束。否则 Hermes 会按旧流程去拷骨架、写 tsx。

### 8.5 工程结构与分发（2026-11-12 定稿）

#### 总目标四条

1. **渲染器产出一个 SDK**：`packages/screen-renderer` 构建为 IIFE 产物，全局名 `ScreenRenderer`。
2. **骨架使用 SDK**：骨架只提供 `registry`（物料映射）与 `schemaUrl`，渲染逻辑不在骨架里。
3. **skill 负责让 AI 完成 schema 或物料开发**：两种产出模式，节奏不同（见下表）。
4. **导出时随带 SDK 产物**：`export:skill` 先 `build:renderer`，再把 `dist` 拷进 `skeleton/public/vendors/`，保证隔离环境自包含。

#### 运行环境前提

真正跑起来的地方是 **Hermes 环境**，它不知道本仓库上下文：没有 workspace、没有 `packages/`、没有根 `node_modules`。因此导出产物必须自包含，骨架 `package.json` 中不得出现 `workspace:*`。

#### 目录与分发

```text
packages/screen-renderer/                 开发、构建、自测均在此
├── src/
│   ├── types.ts / registry.ts / renderer.tsx / index.ts
│   └── scaler-container/ + section-frame/ + error-boundary/ + missing-section/
└── dist/
    ├── screen-renderer.js                IIFE，全局 ScreenRenderer
    └── index.d.ts

apps/playground/                          研发验证回路（@fedx/playground，workspace 子包）
├── public/
│   ├── vendors/screen-renderer/          build:renderer / dev 启动时自动从 dist 同步
│   ├── schemas/home.schema.json          演示屏 schema
│   └── mock/ + static/                   演示数据与 geojson
├── src/
│   ├── components/materials/             9 个演示物料 + registry.tsx（check:material-registry 校验目标）
│   ├── components/schema-screen/         与 skeleton 同版（index.tsx + boot.ts）
│   ├── screens/home/index.tsx            演示屏（包 SchemaScreen）
│   └── App.tsx / main.tsx / common/ …    与 skeleton 逐字节镜像（check:skeleton-mirror）
└── scripts/                              check-discipline / check-materials（断言演示物料）

docs/skeleton/                            发布产物（export:skill 拷入 skill），不含演示物料
├── public/
│   └── vendors/screen-renderer/          build:renderer / dev 启动时自动从 dist 同步
├── src/
│   ├── components/
│   │   ├── schema-screen/                index.tsx（屏组件，create→fetch→setSchema，失败错误占位）+ boot.ts（React 全局注入 + 动态加载 IIFE）
│   │   ├── materials/registry.tsx        空注册表（宿主按物料 runtime.type 注册）
│   │   └── error-boundary/
│   ├── screens/home/index.tsx            出厂屏模板（包 SchemaScreen，schemaUrl 指向宿主放入的 schema）
│   ├── common/                           environment + api
│   └── main.tsx / App.tsx                纯 React 入口 + HashRouter（一屏一条 Route，不内联 element）
└── （schema 放 public/schemas/，由宿主按屏清单提供）
```

#### 关键约束

| 约束 | 原因 |
| --- | --- |
| 产物格式 IIFE，`name: 'ScreenRenderer'` | 宿主用 `<script>` 加载，不参与骨架构建 |
| `react` / `react-dom` / `react-dom/client` external → `window.React` / `window.ReactDOM` | 避免双实例导致 `Invalid hook call`；`react-dom/client` 是独立 specifier，必须一并映射，否则 `createRoot` 为 undefined |
| 骨架挂全局时包含 `createRoot` | ESM 的 `react-dom` 默认导出不含它，需 `{ ...ReactDOM, createRoot }` 合并后再挂 `window.ReactDOM` |
| 渲染器不产出独立 CSS | 缩放与定位全部内联；若后续引入样式文件，须在 SDK 内自动注入，避免宿主漏引 |
| JSX 用 classic runtime（`"jsx": "react"`） | automatic runtime 依赖 `jsx-runtime` 全局，IIFE 场景取不到 |
| 加载顺序：挂全局 React → 插 script → `create()` | 顺序错会取到 undefined |
| `pnpm-workspace.yaml` 只含 `packages/*` 与 `apps/*`，不含 `docs/skeleton` | 骨架要能被拷到隔离环境独立 install；playground 属仓库内部研发设施，可入 workspace |
| renderer 包内零 import 骨架代码 | 保证可剥离 |

#### 跨 bundle 的数据通道：事件，不是 Context

`ScalerContext` 在包内创建，骨架里的物料在另一个 bundle，`useContext` 只能拿到默认值 `1`。因此不再尝试透传 Context，改为：

```text
ScalerContainer.onScaleChange
  → renderer.emit('scalechange', scale)          # 宿主可用于非物料用途
  → Renderer 同时把 scale 作为保留 prop（__scale）下发给每个物料
```

三条配套约束：

- **物料禁止 import 渲染器的 `ScalerContext`**，需要 scale 时读 `props.__scale`（写入物料契约）。
- **不要求宿主提供 `useScreenScale`**：物料是「原样拷贝」的通用实现，不能预期宿主 hook 存在。
- **`create()` 先同步派发一次初值再渲染 children**，否则物料首帧初始化（如 echarts 算字号）会吃到默认值 1。

`OverlayRootContext` 同理失效；MVP 不用弹层，出现需求时改为事件 + 宿主处理。

#### SDK 对外接口

```ts
const renderer = ScreenRenderer.create({ container, registry, schemaUrl: '/schemas/home.schema.json' });
renderer.on('scalechange', (scale) => store.setScale(scale));
renderer.on('sectionEvent', (e) => { /* 联动，归 002 */ });
renderer.getScale();
renderer.destroy();
```

#### 两种产出的节奏差异

| 产出 | 生效方式 | 迭代速度 | 归属 |
| --- | --- | --- | --- |
| Schema | 运行时加载，改完刷新即见 | 秒级 | 页面线 |
| 物料 | 进骨架 `src/components/materials/` + registry → **必须重新 build** | 分钟级 | 组件线 |

AI 在隔离环境里做物料，等同于改模板工程并触发构建，**不是改 SDK**。

#### 当前分工（对应任务卡）

| 卡 | 覆盖 |
| --- | --- |
| 001 | `packages/screen-renderer` + IIFE 构建 + 骨架 script 接入 |
| 002 | `sectionEvent` 联动 |
| 003 | 物料 `runtime` 契约（含「禁止引用渲染器 Context」） |
| 004 | 4 个新建物料 |
| 005 | skill Schema 模式 + 导出拷 vendors |

---

## 9. 风险与待确认

| # | 风险 / 待确认 | 影响 | 建议 |
| --- | --- | --- | --- |
| 1 | 物料粒度：4 个新组件若需求相近却各做一份，物料库会碎片化 | 路径 B 的长期成本 | 入库评审时先问「能否合并为一个带 props 的组件」 |
| 2 | 物料变更影响存量屏，无回归手段 | 改一次要全量验证 | MVP 不解决，但需在 Schema 记 `version`，为后续留口 |
| 3 | 路径 A 二开后的改进不回流入库 | 物料库与真实使用脱节 | 暂无机制，需人工定期回收 |
| 4 | ~~组件运行时装载方式未定~~ **已定（2026-11-12）** | — | 宿主内静态注册 + renderer 以 IIFE 产物由 `<script>` 加载；远程模块加载留到后续 |
| 5 | `data.transform` 的实现形态未定 | 影响 Schema 表达力 | MVP 用具名函数 |

---

## 10. 变更记录

| 日期 | 变更 |
| --- | --- |
| 2026-11-11 | 首版：基于领导 MVP 要求与三轮澄清，确立双路径定位、Schema 草案、物料配置契约、渲染器职责映射与 MVP 边界 |
| 2026-11-11 | 二次确认：领导认可「Hermes 生成 Schema → 页面渲染」主流程，新增 8.4 两条生产线（组件出代码 / 页面出 JSON）；记录 skill 需补 Schema 模式的缺口 |
| 2026-11-12 | 评审修订：globals 补 `react-dom/client` 双映射；SDK 参数统一为 `schemaUrl`；scale 改为 `__scale` prop 注入（不依赖宿主 hook）；`data` 限 `inline` / `url`（不接 `common/api`）；视觉壳改为 `section.frame` + 内置壳；`registry` 归 001 |
| 2026-11-12 | 新增 8.5 工程结构与分发：renderer 独立成 `packages/screen-renderer`（自带 playground）、IIFE 产物由骨架 `<script>` 加载、React external、跨 bundle Context 改为 `scalechange` 事件、export 随带 vendors；9 节 #4 装载方式落定 |
| 2026-11-12 | 002 联动落地：`interactions` 字段项定稿为 `{ name, value?, default? }`（不再用 `field`），`default` 由 store 创建时写入初值；新增 `sectionEvent` 出口 `{ field, value, sectionId }` |
| 2026-11-12 | 003 物料契约落地：`runtime` 定稿为 `{ schemaable, type, dataContract, propsContract, events[{name,payload,description}], constraints[] }`；新增 `pnpm check:material-registry`（registry↔manifest 双向校验，schemaable 未注册暂为告警） |
| 2026-11-13 | 006 人工 review 修复同步：① 骨架入口收敛为纯 React（删 `#screen-root` 双轨探测），HashRouter 一屏 = `screens/<name>/index.tsx`（包 `SchemaScreen`）+ App 一条 Route，App 不内联 element；渲染失败显示错误占位 ② renderer-boot 迁至 `components/schema-screen/boot.ts`（React 全局注入幂等，多路由实例共用，schemaUrl 参数化）③ 演示物料迁出骨架 → `apps/playground`（研发验证回路，不随 skill 导出），skeleton 定位为发布产物（8.2 / 8.5 更新）④ 物料归 `components/materials/`（registry 在其根），别名 `@/materials/components/**` 落位同步指 materials/ ⑤ 新增 `pnpm check:skeleton-mirror`（skeleton ↔ playground 工程壳 14 文件逐字节一致，playground 验证一次即覆盖骨架，骨架不再单独装依赖验证）⑥ vendors 同步单一机制：`build:renderer` 构建后自动刷两处 vendors，两 app 的 dev 启动亦拉最新产物 |
