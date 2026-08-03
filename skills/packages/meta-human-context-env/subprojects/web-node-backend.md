# web/ Node BFF 后台子项目

> 路径：`web/`（仓库根目录下的独立子项目，独立 `package.json`）
> 角色：数字人 UGC 管理后台（React SSR + Midway Koa BFF）+ 数据源/指令/语音方案/数据操作 CRUD + 多数据源执行器 + gRPC TTS 网关
> 技术栈：Midway.js 3.11（Koa + TypeORM）+ React 18 SSR（fedx-bff-web + Three.js）+ pnpm + PM2 cluster
> 与 P1 的关系：**完全独立进程**，与 api/ 后台零代码共享；通过数据库或外部调用间接协作

---

## 1. 解决的业务问题

详见 web/README.md：
- 提供数字人 UGC（User Generated Content）管理界面：数据源管理、数据对象/数据集/数据操作配置、指令模板、语音方案
- 支持多数据源执行：MySQL / Oracle / DMDB（达梦）/ API / Files
- 提供 TTS 服务代理：gRPC xmov TTS + 广东 CosyVoice HTTP TTS
- 提供数字人 SDK Demo 调试页（pages/sdk-demo）

注意 README 中**只字未提与 api/ Python 后台、metahuman-dispatcher 的对接**——这是一个**独立闭环**的运营/配置后台。

---

## 2. 目录结构

