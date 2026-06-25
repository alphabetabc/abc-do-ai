# noc 模块 Java 重构方案（适配 KingBase V8R2 + 达梦）

> **项目**：oss-noc-shaanxi  
> **目标模块**：`src/modules/noc`（3 个 controller + 3 个 service + 1 个 MyBatis XML + 5 个 DTO）  
> **目标数据库**：KingBaseES V008R020C013PS007（人大金仓 V8R2.0 patch 7）+ 达梦（V7/V8 待确认）  
> **目标运行时**：JDK 1.8.0_211（现场已有，**不升级**）  
> **技术栈**：Spring Boot 2.7.18 + MyBatis 3.5.13 + HikariCP + Maven 3.8+  
> **方案状态**：v1.0，待现场确认  
> **作者**：TRAE（基于 noc-shaanxi-chinese-database-adapter skill + 现场约束）

---

## 0. 背景与决策

### 0.1 为什么走 Java（不是 Node.js）

| 维度 | Node.js (现状) | Java (新方案) |
|---|---|---|
| 现场 JDK | — | **1.8.0_211 已有** |
| 部署稳定性 | ⚠️ 已多次出问题（ARM/native/Node 版本） | ✅ Spring Boot fat jar 国产化现场成熟 |
| 现场招人 | 难 | 容易 |
| SQL 兼容 | 需自写 MyBatis 标签翻译 | ✅ **原 XML 直接复用**，零翻译 |
| 国产化驱动 | TypeORM 需特殊处理 | ✅ JDBC 一等公民 |
| 维护生态 | Node 16 强锁版本 | 通用 J2EE 栈 |

**结论**：用户已确认走 **方案 A：全量 Java 重构**。

### 0.2 业务层 0 改动原则

- URL 不变（前端代码 0 改动）
- 返回结构不变（`{ code, data, message }` 1:1 保持）
- 16 段 SQL 不变（`nocSqlConfig.xml` 1:1 拷到 Java 工程）

### 0.3 现场版本

- ✅ KingBaseES **V008R020C013PS007** = V8R2.0 patch 7
  - PG 9.6 协议兼容
  - JDBC 驱动：`kb8jdbc8_2.jar`（**不是** `kingbase8-8.6.0.jar`）
  - Maven artifact：`cn.com.kingbase:kingbase8:8.2.0`
  - schema 默认：`public`
- ⏳ 达梦版本待现场确认（V7 / V8 / 具体小版本）

---

## 1. 工程结构（Maven）

新建独立工程 `oss-noc-shaanxi-java/`，与原 Node.js 工程平级：

```
oss-noc-shaanxi-java/
├── pom.xml                                      ← Maven 依赖
├── src/main/java/com/phoenix/noc/
│   ├── NocApplication.java                      ← 启动类
│   ├── controller/
│   │   ├── MainController.java                  ← 7 个接口
│   │   ├── QualityController.java               ← 6 个接口
│   │   ├── VolumeController.java                ← 3 个接口
│   │   └── CustomFetchController.java           ← 代发 + mock
│   ├── service/
│   │   ├── MainService.java                     ← 7 个业务方法
│   │   ├── QualityService.java
│   │   └── VolumeService.java
│   ├── mapper/
│   │   └── NocMapper.java                       ← MyBatis 接口
│   ├── dto/                                     ← 5 个 DTO
│   │   ├── QueryResourceDTO.java
│   │   ├── QueryBusinessDTO.java
│   │   ├── QueryBaseDTO.java
│   │   ├── QueryQuShiDTO.java
│   │   ├── QueryTopAppDTO.java
│   │   └── QueryDegradeCellDTO.java
│   ├── config/
│   │   ├── DataSourceConfig.java                ← 多数据源
│   │   ├── WebConfig.java                       ← 路由前缀
│   │   └── Result.java                          ← 统一返回结构
│   └── dialect/
│       ├── SqlDialect.java                      ← 方言接口
│       ├── MySqlDialect.java
│       ├── KingBaseDialect.java                 ← V8R2 专项
│       └── DmdbDialect.java
├── src/main/resources/
│   ├── mapper/
│   │   └── NocMapper.xml                        ← 原 nocSqlConfig.xml 1:1 拷
│   ├── application.yml                          ← 公共配置
│   ├── application-mysql.yml                    ← 保留 MySQL
│   ├── application-kingbase.yml                 ← 人大金仓 V8R2
│   ├── application-dmdb.yml                     ← 达梦
│   ├── logback-spring.xml
│   └── static/mock/                             ← 原 public/static/mock 拷
└── docs/
    ├── 部署手册.md
    └── 方言规则表.md
```

