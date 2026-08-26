# Task 001 — 模块初始化（不含数字人）

> 文档定位：北京移动指挥调度模块（`cmd-dispatcher`）首次模块初始化任务，用于 review 后再排期执行。
> 关联文档：
>
> -   实施路线：[roadmap.md](./roadmap.md)
> -   当前状态：[../status/current.md](../status/current.md)
> -   前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> -   自检清单：[../status/checklist.md](../status/checklist.md)
>
> 日期：2026-08-24
> 状态：骨架已落地（实施中），待回填 design / status（§8）

---

## 一、目标

完成北京移动指挥调度大屏页面（`/bj-cmcc-cmd-dispatcher`）的**模块初始化布局**：

-   `render.tsx` **直接 import 全部 11 个模块组件**（不条件渲染），按 z-order 铺到 stage 容器内
-   **本次不涉及数字人**（`enableMetaHuman` 不开启，不接入 MetaHuman 相关组件）
-   落位后页面在 2880×1080 设计稿下可正常铺满，无错位
-   模块通过 store 派生 selector（`useVisibleGroup`）订阅 `currentLevel`，自身 Group 不匹配时 `return null` 卸载 —— 实现**全量挂载、按层级互斥显示**，骨架阶段行为可接受
-   引入页面级 zustand store + 共享 UI 组件（`service-recovery-panel`），统一跨模块状态与可复用呈现

---

## 二、地图层级与模块映射（设计稿 2880×1080）

地图**始终在最底层全屏显示**，并通过它控制层级；不同层级下，呈现的模块集不同（互斥显示，不重叠）。

### 2.1 全局底层（始终可见）

| #   | 模块 | 尺寸 (W×H)       | left | top | 备注                                                       |
| --- | ---- | ---------------- | ---- | --- | ---------------------------------------------------------- |
| 1   | 地图 | 100% (2880×1080) | 0    | 0   | 全屏底图，承载层级切换（city→company→district→street→community→station→logical） |

### 2.2 Group A — 北京 / 分公司 / 区 / 街道

| #   | 模块         | 尺寸 (W×H) | left | top | 备注     |
| --- | ------------ | ---------- | ---- | --- | -------- |
| 2   | 退服恢复情况 | 1790 × 238 | 53   | 822 | 底部通栏 |
| 3   | 网络影响     | 906 × 635  | 1878 | 87  | 右侧上方 |
| 4   | 基站退服     | 906 × 323  | 1878 | 726 | 右侧下方 |

### 2.3 Group B — 社区（task001 阶段暂列"小区/社区"，PM 确认后仅有社区）

| #   | 模块                           | 尺寸 (W×H) | left | top | 备注                                         |
| --- | ------------------------------ | ---------- | ---- | --- | -------------------------------------------- |
| 5   | 退服小区恢复情况               | 1790 × 238 | 53   | 822 | 同位置、**不同模块名**（详见 §2.6 复用约定） |
| 6   | 网络影响                       | 906 × 635  | 1878 | 87  | 同 A 组坐标                                  |
| 7   | 逻辑站清单（原"逻辑站点清单"） | 906 × 313  | 1878 | 431 | 右侧中部                                     |
| 8   | 基站退服                       | 906 × 323  | 1878 | 726 | 同 A 组坐标                                  |

### 2.4 Group C — 基站

| #   | 模块             | 尺寸 (W×H) | left | top | 备注                       |
| --- | ---------------- | ---------- | ---- | --- | -------------------------- |
| 9   | 退服小区恢复情况 | 1790 × 238 | 53   | 822 | 同位置                     |
| 10  | 指标             | 906 × 333  | 1878 | 84  | 右侧上方                   |
| 11  | 逻辑站清单       | 906 × 313  | 1878 | 431 | 同 B 组坐标                |
| 12  | 联保障任务       | 435 × 263  | 1878 | 758 | 右下偏左（与告警明细并排） |
| 13  | 告警明细         | 457 × 263  | 2327 | 758 | 右下偏右                   |

### 2.5 Group D — 逻辑站（task001 阶段暂列"NR"，PM 确认后改为逻辑站）

| #   | 模块             | 尺寸 (W×H) | left | top | 备注     |
| --- | ---------------- | ---------- | ---- | --- | -------- |
| 14  | 退服小区恢复情况 | 1790 × 238 | 53   | 822 | 同位置   |
| 15  | 站址画像         | 916 × 333  | 1878 | 84  | 右侧上方 |
| 16  | 小区清单         | 906 × 353  | 1878 | 438 | 右侧中部 |
| 17  | 站址性能         | 906 × 223  | 1878 | 805 | 右侧下方 |

