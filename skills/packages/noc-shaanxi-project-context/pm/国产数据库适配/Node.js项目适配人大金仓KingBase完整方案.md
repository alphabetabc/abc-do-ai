# Node.js 项目适配人大金仓 KingBase 完整方案

> **实施状态：已完成**

## 项目技术栈分析

本项目实际使用的技术栈（已针对本项目代码扫描确认）：
- **框架**: MidwayJS 3.13.x
- **ORM**: TypeORM 0.3.17（作为底层驱动框架）
- **当前数据库**: MySQL（通过 MyBatis XML 配置执行原生 SQL）
- **数据库操作方式**: @fedx-bff/core 提供的 BaseService + myBatisQuery 原生 SQL 执行
- **Node.js 版本**: 需支持 PostgreSQL 驱动

---

## 一、人大金仓数据库特性说明

人大金仓（KingBase）是国产自主可控的关系型数据库，高度兼容 PostgreSQL 协议，因此 Node.js 项目可直接通过 PostgreSQL 驱动进行连接适配。

---

## 二、适配步骤

### 1. 安装依赖

在项目根目录执行以下命令，安装 PostgreSQL 驱动 `pg`：

```bash
yarn add pg
```

如果需要支持连接池等高级功能，建议同时安装 `pg-native`（可选）：
```bash
yarn add pg pg-native
```

### 2. 本项目特性说明

经代码扫描确认，本项目**完全没有使用 TypeORM Entity 层**！所有数据库操作均通过以下方式执行：
- 继承 `@fedx-bff/core` 的 `BaseService`
- 使用 `this.myBatisQuery()` 方法执行原生 SQL
- SQL 语句全部定义在 `src/modules/noc/mappers/nocSqlConfig.xml` 中

因此无需创建任何 entity 文件，直接跳到下一步修改数据库连接配置即可。

### 3. 修改 MidwayJS 数据库连接配置

在 `src/config/config.{env}.ts` 中添加 KingBase 数据库配置：

```typescript
import { MidwayConfig } from '@midwayjs/core';

export default {
  // ... 其他配置

  typeorm: {
    dataSource: {
      default: {
        type: 'postgres',
        host: '你的人大金仓数据库IP',
        port: 54321, // KingBase 默认端口为 54321
        username: '你的用户名',
        password: '你的密码',
        database: '你的数据库名',
        schema: 'public', // 可自定义 schema
        synchronize: false, // 生产环境务必关闭自动同步
        logging: false, // 根据需要开启 SQL 日志
        entities: [
          '**/modules/*/entity/kingbase/*{.ts,.js}'
        ],
        extra: {
          max: 10, // 连接池最大连接数
          min: 2   // 连接池最小连接数
        }
      }
    }
  }
} as MidwayConfig;
```

### 4. package.json 依赖检查确认

确保 package.json 中已包含以下依赖（执行完 yarn add pg 后自动生成）：

```json
{
  "dependencies": {
    "@midwayjs/typeorm": "^3.13.0",
    "pg": "^8.x.x",
    "typeorm": "^0.3.17"
  }
}
```

---

## 三、本项目 src 目录具体修改清单（必做）

### 3.1 数据库配置文件修改

#### 文件 1: `src/config/config.default.ts`

修改 typeorm 配置块：
```typescript
// 原 MySQL 配置
// type: 'mysql',
// host: '10.10.5.121',
// port: 3306,
// username: 'mysql',
// password: 'mysql#123',
// database: 'shaanxi-noc',

// 修改为 KingBase 配置
typeorm: {
  dataSource: {
    default: {
      type: 'postgres',
      host: '你的人大金仓数据库IP',
      port: 54321, // KingBase 默认端口
      username: '你的用户名',
      password: '你的密码',
      database: '你的数据库名',
      schema: 'public',
      synchronize: false,
      logging: true,
      entities: ['*/entity/*{.ts,.js}', '*/modules/*/entity/*{.ts,.js}'],
      extra: {
        max: 10,
        min: 2,
        client_encoding: 'UTF8'
      }
    }
  }
}
```

#### 文件 2: `src/config/config.prod.ts`

同样修改生产环境配置，保持与 default.ts 一致的 KingBase 配置。

---

### 3.2 MyBatis XML SQL 方言适配

文件路径：`src/modules/noc/mappers/nocSqlConfig.xml`

MySQL → KingBase (PostgreSQL) 函数替换对照表：