**代码量估算**：
- 3 个 Controller ≈ 300 行
- 3 个 Service ≈ 200 行
- 1 个 Mapper 接口 ≈ 30 行
- 5 个 DTO ≈ 80 行
- 2 个 Config + Result ≈ 100 行
- 4 个 Dialect ≈ 200 行
- 启动类 + 配置 ≈ 50 行
- **合计 ≈ 960 行 Java**

---

## 2. Node.js → Java 翻译映射表

| 现在的 Node.js | 翻译成 Java | 文件 |
|---|---|---|
| `src/modules/noc/controller/main.ts` | `MainController.java` | [main.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/main.ts) |
| `src/modules/noc/controller/quality.ts` | `QualityController.java` | [quality.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/quality.ts) |
| `src/modules/noc/controller/volume.ts` | `VolumeController.java` | [volume.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/volume.ts) |
| `src/modules/noc/controller/custom-fetch.ts` | `CustomFetchController.java` | [custom-fetch.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/custom-fetch.ts) |
| `src/modules/noc/service/main.ts` | `MainService.java` | [main.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/service/main.ts) |
| `src/modules/noc/service/quality.ts` | `QualityService.java` | [quality.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/service/quality.ts) |
| `src/modules/noc/service/volume.ts` | `VolumeService.java` | [volume.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/service/volume.ts) |
| `src/modules/noc/dto/main.ts` | `QueryResourceDTO.java` + `QueryBusinessDTO.java` | [main.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/dto/main.ts) |
| `src/modules/noc/dto/quality.ts` | 3 个 DTO | [quality.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/dto/quality.ts) |
| `src/modules/noc/dto/volume.ts` | 2 个 DTO | [volume.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/dto/volume.ts) |
| `src/modules/noc/mappers/nocSqlConfig.xml` | `NocMapper.xml`（**原样**） | [nocSqlConfig.xml](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/mappers/nocSqlConfig.xml) |
| `src/modules/noc/config.ts` | `application*.yml` | [config.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/config.ts) |
| `src/config/config.default.ts` | `application.yml` | [config.default.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/config/config.default.ts) |
| `public/static/mock/*` | `resources/static/mock/*` | 原样拷 |

---

## 3. 核心代码示例（写给会 Java 的接手人）

### 3.1 NocApplication.java

```java
package com.phoenix.noc;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.phoenix.noc.mapper")
public class NocApplication {
    public static void main(String[] args) {
        SpringApplication.run(NocApplication.class, args);
    }
}
```

### 3.2 MainController.java（翻译自 [main.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/main.ts)）

```java
package com.phoenix.noc.controller;

import com.phoenix.noc.dto.QueryBusinessDTO;
import com.phoenix.noc.dto.QueryResourceDTO;
import com.phoenix.noc.config.Result;
import com.phoenix.noc.service.MainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/main")   // prefix 1:1
public class MainController {

    @Autowired
    private MainService mainService;

    @GetMapping("/dic/{dicType}")
    public Result<List<Map<String, Object>>> getDic(@PathVariable String dicType) {
        return Result.success(mainService.queryDictList(dicType));
    }

    @PostMapping("/resourceInfo")
    public Result<List<Map<String, Object>>> getResourceInfo(@RequestBody QueryResourceDTO param) {
        if (param.getObjectClasses() == null || param.getObjectClasses().isEmpty()) {
            return Result.success(List.of());
        }
        return Result.success(mainService.queryResourceInfo(param));
    }

    @PostMapping("/top")
    public Result<Map<String, Object>> getTopLoadResourceInfo(@RequestBody Map<String, Object> param) {
        return Result.success(mainService.queryTopLoadData(param));
    }

    @PostMapping("/low")
    public Result<Map<String, Object>> getLowLoadResourceInfo(@RequestBody Map<String, Object> param) {
        return Result.success(mainService.queryLowLoadData(param));
    }

    @PostMapping("/businessInfo")
    public Result<List<Map<String, Object>>> getBusinessInfo(@RequestBody QueryBusinessDTO param) {
        return Result.success(mainService.queryBusinessInfo(param));
    }

    @GetMapping("/consensusInfo")
    public Result<List<Map<String, Object>>> getConsensusInfo(@RequestParam Map<String, Object> param) {
        return Result.success(mainService.queryConsensusInfo(param));
    }

    @GetMapping("/personInfo")
    public Result<List<Map<String, Object>>> getEmergencyPersonInfo(@RequestParam Map<String, Object> param) {
        return Result.success(mainService.queryEmergencyPersonInfo(param));
    }
}
```

