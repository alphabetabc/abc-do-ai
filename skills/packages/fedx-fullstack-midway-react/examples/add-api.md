# 示例：新增一个查询接口（全链路）

以「查询某区域资源列表」为例，展示新建 module（首次）→ dto → mapper → service → controller → 前端调用的完整链路。

## 0.（首次）新建 module —— `src/modules/demo/config.ts`

若 `demo` 模块不存在，必须先建 `config.ts`（缺失会导致启动报 `InternalException`）：

```ts
import { Application } from '@midwayjs/koa';
import { ModuleConfig } from '@fedx-bff/core';

export default (app: Application) => {
    return {
        name: 'demo',
        description: '示例模块',
        middlewares: [],
        globalMiddlewares: [],
        order: 0,
        fedxBffCoreModuleConfig: {
            // initDB 为 true 会清空数据库所有表数据，务必保持 false
            initDB: false,
            router: { prefix: '' },
            pagination: { pageSize: 10 },
        },
    } as ModuleConfig;
};
```

已有模块则跳过此步。模块内的 `mappers/*.xml` 会被自动扫描注册。

## 1. dto —— `src/modules/demo/dto/resource.ts`

```ts
import { Rule, RuleType } from '@midwayjs/validate';

export class QueryResourceDTO {
    @Rule(RuleType.string().required())
    relationZone: string;

    @Rule(RuleType.array())
    objectClasses: Array<string>;
}
```

## 2. mapper —— `src/modules/demo/mappers/demoSqlConfig.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="demoSql">
    <!-- 查询区域资源列表 -->
    <select id="queryResourceInfo">
        select * from T_RESOURCE
        where RELATION_ZONE = #{relationZone}
        <if test="objectClasses != null and objectClasses.length > 0">
            and OBJECT_CLASS in
            <foreach collection="objectClasses" item="item" open="(" separator="," close=")">
                #{item}
            </foreach>
        </if>
        order by indicator_sort
    </select>

    <!-- 含 < 比较符时用 CDATA 包裹 -->
    <select id="queryLowLoad">
        <![CDATA[
            select * from T_RESOURCE where LOAD_RATIO < 0.5
        ]]>
    </select>
</mapper>
```

## 3. service —— `src/modules/demo/service/resource.ts`

**方式 A：mapper XML（动态 SQL / 复杂查询推荐）**

```ts
import { BaseService } from '@fedx-bff/core';
import { Provide } from '@midwayjs/decorator';

@Provide()
export class ResourceService extends BaseService {
    async queryResourceInfo(condition) {
        // 入参防御：空数组直接返回，避免无意义查询
        const { objectClasses } = condition;
        if (!objectClasses || objectClasses.length === 0) {
            return [];
        }
        // namespace='demoSql' 对应 mapper XML 的 namespace
        // key='queryResourceInfo' 对应 <select id>
        return await this.myBatisQuery('demoSql', 'queryResourceInfo', condition);
    }
}
```

**方式 B：nativeQuery 直写 SQL（不需要 mapper XML）**

```ts
@Provide()
export class ResourceService extends BaseService {
    async queryByZone(relationZone: string) {
        // 结果自动转驼峰；参数用 ? 占位，禁止字符串拼接
        return await this.nativeQuery(
            'select * from T_RESOURCE where RELATION_ZONE = ? order by indicator_sort',
            [relationZone],
        );
    }
}
```

**方式 C：基于 typeorm entity 的 curd（零 SQL）**

```ts
@Provide()
export class ResourceService extends BaseService {
    constructor() {
        super();
        this.setModel(ResourceEntity); // 绑定 entity
    }

    async listByZone(zone: string) {
        // list / add / update / delete / pagination 等方法直接可用，无需写 SQL
        return await this.list(
            { relationZone: zone },
            { addOrderBy: { id: 'DESC' } },
        );
    }
}
```

**方式 D：原生 midway 写法（不继承 BaseService）**

midway 组件是标准能力，service 不继承 `BaseService` 也能用：typeorm repository / DataSource、`@midwayjs/axios` 的 `HttpService`、`@midwayjs/task` 等照常注入：

```ts
import { Provide, Inject, Get } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@midwayjs/axios';
import { ResourceEntity } from '../entity/resource';

@Provide()
export class RawResourceService {
    // typeorm repository（需在 config.entities 中注册 entity）
    @InjectEntityModel(ResourceEntity)
    resourceRepo: Repository<ResourceEntity>;

    @Inject()
    httpService: HttpService; // @midwayjs/axios 客户端

    async listByZone(zone: string) {
        return await this.resourceRepo.find({
            where: { relationZone: zone },
            order: { id: 'DESC' },
        });
    }

