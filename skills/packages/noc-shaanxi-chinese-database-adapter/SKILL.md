---
name: 'noc-shaanxi-chinese-database-adapter'
description: '帮助Node.js项目适配国产数据库（达梦DMDB、OceanBase、GaussDB、人大金仓KingBase、GBase）。Invoke when用户需要在Node.js项目中适配国产数据库时。同时包含 oss-noc-shaanxi 项目特有的 midway / fedx-bff 依赖固定策略。'
---

# 国产数据库适配指南（noc-shaanxi 定制版）

本Skill用于帮助Node.js项目快速适配多种国产数据库，包括DMDB（达梦）、OceanBase、GaussDB、KingBase（人大金仓）和GBase。同时针对 oss-noc-shaanxi 项目特有的依赖（midway、fedx-bff）提供版本固定策略。

> **文档版本**：v1.1.0  
> **适用框架**：`@midwayjs/*@3.5.x` + `@fedx-bff/*@0.5.x`  
> **目标 Node.js**：Jenkins 服务器 **Node.js 16.x**（yarn 1.22）/ 本地开发 **Node.js 18+**（pnpm 8+）  
> **TypeORM 基线**：`0.3.10`（已在 `package.json` resolutions 中强制锁定）

---

## 0. 版本兼容性总览

| 数据库               | TypeORM 版本                           | 驱动               | 驱动版本  | midway 适配器             | schema   | 备注                                              |
| -------------------- | -------------------------------------- | ------------------ | --------- | ------------------------- | -------- | ------------------------------------------------- |
| DMDB（达梦）2.x      | `0.4.1`（强制固定）                    | 内置 `dmdb` driver | 内置      | `@midwayjs/typeorm@3.5.3` | 现场库   | 需卸载 `oracledb`，在 ARM 打包                    |
| DMDB（达梦）3.x      | `@newpower/typeorm-dmdb8`（npm alias） | 内置 `dmdb` driver | 内置      | `@midwayjs/typeorm@3.5.3` | 现场库   | `npm install typeorm@npm:@newpower/typeorm-dmdb8` |
| OceanBase            | `0.3.10`（resolutions 锁定）           | `mysql2`           | `^3.6.5`  | `@midwayjs/typeorm@3.5.3` | —        | 兼容 MySQL 协议                                   |
| GaussDB              | `0.3.10`                               | `pg`               | `^8.11.3` | `@midwayjs/typeorm@3.5.3` | `nmosdb` | 走 Postgres 协议                                  |
| KingBase（人大金仓） | `0.3.10`                               | `pg`               | `^8.11.3` | `@midwayjs/typeorm@3.5.3` | —        | 走 Postgres 协议                                  |
| GBase                | `0.3.10`                               | `pg`               | `^8.11.3` | `@midwayjs/typeorm@3.5.3` | `ovddb`  | 兼容 PostgreSQL                                   |

### 0.1 关键版本固定（package.json resolutions 增量）

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

> **勿随意升级**：上述版本已在 Node.js 16 + yarn 1.22 + pnpm 8 双环境下验证通过；高版本可能触发 `engines.node >= 18` 报错。

### 0.2 Node.js 版本兼容矩阵

| 包                                   | Node.js 16.x（Jenkins） | Node.js 18.x | Node.js 20.x     |
| ------------------------------------ | ----------------------- | ------------ | ---------------- |
| `typeorm@0.3.10`                     | ✅                      | ✅           | ✅               |
| `typeorm@0.4.1`（DMDB 专用）         | ✅                      | ✅           | ⚠️ 部分 API 变更 |
| `pg@8.11.3`                          | ✅                      | ✅           | ✅               |
| `mysql2@3.6.5`                       | ✅                      | ✅           | ✅               |
| `@newpower/typeorm-dmdb8`            | ✅                      | ✅           | ✅               |
| `less@3.12.2`（resolutions 强制）    | ✅                      | ⚠️           | ❌               |
| `cesium@1.100.0`（resolutions 强制） | ✅                      | ⚠️           | ❌               |

---

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

6. **如现场遇到修改时提示报错 "试图在事务运行中，改变其属性"**，修改以下内容并重启服务：
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

> **版本要求**：TypeORM `0.3.10` + `mysql2@^3.6.5`（已在 resolutions 中固定到 `3.6.5`）。  
> **适用版本**：OceanBase 3.x / 4.x（MySQL 模式）。

直接使用 MySQL 驱动，修改配置即可：