### 2.6 模块复用约定（关键）

| 项                                           | 结论（来自 review 确认）                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 退服恢复情况 (A) vs 退服小区恢复情况 (B, task001 阶段暂挂 B/C/D) | **两个不同模块名**，数据源可能不同；但**呈现形式相同**，共用同一个 UI 组件，按 `variant` 区分 |
| 网络影响 vs 网络影响情况                     | **同一模块**，统一名"网络影响"                                                                |
| 逻辑站清单 vs 逻辑站点清单                   | **同一模块**，统一名"逻辑站清单"                                                              |
| 基站退服（A 和 B 都出现）                    | **同一模块**，共用坐标                                                                        |
| 区域统计                                     | **不存在**（review 时发现看错）                                                               |

实现要点：建一个共享 UI 组件（如 `service-recovery-panel`），暴露 `variant: 'city' \| 'cell'` prop 区分 A 组和 B 组；两个模块目录分别引用该组件并接入不同数据源。

### 2.7 重叠处理

不同层级下模块互斥显示，**不存在物理重叠**；原 §"已知重叠"问题自动消除。

### 2.8 坐标校核

-   设计稿尺寸：`2880 × 1080`（与 `LargeScreenEnv` 的 `designWidth` / `designHeight` 一致）
-   右侧最远边界：1878 + 916 = 2794，落在 2880 内（留 86px 边距）
-   底部面板最高底边：822 + 238 = 1060（退服恢复情况 / 退服小区恢复情况），726 + 323 = 1049（基站退服，A/B 组），758 + 263 = 1021（告警明细，C 组），均在 1080 内
-   地图 100% 铺在最底层；其余面板为浮层，定位使用 `position: absolute`

---

## 三、落地方案

### 3.1 目录结构

在 `web/pages/bj-cmcc-cmd-dispatcher/` 下新增 `modules/` 子目录 + `components/`（共享 UI）+ `store/`：

> ⚠️ `components/` 放在**页面级目录**下（`web/pages/bj-cmcc-cmd-dispatcher/components/`），**不是** `src/components/` 或 `web/components/`：
>
> -   `web/components/`：跨页通用 UI（已有的 `ui/`、`large-screen/` 等），不挂页面级 store
> -   `src/components/`：**不存在**，本项目无此层级
> -   页面私有复用 UI → 必须落在 `web/pages/<page>/components/`，与该页 store 同寿命

```
web/pages/bj-cmcc-cmd-dispatcher/
├── render.tsx          # 已有，本次更新布局（按层级条件渲染）
├── fetch.ts            # 已有，保持不变
├── modules/
│   ├── map/                       # 地图（100%，含层级切换交互）
│   │   └── index.tsx
│   ├── service-recovery/          # 退服恢复情况 (A 组) → 复用 service-recovery-panel，variant='city'
│   │   └── index.tsx
│   ├── service-recovery-cell/     # 退服小区恢复情况 (B 组；task001 阶段暂挂 B/C/D) → 复用 service-recovery-panel，variant='cell'
│   │   └── index.tsx
│   ├── network-impact/            # 网络影响 (A, B 组共用) 906×635, 1878, 87
│   │   └── index.tsx
│   ├── station-outage/            # 基站退服 (A, B 组共用) 906×323, 1878, 726
│   │   └── index.tsx
│   ├── indicators/                # 指标 (C 组) 906×333, 1878, 84
│   │   └── index.tsx
│   ├── logical-station-list/      # 逻辑站清单 (D 组；task001 阶段暂挂 B/C) 906×313, 1878, 431
│   │   └── index.tsx
│   ├── support-tasks/             # 联保障任务 (C 组) 435×263, 1878, 758
│   │   └── index.tsx
│   ├── alarm-detail/              # 告警明细 (C 组) 457×263, 2327, 758
│   │   └── index.tsx
│   ├── station-portrait/          # 站址画像 (D 组) 916×333, 1878, 84
│   │   └── index.tsx
│   ├── cell-list/                 # 小区清单 (D 组) 906×353, 1878, 438
│   │   └── index.tsx
│   └── station-performance/       # 站址性能 (D 组) 906×223, 1878, 805
│       └── index.tsx
├── components/
│   └── service-recovery-panel/    # 共享 UI（被 service-recovery / service-recovery-cell 复用）
│       └── index.tsx
└── store/
    └── index.ts                  # store 实例 + 类型 + 选择器全部内联
```

