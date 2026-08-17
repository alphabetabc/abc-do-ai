# 004 · 大屏可视化架构方法论

> 性质：长期维护文档（非一次性 research）
> 日期：2026-08-13
> 来源：领导指示——大屏开发需自顶向下设计，拓展五件套以外的大屏专用规范
> 维护规则：大屏架构变化时同步更新；本文件不入 `docs/`、不入 Git；成熟后走 L3 审批落地到 `docs/design/big-screen-architecture.md`
> 定位：**大屏架构方法论**——定义"大屏架构怎么设计"，不记录具体大屏"做了什么"。具体大屏的实现细节在各自 spec 五件套里，公共组件设计在 `design/components/` 下。

---

## 0. 定位与动机

### 0.1 为什么需要这个文档

五件套（spec / plan / tasks / data-model-extensions / acceptance-tests）是为 **CRUD 业务流**（列表→表单→详情→导出）设计的，驱动方式：

```
用户操作 → API 端点 → DB 表 → 字段
```

大屏的驱动方式完全不同：

```
视觉区域（布局槽位）→ 图表类型 → 数据形状 → API 响应模型 → SQL
```

大屏开发缺少以下内容的正式载体：

- 布局模型与槽位协议
- 图表数据结构（API 响应模型层面，不是 DB 列）
- 共享组件契约
- 交互联动协议

本文档定义这些**通用方法论**，每个具体大屏在各自 spec 中引用并填充实例。

### 0.2 与现有文档的关系

| 文档                                | 职责                                           | 本文与它的关系                                             |
| ----------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `001-big-screen-dev-guide.md`       | docs 现状盘点 + 五件套映射 + 硬规则 + 任务步骤 | 001 管「怎么用 docs 体系」；本文管「大屏架构本身怎么设计」 |
| `002-big-screen-decisions.md`       | 决策日志                                       | 本文涉及的架构决策记入 002                                 |
| `003-big-screen-routes.md`          | 路由权威表                                     | 本文 §1 引用路由表，不复制                                 |
| `005-big-screen-workflow.md`        | 大屏开发通用工作流                             | 005 管「工程推进顺序」；本文管「架构设计方法」             |
| `components/001-scaler-container/`  | ScalerContainer 组件设计                       | 本文 §3 引用，不重复                                       |
| `components/002-ec-map/`            | EChartsMap 组件设计                            | 本文 §3 引用，不重复                                       |
| `components/003-interaction-store/` | InteractionStore 组件设计                      | 本文 §3 引用，不重复                                       |
| `docs/specs/NNN-*/spec.md` §4       | 各大屏界面与交互                               | 本文定共性方法；spec 定各屏个性内容                        |

### 0.3 落地路径

1. 本文件在 skill `design/` 下起草、review、迭代
2. 草稿成熟后走 `roadmap §6` L3 提案审批
3. 审批通过后落地到 `docs/design/big-screen-architecture.md`
4. 各大屏 spec §4 引用该文档，不重复描述布局壳和组件协议

---

## 1. 大屏布局模型

### 1.1 大屏壳（Shell）—— 单路由 + query 参数切换

> **2026-08-17 更新（task-041 经验）**：原计划的父路由 + Outlet 模式经实战发现 AppShell 嵌套导致大屏内容被套在 tab 卡片里（padding/白底/圆角）。最终采用**单路由 + query 参数切换**方案。

**实战方案**：

```
router.tsx（appRoutes 仍走 AppShell children，保留登录校验 + tab 体系）
  /                       → <AppShell>                                  ← 管理端布局壳
    visual/big-screen     →   <Visual>                                  ← 大屏入口（单路由）
                              ├─ <Header>                              ← 顶部导航
                              ├─ <Background>                           ← 背景层
                              └─ <Page>（?menu=xxx 切换 4 大屏子页）   ← useSearchParams 读 menu
                                  ├─ ?menu=personnel   → <PersonnelPage>
                                  ├─ ?menu=petition      → <PetitionPage>
                                  ├─ ?menu=beijingPetition → <BeijingPetitionPage>
                                  └─ ?menu=petitionComparison → <PetitionComparisonPage>
```

**为什么是单路由 + query 而非 4 路由 + Outlet**：