### 3.3 MainService.java

```java
package com.phoenix.noc.service;

import com.phoenix.noc.mapper.NocMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MainService {

    @Autowired
    private NocMapper nocMapper;

    public List<Map<String, Object>> queryDictList(String dicType) {
        return nocMapper.queryDictList(dicType);
    }

    public List<Map<String, Object>> queryResourceInfo(Object condition) {
        return nocMapper.queryResourceInfo(condition);
    }

    public Map<String, Object> queryTopLoadData(Object condition) {
        List<Map<String, Object>> result = nocMapper.queryTopLoadResourceInfo(condition);
        return (result != null && !result.isEmpty()) ? result.get(0) : null;
    }

    public Map<String, Object> queryLowLoadData(Object condition) {
        List<Map<String, Object>> result = nocMapper.queryLowLoadResourceInfo(condition);
        return (result != null && !result.isEmpty()) ? result.get(0) : null;
    }

    public List<Map<String, Object>> queryBusinessInfo(Object condition) {
        return nocMapper.queryBusinessInfo(condition);
    }

    public List<Map<String, Object>> queryEmergencyPersonInfo(Object condition) {
        return nocMapper.queryEmergencyPersonInfo(condition);
    }

    public List<Map<String, Object>> queryConsensusInfo(Object condition) {
        return nocMapper.queryConsensusInfo(condition);
    }
}
```

### 3.4 NocMapper.java

```java
package com.phoenix.noc.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface NocMapper {
    // 16 个方法，与 NocMapper.xml 中的 <select id="..."> 一一对应

    List<Map<String, Object>> queryDictList(@Param("dicType") String dicType);

    List<Map<String, Object>> queryResourceInfo(@Param("condition") Object condition);

    List<Map<String, Object>> queryTopLoadResourceInfo(@Param("condition") Object condition);

    List<Map<String, Object>> queryLowLoadResourceInfo(@Param("condition") Object condition);

    List<Map<String, Object>> queryBusinessInfo(@Param("condition") Object condition);

    List<Map<String, Object>> queryEmergencyPersonInfo(@Param("condition") Object condition);

    List<Map<String, Object>> queryConsensusInfo(@Param("condition") Object condition);

    List<Map<String, Object>> queryVolumeLeftData(@Param("condition") Object condition);

    List<Map<String, Object>> queryVolumeStatisticsData(@Param("condition") Object condition);

    List<Map<String, Object>> queryVolumeQuShiData(@Param("condition") Object condition);

    List<Map<String, Object>> queryQualityLeftData(@Param("condition") Object condition);

    List<Map<String, Object>> queryQualityQuShiData(@Param("condition") Object condition);

    List<Map<String, Object>> queryQualityTopData(@Param("condition") Object condition);

    List<Map<String, Object>> queryQualityTopAppData(@Param("condition") Object condition);

    List<Map<String, Object>> queryQualityDegradeCellStatisticsData(@Param("condition") Object condition);

    List<Map<String, Object>> queryQualityDegradeCellListData(@Param("condition") Object condition);
}
```

### 3.5 NocMapper.xml（**原样拷** nocSqlConfig.xml）

只改 `namespace`，其余 1:1 保持：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.phoenix.noc.mapper.NocMapper">
    <!-- 这里直接复制 nocSqlConfig.xml 的全部 16 段 <select>，原封不动 -->
    <select id="queryDictList" resultType="java.util.Map">
        Select dict_key,dict_name  from tpd_noc_dict
        where dict_type = #{dicType} order by dict_sort
    </select>
    <!-- ... 其余 15 段同此 ... -->