### 3.2 `render.tsx` 改动

将当前的 `<h1>北京移动指挥调度</h1>` 占位文本替换为**全量导入 + store 控制显隐**的容器：

-   外层保持 `<LargeScreenEnv designWidth={2880} designHeight={1080} enableScreenControl={false}>`
-   新增一个 `position: relative; width: 100%; height: 100%` 的容器 `<div className="cmd-dispatcher-stage">`（**必须 relative**，作为后续热区 hot-zone 的定位上下文，见 §3.3.1）
-   **直接 import 全部 11 个模块组件**（不做条件渲染），按 z-order 依次铺到容器内
-   每个模块自己从 store 订阅 `currentLevel`，**通过 `return null` 控制自身显隐**
-   切换层级时模块会卸载（return null） / 重新挂载（return 真实组件），骨架阶段无业务 state，行为可接受
-   `<Background>` **移出 stage 容器**，作为 `<LargeScreenEnv>` 最后一个子元素挂载，并用 inline `style={{ zIndex: 10, pointerEvents: 'none' }}` 覆盖基础组件的 `z-index: -1`（让外框盖在模块之上、又不拦截点击事件）

参考结构：

```tsx
import { MapModule } from './modules/map';
import { ServiceRecoveryModule } from './modules/service-recovery';
import { ServiceRecoveryCellModule } from './modules/service-recovery-cell';
import { NetworkImpactModule } from './modules/network-impact';
import { StationOutageModule } from './modules/station-outage';
import { IndicatorsModule } from './modules/indicators';
import { LogicalStationListModule } from './modules/logical-station-list';
import { SupportTasksModule } from './modules/support-tasks';
import { AlarmDetailModule } from './modules/alarm-detail';
import { StationPortraitModule } from './modules/station-portrait';
import { CellListModule } from './modules/cell-list';
import { StationPerformanceModule } from './modules/station-performance';

export default function BjCmccCmdDispatcher() {
    const currentLevel = useCmdDispatcherStore((s) => s.currentLevel);

    return (
        <LargeScreenEnv
            className="bj-cmcc-cmd-dispatcher"
            designWidth={2880}
            designHeight={1080}
            enableScreenControl={false}
        >
            <div
                className="cmd-dispatcher-stage"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                }}
            >
                {/* 全局底层 */}
                <MapModule />

                {/* 浮层面板（按 z-order；模块内部自行 return null 卸载） */}
                <ServiceRecoveryModule />
                <ServiceRecoveryCellModule />
                <NetworkImpactModule />
                <StationOutageModule />
                <IndicatorsModule />
                <LogicalStationListModule />
                <SupportTasksModule />
                <AlarmDetailModule />
                <StationPortraitModule />
                <CellListModule />
                <StationPerformanceModule />

                {/* 当前层级调试信息（review 用，可保留） */}
                <div style={{ position: 'absolute', right: 24, top: 24, ... }}>
                    currentLevel = {currentLevel}
                </div>
            </div>

            {/* 页面外框：z-index: 10，盖在所有模块之上；pointerEvents: none 不拦截点击 */}
            <Background
                $backgroundImage="bj-cmcc-cmd-dispatcher/background.png"
                style={{ zIndex: 10, pointerEvents: 'none' }}
            />
        </LargeScreenEnv>
    );
}
```

#### 显隐派生规则（在 `store/index.ts` 内实现）

```ts
// task001 阶段暂用 8-level 枚举，PM 确认后 task002 重构为 7-level（删 cell/nr，加 logical）
const LEVEL_TO_GROUP: Record<Level, Group> = {
    city: 'A',
    company: 'A',
    district: 'A',
    street: 'A',
    community: 'B',
    cell: 'B',
    station: 'C',
    nr: 'D',
};

// selector
export const useVisibleGroup = () => useCmdDispatcherStore((s) => LEVEL_TO_GROUP[s.currentLevel]);
```

每个模块组件内部：

```tsx
const visibleGroup = useVisibleGroup();
const myGroup: Group = 'A'; // 写死自身所在 Group
if (myGroup !== visibleGroup) return null;
return <div style={{ position: 'absolute', left: 53, top: 822, width: 1790, height: 238 }}>...</div>;
```