    async fetchFromThirdParty(url: string) {
        const res = await this.httpService.get(url);
        return res.data;
    }
}
```

选型：

- 简单条件查询用 B/C；需要 `<if>` / `<foreach>` 动态拼接用 A。
- 团队已按 midway 标准写法开发、或需要 fedx 未封装的能力（如 repository 复杂查询、跨服务 http 调用）时用 D。

## 4. controller —— `src/modules/demo/controller/resource.ts`

**方式 1：自动生成 curd 接口（零手写，适合标准增删改查）**

`api` 数组声明即自动注册路由（detail 为 GET、其余 POST），空类即可用：

```ts
import { BaseController, FedxBffCoreController } from '@fedx-bff/core';
import { Provide } from '@midwayjs/decorator';
import { ResourceEntity } from '../entity/resource';

@Provide()
@FedxBffCoreController({
    prefix: 'resource',
    api: ['add', 'delete', 'update', 'pagination', 'detail'],
    entity: ResourceEntity,
})
export class ResourceController extends BaseController { }
// 即得到：POST /resource/add、/resource/delete、/resource/update、
//        /resource/pagination（分页）、GET /resource/detail
```

**方式 2：自定义 handler（灵活查询）**

```ts
import { BaseController, FedxBffCoreController } from '@fedx-bff/core';
import { Inject, Provide, Get, Post, Body, Param } from '@midwayjs/decorator';
import { QueryResourceDTO } from '../dto/resource';
import { ResourceService } from '../service/resource';

@Provide()
@FedxBffCoreController({
    api: [],        // 不需要框架生成的 curd 接口
    prefix: 'demo', // 最终路径前缀
})
export class ResourceController extends BaseController {
    @Inject()
    resourceService: ResourceService;

    /** 查询区域资源列表：POST /demo/resourceInfo */
    @Post('/resourceInfo')
    async getResourceInfo(@Body() param: QueryResourceDTO) {
        const data = await this.resourceService.queryResourceInfo(param);
        return this.success(data);
    }

    /** GET + 路径参数示例：GET /demo/dic/:dicType */
    @Get('/dic/:dicType')
    async getDic(@Param('dicType') dicType) {
        return this.success(await this.resourceService.queryDictList(dicType));
    }
}
```

两种方式可共存：`api: ['add', ...]` + 自定义 handler 同写一个类里。

### 路径拼接规则

最终访问路径 = **`controller 前缀` + `handler path`**（`@midwayjs/core` 的 `webRouterService` 拼接）：

| 组成 | 来源 | 规则 |
| --- | --- | --- |
| controller 前缀 | `prefix: 'demo'` | 以 `/` 开头原样用，否则自动补成 `/demo`；纯字符串写法 `@FedxBffCoreController('demo')` 等价 |
| （未传 prefix 时） | 自动生成 | `/{moduleName}/{controllerName}`，按文件所在目录算，如 `src/modules/demo/controller/resource.ts` → `/demo/resource` |
| curd 自动接口 | `api` 数组项 | 前缀 + `/{api名}`，如 `/demo/add`（detail 为 GET，其余 POST） |
| 自定义 handler | `@Post('/resourceInfo')` | 前缀 + path，如 `/demo/resourceInfo` |

- 若 `@Configuration` 配置了 midway `globalPrefix`，会在最前面统一再叠加一层（多数项目未配）。
- 网关子路径部署的项目，实际访问还要再加部署前缀（以项目 scripts 为准）。

示例对照（controller 位于 `src/modules/demo/controller/resource.ts`）：

```
@FedxBffCoreController({ prefix: 'demo', api: ['add', 'detail'] })
├── POST /demo/add            ← api 自动生成（detail 为 GET）
├── GET  /demo/detail         ← api 自动生成
└── @Post('/resourceInfo') → POST /demo/resourceInfo   ← 自定义 handler

不传 prefix 时：/demo/resource/add、/demo/resource/detail、/demo/resource/resourceInfo
```

无需手动注册：`@fedx-bff/core`（在 `configuration.ts` imports 中）自动扫描 `modules/` 下的 controller。

## 5. 前端调用

api 函数（`web/services/xxx.ts` 或页面模块内）：

```ts
export const queryResourceInfoApi = (data: { relationZone: string; objectClasses: string[] }) =>
    request('/demo/resourceInfo', { method: 'POST', data });
```

组件内调用（`@fedx-web-common/react-hooks` 的 `useRequest`，即 ahooks 3.x）：

```tsx
import { useRequest } from '@fedx-web-common/react-hooks';

const { data, loading } = useRequest(() => queryResourceInfoApi({ relationZone, objectClasses: ['基站'] }));
```

## 6. 验证

```bash
pnpm start
# curl http://localhost:9902/demo/dic/SOME_TYPE 验证返回结构 { code: 200, message: '操作成功', data: [...] }
pnpm run lint
```