| 方案                                         | 优点                                                          | 缺点                                                              | 决策                          |
| -------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------- |
| 4 路由 + 父路由 `<Visual><Outlet/></Visual>` | 路由语义清晰、嵌套层级少                                      | AppShell 把大屏套在 tab 卡片里（padding/白底/圆角），内容无法全屏 | ❌ 已废弃                     |
| 顶级路由脱离 AppShell                        | tab 不创建，内容可全屏                                        | 脱离菜单体系，鉴权需独立处理                                      | ❌ 已废弃                     |
| ROUTE_WHITELIST 白名单 + AppShell 跳过 tab   | tab 跳过创建                                                  | 绕过 AGENTS §4「菜单项粒度鉴权」                                  | ❌ 已废弃（违反 §8 禁止行为） |
| ✅ **单路由 + query 切换**                   | pathname 不变 → tab 不重复创建；子页切换走 lazy；保留菜单鉴权 | URL 不直观（要查 menu 参数）                                      | ✅ **最终方案**               |

**Visual 壳职责**：

- `ScalerContainer` 缩放适配（1920×1080 设计稿）
- `<Header />` 渲染（左导航 + 中间大标题「大数据综合展示」+ 右导航）
- `<Background />` 渲染（`/static/images/background-1.png`）
- `useSearchParams` 读 `?menu=xxx`（驼峰 key）
- `lazy()` 加载对应子页 + `Suspense` 包裹 + `Spin` loading
- 4 大屏公共壳层（背景/导航/scaler），不关心具体大屏内容

**导航切换行为**：导航按钮点击 `setSearchParams({ menu: key }, { replace: true })` → pathname 不变 → AppShell 不创建新 tab 页签。

### 1.2 槽位协议（Slot Protocol）—— 基于像素坐标的绝对定位

> **2026-08-17 更新（task-041 经验）**：原计划的「三栏 + 底部 + 槽位名」模型在实战中演化为**基于 PM 像素坐标的 InfoCard 绝对定位**。每个 InfoCard 是一个绝对定位的卡片，宽高/left/top 由 PM 提供的设计稿决定。

**实战模型**（以 personnel 大屏 5 卡片为例）：

```
┌─────────────────────────────────────────────────────────────┐
│  退役军人(35,108)        │  数据总量情况(555,108)             │
│  InfoCard 500×240       │  InfoCard 1330×651                  │
│  ──────────────────── │                                       │
│  优抚对象(35,366)       │                                       │
│  InfoCard 500×320      │                                       │
│  ──────────────────── │                                       │
│  部分人员类别(35,704)   │                                       │
│  InfoCard 500×340      │                                       │
│                        │  各地区人数统计(555,769)            │
│                        │  InfoCard 1330×275                   │
└─────────────────────────────────────────────────────────────┘
```

**核心原则**：

- 每个 InfoCard = 一个槽位 = `position: absolute` + `width/height/left/top`（PM 像素）
- 子组件**自带定位样式**（`style` prop 内联 absolute 坐标），主入口仅做组合
- 大屏主入口 `index.tsx` 仅负责 `import` + 组合各子组件，**不写绝对定位**
- 子组件目录 `kebab-case`（如 `personnel/retired-soldier/`），组件函数 PascalCase

**InfoCard titleBg 选型**（基于卡片宽度）：

- `normal`（500px 短背景 `title.png`bg.png）→ 500px 卡片
- `long`（1000-1300px 长背景 `title-bg2.png`）→ 1000-1300px 卡片
- `max`（1300+px 最长背景 `title-bg-max.png`）→ 1300+px 卡片

> `titleBg` 选型是设计还原关键点，宽度未对齐会出现拉伸或留白。具体宽度表见 `components/large-screen/info-card/index.tsx`。

**槽位参数沉淀**：

每个大屏的卡片参数（width/height/left/top/titleBg）在各自 task 文件 `§0.3.x` 沉淀（如 personnel → task-041 §0.3.1，petition → task-041 §0.3.2）。**修改卡片布局时须同步更新 task 沉淀表格**。

### 1.3 布局壳前端实现

