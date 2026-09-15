# 管理总览第一屏 — 数字人（MetaHuman）实现汇总

> 页面源码：`web/pages/management-overview-first/`
> 能力底座文档：`design/modules/meta-human/overview.md`（本文只汇总本页面的接入与指令实现）
> 基于当前源码整理。

## 1. 页面接入方式

`render.tsx` 通过 `LargeScreenEnv` 开启数字人能力，并注入页面级指令预设：

```tsx
<LargeScreenEnv
    enableMetaHuman={true}
    metaHumanPresets={metaHumanPresets}
    ...
>
    <WidgetsRender getWidgets={getWidgets} />
    <MetaHumanHelperZone />
    <MetaHumanCustomTrigger />
</LargeScreenEnv>
```

-   `enableMetaHuman`：页面级开关，与 `environment.json` 的 `metaHumanSDK.enable` 同时为真才生效。
-   `metaHumanPresets`：`web/pages/management-overview-first/metaHumanPresets.ts`，指令 module → 操作配置的映射。
-   `MetaHumanCustomTrigger`：通用响应组件（开新页签 / iframe 模态框）。
-   `MetaHumanHelperZone`：`modules/meta-human-helper-zone/index.tsx`，加载静态布局 JSON（`/static/meta-human-sdk-helper/management-overview-first-helper-zone.json`）渲染 `Highlight` 高亮块，用于数字人讲解时框选屏幕区域。

## 2. 指令预设（metaHumanPresets.ts）

预设按业务分区组织，key 为 SDK 下发的 `data.module`，值为操作配置：

| 分区         | 指令能力                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 个人业务     | 切换呈现 视频 / 游戏 / 即时通信 / 支付 类热点业务 TOP5（`currentTab` + `dictKey`）                                                       |
| 政企业务     | 左屏切换 物联网 / 专线 / 5G专网 / 企业宽带 / IDC / ICT（`type`）                                                                         |
| 中屏切换     | 网络覆盖(tab1) / 场景监控(tab2) / 算网部署(tab3)（`key`）                                                                                |
| 中屏网络覆盖 | 呈现 / 取消呈现：全部、2G/4G/5G 基站、高精度基站、物联网基站、一干/二干光缆（`neType` + `visible`）                                      |
| 中屏场景监控 | 左侧场景分类切换（`scene-switch` + `labelGetter`）；右侧场景列表打开/关闭模态框（`scene-open` + `labelGetter/widthGetter/heightGetter`） |
| 中屏算网部署 | 数据中心列表定位（`labelGetter`）                                                                                                        |

## 3. 指令消费点（useMetaHumanEffect 注册位置）

| 文件                                                                                  | action                                       | 作用                                                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `modules/personal-business/components/right-part/index.tsx`                           | `SWITCH_OPERATE`                             | 命中「个人业务」预设 → setState 切换右侧 tab                   |
| `modules/government-enterprise-business/overview/index.tsx`                           | `SWITCH_OPERATE`                             | 命中「政企业务」→ 按 `type` 查 dataSource 切换左屏块           |
| `modules/government-enterprise-business/overview-v2/index.tsx`                        | `SWITCH_OPERATE`                             | 同上（overview-v2 版本实现）                                   |
| `modules/center/components/tab-button/index.tsx`                                      | `SWITCH_OPERATE`                             | 命中「中屏切换」→ dispatch `center:tabChange` 切中屏 tab       |
| `modules/center/components/tab-content-2/index.tsx`                                   | `SWITCH_OPERATE`                             | 命中「中屏场景监控」`scene-switch` → 按 label 切左侧场景分类   |
| `modules/center/components/tab-content-2/right-part/CardContent.tsx`                  | `OPEN_OPERATE_MODAL` / `CLOSE_OPERATE_MODAL` | 命中 `scene-open` → 按卡片 title 打开/关闭场景模态框（iframe） |
| `modules/center/components/tab-content-1/components/center-gis/ImageGis.tsx`          | `COVER_OPERATE`                              | 命中「中屏网络覆盖」→ 增删 `neTypeCheckList` 控制图层呈现      |
| `modules/center/components/tab-content-1/components/center-gis/RealGis.tsx`           | `COVER_OPERATE`                              | 同上（RealGis 矢量地图版本）                                   |
| `modules/center/components/tab-content-3/components/right-data-center-list/index.tsx` | `SWITCH_OPERATE`                             | 命中「中屏算网部署」→ 按 label 定位数据中心列表                |

相关子模块文档：`components/image-gis.md`（GIS 图层呈现细节）、`government-enterprise-business/`（政企业务左屏）。

## 4. 实现范式

本页面所有消费点遵循统一模式：

```tsx
useMetaHumanEffect({
    action: [MetaHumanActions.SWITCH_OPERATE],
    effect: (metaHumanData, metaHumanPresets) => {
        const hit = metaHumanPresets['<业务分区>'][metaHumanData?.data?.module];
        if (hit) {
            // 常见取参：get(metaHumanData, hit.labelGetter)
            // 执行与人工点击等价的 setState / dispatch
        }
    },
});
```

-   预设里支持 `labelGetter` / `widthGetter` 等字符串路径，消费端用 `@fedx-web-common/utils` 的 `get` 取值。
-   语音操作与人工点击共用同一处理函数（如 `switchTabHandle` / `handleClick`），保证行为一致。

## 5. 扩展指引

新增数字人指令四步：

1. 在 `metaHumanPresets.ts` 对应分区（或新建分区）添加 `module` key 与操作配置。
2. 在目标组件注册 `useMetaHumanEffect`（action 对应 `MetaHumanActions` 枚举），effect 内查预设并执行。
3. 若需要讲解高亮：优先在数字人 / SDK 侧配置 CSS 选择器定位已有 DOM 节点（零开发）；选择器覆盖不到时编辑 `public/static/meta-human-sdk-helper/management-overview-first-helper-zone.json` 增加坐标项（纯静态文件，无需改代码、无需构建，刷新即生效）。详见 `design/modules/meta-human/overview.md` 第 7 节。
4. 调试：控制台执行 `window['MetaHumanGlobalDispatcher']({ action: 'SWITCH_OPERATE', data: { module: '<module-key>', params: { label: 'xxx' } } })`。
