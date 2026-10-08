# @fedx-bff/core 使用文档

BFF 业务基类层。提供 Controller / Service 基类、curd 装饰器、事务 / 缓存 / 事件装饰器、MyBatis SQL 插件和统一返回结构。

安装引入方式：在 `src/configuration.ts` 的 `@Configuration.imports` 中加入 `import * as core from '@fedx-bff/core'`，之后业务模块下的 controller / service 会被自动扫描注册。

---

## BaseController（控制器基类）

业务 Controller 继承它获得统一返回与 curd 能力。

### success(data, option?)

统一成功返回。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| data | any | 业务数据 |
| option | `{ code, message, messageVisible }` | 可选，覆盖默认 code/message |

返回 `{ code: 200, message: '操作成功', messageVisible, data }`。

```ts
@Get('/dic/:dicType')
async getDic(@Param('dicType') dicType) {
    return this.success(await this.mainService.queryDictList(dicType));
}
```

### fail(code, message, messageVisible?)

失败返回。`code` 取 `ResponseCode` 枚举（200/400/409/500），`message` 为提示文本，`messageVisible` 控制前端是否展示提示。

### curd 方法（add / delete / update / pagination / list / detail）

仅在 `@FedxBffCoreController` 的 `api` 数组中声明对应类型后才会生成为路由，入参走请求体 / 查询串，返回统一结构。无需手写。

### 其余成员

- `curdOption` / `connectionName`：由装饰器配置注入。
- `baseCtx`、`baseApp`：koa 上下文与应用实例。
- `service`：与 controller 配套的 service 实例（由 CurdOption 指定）。
- `before(curdOption)` / `insertParam(curdOption)`：curd 前置钩子，通过 CurdOption 的 `before` / `insertParam` 配置回调，可插入租户、操作人等默认参数。

---

## FedxBffCoreController（控制器装饰器）

声明业务模块 controller，并按需生成 curd 接口。

```ts
@Provide()
@FedxBffCoreController({
    prefix: 'main',   // 路由前缀，最终路径 = 前缀 + 方法路径
    api: [],          // 需要生成的 curd 接口：'add' | 'delete' | 'update' | 'pagination' | 'detail' | 'list'
})
export class MainController extends BaseController { ... }
```

prefix 规则：

- 以 `/` 开头原样使用，否则自动补 `/`（`'main'` → `/main`）
- 纯字符串写法 `@FedxBffCoreController('main')` 等价
- **不传 prefix 时自动生成 `/{moduleName}/{controllerName}`**（按 controller 文件所在目录推导，如 `src/modules/demo/controller/resource.ts` → `/demo/resource`）
- 若 midway `@Configuration` 配置了 `globalPrefix`，最前面统一再叠加一层

### 自动生成 curd 接口（零手写）

在 `api` 数组声明后，框架按固定路径注册路由（`path` 即 api 类型名，detail 为 GET、其余 POST），**一个字都不用写即可得到完整增删改查接口**：

| api 值 | 生成的路由（prefix=`main` 时） | 方法 | 说明 |
| --- | --- | --- | --- |
| add | `POST /main/add` | 新增 | |
| delete | `POST /main/delete` | 删除 | 入参 ids 数组或逗号分隔串 |
| update | `POST /main/update` | 修改 | |
| list | `POST /main/list` | 列表查询 | |
| pagination | `POST /main/pagination` | 分页查询 | 返回 `{ list, pagination: { current, pageSize, total } }` |
| detail | `GET /main/detail` | 单条查询 | 入参 id |

```ts
@Provide()
@FedxBffCoreController({
    prefix: 'resource',
    api: ['add', 'delete', 'update', 'pagination', 'detail'], // 只写这些就有一套 curd 接口
    entity: ResourceEntity,                 // 绑定 entity（必须）
    paginationQueryOption: {                // 可选：定制分页查询
        keyWordLikeFields: ['name'],
        orderBy: { id: 'DESC' },
    },
    insertParam: (data, ctx) => ({ ...data, createBy: ctx?.admin?.username }),
})
export class ResourceController extends BaseController { }
// 上面这个空类即得到 /resource/add、/resource/delete、/resource/update、
// /resource/pagination、/resource/detail 五个接口
```

自定义 handler 与自动生成的 curd 可共存（类里照常写 `@Get/@Post` 方法）。