| 组件              | 路径                                                          | 状态                                                                                                             |
| ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ScalerContainer` | `frontend/src/components/large-screen/scaler-container/`      | ✅ 已实现（设计见 `components/001-scaler-container/`）                                                           |
| `Visual`          | `frontend/src/pages/visual/big-screen/index.tsx`              | ✅ 已实现（task-041）：单路由 + query 切换大屏入口，包裹 ScalerContainer + Header + Background + lazy 子页       |
| `Header`          | `frontend/src/pages/visual/big-screen/components/header/`     | ✅ 已实现（task-041）：左导航 + 中间大标题「大数据综合展示」（YouSheBiaoTiHei / 48px / 双层 textShadow）+ 右导航 |
| `Background`      | `frontend/src/pages/visual/big-screen/components/background/` | ✅ 已实现（task-041）：`/static/images/background-1.png` 全屏背景，`resolvePublicAssetUrl` 解析                  |
| `InfoCard`        | `frontend/src/components/large-screen/info-card/`             | ✅ 已实现：大屏卡片基座；titleBg 三态（normal/long/max）；title 加 `white-space: nowrap`                         |
| `BigScreenShell`  | 原计划组件                                                    | ❌ 已废弃：query 切换方案不需要独立壳组件；`Visual` 充当壳                                                       |

> `Visual`（位于 `pages/visual/big-screen/`）替代了原计划的 `BigScreenShell`。`Visual` 是路由入口 + 4 大屏公共层（背景/导航/scaler），不感知具体大屏内容。具体大屏通过 `?menu=xxx` 切换子页。

---

## 2. 大屏后端模型（图表数据结构）

### 2.1 设计原则

**自顶向下**设计顺序：

```
① 大屏布局槽位 → ② 每个槽位的图表类型 → ③ 图表需要的数据结构 → ④ API 响应模型 → ⑤ SQL
```

不再从 SQL 倒推 API，而是先定义图表数据结构，再推导 API 响应模型和 SQL。

### 2.2 统一图表数据结构

所有大屏 API 响应遵循以下数据结构分类。具体大屏使用哪些结构、端点如何映射，在各自 spec §3 接口契约中定义。

#### 2.2.1 环形图 / 饼图（PieChart）

```
适用：占比类展示
```

```typescript
interface PieChartData {
    total: number; // 中心总数
    items: Array<{
        label: string; // 类别名称
        value: number; // 数值
        ratio: number; // 占比（%），保留 2 位小数
    }>;
}
```

#### 2.2.2 数字卡片 + 下钻（CardList with Drilldown）

```
适用：关键指标展示 + 点击下钻查看子集
```

```typescript
interface CardListData {
    cards: Array<{
        key: string; // 卡片标识（用于下钻 category）
        label: string; // 卡片标题
        value: number; // 数值
    }>;
    drilldown?: {
        [category: string]: Array<{
            // 按 category 键索引子集
            label: string;
            value: number;
        }>;
    };
}
```

#### 2.2.3 地图热力（MapHeatmap）

```
适用：地理分布数据展示
```

```typescript
interface MapHeatmapData {
    regions: Array<{
        name: string; // 行政区划名称
        value: number; // 数值
        adcode?: string; // 行政区划编码（用于下钻）
    }>;
}
```

#### 2.2.4 柱状图 / 条形图（BarChart）

```
适用：分类数据对比
柱状图：X 轴为分类，Y 轴为数值
条形图：Y 轴为分类，X 轴为数值（横向柱状图）
分组柱状图：多系列对比
```

```typescript
interface BarChartData {
    categories: string[]; // 分类轴标签
    series: Array<{
        name: string; // 系列名称（图例）
        data: number[]; // 数值数组，与 categories 等长
    }>;
}
```

#### 2.2.5 下钻子集列表（DrilldownList）

```
适用：指标下钻后展示的子集明细
```

```typescript
interface DrilldownListData {
    category: string; // 当前下钻的类别
    items: Array<{
        label: string; // 子项名称
        value: number; // 数值
    }>;
}
```

### 2.3 API 响应模型规范

API 响应统一使用 `ApiResponse<T>` 壳（`{ code, message, data }`），`data` 为上述图表数据结构之一。

**映射规则**：每个端点在各自 spec §3 接口契约中声明"端点 → 图表类型 → 数据结构"的映射关系。本文只定义数据结构本身，不记录具体端点。

### 2.4 与 data-model-extensions.md 的分工

| 文档                         | 职责                                        |
| ---------------------------- | ------------------------------------------- |
| **本文 §2**                  | 定义图表数据结构（API 响应模型层面）        |
| **data-model-extensions.md** | 定义 SQL 字段映射（DB 列 → API 字段的对照） |

设计顺序：本文 §2 先定图表数据结构 → data-model-extensions.md 再映射 SQL 字段。

---

## 3. 共享组件契约

### 3.1 组件索引

共享组件的设计文档统一放在 `design/components/` 下，每个组件一个目录。本文只维护**已产生的**组件索引（通过 §4 共享组件 spec 机制产生后登记），不预设清单。

| 组件               | 设计文档                            | 实现路径                                                          | 状态        |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------- | ----------- |
| `ScalerContainer`  | `components/001-scaler-container/`  | `frontend/src/components/large-screen/scaler-container/`          | ✅ 已实现   |
| `EChartsMap`       | `components/002-ec-map/`            | `frontend/src/components/large-screen/ec-map/`                    | ✅ 已实现   |
| `InteractionStore` | `components/003-interaction-store/` | `frontend/src/components/large-screen/interaction-store/`（待建） | 📄 设计完成 |

> 新增组件通过 §4 机制产生，产生后在 `components/` 下新建目录（编号递增），并在本表登记。不预设未产生的组件。

### 3.2 组件数据契约规范

每个图表包装器组件接收本文 §2 定义的图表数据结构作为 props：

```typescript
// 通用 props 模式
interface ChartWidgetProps<T> {
    data: T; // 本文 §2 定义的图表数据结构之一
    loading?: boolean;
    empty?: boolean;
    error?: string | null;
    onClick?: (item: T["items"][0]) => void; // 按需
}
```

**所有图表组件统一实现 `loading / empty / error` 三态。**

---

## 4. 共享组件 spec 机制

大屏开发过程中，识别出可被多个大屏复用的公共组件/能力时，直接生成一个**独立的共享组件 spec**（如 `042-components-common`）。

### 4.1 生成流程

共享能力的识别是 **AI 识别 + 人确认** 的两步过程：

```
大屏 spec 开发（如 038）
  ↓ AI 识别：生成 spec 时，AI 根据模块特征主动识别"这个组件可能其他大屏也会用"
  ↓ 在 spec §8 登记为"建议共享"
  ↓ 人确认：开发者/架构师 review，判断"确实需要通用化"还是"当前屏专用"
  ↓   ├─ 确认共享 → 标记"确认共享"
  ↓   └─ 当前屏专用 → 标记"不共享"，留在本 spec 内
  ↓ 确认共享的：检查 docs/specs/ 下是否已有共享组件 spec
  ↓ 确认不重复后，在共享组件 spec 目录下新增组件子目录
