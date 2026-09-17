# 渲染 JSON 类型声明(基于源码推断)

> 本文档基于 `src` 目录代码反推出"设计器/渲染器运行所依赖的 JSON 配置"的结构与类型。
> 适用入口:`DesignerParserEntry` → `DesignerParser`(`src/designer/renderer/designer-parser/index.jsx`)。
> 数据来源:后端 `visual/detail`、`snapshot/detail` 接口返回 `config`(字符串)经 `ConfigFormatter.dataConfig` 解析后注入 `DesignerProvider`(`src/designer/DataProvider.tsx`)。

---

## 1. 顶层 SchemaConfig

`DesignerParser` 接收的 `props.schemaConfig` 形态(由 `src/designer/renderer/designer-parser/index.jsx#L11-L97` 推断):

```ts
/**
 * 渲染器顶层配置(运行时 schemaConfig)
 * - 后端持久化为字符串,前端 JSON.parse 后使用
 */
export interface SchemaConfig {
    /** 画布与背景相关页面配置 */
    page: PageConfig;

    /** 画布上的组件树(数组,可嵌套 children) */
    components: WidgetItem[];

    /** 实时数据流订阅记录(组件唯一 ID → 源 ID) */
    realtimeDataFlow?: RealtimeDataFlowItem[];

    /** 自定义字段映射,组件唯一 ID → JSON 字符串配置 */
    customFieldsListMapping?: Record<string, string>;

    /** 业务元信息(场景名、视觉类型、id、缩略图等) */
    meta?: SchemaMeta;
}
```

---

## 2. PageConfig(画布配置)

字段含义与默认值参考 `src/designer/DataProvider.tsx#L75-L108` 与 `src/designer/configuration-panel/page/schema.ts`。

```ts
/** 缩放模式 */
export type ZoomMode = 'scaleY' | 'scaleX' | 'cover' | 'none';

/** 背景模式 */
export type BackgroundMode = 'define' | 'custom' | 'video' | 'none';

/** 预设屏幕尺寸 key,与 src/designer/constants.ts DIMENSION 对应 */
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
    /** 预设屏幕大小 key,自定义时为 'custom' */
    pageSize: PageSizeKey | string;

    /** 自定义画布尺寸(仅 pageSize === 'custom' 时生效) */
    customPageSize?: CustomPageSize;

    /** 画布宽高(由 pageSize 自动推导或 customPageSize 提供) */
    width: number;
    height: number;

    /** 缩放策略 */
    zoom: ZoomMode;

    /** 背景模式 */
    backgroundMode: BackgroundMode;

    /** 纯色背景(backgroundMode === 'none' 时显示) */
    backgroundColor?: string;

    /** 自定义背景图资源名(背景素材库中上传后的文件名) */
    backgroundImage?: string;

    /** 内置背景图定义 */
    backgroundDefine?:
        | string
        | {
              url: string;
              isMaterial?: boolean;
          };

    /** 视频背景 URL(仅 backgroundMode === 'video' 时生效) */
    backgroundVideoUrl?: string;

    /** 背景模糊度(0-20) */
    backgroundBlur?: number;

    /** 背景透明度(0-100) */
    backgroundOpacity?: number;

    /** 栅格间距 */
    grid?: number;

    /** 封面图资源名 */
    thumbnail?: string;

    /** 兼容字段,旧版缩略图;运行时会被归并到 thumbnail */
    thmbImage?: string;
}
```

---

## 3. WidgetItem(组件树节点)

根节点形态在 `src/designer/renderer/GeneratorWidget.tsx#L9-L113`、`src/designer/renderer/designer-field/types.ts` 中给出:

