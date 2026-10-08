# iframe-page · iframe 嵌入中心页

> 作用：`web/pages/five-major-center/iframe-page/`（`IframePage` 组件）—— 态势感知中心与实时发现中心等 iframe 嵌入外部页面的统一入口。

## 定位

部分「中心」没有本地页面实现，路由直接挂 `IframePage`，由环境配置驱动嵌入外部系统页面。当前挂在路由上的有：

| 路由                                            | 中心         | 环境配置情况                                   |
| ----------------------------------------------- | ------------ | ---------------------------------------------- |
| `/five-major-center/situation-awareness-center` | 态势感知中心 | 已配置（url / width / height / openNewWindow） |
| `/five-major-center/real-time-discovery-center` | 实时发现中心 | 有路由、无配置（页面为空）                     |

## 工作机制

源码：`web/pages/five-major-center/iframe-page/index.tsx`

1. 从 `usePageRouteContext()`（见 `web/pages/five-major-center/context/`）取当前路由 `subpath`
2. 通过 `useEnvironment` 读环境配置 `five-major-center.iframe-page.<subpath>`（数据源 `public/environment.json`）
3. 行为分支：
    - `openNewWindow: true` → `window.open(pageConfig.url, '_blank')`，组件不渲染内容
    - 否则渲染 `IframeLoader`，透传 `url` / `width` / `height`（rootClassName 固定 `iframe-view-root`、iframeClassName 固定 `iframe-view`）
    - 无配置时不渲染（返回空 div）
4. 实际的 iframe 加载由 `web/components/ui/iframe-loader/`（`IframeLoader`）完成，本组件只是配置装配层；组件细节见 skill `design/components/004-iframe-loader/README.md`

## 新增一个 iframe 中心

1. `web/pages/five-major-center/router.tsx` 的 `routes` 加一项：`path` + `component: IframePage` + `name`
2. `public/environment.json` 的 `five-major-center.iframe-page` 下加 `<subpath>` 配置（url / width / height / openNewWindow）

无需新增任何页面代码。

配置示例（取自 `public/environment.json` 现有的 `situation-awareness-center`）：

```json
"five-major-center": {
    "iframe-page": {
        "desc": "iframe页面",
        "situation-awareness-center": {
            "desc": "态势感知中心",
            "name": "situation-awareness-center",
            "url": "http://super100.gmcc.net/nsuper-cloud/cloud",
            "--url": "http://www.baidu.com",
            "width": 5760,
            "height": 1080,
            "openNewWindow": false
        }
    }
}
```

字段说明：`url` 为嵌入地址（IframeLoader 支持其中 `{{access_token}}` / `{{sso_token}}` 占位符）；`--url` 前缀为备关注释写法，不生效；`width` / `height` 为 iframe 尺寸；`openNewWindow: true` 时新窗口打开。

## 维护准则

- 本组件不持有业务状态；展示内容的变化只改 `environment.json` 配置
- `openNewWindow` 分支依赖调用方（Header 切换）触发路由变化后执行 `window.open`，注意弹窗拦截场景
- 历史 `BackBtn`（返回指挥调度中心）逻辑已被注释停用，勿按其存在理解现状
