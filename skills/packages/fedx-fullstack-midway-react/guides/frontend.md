# 前端维护指南（React SSR）

适用于在 fedx 全栈项目中维护前端：页面与路由、SSR 预取、取数、公共资产、双环境兼容。

## 0. 推荐目录结构

```
web/
├── store/
│   └── index.ts          # 全局 store 定制：state / reducer（可选，见 5.4）
├── common/               # 与框架/环境相关的常量与全局对象
│   ├── constants.ts      # 枚举、字典、魔数
│   ├── environment.ts    # 环境标识（dev/prod）
│   └── global.ts         # 挂到 window 的全局对象
├── components/
│   ├── layout/           # ⚠️ 框架约定的全局布局目录（三件套，见 2.5，不可改名）
│   ├── ui/               # 基础 UI（panel、border、图表封装等）
│   └── <biz>/            # 按业务域归组（每个组件 index.tsx + index.less 成对）
├── hooks/                # 通用 hooks（useXxx.ts，一 hook 一文件）
├── services/             # api 调用函数层（按后端模块分文件），统一 request 封装
└── pages/
    └── <page-name>/
        ├── render.tsx    # 页面入口（约定名，不可改）
        ├── render$id.tsx # 动态路由入口（可选）
        ├── fetch.ts      # SSR 预取数据（可选）
        ├── index.less    # 页面级样式
        └── components/   # 页面私有子组件（仅本页用；跨页需求提升到 web/components）
```

分层原则：

- **页面私有 → 页面共享 → 全局**：子组件先放 `pages/<page>/components/`，第二个页面要用时提升到 `web/components/<biz>/`，勿直接写到全局。
- **api 函数收敛在 `web/services/`**（或页面模块内统一一处），按后端模块对齐文件命名，禁止组件里散落裸 fetch。
- **hooks 一律进 `web/hooks/`**，纯函数工具进 `web/utils/`（如项目有），不要和 hooks 混放。
- **只有入口/布局文件名是约定死的**（`render.tsx` / `render$id.tsx` / `fetch.ts` / `web/components/layout/` 三件套，见 2.5），其余目录组织项目可按规模调整，但同一项目内保持一致。

## 1. 页面结构

```
web/pages/<page-name>/
├── render.tsx        # 页面入口（约定名，不可改）
├── render$id.tsx     # 动态路由入口（可选）
├── fetch.ts          # SSR 预取数据（可选）
├── index.less        # 页面级样式
└── components/       # 页面内子组件（index.tsx + index.less 成对）
```

## 2. 路由机制（两层）

**第一层：框架级路由（顶层页面路由，自动生成）**

- 页面路由由 `render.tsx` / `render$id.tsx` **约定式文件名**自动生成，注册为 `<Switch>` 下的一级 `<Route exact>`，无需手写路由表：

| 文件 | 对应 URL |
| --- | --- |
| `web/pages/<page-name>/render.tsx` | `/<page-name>` |
| `web/pages/<page-name>/render$id.tsx` | `/<page-name>/123`（参数 `props.match.params.id`） |

- 框架用 `withRouter` 包裹页面组件后透传全部路由属性，**页面组件 `props` 上直接可取**：
  - `props.match.params.<name>` —— 路由参数（`render$id.tsx` → `id`；`render$user.tsx` → `user`，参数名 = `$` 后的文件名片段）
  - `props.location` —— pathname / search / state / hash
  - `props.history` —— push / replace / goBack
- 页面级 fetch.ts 的入参 `routerProps` 与上述同一结构（`routerProps.match.params.id`）。

- 每个页面路由默认 `exact`（精确匹配），URL 必须完整命中页面 path 才渲染。
- 所有页面共用全局布局（`web/components/layout/`，见 2.5 节）。
- 框架内部用 react-router v5 的 `BrowserRouter`（微前端场景自动切 `MemoryRouter`），basename 取部署 prefix。
- 服务端按请求 path 用同一路由表精确匹配（`findRoute`，path-to-regexp），匹配不到直接抛错——所以 **新增页面文件后若没在 `src/controller/index.ts` 加 `@Get`，或路径拼错，会 404 / 报 "search component failed"**。

**第二层：页面内子路由（手写，SSR 兼容）**

`render.tsx` 内部就是普通 React 组件，直接用 react-router-dom（v5）声明嵌套子路由：

```tsx
import { Switch, Route, useRouteMatch, Link } from 'react-router-dom';

export default function DemoPage(props) {
    const { path, url } = useRouteMatch(); // 取当前页面路由前缀，子路由基于它拼
    return (
        <div>
            <Link to={`${url}/tab-a`}>Tab A</Link>
            <Link to={`${url}/tab-b`}>Tab B</Link>
            <Switch>
                {/* 建议子路由 path 基于 useRouteMatch() 的 path 拼，避免写死页面 path */}
                <Route path={`${path}/tab-a`} exact component={TabA} />
                <Route path={`${path}/tab-b`} exact component={TabB} />
                {/* 动态参数：/demo-page/detail/123 → props.match.params.id */}
                <Route path={`${path}/detail/:id`} exact component={Detail} />
                <Route component={NotFound} />
            </Switch>
        </div>
    );
}
```