> **本方案统一使用 `return null`**，原因：
>
> -   骨架阶段模块内无业务 state，卸载 / 重挂载无副作用
> -   简洁直接，避免后人误用 `display: none` 导致 17 个 DOM 长期占位
> -   后续如某模块需要保留 state（如滚动位置、表单输入），再单独评估是否切 `display: none`

### 3.3 各模块占位实现

本次仅做骨架，每个 `modules/*/index.tsx` 输出一个占位元素：

-   使用 `position: absolute` 落位（除地图外）
-   骨架形态分两类：
    -   **图片型**（如 `network-impact`、`station-outage`、`station-portrait` 等 UI 设计稿以图片呈现的模块）：直接放 `<img>`，src 指向 `public/static/images/bj-cmcc-cmd-dispatcher/<name>.png`；图片未到位时用半透明色块兜底
    -   **结构型**（如 `indicators`、`logical-station-list`、`cell-list` 等需要装表格 / 图表的模块）：占位 `<div>` + 标题 + 边框，方便肉眼校核
-   标题显示模块名 + 自身坐标 (left/top/W×H) + 所属 Group，便于 review
-   **模块内部订阅 `useVisibleGroup()`**，自身 Group 不匹配时返回 `null`
-   `modules/service-recovery/` 与 `modules/service-recovery-cell/` 都引用同一个 `components/service-recovery-panel/index.tsx`，通过 `variant="city" | "cell"` 区分
-   `components/service-recovery-panel/index.tsx` 接受可选 `src` prop；传 src → `<img>`，否则占位 `<div>`

### 3.3.1 stage 容器与热区（hot zones）

> 来源：UI 设计稿中部分模块本质是图片，后续需要在地图 / 面板上叠加**点击热区**完成交互（如地图层级切换、面板钻取）。

-   stage 容器 `position: relative`（已写入 §3.2），保证内部 `position: absolute` 子元素（模块 / 热区）能正确堆叠
-   热区（`hot-zone`）约定：
    -   落在 stage 容器内、与模块同 z-order 体系，但**始终位于模块之上**（点击优先级）
    -   由各自模块文件内部声明（如 `modules/map/map-hot-zones.tsx`），便于就近维护
    -   形如 `<div className="hot-zone" style={{ position: 'absolute', left, top, width, height }} onClick={...} />`
    -   透明背景，仅靠鼠标事件 / `cursor: pointer` 标识可点
-   本次**仅做约定**，不实际接入热区交互；后续 task 按此约定扩展

### 3.4 页面状态管理（zustand store）

在 `web/pages/bj-cmcc-cmd-dispatcher/store/` 下新增页面级 zustand store，集中管理本页面的 UI / 业务状态。

#### 3.4.1 落点 & 依赖

-   落点：`web/pages/bj-cmcc-cmd-dispatcher/store/`
-   状态库：`zustand@^5.0.15`（已在 `package.json` 依赖中，无需新增依赖安装）
-   与全局 `web/store/index.ts`（空占位）保持解耦，仅服务于本页面

#### 3.4.2 目录结构

本次只建一个文件，所有内容写在 `index.ts` 里：

```
web/pages/bj-cmcc-cmd-dispatcher/store/
└── index.ts   # store 实例 + state / action 类型 + 选择器全部内联
```

> 后续若状态膨胀，再按职责拆 `useCmdDispatcherStore.ts` / `types.ts` / `selectors.ts` / `slices/*`，**本次不做**。

#### 3.4.3 状态范围（本次仅做骨架）

**原则**：模块**内部**状态推荐用 `useSetState`（来自 `@fedx-web-common/react-hooks`，项目内已有依赖）自管；只有**跨模块**共享的状态才进 store。

| 状态字段（占位）                                                                                            | 归属                   | 用途                                     |
| ----------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------- |
| `currentLevel: 'city' \| 'company' \| 'district' \| 'street' \| 'community' \| 'cell' \| 'station' \| 'nr'`（task001 暂用 8-level，task002 重构 7-level：删 cell/nr，加 logical） | store（跨模块）        | 当前地图层级，驱动模块显隐               |
| `setLevel(level)` action                                                                                    | store                  | 切换层级（由地图组件调用）               |
| `selectedModuleId: string \| null`                                                                          | store（跨模块）        | 当前选中的模块 id（联动 / 高亮其它模块） |
| `modalOpen: boolean`                                                                                        | store（跨模块）        | 通用弹窗开关（任意模块触发，全局生效）   |
| `activeTab` 等模块内部 UI                                                                                   | **模块内 useSetState** | 不进 store                               |