</mapper>
```

---

## 4. SQL 方言翻译（核心难点）

### 4.1 现状 SQL 的方言点（来自 [nocSqlConfig.xml](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/mappers/nocSqlConfig.xml)）

| # | MySQL 原文 | 出现 SQL | 行数 |
|---|---|---|---|
| 1 | `DATE_FORMAT(SYSDATE(), '%Y-%m-%d')` | queryVolumeQuShiData / queryQualityQuShiData | 5 处 |
| 2 | `SYSDATE()` | 同上 | 4 处 |
| 3 | `DATE_SUB(SYSDATE(), INTERVAL 1 DAY)` | queryVolumeQuShiData | 1 处 |
| 4 | `DATE_SUB(SYSDATE(), INTERVAL 7 DAY)` | queryQualityQuShiData | 1 处 |
| 5 | `DATE_SUB(SYSDATE(), INTERVAL 1 YEAR)` | queryQualityQuShiData | 1 处 |
| 6 | `STR_TO_DATE(time, '%H:%i')` | queryVolumeQuShiData | 1 处 |
| 7 | `time*1` | queryQualityQuShiData | 3 处 |
| 8 | `<![CDATA[...]]>` | 趋势图 SQL | 2 段 |
| 9 | `<if test="objectClasses != null and objectClasses != ''">` | queryResourceInfo | 1 段 |
| 10 | `<foreach collection="objectClasses" item="oc" open="(" close=")" separator=",">` | queryResourceInfo | 1 段 |

### 4.2 翻译规则表

| MySQL 原文 | KingBase V8R2 (PG 9.6 协议) | 达梦 (Oracle 协议) |
|---|---|---|
| `DATE_FORMAT(x, '%Y-%m-%d')` | `TO_CHAR(x, 'YYYY-MM-DD')` | `TO_CHAR(x, 'YYYY-MM-DD')` |
| `SYSDATE()` | `CURRENT_DATE` | `SYSDATE` |
| `DATE_SUB(SYSDATE(), INTERVAL 1 DAY)` | `CURRENT_DATE - INTERVAL '1 day'` | `SYSDATE - 1` |
| `DATE_SUB(SYSDATE(), INTERVAL 7 DAY)` | `CURRENT_DATE - INTERVAL '7 day'` | `SYSDATE - 7` |
| `DATE_SUB(SYSDATE(), INTERVAL 1 YEAR)` | `CURRENT_DATE - INTERVAL '1 year'` | `ADD_MONTHS(SYSDATE, -12)` |
| `STR_TO_DATE(time, '%H:%i')` | `TO_TIMESTAMP(time, 'HH24:MI')` | `TO_DATE(time, 'HH24:MI')` |
| `time*1` | `CAST(time AS INT)` | `TO_NUMBER(time)` |
| `<![CDATA[...]]>` | 原样保留 | 原样保留 |
| `<if>` / `<foreach>` | MyBatis 原生支持 | MyBatis 原生支持 |

### 4.3 实现：MyBatis 拦截器

`DialectInterceptor.java`：

```java
package com.phoenix.noc.dialect;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.reflection.Reflector;

import java.util.Properties;

@Intercepts({
    @Signature(type = Executor.class, method = "query",  args = {MappedStatement.class, Object.class, org.apache.ibatis.session.RowBounds.class, org.apache.ibatis.session.ResultHandler.class}),
    @Signature(type = Executor.class, method = "update", args = {MappedStatement.class, Object.class})
})
public class DialectInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        BoundSql boundSql = ms.getBoundSql(args[1]);
        String original = boundSql.getSql();

        // 按当前 profile 选择方言
        String translated = SqlDialect.current().translate(original);

        // 反射回写（MyBatis 没有 setter，需 Reflector）
        Reflector reflector = new Reflector(BoundSql.class);
        reflector.getSetInvoker("sql").invoke(boundSql, new Object[]{translated});

        return invocation.proceed();
    }

    @Override
    public Object plugin(Object target) { return Plugin.wrap(target, this); }

    @Override
    public void setProperties(Properties properties) {}
}
```

`KingBaseDialect.java`（V8R2 专项）：

```java
package com.phoenix.noc.dialect;

public class KingBaseDialect implements SqlDialect {
    @Override
    public String translate(String sql) {
        return sql
            // DATE_FORMAT(x, '%Y-%m-%d') → TO_CHAR(x, 'YYYY-MM-DD')
            .replaceAll("DATE_FORMAT\\(\\s*(.+?)\\s*,\\s*'%Y-%m-%d'\\s*\\)",
                        "TO_CHAR($1, 'YYYY-MM-DD')")
            // SYSDATE() → CURRENT_DATE
            .replaceAll("SYSDATE\\(\\)", "CURRENT_DATE")
            // DATE_SUB(SYSDATE(), INTERVAL N DAY) → CURRENT_DATE - INTERVAL 'N day'
            .replaceAll("DATE_SUB\\(\\s*SYSDATE\\(\\),\\s*INTERVAL\\s+(\\d+)\\s+DAY\\s*\\)",
                        "CURRENT_DATE - INTERVAL '$1 day'")
            // DATE_SUB(SYSDATE(), INTERVAL 1 YEAR) → CURRENT_DATE - INTERVAL '1 year'
            .replaceAll("DATE_SUB\\(\\s*SYSDATE\\(\\),\\s*INTERVAL\\s+1\\s+YEAR\\s*\\)",
                        "CURRENT_DATE - INTERVAL '1 year'")
            // STR_TO_DATE(x, '%H:%i') → TO_TIMESTAMP(x, 'HH24:MI')
            .replaceAll("STR_TO_DATE\\(\\s*(.+?)\\s*,\\s*'%H:%i'\\s*\\)",
                        "TO_TIMESTAMP($1, 'HH24:MI')")
            // V8R2 专项：time::int → CAST(time AS INT)（V8R2 对 :: 解析不稳）
            .replaceAll("(\\w+)::int", "CAST($1 AS INT)")
            .replaceAll("\\btime\\s*\\*\\s*1\\b", "CAST(time AS INT)");
    }
}
```

`DmdbDialect.java`：

```java
package com.phoenix.noc.dialect;