```
web/
├── app.js                          # serverless 部署入口（导出 koa app）
├── bootstrap.js                    # 普通部署入口（用 @fedx-bff-web/ssr-utils loadConfig → 端口 3009 → Bootstrap.run()）
├── config.ts                       # SSR 用户配置（fePort: 3009, mode: 'csr'）
├── pm2.config.js                   # PM2 cluster 配置（name: fedx-metahuman-sdk, max_memory_restart: 500M）
├── package.json                    # 依赖清单
├── tsconfig.json / tsconfig.build.json
├── .eslintrc.js / .prettierrc.js
├── src/
│   ├── configuration.ts            # Midway 容器生命周期：注册中间件链 + koa-static
│   ├── controller/
│   │   ├── index.ts                # SSR 页面渲染入口（@fedx-bff-web/ssr-core.render）
│   │   └── api.ts                  # 简单数据接口（/api/index、/api/detail/:id）
│   ├── config/
│   │   └── config.default.ts       # typeorm/axios/upload/cache/staticFile/guangdongTTS/youyanTTS/requestLogger/sqlInjectionProtector
│   ├── aspect/
│   │   └── resultToCamelCase.ts    # 响应结果转驼峰（typeorm 默认下划线 → 前端驼峰）
│   ├── middleware/
│   │   ├── SqlInjectionProtector.ts  # 时间盲注 + 频率限制 + 超时控制
│   │   └── RequestLoggerMiddleware.ts # 操作审计日志上报 aiops.sgcc.com.cn
│   ├── schedule/
│   │   └── keepAlive.ts            # @TaskLocal 每 10 分钟心跳保活数据库连接
│   ├── modules/
│   │   └── doManage/               # 数字人 UGC 核心业务模块（核心模块）
│   │       ├── controller/         # 11 个 controller，挂在 `doManage/v1` 前缀下
│   │       │   ├── CommonResult.ts
│   │       │   ├── dvbCommand.ts   # 数字人指令 CRUD
│   │       │   ├── dvbDataObject.ts
│   │       │   ├── dvbDataObjectTree.ts
│   │       │   ├── dvbDatasetField.ts
│   │       │   ├── dvbDoOperation.ts
│   │       │   ├── dvbTransformFunction.ts
│   │       │   ├── dvbVoiceScheme.ts  # 语音方案（应用/复制/启停）
│   │       │   ├── tawCommDict.ts
│   │       │   ├── tawDataSource.ts    # 数据源 CRUD
│   │       │   └── tts.ts             # gRPC + CosyVoice TTS
│   │       ├── driver/
│   │       │   ├── Driver.ts          # 统一接口
│   │       │   ├── DriverFactory.ts   # 按 DataSourceEnum 选择 driver
│   │       │   ├── DbDriver.ts        # 关系型数据库基类
│   │       │   ├── ApiDriver.ts       # HTTP API 类型数据源
│   │       │   ├── FilesDriver.ts     # 文件型数据源
│   │       │   ├── MysqlDriver.ts
│   │       │   ├── OracleDriver.ts
│   │       │   └── DmdbDriver.ts      # 达梦数据库
│   │       ├── entity/
│   │       │   ├── mysql/             # 8 个实体类
│   │       │   ├── oracle/            # 8 个实体类
│   │       │   └── dmdb/              # 8 个实体类
│   │       ├── enum/                  # DataSourceEnum/operationTypeEnum/commonMsg/groupMsg
│   │       ├── mappers/               # 4 套 MyBatis XML：sqlMapConfig.xml{,_mysql,_oracle,_dmdb}
│   │       └── service/               # 8 个 service（含 ExecuteMybatisSqlService）
│   ├── service/                       # @Provide() 服务（旧版索引）
│   ├── mock/                          # 本地 mock 数据
│   ├── util/
│   │   ├── AES.ts                     # AES 加密
│   │   ├── Sm4Utils.ts                # 国密 SM4 ECB（与 Java Sm4Utils 对齐）
│   │   ├── httpProxy.ts               # 通用 HTTP 反向代理（用于 BFF 转发）
│   │   ├── buildMybatisParam.ts       # MyBatis 风格 SQL 参数构建
│   │   ├── importUtil.ts              # 导入通用工具
│   │   ├── tranformFunction.ts        # 数据转换函数执行
│   │   ├── transactionMethod.ts       # 事务封装
│   │   └── common.ts                  # buildColumns/buildParamObject/excel 读写
│   ├── enum/
│   │   ├── dataSourceEnum.ts          # 重导出 doManage/enum/dataSourceEnum
│   │   └── datasetFieldLabel.ts
│   ├── interface/
│   │   ├── index.ts                   # IApiService / IApiDetailService
│   │   └── detail.ts
│   ├── certs/
│   │   └── CA-certificate.crt         # 用于上游 HTTPS 调用
│   └── typings/                       # TypeScript 类型增强（含 data/page-index/foo 三个 .d.ts）
└── public/
    ├── download/                      # 临时下载区（指令导出 xlsx 等）
    ├── static/
    │   ├── data/                      # commandTemplateList.json / digitalHumanList.json
    │   ├── dify/apiConfig.json
    │   ├── iconfont/iconfont.js
    │   ├── images/                    # asr-management/、screen/ 等 UI 资源
    │   ├── sdk-demo/config.json       # SDK 调试页配置
    │   ├── sdk-dist/                  # 构建产物：meta-human-sdk.js/.css 等
    │   └── vs/                        # Monaco Editor 完整静态资源（编辑器离线版）
    └── xmov/tts/tts.proto             # gRPC proto 定义（被 tts.ts 加载）
└── web/                               # 前端 SSR + 组件源码
    ├── common/                        # api/、constants/、core/、enum/、format.ts、formatReg.ts
    ├── components/                    # auto-loading / data-object-detail / data-transform / form / item-action / layout / modal / monaco-editor / multiple-items / share
    ├── hooks/usePersistActions.ts
    ├── pages/
    │   ├── asr-management/            # ASR 管理页（声纹/训练）
    │   ├── command-management/        # 指令管理
    │   ├── data-source/               # 数据源管理
    │   ├── detail/                    # 详情页（render$id.tsx）
    │   ├── index/                     # 首页
    │   ├── indicator-management/      # 指标管理
    │   ├── scheme-detail/             # 语音方案详情（多步骤 StepBasicInfo/StepContainer/StepDigitalHuman/StepDocument）
    │   ├── scheme-management/         # 语音方案列表
    │   └── sdk-demo/                  # SDK 集成调试页
    ├── services/                      # asr-management/command-management/dify/scheme-management/request
    ├── store/index.ts                 # valtio 状态管理
    └── common.less + global.d.ts
```