维护要点：

- 子路由完全由你掌控，框架只保证页面级路由命中 `render.tsx`，内部怎么嵌套不感知。
- **子路由切换是纯客户端行为，不会触发 SSR**：直出的是入口 URL 对应的内容，子路由首屏数据需在子组件内客户端获取，或入口 fetch.ts 把数据带全再下发。
- 子路由 path 不要写死页面全路径，用 `useRouteMatch()` 拼接，这样页面 path 变更 / 部署 prefix 变更时子路由自动跟随。
- 服务端 SSR 渲染时只看页面级路由（一层），若用户直出访问带子路由的 URL，入口组件照常渲染，内部 `<Switch>` 在 hydrate 后由客户端接管，同样能正确显示——但首屏 HTML 是整页直出的，子路由组件的数据若只在客户端拉会有闪空，注意 loading 态。

**声明式路由（manual routes，了解即可）**

框架支持在构建产物 `_build/manual-routes` 中声明式覆盖 / 追加路由（与约定式按 path 合并，同名 path 声明式优先）。日常业务用约定式即可，需要非文件来源的路由（如代码里动态注册）再考虑。

### 2.5 全局布局（web/components/layout/，⚠️ 约定目录，不可改名）

框架构建期（`ssr-utils/cjs/server/parse.js`）**按固定路径**读取布局三件套，路径和文件名都是约定死的，**改名 / 移动 / 删除会直接导致构建产物缺 Layout 导出而报错**：

```
web/components/layout/
├── index.tsx    # Layout：整个应用的 HTML 外壳（<html>/<head>/<body>），只在服务端渲染
├── App.tsx      # App：服务端 + 客户端共用，页面路由树（props.children）包在这里面
└── fetch.ts     # layoutFetch：全局 SSR 预取（可选，存在才生效，返回值合并进全局 store）
```

维护规则：

- **不要把这个目录当普通业务组件目录**：其他业务组件放 `web/components/<biz>/`，唯独 `layout/` 是框架约定路径，不能复用这个目录名存放业务布局组件。
- `index.tsx`（Layout）**只在服务端渲染一次**，不要在里面写客户端逻辑（事件、useEffect、定时器等）。
- 客户端需要参与的全局包裹（Provider、全局挂载点等）写在 `App.tsx` 里。
- 改 `<title>`、meta、全局样式引入、antd cssinjs 的 `extractStyle`（SSR 样式抽取）都在 `index.tsx`；改全局挂载 DOM / SDK 容器在 `App.tsx`。
- `fetch.ts` 是可选文件：删掉即无 layoutFetch；存在时其返回值会以低于页面 fetch.ts 的优先级合并进 store（见 5.1）。

## 3. 页面入口（render.tsx）

```tsx
export default function DemoPage(props) {
    const initData = props?.fetchData?.list ?? []; // SSR 预取数据
    // ...
}
```

- `props.fetchData`：`fetch.ts` 的返回值（仅提供了 fetch.ts 时存在）。
- 页面是普通 React 组件，hooks / 状态正常使用。

## 4. SSR 预取（fetch.ts）

```ts
import type { ReactMidwayFetch } from '@fedx-bff-web/ssr-types';

const fetch: ReactMidwayFetch = async ({ ctx, routerProps }) => {
    // ctx 仅 SSR 时存在（可读 header / cookie）；routerProps 含动态路由参数
    return { list: await getListApi() };
};
export default fetch;
```

维护注意：

- 有 `fetch.ts` 首屏直出数据；删除则回退纯客户端取数，页面照常工作。
- fetch 中调用的 api 函数需同时兼容 Node（服务端发 http 到本机端口）与浏览器环境。
- 修改返回结构时同步检查组件内 `props.fetchData.xxx` 取数路径。

## 5. 客户端取数与状态

### 5.1 SSR 数据注入机制（props.fetchData 从哪来）

服务端渲染时（`plugin-ssr-react/cjs/entry/server-entry.js`）：

1. 执行 `layoutFetch`（`web/components/layout/fetch.ts` 导出，可选）+ 页面 `fetch.ts`（可配 `parallelFetch` 并行）
2. 结果合并 `{ ...state, ...layoutFetchData, ...fetchData }`（`state` 为 `web/store` 导出的初始状态，若项目有）
3. 序列化后随页面下发，客户端 hydrate 时作为 store 初始值，避免二次请求

**首屏注入的数据不限于 `props.fetchData`，也会合并进全局 store（见 5.3），任何组件都能读到。**

### 5.2 客户端取数

