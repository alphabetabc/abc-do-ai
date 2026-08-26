# 前端开发规范 (Frontend Conventions)

适用于北京移动指挥调度模块（cmd-dispatcher）的大屏前端代码开发。

## 涉及目录

-   `web/pages/` —— 页面级组件（按路由组织）
-   `web/components/` —— 公共组件（含 `large-screen/` 大屏容器）
-   `public/static/` —— 静态资源（图片、Mock 数据等）

---

## 1. 页面目录结构

新增页面统一遵循「一个路由 = 一个目录」：

```
web/pages/<route-name>/
├── render.tsx   # 页面组件入口
├── fetch.ts     # SSR 数据预取
└── index.less   # 页面级样式（可选）
```

-   复杂页面可在目录下加 `modules/` 子目录组织 widget。
-   渲染入口固定使用 `LargeScreenEnv` + `WidgetsRender` 大屏容器。

## 2. 路由同步

新增页面路由必须同步三处：

1. `src/controller/index.ts` 增加 `@Get('/<route-name>')`
2. `web/pages/<route-name>/` 创建对应页面目录
3. `public/static/images/<route-name>/` 创建对应图片目录（如有图片资源）

## 3. 大屏容器配置

页面根组件使用 `LargeScreenEnv`，按设计稿设置：

| 字段                  | 说明                               | 示例                       |
| --------------------- | ---------------------------------- | -------------------------- |
| `className`           | 自定义类名，用于 index.less 作用域 | `"bj-cmcc-cmd-dispatcher"` |
| `designWidth`         | 设计稿宽度（px）                   | `2880`                     |
| `designHeight`        | 设计稿高度（px）                   | `1080`                     |
| `enableScreenControl` | 是否启用屏幕控制消息               | `false`                    |
| `enableMetaHuman`     | 是否嵌入数字人（可选）             | `false`                    |

## 4. 静态资源

-   图片、背景等放入 `public/static/images/<route-name>/`。
-   引用路径使用绝对路径 `/static/images/<route-name>/xxx.png`。
-   Mock 数据优先放入 `public/static/mock/`，前端通过 `fetch('/static/mock/...')` 访问。

## 5. 页面级模块拆分约定（cmd-dispatcher 首次落地）

复杂页面按以下结构拆模块：

```
web/pages/<route-name>/
├── render.tsx                       # 入口，全量 import 模块 + stage 容器
├── fetch.ts
├── modules/                         # 模块目录（按业务/层级拆）
│   ├── <module-name>/index.tsx      # 每个模块独立目录，方便就近维护
│   └── ...
├── components/                      # 页面级共享 UI（区别于 web/components/ 跨页通用）
│   └── <shared-ui>/index.tsx
└── store/                           # 页面级 zustand store（页面内私有）
    └── index.ts
```

**关键约定**：

-   `modules/` 下的模块**默认负责自身层级判断**：订阅 store 的 `useCurrentLevel()`，通过 `MY_LEVELS: Level[]` + `includes` 判断是否可见，不匹配时 `return null` 卸载
-   `render.tsx` **全量 import** 所有模块，不做条件渲染 —— 切换层级时 DOM 保留，仅由各模块内部 `return null` 处理
-   `components/` 是**页面级**复用 UI（区别于 `web/components/` 跨页通用）：

    | 路径                           | 用途                                                    |
    | ------------------------------ | ------------------------------------------------------- |
    | `web/pages/<page>/components/` | ✅ 页面私有复用 UI（如本次的 `service-recovery-panel`） |
    | `web/components/`              | ❌ 不要放页面级组件（这是跨页通用）                     |
    | `src/components/`              | ❌ 本项目无此层级                                       |

### 5.1 含子组件的模块推荐用「外层 wrapper div」模式

当一个模块除了主图还要承载子组件（弹窗 / 透明触发 div / 子面板 / 工具栏 等）时，推荐结构：

```tsx
// 推荐：外层 wrapper div 集中模块定位
<div style={{ position: 'absolute', left, top, width, height }}>
    <img style={{ width: '100%', height: '100%' }} />
    <SubComponent /> {/* 子组件用 right/top 相对 wrapper 定位 */}
</div>
```

