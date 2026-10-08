# 后端维护指南（midway + @fedx-bff/core）

适用于在 fedx 全栈项目中维护服务端代码：新增 / 修改接口、Service、SQL、数据源、WebSocket。

## 1. 目录与分层

```
src/
├── config/               # config.default.ts / config.prod.ts
├── configuration.ts      # @Configuration 入口（imports 组件、挂静态资源、initialSSRDevProxy）
├── controller/index.ts   # 页面路由（SSR render）
├── controller/api.ts     # 其他 api 路由（如有）
├── modules/<biz>/        # 业务模块（推荐按业务垂直拆分）
│   ├── config.ts         # 模块配置（必需！缺失会导致启动失败）
│   ├── controller/       # 继承 BaseController
│   ├── dto/              # 入参校验
│   ├── service/          # 继承 BaseService
│   └── mappers/          # MyBatis XML SQL
├── service/              # 通用 service
└── socket/               # WebSocket
```

维护原则：

- 业务代码放 `modules/<biz>/`，不要往 `src/service`、`src/controller` 堆业务。
- 同一业务链路的 controller / dto / service / mapper 放同一模块目录，改动时一起看。
- `@fedx-bff/core` 在 `configuration.ts` 中 import 后会自动扫描注册模块，新增文件无需手动注册。

## 1.1 新增一个业务 module

启动时 `@fedx-bff/core` 会遍历 `src/modules/` 下的每个目录：**每个目录必须包含 `config.ts`，否则启动直接抛 `InternalException: 模块【xxx】缺少config.ts配置文件`**。

最小 `config.ts`：

```ts
import { Application } from '@midwayjs/koa';
import { ModuleConfig } from '@fedx-bff/core';

export default (app: Application) => {
    return {
        name: 'demo',
        description: '示例模块',
        middlewares: [],          // 只对本模块有效的中间件
        globalMiddlewares: [],    // 全局中间件
        order: 0,                 // 加载顺序，值越大越优先
        fedxBffCoreModuleConfig: {
            // 郑重声明：initDB 为 true 时会清空数据库所有表数据，务必保持 false
            initDB: false,
            router: { prefix: '' },
            pagination: { pageSize: 10 },
        },
    } as ModuleConfig;
};
```

模块扫描时还会自动做：

- `mappers/` 下所有 `*.xml` 注册进 myBatisManager（且开发态 watch 热加载，改 XML 无需重启）。
- `config.ts` 的配置合并进模块配置，`globalMiddlewares` 按 `order` 排序后挂全局。

新建 module 步骤：

1. `src/modules/<name>/` 建目录，先建 `config.ts`（否则启动报错）。
2. 按需加 `controller/`、`dto/`、`service/`、`mappers/` 子目录。
3. controller 的 `@FedxBffCoreController({ prefix })` 前缀建议与模块名一致，避免跨模块冲突。**最终路径 = prefix + handler path**；不传 prefix 时自动生成 `/{模块名}/{controller 文件名}`，完整规则见 `examples/add-api.md` 第 4 节「路径拼接规则」。
4. `pnpm start` 验证启动无 `InternalException`、接口可访问。

## 2. 新增 / 修改一个接口

标准链路（详见 `../examples/add-api.md`）：

1. **dto**：`modules/<biz>/dto/xxx.ts` 定义入参校验（`@Rule(RuleType.xxx())`）。必填字段加 `.required()`。
2. **service**：`modules/<biz>/service/xxx.ts` 继承 `BaseService`，实现方法。四种取数方式按需选：
   - `myBatisQuery`（mapper XML，支持 `<if>`/`<foreach>` 动态 SQL）
   - `nativeQuery`（直写 SQL 字符串 + `?` 占位参数，不需要 XML）
   - `setModel(entity)` + `list/add/update/delete/pagination`（基于 typeorm entity，零 SQL）
   - 原生 midway 写法（不继承 BaseService）：`@InjectEntityModel` repository、`HttpService`、task 等标准组件注入
3. **controller**：`modules/<biz>/controller/xxx.ts` 继承 `BaseController` + `@FedxBffCoreController({ prefix, api: [] })`，handler 返回 `this.success(data)`。
4. **mapper**（仅 `myBatisQuery` 方式需要）：`modules/<biz>/mappers/xxx.xml` 写 SQL，`namespace` + `select id` 与 `myBatisQuery` 两参对应。注意：只有 `*.xml` 会被自动加载，`.sql` 等其他文件不会。

修改已有接口时自查：

- dto 加字段 → 前端调用处是否传参、mapper SQL 是否用到。
- mapper SQL 改动 → namespace/id 未变、`#{}` 占位参数名与 service 传参一致。
- 返回结构变化 → 前端取数字段是否兼容（大屏 widget 通常直接取 `data.xxx`）。

## 3. SQL 维护规范

- 只用 `#{param}` 占位（有引号转义但非预编译绑定，外部入参在 service 层校验），**禁止 `${}` 拼接**（原样内联零转义，注入风险）。
- 含 `<`、`>`、`<=` 的 SQL 片段用 `<![CDATA[ ... ]]>` 包裹。
- 一个业务模块一个 mapper XML（如 `nocSqlConfig.xml`），SQL 加中文注释说明用途。
- 新增 select 记得 `order by` / 数据量控制，大屏接口要避免全表扫描。
- 改动表结构相关 SQL 前先确认数据库类型（mysql / oracle / 国产库方言差异，`SYSDATE()` 等函数不通用）。
- 国产数据库适配见 `guides/chinese-db.md`；多数据源（如 mysql + oracle 混配）通过各取数方法的 `connectionName` 参数区分，详见 `references/fedx-bff-core.md`「多数据源」节。

## 4. 配置维护（config/）

- `config.default.ts`：本地开发配置；`config.prod.ts`：生产配置。数据源（typeorm dataSource）、axios clients、httpProxy 策略都在这里。
- 改数据源 / 连接信息属环境敏感操作，先确认项目是否有版本固定或国产数据库适配策略。
- 多数据源：typeorm `dataSource` 下配多个 key，查询时通过 `connectionName` 指定。
- **服务端口不在 midway config 配**：开发态由根目录 `config.ts`（fePort / serverPort）+ `fedx start --port` 控制，生产由 `bootstrap.js` 读 `config.ts` 注入 koa，详见 `guides/ops.md` 2.2。

## 5. WebSocket 维护

`src/socket/` 下 `@WSController('/ws')` + `@OnWSMessage` / `@OnWSConnection`。前端用 `socket.io-client` 对应版本连接。改动事件名时前后端同步。

## 6. 事务 / 缓存 / 定时任务

- 多表写操作用 `@FedxBffTransaction` 包裹 service 方法。
- 低频变动数据可用 `@Cache({ ttl })` 缓存。
- 定时任务用 `@midwayjs/task`（`@Task` 装饰器 + config 中 task 配置）。

## 7. 排错路径

1. 接口 404 → controller 前缀 / 路径拼写、模块是否在 `modules/` 扫描范围。
2. 参数校验失败（400）→ dto 规则与前端传参。
3. SQL 报错 → 看 midway 日志中的实际 SQL；`myBatisManager.fromatSql` 可输出渲染后的 SQL。
4. 渲染页面白屏 → `controller/index.ts` 的 `@Get` 路由是否遗漏、`onError` 降级逻辑是否生效。

## 8. 提交前自查

- `pnpm run lint` 通过。
- 新增文件命名与目录约定一致（小写中划线）。
- mapper XML 中无 `${}`、无未转义的 `<` `>`。
