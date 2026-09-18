# 002 · sqlglot 方言翻译过程文档

> 本文件位于 **私域草稿区** `.trae/skills/oss-mtc-transition-ln-project-context/design-next/`，
> 描述 sqlglot 在 PG → 4 方言（postgres / mysql / oracle / kingbase）翻译过程中的**机制、决策点、能力边界**，
> 不附执行脚本、不含执行输出。
>
> 上下文：[`001-sql-loading-and-dialect-switching.md`](001-sql-loading-and-dialect-switching.md)（同目录上一篇）

---

## 1. 翻译过程的总览

### 1.1 输入与输出的形态

| 项目     | 形态                                                       | 备注                               |
| -------- | ---------------------------------------------------------- | ---------------------------------- |
| 输入     | 一段 SQL 字符串（含 PG 方言函数 / 语法）                   | 可来自 `.sql` 文件或 Python 字面量 |
| 处理过程 | 解析为 AST → 遍历节点 → 映射函数 / 子句 → 重新渲染为字符串 | 单一函数入口 `sqlglot.transpile`   |
| 输出     | 一个或多个目标方言的 SQL 字符串                            | 列表（多数情况取 `[0]`）           |

### 1.2 翻译层的内部阶段

| 阶段          | sqlglot 内部动作                   | 输入 → 输出                                                       |
| ------------- | ---------------------------------- | ----------------------------------------------------------------- |
| ① Lexer       | 把 SQL 字符串切成 token            | `"SELECT NVL(a,b)"` → `[SELECT, NVL, (, a, ,, b, )]`              |
| ② Parser      | 按源方言语法生成 AST               | token → `Select(Nvl(this=ColumnRef(a), expression=ColumnRef(b)))` |
| ③ Transformer | 按目标方言规则映射 / 改写 AST 节点 | AST → AST（节点类型可能换，如 `Nvl → Coalesce`）                  |
| ④ Generator   | 按目标方言重新生成 SQL 字符串      | AST → `"SELECT COALESCE(a, b)"`                                   |

> 翻译过程中**源方言与目标方言的差异只会出现在 ③ Transformer 阶段**——这是 sqlglot 的核心机制。

### 1.3 一个最小翻译链

输入（PG 方言）：

```
NVL(a, b)
```

经过阶段：

| 阶段                            | 结果                                                   |
| ------------------------------- | ------------------------------------------------------ |
| ① Lexer                         | `[NVL, (, a, ,, b, )]`                                 |
| ② Parser                        | `Nvl(this=ColumnRef(a), expression=ColumnRef(b))`      |
| ③ Transformer (`write="mysql"`) | `Coalesce(this=ColumnRef(a), expression=ColumnRef(b))` |
| ④ Generator                     | `"COALESCE(a, b)"`                                     |

`write="postgres"` 时第③步不动作（节点同名）；`write="oracle"` 时同样不动作（NVL 是 Oracle 原生）。

---

## 2. 翻译决策矩阵（基于本项目真实语法元素）