`CurdOption` 完整配置：

| 字段 | 说明 |
| --- | --- |
| prefix | 路由前缀 |
| api | 生成的 curd 接口类型集合 |
| entity | 绑定的 typeorm entity，或 `{ entityKey, connectionName }` |
| service | 指定配套 service |
| paginationQueryOption / listQueryOption | 分页 / 列表查询配置（见 QueryOption） |
| insertParam | curd 前插入默认参数的回调 |
| before | curd 前置钩子 |
| ignoreDetailProperty | detail 返回时忽略的属性 |

`QueryOption` 常用项：`keyWordLikeFields`（关键字模糊匹配字段）、`where`（附加条件）、`select`（返回字段）、`orderBy`（排序）、`join`（关联 `{ entity, condition, type }`）、`fieldEq` 类字段条件见 `fieldCondition`、`resultCamel`（结果转驼峰）。

第二参数 `routerOptions` 支持 `middleware`、`summary`、`description`、`tagName`（swagger 相关）。

---

## 多数据源（mysql + oracle 等混配）

支持在同一个项目里注册多个数据库连接（不同类型可混用，如 default 走 mysql、oracle 走 oracle、报表走国产库），**所有取数入口都通过可选参数 `connectionName` 区分，不传默认 `'default'`**。

**1. 注册连接**（midway 标准配置，`src/config/config.default.ts`）：

```ts
export default {
    typeorm: {
        dataSource: {
            default: {                       // 默认连接，connectionName 省略时走它
                type: 'mysql',
                host: '<host>', port: 3306,
                username: '<user>', password: '<pwd>',
                database: '<db>',
                synchronize: false,
                entities: ['*/entity/*{.ts,.js}', '*/modules/*/entity/*{.ts,.js}'],
            },
            oracle: {                        // 第二个连接，名字自定义
                type: 'oracle',
                url: '<oracle 连接串>',
                synchronize: false,
                entities: ['*/modules/*/entity/oracle/*{.ts,.js}'], // 建议按连接分目录放 entity
            },
        },
    },
}
```

**2. service 里指定连接**（BaseService 方法第 3/4 参数）：

```ts
@Provide()
export class MixedService extends BaseService {
    async queryFromMysql(zone: string) {
        return await this.myBatisQuery('demoSql', 'queryResource', { zone }); // 默认 default（mysql）
    }

    async queryFromOracle(zone: string) {
        return await this.nativeQuery(
            'select * from T_RES where ZONE = ?',
            [zone],
            'oracle',                        // ← connectionName，走 oracle 连接
        );
    }
}
```

`myBatisQuery / nativeQuery / entityQuery / list / pagination / detail / sqlRenderPage` 均支持 `connectionName` 参数（见下文方法签名表）。

**3. curd 自动接口指定连接**：`entity` 传对象形式：

```ts
@FedxBffCoreController({
    prefix: 'resource',
    api: ['add', 'pagination', 'detail'],
    entity: { entityKey: ResourceEntity, connectionName: 'oracle' },
})
```

**4. 事务指定连接**：`@FedxBffTransaction({ connectionName: 'oracle' })`。

**5. entity 分库注册**：不同连接的 `entities` glob 建议指向不同目录（如 `*/entity/oracle/*`），避免一个 entity 被多个连接重复注册；同一张表在两种库结构不同时，分别建两个 entity 文件，`setModel` 时按需绑定。

---

## BaseService（服务基类）

业务 Service 继承它获得数据库操作能力。

### myBatisQuery(namespace, key, params, connectionName)

执行 MyBatis mapper XML 中的 SQL，最常用的查询入口。

| 参数 | 说明 |
| --- | --- |
| namespace | mapper XML 的 `namespace` 属性 |
| key | `<select id>` |
| params | 传给 SQL 的参数对象，对应 `#{param}` 占位 |
| connectionName | 可选，多数据源时指定连接名 |

```ts
async queryResourceInfo(condition) {
    return await this.myBatisQuery('nocSql', 'queryResourceInfo', condition);
}
```

### nativeQuery(sql, params, connectionName, option)

原生 SQL 查询，结果自动转驼峰。SQL 字符串中用 `?` 占位（typeorm 参数绑定）。

### entityQuery(sql, params, connectionName, option)

按 entity 定义查询并转换结果。

