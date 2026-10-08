# @fedx-bff-web/ssr-core 使用文档

SSR 渲染核心。整个包对业务代码只暴露一个函数：`render`。

## render(ctx, options)

在 midway 页面 controller 中渲染前端页面。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| ctx | ISSRContext | koa 请求上下文（`@midwayjs/koa` 的 Context） |
| options | UserConfig（部分字段） | 渲染配置 |

常用 options：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| stream | boolean | `true` 流式渲染（推荐，返回 Readable）；`false` 返回完整字符串 |
| mode | `'ssr' \| 'csr'` | 渲染模式；`'csr'` 时走客户端渲染 |
| onError | `(err) => null \| string` | 渲染出错回调，用于降级 |

返回：`stream: true` 时 `Promise<Readable>`，否则 `Promise<string>`。

## 标准用法（页面路由）

`src/controller/index.ts` 中一个 handler 挂多个 `@Get`，流式渲染 + SSR 失败自动降级 CSR：

```ts
import { render } from '@fedx-bff-web/ssr-core';

@Get('/')
@Get('/some-page')
async handler(): Promise<void> {
    const stream = await render(this.ctx, {
        stream: true,
        onError: (err) => {
            console.log('ssr error', err);
            stream.destroy();
            render(this.ctx, { stream: false, mode: 'csr' }).then((csrStr) => {
                this.ctx.res.end(csrStr);
            });
            return null;
        },
    });
    this.ctx.body = stream;
}
```

## 页面与路由的对应关系

约定式路由：`web/pages/<page-name>/render.tsx` 对应 URL `/<page-name>`；动态路由页面文件名为 `render$id.tsx`。新增页面只需：加 `@Get` 路由 + 建页面目录。

## 注意事项

- 生产环境需要保证 `build/` 静态资源已挂载（见 SKILL.md 2.1 的 koaStatic 配置）。
- 开发环境需在 `configuration.ts` 的 `onReady` 中调用 `initialSSRDevProxy(this.app)`（来自 `@fedx-bff-web/ssr-utils`），否则 HMR 代理不生效。
- 渲染模式也可通过全局配置 `mode: 'ssr' | 'csr'` 控制（见 ssr-types 的 UserConfig）。