docs/specs/NNN-components-common/
  ├── 001-组件名/
  │   ├── spec.md        ← 组件契约（props、行为）
  │   ├── task.md        ← 开发任务
  │   └── data-model.md  ← 组件数据结构（如有）
  ├── 002-组件名/
  │   └── ...
  └── ...
  ↓ 共享组件 task 完成后
  ↓ 回 004 §3.1 登记组件索引
  ↓ 后续大屏引用该共享 spec
```

> **AI 识别 + 人确认**：AI 只能提示"这个看起来可复用"，是否值得抽象为共享组件是架构决策，人决定。

### 4.2 命名规则

| 元素           | 规则                                    | 示例                     |
| -------------- | --------------------------------------- | ------------------------ |
| 共享 spec 目录 | `NNN-components-common/`                | `042-components-common/` |
| 子目录         | `{NNN}-{组件名}/`                       | `001-ec-map/`            |
| 三件套         | `spec.md` + `task.md` + `data-model.md` | —                        |

> 共享组件 spec 使用**三件套**（不是五件套），因为组件不是独立交付特性，不需要 plan 和 acceptance-tests。

### 4.3 去重约束

新增共享组件前**必须检查**：

1. `docs/specs/` 下是否已有共享组件 spec 目录（`NNN-components-common`）
2. 该 spec 下是否已有同类组件子目录

已存在则直接引用，不重复创建。

---

## 5. 交互联动协议

### 5.1 地图下钻联动（全局状态）

```
用户点击地图区域
  → 地图组件切换到下级地图
  → 触发 onRegionChange(adcode, cantType)
  → 大屏页面状态更新（当前选中的 adcode / cantCode / cantType）
  → 所有模块重新请求 API（传入新的 cantCode / cantType）
  → 所有图表刷新