**派生 selector**（同文件导出，无需 store 存储）：

| Selector                                      | 返回                               | 用途                                         |
| --------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| `useVisibleGroup(): 'A' \| 'B' \| 'C' \| 'D'` | 当前 `currentLevel` 映射到的 Group | 每个模块订阅此 selector 决定 `display: none` |

> 本次 store 仅占 4 个跨模块字段（含 `currentLevel`）+ 1 个派生 selector；模块内字段**不预先在 store 建位**，等用到时在组件内 `useSetState` 即可。
> store 实际业务字段后续按需再补，本次**只确保 store 能 create、能被组件订阅、能改值**。

#### 3.4.4 接入约定

-   使用 `zustand` 的 `create<T>()(...)` 形式（带 TS 类型）
-   默认导出**单个 store 实例**（不传 props 的全局单例），便于跨模块共享
-   组件使用 `const value = useCmdDispatcherStore(s => s.xxx)` 选择器订阅，禁止整 store 订阅
-   派生选择器（如 `useVisibleGroup`）放在 `store/index.ts` 同文件内 export，组件按需 import
-   禁止在 store 内发起 fetch / socket —— 数据层走 `fetch.ts`，store 只持有"已拿到的数据 + UI 状态"
-   **模块内 state 不进 store**：统一使用 `useSetState`（`@fedx-web-common/react-hooks`，项目已有依赖）自管；支持对象式 state + 部分更新，比裸 `useState` 更适合多字段表单 / UI 状态；store 只承载跨模块共享状态
-   与 SSR 的关系：本次不涉及 SSR 数据流（store 初始化为客户端状态）

#### 3.4.5 不在本次范围（store 部分）

-   ❌ 真实业务字段（站点列表 / 退服数据等）接入 store
-   ❌ 持久化（`persist` 中间件）
-   ❌ DevTools / 日志中间件
-   ❌ 与 `web/store/index.ts` 的整合或合并
-   ❌ SSR 注入
-   ❌ 拆 `useCmdDispatcherStore.ts` / `types.ts` / `selectors.ts` / `slices/*`（等状态膨胀再拆）
-   ❌ 把模块内部状态（tab、表单、loading 等）放进 store

---

## 四、不在本次范围

明确**不做**的事，避免 scope 蔓延：

-   ❌ 数字人接入（不引入 `MetaHumanCustomTrigger`、不启用 `enableMetaHuman`）
-   ❌ 真实数据接入（不接 Mock JSON、不接 Socket）
-   ❌ 模块内部业务实现（地图层级切换逻辑、图表、数据列表等都先空着）
-   ❌ 样式美化（边框、配色仅占位级，足够区分边界即可）
-   ❌ 响应式 / 自适应处理（设计稿固定 2880×1080）
-   ❌ 地图层级切换的真实交互实现（仅在 store 暴露 `setLevel`，地图组件本次仅占位、点击不实际切层；后续 task 接入）
-   ❌ 热区 hot-zone 实际接入（仅在 §3.3.1 写约定，**不做**任何 hot-zone 节点；后续 task 接入）
-   ❌ 模块真实图片资源（仅声明 placeholder 路径，图片资产由设计交付；本次用半透明色块兜底）

---

## 五、验收标准

完成 review 后，需同时满足：

1. 页面 `/bj-cmcc-cmd-dispatcher` 可正常打开，无运行时报错
2. `render.tsx` **直接 import 全部 11 个模块**，不做条件渲染
3. 全部 17 个模块的占位框在 2880×1080 设计稿下的位置与尺寸 **完全匹配** §2 各组坐标表
4. 地图模块始终在最底层覆盖整屏
5. 不引入数字人相关代码 / 依赖
6. 默认 `currentLevel = 'street'`（或你最常演示的层级），对应 Group A 模块可见；其它模块 `return null` 卸载
7. 4 组模块按 §2 分组互斥，不会同时显示（避免重叠）
8. `service-recovery` 与 `service-recovery-cell` 共用 `components/service-recovery-panel`，通过 `variant` 区分；两个模块目录独立存在
9. `store/index.ts` 暴露 `currentLevel` + `setLevel()` + `useVisibleGroup()` selector；组件通过选择器订阅可读 / 可写
10. `store/index.ts` 内的 state / action / selector 类型可编译通过
11. 不新增依赖（`zustand` / `useSetState` 均已存在）
12. store 仅承载**跨模块**状态（含 `currentLevel`）；模块内状态用 `useSetState` 自管，不进 store
13. 切换 `currentLevel` 时不可见模块 `return null` 卸载、可见模块重新挂载（**显隐统一用 `return null`**，不使用 `display: none`）