public class DmdbDialect implements SqlDialect {
    @Override
    public String translate(String sql) {
        return sql
            .replaceAll("DATE_FORMAT\\(\\s*(.+?)\\s*,\\s*'%Y-%m-%d'\\s*\\)",
                        "TO_CHAR($1, 'YYYY-MM-DD')")
            .replaceAll("SYSDATE\\(\\)", "SYSDATE")
            .replaceAll("DATE_SUB\\(\\s*SYSDATE\\(\\),\\s*INTERVAL\\s+1\\s+DAY\\s*\\)",
                        "SYSDATE - 1")
            .replaceAll("DATE_SUB\\(\\s*SYSDATE\\(\\),\\s*INTERVAL\\s+7\\s+DAY\\s*\\)",
                        "SYSDATE - 7")
            .replaceAll("DATE_SUB\\(\\s*SYSDATE\\(\\),\\s*INTERVAL\\s+1\\s+YEAR\\s*\\)",
                        "ADD_MONTHS(SYSDATE, -12)")
            .replaceAll("STR_TO_DATE\\(\\s*(.+?)\\s*,\\s*'%H:%i'\\s*\\)",
                        "TO_DATE($1, 'HH24:MI')")
            .replaceAll("\\btime\\s*\\*\\s*1\\b", "TO_NUMBER(time)");
    }
}
```

---

## 5. 数据库驱动 & 多数据源

### 5.1 pom.xml 关键依赖

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.18</version>
</parent>

<properties>
    <java.version>1.8</java.version>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
</properties>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- 参数校验（替代 @midwayjs/validate） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- MyBatis -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.3.1</version>
    </dependency>

    <!-- MySQL 驱动（保留） -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- 达梦 JDBC（V8） -->
    <dependency>
        <groupId>com.dameng</groupId>
        <artifactId>DmJdbcDriver18</artifactId>
        <version>8.1.3.62</version>
    </dependency>

    <!-- 人大金仓 V8R2 JDBC（注意是 kingbase8 不是 kingbase8-8.6.0） -->
    <dependency>
        <groupId>cn.com.kingbase</groupId>
        <artifactId>kingbase8</artifactId>
        <version>8.2.0</version>
    </dependency>
</dependencies>
```

### 5.2 国产驱动离线安装（DBA 行动项）

```bash
# 1. 从现场拿到 JDBC jar
#    - 达梦：DmJdbcDriver18.jar（V8）/ Dm7JdbcDriver18.jar（V7）
#    - 人大金仓 V8R2：kb8jdbc8_2.jar

# 2. 装到公司 Maven 私服（推荐 Nexus）
mvn deploy:deploy-file \
  -DgroupId=cn.com.kingbase \
  -DartifactId=kingbase8 \
  -Dversion=8.2.0 \
  -Dpackaging=jar \
  -Dfile=./kb8jdbc8_2.jar \
  -Durl=http://nexus.your-company.com/repository/maven-releases/ \
  -DrepositoryId=nexus-releases

# 3. 装到本地 ~/.m2/ 备选
mvn install:install-file \
  -DgroupId=cn.com.kingbase \
  -DartifactId=kingbase8 \
  -Dversion=8.2.0 \
  -Dpackaging=jar \
  -Dfile=./kb8jdbc8_2.jar
```

### 5.3 application-*.yml 三套配置

**application.yml**（公共）：

```yaml
server:
  port: 9902
  servlet:
    context-path: /

spring:
  profiles:
    active: mysql      # 默认 mysql
  application:
    name: oss-noc-shaanxi-java

mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
    default-fetch-size: 1000
```

**application-mysql.yml**（保留原 MySQL）：

```yaml
spring:
  datasource:
    url: jdbc:mysql://10.10.5.121:3306/shaanxi-noc?useUnicode=true&characterEncoding=utf8
    username: mysql
    password: mysql#123
    driver-class-name: com.mysql.cj.jdbc.Driver
```

