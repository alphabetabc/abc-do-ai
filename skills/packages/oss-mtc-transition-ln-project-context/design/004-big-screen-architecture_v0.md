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

### 1.1 大屏壳（Shell）—— 父路由 + Outlet 模式

大屏壳采用**父路由组件 + Outlet** 模式，与项目现有的 `AppShell`（`/` 父路由）同构：

```
router.tsx
  /                         → <AppShell>          ← 管理端布局壳
    bigdata/personnel       →   <PersonnelScreen> ← 大屏页面（不是 AppShell 子路由）
    dashboard/petition      →   <PetitionScreen>
    ...
```

**大屏壳是独立的大屏父路由组件**（`BigScreenShell`），不嵌套在 `AppShell` 内：

```
router.tsx
  /                              → <AppShell>          ← 管理端（Header + Sider + TabBar）
    bigdata/personnel            →   <BigScreenShell>  ← 大屏父路由（独立壳）
                                    └─ <Outlet />      →   <PersonnelScreen />（大屏内容）
    dashboard/petition           →   <BigScreenShell>
                                    └─ <Outlet />      →   <PetitionScreen />
    dashboard/beijing-petition   →   <BigScreenShell>
                                    └─ <Outlet />      →   <BeijingPetitionScreen />
    dashboard/petition-comparison →  <BigScreenShell>
                                    └─ <Outlet />      →   <PetitionComparisonScreen />
```

> 大屏路由具体挂在 `AppShell` 下还是独立为 `/` 的兄弟顶层路由，在编码阶段确定。

**壳职责**：

- `ScalerContainer` 缩放适配（1920×1080 设计稿）
- 深蓝色科技风格背景
- 顶部标题 + 当前时间 + 导航按钮
- 三栏 + 底部布局槽位
- `<Outlet />` 渲染当前大屏页面内容

**导航按钮**：对应各大屏，当前屏高亮，其余跳转对应路由（路由见 `003-big-screen-routes.md`）。导航按钮点击行为待设计（memo R9）。

### 1.2 槽位协议（Slot Protocol）

`BigScreenShell` 通过 Outlet 渲染大屏页面，大屏页面内部按槽位组织模块。槽位命名规则：

| 槽位      | 位置   | 职责                                 |
| --------- | ------ | ------------------------------------ |
| `top-bar` | 顶部栏 | 标题 + 时间 + 导航按钮（壳组件渲染） |
| `left-1`  | 左栏上 | 图表模块（页面填充）                 |
| `left-2`  | 左栏中 | 图表模块（页面填充）                 |
| `left-3`  | 左栏下 | 图表模块（页面填充）                 |
| `center`  | 中栏   | 地图 / 主视觉（页面填充）            |
| `right`   | 右栏   | 数据卡片 / 图表（页面填充）          |
| `bottom`  | 底部栏 | 图表 / 统计（页面填充）              |

> `top-bar` 由壳组件统一渲染；其余槽位由大屏页面（Outlet 子路由）填充。各屏具体模块内容在各自 spec §4 中定义。

### 1.3 布局壳前端实现

| 组件              | 路径                                                     | 状态                                                          |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `ScalerContainer` | `frontend/src/components/large-screen/scaler-container/` | ✅ 已实现（设计见 `components/001-scaler-container/`）        |
| `BigScreenShell`  | 待建                                                     | ⚪ 大屏父路由壳组件（标题 + 时间 + 导航按钮 + 三栏 + Outlet） |

> `BigScreenShell` 是大屏父路由组件，封装顶部栏 + 三栏骨架 + `<Outlet />`。各大屏页面作为子路由挂载，填充槽位内容。设计文档待建在 `components/004-big-screen-shell/`。

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

共享组件的设计文档统一放在 `design/components/` 下，每个组件一个目录。本文只维护**已产生的**组件索引（通过 §4 派生机制产生后登记），不预设清单。

| 组件               | 设计文档                            | 实现路径                                                          | 状态        |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------- | ----------- |
| `ScalerContainer`  | `components/001-scaler-container/`  | `frontend/src/components/large-screen/scaler-container/`          | ✅ 已实现   |
| `EChartsMap`       | `components/002-ec-map/`            | `frontend/src/components/large-screen/ec-map/`                    | ✅ 已实现   |
| `InteractionStore` | `components/003-interaction-store/` | `frontend/src/components/large-screen/interaction-store/`（待建） | 📄 设计完成 |