---

## 3. 启动与部署

### 3.1 启动入口二选一

| 入口 | 用途 | 文件 |
| --- | --- | --- |
| 普通部署（PM2） | 生产/类生产，多进程 cluster | web/bootstrap.js → `Bootstrap.run()` |
| serverless 部署 | 阿里云/腾讯云 serverless 适配 | web/app.js → 导出 koa app |

web/bootstrap.js#L4-L11 通过 `@fedx-bff-web/ssr-utils` 的 `loadConfig()` 读取 `SERVER_PORT` 环境变量，并注入 koa 端口配置。

web/config.ts 定义前端 fePort = 3009，`mode: 'csr'`（客户端渲染为主）。

### 3.2 PM2 部署

web/pm2.config.js：

```js
{
  name: 'fedx-metahuman-sdk',
  script: 'bootstrap.js',
  exec_mode: 'cluster',
  max_memory_restart: '500M',
  env: { SERVER_PORT: 3009, NODE_ENV: 'production' }
}
```

`npm run prod` = `fedx build && pm2 start pm2.config.js`；`npm run stop` 停止。

### 3.3 端口与运行模式

- 端口：**3009**（HTTP + koa-static），同时承载 API + 前端 SSR/CSR
- 依赖 Node.JS v16.19.1 + pm2 5.2.0（web/README.md#L14-L17）
- Oracle 数据库要求 ≥11G（web/README.md#L17），但配置中实际默认用的是 MySQL（见 4.1）

---

## 4. 核心配置

### 4.1 数据源（typeorm）

web/src/config/config.default.ts#L22-L36：
- **当前激活**：MySQL（`10.12.2.104:3306`，user=`root`，password=`root123`，db=`voice`，synchronize=false，logging=true）
- **注释掉的可选方案**：
  - Oracle（`10.10.5.121:1521`，sid=`ORCL`，user=`voice`，password=`voiceoptr`）
  - DMDB（`dm://ovddb:mysql123@10.10.6.52:5236?loginEncrypt=false`）
- 三个方案的 entities 路径都形如 `*/modules/*/entity/<dbtype>/*{.ts,.js}`，对应 web/src/modules/doManage/entity/ 下三套实体类（mysql/oracle/dmdb 各 8 个）

### 4.2 上传 / 缓存 / 静态

- **upload**（web/src/config/config.default.ts#L62-L71）：mode=`file`，最大 200MB，临时文件 5 分钟自动清理，**无白名单**
- **cache**：内存缓存，max=1000，无 TTL
- **staticFile**：两个目录：`/`（默认 dynamic）+ `/public/download`（download 路由，dir=`public/download`）

### 4.3 TTS 配置（明文硬编码）

web/src/config/config.default.ts#L99-L108：

```ts
guangdongTTS: {
  accessKey: '08f5a439de707890241627e26db613f7',          // 明文
  accessKeySecret: '2312282959b0038b2229d62f312a344d',   // 明文
  url: 'http://188.22.49.82:36007/ai/aiFactoryServer/v1/apis/1/cosyvoice2-0-5B:2.2',
},
youyanTTS: {
  referenceId: '9',
  url: '10.50.7.45:50054',  // 缺协议头！应为 grpc://10.50.7.45:50054
},
```

**安全/可用性隐患**：
- accessKey/secret 明文写在配置文件里（tts.ts:125-127 又有 fallback 重复默认）
- youyanTTS.url 缺 `grpc://` 协议头（tts.ts:63 直接传 `GRPC_TARGET`，gRPC client 可能抛错或默认 insecure）

### 4.4 请求日志（审计）