```ts
/** 根节点唯一 ID(由 src/designer/renderer/utils.js#L15 定义) */
export const ROOT_UNIQUE_ID = '-';

/** 组件类型枚举(见 src/designer/constants.ts#L139) */
export type WidgetType = 'field' | 'group' | 'layout-block';

/** 通用位置信息 */
export interface Location {
    left: number;
    top: number;
}

/** 变换(旋转、缩放) */
export interface Transform {
    rotate?: number | null;
    scale?: string | null;
}

/**
 * 组件树节点
 * - group / layout-block 可挂载 children
 * - field 为叶子节点,无 children
 */
export interface WidgetItem {
    /** 全局唯一 ID(GUID 字符串) */
    uniqueId: string;

    /** 组件类型 */
    type: WidgetType;

    /** 组件业务数据(由各物料运行时消费) */
    data: WidgetData;

    /** 子节点(只有 group / layout-block 持有) */
    children?: WidgetItem[];

    /** 父级 ID 列表(运行时由 flatDesignerList 注入,非持久化字段) */
    parentUniqueId?: string[];
}

/**
 * 组件业务数据
 * - config:组件位置、尺寸、样式、行为等
 * - 其余字段由物料自定义(dataConfig / interactions / animation / ...)
 */
export interface WidgetData {
    /** 通用 config,所有组件共有(详见下节) */
    config: WidgetConfig;

    /** 交互定义(详见 §6) */
    interactions?: InteractionMap;

    /** 入场动画配置(详见 §7) */
    animation?: WidgetAnimation;

    /** 数据源配置(常规数据源,详见 §8) */
    dataConfig?: DataConfig;

    /** 自定义数据源 API 配置(详见 §9) */
    customDataSourceApiConfig?: CustomDataSourceApiConfig;

    /** 导出 API 配置(同 §9 结构) */
    exportAPIConfig?: CustomDataSourceApiConfig;

    /** 下钻配置 */
    drillDown?: DrillDownItem[];

    /** 业务扩展字段(各物料可自由追加,例如 title / permission) */
    [key: string]: any;
}
```

---

## 4. WidgetConfig(组件通用配置)

绝大多数字段来自 `src/designer/renderer/designer-field/utils.ts`、`src/designer/renderer/components/group-field/index.jsx`、`src/designer/renderer/designer-parser/index.jsx`、`src/designer/DataProvider.tsx` 等多处读取。

```ts
/**
 * 组件 config:基础布局 + 样式 + 行为
 * - 字段命名与 CSS 一致
 * - field/group/layout-block 共享
 */
export interface WidgetConfig {
    /** 名称(用于图层树、配置面板标题) */
    title?: string;

    /** 唯一标识(冗余字段,部分组件读此处) */
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

    /** 锁定图层(禁止拖拽/调整大小) */
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

    // ─── 组(group)专用轮播配置 ────────────────
    /** 组内对象轮播(slick 跑马灯) */
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

    /** 指示器(dots) */
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

    /** 箭头(arrows) */
    arrows?: boolean;
    arrowsType?: 'default' | 'custom';
    prevArrowImg?: string;
    nextArrowImg?: string;
    arrowsWidth?: number;
    arrowsHeight?: number;
    arrowsSpace?: number;

    /** 轮播枚举配置(每张幻灯片的标识) */
    sliderEmuns?: Array<{ id: string | number; name?: string; [k: string]: any }>;

    /** 触发抛事件的时机 */
    triggerChangeMethod?: 'afterChange' | 'beforeChange';

    /** 权限控制(用于根据 zoneId 选择默认页) */
    permission?: any;

    // ─── 其他扩展 ─────────────────────────────
    [key: string]: any;
}
```

---

## 5. 顶层非持久化字段(运行时附加)

```ts
/** 实时数据流条目(参考 src/designer/DataProvider.tsx#L137-L170) */
export interface RealtimeDataFlowItem {
    uniqueId: string;
    sourceId: string;
}

/** 场景/模板的元信息(见 visualManage-api.ts detail 接口) */
export interface SchemaMeta {
    id?: string | number;
    name?: string;
    visualType?: number;     // 1 场景 / 2 模板
    shareStatus?: number;
    thumbnail?: string;
    [key: string]: any;
}

/** 业务态扩展字段(由 useDesigner 注入,可忽略持久化) */
export interface RuntimeStateExtras {
    appScopeId: string | null;
    undo: any[];
    redo: any[];
}
```