- 客户端取数用普通 `useEffect` + state，或项目通用 hooks 包（`@fedx-web-common/react-hooks`，内部 `export * from 'ahooks'`，即 **ahooks 3.x 全量可用**，useRequest / useLatest / useSetState 等都有，API 以 ahooks 文档为准）。
- api 函数收敛在 `web/services/` 或页面模块内，禁止在组件里散落裸 fetch。
- 取数走本模块 BFF 接口；第三方 / 跨域接口走服务端 `http-proxy` 或 custom-fetch 代发，**禁止浏览器直连内网接口**。

### 5.3 跨组件共享状态（内置 store context）

框架内置一个全局 store（`useReducer` 实现），SSR 数据自动成为初始状态：

```tsx
import { useStoreContext } from '@fedx-bff-web/ssr-utils/common';
import { useContext } from 'react';

const { state, dispatch } = useContext(useStoreContext());

// 读：state 含首屏注入（fetch.ts / layoutFetch）合并进来的所有字段
// 写：dispatch({ type: 'updateContext', payload: { foo: 1 } })  → 浅合并
```

注意：dispatch 只在客户端生效；SSR 首屏渲染期间 dispatch 不会反映到本次直出 HTML（两套入口各自实例化 context）。

### 5.4 项目级 store 定制（web/store/index.ts）

约定路径 `web/store/index.ts`，存在时构建期自动 `export * from '@/store/index'` 注入路由产物（`ssr-utils/cjs/server/parse.js`），其导出直接接入上面的全局 store：

```ts
// web/store/index.ts
const state = {
    // 全局初始状态：所有页面共享，且优先级低于 fetch.ts / layoutFetch 的返回值（后者浅覆盖）
    theme: 'dark',
    userInfo: null,
};

// 自定义 reducer：不实现时非 updateContext 的 action 无效果
function reducer(state, action) {
    switch (action.type) {
        case 'setUser':
            return { ...state, userInfo: action.payload };
        default:
            return state; // 保持不变。注意：返回 undefined 会导致 useReducer 报错
    }
}

export { state, reducer };
```

生效链路：

- `state` → SSR 合并顺序 `{ ...state, ...layoutFetchData, ...fetchData }`（见 5.1），客户端 hydrate 同样以其为初始值
- `reducer` → 与内置 reducer 组合为 `combineReducer = defaultReducer(state, action) || userReducer(state, action)`（`plugin-ssr-react/cjs/entry/context.js`）——**内置先执行**：`updateContext`（浅合并）由内置处理，不会进入自定义 reducer；其余 action type 落到自定义 reducer。

维护要点：

- state 放「与页面无关的全局配置/共享态」；页面首屏数据仍走各自 fetch.ts。
- `reducer` 不实现（空函数）即只支持内置 `updateContext`，如项目只用 `updateContext` 保持默认即可。
- 自定义 reducer 的 default 分支返回 `state`（原样返回），**不要返回 undefined**——两个 reducer 都返回 undefined 时 useReducer 会抛错。

## 6. 公共资产

- `web/components/`：跨页面通用组件，新需求先查这里再自写。
- `web/hooks/`：通用 hooks（如 socket 客户端封装，以项目实际为准；注意导出名可能与文件名不同，引用前先确认）。
- `web/common/`：常量、环境变量、globalObject。
- 组件目录均 `index.tsx + index.less` 成对；页面内组件放 `pages/<page>/components/`，跨页面复用才提升到 `web/components/`。

## 7. SSR / CSR 双环境兼容

- 组件内不要在模块顶层访问 `window` / `document`，放 `useEffect` 内。
- 需要判断运行环境时用 `window.__USE_SSR__`。
- 报 "window is not defined" 类错误 → 排查模块顶层副作用（如直接执行的第三方库初始化）。

## 8. 维护常见操作

| 操作 | 步骤 |
| --- | --- |
| 新增页面 | 建 `render.tsx` + `index.less`（+ 可选 fetch.ts）→ `src/controller/index.ts` 加 `@Get` |
| 动态路由页面 | 文件命名 `render$id.tsx`，参数从 `props.match.params.id` 取 |
| 新增子路由 | `render.tsx` 内用 react-router-dom 的 `<Switch>/<Route>` + `useRouteMatch()` 拼路径 |
| 修改首屏数据 | 改 `fetch.ts` 返回结构 + 组件内 `props.fetchData` 取数路径 |
| 改布局 / title / meta | 改 `web/components/layout/index.tsx`（仅服务端渲染）；全局客户端包裹改 `App.tsx`（见 2.5，目录名不可改） |
| 修改开发端口 | `config.ts` 改 `fePort`，或 `fedx start --port <port>`（命令行优先）；改后重启 `fedx start` |
| 页面 404 | `@Get` 路由遗漏或页面文件命名不符合约定 |
| 页面白屏 | 看 SSR 报错日志；确认 onError 降级逻辑是否生效 |

## 9. 提交前自查

- `pnpm run lint` 通过。
- 页面文件命名符合约定（`render.tsx` / `render$id.tsx`）。
- 新组件目录 `index.tsx + index.less` 成对。
- 无模块顶层 `window` / `document` 访问。