web/src/config/config.default.ts#L111-L316：
- 上报地址：`https://agent.aiops.sgitg.sgcc.com.cn:15443`
- 服务名：`fedx-metahuman-sdk`
- 默认标题：`数字人UGC`
- 慢请求阈值：1000ms
- 排除路径：`['/health', '/favicon.ico', '/api/index', '/static', '/data-source', '/min-maps', '/scheme-management']`
- **完整 pathMethodOperationMap**：约 50 条手工维护的"路径+HTTP 方法 → 操作类型/模块/标题"映射（用于审计中文描述）
  - 涵盖 dict/datasource/doOperation/transformFunction/datasetField/dataObject/dataObjectTree/voiceScheme/command/tts 等模块
  - 任意新增接口必须手动追加此映射，否则审计日志不会显示中文标题

### 4.5 SQL 注入防护

web/src/config/config.default.ts#L318-L339：
- `enable: true`
- `maxQueryTime: 60000`（60 秒超时）
- `requestRateLimit: 1000`（每分钟每 IP 1000 次）
- `inputValidation: true`
- `alertThreshold: 10`
- 排除路径：`['/health', '/favicon.ico', '/api/index', '/static']`

详见 web/src/middleware/SqlInjectionProtector.ts（详见第 8 节）。

---

## 5. 页面渲染架构（SSR + BFF）

### 5.1 单一渲染入口

web/src/controller/index.ts：
- `@Controller('/')` 挂在根
- 9 个 `@Get` 路径全部走同一个 `handler()`：`/`、`/detail/:id`、`/scheme-management`、`/scheme-detail/:id`、`/data-source`、`/indicator-management`、`/command-management`、`/sdk-demo`、`/asr-management`
- 调用 `@fedx-bff-web/ssr-core` 的 `render(ctx, {stream: true, onError})`：流式 SSR；SSR 异常时降级为 CSR 重渲染并 `ctx.res.end()`

### 5.2 数据源接口

web/src/controller/api.ts：
- `GET /api/index` → `ApiService.index()`
- `GET /api/detail/:id` → `ApiDetailService.index(id)`

仅 2 个**通用**接口；其余所有数据接口都挂在 `doManage/v1/...` 前缀下。

### 5.3 中间件链

web/src/configuration.ts#L41-L53 的 `onReady()`：

```
SqlInjectionProtectorMiddleware     ← 最前
RequestLoggerMiddleware             ← ErrorHandler 之前
koaStatic(build) + koaStatic(public) + koaStatic(build/client)
initialSSRDevProxy(this.app)        ← SSR 开发代理
```

---

## 6. `doManage/v1/*` 业务接口

详见 web/src/config/config.default.ts#L120-L307 的 `pathMethodOperationMap` 与各 controller 文件。共 **11 个 controller**：