**好处**：

1. **主图与子组件共享同一个 positioning context**：子组件不再重复声明 `LEFT/TOP/WIDTH` 等模块坐标常量。
2. **子组件位置调整不影响主图尺寸**：例如触发 div 改成 `right: 0, top: 0` 仅影响子组件，对主图无副作用。
3. **模块显隐一致**：`return null` 时 wrapper 一起消失，子组件跟着卸载（无需单独处理子组件显隐）。

**反例**：`<><img style={{ position: 'absolute', left, top, ... }} /><SubComponent style={{ position: 'absolute', left: LEFT + WIDTH - TRIGGER_W, ... }} /></>`

-   子组件必须自己算绝对坐标，重复声明 `LEFT/WIDTH` 等常量。
-   模块坐标变更时需要同步改子组件。

> 完整约定（含推荐 / 反例 / 适用场景）见 [frontend/004-module-wrapper-div.md](./frontend/004-module-wrapper-div.md)。

## 6. 组件与模块参数（按需查阅）

具体 props / 坐标 / 资源清单已拆分到 `frontend/` 子目录，按需加载以减少上下文：

| 文件                                 | 内容                                                             | 何时查阅                  |
| ------------------------------------ | ---------------------------------------------------------------- | ------------------------- |
| `frontend/001-modules-params.md`     | 12 个业务模块的 Group / 坐标 / 尺寸 / 形态 / 资源清单 + 共性约定 | 新增/修改具体业务模块时   |
| `frontend/002-shared-components.md`  | 共享 UI 组件（`service-recovery-panel`）Props 字段表与使用示例   | 新增/修改页面级共享组件时 |
| `frontend/003-map.md`                | 地图模块设计（层级体系 / 渲染架构 / 绘制交互 / 框选弹窗等）      | 新增/修改地图相关能力时   |
| `frontend/004-module-wrapper-div.md` | 模块「外层 wrapper div」模式（带子组件时）                       | 新增带子组件的模块时      |

> 通用约定（模块全量挂载、`return null` 卸载、`MY_GROUP` 声明等）见下方第 7、8 节。

## 7. 页面级 zustand store 约定

```ts
// store/index.ts
import { create } from 'zustand';

// 7 个层级（PM 确认：city = 北京，无小区层，无 NR 独立层）
export type Level =
    | 'city'
    | 'company'
    | 'district'
    | 'street'
    | 'community'
    | 'station'      // 物理站
    | 'logical';     // 逻辑站

export interface CmdDispatcherState {
    currentLevel: Level;
    setLevel: (level: Level) => void;
    selectedModuleId: string | null;
    modalOpen: boolean;
    // 地图标注字段
    shapes: Shape[];
    selectedShapeId: string | null;
    activeTool: Tool;
    // 时间轴历史回溯（task006）
    currentTimeIndex: number;
    setCurrentTimeIndex: (idx: number) => void;
    // actions...
}

export const useCmdDispatcherStore = create<CmdDispatcherState>(...);

// 派生 selector
export const useCurrentLevel = (): Level =>
    useCmdDispatcherStore(s => s.currentLevel);
```

**接入约定**：

-   使用 `create<T>()(...)` 形式（带 TS 类型）
-   默认导出**单个 store 实例**（全局单例）
-   组件用 `const value = useCmdDispatcherStore(s => s.xxx)` 选择器订阅，**禁止整 store 订阅**
-   派生选择器（如 `useCurrentLevel`）放 `store/index.ts` 同文件 export
-   禁止在 store 内发 fetch / socket —— 数据层走 `fetch.ts`，store 只持有"已拿到的数据 + UI 状态"
-   **模块内 state 不进 store**：用 `useSetState`（来自 `@fedx-web-common/react-hooks`，项目已有依赖）自管
-   **Group 中间层已删除**：模块直接声明 `MY_LEVELS: Level[]`，不经过 Group 映射

## 8. 按层级显隐约定（return null）

模块**全量挂载**，通过 `useCurrentLevel()` + `MY_LEVELS` 自行 `return null` 卸载：

