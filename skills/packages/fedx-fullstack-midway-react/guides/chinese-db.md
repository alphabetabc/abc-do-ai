# 国产化服务端适配指南（国产数据库）

适用于 fedx 全栈项目（midway + `@midwayjs/typeorm`）适配国产数据库：达梦 DMDB、OceanBase、GaussDB、人大金仓 KingBase、GBase。核心思路：**全部通过 TypeORM 切换驱动与连接配置完成适配，业务代码（service / mapper XML）不需要大改**。

## 0. 版本兼容性总览

| 数据库 | TypeORM 版本 | 驱动 | midway 适配器 | schema | 备注 |
| --- | --- | --- | --- | --- | --- |
| DMDB（达梦）2.x | `0.4.1`（强制固定） | 内置 dmdb driver | `@midwayjs/typeorm@3.5.3` | 现场库 | 需卸载 `oracledb`，在 ARM 架构打包 |
| DMDB（达梦）3.x | `@newpower/typeorm-dmdb8`（npm alias） | 内置 dmdb driver | `@midwayjs/typeorm@3.5.3` | 现场库 | alias 方式安装 |
| OceanBase | `0.3.10`（锁定） | `mysql2@3.6.5` | `@midwayjs/typeorm@3.5.3` | — | 兼容 MySQL 协议 |
| GaussDB | `0.3.10` | `pg@8.11.3` | `@midwayjs/typeorm@3.5.3` | `nmosdb` | 走 Postgres 协议 |
| KingBase | `0.3.10` | `pg@8.11.3` | `@midwayjs/typeorm@3.5.3` | `public` | 走 Postgres 协议 |
| GBase | `0.3.10` | `pg@8.11.3` | `@midwayjs/typeorm@3.5.3` | `ovddb` | 兼容 PostgreSQL |

TypeORM 基线 `0.3.10`，在 `package.json` resolutions 中强制锁定：

```json
{
    "resolutions": {
        "typeorm": "0.3.10",
        "pg": "8.11.3",
        "mysql2": "3.6.5",
        "@midwayjs/typeorm": "3.5.3",
        "@midwayjs/core": "3.5.1"
    }
}
```

> **勿随意升级**：上述版本需在「本地开发环境 + 打包服务器环境」双环境下验证通过；部分包的高版本要求 `engines.node >= 18`，若打包服务器是 Node.js 16 会直接安装报错或运行异常。

## 1. 适配 DMDB（达梦）

### 1.1 TypeORM 2.x 版本

1. **卸载 `oracledb`**（与 dmdb driver 冲突）：

    ```bash
    yarn remove oracledb
    ```

2. **固定 TypeORM 0.4.1**（dmdb 2.x 仅此版本内置 dmdb driver）：

    ```json
    "resolutions": {
      "typeorm": "0.4.1"
    }
    ```

3. **必须在 ARM 架构的系统上打包**再发包给现场（dmdb 驱动包含平台相关二进制）。

4. **修改现场数据库连接配置**（midway config 的 `orm` 块）：

    ```javascript
    orm: {
      default: {
        type: 'dmdb',
        host: '<现场库地址>',
        port: 5236,
        username: '<用户>',
        password: '<密码>',
        database: '<库名>',
        synchronize: false,
        logging: true,
      },
    }
    ```

5. **现场问题：查询 SQL 的表名被裁剪** → 替换 `node_modules/typeorm/driver/dmdb/DmdbDriver.js` 后重启服务。

6. **现场问题：修改数据报错「试图在事务运行中，改变其属性」** → 修改 `node_modules/typeorm/driver/dmdb/DmdbQueryRunner.js`，将事务 SAVEPOINT 一行替换为：

    ```javascript
    return [4 /*yield*/, this.query('SAVEPOINT typeorm_' + this.transactionDepth)];
    ```

### 1.2 TypeORM 3.x 版本

1. **安装**（npm alias 替换 typeorm）：

    ```bash
    npm install typeorm@npm:@newpower/typeorm-dmdb8
    ```

2. **修改配置**（dmdb 3.x 用 url 连接串形式）：

    ```javascript
    type: 'dmdb',
    url: 'dm://<user>:<pwd>@<host>:5236?loginEncrypt=false',
    synchronize: false,
    logging: true,
    entities: ['*/modules/*/entity/dmdb/*{.ts,.js}']
    ```

3. **复制一份 entity 到 `entity/dmdb/` 目录并修改 schema**（dmdb 单独一套 entity）。

## 2. 适配 OceanBase

OceanBase（MySQL 模式）直接用 MySQL 驱动，只改连接配置：

```bash
pnpm add typeorm@0.3.10 mysql2@3.6.5
```

```javascript
orm: {
  default: {
    type: 'mysql',
    host: '<OB 地址>',
    port: 2883,
    username: '<租户用户名，形如 root@xxx_mysql#xxx>',
    password: '<密码>',
    database: '<库名>',
    synchronize: false,
    logging: true,
  },
}
```

