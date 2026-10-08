# 示例：SSR 数据注入与跨组件 store（state / dispatch）

演示框架内置 store 的完整用法：fetch.ts 注入初始数据 → 页面读 state → 事件触发 dispatch → 其他组件同步更新。

机制说明见 `guides/frontend.md` 第 5 节：服务端把 `fetch.ts` 返回值注入页面，客户端 hydrate 时合并进 store 初始状态。

## 1. fetch.ts —— 注入初始数据

```ts
import type { ReactMidwayFetch } from '@fedx-bff-web/ssr-types';

const fetch: ReactMidwayFetch = async ({ ctx, routerProps }) => {
    return {
        userInfo: { name: '张三', role: 'admin' },
        noticeList: ['系统今晚 22:00 维护', '新版本已发布'],
    };
};
export default fetch;
```

## 2. 页面 render.tsx —— 读 state

```tsx
import { useStoreContext } from '@fedx-bff-web/ssr-utils/common';
import { useContext } from 'react';
import { NoticePanel } from './components/notice-panel';
import { UserBar } from './components/user-bar';

export default function DemoPage(props) {
    // props.fetchData 与 store state 是同一份数据的两种入口
    const { state } = useContext(useStoreContext());
    const userInfo = state.userInfo; // SSR 直出，客户端 hydrate 后同样可读

    return (
        <div className="demo-page">
            <UserBar />
            <NoticePanel />
        </div>
    );
}
```

## 3. 组件 A：dispatch 写入

```tsx
// components/user-bar/index.tsx
import { useStoreContext } from '@fedx-bff-web/ssr-utils/common';
import { useContext } from 'react';

export function UserBar() {
    const { state, dispatch } = useContext(useStoreContext());
    const { name, role } = state.userInfo ?? {};

    const onSwitchRole = () => {
        // updateContext：内置 action，payload 浅合并进 state
        dispatch({
            type: 'updateContext',
            payload: { userInfo: { name, role: role === 'admin' ? 'guest' : 'admin' } },
        });
    };

    return (
        <div>
            {name}（{role}）
            <button onClick={onSwitchRole}>切换角色</button>
        </div>
    );
}
```

## 4. 组件 B：响应另一个组件的 dispatch

```tsx
// components/notice-panel/index.tsx
import { useStoreContext } from '@fedx-bff-web/ssr-utils/common';
import { useContext, useState } from 'react';

export function NoticePanel() {
    const { state, dispatch } = useContext(useStoreContext());
    const [dismissed, setDismissed] = useState(false);

    // state.noticeList 来源：fetch.ts 注入（初始）；或其他组件 dispatch 后的新值
    const list = state.noticeList ?? [];

    const onClear = () => {
        setDismissed(true);
        dispatch({ type: 'updateContext', payload: { noticeList: [] } });
    };

    if (dismissed) return null;
    return (
        <ul>
            {list.map((n, i) => <li key={i}>{n}</li>)}
            <button onClick={onClear}>清除</button>
        </ul>
    );
}
```

点击 UserBar 的「切换角色」或 NoticePanel 的「清除」，两处的 `state` 都会更新——它们共享同一个 store context。

## 5. 项目级 store 定制：自定义 reducer（web/store/index.ts）

上面全部走内置 `updateContext`（浅合并）。当需要**自定义 action 语义 / 深层更新逻辑**时，在 `web/store/index.ts` 导出 reducer（构建期自动接入，见 `guides/frontend.md` 5.4）：

```ts
// web/store/index.ts

// 全局初始状态（优先级低于 fetch.ts / layoutFetch 返回值，会被浅覆盖）
const state = {
    theme: 'dark',
    userInfo: null,
    noticeList: [],
};

// 自定义 reducer：dispatch 非 updateContext 的 action 时走这里
// （updateContext 由内置 reducer 先行处理，不会进入自定义 reducer）
function reducer(state, action) {
    switch (action.type) {
        case 'addNotice': {
            const list = state.noticeList ?? [];
            return { ...state, noticeList: [...list, action.payload] };
        }
        case 'setUser':
            return { ...state, userInfo: action.payload };
        default:
            return state; // 原样返回。返回 undefined 会导致 useReducer 报错
    }
}

export { state, reducer };
```

组件内 dispatch 自定义 action（可与内置 `updateContext` 混用）：

```tsx
// components/notice-panel/index.tsx 内
const { state, dispatch } = useContext(useStoreContext());

// 自定义 action：走 web/store/index.ts 的 reducer
const onAdd = () => dispatch({ type: 'addNotice', payload: '新通知' });

// 内置 action：照常可用
const onUpdate = () => dispatch({ type: 'updateContext', payload: { theme: 'light' } });
```

若页面 fetch.ts 也返回了 `noticeList`，初始值以 fetch.ts 为准（fetch 覆盖 store state）；reducer 不受影响，dispatch 后按 reducer 逻辑走。

## 6. 注意事项

- `updateContext` 是浅合并（`{ ...state, ...action.payload }`），嵌套对象需整体替换（如上面 `userInfo` 整个传入）；嵌套更新建议用自定义 reducer（见第 5 节）。
- dispatch 仅客户端生效；SSR 首屏渲染期间 dispatch 不会反映到直出 HTML。
- `useStoreContext()` 本身不是 React hook（模块级缓存取 context），不要在它外层套条件判断后再 `useContext`；`useContext` 必须在组件顶层调用。
- 自定义 reducer 的 default 分支务必返回 `state`（原样返回），返回 undefined 会导致 useReducer 报错。
- `web/store/index.ts` 的 `state` 是全页面共享的全局初始值，不要放页面私有数据（页面首屏数据走各自 fetch.ts）。