---

## 6. 交互定义(interactions)

详见 `src/plugins/interaction/component/interface.ts`、`src/plugins/interaction/component/hooks.ts`。

```ts
/**
 * 交互键集合
 * - 包含三种来源:
 *   1) 可配置事件 CONFIGURABLE_EVENT
 *   2) 动态事件 DYNAMIC_EVENTS
 *   3) 组合动作 COMPOSITION_ACTION
 * - 也包含业务自定义 dispatch 字段
 */
export interface InteractionMap {
    [fieldName: string]:
        | string                       // 订阅远端字段时填写 `:fieldName`
        | InteractionConfigurableEvent  // 可配置事件定义
        | InteractionDynamicEvent      // 动态事件
        | InteractionCompositionAction // 组合动作
        | InteractionCustomDispatch;   // 业务自定义派发配置
}

/** 可配置事件(对应 share.interactions.CONFIGURABLE_EVENT) */
export interface InteractionConfigurableEvent {
    show?: boolean;
    fieldName?: string;
    /** 弹窗配置 */
    [key: string]: any;
}

/** 动态事件(对应 share.interactions.DYNAMIC_EVENTS) */
export interface InteractionDynamicEvent {
    clickKey: string;
    [key: string]: any;
}

/** 组合动作(对应 share.interactions.COMPOSITION_ACTION) */
export interface InteractionCompositionAction {
    [actionKey: string]: {
        actionKey: string;
        state: any;
        effect?: string;
        setting?: any;
    } | Array<{
        actionField: string;
        [key: string]: any;
    }>;
}

/** 业务自定义派发:记录 dispatch 时使用的字段名 */
export interface InteractionCustomDispatch {
    /** 通常为远端字段名(用于联动匹配) */
    fieldName?: string;
    [key: string]: any;
}
```

---

## 7. 入场动画(animation)

字段值来自 `src/plugins/animation/enums.ts`,取值键为 CSS 动画 class 名。

```ts
export type AnimationClass =
    | 'designer_animate__zoomIn'
    | 'designer_animate__fadeIn'
    | 'designer_animate__fadeInRight'
    | 'designer_animate__fadeInLeft'
    | 'designer_animate__fadeInUp'
    | 'designer_animate__fadeInDown';

export interface WidgetAnimation {
    enter?: AnimationClass;
    /** 持续时间 ms */
    duration?: number;
    /** 延迟 ms */
    delay?: number;
    [key: string]: any;
}
```

---

## 8. DataConfig(常规数据源)

字段读取分布在 `src/plugins/data-fetcher/utils/factory.ts`、`src/plugins/interaction/component/hooks.ts`、`src/formily/widgets/dynamic-data/*`。

```ts
export type DataSourceType = 'json' | 'api' | 'dataSet' | 'iframeSource' | 'businessIndicator';

export interface DataConfig {
    /** 数据源类型 */
    dataType: DataSourceType;

    /** 是否禁用数据状态动画 */
    disableDataStatus?: boolean;

    /** JSON 类型数据(直接给定 rows) */
    json?: any[] | Record<string, any>;

    /** API 类型数据 */
    api?: ApiSource;

    /** 数据集类型数据 */
    dataSet?: DataSetSource;

    /** iframe 数据源 */
    iframeSource?: IframeSource;

    /** 业务指标 */
    businessIndicator?: BusinessIndicatorSource;

    /** 字段映射(组件字段 → 实际数据字段) */
    fieldsMapping?: Record<string, string>;

    /** 是否启用 DPU(数据处理单元) */
    enableDpu?: boolean;

    /** 已选中的 DPU 列表 */
    selectedDpu?: Array<{ id: string; enable: boolean; [k: string]: any }>;

    [key: string]: any;
}

export interface ApiSource {
    mode: 'get' | 'post' | string;
    url: string;
    headers?: Record<string, any>;
    params?: Record<string, any>;
    enableRequestControl?: boolean;
}

export interface DataSetSource {
    current: {
        id: string;
        name?: string;
        isGlobal?: boolean;
        globalDataFilter?: any;
        enableConditionFilter?: boolean;
        globalDataConditionFilter?: any;
    };
    params: Record<string, any>;
    enableRequestControl?: boolean;
}

export interface IframeSource {
    [key: string]: any;
}

export interface BusinessIndicatorSource {
    url: string;
    mode: string;
    params?: Record<string, any>;
    businessIndicators: Array<{ id: string; [k: string]: any }>;
}
```