| Controller | 主要路由前缀 | 关键操作 |
| --- | --- | --- |
| web/src/modules/doManage/controller/dvbCommand.ts | `/command` | `GET /list`（全量，按 screenPath 过滤）、`POST /list`（分页 + 模糊查询）、`POST /add`、`POST /copy`、`POST /update`、`POST /delete`、`POST /deletes`、`POST /export`（xlsx）、`POST /import`（xlsx） |
| web/src/modules/doManage/controller/dvbVoiceScheme.ts | `/voiceScheme` | `POST /list`、`GET /detail`、`POST /add`、`POST /copy`、`POST /checkName`、`POST /update`、`POST /apply`（启用/停用）、`POST /delete`、`POST /deletes`、`GET /screen/list`、`GET /screenPath` |
| web/src/modules/doManage/controller/dvbDataObject.ts | `/dataObject` | `POST /executeDataOperation`、`POST /queryDetail`、`POST /queryList` |
| web/src/modules/doManage/controller/dvbDataObjectTree.ts | `/dataObjectTree` | `GET /`（查询树）、`POST /`（新增节点）、`GET /queryFvaTree`、`POST /update`、`POST /delete` |
| web/src/modules/doManage/controller/dvbDatasetField.ts | `/datasetField` | `POST /queryList`、`POST /updateList` |
| web/src/modules/doManage/controller/dvbDoOperation.ts | `/doOperation` | `POST /v2/list`、`POST /list`、`POST /list/yis_designer`、`POST /searchOperation`、`POST /remove`、`POST /add`、`POST /update`、`POST /copy`、`POST /api/edit/preview/data`、`POST /sql/edit/preview/data`、`POST /file/edit/preview/data`、`POST /preview/data`、`POST /sql/extract/parameter`、`POST /sql/replace/parameter`、`POST /edit/preview/data`、`POST /executeDataOperation` |
| web/src/modules/doManage/controller/dvbTransformFunction.ts | `/transformFunction` | `POST /excute` |
| web/src/modules/doManage/controller/tawDataSource.ts | `/datasource` | `POST /`、`POST /update`、`POST /delete`、`GET /detail`、`GET /list`、`GET /test`、`POST /edit/test`、`POST /copy`、`POST /files/upload`、`GET /files/list` |
| web/src/modules/doManage/controller/tawCommDict.ts | `/dict` | `GET /` 字典查询 |
| web/src/modules/doManage/controller/tts.ts | `/api/tts`、`/tts/cosyvoice` | gRPC xmov TTS 流式返回 wav；广东 CosyVoice HTTP TTS 返回 base64 wav |
| web/src/modules/doManage/controller/CommonResult.ts | `/commonResult` | 通用返回包装 |

所有 controller 均继承自 `@fedx-bff/core` 的 `BaseController`，通过 `this.success(data, {message, code, messageVisible})` 统一响应。

---

## 7. Driver 工厂：多数据源执行器

web/src/modules/doManage/driver/DriverFactory.ts 按 `DataSourceEnum` 枚举选取 driver 实例：

| 数据源类型 | Driver 实现 | 实现方式 |
| --- | --- | --- |
| `api` | web/src/modules/doManage/driver/ApiDriver.ts | 通过 `HttpService` 调用外部 HTTP API |
| `files` | web/src/modules/doManage/driver/FilesDriver.ts | 读取 `exceljs` 解析 xlsx/csv/json |
| `mysql` | web/src/modules/doManage/driver/MysqlDriver.ts | 动态建 `typeorm.DataSource`（web/src/modules/doManage/driver/MysqlDriver.ts#L30-L77），name 用 `dsTypeKey+dbName+host+port+user+pass` 拼出唯一连接名 |
| `oracle` | web/src/modules/doManage/driver/OracleDriver.ts | 同上，支持 sid/serviceName/connectString 三种 oracleType |
| `dmdb` | web/src/modules/doManage/driver/DmdbDriver.ts | 达梦 |
| `mongodb` | （注释） | 未启用 |

web/src/modules/doManage/driver/Driver.ts 统一接口：`formatDataSource` / `saveOperation` / `executePreview` / `executeLastPreview` / `testConnect`。

业务调用入口在 web/src/modules/doManage/service/dvbDoOperation.ts#L285-L318 的 `executeDataOperation`：从 DB 查 operation → 查 datasource → 用 `DriverFactory.create` 拿到 driver → `driver.executeLastPreview(datasourceId, operation, params)` 执行。

### 7.1 SQL 是 MyBatis 风格 XML 写的

web/src/modules/doManage/mappers/ 下 4 个 XML：

```
sqlMapConfig.xml          # 通用配置入口（choose DB type）
sqlMapConfig.xml_mysql    # MySQL 专用
sqlMapConfig.xml_oracle   # Oracle 专用
sqlMapConfig.xml_dmdb     # 达梦专用
```

由 web/src/modules/doManage/service/executeMybatisSql.ts 解析执行：
- `myBatisQuery('doManage', 'getCommandByCount', options)` 调用 web/src/modules/doManage/service/comandService.ts#L53 等
- 内部实现 `convertMybatisSqlToSql` + `getCountSql` + `getPageSql`（按数据库类型生成分页 SQL）

