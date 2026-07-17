# CenterZone 容器

中屏保障中心的顶层容器。负责 Tab 切换样式、智能问答 Modal、初始化省 `zoneSelect` 派发。

- 源文件：[index.tsx](web/pages/emergency-support/modules/center/index.tsx)

## 职责

1. 渲染当前 Tab（依 `props.currentTabType`）的 `TabContent1` 或 `TabContent2`，并叠加 `TabButton`、`center-zone-ai` 智能问答入口
2. 容器使用 `styled-components` 通过 `$currentType` 控制两个 Tab 的 visibility / opacity / z-index，避免卸载子组件（保活状态）
3. `useEffect` 初始化：派发省 `zoneSelect` 作为下钻状态机的起点
4. 智能问答 `Modal`：根据 Tab 与 props.centerAreaId 拼 URL

## Props

容器通过上层组件路由使用，具体形状在父模块定义；本容器依赖以下 props：

| prop             | 类型                     | 说明                                                      |
| ---------------- | ------------------------ | --------------------------------------------------------- |
| `currentTabType` | `TabChangeEnum`          | 当前激活 Tab，由 `TabButton` 派发 + 上层回填              |
| `centerAreaId`   | `string`                 | 突发保障区域 id（来自 GIS 区域选中派发），日常保障为 `''` |
| `dispatch`       | `(key, payload) => void` | 通用派发器，已包装 widgetFields                           |

> props 还会向下透传给 TabContent1 / TabContent2，包括 `zoneSelect / dateTimeSelect / leftRepairNoticeParams` 等。请勿在容器内消费这些 props，只做透传。

## 关键 state

```ts
const [state, setState] = useSetState({
    showModal: false,
    aiUrl: null,
});
```

`useSetState` 来自 `@fedx-web-common/react-hooks`，支持部分更新。

## useEffect（初始化）

```ts
useEffect(() => {
    props.dispatch(widgetFields.getField('zoneSelect'), {
        zoneId: province?.provinceId,
        zoneLevel: ZoneLevelEnum.province,
        provinceId: province.provinceId, // 省 id
        regionId: 0, // 地市 id
        cityId: 0, // 区县 id
    });
}, []);
```

只执行一次，初始化省 `zoneSelect`，让下游所有 `useRequest` 进入 ready。

## AI 智能问答

```tsx
const onAIClick = () => {
    const url = formatString(emergencySupportAIConfig.url, {
        areaId: props.currentTabType === TabChangeEnum.tab2 ? props.centerAreaId : '',
    });
    setState({ showModal: true, aiUrl: url });
};
```

- `formatString` 来自 `~/web/utils/formatString`，用 `{areaId}` 占位符替换
- 日常保障传空 `areaId`，突发保障传 `centerAreaId`
- `emergencySupportAIConfig` 来自 `useEnvironment()`

## 渲染分支

```tsx
{
    props.currentTabType === TabChangeEnum.tab2 ? <TabContent2 {...props} /> : <TabContent1 {...props} />;
}
```

`styled-components` 通过 `$currentType` 同步控制两个 Tab 的可见性（tab1 / tab2 对称逻辑）：

```tsx
// tab1 分支
visibility: ${(p) => (p.$currentType === TabChangeEnum.tab1 ? 'visible' : 'hidden')};
opacity: ${(p) => (p.$currentType === TabChangeEnum.tab1 ? 1 : 0)};
z-index: ${(p) => (p.$currentType === TabChangeEnum.tab1 ? 10 : 0)};

// tab2 分支（逻辑对称，判断 tab2）
visibility: ${(p) => (p.$currentType === TabChangeEnum.tab2 ? 'visible' : 'hidden')};
opacity: ${(p) => (p.$currentType === TabChangeEnum.tab2 ? 1 : 0)};
z-index: ${(p) => (p.$currentType === TabChangeEnum.tab2 ? 10 : 0)};
```

> 两个 Tab 一直挂着不卸载，这意味着一旦 `currentTabType` 变化，子组件内部 `useEffect` 不会被卸载重置，需要在子组件内检查 `props.currentTabType` 再决定是否触发数据请求（参考 `Gis` 内 `ready: props.currentTabType === TabChangeEnum.tab1` 的模式）。
>
> **例外**：`TabContent1` 内部的 `CenterGis` 是条件挂载的（`{state.mapType === MapTypeEnum.gis && <CenterGis .../>}`），切换 Path/GIS 时会卸载重建，详见 [tab-content-1.md](tab-content-1.md)。

## className

- 容器：`center-zone full-width full-height`
- AI 入口：`center-zone-ai`
- AI 弹层根：`center-zone-ai-modal`（通过 Modal.rootClassName 应用）

## 易踩坑

- 不要把 `props.dispatch` 包成新的函数再传给子组件，会破坏引用稳定性，触发子组件重复派发
- 智能问答 URL 用 `formatString`，模板里有 `{areaId}` 占位符；修改模板前先看 `emergencySupportAIConfig.url`
- Modal 用的是 `maskStyle={{ backgroundColor: 'transparent' }}` + `bodyStyle` 自定义内嵌尺寸；新增 Modal 时不要把这些 prop 名称写反

> 版本：v1.0 · 创建日期：2026-07-13