多数据源时在 `orm` 下并列多个 key（default / nrmdb …），结构相同。

## 3. 适配 GaussDB / KingBase / GBase（Postgres 协议族）

三家国产库都兼容 PostgreSQL 协议，统一走 `pg` 驱动，差异只在连接参数与 schema：

```bash
# 本地 pnpm
pnpm add pg@8.11.3
pnpm add -D @types/pg@8.10.2

# 服务器 yarn
yarn add pg@8.11.3
yarn add -D @types/pg@8.10.2
```

**通用步骤**：

1. 安装 pg 驱动（版本锁定 `8.11.3`，resolutions 同步声明）。
2. **增加 Postgres 版本的 entity**：复制一份现有 MySQL / Oracle 的 entity，改字段类型与 schema。
3. 修改连接配置：

```javascript
orm: {
  default: {
    type: 'postgres',
    host: '<库地址>',
    port: 30100,          // GaussDB 示例；KingBase / GBase 以现场为准
    username: '<用户>',
    password: '<密码>',
    database: '<库名>',
    schema: '<schema>',   // GaussDB: nmosdb；KingBase: public；GBase: ovddb（以现场实际为准）
    synchronize: false,
    logging: true,
  },
}
```

三家差异小结：

| 数据库 | schema | entity 处理 |
| --- | --- | --- |
| GaussDB | `nmosdb` | 复制 entity 改字段 |
| KingBase | `public`（默认） | 复制 entity 改字段 |
| GBase | `ovddb` | 复制 entity 改字段；`synchronize` 保持 false |

多库并存时 `@midwayjs/typeorm` 的 dataSource 写法（GBase 示例）：

```javascript
typeorm: {
  dataSource: {
    default: {
      type: 'postgres',
      host: '<地址>',
      port: 15400,
      username: '<用户>',
      password: '<密码>',
      database: '<库名>',
      schema: 'ovddb',
      synchronize: false,
      logging: true,
      entities: ['*/entity/*{.ts,.js}', '*/modules/*/entity/*{.ts,.js}'],
    },
  },
}
```

## 4. 依赖固定策略（双环境一致）

国产化适配最大的坑不是连接配置，而是**依赖版本在本地 / 打包服务器 / CI 三处不一致**。原则：

1. **以 lock 文件为准**：lock 中能找到的包，固定到 `package.json` 精确版本（去掉 `^`）。
2. **lock 中不存在的包**：本地用 pnpm 时在 `.pnpmfile.cjs` 的 `readPackage` 钩子中强制注入版本。
3. **服务器侧强制覆盖**：打包服务器若用 yarn install（不读 `.pnpmfile.cjs`），必须把同样的版本同步到 `package.json` 的 `resolutions`，双保险。

关键约束：**打包服务器可能运行 Node.js 16**（低于部分新包要求的 18），以下几类包必须锁老版本，否则安装即报 `engines.node` 错误：

| 包 | 锁定版本 | 原因 |
| --- | --- | --- |
| `typeorm` | `0.3.10`（DMDB 2.x 用 `0.4.1`） | 国产库适配基线 |
| `pg` / `mysql2` | `8.11.3` / `3.6.5` | 驱动基线 |
| `@midwayjs/typeorm` / `@midwayjs/core` | `3.5.3` / `3.5.1` | midway 组件传递依赖压制 |
| `less` | `3.12.2` | 高版本要求 Node 18+ |
| `cesium` | `1.100.0` | 高版本要求 Node 18+ |

`.pnpmfile.cjs` 注入示例（增量补充，**不要删除已有内容**）：

```js
// 强制 fedx-bff/core 的传递依赖版本
if (pkg.name === '@fedx-bff/core') {
    pkg.dependencies = {
        ...pkg.dependencies,
        '@midwayjs/cache': '3.5.1',
        '@midwayjs/typeorm': '3.5.3',
        '@midwayjs/core': '3.5.1',
    };
}

// socketio 强制使用配套版本的 core
if (pkg.name === '@midwayjs/socketio') {
    pkg.dependencies = {
        ...pkg.dependencies,
        '@midwayjs/core': '3.5.1',
    };
}
```

## 5. 适配操作 checklist

- [ ] 确定目标数据库与协议族（dmdb / mysql / postgres）
- [ ] `package.json` 固定 typeorm + 驱动 + midway 组件精确版本（resolutions）
- [ ] DMDB 2.x：卸载 oracledb、锁 0.4.1、ARM 打包
- [ ] Postgres 协议族：复制 entity 改字段与 schema
- [ ] 修改 midway config 的 orm / typeorm.dataSource 连接配置（host / port / schema 以现场为准）
- [ ] 本地 `pnpm install` 验证 lock 生成
- [ ] 打包服务器 `yarn install --frozen-lockfile` 验证 resolutions 生效（注意服务器 Node 版本）
- [ ] 现场联调：跑通 curd + 复杂 SQL（mapper XML / nativeQuery）
- [ ] DMDB 现场已知问题对照 1.1 的 5、6 条处理