---

## 六、文档同步要求

按 SKILL.md 自动维护协议，本次完成后需同步：

| 触发动作                                                            | 必须更新                                            |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| 新增 `web/pages/bj-cmcc-cmd-dispatcher/modules/` 11 个子目录        | `status/current.md`                                 |
| 新增 `web/pages/bj-cmcc-cmd-dispatcher/components/` 目录（共享 UI） | `status/current.md` + `design/003-frontend.md`      |
| 新增 `web/pages/bj-cmcc-cmd-dispatcher/store/` 目录                 | `status/current.md`                                 |
| 模块化目录约定（modules/<name>/index.tsx）首次落地                  | `design/003-frontend.md`（追加模块拆分约定小节）    |
| 共享 UI 组件约定（components/）首次落地                             | `design/003-frontend.md`（追加共享组件约定）        |
| 页面级 zustand store 约定首次落地                                   | `design/003-frontend.md`（追加 store 目录约定小节） |
| 地图层级 ↔ 模块映射（按层级条件渲染）首次落地                      | `design/003-frontend.md`（追加层级渲染约定）        |
| 自检                                                                | `status/checklist.md`（前端项）                     |

---

## 七、看板

**已完成（骨架落地）**

-   [x] 创建 `modules/` 目录及 11 个占位模块文件（按 §2 分组）
-   [x] 创建 `components/service-recovery-panel/` 共享 UI（暴露 `variant` + `src` prop）
-   [x] 创建 `store/index.ts`（`currentLevel` + `setLevel` + 跨模块字段 + `useVisibleGroup` selector）
-   [x] 改造 `render.tsx` 直接 import 全部 11 个模块，按 z-order 铺到 stage 容器内
-   [x] 每个模块内部订阅 `useVisibleGroup()`，自身 Group 不匹配时返回 `null`
-   [x] stage 容器 `position: relative` 已就位（为后续热区铺路）
-   [x] 图片型模块 `<img>` src 已接入 UI 出图（4 张：地图 / 网络影响 / 基站退服 / 退服恢复情况）
-   [x] 走查坐标与 §2 各组表 100% 对齐（含基站退服高度调整 232 → 323）
-   [x] 默认 `currentLevel = 'street'` → Group A 可见、其它组 `return null` 卸载
-   [x] Background 移出 stage、inline `zIndex:10, pointerEvents:'none'` 覆盖基础 z-index

**未完成（待补 / 待 review）**

- [ ] 切换 `currentLevel` 实际验证 4 组互斥（见 task002 [task-2026-08-24-002-map.md](./../task-2026-08-24-002-map.md)）
- [ ] B/C/D 组模块图片资源（见 task003 [task-2026-08-24-003-bcd-modules.md](./../task-2026-08-24-003-bcd-modules.md)）
- [ ] 同步 `status/current.md`（§6 / §8.4）
- [ ] 同步 `design/003-frontend.md`（§6 / §8.4）
- [ ] 按 `status/checklist.md` 自检（§6）
- [ ] §8 反哺 design 文档（PM 输出回填）

---

## 八、收口：反哺 design 文档（PM 输出回填）

> 目的：本 task 在执行过程中产出了**本该由 PM 输出但 PM 未交付的部分**（模块清单、坐标、命名约定、层级映射等），跑通后必须反哺到 design 文档，避免知识只停留在 task 里。

### 8.1 回填目标

| 文档                      | 回填内容（来源 = 本 task §X）                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `design/001-pm-output.md` | §2 模块清单与坐标、§2.6 模块复用约定、§2.7 重叠处理；作为 PM 验收基线                                                                            |
| `design/003-frontend.md`  | §3.1 目录结构（`modules/` / `components/` / `store/`）、§3.2 全量 import + `return null` 显隐、§3.4 store + 派生 selector、§3.4 useSetState 约定 |
| `status/current.md`       | §3.1 目录树 + §6 同步项（task 完成后已更新；本次确认无遗漏）                                                                                     |

### 8.2 触发条件

**仅当 §5 验收标准 1-13 全部通过**，才执行 §8 回填；若任一项不通过，先回头修 task / 修代码，不允许跳过验收直接回填。

### 8.3 回填范围（最小集）

