# meta-human — 数字人（MetaHuman）能力

> 源码位置：`web/components/large-screen/meta-human/`
> SDK 静态资源：`public/static/meta-human-sdk/sdk-dist/`
> 本文档基于 2026-09 当前源码整理。

## 1. 能力定位

数字人能力由外挂的 `meta-human-sdk`（非 npm 依赖，运行时动态加载的本地静态脚本）提供，本仓库侧提供：

-   SDK 脚本 / 样式动态注入与加载轮询（`core.tsx`）
-   React Context 化的初始化与指令分发（`MetaHumanProvider` / `useMetaHumanContext` / `useMetaHumanEffect`）
-   全局调试入口（`MetaHumanGlobalDispatcher`，d3.dispatch 实现）
-   预置的指令响应组件（`MetaHumanCustomTrigger`：开新页签 / iframe 模态框）
-   指令动作枚举（`enums.ts` 的 `MetaHumanActions`）

数字人可"接管"页面：通过语音 / 问答窗口下发操控指令（action + data），页面侧按 action 注册副作用实现语音控制大屏。

## 2. 文件结构

```
web/components/large-screen/meta-human/
├── core.tsx                  # MetaHumanProvider / useMetaHumanEffect / SDK 加载器
├── enums.ts                  # MetaHumanActions 指令动作枚举
├── global-control.ts         # d3.dispatch 全局事件通道 + window.MetaHumanGlobalDispatcher
├── MetaHumanCustomTrigger.tsx # 预置指令响应组件（开页签 / iframe 模态框）
├── index.tsx                 # 统一导出（large-screen/index.ts 再转发）
└── readme.md                 # SDK 侧集中配置说明（勿删，environment.json 有引用）
```

统一出口在 `web/components/large-screen/index.ts`，页面侧应从 `~/web/components/large-screen` 导入。

## 3. 配置（public/environment.json 的 `metaHumanSDK` 节点）

关键配置项（以当前 environment.json 为准）：

| 字段                           | 说明                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `enable`                       | 总开关，false 时 Provider 直接禁用                                                    |
| `enableGlobalDispatch`         | 是否挂载 `window.metaHumanDispatch` 调试入口                                          |
| `entryJs` / `entryCss`         | SDK 入口文件，相对 `constants.SDK_PATH`（即 `/static/meta-human-sdk`）解析            |
| `settings.common`              | 容器（默认 `[data-sdk-container='metaHumanSDKContainer']`）、聊天窗样式类、字幕开关等 |
| `settings.digitalHumanService` | 数字人服务地址（ip）                                                                  |
| `settings.digitalHumanClient`  | 客户端模式（Default/Xmov）、默认位置与尺寸                                            |
| `settings.microphoneConfig`    | 麦克风服务配置                                                                        |

注意：

-   `core.tsx` 中假定 `settings.common` 与 `settings.digitalHumanClient` 存在并直接取属性（`metaHumanSDKSetting.common.container` 等），配置缺失会抛错——新增环境配置时需保证这两个节点存在。
-   容器节点由 `web/components/layout/App.tsx` 提供：一个 1×1 的绝对定位 div（`data-sdk-container="metaHumanSDKContainer"`），勿随意移除。
-   完整字段说明见 `web/components/large-screen/meta-human/readme.md`。

## 4. 运行机制（core.tsx）

1. **挂载**：`MetaHumanProvider` 接收 `enableMetaHuman`（页面级开关）与 `metaHumanPresets`（页面预设映射）props；`environment.json` 的 `enable` 与页面 props 同时为真才启用。
2. **脚本注入**：`createMetaHumanSdkScript` 动态插入 `<script>` / `<link>`，已在 `window.MetaHuman` 上时跳过。
3. **就绪轮询**：`metaHumanSDKLoader` 每 200ms 轮询 `window.MetaHuman`，Promise 单例缓存（模块级 `sdkLoader`）。
4. **SDK 初始化**：`MetaHuman.SDK(callbacks, settings)`，回调：
    - `onActivation(state)`：数字人接管状态变化 → 更新 Context 的 `enable`
    - `onControlCommand({ action, data })`：仅在接管状态下分发为 Context 的 `metaHumanData`
5. **指令来源**：
    - 正式链路：SDK 内部 → `MetaHumanGlobalControl.sdk.on`（d3.dispatch）
    - 调试链路：控制台执行 `window['MetaHumanGlobalDispatcher']({ action, data })`
    - 备用链路：`enableGlobalDispatch` 时挂载的 `window.metaHumanDispatch`
6. **卸载**：useEffect 清理时移除脚本监听、调用 SDK `destroy()`，并置 `disposeFlag` 防止异步回调后触发。

依赖 `loginInfo`（`web/hooks/useLoginInfo`）作为 `userInfo` 传给 SDK，登录态变化会重新初始化。

## 5. 页面侧使用方式