```

**数据流**：

```
EChartsMap.onClick(region)
  → setPageState({ cantCode: region.adcode, cantType: '6' })
  → 所有模块 API 重新请求（cantCode / cantType 参数更新）
  → 所有图表组件刷新
```

**特点**：地图下钻是**全局状态**，联动所有模块。

### 5.2 指标下钻联动（局部状态）

```
用户点击数据卡片（如某分类指标）
  → 当前栏切换为子集列表 + 返回按钮
  → 请求下钻 API（传入 category 参数）
  → 展示子集数据
  → 点击返回按钮恢复原视图
```

**特点**：指标下钻是**模块内局部状态**，不影响其他模块。

### 5.3 沈抚合并

`2115`（沈抚新区）数据合并到 `2104`（抚顺市），在 Service 层处理（Repository 返回原始行之后）。参照 035 `merge_shenfu_rows()` 已实现模式。

---

## 6. 多屏差异矩阵模板

每个大屏在各自 spec §4 中填写以下维度的实例：

| 维度         | 说明                      |
| ------------ | ------------------------- |
| **壳**       | 是否复用 `BigScreenShell` |
| **导航按钮** | 导航按钮行为              |
| **地图**     | 地图组件 + geojson 来源   |
| **下钻联动** | 地图下钻 / 指标下钻 / 无  |
| **图表类型** | 该屏使用的图表类型清单    |
| **后端模型** | 使用本文 §2 哪些数据结构  |
| **数据源**   | DB schema · 表            |
| **鉴权**     | 菜单 key                  |
| **PM 输入**  | 迁入状态                  |
| **五件套**   | 生成状态                  |

> 各屏具体内容在各自 spec 中填写，本文只定义维度。

---

## 7. 五件套落地指引

本文定义方法论，五件套负责落地实例。每个大屏 spec 五件套按以下指引体现 004 的架构约定。

### 7.1 spec.md

| 章节          | 应体现的内容                                                                                                                  | 与 004 的关系                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| §0 技术决策   | 图表选型（ECharts）、4 屏菜单结构等                                                                                           | 引用 `002-big-screen-decisions.md` 对应决策                                      |
| §3 接口契约   | **端点 → 图表类型 → 数据结构**的映射表；每个端点声明使用 004 §2 哪个数据结构；query 参数（cantCode / cantType / category 等） | **引用** 004 §2 数据结构定义，不重复 interface；**必须填实例**：该屏具体端点清单 |
| §4 界面与交互 | **槽位 → 模块**的分配表（用 004 §1.2 的槽位名）；地图下钻 / 指标下钻的交互描述                                                | **引用** 004 §1 布局模型 + §5 联动协议；**必须填实例**：该屏各槽位放什么模块     |
| §5 数据与领域 | 口径定义、沈抚合并规则                                                                                                        | 引用 004 §5.3 沈抚合并约定                                                       |
| §7 非功能     | 加载/空态/错误态、性能要求                                                                                                    | 引用 004 §3.2 三态规范                                                           |
| §9 开放问题   | 该屏特有的架构开放问题                                                                                                        | —                                                                                |

### 7.2 data-model-extensions.md

| 应体现的内容                                                    | 与 004 的关系                                         |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| **DB 列 → API 字段**的映射表；每个图表数据结构的字段来源 SQL 列 | 004 §2 定义数据结构形状，extensions 映射具体 SQL 字段 |
| SQL 文件路径约定（`backend/app/repositories/sql/visual/`）      | —                                                     |

### 7.3 plan.md

| 应体现的内容                            | 与 004 的关系                    |
| --------------------------------------- | -------------------------------- |
| M3 里程碑前置依赖：本文 §3 公共组件就绪 | 引用 004 §3.1 组件索引           |
| M3/M4 切片：壳 + 首模块 → 其余模块      | 引用 004 §1.3 布局壳 + §1.2 槽位 |

### 7.4 tasks.md

| 应体现的内容                                  | 与 004 的关系                      |
| --------------------------------------------- | ---------------------------------- |
| 后端任务：SQL + Service + router + schema     | 引用 004 §2 数据结构               |
| 前端任务：路由注册 + 壳 + API 封装 + 模块实现 | 引用 004 §1 布局模型 + §3 组件契约 |
| 联动任务：地图下钻 + 指标下钻                 | 引用 004 §5 联动协议               |

### 7.5 acceptance-tests.md

| 应体现的内容                                   | 与 004 的关系 |
| ---------------------------------------------- | ------------- |
| 地图下钻联动测试场景（点击区域 → 全模块刷新）  | 引用 004 §5.1 |
| 指标下钻测试场景（点击卡片 → 子集列表 → 返回） | 引用 004 §5.2 |
| 沈抚合并边界测试                               | 引用 004 §5.3 |
| 三态测试（loading / empty / error）            | 引用 004 §3.2 |

### 7.6 差异矩阵实例

每个大屏 spec §4 须包含 004 §6 差异矩阵的该屏实例（至少填该屏的图表类型、后端模型、数据源、鉴权 key）。

---

## 8. 开放问题

| ID  | 问题                                  | 状态    | 备注                                           |
| --- | ------------------------------------- | ------- | ---------------------------------------------- |
| A1  | `BigScreenShell` 是否作为共享组件提取 | ⚪ 待定 | 各屏布局是否完全一致待确认                     |
| A2  | 图表包装器组件是否统一封装            | ⚪ 待定 | PieChartWidget / BarChartWidget 等是否值得抽象 |
| A3  | 各屏是否复用本文 §2 图表数据结构      | ⚪ 待定 | 待各自 spec 确认图表类型后判断                 |
| A4  | 同源数据端点复用还是拆分              | ⚪ 待定 | 倾向复用，具体在 spec §9 开放问题中记录        |

---

## 9. 变更记录

| 日期       | 变更                                                                                                                                                                      | 备注                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-08-13 | 初始创建；§1-§7 框架搭建                                                                                                                                                  | 领导指示：大屏自顶向下设计 |
| 2026-08-13 | 重构为方法论骨架：去掉 038 具体内容，038 验证案例移至附录；公共组件指向 `components/`                                                                                     | 方法论与实例分离           |
| 2026-08-13 | §1 大屏壳改为父路由 + Outlet 模式；§6 从泛化映射表改为五件套落地指引（逐文件说明应体现什么）                                                                              | 壳模式修正 + 五件套指引    |
| 2026-08-13 | 新建 `design/_large-screen-template/`：大屏版五件套模板 + ai-prompts-guide（pm-inputs 沿用原版不变）                                                                      | 大屏模板草稿               |
| 2026-08-13 | 新增 §4 共享组件 spec 机制（生成流程、命名规则、去重约束）                                                                                                                | 公共组件沉淀机制           |
| 2026-08-13 | §4 从派生机制改为共享组件 spec 机制：去掉派生命名（`{父编号}-shared-{父slug}`）和蒸馏到 skill，改为直接生成 `NNN-components-common/`；§3.1 去掉预设组件清单；同步更新模板 | 领导指示：方案调整         |
| 2026-08-17 | §1.1 大屏壳模式实战修正：原计划父路由 + Outlet 方案在 task-041 实战中被废弃（AppShell 嵌套问题），改为**单路由 + query 参数切换**；`Visual` 组件替代 `BigScreenShell`     | task-041 实战反馈          |
| 2026-08-17 | §1.2 槽位协议实战修正：原「三栏 + 底部 + 槽位名」演化为**基于像素坐标的 InfoCard 绝对定位**；业务子组件命名 `kebab-case` + 主入口仅做组合 + 子组件自带定位样式            | task-041 实战反馈          |
| 2026-08-17 | §1.3 + §3.1 组件索引更新：新增 `Visual` / `Header` / `Background` / `InfoCard` 已实现登记；`BigScreenShell` 标记废弃                                                      | task-041 完成              |
| 2026-08-17 | §8 开放问题：A1（壳形态）+ A5（路由方案）已关闭；新增 A6（AppShell 嵌套是否需 portal）                                                                                    | task-041 反馈              |