**application-kingbase.yml**（人大金仓 V8R2）：

```yaml
spring:
  datasource:
    url: jdbc:kingbase8://10.10.6.109:54321/shaanxi_noc
    username: system
    password: ${KB_PASS:KingBase123}
    driver-class-name: com.kingbase8.Driver
    hikari:
      connection-test-query: SELECT 1
      maximum-pool-size: 20
```

> ⚠️ `host:port:database` 待现场确认，**先用占位值**

**application-dmdb.yml**（达梦）：

```yaml
spring:
  datasource:
    url: jdbc:dm://10.10.6.52:5236?schema=shaanxi_noc
    username: SYSDBA
    password: ${DMDB_PASS:Dameng123}
    driver-class-name: dm.jdbc.driver.DmDriver
    hikari:
      connection-test-query: SELECT 1
      maximum-pool-size: 20
```

> ⚠️ `host:port` 待现场确认；达梦版本（V7/V8）待 DBA 确认

### 5.4 SqlDialect 工厂（按 profile 选方言）

```java
package com.phoenix.noc.dialect;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SqlDialectConfig {

    @Value("${spring.profiles.active:mysql}")
    private String activeProfile;

    private static volatile SqlDialect CURRENT;

    public SqlDialect current() {
        if (CURRENT == null) {
            synchronized (SqlDialectConfig.class) {
                if (CURRENT == null) {
                    CURRENT = createDialect(activeProfile);
                }
            }
        }
        return CURRENT;
    }

    private SqlDialect createDialect(String profile) {
        switch (profile) {
            case "kingbase": return new KingBaseDialect();
            case "dmdb":     return new DmdbDialect();
            default:         return new MySqlDialect();
        }
    }
}
```

---

## 6. V8R2 兼容性专项

### 6.1 V8R2 已知差异（已写进方言规则）

| 项 | V8R6 | V8R2 | 处理 |
|---|---|---|---|
| `time::int` | ✅ | ⚠️ 部分场景解析失败 | 已替换为 `CAST(time AS INT)` |
| `INTERVAL '1 day'` | ✅ | ✅（注意空格） | 已规范 |
| `LIMIT/OFFSET` | ✅ | ✅ | 无需处理 |
| `JSON` 函数 | ✅ | ❌ | 现状 SQL 无 JSON 函数，无影响 |
| `RETURNING *` | ✅ | ✅ | 无影响 |
| MyBatis `<foreach>` 长度限制 | 1000 | 1000 | 现场 `objectClasses` 长度 < 100，无影响 |

### 6.2 V8R2 风险

| 风险 | 概率 | 缓解 |
|---|---|---|
| V8R2 已 EOL，无新补丁 | 100% | 长期建议升级到 V8R6（向现场申请） |
| `INTERVAL` 字面量格式严格 | 中 | 已统一为 `'1 day'` 格式 |
| `in_list_limit` 限制 | 低 | 现场列表长度 < 1000 |
| 大字段 `CLOB` 行为差异 | 中 | 在 Service 层用 `String` 接 |

---

## 7. 部署方案

### 7.1 构建

```bash
cd oss-noc-shaanxi-java
mvn clean package -DskipTests
# 产出：target/oss-noc-shaanxi-java.jar  （约 60MB）
```

### 7.2 启动

```bash
# MySQL（本地验证用）
java -jar oss-noc-shaanxi-java.jar --spring.profiles.active=mysql

# 人大金仓
java -jar oss-noc-shaanxi-java.jar \
  --spring.profiles.active=kingbase \
  --spring.datasource.password=现场密码

# 达梦
java -jar oss-noc-shaanxi-java.jar \
  --spring.profiles.active=dmdb \
  --spring.datasource.password=现场密码

# 后台跑
nohup java -jar oss-noc-shaanxi-java.jar \
  --spring.profiles.active=dmdb \
  > /opt/noc/logs/noc.log 2>&1 &
```

### 7.3 与 Node.js 版本共存

| 端口 | 进程 | 用途 |
|---|---|---|
| 9902 | Node.js (旧) | 保留作为兜底 |
| 9903 | Java (新) | 新版本 |

**Nginx 灰度**（一行切流量）：

```nginx
upstream noc_old {
    server 127.0.0.1:9902;
}
upstream noc_new {
    server 127.0.0.1:9903;
}

server {
    location /main/   { proxy_pass http://noc_new; }   # 新版本试跑
    location /quality/ { proxy_pass http://noc_old; }   # 旧版本兜底
    location /volume/  { proxy_pass http://noc_new; }
}
```

---

## 8. 文件清单

