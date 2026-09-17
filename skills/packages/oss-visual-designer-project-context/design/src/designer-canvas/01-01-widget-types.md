# Widget 类型定义（事实文档）

> 配套 [01-data-model.md](./01-data-model.md) | 关注点：designerCanvas slice 持有的数据结构完整定义
>
> 本文是 `WidgetItem` / `WidgetData` / `WidgetConfig` / `PageConfig` / `SchemaConfig` 等**核心类型的权威事实**。
> `DataConfig` / `InteractionMap` / `WidgetAnimation` 等子类型属于其他模块（`plugins/data-fetcher`、`plugins/interaction`、`plugins/animation`），本文仅保留链接指向 research 文档，等后续相关模块有事实文档需求时再各自下沉。

---

## 1. SchemaConfig（顶层序列化结构）

`DesignerCanvasState` 的序列化形态。后端持久化为字符串，前端 `JSON.parse` 后注入 store。

代码位置：`src/designer/renderer/designer-parser/index.jsx`

```ts
export interface SchemaConfig {
    /** 画布与背景相关页面配置 */
    page: PageConfig;

    /** 画布上的组件树（数组，可嵌套 children） */
    components: WidgetItem[];

    /** 实时数据流订阅记录（组件唯一 ID → 源 ID） */
    realtimeDataFlow?: RealtimeDataFlowItem[];

    /** 自定义字段映射，组件唯一 ID → JSON 字符串配置 */
    customFieldsListMapping?: Record<string, string>;

    /** 业务元信息（场景名、视觉类型、id、缩略图等） */
    meta?: SchemaMeta;
}
```

---

## 2. PageConfig（画布配置）

代码位置：`src/designer/configuration-panel/page/schema.ts`、`src/store/modules/designer-canvas.ts`（initialState.page）

```ts
/** 缩放模式 */
export type ZoomMode = 'scaleY' | 'scaleX' | 'cover' | 'none';

/** 背景模式 */
export type BackgroundMode = 'define' | 'custom' | 'video' | 'none';

/** 预设屏幕尺寸 key，与 src/designer/constants.ts DIMENSION 对应 */
export type PageSizeKey =
    | '1920 x 1080'
    | '3840 x 2160'
    | '1440 x 960'
    | '1366 x 768'
    | '1344 x 750'
    | '1472 x 828'
    | '640 x 1136'
    | '360 x 740'
    | '360 x 760'
    | '1024 x 768'
    | '1112 x 834'
    | 'custom';

export interface CustomPageSize {
    width: number;
    height: number;
}

export interface PageConfig {
    /** 预设屏幕大小 key，自定义时为 'custom' */
    pageSize: PageSizeKey | string;

    /** 自定义画布尺寸（仅 pageSize === 'custom' 时生效） */
    customPageSize?: CustomPageSize;

    /** 画布宽高（由 pageSize 自动推导或 customPageSize 提供） */
    width: number;
    height: number;

    /** 缩放策略 */
    zoom: ZoomMode;

    /** 背景模式 */
    backgroundMode: BackgroundMode;

    /** 纯色背景（backgroundMode === 'none' 时显示） */
    backgroundColor?: string;

    /** 自定义背景图资源名（背景素材库中上传后的文件名） */
    backgroundImage?: string;

    /** 内置背景图定义 */
    backgroundDefine?:
        | string
        | {
              url: string;
              isMaterial?: boolean;
          };

    /** 视频背景 URL（仅 backgroundMode === 'video' 时生效） */
    backgroundVideoUrl?: string;

    /** 背景模糊度（0-20） */
    backgroundBlur?: number;

    /** 背景透明度（0-100） */
    backgroundOpacity?: number;

    /** 栅格间距 */
    grid?: number;

    /** 封面图资源名 */
    thumbnail?: string;

    /** 兼容字段，旧版缩略图；运行时会被归并到 thumbnail */
    thmbImage?: string;
}
```

---

## 3. WidgetItem（组件树节点）

`designerCanvas.components` 数组的元素类型。group / layout-block 可嵌套 children，field 为叶子节点。