```tsx
import { MetaHumanActions, useMetaHumanEffect } from '~/web/components/large-screen';

// 在任意组件中注册对指定 action 的副作用
useMetaHumanEffect({
    action: [MetaHumanActions.SWITCH_OPERATE],
    effect: (metaHumanData, metaHumanPresets) => {
        // metaHumanData: { action, data }
        // metaHumanPresets: Provider 传入的页面预设
    },
});
```

现有使用示例（大唐不夜城页面）：

-   `web/pages/great-tang-all-day-mall/modules/scene-switch/index.tsx` — `SWITCH_OPERATE` 语音切换场景，经 `metaHumanPresets['切换场景']` 映射到场景 value
-   `web/pages/great-tang-all-day-mall/modules/render-stage-loader/index.tsx` — 多个 `useMetaHumanEffect` 注册（定位 / 显隐 / 覆盖等 3D 场景操作）

## 6. MetaHumanActions 指令清单（enums.ts）

| 枚举值                                                           | 含义                  | 状态                             |
| ---------------------------------------------------------------- | --------------------- | -------------------------------- |
| `OPEN_OPERATE_TAB`                                               | 打开新浏览器页签      | 已实现（MetaHumanCustomTrigger） |
| `OPEN_OPERATE_MODAL_IFRAME`                                      | 打开 iframe 模态框    | TODO 未实现                      |
| `CLOSE_OPERATE_MODAL_IFRAME`                                     | 关闭 iframe 模态框    | TODO 未实现                      |
| `SWITCH_OPERATE`                                                 | 内容 / 场景切换       | 已实现（scene-switch）           |
| `LOCATE_OPERATE`                                                 | 孪生体定位            | 由页面自行注册                   |
| `OPEN_OPERATE_MODAL` / `CLOSE_OPERATE_MODAL`                     | 打开 / 关闭内部模态框 | 由页面自行注册                   |
| `FIND_OPERATE_BASE_STATION` / `CLOSE_OPERATE_BASE_STATION_MODAL` | 查找 / 关闭基站弹窗   | 由页面自行注册                   |
| `COVER_OPERATE`                                                  | 地图覆盖              | 由页面自行注册                   |
| `SHOW_TWIN_OPERATE`                                              | 显示隐藏孪生体        | 由页面自行注册                   |

## 7. 模块高亮（helper-zone）

数字人讲解时需要在屏幕上框选高亮某个模块区域，实现上有**两条零开发路径**（均不需要改前端代码、不需要重新构建）：

1. **选择器定位（首选，零配置）**：SDK 直接按 CSS 选择器定位 DOM 节点画高亮框。页面里凡是带 `data-id` / 可唯一定位的节点均可直接引用，例如 `.management-overview-first [data-id='left-screen']`。只需在数字人 / SDK 侧配置选择器即可生效。
2. **静态 JSON 坐标兜底（零开发）**：当目标区域没有可用选择器时，使用页面级的 helper-zone 坐标数据：

    - 页面挂载 `MetaHumanHelperZone`（如 `web/pages/management-overview-first/modules/meta-human-helper-zone/`），内部 `useRequest` 运行时拉取静态 JSON（如 `public/static/meta-human-sdk-helper/management-overview-first-helper-zone.json`），渲染 `Highlight` 描边框。
    - JSON 为纯静态文件：新增 / 调整高亮区域只需编辑该 JSON（每项为 `{ dataId, left, top, width, height }`，`dataId` 不可重复），**无需改动任何前端代码**，刷新页面即生效。
    - JSON 内 `desc` 字段即为该约定说明（选择器优先，JSON 兜底）。

注意：`MetaHumanHelperZone` 组件本身需在页面 `render.tsx` 中挂载过一次（管理总览第一 / 第二屏均已挂载）；已挂载页面后续新增高亮区域完全只动 JSON。新页面接入时若需要 JSON 兜底能力，才需要拷贝一份该组件目录并指向自己的 JSON 文件（一次性开发）。

## 8. 扩展指引

-   **新增指令动作**：在 `enums.ts` 增加枚举值，消费方用 `useMetaHumanEffect` 注册副作用；若为通用行为（如开页签），放入 `MetaHumanCustomTrigger.tsx`。
-   **新页面接入**：页面渲染入口挂 `MetaHumanProvider`（传 `enableMetaHuman` 与 `metaHumanPresets`），并确保 `App.tsx` 的容器 div 存在；配置从 `environment.json` 的 `metaHumanSDK` 读取。
-   **调试**：控制台执行 `window['MetaHumanGlobalDispatcher']({ action: 'SWITCH_OPERATE', data: { module: 'xxx' } })` 模拟数字人下发指令。

## 9. 已知技术债

-   `core.tsx` 全文 `props: any` / `metaHumanData: any`，无类型约束。
-   `settings.common` / `settings.digitalHumanClient` 无空值保护，配置不全会运行时报错。
-   `OPEN/CLOSE_OPERATE_MODAL_IFRAME` 在 `MetaHumanCustomTrigger` 中被注释掉（未实现），Modal UI 已就绪。
-   SDK 为黑盒静态资源（无 npm 包），升级只能替换 `public/static/meta-human-sdk/sdk-dist/` 下的产物。