```javascript
orm: {
  default: {
    type: 'mysql',
    host: '10.10.5.68',
    port: 2883,
    username: 'root@tyytx_mysql#metadb421',
    password: 'ppPP11__',
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

### 2.1 安装命令

```bash
# 本地 pnpm
pnpm add typeorm@0.3.10 mysql2@3.6.5

# 服务器 yarn
yarn add typeorm@0.3.10 mysql2@3.6.5
```

### 2.2 package.json 依赖片段

```json
{
    "dependencies": {
        "typeorm": "0.3.10",
        "mysql2": "3.6.5"
    },
    "resolutions": {
        "mysql2": "3.6.5"
    }
}
```

---

## 3. 适配 GaussDB

> **版本要求**：TypeORM `0.3.10` + `pg@^8.11.3` + `@types/pg@^8.10.2`（已在 resolutions 中固定到 `pg@8.11.3`）。  
> **适用版本**：GaussDB (DWS / OLTP) 主库版本，与 PostgreSQL 9.6/12 协议兼容。  
> **schema**：`nmosdb`。

Node.js 适配 GaussDB，需要使用 Postgres 驱动，所以直接使用 TypeORM 并使用 Postgres 驱动进行数据库连接。

1. **安装 pg 驱动**：

    ```bash
    # 本地 pnpm
    pnpm add pg@8.11.3
    pnpm add -D @types/pg@8.10.2

    # 服务器 yarn
    yarn add pg@8.11.3
    yarn add -D @types/pg@8.10.2
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
        password: 'Gzzxuser_135',
        database: 'gzzxdb',
        schema: 'nmosdb',
        synchronize: false,
        logging: true,
      },
    }
    ```

### 3.1 package.json 依赖片段

```json
{
    "dependencies": {
        "typeorm": "0.3.10",
        "pg": "8.11.3"
    },
    "devDependencies": {
        "@types/pg": "8.10.2"
    },
    "resolutions": {
        "pg": "8.11.3"
    }
}
```

---

## 4. 适配 KingBase（人大金仓）

> **版本要求**：TypeORM `0.3.10` + `pg@^8.11.3` + `@types/pg@^8.10.2`（已在 resolutions 中固定到 `pg@8.11.3`）。  
> **适用版本**：KingBaseES V8R3 / V8R6（PostgreSQL 兼容模式）。  
> **schema**：默认 `public`。

Node.js 适配 KingBase，需要使用 Postgres 驱动，所以直接使用 TypeORM 并使用 Postgres 驱动进行数据库连接。

1. **安装 pg 驱动**：

    ```bash
    # 本地 pnpm
    pnpm add pg@8.11.3
    pnpm add -D @types/pg@8.10.2

    # 服务器 yarn
    yarn add pg@8.11.3
    yarn add -D @types/pg@8.10.2
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
        password: 'Gzzxuser_135',
        database: 'gzzxdb',
        synchronize: false,
        logging: true,
      },
    }
    ```

### 4.1 package.json 依赖片段

```json
{
    "dependencies": {
        "typeorm": "0.3.10",
        "pg": "8.11.3"
    },
    "devDependencies": {
        "@types/pg": "8.10.2"
    },
    "resolutions": {
        "pg": "8.11.3"
    }
}
```

---

## 5. 适配 GBase

> **版本要求**：TypeORM `0.3.10` + `pg@^8.11.3` + `@types/pg@^8.10.2`（已在 resolutions 中固定到 `pg@8.11.3`）。  
> **适用版本**：GBase 8s / GBase 8a（PostgreSQL 兼容协议）。  
> **schema**：`ovddb`。

公司 GBase 兼容 PostgreSQL 数据，所以直接使用 TypeORM 并使用 Postgres 驱动进行数据库连接。

1. **安装 pg 驱动**：

    ```bash
    # 本地 pnpm
    pnpm add pg@8.11.3
    pnpm add -D @types/pg@8.10.2

    # 服务器 yarn
    yarn add pg@8.11.3
    yarn add -D @types/pg@8.10.2
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
        password: 'fmdb_321',
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
          password: 'fmdb_321',
          database: 'fmdb_db',
          schema: 'ovddb',
          synchronize: false,
          logging: true,
          entities: ['*/entity/*{.ts,.js}', '*/modules/*/entity/*{.ts,.js}'],
        },
      },
    }
    ```

### 5.1 package.json 依赖片段

```json
{
    "dependencies": {
        "typeorm": "0.3.10",
        "pg": "8.11.3"
    },
    "devDependencies": {
        "@types/pg": "8.10.2"
    },
    "resolutions": {
        "pg": "8.11.3"
    }
}
```

---

## 6. oss-noc-shaanxi 项目依赖固定策略

> 适用项目：基于 `@midwayjs` 框架 + `@fedx-bff*` SSR 工具链的 oss-noc-shaanxi 及同类项目。
> 目标：保证本地 / 服务器 / 持续集成环境下依赖版本一致，避免传递依赖自动升级导致运行时错误。
>
> **关键环境约束**：Jenkins 打包服务器运行 **Node.js 16**（非 18+），使用 **yarn install** 装包；本地开发用 pnpm。所有 resolutions / .pnpmfile.cjs 的版本号必须同时满足「本地 pnpm + 服务器 Node.js 16 yarn」双环境兼容。

### 6.1 固定原则

1. **以 `yarn.lock` 为准**：能直接在 lock 中找到的包，固定到 `package.json` 的精确版本（去掉 `^`）。
2. **lock 中不存在的包**：在 `.pnpmfile.cjs` 中通过 `readPackage` 钩子强制注入。
3. **服务器侧强制覆盖**：把 `.pnpmfile.cjs` 中强制注入的版本同步到 `package.json` 的 `resolutions` 块，确保服务器（仅用 yarn 而不读 `.pnpmfile.cjs`）也能锁定。

### 6.2 package.json 固定版本（midway 系列，按 yarn.lock）

```json
{
    "dependencies": {
        "@midwayjs/axios": "3.5.1",
        "@midwayjs/bootstrap": "3.5.1",
        "@midwayjs/core": "3.5.1",
        "@midwayjs/decorator": "3.4.11",
        "@midwayjs/http-proxy": "3.5.3",
        "@midwayjs/info": "3.5.2",
        "@midwayjs/koa": "3.5.1",
        "@midwayjs/logger": "2.17.0",
        "@midwayjs/socketio": "3.5.3",
        "@midwayjs/task": "3.5.1",
        "@midwayjs/typeorm": "3.5.3",
        "@midwayjs/upload": "3.5.2",
        "@midwayjs/validate": "3.5.2"
    },
    "devDependencies": {
        "@midwayjs/mock": "3.5.1"
    }
}
```

> 说明：`@midwayjs/socketio` / `@midwayjs/http-proxy` / `@midwayjs/typeorm` 在 `yarn.lock` 中没有，但 pnpm 安装解析为 `3.5.3`，故固定 `3.5.3`。
> `@midwayjs/logger` 保留 `2.17.0`（与 3.x 不兼容，避免 runtime 报错）。

### 6.3 package.json resolutions（服务器侧强制覆盖）

> 服务器（Jenkins）**打包时统一使用 yarn install**，且**运行环境为 Node.js 16**。由于 yarn install 不读取 `.pnpmfile.cjs`，所以必须在 `resolutions` 中再次声明，与 `.pnpmfile.cjs` 保持一致，确保服务器侧依赖版本也被锁定。
>
> 其中 `less: 3.12.2` / `node-releases: 1.1.77` / `cesium: 1.100.0` 三项是**专门为 Node.js 16 锁定的**：这些包的高版本要求 `engines.node >= 18`（或更高），在 Node.js 16 环境下安装会报错或运行异常，因此必须在 resolutions 中固定到兼容版本。

```json
{
    "resolutions": {
        "antd": "5.22.5",
        "typeorm": "0.3.10",
        "@midwayjs/session": "3.5.1",
        "@midwayjs/i18n": "3.5.2",
        "@midwayjs/cache": "3.5.1",
        "@midwayjs/typeorm": "3.5.3",
        "@midwayjs/core": "3.5.1",
        "@midwayjs/async-hooks-context-manager": "3.5.1",
        "@babel/plugin-proposal-private-property-in-object": "7.20.5",
        "@fedx-bff-web/ssr-core": "0.5.5",
        "@fedx-bff-web/ssr-utils": "0.5.5",
        "@fedx-bff/core": "0.2.3",
        "@fedx-bff-web/plugin-ssr-midway": "0.5.5",
        "@fedx-bff-web/plugin-ssr-react": "0.5.11",
        "@fedx-bff-web/ssr-types": "0.5.3",
        "fedx-ssr": "0.5.0",
        "less": "3.12.2",
        "node-releases": "1.1.77",
        "cesium": "1.100.0"
    }
}
```

### 6.4 .pnpmfile.cjs 增量补充（本地 pnpm 强制注入）

> 仅对 `yarn.lock` 中找不到的依赖、或传递依赖中需要降级的包生效。**不要删除**文件中已有的内容，按需在对应 `if` 块中新增。

#### 6.4.1 根包（oss-noc-shaanxi 自身）

```js
if (pkg.name === 'oss-noc-shaanxi') {
    pkg.dependencies = {
        ...pkg.dependencies,
        antd: '5.8.4',
        '@babel/plugin-proposal-private-property-in-object': '7.20.5',
        'react-router-dom': '5.2.0',
        '@midwayjs/session': '3.5.1',
        '@midwayjs/i18n': '3.5.2',
        '@fedx-bff-web/ssr-core': '0.5.5',
        '@fedx-bff-web/ssr-utils': '0.5.5',
        '@fedx-bff/core': '0.2.3',
    };

    pkg.devDependencies = {
        ...pkg.devDependencies,
        '@fedx-bff-web/plugin-ssr-midway': '0.5.5',
        '@fedx-bff-web/plugin-ssr-react': '0.5.11',
        '@fedx-bff-web/ssr-types': '0.5.3',
        'fedx-ssr': '0.5.0',
    };
}
```

#### 6.4.2 传递依赖降级

```js
// mock 强制使用 3.5.1 版本的 async-hooks
if (pkg.name === '@midwayjs/mock') {
    pkg.devDependencies = {
        ...pkg.devDependencies,
        '@midwayjs/async-hooks-context-manager': '3.5.1',
    };
}

