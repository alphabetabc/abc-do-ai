# iframe-loader · iframe 加载组件

> 作用：`web/components/ui/iframe-loader/`（`IframeLoader`）—— 通用的外部页面 iframe 加载器，负责 URL 格式化（token 注入）、加载态展示与 iframe 渲染。

## 定位

`IframeLoader` 是可跨业务模块复用的 UI 组件，接收 url / 尺寸 / className，处理完 URL 格式化后渲染 iframe。URL 的最终格式化逻辑由外部脚本 `${STATIC_PATH}/extra-scripts/iframe-loader.js`（`public/static/extra-scripts/iframe-loader.js`）提供，组件内通过 `window['__iframe-loader-script__']` 获取。

## Props

```ts
Partial<{
    url: string;              // iframe 地址，支持 {{access_token}} / {{sso_token}} 占位符（从 localStorage 取值填充）
    width: string;
    height: string;
    rootClassName: string;    // 追加到根容器（默认 .iframe-loader--root，全尺寸 relative）
    iframeClassName: string;  // 追加到 iframe（默认 .iframe-loader，绝对定位居中）
    onBackClick: () => void;  // 声明于类型但组件内未使用（预留）
    children?: ReactNode;     // 渲染于 FedxDataStatus 内、iframe 之后
}>
```

## 行为机制

源码：`web/components/ui/iframe-loader/index.tsx`

1. **脚本加载**：`useInsertionEffect` 中动态注入 `extra-scripts/iframe-loader.js`（单次，loaderPromise 缓存；加载失败时静默降级为「URL 原样返回」）
2. **URL 格式化**：`useRequest`（`ready: url 有值`，`refreshDeps: [url]`）调用外部脚本的 `formatUrl`；占位符先经 `formatString` 填充 `access_token` / `sso_token`；url 变化时取消上一次进行中的格式化请求（cancelFlag + timer）
3. **渲染**：加载中显示 `FedxDataStatus`（loading）；成功且有 iframeUrl 时渲染 `<iframe>`（key = iframeUrl，URL 变化即整体重挂载）；iframe 的 `onLoad` / `onError` 回调转发给外部脚本的 `onIframeLoadEvent`
4. **轮询等待**：外部脚本方法未就绪时 `callMethods` 以 200ms 轮询直至可用

外部脚本（`public/static/extra-scripts/iframe-loader.js`）当前默认导出空实现 —— `formatUrl` 未定义时降级为 `async (url) => url`（原样返回）；`onIframeLoadEvent` 未定义时为 null。需要接入 ticket 获取等逻辑时改该脚本，不改组件。

## 样式

`index.less`（源码中该 import 已被注释，样式是否生效取决于全局引入情况）：

- `.iframe-loader--root`：`position: relative`，全宽高
- `.iframe-loader`：绝对定位、居中、无边框

## 使用方式

```tsx
import { IframeLoader } from '~/web/components/ui/iframe-loader';

<IframeLoader
    url={pageConfig.url}
    width={pageConfig.width}
    height={pageConfig.height}
    rootClassName="iframe-view-root"
    iframeClassName="iframe-view"
/>
```

## 维护准则

- URL 定制 / ticket 逻辑只改 `public/static/extra-scripts/iframe-loader.js`，组件保持通用
- iframe URL 变化会整体重挂载（key 机制），依赖 iframe 内部状态的功能需注意
- 脚本加载失败不报错，降级为直接加载原始 URL；排查「token 未注入」时先确认脚本是否加载成功