### add(param) / update(param) / addOrUpdate(param, primaryName?)

新增 / 修改 / 按主键判断新增或修改。`param` 为对象或数组；`primaryName` 指定主键字段名。需要先 `setModel(entity)` 或通过 CurdOption 绑定 entity。

### delete(ids)

按 id 删除，`ids` 为数组或逗号分隔字符串，返回 `{ affected, affectedData }`。

### pagination(query, option, connectionName) / sqlRenderPage(find, query, connectionName, option)

分页查询，返回 `{ list, pagination: { current, pageSize, total } }`。`sqlRenderPage` 接收 SelectQueryBuilder。

### list(query, option, connectionName)

非分页列表查询。

### detail(param, ignoreDetailProperty?)

查询单条数据，可指定忽略的返回属性。

### setSql(condition, sql, params)

条件成立时拼接 SQL 片段（构造动态 where 用）。

### setModel(entity) / findEntityOne(condition) / paramSafetyCheck(params) / afterModify(data, type)

绑定 entity；查单条（兼容低版本 Oracle）；参数安全检查；增删改后置钩子（type 为 `'add' | 'update' | 'delete'`）。

---

## FedxBffTransaction（事务装饰器）

方法装饰器，包裹的方法在事务中执行，出错自动回滚。

```ts
@FedxBffTransaction({ isolation: 'READ COMMITTED' })
async doSomething() { ... }
```

`option.connectionName` 指定多数据源连接；`isolation` 可选四种隔离级别。

## Cache（缓存装饰器）

方法装饰器，缓存返回值。

```ts
@Cache({ ttl: 60, key: 'xxx' })
async getData() { ... }
```

`cache` 可指定缓存实例，`ttl` 秒，`key` 缓存键（缺省按方法名 + 参数生成）。

## Event / FedxBffEvent（事件）

`@FedxBffEvent()` 类装饰器标记事件类，`@Event(eventName?)` 方法装饰器注册事件处理器，框架内 `EventManager` 负责分发。

---

## myBatis（SQL 插件）

`BaseService.myBatisManager` 即此实例，一般不直接使用。需要手动执行 mapper 时：

- `createMapper(xmls)`：加载 mapper XML 文件路径数组
- `getSqlFromMapper(namespace, sqlKey, param)`：取渲染后的 SQL
- `fromatSql(xml, sqlKey, param, format?)`：格式化输出 SQL（调试用）

mapper XML 约定：

```xml
<mapper namespace="nocSql">
    <select id="queryXxx">
        select * from T_X where ZONE = #{relationZone}
    </select>
</mapper>
```

- 文件放在 `modules/<biz>/mappers/` 下，任意 `**/*.xml` 自动扫描注册（支持子目录），开发态热加载。
- 顶层语句标签：`<sql>` / `<select>` / `<insert>` / `<update>` / `<delete>`（其余标签忽略）。
- `namespace` 全局唯一（跨模块共享一个注册表），建议 `模块名 + Sql` 风格（如 `nocSql`）。
- **多数据库项目按子目录 + namespace 双标识组织**（目录只是自由约定，框架按 `/**/*.xml` 递归扫描，不看目录名；执行到哪个库由 `myBatisQuery` 的 `connectionName` 决定）：

```
src/modules/demo/mappers/
├── mysql/                      # 约定：default 连接（mysql）
│   └── demoSqlConfig.xml       #   <mapper namespace="demoSql">
└── oracle/                     # 约定：oracle 连接
    └── demoOracleSqlConfig.xml #   <mapper namespace="demoOracleSql">
```

```ts
await this.myBatisQuery('demoSql', 'queryResource', params);               // 走 mysql（default）
await this.myBatisQuery('demoOracleSql', 'queryResource', params, 'oracle'); // 走 oracle 连接
```

### 动态 SQL 标签（全部支持）