| 行号 | MySQL 语法 | KingBase 兼容语法 |
|-----|-----------|------------------|
| 24 | DATE_FORMAT(SYSDATE() ,"%Y-%m-%d") | TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') |
| 32 | DATE_FORMAT(DATE_SUB(SYSDATE(), INTERVAL 1 DAY) ,"%Y-%m-%d") | TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD') |
| 38 | STR_TO_DATE(time, '%H:%i') | TO_TIMESTAMP(time, 'HH24:MI') |
| 120 | DATE_FORMAT(SYSDATE() ,"%Y-%m-%d") | TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') |
| 124 | order by time*1 | order by CAST(time AS INTEGER) |
| 128 | DATE_FORMAT(DATE_SUB(SYSDATE(), INTERVAL 7 DAY) ,"%Y-%m-%d") | TO_CHAR(CURRENT_DATE - INTERVAL '7 days', 'YYYY-MM-DD') |
| 132 | order by time*1 | order by CAST(time AS INTEGER) |
| 136 | DATE_FORMAT(DATE_SUB(SYSDATE(), INTERVAL 1 YEAR) ,"%Y-%m-%d") | TO_CHAR(CURRENT_DATE - INTERVAL '1 year', 'YYYY-MM-DD') |
| 140 | order by time*1 | order by CAST(time AS INTEGER) |

完整适配后的 nocSqlConfig.xml 示例片段：
```xml
<!-- 查询规模-右屏趋势图数据 -->
<select id="queryVolumeQuShiData">
    <![CDATA[ 
         SELECT * from (
                select 1 id , re_cnt value,'当前' name,unit,time  from T_LOCAL_VOLUME_QUSHI_GTADM
                    where scan_start_time = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
                    and NETWORK_TYPE = #{networkType}
                    and type = #{type}
                    and RELATION_ZONE=#{relationZone}
                union all
                select 2 id , re_cnt value,'昨日' name,unit,time  from T_LOCAL_VOLUME_QUSHI_GTADM
                    where scan_start_time = TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD')
                    and NETWORK_TYPE = #{networkType}
                    and type = #{type}
                    and RELATION_ZONE=#{relationZone}
            	) c ORDER BY    
            TO_TIMESTAMP(time, 'HH24:MI')
      ]]>
</select>
```

---

### 3.3 其他 SQL 文件检查

目录下其他 .sql 文件：
- `规模趋势图-FLOW.sql`
- `规模趋势图-TRAFFIC.sql`
- `规模趋势图-USER.sql`
- `质量趋势图数据创建-*.sql`

建议确认 SQL 语法在 KingBase 下兼容，没有 MySQL 特有的函数。

---

## 五、常见问题与解决方案

### 问题 1: 连接 KingBase 时报 "connection refused"
**解决方案**:
- 检查 KingBase 服务是否正常运行
- 确认端口是否开放（默认 54321）
- 检查防火墙规则

### 问题 2: 中文字段乱码
**解决方案**:
- 在数据库连接配置中添加编码设置
```typescript
extra: {
  client_encoding: 'UTF8'
}
```

### 问题 3: SQL 语法不兼容
**解决方案**:
- 避免使用 Oracle 特有的 `SYSDATE`，改用 `CURRENT_TIMESTAMP`
- 避免使用 Oracle 的 `ROWNUM`，改用 PostgreSQL 的 `LIMIT/OFFSET`
- 分页查询示例：
```typescript
// KingBase 分页
const users = await userRepository.find({
  skip: 0,
  take: 10,
  order: { ID: 'DESC' }
});
```

### 问题 4: schema 权限问题
**解决方案**:
- 确认数据库用户对指定 schema 有读写权限
- 可在连接配置中指定 search_path
```typescript
extra: {
  search_path: 'public,ovddb'
}
```

---

## 六、验证连接是否成功

启动项目后，可编写一个简单的测试接口验证数据库连接：

```typescript
import { Controller, Get } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/kingbase/User.entity';

@Controller('/test-db')
export class TestDBController {
  @InjectEntityModel(User)
  userModel: Repository<User>;

  @Get('/connection')
  async testConnection() {
    try {
      const count = await this.userModel.count();
      return {
        success: true,
        message: '人大金仓数据库连接成功',
        userCount: count
      };
    } catch (error) {
      return {
        success: false,
        message: '数据库连接失败',
        error: (error as Error).message
      };
    }
  }
}
```

---

## 七、本项目适配快速总结（核心5步）

你的项目非常轻量，没有复杂的 TypeORM Entity 层，适配人大金仓只需执行以下简单5步：

```bash
# 第1步：安装 PostgreSQL 驱动
yarn add pg
```

1. ✅ 修改 `src/config/config.default.ts` - 将 typeorm 配置改为 postgres
2. ✅ 修改 `src/config/config.prod.ts` - 同步修改生产环境配置
3. ✅ 修改 `src/modules/noc/mappers/nocSqlConfig.xml` - 替换 MySQL 特有函数为 PostgreSQL 兼容写法
4. ✅ 启动项目验证数据库连接
5. ✅ 测试各 API 接口确保 SQL 执行正确

---

## 八、完整清单总结（本项目专用）

✅ 安装 pg 驱动
✅ 修改 config.default.ts 数据库配置
✅ 修改 config.prod.ts 数据库配置
✅ 适配 nocSqlConfig.xml 中的 MySQL 特有函数
✅ 测试数据库连接与各接口可用性
