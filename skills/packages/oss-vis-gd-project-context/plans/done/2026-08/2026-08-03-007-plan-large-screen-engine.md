# Plan-007：large-screen → large-screen-engine.md

> **日期**：2026-08-03
> **性质**：执行子计划（[Plan-005](./2026-08-03-005-plan-web-components-docs.md) 第 2 子项）
> **目标目录**：`web/components/large-screen/`（含 `meta-human/`、`hooks/`、`lib/`）
> **输出文件**：`docs/design/large-screen-engine.md`

---

## 0. 背景

`large-screen` 是本项目**最核心的视图基础设施**：大屏的 widget 注册 / 缩放 / 交互总线 / meta-human 数字人 / 全局样式 / 调试模式。本计划把它作为可复用引擎描述。

**与已有 Skill 的关系**：`docs/skills/five-major-center-interaction-trigger/SKILL.md` 是 LLM 端的行动契约，描述 9 个 MetaHumanActions 的用法；**本计划描述引擎机制**（不重复 SKILL.md 的行动指令；Rule D-15）。

## 1. 目标

1 个 docs/ 文件，覆盖：

| 主题 | 内容 |
|---|---|
| `LargeScreenEnv` 总壳 | Provider 树（AntEnv / Initializer / MetaHumanProvider / DataSchemeLoader / ViewScaleManager / CustomWidget / ScreenControlSocket） |
| Widget 引擎 | `createLargeScreen` + `registerWidget` + `WidgetsRender` + `Widget` 生命周期 |
| 交互总线 | `WidgetInteraction` + EventEmitter + Widget 订阅 + InternalFields |
| 缩放适配 | `ViewScaleManager`（来自 `large-screen/lib`，封装 `@fedx-vis/react-large-screen`） |
| Meta-human | `MetaHumanProvider` + `useMetaHumanContext` + `useMetaHumanEffect` + `MetaHumanGlobalTrigger` + `MetaHumanGlobalControl` |
| 自定义 widget 挂载点 | `CustomWidgetContextProvider` + `MountWidgetToBefore/After`（createPortal） |
| 全局样式 | `GlobalStyle`（17 个 font-face 注入） |
| 调试模式 | `useDebugEnv`（URL `?debug` 触发）+ `initFedxUI`（iconfont 一次性注入） |
| 辅助 hooks | `useWidgetMemoState`（groupFilter 可见性） |

## 2. 源文件

### 2.1 已读

- `web/components/large-screen/index.ts`
- `web/components/large-screen/LargeScreenEnv.tsx`
- `web/components/large-screen/AntEnv.tsx`
- `web/components/large-screen/Widget.tsx`
- `web/components/large-screen/WidgetsRender.tsx`
- `web/components/large-screen/WidgetInteraction.tsx`
- `web/components/large-screen/CustomWidget.tsx`
- `web/components/large-screen/utils.ts` （createLargeScreen / isInternalField / InternalFields / generateGroupId / internalDispatcher）
- `web/components/large-screen/initFedxUI.tsx`
- `web/components/large-screen/GlobalStyle.tsx`
- `web/components/large-screen/hooks/useDebugEnv.ts`
- `web/components/large-screen/hooks/useWidgetState.ts` （useWidgetMemoState）
- `web/components/large-screen/lib/index.tsx` （ViewScaleManager / useScale / defineFields / ReactECharts / LinearTextGradient / RadialTextGradient 出口）
- `web/components/large-screen/meta-human/index.tsx`
- `web/components/large-screen/meta-human/core.tsx` （MetaHumanProvider + useMetaHumanContext + useMetaHumanEffect）
- `web/components/large-screen/meta-human/enums.ts` （9 个 MetaHumanActions + 3 个 GlobalActionModule）
- `web/components/large-screen/meta-human/global-control.ts` （d3.dispatch 全局事件）
- `web/components/large-screen/meta-human/MetaHumanGlobalTrigger.tsx` （3 个 effect 绑定：开 tab / 开 modal / 路由切换）
- `web/components/large-screen/meta-human/meta-human-helper-zone/index.tsx` （helperZoneId JSON 驱动的辅助高亮）
- `web/components/large-screen/meta-human/readme.md` （3 个示例 payload）