| 标签 | 属性 | 行为 |
| --- | --- | --- |
| `<if test="...">` | test | 条件成立输出内容。test 里 `and` / `or` / `==` / `!=` 会转为 JS 的 `&&` / `\|\|` / `===` / `!==` 求值，字段名自动加 `param.` 前缀，如 `objectClasses != null and objectClasses.length > 0` |
| `<choose>` | — | 配合 `<when test="...">`（命中即出）+ `<otherwise>`（兜底），相当于 switch |
| `<where>` | — | 内容非空时输出 `WHERE` 前缀，并自动去掉开头/结尾多余的 `and` / `or` |
| `<set>` | — | 用于 update，内容非空输出 `SET`，自动清理首尾多余逗号 |
| `<trim prefix="" prefixOverrides="">` | prefix / prefixOverrides | where/set 的通用形式，自定义前缀与要剔除的头部关键字 |
| `<foreach collection="list" item="item" open="(" separator="," close=")">` | collection / item / open / separator / close | 遍历数组拼接，`collection` 为 params 里的数组字段名 |
| `<bind name="x" value="表达式"/>` | name / value | 求值表达式存入 param 供后续引用 |
| `<include refid="片段id"/>` | refid | 引用 `<sql id="...">` 定义的片段，可嵌 `<property>` 传参 |

示例（where + if + foreach + sql 片段复用）：

```xml
<sql id="baseColumns">ID, NAME, RELATION_ZONE, OBJECT_CLASS</sql>

<select id="queryResource">
    select <include refid="baseColumns"/> from T_RESOURCE
    <where>
        <if test="relationZone != null">
            and RELATION_ZONE = #{relationZone}
        </if>
        <if test="objectClasses != null and objectClasses.length > 0">
            and OBJECT_CLASS in
            <foreach collection="objectClasses" item="item" open="(" separator="," close=")">
                #{item}
            </foreach>
        </if>
    </where>
</select>
```

增 / 改 / 删示例（insert + set + choose）：

```xml
<insert id="insertResource">
    insert into T_RESOURCE (ID, NAME, RELATION_ZONE)
    values (#{id}, #{name}, #{relationZone})
</insert>

<update id="updateResource">
    update T_RESOURCE
    <set>
        <if test="name != null">NAME = #{name},</if>
        <if test="relationZone != null">RELATION_ZONE = #{relationZone},</if>
    </set>
    where ID = #{id}
</update>

<delete id="deleteByIds">
    delete from T_RESOURCE where ID in
    <foreach collection="ids" item="item" open="(" separator="," close=")">#{item}</foreach>
</delete>

<select id="queryByType">
    select * from T_RESOURCE where 1 = 1
    <choose>
        <when test="type == 'zone'">and RELATION_ZONE = #{value}</when>
        <when test="type == 'class'">and OBJECT_CLASS = #{value}</when>
        <otherwise>and STATUS = 'NORMAL'</otherwise>
    </choose>
</select>
```

service 调用方式相同（insert/update/delete 与 select 都是 `myBatisQuery(namespace, key, params)`，增删改返回受影响行数）。

### 参数占位符（注意：非预编译）

- `#{param}`：渲染时做**引号转义后内联**进 SQL 字符串（对象/数组会 JSON.stringify，null 变 `NULL`）。有基本防注入转义，但**不是数据库层预编译参数绑定**；参数来自外部输入时仍应在 service 层校验（`paramSafetyCheck`）。
- `${param}`：**原样内联、零转义**，仅可用于排序字段名等可信片段，禁止拼接用户输入。
- 占位符渲染后若仍有未转换的 `#{xx}` / `${xx}`（params 缺字段），直接抛错 `Parameter xx is not converted`。

### 其他规则

- 含 `<` `>` `&` 的 SQL 用 `<![CDATA[ ... ]]>` 包裹（解析前会被转义再还原，正常写即可）。
- 渲染失败（标签不合法、namespace/sqlKey 不存在）会在调用时抛错，报错文案含 namespace / SQL ID，据此排查。
- SQL 最终按 `sql-formatter`（plsql 方言）格式化后执行，调试可用 `fromatSql` 打印渲染结果。

---

## 统一返回与常量

`ResponseCode`：SUCCESS=200、BADREQUEST=400、CONFLICT=409、INTERNALSERVERERROR / DATABASEERROR=500。

`ResponseMessage` / `ERRORINFO` 为对应中文文案（操作成功、参数错误、未设置操作实体、查询参数[id]不存在 等）。

## 工具函数

- `transformCamelCase(data)`：对象属性名转驼峰（数据库下划线列名 → 前端字段）
- `replaceAlias(key, aliases, end?)`：按最长匹配替换别名
- `transformResult(data, entities?)`：执行 entity 中的 function 转换结果
