# 管理总览第二屏 — 数字人（MetaHuman）实现汇总

> 页面源码：`web/pages/management-overview-second/`
> 能力底座文档：`design/modules/meta-human/overview.md`（本文只汇总本页面的接入与指令实现）
> 基于当前源码整理。

## 1. 页面接入方式

`render.tsx` 与第一屏同构，通过 `LargeScreenEnv` 开启数字人能力：

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

-   `metaHumanPresets`：`web/pages/management-overview-second/metaHumanPresets.ts`。
-   `MetaHumanHelperZone`：`modules/meta-human-helper-zone/index.tsx`，加载 `/static/meta-human-sdk-helper/management-overview-second-helper-zone.json` 渲染讲解高亮块。
-   `MetaHumanCustomTrigger`：通用开页签 / iframe 模态框响应组件。

## 2. 指令预设（metaHumanPresets.ts）

| 分区         | module key                                                          | 指令能力                                                  |
| ------------ | ------------------------------------------------------------------- | --------------------------------------------------------- |
| 隐患分类统计 | `management-overview-second-left-screen-隐患分类统计`               | 左屏 tab 按 label 切换（专业 / 来源）                     |
| 隐患整改计划 | `management-overview-second-left-screen-隐患整改计划-近期`          | 隐患整改计划轮播按 label 定位（本月安排 / 近3个月安排）   |
| 中屏         | `management-overview-second-center-screen-switch-btn`               | 中屏 tab 按 label 切换（事件监控 / 事件详情）             |
| 割接管理     | `management-overview-second-right-screen-switch-btn-割接管理`       | 割接管理 tab 按 label 切换（割接总数 / 影响业务割接总数） |
| 割接管理     | `management-overview-second-right-screen-carousel-割接管理右侧图表` | 右侧图表轮播按 `index` 跳转                               |

预设中每项均附有指令报文示例（注释形式），如：

```json
{
    "action": "SWITCH_OPERATE",
    "data": { "module": "management-overview-second-center-screen-switch-btn", "params": { "label": "事件详情" } }
}
```

## 3. 指令消费点（useMetaHumanEffect 注册位置）

| 文件                                             | action           | 作用                                                                                                            |
| ------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `modules/hazard-statistics/Tabs.tsx`             | `SWITCH_OPERATE` | 命中「隐患分类统计」→ 按 `dictName` 匹配 data → `switchTabHandle`                                               |
| `modules/hazard-rectify/index.tsx`               | `SWITCH_OPERATE` | 命中「隐患整改计划」→ label 映射 index（本月安排0 / 近三个月安排1 / 整体计划安排2）→ `ref.goTo(index)` 轮播定位 |
| `modules/center/components/tab-button/index.tsx` | `SWITCH_OPERATE` | 命中「中屏」→ label 硬编码映射 tab1/tab2/tab3（事件监控 / 事件详情 / 事件质量）→ `handleClick`                  |
| `modules/cutover-manager/Tabs.tsx`               | `SWITCH_OPERATE` | 命中「割接管理」tab 预设 → `switchTabHandle`                                                                    |
| `modules/cutover-manager/Right.tsx`              | `SWITCH_OPERATE` | 命中「割接管理」轮播预设 → `indexGetter` 取 index → `ref.goTo(index)`                                           |

与第一屏的差异：

-   第二屏仅使用 `SWITCH_OPERATE` 一个 action（第一屏还有 `COVER_OPERATE` / `OPEN_OPERATE_MODAL` 等）。
-   大量使用轮播组件 `ref.goTo(index)` 直接定位，而非 setState 切 tab。
-   中屏 tab-button 的 label → tab 映射是组件内硬编码（未走预设 value），扩展时需注意。

## 4. 实现范式

与第一屏一致（预设命中 + `get(metaHumanData, hit.labelGetter)` 取参 + 复用人工点击处理函数），详见 `design/modules/management-overview-first/meta-human.md` 第 4 节。

## 5. 扩展指引

1. 在 `metaHumanPresets.ts` 对应分区添加 `module` key（命名惯例 `management-overview-second-<屏位>-<组件>`）与 `labelGetter` / `indexGetter` 配置。
2. 在目标组件注册 `useMetaHumanEffect`，effect 内查预设并执行切换 / 轮播定位。
3. 讲解高亮：优先在数字人 / SDK 侧配置 CSS 选择器（零开发）；选择器覆盖不到时编辑 `public/static/meta-human-sdk-helper/management-overview-second-helper-zone.json` 增加坐标项（纯静态文件，无需改代码，刷新即生效）。详见 `design/modules/meta-human/overview.md` 第 7 节。
4. 调试：控制台执行 `window['MetaHumanGlobalDispatcher']({ action: 'SWITCH_OPERATE', data: { module: '<module-key>', params: { label: 'xxx' } } })`。