### 8.1 新建（22 个文件）

| 序号 | 文件 | 用途 |
|---|---|---|
| 1 | `pom.xml` | Maven 依赖 |
| 2 | `NocApplication.java` | 启动类 |
| 3 | `controller/MainController.java` | 7 个 main 接口 |
| 4 | `controller/QualityController.java` | 6 个 quality 接口 |
| 5 | `controller/VolumeController.java` | 3 个 volume 接口 |
| 6 | `controller/CustomFetchController.java` | 代发 + mock |
| 7 | `service/MainService.java` | 7 个 main 业务方法 |
| 8 | `service/QualityService.java` | 6 个 quality 业务方法 |
| 9 | `service/VolumeService.java` | 3 个 volume 业务方法 |
| 10 | `mapper/NocMapper.java` | MyBatis 接口 |
| 11 | `dto/QueryResourceDTO.java` | 资源查询 DTO |
| 12 | `dto/QueryBusinessDTO.java` | 业务查询 DTO |
| 13 | `dto/QueryBaseDTO.java` | 基础 DTO |
| 14 | `dto/QueryQuShiDTO.java` | 趋势图 DTO |
| 15 | `dto/QueryTopAppDTO.java` | 热门 APP DTO |
| 16 | `dto/QueryDegradeCellDTO.java` | 劣化小区 DTO |
| 17 | `config/DataSourceConfig.java` | 多数据源 Bean |
| 18 | `config/WebConfig.java` | 路由前缀 |
| 19 | `config/Result.java` | 统一返回结构 |
| 20 | `dialect/SqlDialect.java` | 方言接口 |
| 21 | `dialect/MySqlDialect.java` | MySQL 透传 |
| 22 | `dialect/KingBaseDialect.java` | KingBase V8R2 |
| 23 | `dialect/DmdbDialect.java` | 达梦 |
| 24 | `dialect/SqlDialectConfig.java` | 方言工厂 |
| 25 | `dialect/DialectInterceptor.java` | MyBatis 拦截器 |
| 26 | `resources/mapper/NocMapper.xml` | 16 段 SQL（拷自 nocSqlConfig.xml） |
| 27 | `resources/application.yml` | 公共 |
| 28 | `resources/application-mysql.yml` | MySQL |
| 29 | `resources/application-kingbase.yml` | KingBase V8R2 |
| 30 | `resources/application-dmdb.yml` | 达梦 |
| 31 | `resources/logback-spring.xml` | 日志 |
| 32 | `docs/部署手册.md` | 现场部署 |
| 33 | `docs/方言规则表.md` | 方言映射 |

### 8.2 拷自原工程（不动）

- `mappers/nocSqlConfig.xml` → 重命名 `NocMapper.xml`，改 namespace
- `public/static/mock/*` → 拷到 `resources/static/mock/`

### 8.3 原 Node.js 工程（不动）

- `src/pages/`、`src/components/`、其他 `src/modules/*` 全部不动
- 仅 Nginx upstream 切流量

---

## 9. 实施步骤

| 阶段 | 工作日 | 产出 |
|---|---|---|
| **D1-D2：脚手架** | 2 | pom.xml + NocApplication + 3 个 application-*.yml + 空 jar 可启动 |
| **D3-D5：数据层** | 3 | NocMapper.java + NocMapper.xml + 4 个 Dialect + 拦截器；本地 MySQL 跑通 |
| **W2 D1-D3：业务层** | 3 | 3 个 Service + 5 个 DTO + Result |
| **W2 D4-D5：控制层** | 2 | 3 个 Controller + CustomFetch |
| **W3 D1-D2：方言联调** | 2 | KingBase V8R2 + 达梦跑通 16 段 SQL |
| **W3 D3-D5：自测** | 3 | 验证清单全过 |
| **W4：现场试点** | 5 | 灰度切换 → 全面切换 |
| **合计** | **20 个工作日** | |

---

## 10. 验证清单

| 类别 | 用例 | 通过标准 |
|---|---|---|
| 启动 | `--spring.profiles.active=kingbase` | 启动日志无 `Connection refused` |
| 启动 | `--spring.profiles.active=dmdb` | 同上 |
| 简单查 | `GET /main/dic/hotBusinessType` | 返回 `[{dict_key, dict_name}]` |
| foreach | `POST /main/resourceInfo` | `objectClasses=['a','b']` 展开为 `IN ('a','b')` |
| 方言-v | `GET /volume/rightQuShi?relationZone=610&networkType=4G&type=flow` | SQL 日志显示翻译后版本 |
| 方言-q | `GET /quality/leftQuShi?relationZone=610&networkType=4G&type=prb` | 三段 UNION ALL 都跑通 |
| 性能 | 趋势图 P99 | < 800ms（与 Node.js 基线对比） |
| 灰度 | Nginx 按接口切流量 | 切回 Node.js 1 分钟内生效 |

