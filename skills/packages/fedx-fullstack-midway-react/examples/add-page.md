# 示例：新增一个普通前端页面

以新增 `/demo-page` 页面为例。fedx 的约定式路由：`web/pages/<page-name>/render.tsx` 自动对应 URL `/<page-name>`，无需手写路由表。

## 1. 目录

```
web/pages/demo-page/
├── render.tsx        # 页面入口（约定名，不可改）
├── fetch.ts          # SSR 预取数据（可选）
├── index.less        # 页面样式
└── components/       # 页面内子组件（可选）
    └── user-list/
        ├── index.tsx
        └── index.less
```

## 2. `render.tsx`

```tsx
import { useState } from 'react';
import { UserList } from './components/user-list';
import { getZoneSelectDataApi } from '~/web/services/demo/share';
import './index.less';

export default function DemoPage(props) {
    // SSR 预取数据（若提供了 fetch.ts）会挂到 props.fetchData
    const initData = props?.fetchData?.list ?? [];

    const [keyword, setKeyword] = useState('');

    return (
        <div className="demo-page">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索..." />
            <UserList data={initData} keyword={keyword} />
        </div>
    );
}
```

## 3. `fetch.ts`（可选，SSR 预取）

```ts
import type { ReactMidwayFetch } from '@fedx-bff-web/ssr-types';
import { getZoneSelectDataApi } from '~/web/services/demo/share';

const fetch: ReactMidwayFetch = async ({ ctx, routerProps }) => {
    // 仅 SSR 时有 ctx（可读 header / cookie）；routerProps 含动态路由参数
    return { list: await getZoneSelectDataApi() };
};

export default fetch;
```

- 有 `fetch.ts`：服务端预取，数据注入 `props.fetchData`，首屏无白屏。
- 无 `fetch.ts`：纯客户端取数（`useRequest` 等），页面照常工作。

## 4. 子组件

```tsx
// web/pages/demo-page/components/user-list/index.tsx
import { useRequest } from '@fedx-web-common/react-hooks'; // 内部 re-export ahooks 3.x

export function UserList(props: { data: any[]; keyword: string }) {
    const { data, loading } = useRequest(() => getZoneSelectDataApi(), {
        ready: !!props.keyword, // ahooks useRequest 的 ready 选项，按条件触发请求
    });

    const list = props.data.filter((x) => !props.keyword || x.name.includes(props.keyword));

    if (loading) return <div className="loading" />;
    return (
        <ul className="user-list">
            {list.map((x) => (
                <li key={x.value}>{x.name}</li>
            ))}
        </ul>
    );
}
```

## 5. 注册页面路由 —— `src/controller/index.ts`

在现有 handler 上追加：

```ts
@Get('/demo-page')
```

（该 handler 内部统一 `render(this.ctx, { stream: true, ... })`，无需新写渲染逻辑。）

动态路由页面：文件命名为 `render$id.tsx`，URL 如 `/demo-page/123`，组件内从 `props.match.params.id` 取参数（fetch.ts 内为 `routerProps.match.params.id`）：

```tsx
export default function DemoDetail(props) {
    const { id } = props.match.params;
    // props.location / props.history 同样可用（withRouter 透传）
    return <div>详情：{id}</div>;
}
```

## 6. 验证

```bash
pnpm start
# 访问 http://localhost:9902/demo-page
# 检查：SSR 首屏有内容（查看源码）、客户端交互正常
pnpm run lint
```