> 新增组件通过 §4 派生机制产生，产生后在 `components/` 下新建目录（编号递增），并在本表登记。不预设未产生的组件。

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

## 4. 共享能力派生机制

大屏开发过程中，识别出可被多个大屏复用的公共组件/能力时，通过**派生共享 spec 目录**进行独立设计和管理。

### 4.1 派生流程

共享能力的识别是 **AI 识别 + 人确认** 的两步过程：

```
大屏 spec 开发（如 038）
  ↓ AI 识别：生成 spec 时，AI 根据模块特征主动识别"这个组件可能其他大屏也会用"
  ↓ 在 spec §8 登记为"建议共享"
  ↓ 人确认：开发者/架构师 review，判断"确实需要通用化"还是"当前屏专用"
  ↓   ├─ 确认派生 → 标记"确认派生"
  ↓   └─ 当前屏专用 → 标记"不派生"，留在本 spec 内
  ↓ 确认派生的：检查已有共享 spec 目录 + skill modules/ 是否已包含
  ↓ 确认不重复后，派生共享 spec 目录
docs/specs/{父编号}-shared-{父slug}/
  ├── 001-组件名/
  │   ├── spec.md        ← 组件契约（props、行为）
  │   ├── task.md        ← 开发任务
  │   └── data-model.md  ← 组件数据结构（如有）
  ├── 002-组件名/
  │   └── ...
  └── ...
  ↓ 共享 spec 的 task 完成后
  ↓ 调用 skill: oss-mtc-transition-ln-project-context
  ↓ 将实现产出蒸馏到 large-screen-shared skill 的 modules/ 下
  ↓ 回 004 §3.1 登记组件索引
  ↓ 后续大屏引用 skill 中蒸馏后的使用指南
```

> **AI 识别 + 人确认**：AI 只能提示"这个看起来可复用"，是否值得抽象为共享组件是架构决策，人决定。

### 4.2 命名规则

| 元素     | 规则                                    | 示例                            |
| -------- | --------------------------------------- | ------------------------------- |
| 共享目录 | `{父编号}-shared-{父slug}/`             | `038-shared-personnel-display/` |
| 子目录   | `{NNN}-{组件名}/`                       | `001-ec-map/`                   |
| 三件套   | `spec.md` + `task.md` + `data-model.md` | —                               |

> 共享 spec 使用**三件套**（不是五件套），因为组件不是独立交付特性，不需要 plan 和 acceptance-tests。

### 4.3 去重约束

派生前**必须检查**：

1. `docs/specs/` 下是否已有同类共享 spec 目录
2. `large-screen-shared` skill 的 `modules/` 是否已包含该组件

已存在则直接引用，不重复派生。

### 4.4 蒸馏到 skill

共享 spec 的 task 完成后，调用 skill `oss-mtc-transition-ln-project-context`，将组件的使用方式（怎么用、props、注意事项）蒸馏到 `docs/skills/frontend/large-screen-shared/` 下的 `modules/` 目录。后续大屏通过引用该 skill 获取使用指南。

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

每个大屏 spec §4 须包含 004 §5 差异矩阵的该屏实例（至少填该屏的图表类型、后端模型、数据源、鉴权 key）。

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

| 日期       | 变更                                                                                                 | 备注                       |
| ---------- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-08-13 | 初始创建；§1-§7 框架搭建                                                                             | 领导指示：大屏自顶向下设计 |
| 2026-08-13 | 重构为方法论骨架：去掉 038 具体内容，038 验证案例移至附录；公共组件指向 `components/`                | 方法论与实例分离           |
| 2026-08-13 | §1 大屏壳改为父路由 + Outlet 模式；§6 从泛化映射表改为五件套落地指引（逐文件说明应体现什么）         | 壳模式修正 + 五件套指引    |
| 2026-08-13 | 新建 `design/_large-screen-template/`：大屏版五件套模板 + ai-prompts-guide（pm-inputs 沿用原版不变） | 大屏模板草稿               |
| 2026-08-13 | 新增 §4 共享能力派生机制（派生流程、命名规则、去重约束、蒸馏到 skill）                               | 公共组件沉淀机制           |