-   **001-pm-output.md**：新增「模块清单与坐标」「层级 ↔ 模块映射」「模块复用约定」3 个小节
-   **003-frontend.md**：新增「页面级模块拆分约定」「共享 UI 组件约定」「页面级 zustand store 约定」「按层级显隐约定（`return null`）」4 个小节
-   **status/current.md**：核对 §6 表格是否完整覆盖本次新增的 11 个模块目录、`components/`、`store/`、4 组互斥显示规则

### 8.4 回填 checklist（自检）

-   [ ] `001-pm-output.md` 已包含 §2 模块清单（17 项 / 4 组）
-   [ ] `001-pm-output.md` 已包含 §2.6 复用约定（5 项结论）
-   [ ] `003-frontend.md` 已包含 `modules/<name>/index.tsx` 拆分约定
-   [ ] `003-frontend.md` 已包含 `components/<shared>/index.tsx` 共享 UI 约定（含 `variant` 示例）
-   [ ] `003-frontend.md` 已包含 `store/index.ts` 页面级 store 约定（含 `useVisibleGroup` 派生 selector）
-   [ ] `003-frontend.md` 已包含"模块显隐统一 `return null`，不用 `display: none`"硬性约定
-   [ ] `status/current.md` 已记录 11 个模块目录 + `components/` + `store/` + 4 组显隐规则
-   [ ] 文档开头标注回填日期（2026-08-24）

---

## 九、PM 待澄清（不阻塞当前 task）

> 编码侧的 `currentLevel` 枚举由前端自行定义，无需 PM 确认。
> 以下 5 项需要 PM 澄清，但**不阻塞当前骨架 task**，作为独立澄清清单跟踪。

### 9.1 已收到回复（2026-08-24，营营总）

**问题 2/3（合并回复）**：分公司 → 石景山区 → 广宁街道 → 某社区 → 物理站 → 逻辑站 的层级过程是否正确？

**PM 回答**：✅ 对的。补充：

-   **东山社区层级**（即 `community`）→ 都是**物理站**（每个社区下面挂 N 个物理站）
-   **物理站** = 路边能看到的"杆子、箱子"（即基站实体）
-   **逻辑站** = 挂在物理站上的设备单元（2G / 4G / 5G 信号单元）
-   一个物理站一般有 2/4/5G 的逻辑单元，所以"物理站 → 逻辑站"是下钻关系

**问题 1**：`city` 是否就是"北京"？是否需支持其它城市？是否还有"省 / 全国"层级预留？

**PM 回答**：✅ city 就是**北京**，**没有省、全国**层级。7 层固定。

**问题 2 补充**：东山社区层级地图视图的展示细节（地图是否换图 / 是否显示物理站点位）→ **不在本 task 澄清，移到 task002 详述**。

### 9.2 影响梳理（重要）

PM 的回复对当前 task 的几个核心假设产生**实质冲击**：

| #   | 原假设                                             | PM 实际                                                                                             | 影响                                                                 |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | `currentLevel` 有 8 个枚举（含 `cell` 小区、`nr`） | 实际只有 7 个：`city`/`company`/`district`/`street`/`community`/`station`(物理站)/`logical`(逻辑站) | **删 `cell` 和 `nr`，新增 `logical`**                                |
| 2   | Group B 是 "小区 / 社区" 双层                      | 实际只有"社区"一层（PM 明确"东山社区层级都是物理站"，无小区层）                                     | **Group B 只保留 `community`**                                       |
| 3   | Group D 是 "nr"（5G 视图）                         | 实际不存在 NR 独立层级；5G 是逻辑站下的一种信号单元                                                 | **Group D 改为 `logical`**（不再叫 nr）；模块命名可能要重新审视      |
| 4   | 物理站 = 基站（用 `station` 表示）                 | ✅ 一致；但 UI 设计稿里的"基站退服"等模块归属可能要重新校验                                         | 模块不变，但需要 PM 二次确认哪些模块属于"物理站视图" vs "逻辑站视图" |
| 5   | "退服小区恢复情况" / "小区清单" 等命名             | PM 没明确表态，但既然没有"小区"层级，这些命名可能也要调整                                           | **PM 仍待澄清**（原 §9-5）                                           |

### 9.3 决定

为避免半成品落地 + 反复返工，**本次 task001 骨架先按原 8-level / 4-Group 实现**，但：