// socketio 强制使用 3.5.1 版本的 core
if (pkg.name === '@midwayjs/socketio') {
    pkg.dependencies = {
        ...pkg.dependencies,
        '@midwayjs/core': '3.5.1',
    };
}

// fedx-bff/core 传递依赖固定
if (pkg.name === '@fedx-bff/core') {
    pkg.dependencies = {
        ...pkg.dependencies,
        '@midwayjs/cache': '3.5.1',
        '@midwayjs/typeorm': '3.5.3',
        '@midwayjs/core': '3.5.1',
    };
}

// koa 强制使用 3.5.1 版本的 session
if (pkg.name === '@midwayjs/koa') {
    pkg.dependencies = {
        ...pkg.dependencies,
        '@midwayjs/session': '3.5.1',
    };
}

// validate 强制使用 3.5.2 版本的 i18n
if (pkg.name === '@midwayjs/validate') {
    pkg.dependencies = {
        ...pkg.dependencies,
        '@midwayjs/i18n': '3.5.2',
    };
}
```

### 6.5 pnpm-lock.yaml 中需降级的高版本依赖（参考表）

> pnpm 自动解析的传递依赖可能升级到 3.20.x / 2.1.x / 4.2.x 等高于 3.5.1 的版本，必须通过上述 `.pnpmfile.cjs` + `resolutions` 双重压制。

| 包名                                    | pnpm 解析版本 | 应降级到         | 说明                          |
| --------------------------------------- | ------------- | ---------------- | ----------------------------- |
| `@midwayjs/async-hooks-context-manager` | 3.20.24       | 3.5.1            | mock 的传递依赖               |
| `@midwayjs/core`                        | 3.20.24       | 3.5.1            | socketio / fedx-bff/core 传递 |
| `@midwayjs/cli`                         | 2.1.1         | 1.3.13           | cli 工具链，仅本地用          |
| `@midwayjs/cli-plugin-*`                | 2.1.0         | 1.3.13           | cli 子插件                    |
| `@midwayjs/command-core`                | 2.1.0         | 1.3.13           | cli 基础                      |
| `@midwayjs/serverless-spec-builder`     | 2.1.0         | 1.3.13           | cli 基础                      |
| `@midwayjs/cookies`                     | 1.3.0         | 1.0.4            | session 传递                  |
| `@midwayjs/glob`                        | 1.1.1         | 1.0.6            | core 传递                     |
| `@midwayjs/version`                     | 4.2.1         | （yarn.lock 无） | 仅传递，按 4.2.1 保留         |

### 6.6 操作 checklist

- [ ] 同步 `package.json` 的 `dependencies` / `devDependencies` 精确版本（6.2）
- [ ] 同步 `package.json` 的 `resolutions`（6.3）
- [ ] 增量补充 `.pnpmfile.cjs`（6.4，**不要删除已有内容**）
- [ ] 本地执行 `pnpm install` 验证 lock 生成
- [ ] 服务器执行 `yarn install --frozen-lockfile` 验证 resolutions 生效（**Node.js 16 环境**）
- [ ] CI / 镜像站执行 `pnpm install` 验证 `.pnpmfile.cjs` 生效