---

## 11. 风险与回滚

| 风险 | 概率 | 缓解 |
|---|---|---|
| 达梦 / KB 驱动版本与现场不匹配 | 中 | 启动日志打印版本；DBA 确认 |
| 数字精度 | 低 | Java 用 `BigDecimal` 接收，无 JS 精度问题 |
| `<if>` / `<foreach>` 行为差异 | 极低 | 沿用原 XML |
| 现场没 Maven 私服 | 中 | `mvn install` 到 `~/.m2/` |
| JDK 1.8.0_211 缺 TLS 补丁 | 低 | 现场不调外网可忽略 |
| Spring Boot 2.7 EOL (2025-11) | 低 | 短期 OK，长期建议 JDK 11/17 |

**回滚**：
- 灰度期：Nginx upstream 切回 Node.js，1 分钟回滚
- 全面切换后：保留 Node.js 版本 1 周

---

## 12. 行动项分工

### 12.1 用户（不懂 Java）要做的

| 步骤 | 行动 | 时机 |
|---|---|---|
| 1 | 确认本方案 v1.0 | **现在** |
| 2 | DBA 找现场要 3 个 JDBC 驱动 jar：<br>① `kb8jdbc8_2.jar`（KB V8R2）<br>② 达梦 jar（V7 或 V8）<br>③ MySQL 驱动（已自带） | 本周 |
| 3 | 提供 DB 连接信息（host/port/user/dbname）：<br>① MySQL（10.10.5.121:3306 已有）<br>② KingBase V8R2<br>③ 达梦 | 本周 |
| 4 | 提供 JDK 1.8 + Maven 3.8 的现场机器 | 下周 |
| 5 | 跑 `mvn package` 构建 jar | W1 D2 |
| 6 | 启动 jar 验证 16 个接口 | W1 D5 |
| 7 | 配合现场 DBA 联调 | W3 |
| 8 | 切 Nginx 灰度 | W4 |

### 12.2 我（TRAE）要做的

| 步骤 | 行动 | 时机 |
|---|---|---|
| 1 | 输出本方案 v1.0 文档 | **已完成** |
| 2 | 生成完整工程（22 个 Java 文件 + 4 个 yml + 1 个 xml） | 用户确认后 1 天 |
| 3 | 输出部署手册 + 方言规则表 | 同步 |
| 4 | 远程协助构建 / 排错 | W1-W4 |

---

## 13. 待确认事项

| # | 项 | 现场回复 |
|---|---|---|
| 1 | KingBase V8R2 连接信息（host/port/user/dbname/schema） | _待填_ |
| 2 | 达梦版本（V7 还是 V8？具体小版本） | _待填_ |
| 3 | 达梦连接信息（host/port/user/dbname） | _待填_ |
| 4 | 是否保留 Node.js 版本 1 个月兜底 | _待填_ |
| 5 | 现场 Maven 私服地址 | _待填_ |
| 6 | Spring Boot 2.7 vs 2.5（更保守） | **建议 2.7.18** |
| 7 | 出 fat jar 还是 war | **建议 fat jar** |
| 8 | 是否需要单元测试 | **建议要**（覆盖方言翻译） |

---

## 14. 参考资料

- 现有 Node.js 实现：
  - [controller/main.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/main.ts)
  - [controller/quality.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/quality.ts)
  - [controller/volume.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/controller/volume.ts)
  - [service/main.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/service/main.ts)
  - [mappers/nocSqlConfig.xml](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/modules/noc/mappers/nocSqlConfig.xml)
  - [config/config.default.ts](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/src/config/config.default.ts)
- Skill：[`.trae/skills/noc-shaanxi-chinese-database-adapter/SKILL.md`](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/.trae/skills/noc-shaanxi-chinese-database-adapter/SKILL.md)
- 现有 API 文档：[backend-api-docs/陕西NOC场景接口文档.md](file:///e:/oss-fe-git/phoenix/oss-noc-shaanxi/backend-api-docs/陕西NOC场景接口文档.md)

---

## 15. 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0 | 2026-06-25 | 初稿，基于 noc-shaanxi-chinese-database-adapter skill + 现场 KingBase V8R2 信息 |
|  |  |  |

---

**下一步**：请确认 §13 的 8 个待填项，TRAE 即可在 1 个工作日内输出完整工程。