`buildParamObject` / `buildColumns` / `transformCamelCase` 用于参数构造与字段名转换。

---

## 8. 中间件实现细节

### 8.1 SqlInjectionProtector

web/src/middleware/SqlInjectionProtector.ts（共 295 行）

**只检测时间盲注**（共 5 条正则，web/src/middleware/SqlInjectionProtector.ts#L31-L42）：
1. `sleep/benchmark/delay/waitfor/pg_sleep` 后跟数字
2. `and/or ... if/case/when ... 时间函数`（条件时间盲注）
3. 数学函数构造延迟（`exp/pow/sqrt/log/ln` + 时间函数）
4. 笛卡尔积时间盲注（`cross join/cartesian` + 时间函数）
5. 多层 and/or 嵌套 + 时间函数

**不做**字符串字面量级的注入检测（如 `' OR '1'='1` 经典形态）——只针对时间盲注。

执行流程（web/src/middleware/SqlInjectionProtector.ts#L44-L171）：
1. 配置禁用或路径在排除列表 → 直接 next
2. `checkRateLimit(clientIP)`：内存 Map 按 IP 计数；超过 `requestRateLimit`/分钟 → 429
3. `validateInput(ctx)`：遍历 `ctx.query` 与 `ctx.request.body` 字符串值，正则匹配
4. `Promise.race([next(), timeoutPromise])`：超过 `maxQueryTime`（默认 5s）→ 408
5. 正常完成仅记录慢请求日志（>1s）

**已知风险**：
- `rateLimitCache` 无限增长（web/src/middleware/SqlInjectionProtector.ts#L28），长跑下内存会缓慢膨胀
- 正则匹配只对**字符串值**生效；对嵌套对象/数字字段无防护
- 仅"检测"，不阻断二次查询

### 8.2 RequestLogger

web/src/middleware/RequestLoggerMiddleware.ts：
- 解析 JWT token（web/src/middleware/RequestLoggerMiddleware.ts#L53-L68）拿 `account/user_name/nick_name`
- 按 `pathMethodOperationMap` 查中文标题与操作类型
- 通过 `HttpService` 上报 `https://agent.aiops.sgitg.sgcc.com.cn:15443`
- 用 SM4 加密上报内容（web/src/util/Sm4Utils.ts）：固定 key `"tsU)$%!27Boco!GW"`，ECB 模式，与 Java Sm4Utils 对齐

### 8.3 ErrorHandler

由 Midway/koa 自带；本项目未自定义实现。

---

## 9. 定时任务：KeepAlive

web/src/schedule/keepAlive.ts：

```ts
@TaskLocal(FORMAT.CRONTAB.EVERY_PER_10_MINUTE)
async tryConnectDB() {
  if (this.isOpenKeepAlive) {  // 由 @Config('isOpenKeepAlive') 注入
    for (const connection of getConnectionManager().connections) {
      if (connection.options.type == 'oracle' && connection.isConnected) {
        await connection.query(`SELECT sysdate FROM dual`);
      } else if (connection.options.type == 'mysql' && connection.isConnected) {
        await connection.query(`select now() as currentTime`);
      }
    }
  }
}
```

每 10 分钟发一次心跳查询，防止 MySQL/Oracle 长时间空闲连接被服务端断开。**注**：达梦 DMDB 不在心跳范围。

---

## 10. TTS 能力（gRPC + HTTP 双通道）

web/src/modules/doManage/controller/tts.ts 提供两个 TTS 端点：

### 10.1 gRPC TTS：xmov