```tsx
const MY_LEVELS: Level[] = ['city', 'company', 'district', 'street'];

export const MyModule = () => {
    const currentLevel = useCurrentLevel();
    if (!MY_LEVELS.includes(currentLevel)) return null;
    return <div style={{ position: 'absolute', left, top, w, h }}>...</div>;
};
```

**显隐统一用 `return null`**，原因：

-   骨架阶段模块内无业务 state，卸载/重挂载无副作用
-   简洁直接，避免后人误用 `display: none` 导致 17 个 DOM 长期占位
-   后续如某模块需要保留 state（如滚动位置、表单输入），再单独评估是否切 `display: none`

## 9. 地图模块设计

地图模块的完整设计（七层层级体系、渲染架构、绘制交互、框选弹窗、store 字段、样式约定、与 timeline 的联动、6 类资源打点）已拆出至独立文档：

→ [frontend/003-map.md](./frontend/003-map.md)（v1.3.0）

**快速入口**：

| 想了解什么                                       | 跳转                                                |
| ------------------------------------------------ | --------------------------------------------------- |
| 七层 total 概览 / 节点数 / 资源数                 | [frontend/003-map.md §2.3](./frontend/003-map.md#23-七层概览一张总表) |
| 6 类资源打点系统（subType / category / icon）    | [frontend/003-map.md §10](./frontend/003-map.md#10-前五层-6-类资源打点系统) |
| timeline ↔ map 联动细节                          | [frontend/003-map.md §8](./frontend/003-map.md#8-与时间轴历史回溯的联动task006) |
| 地图标注 / 框选详情弹窗                          | [frontend/003-map.md §4 §5](./frontend/003-map.md)   |

## 10. Background 外框层级处理

`<Background>` 基础组件自带 `z-index: -1`，但 `cmd-dispatcher` 需要外框盖在模块之上 → **inline 覆盖**：

```tsx
<Background
    $backgroundImage="bj-cmcc-cmd-dispatcher/background.png"
    style={{ zIndex: 10, pointerEvents: 'none' }} // 必须两个一起设：盖上面 + 不拦截点击
/>
```

且 `<Background>` 放在 `<LargeScreenEnv>` 的**最后一个子元素**（不在 stage 容器内），避免 stage 容器 stacking context 影响。

## 11. 时间轴历史回溯（task006）

时间轴历史回溯的完整设计（组件 API、交互模型、视觉设计、数据流、mock 数据、关键决策、与地图的耦合）已拆出至独立文档：

[frontend/005-timeline-history.md](./frontend/005-timeline-history.md)（v1.1.0）

**要点速览**：
- 组件位置：`components/timeline-history/index.tsx`（纯派发控件，嵌入 service-recovery 面板顶部）
- 数据流：TimelineHistory 拖动 → `store.setCurrentTimeIndex(idx)` → map-stage 订阅切换 markers
- 有效层级：city / company / district（"前三层"方案）；street 渲染但不响应；社区及以下不渲染
- mock：`history-timeline.json`，status 恒为 1，marker 数量按 idx 渐增体现退服恢复
- **timeline 与 6 类资源的关系**：当前 mock 仅携带节点 marker，timeline 不展示资源打点；若未来 PM 提供资源时序数据，前端 0 改动即可渲染（见 [005-timeline-history.md §6.6](./frontend/005-timeline-history.md) 与 [003-map.md §8.7](./frontend/003-map.md)）
- 地图接入侧详见 [frontend/003-map.md §8](./frontend/003-map.md#8-与时间轴历史回溯的联动task006)

---

## 已有基础

-   `web/components/large-screen/` —— 大屏容器 `LargeScreenEnv` 与 `WidgetsRender`
-   `@fedx-web-common/react-hooks` —— `useSetState`（模块内 state 自管）
-   `zustand` —— 页面级 store

---

## 文档元信息

> 版本：v1.2.0
> 日期：2026-08-26（v1.2.0：§9 地图模块设计补充快速入口表（指向 003-map.md 新版章节）；§11 时间轴设计补充 timeline 与 6 类资源的关系）
> 历史：
> - v1.1.0（2026-08-25）：§7 store 补充 currentTimeIndex；§11 时间轴历史回溯拆出至 `frontend/005-timeline-history.md`