-   **保留当前 task001 已落地的代码**（store / modules / render.tsx），不动
-   **task002（地图交互）首项动作** = 应用 PM 回复重构：
    -   `currentLevel` 删 `cell`/`nr`，加 `logical`（7 个值）
    -   `LEVEL_TO_GROUP` 重映射（社区/物理站/逻辑站 三层独立 Group）
    -   "小区清单 / 站址画像 / 站址性能" 等模块按新层级归属重新挂载
    -   **东山社区层级地图视图细节** 在 task002 详述
-   **task003（B/C/D 模块图片）** = 待 PM 二次确认命名 + 出图后再做

### 9.4 剩余待澄清项

| #   | 待澄清项                                                        | 假设（前端默认）        | 处理方式                                                                                                    |
| --- | --------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| 4   | 物理站视图 / 逻辑站视图，模块清单是否需要二次确认？             | 沿用 task 原 B/C/D 模块 | **记录到 [task-2026-08-24-002-map.md](./../task-2026-08-24-002-map.md)**，执行时再描述 |
| 5   | "退服小区恢复情况" / "小区清单" / "站址画像" 等中文名是否调整？ | 沿用现有命名            | **记录到 [task-2026-08-24-003-bcd-modules.md](./../task-2026-08-24-003-bcd-modules.md)**，执行时再描述         |

### 9.5 使用方式

-   已回复项在 `001-pm-output.md` 末尾以「PM 回复记录」附录形式登记
-   剩余 2 项已分流到 task002 / task003，本 task 不再跟踪
-   9.2 的重构在 task002 落地

---

## 十、实施记录（implementation log）

> 记录本次实施过程中的实际改动与决策，便于 review 与后续追溯。

### 10.1 落点清单

```
web/pages/bj-cmcc-cmd-dispatcher/
├── render.tsx                           # 全量 import 11 模块 + stage 容器 + Background 外框
├── store/
│   └── index.ts                         # zustand store + useVisibleGroup 派生 selector
├── components/
│   └── service-recovery-panel/
│       └── index.tsx                    # 共享 UI（variant + src 双 prop）
└── modules/
    ├── map/                             # 北京市.png（全屏 2880×1080）
    ├── service-recovery/                # variant='city'，已接 退服恢复情况.png
    ├── service-recovery-cell/           # variant='cell'，占位
    ├── network-impact/                  # 已接 网络影响.png
    ├── station-outage/                  # 已接 基站退服.png（高度 232 → 323）
    ├── indicators/                      # 占位
    ├── logical-station-list/            # 占位
    ├── support-tasks/                   # 占位
    ├── alarm-detail/                    # 占位
    ├── station-portrait/                # 占位
    ├── cell-list/                       # 占位
    └── station-performance/             # 占位
```

### 10.2 关键决策（与原计划偏差）

| #   | 决策点                         | 原计划       | 实际做法                                               | 原因                                                                     |
| --- | ------------------------------ | ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1   | 基站退服尺寸                   | 906×232      | **906×323**                                            | UI 出图实测 323 高                                                       |
| 2   | Background z-index             | 复用基础组件 | inline `style={{ zIndex: 10, pointerEvents: 'none' }}` | 基础组件 z-index:-1 被模块遮挡；inline 比 styled wrapper 更直接          |
| 3   | Background 位置                | stage 内     | `<LargeScreenEnv>` 最后一个子（stage 外）              | 避免被 stage 容器 stacking context 影响                                  |
| 4   | `service-recovery-panel` props | 仅 `variant` | **新增 `src?: string`**                                | A 组已出图（退服恢复情况.png），B/C/D 组暂未出图；用同一组件兼容两种状态 |
| 5   | store 默认 currentLevel        | —            | `'street'`                                             | 演示场景最常用，对应 Group A                                             |

### 10.3 TS 验证

-   `bj-cmcc-cmd-dispatcher` 下 TS 0 错误
-   项目其余 5 个错误（layout / useSocketIOClient / large-screen-demo / metahuman-shanxi / unicom-shannxi）均为**已有问题**，不在本次 scope

### 10.4 已知未达成的验收项

-   §5 验收第 7 条（切换 `currentLevel` 实际验证 4 组互斥）需要临时挂 store 到 window 或装 dev 调试面板，本次未做
-   B/C/D 组模块图片资源未到位，对应模块保留占位 div
-   §6 文档同步、§8 design 回填 尚未执行（依赖 §5 验收全部通过）

---

## 文档元信息

> 日期：2026-08-24
> 状态：骨架已落地（实施中），待回填 design / status（§8）