### 2.2 待补充读

- `web/components/large-screen/lib/rc-large-screen.min.js` 与 `rc-echarts.min.js` （间接引用，不深入）
- `web/hooks/useSocketIOClient.ts` （socket 部分见 Plan-008）

## 3. `large-screen-engine.md` 大纲

```
§0 TL;DR（引擎 5 层 + 入口）
§1 Provider 树（LargeScreenEnv 内层）
   - <AntEnv> → <GlobalStyle/> → <App> → <Initializer> → <MetaHumanProvider> → <DataSchemeLoader> → <ViewScaleManager> → <CustomWidgetContextProvider> → <ScreenControlSocket>
   - 节点定位（参考 LargeScreenEnv.tsx#L42-L86）

§2 Widget 引擎
   §2.1 createLargeScreen(screenName)
      - 返回 registerWidget / getWidgets / defineInteractionFields / internalFields / screenName / deleteScreen
   §2.2 registerWidget({ name, element, layout, style, group, animateCss, subscribe })
      - widgetsMapping.set(name, TWidget)
      - 默认布局 400×300 at (0,0)
      - id 格式：`@@screen@@${screenName}##widget@@${name}&&%#${count}@@`
      - groupFilterId = generateGroupId(group ?? 'default') = `@@Group##[${group}]%%*@@`
   §2.3 WidgetsRender
      - 取最新 getWidgets() → map 渲染 <Widget>
   §2.4 Widget 组件
      - 订阅 props.control.subscribe（反查 subscribeFields ref）
      - useMessageChange（socket）+ useSubscription（interaction）
      - dispatch = useMemoizedFn({ action: field, data })
      - lazy element：Suspense + DataStatus(loading)
      - 内置动画 className 映射
      - useWidgetMemoState：groupFilter 命中 → visible，否则 hidden

§3 交互总线（WidgetInteraction）
   - 基于 @fedx-web-common/react-hooks useEventEmitter
   - Widget 内部 emit({ action, data }) → 所有 useSubscription 回调
   - InternalFields（WIDGET_VISIBLE / WIDGET_GROUP_VISIBLE_FILTER / enableControl / global / highlight / downplay）
   - 内置字段抛出（defineInteractionFields 阻止覆盖）

§4 缩放与 viewport
   - ViewScaleManager 来自 large-screen/lib（@fedx-vis/react-large-screen）
   - 模式：scaleX / scaleY / cover（默认 scaleX）
   - 设计尺寸：designWidth × designHeight（来自 props）
   - 调试：useDebugEnv=true → 用 designWidth/designHeight 直渲；否则 100% × 100%

§5 Meta-human（仅引擎机制，不重复 SKILL.md 行动契约）
   §5.1 SDK 加载流程
      - createMetaHumanSdkScript(entryJs, entryCss) 注入 <script> + <link>
      - metaHumanSDKLoader() 每 200ms 轮询 window.MetaHuman → Promise.resolve
      - MetaHuman.SDK(initOptions) 返回 { destroy, sendEvent }
   §5.2 MetaHumanProvider 暴露
      - Context: { enable, metaHumanData, metaHumanPresets, metalHumanSendEvent }
      - loginInfo 注入 common.userInfo
      - onActivation → enable 状态
      - onControlCommand → 通过 setMetaHumanState 派发
   §5.3 useMetaHumanEffect
      - 仅当 action ∈ options.action 时触发 effect
   §5.4 MetaHumanGlobalTrigger（与 SKILL.md 行动契约对齐）
      - OPEN_OPERATE_TAB + module=GLOBAL_OPEN_BROWSER_TAB → window.open
      - OPEN_OPERATE_MODAL + module=GLOBAL_MODAL_IFRAME → antd Modal + iframe
      - SWITCH_OPERATE + module=GLOBAL_ROUTE_SWITCH → history.push/replace 或 location.href
   §5.5 MetaHumanGlobalControl
      - d3.dispatch('metaHumanSDK')
      - window.MetaHumanGlobalDispatcher(data) → sdk.emit