代码位置：`src/designer/renderer/GeneratorWidget.tsx`、`src/designer/renderer/designer-field/types.ts`

```ts
/** 根节点唯一 ID（src/designer/renderer/utils.ts） */
export const ROOT_UNIQUE_ID = '-';

/** 组件类型枚举（src/designer/constants.ts） */
export type WidgetType = 'field' | 'group' | 'layout-block';

/** 通用位置信息 */
export interface Location {
    left: number;
    top: number;
}

/** 变换（旋转、缩放） */
export interface Transform {
    rotate?: number | null;
    scale?: string | null;
}

export interface WidgetItem {
    /** 全局唯一 ID（GUID 字符串） */
    uniqueId: string;

    /** 组件类型 */
    type: WidgetType;

    /** 组件业务数据（由各物料运行时消费） */
    data: WidgetData;

    /** 子节点（只有 group / layout-block 持有） */
    children?: WidgetItem[];

    /** 父级 ID 列表（运行时由 flatDesignerList 注入，非持久化字段） */
    parentUniqueId?: string[];
}
```

### 3.1 与 FlatField 的关系

`byId` 索引存的是 `FlatField`（不含 children），`WidgetItem` 是树节点（含 children）。详见 [01-data-model.md §2](./01-data-model.md)。

```ts
// FlatField（byId 索引）
interface FlatField {
    uniqueId: string;
    type: string;
    parentId: string;        // ROOT_UNIQUE_ID 表示根
    data: { config: any; [key: string]: any };  // 不含 children
}

// WidgetItem（components 树节点）
interface WidgetItem {
    uniqueId: string;
    type: WidgetType;
    data: WidgetData;
    children?: WidgetItem[]; // 树结构
    parentUniqueId?: string[]; // 运行时注入
}
```

`buildIndex`（`src/designer/renderer/utils.ts`）从 `WidgetItem[]` 构建 `FlatField` 索引时，`byId[id].data` 直接复用 `WidgetItem.data` 引用（浅引用）。

> ⚠️ **task-002/003（2026-07-28）单源架构变更**：
> - `buildIndex` 签名扩展为 `buildIndex(components, oldById?)`：未变 data 节点复用旧 byId 引用，保持 `useFieldConf` 订阅粒度（O(n) 但避免无效 re-render）。
> - `setComponents` / `setState` / `updateFieldConfig` 三个 reducer 均在 produce 外调用 `buildIndex` 重建 byId/parentMap。
> - **已删除字段**（task-003）：`FlatField.dirtyConfigKeys: Set<string>` —— 双源时代记录字段级更新过的 config 字段名，供 `fieldPreserve` 合并判断。单源后 byId 纯派生，无需记录。
> - **已删除函数**（task-003）：`mergeByIdIntoTree` / `getSaveableComponents` / `patchFieldConf` —— 详见 [06-principles.md §12](./06-principles.md)。

---

## 4. WidgetData（组件业务数据）

代码位置：`src/designer/renderer/GeneratorWidget.tsx`、`src/designer/renderer/designer-field/types.ts`

```ts
export interface WidgetData {
    /** 通用 config，所有组件共有（详见 §5） */
    config: WidgetConfig;

    /** 交互定义（详见 research 渲染JSON类型声明.md §6） */
    interactions?: InteractionMap;

    /** 入场动画配置（详见 research 渲染JSON类型声明.md §7） */
    animation?: WidgetAnimation;

    /** 数据源配置（常规数据源，详见 research 渲染JSON类型声明.md §8） */
    dataConfig?: DataConfig;

    /** 自定义数据源 API 配置（详见 research 渲染JSON类型声明.md §9） */
    customDataSourceApiConfig?: CustomDataSourceApiConfig;

    /** 导出 API 配置（同 customDataSourceApiConfig 结构） */
    exportAPIConfig?: CustomDataSourceApiConfig;

    /** 下钻配置（详见 research 渲染JSON类型声明.md §10） */
    drillDown?: DrillDownItem[];

    /** 业务扩展字段（各物料可自由追加，例如 title / permission） */
    [key: string]: any;
}
```

