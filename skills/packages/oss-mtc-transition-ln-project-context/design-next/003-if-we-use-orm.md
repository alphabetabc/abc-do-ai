# 003 — 如果走 ORM 路线，跨方言适配会长什么样

> **范围**：纯技术方案讨论，不对当前仓库做改造，也不主张改造。
> 与 002-sqlglot-dialect-translation.md 形成对照——同样的"跨方言诉求"在两条路线下，工作量边界完全不同。
> 当前仓库走的是"裸 SQL + .sql 模板 + psycopg2"，见 002 §8.3.1 主示例。本篇仅讨论**如果走 ORM 会怎样**。

---

## 1. 对照基线：002 的"裸 SQL 路线"有什么负担

002 §8.3.1 主示例里，跨方言链路是 ②~⑥ 五步，其中 ③/④/⑤/⑥-a 是自研代码（约 100-150 行）：

| 步骤                     | 自研工作量           | 难度来源                                  |
| ------------------------ | -------------------- | ----------------------------------------- |
| ② `translate_sql()`      | 1 行（sqlglot 薄壳） | —                                         |
| ③ `_adapt_placeholders`  | 30-50 行             | SQL 占位符出现顺序扫描 + dict/tuple 重排  |
| ④ `_expand_pg_arrays`    | 30-50 行             | `%(arr)s::varchar[]` → `IN (%s, %s, ...)` |
| ⑤ `_rewrite_schema_refs` | 20-30 行             | regex 替换 + 维护 schema 映射表           |
| ⑥-a `get_driver()`       | 5-10 行              | if/elif 选 driver 模块                    |

**核心矛盾**：跨方言诉求落到"裸 SQL + 模板"上，被拆成了 4 件事，每件都没有现成库接管——因为 Python 生态的"跨方言"成熟方案都做在 ORM 层（见 002 §8.3.1.0）。

---

## 2. ORM 路线的"零适配"前提

ORM 把"占位符 / 数组 / schema / 驱动选型"这 4 件事**全部收编**了。对应到 002 的 5 步链路，ORM 路线会变成：

### 2.1 ORM 完整骨架（entity + engine + session + query）

```python
# ORM 路线：跨方言的"零适配"骨架
from sqlalchemy import create_engine, Column, Integer, String, and_, or_, func
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

class LetterScreen6(Base):
    # ↑ 这是一个 ORM 实体（Declarative Class / ORM Model）：
    #   SQLAlchemy 术语叫 Model，Java/JPA 叫 @Entity，TypeORM 叫 @Entity，
    #   作用是"用 Python 类描述一张物理表的形状"（表名/schema/列/主键），
    #   ORM 据此在编译 SQL 时把 query 表达式翻译成对应方言的 SQL。
    __tablename__ = "letter_screen_6"
    #         ↑ 映射到的物理表名：ORM 生成 SQL 时拼成 FROM letter_screen_6
    __table_args__ = {"schema": "dw_basic_lc"}      # ← ⑤ schema 改写由 ORM 接管
    #              ↑ 表所属 schema：编译 SQL 时自动加 dw_basic_lc.letter_screen_6 前缀
    id = Column(Integer, primary_key=True)
    # ↑ 主键列，对应表里的 id INTEGER PRIMARY KEY
    org_name = Column(String)
    # ↑ 普通字符串列，对应表里的 org_name VARCHAR
    status = Column(String)
    # ↑ 状态列，下面的查询会用到

# ①-⑥ 全部由 create_engine + ORM session 接管
# ↓↓↓↓↓↓ 这里就是"跨方言唯一要改的地方"↓↓↓↓↓↓
engine = create_engine(                             # ← ⑥ 驱动 + 连接由 URL 决定
    "mysql+pymysql://user:pwd@host:3306/db",        # ← 改 URL 即可跨方言
    future=True,
    echo=True,                                      # ← 调试时打开：能看到 ORM 实际生成的 SQL
)
Session = sessionmaker(bind=engine)
session = Session()
```

### 2.2 一个"接近仓库现状"的查询示例

仓库大屏的常见查询形态是：**多条件过滤 + IN 列表 + 聚合**。下面这段是 ORM 表达同一件事的写法：