web/src/modules/doManage/controller/tts.ts#L58-L114：
- proto 定义 web/public/xmov/tts/tts.proto：`service TTS { rpc inference(Text) returns (stream InferenceResult); ... }`
- 单例 client：`let ttsClient: any = null`，首次调用 `getTtsClient(GRPC_TARGET)` 用 `@grpc/proto-loader.loadSync` 加载 proto 并 new `ttsProto.TTS(target, grpc.credentials.createInsecure())`
- 请求构造：`{text, speaker_id, tts_type: 0 (mltts), is_first: true, is_last: true, ...}`
- 流式接收 `call.on('data')`：把 `data_type=0/AUDIO` 的字节流写入 wav.Writer（channels=1, sampleRate=24000, bitDepth=16）
- 响应头：`Content-Type: audio/wav`、`Transfer-Encoding: chunked`
- 返回值就是 writer 流（Koa 直接 pipe）

**问题**：web/src/modules/doManage/controller/tts.ts#L14 的 client 是**全局单例**——第一次请求失败后 `ttsClient` 保留为 null，**所有后续请求都会再走一遍 loadSync 但 ttsClient 仍是 null**（因为 try/catch 只 log，不重置为可用 client），等于持续失败。

### 10.2 HTTP TTS：广东 CosyVoice

web/src/modules/doManage/controller/tts.ts#L121-L183：
- 调用广东 aiFactory 接口：`http://188.22.49.82:36007/ai/aiFactoryServer/v1/apis/1/cosyvoice2-0-5B:2.2`
- 签名：`HMAC-SHA1`(`accesskey + accessKeySecret + timestamp + params_prefix`)，`params_prefix = params_str.substring(0, 512)`
- headers: `Accesskey / Signtype=SHA1 / Timestamp / Sign / Content-Type=application/json`
- 请求体：`{voice: reference_id||'中文男', model: 'CosyVoice2-0.5B', input: text}`
- 响应取 `audioContent` 字段，base64 解码后以 `audio/wav` 返回

**注意**：签名输入拼接用 `accesskey + accessKeySecret + timestamp + params_prefix` 是非常规做法（通常为 `params_prefix + ...`），且 `params_prefix` 取前 512 字符可能导致长文本签名错误——仅在配置注释下靠 fallback 默认值运行。

---

## 11. 加密工具

- web/src/util/Sm4Utils.ts：国密 SM4 ECB 模式，固定 key `"tsU)$%!27Boco!GW"`（明文硬编码），基于 `sm-crypto` 包；与 Java Sm4Utils 行为对齐
- web/src/util/AES.ts：基于 `crypto-js`

两者主要用于 RequestLogger 上报加密；前端调用时通过相同 key 解密。

---

## 12. HTTP 反向代理（HttpProxy）

web/src/util/httpProxy.ts：
- 通用 BFF 反代工具：注入 `@midwayjs/axios.HttpService`
- 默认 30s 超时；filter 掉 13 个标准头（hsts/x-powered-by/connection/transfer-encoding 等）
- 自动转发请求头/请求体（包含 multipart 文件上传、application/x-www-form-urlencoded、JSON）
- 透传响应头和状态码
- **应用位置**：web/src/modules/doManage/service/dvbDoOperation.ts 与 web/src/modules/doManage/service/dvbDataObject.ts 用于执行"api 类型"数据源时透传外部 HTTP 调用

---

## 13. 已知问题与观察（事实记录）

1. **数据库连接配置不一致**：web/src/config/config.default.ts#L22-L36 当前激活 MySQL，但 web/README.md#L17 与 Oracle 配置示例（line 29-44）都说要部署到 Oracle。**README 与实际配置不匹配**。

2. **明文 accessKey 硬编码**：web/src/config/config.default.ts#L99-L108 把广东 TTS 的 accessKey/secret 与 url 全部明文写在仓库内；web/src/modules/doManage/controller/tts.ts#L125-L127 还有同样的 fallback 默认值。

3. **gRPC TTS 单例失败不可恢复**：web/src/modules/doManage/controller/tts.ts#L14-L34 的 `getTtsClient` 在 try/catch 内赋值，但失败时 `ttsClient` 仍为 null（被 catch 块之前已部分赋值？实际看下：`ttsClient = new ttsProto.TTS(...)` 在 try 内，成功才赋值；失败时仍是 null）。但 `return ttsClient` 会再返回 null，下一次调用又走 loadSync——**只是不断重试初始化，不缓存"失败"状态**，看起来 OK 但每次都重新加载 proto + 建 client，浪费且失败时永远 500。

