# Node.js 项目适配各种类型数据库

> **实施状态：已完成**

## 1. 适配 DMDB（达梦）

### TypeORM 2.x 版本

1. **卸载项目的 oracledb**：

    ```bash
    yarn remove oracledb
    ```

2. **安装 TypeORM 0.4.1 版本**，必须固定此版本，并在 `package.json` 文件中增加以下内容：

    ```json
    "resolutions": {
      "typeorm": "0.4.1"
    }
    ```

3. **需要在 ARM 架构的系统上打包**，发包给现场。

4. **修改现场集中配置为现场数据库连接**：

    ```javascript
    orm: {
      default: {
        type: 'dmdb',
        host: '10.10.6.52',
        port: 5236,
        username: 'ovddb',
        password: 'mysql123',
        database: 'ovddb',
        synchronize: false,
        logging: true,
      },
    }
    ```

5. **如现场遇到查询 SQL 的表名被裁剪的问题**，则替换下面的 JS 文件，并重启服务：
    - 目录：`node_modules\\typeorm\\driver\\dmdb\\DmdbDriver.js`
    - 文件：`DmdbDriver.js`

6. **如现场遇到修改时提示报错 “试图在事务运行中，改变其属性”**，修改以下内容并重启服务：
    - 修改文件：`\\node_modules\\typeorm\\driver\\dmdb\\DmdbQueryRunner.js`
    - 第 106 行替换为：
        ```javascript
        return [4 /*yield*/, this.query('SAVEPOINT typeorm_' + this.transactionDepth)];
        ```

### TypeORM 3.x 版本

1. **安装**：

    ```bash
    npm install typeorm@npm:@newpower/typeorm-dmdb8
    ```

2. **修改配置**：

    ```javascript
    type: 'dmdb',
    url: 'dm://ovddb:mysql123@10.10.6.52:5236?loginEncrypt=false',
    synchronize: false,
    logging: true,
    entities: ['*/modules/*/entity/dmdb/*{.ts,.js}']
    ```

3. **复制 entity，修改 schema**。

---

## 2. 适配 OceanBase

直接使用 MySQL 驱动，修改配置即可：

```javascript
orm: {
  default: {
    type: 'mysql',
    host: '10.10.5.68',
    port: 2883,
    username: 'root@tyytx_mysql#metadb421',
    password: 'ppPP11__', // NOSONAR
    database: 'ovddb',
    synchronize: false,
    logging: true,
  },
  nrmdb: {
    type: 'mysql',
    host: '10.10.5.68',
    port: 2883,
    username: 'root@tyytx_mysql#metadb421',
    password: 'ppPP11__',
    database: 'ovddb',
    synchronize: false,
    logging: true,
  },
}
```

---

## 3. 适配 GaussDB

Node.js 适配 GaussDB，需要使用 Postgres 驱动，所以直接使用 TypeORM 并使用 Postgres 驱动进行数据库连接。

1. **安装 pg 驱动**：

    ```bash
    yarn add pg
    ```

2. **增加 Postgres 版本的 entity**，复制一份 MySQL 或 Oracle 的，改字段。

3. **修改数据库连接配置**：
    ```javascript
    orm: {
      default: {
        type: 'postgres',
        host: '10.10.6.109',
        port: 30100,
        username: 'gzzxuser',
        password: 'Gzzxuser_135', // NOSONAR
        database: 'gzzxdb',
        schema: 'nmosdb',
        synchronize: false,
        logging: true,
      },
    }
    ```

---

## 4. 适配 KingBase（人大金仓）

Node.js 适配 KingBase，需要使用 Postgres 驱动，所以直接使用 TypeORM 并使用 Postgres 驱动进行数据库连接。

1. **安装 pg 驱动**：

    ```bash
    yarn add pg
    ```

2. **增加 Postgres 版本的 entity**，复制一份 MySQL 或 Oracle 的，改字段。

3. **修改数据库连接配置**：
    ```javascript
    orm: {
      default: {
        type: 'postgres',
        host: '10.10.6.109',
        port: 30100,
        username: 'gzzxuser',
        password: 'Gzzxuser_135', // NOSONAR
        database: 'gzzxdb',
        synchronize: false,
        logging: true,
      },
    }
    ```

---

## 5. 适配 GBase

公司 GBase 兼容 PostgreSQL 数据，所以直接使用 TypeORM 并使用 Postgres 驱动进行数据库连接。

1. **安装 pg 驱动**：

    ```bash
    yarn add pg
    ```

2. **增加 Postgres 版本的 entity**，复制一份 MySQL 或 Oracle 的，改字段。

3. **修改数据库连接配置**：

    ```javascript
    orm: {
      default: {
        type: 'postgres',
        host: '10.10.6.143',
        port: 15400,
        username: 'fmdb',
        password: 'fmdb_321', // NOSONAR
        database: 'fmdb_db',
        synchronize: false,
        logging: true,
        schema: 'ovddb',
      }
    }

    typeorm: {
      dataSource: {
        default: {
          type: 'postgres',
          host: '10.10.6.143',
          port: 15400,
          username: 'fmdb',
          password: 'fmdb_321', // NOSONAR
          database: 'fmdb_db',
          schema: 'ovddb',
          synchronize: false,
          logging: true,
          entities: ['*/entity/*{.ts,.js}', '*/modules/*/entity/*{.ts,.js}'],
        },
      },
    }
    ```