以 [`001-sql-loading-and-dialect-switching.md` §1.3](001-sql-loading-and-dialect-switching.md#L55-L68) 列出的"真实写法"为输入样本，逐元素观察 sqlglot 的决策：

### 2.1 方言函数层

| 写法                | PG   | MySQL                                     | Oracle | Kingbase | 决策归属                                       |
| ------------------- | ---- | ----------------------------------------- | ------ | -------- | ---------------------------------------------- |
| `NVL(a, b)`         | 保留 | → `COALESCE(a, b)`                        | 保留   | 保留     | Transformer 内置映射                           |
| `COALESCE(a, b)`    | 保留 | 保留                                      | 保留   | 保留     | 三方言通用，**不动**                           |
| `a \|\| b`          | 保留 | → `CONCAT(a, b)`                          | 保留   | 保留     | 同上                                           |
| `CAST(x AS DATE)`   | 保留 | 保留                                      | 保留   | 保留     | 同上                                           |
| `NULLIF(a, b)`      | 保留 | 保留                                      | 保留   | 保留     | 同上                                           |
| `TRIM(c)`           | 保留 | 保留                                      | 保留   | 保留     | 同上                                           |
| `TO_DATE(s, fmt)`   | 保留 | → `STR_TO_DATE(s, fmt_mysql)`             | 保留   | 保留     | ⚠️ **日期格式串也要翻**（`fmt_mysql` ≠ `fmt`） |
| `TO_TIMESTAMP(...)` | 保留 | → `STR_TO_DATE(..., '%Y-%m-%d %H:%i:%s')` | 保留   | 保留     | 同上                                           |

### 2.2 子句层

| 写法                                   | PG                   | MySQL                     | Oracle                                   | Kingbase             | 决策归属                               |
| -------------------------------------- | -------------------- | ------------------------- | ---------------------------------------- | -------------------- | -------------------------------------- |
| `LIMIT n OFFSET m`                     | 保留                 | 保留                      | → `OFFSET m ROWS FETCH NEXT n ROWS ONLY` | 保留                 | sqlglot 自动改写                       |
| `OFFSET m ROWS FETCH NEXT n ROWS ONLY` | → `LIMIT n OFFSET m` | → `LIMIT n OFFSET m`      | 保留                                     | → `LIMIT n OFFSET m` | 反向翻译同样支持                       |
| `ORDER BY col DESC`                    | 保留                 | 保留                      | 保留                                     | 保留                 | 三方言通用                             |
| `IN (v1, v2, v3)`                      | 保留                 | 保留                      | 保留                                     | 保留                 | 三方言通用                             |
| `= ANY(%(arr)s::varchar[])`            | 保留                 | ❌ 翻不出来（绑定层语法） | ❌ 同左                                  | 保留                 | ⚠️ **绑定层语法，不在 sqlglot 视线内** |

### 2.3 标识符与限定名层

| 写法                          | PG   | MySQL | Oracle | Kingbase | 决策归属                                          |
| ----------------------------- | ---- | ----- | ------ | -------- | ------------------------------------------------- |
| `dw_basic_lc.letter_screen_6` | 保留 | 保留  | 保留   | 保留     | **sqlglot 不区分 schema 与 db**——按字符串原样输出 |
| `"col with space"`            | 保留 | 保留  | 保留   | 保留     | 三方言通用引号                                    |
| `"schema"."table"`            | 保留 | 保留  | 保留   | 保留     | 同上                                              |

> ⚠️ 重要边界：**sqlglot 把"schema 限定名"看作纯标识符**，不做"PG 的 schema vs MySQL 的 db vs Oracle 的 owner"映射。这一层差异必须由**架构层**处理，不是 sqlglot 职责。

---

## 3. 翻译过程的关键决策点

### 3.1 决策点 ①：源方言识别

sqlglot 通过 `read="postgres"` 参数声明源方言。**默认（不传）按 ANSI SQL 解析**，所以源方言不指定会丢信息。

| 决策       | 推荐值                                 | 不推荐值                                                          |
| ---------- | -------------------------------------- | ----------------------------------------------------------------- |
| 本仓库现状 | `"postgres"`（Kingbase 协议层兼容 PG） | `"kingbase"`（sqlglot 早期版本不支持；22.x 起部分支持但未必稳定） |
| 备选       | `"ansi"`（保守，但丢 PG 专属语法）     | 不传                                                              |

### 3.2 决策点 ②：目标方言选择

sqlglot 通过 `write=<dialect>` 参数声明目标方言。可选：

| dialect      | 含义       | 本项目适配度                                |
| ------------ | ---------- | ------------------------------------------- |
| `"postgres"` | PG 原生    | ⭐⭐⭐⭐⭐ Kingbase 兼容 PG                 |
| `"mysql"`    | MySQL      | ⭐⭐⭐ 翻译覆盖度好，但占位符要单独处理     |
| `"oracle"`   | Oracle     | ⭐⭐⭐⭐ 函数重合度高，差异在分页           |
| `"kingbase"` | Kingbase   | ⭐⭐ sqlglot 内置支持较新，可能需要兜底回落 |
| `"tsql"`     | SQL Server | ❌ 不在本项目目标范围                       |

### 3.3 决策点 ③：占位符与绑定层处理（sqlglot 视线外）

sqlglot **不解析** `%(name)s` / `:name` / `?` 占位符——它们在词法层就被当作"表达式 token"留下，由驱动层继续处理。

这意味着：

| 现象                                   | 后果                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| 占位符字面量随方言变                   | 必须由驱动层 + Python 端参数构造逻辑按方言分叉         |
| `%(arr)s::varchar[]` 这种 PG 数组 cast | sqlglot 原样保留，落到 MySQL / Oracle 上是**语法错误** |
| Oracle `:name` 占位符在 PG 写法下存在  | 翻译器**不会**自动改 `%(name)s → :name`                |

### 3.4 决策点 ④：多 schema 限定名（架构层）

`dw_basic_lc.letter_screen_X` 跨方言含义不同：

| 方言          | 含义           | 处理方案                                          |
| ------------- | -------------- | ------------------------------------------------- |
| PG / Kingbase | schema 隔离    | 原样保留                                          |
| MySQL 早期    | 无 schema 概念 | **架构层决定**（多 db？单 db 多表？应用层拼装？） |
| Oracle        | schema ≈ owner | **架构层决定**                                    |

> sqlglot 不替你做这个决定——它只搬运字符串。

### 3.5 决策点 ⑤：失败 / 不可翻译的回退

| 失败类型                                   | sqlglot 行为             | 推荐回退                                  |
| ------------------------------------------ | ------------------------ | ----------------------------------------- |
| `write="kingbase"` 不支持                  | 抛 `Unsupported dialect` | 改 `write="postgres"`（Kingbase ≈ PG）    |
| 复杂语法树无法解析                         | 抛 `ParseError`          | 改 `read="ansi"` 试一次；失败则放弃该 SQL |
| 翻译结果不可执行（如 Oracle `CONNECT BY`） | 静默通过                 | CI 必须有真实数据库回归测试               |

---

## 4. 翻译过程的 4 个阶段对应的可观测现象

| 阶段          | 如果出问题表现                            | 排查手段                                             |
| ------------- | ----------------------------------------- | ---------------------------------------------------- |
| ① Lexer       | 罕见 token 报错                           | sqlglot 通常直接抛 `TokenError`                      |
| ② Parser      | `ParseError`，整段 SQL 放弃翻译           | `sqlglot.parse_one(sql, read="postgres")` 看是否成功 |
| ③ Transformer | 输出与目标方言不符（如 MySQL 上仍有 NVL） | 显式比对 `write` 各方言输出                          |
| ④ Generator   | 输出字符串语法正确但与预期格式不符        | 用 `pretty=False` 看原始生成                         |

---

## 5. sqlglot 翻译过程的本质总结

### 5.1 一句话

> sqlglot 的翻译 = **"AST 节点类型替换 + 子句级语法树改写"**，**不动绑定层（占位符）、不动标识符限定名（schema / db / owner）、不做架构层决策**。

### 5.2 它在做的事（能解决 70% 方言差异）

- ✅ 方言函数映射（NVL ↔ COALESCE、|| ↔ CONCAT、TO_DATE ↔ STR_TO_DATE）
- ✅ 子句级语法差异（LIMIT/OFFSET ↔ FETCH FIRST）
- ✅ 部分操作符 / 表达式差异（`::cast` → `CAST()`）

### 5.3 它**不**在做的事（剩下 30% 要靠别处）

- ❌ 占位符跨方言翻译（驱动层）
- ❌ PG 数组字面量展开为 IN 列表（应用层）
- ❌ 多 schema 限定名语义映射（架构层）
- ❌ 表 / 列重命名（业务层）

### 5.4 与本项目现实的关系

| 项目现状                    | sqlglot 能否直接接入                                                    | 接入路径                                                                                                |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 当前 Kingbase + PG 兼容模式 | ✅ **已能跑**，无需 sqlglot                                             | 维持现状                                                                                                |
| 未来加 MySQL                | ✅ SQL 文本层 90% 自动翻译；剩 10% 占位符 + schema 要另处理             | sqlglot + Python 端 IN 展开 + schema 预处理                                                             |
| 未来加 Oracle               | ✅ 函数层重合度高，差异集中在分页；占位符要 `:name` 替换                | sqlglot + 驱动层 `:name` 替换                                                                           |
| 4 方言并存                  | ⚠️ 可行但需要"B（sqlglot）+ C（Python 端 IN 展开 + schema 预处理）"组合 | 见 [`001-sql-loading-and-dialect-switching.md` §2.1](001-sql-loading-and-dialect-switching.md#L90-L117) |

---

## 6. 决策要点回顾

1. **翻译入口**：`sqlglot.transpile(sql, read="postgres", write=<target>)` —— 单行函数，覆盖 70% 方言差异。
2. **翻译边界**：占位符、数组字面量、schema 限定名均**不在视线内**，需要 driver + application + architecture 三层各自处理。
3. **Kingbase 兜底**：sqlglot 不支持 `kingbase` 时，回落到 `postgres` 输出是合理默认（协议层兼容）。
4. **可逆性损失**：跨方言翻译是**单向有损**——`PG → MySQL → PG` 通常不会回到原字符串。
5. **CI 验证**：翻译后必须用真实数据库做回归——sqlglot 不保证语义正确，只保证语法正确。

---

## 8. `translate_sql()` 的职能边界（第 2 步核心）

### 8.1 职能定义（一句话）

> `translate_sql()` = **"PG 方言 SQL 字符串 → 目标方言 SQL 字符串"的改写包装**。仅此一件事。

### 8.2 输入与输出

```
输入:  PG 方言的 SQL 字符串（含 %(name)s 占位符）
输出:  目标方言的 SQL 字符串（占位符仍含 %(name)s）
```

### 8.3 最小实现骨架

```python
import sqlglot

def translate_sql(sql: str, target_dialect: str = "postgres") -> str:
    """
    sql:             来自 .sql 文件的 SQL 字符串（PG 方言）
    target_dialect:  "postgres" / "mysql" / "oracle" / "kingbase"
    return:          翻译后的 SQL 字符串（占位符保留）
    """
    if target_dialect == "kingbase":
        target_dialect = "postgres"  # Kingbase 协议层兼容 PG

    return sqlglot.transpile(
        sql,
        read="postgres",
        write=target_dialect,
    )[0]
```

核心就是**一行 `sqlglot.transpile()`**。其他都是工程化包装（异常处理、日志、占位符保护等）。

#### 8.3.1 但 `translate_sql()` 单独不够 —— 完整执行链路是 5 步

§8.3 的最小骨架只解决了 70% 方言差异。剩下的 30%（占位符 / 数组 / schema）必须由另外三层补齐，连起来才是"目标库能跑"的完整链路：

```python
# === 准备阶段（仓库现状，不动）===
from app.db.database import get_db_connection   # 仓库现状：Kingbase / psycopg2
import sqlglot

sql = _read_sql("foo.sql")                       # ① 加载 .sql 文本（PG 方言，含 %(name)s）
params = {"p": 1, "arr": ["a", "b"]}

# === 多方言适配阶段（新插入的 4 步）===
# ② 翻译：PG 方言 → 目标方言的 SQL 字符串（params 不动，仍为起点 dict）
out = translate_sql(sql, target_dialect="mysql")

# ③ 占位符规范化（驱动层）：%(name)s → 与目标驱动匹配的占位符字面量
#    psycopg2 认 %(name)s  /  PyMySQL 认 %s  /  cx_Oracle 认 :name
#    改的不仅是 SQL 字面量，还要重排 params：
#    - PG/Kingbase：%(name)s + dict，名字匹配 → SQL 和 params 都"不动"
#    - MySQL：%(name)s → %s，名字降级为位置 → params 必须从 dict 退化成 tuple，
#      且顺序与 SQL 中占位符出现顺序对齐
#    - Oracle：%(name)s → :name，key 同步去 `s` 后缀 → params 仍为 dict
#    所以返回值是 (out, params)，调用方必须同时接住两者。
#    params 接力：接 #L246 的 dict → 退化为 tuple。
out, params = _adapt_placeholders(out, params, dialect="mysql")

# ④ 数组字面量展开（应用层）：%(arr)s::varchar[] → IN (%s, %s, ...)
#    PG 的 %(arr)s::varchar[] 是数组 cast + IN 谓词绑定层语法，
#    MySQL / Oracle 都不支持 → 必须把 SQL 里的 %(arr)s 替换成 N 个位置占位符，
#    同时把 params["arr"] 这个 list 拍平成 N 个独立值插进 params（dict → tuple 或 list），
#    所以返回值同样是 (out, params)。
#    params 接力：接 #L260 的 tuple → list 被拍平进 tuple（元素数变多）。
out, params = _expand_pg_arrays(out, params, dialect="mysql")

# ⑤ schema/db 限定名改写（架构层）：dw_basic_lc.letter_screen_6 → kf_letter_screen_6
#    params 接力：接 #L267 的 tuple，schema 改名与参数无关，params 不动。
out = _rewrite_schema_refs(out, dialect="mysql")

# === 执行阶段（仓库现状，不动）===
# ⑥ 取驱动 + 连接：驱动必须跟方言一一对应，否则第 ③ 步翻译出的 SQL 跟驱动不匹配
#    - PG / Kingbase → psycopg2   （仓库现状）
#    - MySQL         → PyMySQL
#    - Oracle        → cx_Oracle / oracledb
#    仅改 target_dialect 而这里仍返回 psycopg2→Kingbase，会直接断在第 ⑦ 步
#    （占位符 / 方言函数不识别），所以 ⑥ 跟 ② 是绑死的：方言语义跟驱动协议必须同源。
driver = get_driver(target_dialect="mysql")        # ⑥-a 按方言选驱动
conn = driver.connect(**conn_params(target_dialect="mysql"))  # ⑥-b 按驱动建连
cur = conn.cursor()
cur.execute(out, params)                          # ⑦ 执行（驱动按位置/名字绑定）
```

#### 8.3.1.0 工作量拆解：现成 API vs 需要自研

> 主示例里 ②~⑥ 这 5 步看着都"差不多"，但工作量差距巨大——只有 ② 和 ⑥-b 是 pip install 就能用的，其它都要自己写。

| 步骤                      | Python 生态现成方案                      | 工作量                              | 说明                                                                 |
| ------------------------- | ---------------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| ② `translate_sql()`       | ✅ **sqlglot**                           | **1 行** `sqlglot.transpile()` 包装 | sqlglot 自带，只需写个薄壳 + `kingbase→postgres` 重定向              |
| ③ `_adapt_placeholders`   | ❌ 自研                                  | 30-50 行                            | 占位符替换 + dict/tuple 重排，关键是扫描 SQL 占位符出现顺序          |
| ④ `_expand_pg_arrays`     | ❌ 自研                                  | 30-50 行                            | 解析 `%(arr)s::varchar[]` → `IN (%s, %s, ...)`，同时拍平 params list |
| ⑤ `_rewrite_schema_refs`  | ⚠️ 自研（sqlglot.qualify 不重写 schema） | 20-30 行                            | regex 替换 `dw_basic_lc.xxx` → 目标库 schema，需维护 schema 映射表   |
| ⑥-a `get_driver()`        | ❌ 自研                                  | 5-10 行                             | if/elif 返回 `psycopg2` / `pymysql` / `cx_Oracle` 模块引用           |
| ⑥-b `driver.connect(...)` | ✅ 现成                                  | —                                   | 各 driver 自带，传 `host/port/user/pwd/db` 即可                      |

**结论**：② 是 sqlglot 一行的事，⑥-b 是 driver 自带，中间 4 件事（③/④/⑤/⑥-a）合计约 100-150 行自研代码——这是"方言适配层"的核心工作量。

**为什么没有现成库接管 ③/④/⑤/⑥-a？** 因为 Python 生态的"跨方言"成熟方案都做在 ORM 层（SQLAlchemy 是事实标准），裸 SQL 层是"自留地"：

- **ORM 层**（SQLAlchemy / Django ORM）：占位符 ✅、数组 IN 展开 ✅、`__table_args__={'schema':...}` ✅、`create_engine("mysql://...")` ✅
- **裸 SQL 层**（`text("SELECT %(a)s")` + psycopg2）：以上 4 件事全都 ❌

三个原因：(1) 跨方言需求已被 ORM 入口包揽，生态觉得没必要在裸 SQL 上再发明一遍；(2) 应用方诉求不一致（如 PG 数组有人要 `ANY()` 有人要 `IN(...)`，库不好默认行为）；(3) 裸 SQL 上下文贫瘠，没有元模型（列类型、关系映射）做不了智能推断。

**对当前仓库的意义**：仓库用 psycopg2 + 裸 SQL，不走 ORM。所以"③/④/⑤/⑥-a"要落到代码里就是自研——除非将来整体迁 ORM（工作量是另一个数量级），否则没有第三方库可借。SQL 文件作为 source of truth 的设计也跟 ORM 是相反方向（见 §8开头"架构前提"待补）。

> **仓库现状（Kingbase）下整段都是空操作**，所以现在的瓶颈不在代码量，而在**业务上要不要"支持多方言"**——如果将来真要 MySQL 视图库 / Oracle 历史库，③/④/⑤/⑥-a 才是工作量主体。

| 步骤                     | 在 5 步链路里的角色 | 在 §8.5 边界表里归谁管               | 当前仓库实现        |
| ------------------------ | ------------------- | ------------------------------------ | ------------------- |
| ① `_read_sql()`          | 应用层加载          | 不涉及                               | ✅ 已有             |
| ② `translate_sql()`      | 翻译层（语法）      | **sqlglot 内置映射**（70% 方言差异） | ⏭️ 新增             |
| ③ `_adapt_placeholders`  | 驱动层              | **驱动层**（占位符字面量）           | ⏭️ 新增             |
| ④ `_expand_pg_arrays`    | 应用层              | **应用层**（PG 数组 → IN 列表）      | ⏭️ 新增             |
| ⑤ `_rewrite_schema_refs` | 架构层              | **架构层**（schema/db/owner 映射）   | ⏭️ 新增             |
| ⑥ `get_db_connection()`  | 驱动层              | 驱动层                               | ✅ 已有（Kingbase） |
| ⑦ `cur.execute()`        | 驱动层              | 驱动层                               | ✅ 已有             |

> **关键观察**：仓库现状（Kingbase）下 ③/④/⑤ 都是"空操作"（因为 Kingbase 协议层兼容 PG），所以"翻译 + 执行"4 行就够用。但只要目标方言换成 MySQL / Oracle，③/④/⑤ 缺一不可。

#### 8.3.1.1 `params` 在 5 步链路里的接力关系（沿链改写）

`params` 不是每一步重新构造的，而是**沿链传递 + 逐步改写**——上一层的返回值就是下一层的输入。`params` 的形态迁移为：

**dict（应用层构造）→ 不动（② 翻译）→ tuple 顺序对齐（③ 占位符）→ tuple 拍平数组（④ 数组展开）→ 不动（⑤ schema）→ 驱动按位置绑定（⑦ 执行）**

接力关系见 §8.3.1 主示例各步注释末尾的 `params 接力：` 行，汇总如下：

| 行号  | 步骤                    | params 输入来源 | params 输出形态                                  |
| ----- | ----------------------- | --------------- | ------------------------------------------------ |
| #L246 | ① 起点                  | 应用层构造      | `{"p": 1, "arr": ["a","b"]}`（dict）             |
| #L250 | ② translate_sql         | ① 接力，不动    | dict（不变）                                     |
| #L260 | ③ \_adapt_placeholders  | ② 接力          | dict → **(1, ["a","b"])**（tuple）               |
| #L267 | ④ \_expand_pg_arrays    | ③ 接力          | (1, ["a","b"]) → **(1, "a", "b")**（tuple 拍平） |
| #L270 | ⑤ \_rewrite_schema_refs | ④ 接力，不动    | tuple（不变）                                    |
| #L275 | ⑦ cur.execute           | ⑤ 接力          | tuple（驱动按位置绑定）                          |

> **关键点**：③/④/⑤ 的 `out, params = ...` 不是"凭空生产"，而是"接力改写"——每层拿上层传下来的 `params` 做方言适配，再交给下一层。这种"上下游同形 (in/out 都是 (out, params))"的写法是有意为之，让调用方链式串联，不需要中间变量。

#### 8.3.2 回到 PG/Kingbase 单方言场景的"4 行够用"

```python
out = translate_sql(sql, target_dialect="postgres")   # ① 翻译（实际原样输出）
conn = get_db_connection()                            # ② 连接（Kingbase 兼容 PG）
cur = conn.cursor()
cur.execute(out, params)                              # ③ 执行（%(name)s 原样兼容）
```

—— 因为 ③/④/⑤ 在 Kingbase 路径上全是空操作，所以这 4 行就是真实代码。

### 8.4 它**做**什么（sqlglot 能解决的 70%）

| 差异                                          | `translate_sql()` 在 PG→MySQL 上的行为   |
| --------------------------------------------- | ---------------------------------------- |
| `NVL(a, b)`                                   | → `COALESCE(a, b)`                       |
| `a \|\| b`                                    | → `CONCAT(a, b)`                         |
| `TO_DATE(s, fmt)`                             | → `STR_TO_DATE(s, fmt_mysql)`            |
| `LIMIT n OFFSET m`                            | 保留（MySQL 原生）                       |
| `LIMIT n OFFSET m`（PG→Oracle）               | → `OFFSET m ROWS FETCH NEXT n ROWS ONLY` |
| `CAST(x AS DATE)`                             | 保留（三方言通用）                       |
| `NULLIF(a, b)` / `TRIM(c)` / `COALESCE(a, b)` | 保留（三方言通用）                       |

### 8.5 它**不**做什么（剩下 30% 留给其他层）

| 边界                                        | 不归 `translate_sql()` 管         | 谁来负责                                   |
| ------------------------------------------- | --------------------------------- | ------------------------------------------ |
| `%(name)s` 占位符字面量跨方言               | 原样保留；Oracle 上要 `:name`     | **驱动层**（PyMySQL / cx_Oracle）          |
| `%(arr)s::varchar[]` PG 数组字面量          | 原样保留；MySQL / Oracle 语法报错 | **应用层**（Python 端展开为 `IN (?,?,?)`） |
| `dw_basic_lc.letter_screen_X` schema 限定名 | 原样保留；MySQL 早期无 schema     | **架构层**（多 db / owner 映射）           |
| `cur.execute(sql, params)` 调用             | 不涉及                            | **Service 层**（维持现状）                 |
| `get_db_connection()` 取得连接              | 不涉及                            | **驱动层**（维持现状）                     |

### 8.6 在调用链里的位置

```
[.sql 文件]
   ↓ _read_sql("foo.sql")                       ← 仓库现状
[SQL 字符串，含 %(name)s]                       ← translate_sql 的输入
   ↓ translate_sql(sql, target="mysql")         ← 新插入这一行
[目标方言 SQL 字符串，仍含 %(name)s]           ← translate_sql 的输出
   ↓ params = {...}
cur.execute(sql, params)                        ← 仓库现状
```

**插入点只有一处**：`_read_sql()` 之后、`cur.execute()` 之前。其余全部链路不动。

### 8.7 一句话总结

> **`translate_sql()` 的全部价值 = "吸收 70% 方言差异"**——它一次性把散落在几十个 `.sql` 文件里的 `NVL / || / TO_DATE / LIMIT-OFFSET` 等函数级差异抹平；**它不**碰占位符、**不**碰数组、**不**碰架构、**不**碰连接——这些必须由其他层各自分担。

---

## 9. 变更记录

| 日期       | 变更                                                                                                            | 备注                             |
| ---------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 2026-09-15 | 初稿：以"过程说明 + 决策依据"为骨架，覆盖 4 方言差异矩阵 + 翻译边界                                             | 初版                             |
| 2026-09-15 | 追加 §8：`translate_sql()` 的职能边界（核心开关）                                                               | 第 2 步核心                      |
| 2026-09-15 | 追加 §8.3.1 / §8.3.2：完整 5 步执行链路 + Kingbase 单方言 4 行收尾，明确"③ 占位符 ④ 数组 ⑤ schema"三层的归属    | 回答"4 行够不够"                 |
| 2026-09-15 | 追加 ④ \_expand_pg_arrays 注释：说明为什么数组展开后也要返回 params（list 拍平 + dict→tuple）                   | 回答"为什么还要返回个 params"    |
| 2026-09-15 | 追加 ③ \_adapt_placeholders 注释：说明为什么占位符规范化也要返回 params（MySQL 位置降级 + dict→tuple 顺序对齐） | 对齐 ④ 的注释格式                |
| 2026-09-15 | 追加 §8.3.1.1：params 在 5 步链路里的接力关系（沿链改写 + 行号映射 + 上下游同形）                               | 回答"params 是上面 267 返回的么" |