```python
# ② 翻译：ORM 不直接生成跨方言 SQL，
#   而是通过 Dialect 类在编译时把高层表达式翻译成目标方言 SQL
# ③ 占位符：bindparam / filter() 内部按 paramstyle 自动适配
# ④ 数组 IN 展开：filter(Letters.id IN ([1,2,3]))  → ORM 自动展开
def get_org_stats(org_ids: list[int], min_year: int):
    """查一批机构的信访统计：按状态聚合，过滤 org_id 在列表里、最小年份限制"""
    return session.query(
        LetterScreen6.org_name,                      # SELECT org_name
        LetterScreen6.status,                        #        , status
        func.count(LetterScreen6.id).label("cnt")    #        , COUNT(id) AS cnt
        # ↑ ↑ func 是 ORM 的"方言无关函数"包装：编译时按 dialect 翻译成
        #      MySQL 的 COUNT / PG 的 COUNT / Oracle 的 COUNT（多数情况全兼容）
    ).filter(
        and_(
            LetterScreen6.id.in_(org_ids),           # WHERE id IN (...)
            # ↑ ↑ ↑ ④ list 自动展开 IN：list 元素逐个绑进 params
            or_(
                LetterScreen6.status == "active",
                LetterScreen6.status == "pending",
            ),
            func.year(LetterScreen6.create_time) >= min_year,
            # ↑ ↑ ↑ 方言函数包装：MySQL→YEAR()、PG→EXTRACT(YEAR FROM ...)、Oracle→EXTRACT(...)
        )
    ).group_by(
        LetterScreen6.org_name,
        LetterScreen6.status,
    ).all()
    # ↑ 上面这一段（函数体 + 函数签名）跨方言时**完全不动**
```

### 2.3 切换方言时，实际改动只有 1 行

从 MySQL 切到 Kingbase / PG，只需要改 URL，**所有查询代码不动**：

```python
# === Kingbase / PG（仓库现状方言）===
engine = create_engine(
    "postgresql+psycopg2://user:pwd@host:5432/db",   # ← 只改这一行
    future=True,
)

# === MySQL ===
engine = create_engine(
    "mysql+pymysql://user:pwd@host:3306/db",         # ← 只改这一行
    future=True,
)

# === Oracle ===
engine = create_engine(
    "oracle+cx_oracle://user:pwd@host:1521/sid",     # ← 只改这一行
    future=True,
)

# ↓↓↓↓↓↓ 下面 get_org_stats() 一行不动 ↓↓↓↓↓↓
session = Session()
result = get_org_stats(org_ids=[1, 2, 3], min_year=2024)
```

### 2.4 对照 002 的差异点

| 维度             | 002（裸 SQL + 模板）                                           | 003（ORM）                                |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------- |
| 切换方言要改的行 | ② ~ ⑥ 都要改（URL、driver、占位符适配、数组展开、schema 改写） | **只改 1 行 URL**                         |
| 业务查询代码     | 重写 SQL 字符串                                                | `filter(...).all()` 一行不动              |
| 占位符管理       | 自己重排 dict/tuple                                            | ORM 按 paramstyle 自动                    |
| 数组 IN          | 自己展开 list → IN (?,?,?)                                     | `.in_(list)` 自动                         |
| schema 限定名    | 自己 regex 替换                                                | `__table_args__ = {"schema": ...}` 元数据 |
| 驱动选型         | 自己 if/elif                                                   | URL 协议头直绑                            |

**关键观察**：002 的 ②~⑥ 五步全部消失，跨方言代价变成 **0 行业务代码改动 + 改一个 URL 字符串**。

---

## 2.5 Caveat：ORM 不能自动翻译方言偏门语法

ORM 的"零适配"红利**只覆盖 ORM 高层 API**（`query` / `filter` / `in_` / `func` 等）。如果业务里直接用 `text()` 写原生 SQL，方言函数还是要自己处理：

```python
from sqlalchemy import text

# ⚠️ 这种写法 ORM 不翻译，方言切换时这里会断
result = session.execute(text("""
    SELECT NVL(org_name, 'unknown')                -- NVL 是 Oracle 专属
    FROM dw_basic_lc.letter_screen_6
    WHERE id IN :ids                                -- PG 风格占位符
"""), {"ids": [1, 2, 3]})

# ✅ 改写为 ORM 高层 API 才能享受零适配红利
result = session.query(
    func.coalesce(LetterScreen6.org_name, "unknown")  # ← COALESCE 三方言通用
).filter(
    LetterScreen6.id.in_([1, 2, 3])
).all()
```

**对仓库现状的含义**：大屏 SQL 里大量 `NVL` / `date_trunc` / `::varchar[]` 这些都是"绕开 ORM"的写法——迁 ORM 后这些 SQL 仍然要重写，要么改 ORM 高层 API，要么走 `text()` + 手动方言翻译（相当于把 002 的自研工作量搬到 ORM 里）。**这部分 SQLAlchemy 的方言兼容矩阵能覆盖一部分通用函数，但 Kingbase 的 PG 偏门语法很可能覆盖不到**。