> ⚠️ 以下子类型的完整定义**当前在** [渲染JSON类型声明.md](../../research/渲染JSON类型声明.md) §6-§10（**探索性调研，非权威事实**）：
> - `InteractionMap`（`plugins/interaction`）
> - `WidgetAnimation`（`plugins/animation`）
> - `DataConfig` / `CustomDataSourceApiConfig`（`plugins/data-fetcher`）
> - `DrillDownItem`（`src/designer/renderer/components/item-field/DrillDownItem.tsx`）
>
> 这些子类型不属于 designerCanvas slice，等后续相关模块有事实文档需求时再各自下沉到对应模块的 design 目录。

---

## 5. WidgetConfig（组件通用配置）

`WidgetData.config` 的类型。字段命名与 CSS 一致，field / group / layout-block 共享。

代码位置：`src/designer/renderer/designer-field/utils.ts`、`src/designer/renderer/components/group-field/index.jsx`、`src/designer/renderer/designer-parser/index.jsx`

```ts
export interface WidgetConfig {
    /** 名称（用于图层树、配置面板标题） */
    title?: string;

    /** 唯一标识（冗余字段，部分组件读此处） */
    name?: string;

    /** 画布中的 X 坐标 */
    left: number;

    /** 画布中的 Y 坐标 */
    top: number;

    /** 容器宽度 */
    width: number;

    /** 容器高度 */
    height: number;

    /** 背景色 */
    background?: string;

    /** 锁定图层（禁止拖拽/调整大小） */
    isLock?: boolean;

    /** 隐藏图层 */
    isHidden?: boolean;

    /** 旋转 / 缩放 */
    transform?: Transform;

    // ─── 边框相关 ─────────────────────────────
    borderStyle?: string;       // 'solid' | 'dashed' | ...
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;

    // ─── 阴影相关 ─────────────────────────────
    shadowColor?: string;
    shadowWidth?: number | string;
    shadowOffset?: number;

    // ─── 组（group）专用轮播配置 ────────────────
    /** 组内对象轮播（slick 跑马灯） */
    slider?: boolean;

    /** 自动播放 */
    autoplay?: boolean;
    autoplaySpeed?: number;     // ms

    /** 渐入渐出 vs 滑动 */
    fade?: boolean;

    /** 动画时长 ms */
    speed?: number;

    /** 缓动函数 */
    easing?: string;

    /** 鼠标悬浮暂停 */
    pauseOnHover?: boolean;

    /** 纵向轮播 */
    vertical?: boolean;

    /** 无限循环 */
    infinite?: boolean;

    /** 自动播放控制器位置 */
    isAutoPlayController?: boolean;
    autoPlayControllerConfig?: { left?: number; top?: number };

    /** 指示器（dots） */
    dots?: boolean;
    dotsType?: 'default' | 'custom';
    dotFontSize?: number;
    dotFontFamily?: string;
    dotFontWeight?: string | number;
    dotHeight?: number;
    dotSpace?: number;
    dotBackground?: string;
    dotBackgroundActive?: string;
    dotColor?: string;
    dotColorActive?: string;

    /** 箭头（arrows） */
    arrows?: boolean;
    arrowsType?: 'default' | 'custom';
    prevArrowImg?: string;
    nextArrowImg?: string;
    arrowsWidth?: number;
    arrowsHeight?: number;
    arrowsSpace?: number;

    /** 轮播枚举配置（每张幻灯片的标识） */
    sliderEmuns?: Array<{ id: string | number; name?: string; [k: string]: any }>;

    /** 触发抛事件的时机 */
    triggerChangeMethod?: 'afterChange' | 'beforeChange';

    /** 权限控制（用于根据 zoneId 选择默认页） */
    permission?: any;

    // ─── 其他扩展 ─────────────────────────────
    [key: string]: any;
}
```

### 5.1 designerCanvas 关心的字段

`updateFieldConfig` 和 `setComponents` 操作的 `config` 字段主要是布局相关字段：

