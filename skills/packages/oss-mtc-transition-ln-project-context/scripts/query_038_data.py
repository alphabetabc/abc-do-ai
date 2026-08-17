"""
查询 038 人员信息大屏数据依赖表的状态
- stats_jdlk_persion_infor_cant
- abi_zb_tyjrjqyfdx
- aa_jycy
O-5: rylb 枚举值
O-6: 安置地存储格式
"""

import sys
import psycopg2

DB_HOST = "10.10.6.142"
DB_PORT = 54321
DB_NAME = "pdva"
DB_USER = "system"
DB_PASSWORD = "kingbase"
DB_SEARCH_PATH = "umc,vportal,dw_comparison,dw_basic_lc,public"

TABLES = [
    ("stats_jdlk_persion_infor_cant", "§6.4 退役军人统计"),
    ("abi_zb_tyjrjqyfdx", "§8.2 优抚对象/退役军人群体"),
    ("aa_jycy", "§8.7 就业创业信息"),
]


def connect():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        options=f"-c search_path={DB_SEARCH_PATH}",
    )
    try:
        conn.set_client_encoding("GBK")
    except Exception:
        pass
    return conn


def check_table(conn, table_name, description):
    """Check if table exists and get row count."""
    print(f"\n{'='*60}")
    print(f"表: {table_name} ({description})")
    print(f"{'='*60}")

    cur = conn.cursor()

    # Check table existence
    cur.execute(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'dw_basic_lc' AND table_name = %s)",
        (table_name,),
    )
    exists = cur.fetchone()[0]
    print(f"  表是否存在: {'是' if exists else '否'}")

    if not exists:
        cur.close()
        return {"exists": False, "row_count": 0}

    # Get row count
    cur.execute(f'SELECT COUNT(*) FROM dw_basic_lc."{table_name}"')
    count = cur.fetchone()[0]
    print(f"  数据行数: {count:,}")

    # Get sample (first 3 rows)
    if count > 0:
        cur.execute(f'SELECT * FROM dw_basic_lc."{table_name}" LIMIT 3')
        rows = cur.fetchall()
        col_names = [desc[0] for desc in cur.description]
        print(f"  字段列表 ({len(col_names)} 列): {col_names[:10]}{'...' if len(col_names) > 10 else ''}")
        print(f"  样本数据 (前 3 行):")
        for i, row in enumerate(rows):
            print(f"    行{i+1}: {str(row)[:200]}")

    cur.close()
    return {"exists": True, "row_count": count}


def check_rylb(conn):
    """O-5: Check rylb enumeration values from aa_jycy."""
    print(f"\n{'='*60}")
    print("O-5: rylb 枚举值查询")
    print(f"{'='*60}")

    cur = conn.cursor()
    try:
        cur.execute('SELECT DISTINCT "rylb" FROM dw_basic_lc."aa_jycy" WHERE "rylb" IS NOT NULL ORDER BY "rylb"')
        rows = cur.fetchall()
        values = [row[0] for row in rows]
        print(f"  rylb 枚举值 ({len(values)} 个):")
        for v in values:
            print(f"    - {v}")
    except Exception as e:
        print(f"  查询失败: {e}")
    finally:
        cur.close()


def check_anzhidi(conn):
    """O-6: Check 安置地 storage format from aa_jycy."""
    print(f"\n{'='*60}")
    print("O-6: 安置地存储格式查询")
    print(f"{'='*60}")

    cur = conn.cursor()
    try:
        cur.execute('SELECT "安置地" FROM dw_basic_lc."aa_jycy" WHERE "安置地" IS NOT NULL LIMIT 10')
        rows = cur.fetchall()
        values = [row[0] for row in rows]
        print(f"  安置地样本 (前 {len(values)} 条):")
        for v in values:
            print(f"    - {v}")
        print(f"  存储格式判断: {'中文地名' if any(not str(v).isdigit() for v in values) else '编码'}")
    except Exception as e:
        print(f"  查询失败: {e}")
    finally:
        cur.close()


def check_lxgb(conn):
    """Check lxgb field values from abi_zb_tyjrjqyfdx for O-1."""
    print(f"\n{'='*60}")
    print("O-1: lxgb 字段取值查询 (离休干部)")
    print(f"{'='*60}")

    cur = conn.cursor()
    try:
        cur.execute(
            'SELECT "lxgb", COUNT(*) FROM dw_basic_lc."abi_zb_tyjrjqyfdx" WHERE "lxgb" IS NOT NULL GROUP BY "lxgb" ORDER BY "lxgb"'
        )
        rows = cur.fetchall()
        print(f"  lxgb 取值分布:")
        for value, cnt in rows:
            print(f"    lxgb={value}: {cnt:,} 条")
    except Exception as e:
        print(f"  查询失败: {e}")
    finally:
        cur.close()


def main():
    print("=" * 60)
    print("038 人员信息大屏 - 数据依赖确认查询")
    print("=" * 60)
    print(f"连接: {DB_HOST}:{DB_PORT}/{DB_NAME}")

    try:
        conn = connect()
        print("数据库连接成功!")
    except Exception as e:
        print(f"数据库连接失败: {e}")
        sys.exit(1)

    try:
        table_stats = {}
        for table_name, desc in TABLES:
            result = check_table(conn, table_name, desc)
            table_stats[table_name] = result

        # O-5 and O-6 only if aa_jycy has data
        aa_jycy = table_stats.get("aa_jycy", {})
        if aa_jycy.get("row_count", 0) > 0:
            check_rylb(conn)
            check_anzhidi(conn)
        else:
            print(f"\n{'='*60}")
            print("O-5/O-6: aa_jycy 表为空，跳过 rylb 和安置地查询")
            print(f"{'='*60}")

        # O-1: lxgb from abi_zb_tyjrjqyfdx
        abi_table = table_stats.get("abi_zb_tyjrjqyfdx", {})
        if abi_table.get("row_count", 0) > 0:
            check_lxgb(conn)
        else:
            print(f"\n{'='*60}")
            print("O-1: abi_zb_tyjrjqyfdx 表为空，跳过 lxgb 查询")
            print(f"{'='*60}")

        # Summary
        print(f"\n{'='*60}")
        print("汇总")
        print(f"{'='*60}")
        for tname, result in table_stats.items():
            status = f"✅ {result['row_count']:,} 条" if result.get("exists") else "❌ 表不存在"
            print(f"  {tname}: {status}")

    finally:
        conn.close()
        print("\n数据库连接已关闭。")


if __name__ == "__main__":
    main()