---

## 3. ORM 是怎么"吸掉" 002 那 4 件事的

| 002 步骤        | ORM 的对应机制                                                | 不用自研的原因                                                                            |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| ② 翻译 SQL 方言 | `Dialect` 类 + `compiler` 钩子                                | ORM 内部有 AST（高层表达式树），每种方言都有专属 compiler 把同一棵树编译成目标 SQL        |
| ③ 占位符        | `paramstyle` + `bindparam`                                    | DBAPI 标准已经统一了占位符表达，ORM 在生成 SQL 时按 dialect 选 `%(name)s` / `:name` / `?` |
| ④ 数组 IN 展开  | `Column.in_([...])` / `any_()`                                | ORM 在编译 `IN` 谓词时把 list 拆成 `IN (?, ?, ?)`，并把 list 元素逐个绑进 params          |
| ⑤ schema 限定名 | `__table_args__ = {"schema": ...}` / `Table(..., schema=...)` | schema 是表元数据的一部分，编译时直接拼到 `schema.table`                                  |
| ⑥-a 驱动选型    | `create_engine("dialect+driver://...")`                       | URL 协议头直接绑定 dialect + driver，无需 if/elif                                         |

**本质区别**：002 是"裸字符串 + params dict"——库看到的只有这两样，没有元模型；ORM 是"AST + 元模型"——库能看到列类型、关系、表结构，所以能做"智能推断"。

---

## 4. ORM 路线对当前仓库的意义（**不主张改造，仅评估**）

如果将来仓库真要支持 MySQL / Oracle 视图库，**两条路线的对比**：

| 维度                      | 现状路线（裸 SQL + 模板） | ORM 路线                                                        |
| ------------------------- | ------------------------- | --------------------------------------------------------------- |
| 跨方言代码改动量          | 自研 ③~⑥（约 100-150 行） | 改 `create_engine` URL（0 行）                                  |
| 现有 SQL 迁移量           | 0（保留 .sql 文件）       | **全部 SQL 改 ORM 模型/Query**（数量级翻倍）                    |
| Kingbase 方言支持         | ✅ 直用 Kingbase 特性     | ⚠️ 依赖 sqlalchemy-kingbase 是否有官方/社区方言                 |
| 复杂报表（CTE/窗口/数组） | ✅ 直写 .sql              | ⚠️ ORM 表达绕，常退化成 `text("...raw SQL...")` 反而失 ORM 红利 |
| SQL 可读性 / 审计         | ✅ 文件级 diff            | ❌ 散落在 Python 代码                                           |
| 类型安全                  | ❌ 字符串拼接易错         | ✅ 类型注解 + 编译期检查                                        |
| 调试透明度                | ✅ 看 .sql 即可           | ⚠️ 需打开 SQL echo 才能看实际执行语句                           |
| CRUD 开发速度             | ⚠️ 每条 SQL 手写          | ✅ ORM 自动生成                                                 |

**核心权衡**：

- 仓库 SQL 是"展示型"为主（大屏聚合、复杂报表），不是"事务型"为主（CRUD 表单）——**ORM 红利小，成本高**
- 已写好的 100+ 个 .sql 文件迁 ORM 是**数量级更高**的工作量
- 但反过来，迁 ORM 之后跨方言是**真零成本**

---

## 5. 一句话总结

> 002 那套"方言适配层"不是疏漏，是**裸 SQL 路线的必然代价**——选这条路就要承担 100-150 行自研代码；选 ORM 路线就能扔掉这 4 件事，但要承担 SQL 全面迁移的工作量。**两条路的成本不在同一量纲**，跨方言是低频诉求，所以"现在付出 vs 未来付出"的天轮还没倾斜。

---

## 6. 与 002 的引用关系

- 002 §8.3.1 主示例：裸 SQL 路线的完整链路
- 002 §8.3.1.0：为什么 ②~⑥ 需要自研、Python 生态为什么没现成库
- **003（本篇）**：如果走 ORM，"占位符 / 数组 / schema / 驱动选型"全被 ORM 吸掉，002 那 4 件自研代码作废
- 两条路是" **裸 SQL + 模板**" 与 " ** ORM 模型/Query**" 的互斥选择，**不是叠加关系**

---

## 7. 变更记录

| 日期       | 变更                                                                           | 备注 |
| ---------- | ------------------------------------------------------------------------------ | ---- |
| 2026-09-15 | 初稿：以 002 §8.3.1 主示例为对照基线，写 ORM 路线的"零适配"骨架 + 机制吸收原理 | 初版 |