4. **xmov gRPC target 缺协议头**：web/src/config/config.default.ts#L107 `url: '10.50.7.45:50054'` 缺 `grpc://`；需运行时实测 @grpc/grpc-js 容忍度。

5. **SqlInjectionProtector rate limit 缓存无限增长**：web/src/middleware/SqlInjectionProtector.ts#L28 使用 `Map<string, RateLimitEntry>` 但**未清理过期项**，长跑可能内存膨胀。

6. **审计日志 pathMethodOperationMap 维护成本高**：约 50 条手工条目（web/src/config/config.default.ts#L120-L307），新增接口必须手工追加，**忘记追加则审计日志丢失中文标题**。

7. **TTS controller 类名重复**：web/src/modules/doManage/controller/tts.ts#L38 的类也叫 `DvbCommandAPIController`（应是笔误，复制自 dvbCommand.ts），影响可读性与日志，但不影响运行。

8. **MyBatis XML 中 WHERE 拼接依赖字符串**：通过 `convertMybatisSqlToSql` 把 XML 模板替换为最终 SQL，对 Like 通配符需在 service 中手工 escape（web/src/modules/doManage/service/comandService.ts#L51、web/src/modules/doManage/service/voiceSchemeService.ts#L43），其他地方若忘记 escape 可能被 SQL 注入防护中间件误判或漏判。

9. **upload 临时文件 5 分钟删除 + 无白名单**：可被利用作 DoS 攻击——不停上传 200MB 文件快速填满临时目录。

10. **entity 与 mapper 强耦合 dvbCommand 等命名**：实体名 `DvbCommand`、`DvbVoiceArticle`、`DvbVisualScreen` 等混用 `dvb` 与 `taw` 命名空间，反映该模块经历过多次重构；新接手时容易混淆。

---

## 14. 与其他子项目的关系

| 子项目 | 关系 |
| --- | --- |
| [api-backend-core.md](./api-backend-core.md)（P1） | **无直接调用**。api/ 是 Python Flask 数字人对话运行时；web/ 是 Node UGC 管理后台。两者**不共享进程、不共享数据库**（api/ 用 Chroma+向量库+config.yaml，web/ 用 MySQL/Oracle/DMDB）。 |
| [api-asr.md](./api-asr.md)（P2） | 无关系。 |
| [api-llm-vector.md](./api-llm-vector.md)（P3） | 无关系。 |
| `api/metahuman-admin/`（P4） | web/ 也有 web/web/pages/asr-management/ 页面，但**功能不同**——web/ 的 asr-management 是 UGC 业务页，api/metahuman-admin 的 Streamlit 是 Python 端运维平台，两者不互通。 |
| [dispatcher.md](./dispatcher.md)（P5） | **无直接调用**。web/ 仅在数据库里改 voiceScheme.apply 字段，不主动调用 dispatcher；具体"应用"动作由外部系统（如 api/）触发。 |
| P6（本文件） | — |
| P7（audio-microphone） | 无关。 |
| P8（docker） | docker 编排是否包含 web/ 容器待扫描。 |

**事实上**：web/ 是**纯运营/配置后台**，不参与数字人实时对话；其数据库（voice 库）与 api/ 的实时运行不共享。

---

## 15. 一句话总结

`web/` 是一个**独立于数字人运行时**的 Node Midway Koa BFF + React SSR 管理后台：通过 MyBatis XML 多数据源执行器（MySQL/Oracle/达梦/API/文件）+ SM4 加密审计上报 + gRPC/HTTP 双通道 TTS 代理，承担"数字人 UGC 配置、数据源管理、指令/语音方案 CRUD"等运营职责，与 api/ Python 后台和 metahuman-dispatcher **完全解耦**，仅通过外部数据库或人工触发间接协作。