---

## 9. CustomDataSourceApiConfig / ExportAPIConfig

用于"详情表格"、"导出按钮"等业务组件(`src/formily/widgets/custom-dataSource/Base.tsx`)。

```ts
export interface CustomDataSourceApiConfig {
    /** 'request' 走运行时请求;'export' 仅做导出 */
    useType?: 'request' | 'export';

    /** 当前生效的数据源类型 */
    dataType: 'api' | 'dataSet';

    /** API 子配置 */
    api?: ApiSource;

    /** 数据集子配置 */
    dataSet?: DataSetSource;

    /** 字段映射 */
    fieldsMapping?: Record<string, string>;

    /** 是否启用 DPU */
    enableDpu?: boolean;
    selectedDpu?: Array<{ id: string; enable: boolean; [k: string]: any }>;

    [key: string]: any;
}
```

---

## 10. DrillDownItem(下钻配置)

字段读取见 `src/designer/renderer/components/item-field/DrillDownItem.tsx` 与 `src/designer/renderer/utils.js` 的 `setLevelPath`。

```ts
export interface DrillDownItem {
    uniqueId: string;
    type: WidgetType;
    data: WidgetData;
    children?: DrillDownItem[];
}
```

---

## 11. 完整 JSON 示例(精简)

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

## 12. 关键源码索引(便于二次校对)

| 主题 | 文件 |
| --- | --- |
| 渲染入口 | [designer-parser/index.jsx](src/designer/renderer/designer-parser/index.jsx) |
| 组件遍历 | [GeneratorWidget.tsx](src/designer/renderer/GeneratorWidget.tsx) |
| 拖拽与定位 | [designer-field/index.tsx](src/designer/renderer/designer-field/index.tsx) |
| DataSource 类型 | [designer-field/types.ts](src/designer/renderer/designer-field/types.ts) |
| 状态/初始值 | [DataProvider.tsx](src/designer/DataProvider.tsx) |
| 组件枚举 | [constants.ts](src/designer/constants.ts) |
| 工具函数 | [utils.js](src/designer/renderer/utils.js) |
| 组/跑马灯配置 | [group-field/index.jsx](src/designer/renderer/components/group-field/index.jsx) |
| 页面配置 Schema | [page/schema.ts](src/designer/configuration-panel/page/schema.ts) |
| 交互接口 | [interaction/interface.ts](src/plugins/interaction/component/interface.ts) |
| 动画枚举 | [animation/enums.ts](src/plugins/animation/enums.ts) |
| 数据源工厂 | [data-fetcher/utils/factory.ts](src/plugins/data-fetcher/utils/factory.ts) |
| 自定义数据源 | [custom-dataSource/Base.tsx](src/formily/widgets/custom-dataSource/Base.tsx) |
| 数据源组件 | [dynamic-data/index.tsx](src/formily/widgets/dynamic-data/index.tsx) |

---

## 13. 后续可补全方向

1. **下钻业务字段**:`DrillDownItem` 在 `setLevelPath` 中按 `drillDownLevel` 字段递归标记,具体字段未覆盖全,需结合业务物料继续细化。
2. **interactions 的派发字段全集**:不同物料会派发不同 `fieldName`,建议从各物料的 `interactionApi.dispatch` 入参反推枚举。
3. **动画播放控制**:除 `enter` 外,业务上还存在循环动画类,需结合动画 schema。
4. **跨平台差异**:移动端(iPhone/Android/iPad)只影响 `pageSize`,组件本身 schema 一致。