| 字段 | 操作 | action |
| --- | --- | --- |
| `left` / `top` | 拖拽 onDragStop | `updateFieldConfig` |
| `width` / `height` | 拖拽 onResize / recalcGroupBounds | `updateFieldConfig` / `setComponents` |
| `title` | 配置面板改名 | `updateFieldConfig` |
| `isLock` / `isHidden` | 锁定/隐藏按钮 | `updateFieldConfig` |
| 轮播配置（`slider` / `autoplay` 等） | 配置面板 | `updateFieldConfig` |

---

## 6. 运行时附加类型

代码位置：`src/store/modules/designer-canvas.ts`

```ts
/** 实时数据流条目（designerCanvas.realtimeDataFlow 数组元素） */
export interface RealtimeDataFlowItem {
    uniqueId: string;
    sourceId: string;
}

/** 场景/模板的元信息（designerCanvas.meta） */
export interface SchemaMeta {
    id?: string | number;
    name?: string;
    visualType?: number;     // 1 场景 / 2 模板
    shareStatus?: number;
    thumbnail?: string;
    [key: string]: any;
}
```

---

## 7. 完整 JSON 示例（精简）

```json
{
    "page": {
        "pageSize": "1920 x 1080",
        "width": 1920,
        "height": 1080,
        "zoom": "scaleX",
        "backgroundMode": "define",
        "backgroundColor": "rgba(0,17,52,1)",
        "backgroundDefine": "background-2.png",
        "backgroundBlur": 0,
        "backgroundOpacity": 100,
        "thumbnail": "thumbnail.png"
    },
    "components": [
        {
            "uniqueId": "comp_001",
            "type": "field",
            "data": {
                "config": {
                    "title": "示例图表",
                    "left": 100,
                    "top": 100,
                    "width": 600,
                    "height": 300,
                    "isLock": false,
                    "isHidden": false
                },
                "dataConfig": {
                    "dataType": "api",
                    "api": {
                        "mode": "get",
                        "url": "/api/chart/data",
                        "headers": {},
                        "params": {}
                    }
                },
                "interactions": {
                    "click-field-1": ":remote-field-1"
                },
                "animation": { "enter": "designer_animate__fadeIn" }
            }
        },
        {
            "uniqueId": "group_001",
            "type": "group",
            "data": {
                "config": {
                    "title": "轮播组",
                    "left": 0,
                    "top": 500,
                    "width": 1920,
                    "height": 300,
                    "slider": true,
                    "autoplay": true,
                    "autoplaySpeed": 3000,
                    "sliderEmuns": [
                        { "id": "1", "name": "幻灯片 1" },
                        { "id": "2", "name": "幻灯片 2" }
                    ]
                }
            },
            "children": [
                { "uniqueId": "child_001", "type": "field", "data": { "config": { "left": 0, "top": 0, "width": 600, "height": 300 } } },
                { "uniqueId": "child_002", "type": "field", "data": { "config": { "left": 600, "top": 0, "width": 600, "height": 300 } } }
            ]
        }
    ],
    "realtimeDataFlow": [],
    "customFieldsListMapping": {},
    "meta": {
        "id": 123,
        "name": "示例大屏",
        "visualType": 1,
        "shareStatus": 0
    }
}
```

---

## 8. 代码位置索引

| 主题 | 文件 |
| --- | --- |
| SchemaConfig 顶层结构 | `src/designer/renderer/designer-parser/index.jsx` |
| WidgetItem / WidgetData | `src/designer/renderer/GeneratorWidget.tsx`、`src/designer/renderer/designer-field/types.ts` |
| WidgetConfig 布局字段 | `src/designer/renderer/designer-field/utils.ts` |
| WidgetConfig 轮播字段 | `src/designer/renderer/components/group-field/index.jsx` |
| PageConfig schema | `src/designer/configuration-panel/page/schema.ts` |
| PageConfig initialState | `src/store/modules/designer-canvas.ts`（`initialState.page`） |
| ROOT_UNIQUE_ID / WidgetType | `src/designer/renderer/utils.ts`、`src/designer/constants.ts` |
| buildIndex / FlatField | `src/designer/renderer/utils.ts` |
| RealtimeDataFlowItem / SchemaMeta | `src/store/modules/designer-canvas.ts` |