§6 自定义 widget 挂载点（CustomWidgetContextProvider）
   - beforeRef / afterRef → createPortal
   - MountWidgetToBefore / MountWidgetToAfter 公共 API

§7 全局样式（GlobalStyle）
   - 17 个 @font-face（DingTalk JinBuTi / FZZYJW--GB1-0 / YouSheBiaoTiHei / AlimamaShuHeiTi / Swiss721BT / PixelLCD / PangMenZhengDao / FZZongYi-M05S / D-DIN-PRO / ZiZhiQuXiMaiTi / Noto Sans SC / DIN / Source Han Sans CN）
   - id `globalStyle-fedx-font` 防重复
   - src URL 用 constants.STATIC_PATH 前缀

§8 调试模式
   - URL `?debug` 命中 → useDebugEnv=true
   - 影响 ViewScaleManager viewport 尺寸
   - 影响 GlobalStyle 中根 className 加 large-screen-env-debug

§9 initFedxUI（iconfont）
   - 全局唯一调用（initFlag）
   - Icon.createFromIconfontCN(scriptUrl: ['/static/iconfont/iconfont.js', '/static/iconfont/iconfont_weather.js'])

§10 Widget 调试：?devDebugTitle=<name> → scrollIntoView

§11 关键文件位置表

§12 与已有文档的关系
   - 与 docs/specs/five-major-center/as-is-architecture.md §2/§3/§5 引用此文件作为引擎层
   - 与 docs/skills/five-major-center-interaction-trigger/SKILL.md 不重复（SKILL 描述"做什么"，本文件描述"机制是什么"）
   - 与 docs/design/tech-stack.md §2.4 互相印证视图加载

§13 关联文档
```

## 4. 写作要求

- ⚠️ **事实优先**（D-11）：每段事实陈述挂源文件 + 行号（如 `web/components/large-screen/Widget.tsx#L34-L169`）
- ⚠️ **不替用户拍板**：widget 控件的写法建议、商用授权等不写改进建议（按 plan-004 共识）
- ⚠️ **meta-human 仅描述机制**：把 OPEN_OPERATE_TAB / OPEN_OPERATE_MODAL / SWITCH_OPERATE 的 dispatch 逻辑描述清楚即可；具体调用示例在 `meta-human/readme.md` 与 SKILL.md，本文件**不复制**

## 5. 执行步骤

| 步 | 动作 |
|---|---|
| 1 | 抽样读 WidgetsRender + Widget + utils.ts 的边界行号（用于"关键引用形态"） |
| 2 | 写 `docs/design/large-screen-engine.md`（按 §3 大纲 13 节） |
| 3 | 在 `docs/design/README.md` 索引表追加 1 行 |
| 4 | 用 grep 验证 Rule 2 / 4 |

## 6. 不做（OUT）

- ❌ 不复制 `meta-human/readme.md` 的 3 个示例 payload（已在该 readme.md）
- ❌ 不复制 `docs/skills/.../SKILL.md` 的 11 个 action 契约
- ❌ 不写 LLM 视角的行动指引（Rule D-15）
- ❌ 不写 widget 内部业务实现（`web/pages/five-major-center/.../modules/`）

## 7. 完成定义

- [ ] `docs/design/large-screen-engine.md` 写入（≥13 节）
- [ ] `docs/design/README.md` 索引追加 large-screen-engine.md
- [ ] 所有源引用为仓库根相对路径 + 行号
- [ ] Rule 2/4 验证通过

## 8. 关联文档

- [Plan-005](./2026-08-03-005-plan-web-components-docs.md)
- `docs/specs/five-major-center/as-is-architecture.md` 消费方
- `docs/skills/five-major-center-interaction-trigger/SKILL.md` 行动契约
- `docs/design/tech-stack.md`
- `.trae/rules/docs-authoring-rules.md`

## 9. 修订记录

| 日期 | 修订内容 | 出处 |
|---|---|---|
| 2026-08-03 | 初版 | Plan-005 拆分 |
