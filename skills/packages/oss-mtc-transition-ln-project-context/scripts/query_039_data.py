"""
查询 039/040 信访大屏数据依赖表的状态
- letter_screen_1 ~ letter_screen_6
- O-2: letter_screen_4 vs letter_screen_5 结构比对
- O-3: varchar 字段类型确认
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
    ("letter_screen_1", "§7.1 诉求统计"),
    ("letter_screen_2", "§7.2 月度统计"),
    ("letter_screen_3", "§7.3 人员类型统计"),
    ("letter_screen_4", "地图分布（§7 无独立章节）"),
    ("letter_screen_5", "§7.4 地区统计"),
    ("letter_screen_6", "§7.5 诉求类型统计"),
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
    """Check if table exists, get row count, columns, and sample data."""
    print(f"\n{'='*60}")
    print(f"表: {table_name} ({description})")
    print(f"{'='*60}")

    cur = conn.cursor()

    cur.execute(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'dw_basic_lc' AND table_name = %s)",
        (table_name,),
    )
    exists = cur.fetchone()[0]
    print(f"  表是否存在: {'✅ 是' if exists else '❌ 否'}")

    if not exists:
        cur.close()
        return {"exists": False, "row_count": 0, "columns": [], "samples": []}

    cur.execute(f'SELECT COUNT(*) FROM dw_basic_lc."{table_name}"')
    count = cur.fetchone()[0]
    print(f"  数据行数: {count:,}")

    # Get column info
    cur.execute(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'dw_basic_lc' AND table_name = %s ORDER BY ordinal_position",
        (table_name,),
    )
    columns = cur.fetchall()
    col_names = [c[0] for c in columns]
    col_types = {c[0]: c[1] for c in columns}
    print(f"  字段列表 ({len(col_names)} 列):")
    for col_name, col_type in columns:
        print(f"    {col_name}: {col_type}")

    samples = []
    if count > 0:
        cur.execute(f'SELECT * FROM dw_basic_lc."{table_name}" LIMIT 3')
        rows = cur.fetchall()
        for i, row in enumerate(rows):
            row_dict = {col_names[j]: row[j] for j in range(len(col_names))}
            samples.append(row_dict)
            print(f"    行{i+1}: {str(row_dict)[:200]}")

    cur.close()
    return {"exists": True, "row_count": count, "columns": columns, "samples": samples}


def compare_tables(conn, t1_name, t2_name):
    """Compare column structures of two tables."""
    print(f"\n{'='*60}")
    print(f"O-2: 比对 {t1_name} vs {t2_name} 字段结构")
    print(f"{'='*60}")

    cur = conn.cursor()

    def get_cols(tname):
        cur.execute(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'dw_basic_lc' AND table_name = %s ORDER BY ordinal_position",
            (tname,),
        )
        return cur.fetchall()

    cols1 = get_cols(t1_name)
    cols2 = get_cols(t2_name)

    names1 = set(c[0] for c in cols1)
    names2 = set(c[0] for c in cols2)

    only_in_1 = names1 - names2
    only_in_2 = names2 - names1
    common = names1 & names2

    print(f"  {t1_name} 字段数: {len(cols1)}")
    print(f"  {t2_name} 字段数: {len(cols2)}")
    print(f"  仅在 {t1_name} 中: {only_in_1 if only_in_1 else '无'}")
    print(f"  仅在 {t2_name} 中: {only_in_2 if only_in_2 else '无'}")

    # Compare types for common columns
    type_mismatches = []
    for cname in sorted(common):
        type1 = next(c[1] for c in cols1 if c[0] == cname)
        type2 = next(c[1] for c in cols2 if c[0] == cname)
        if type1 != type2:
            type_mismatches.append((cname, type1, type2))

    if type_mismatches:
        print(f"  类型差异:")
        for cname, t1, t2 in type_mismatches:
            print(f"    {cname}: {t1_name}={t1}, {t2_name}={t2}")
    else:
        print(f"  ✅ 公共字段类型完全一致")

    cur.close()
    return {
        "only_in_1": list(only_in_1),
        "only_in_2": list(only_in_2),
        "type_mismatches": type_mismatches,
    }


def check_varchar_types(results):
    """Summarize varchar vs actual types across all tables."""
    print(f"\n{'='*60}")
    print(f"O-3: varchar 字段类型汇总")
    print(f"{'='*60}")

    for tname, result in results.items():
        if not result.get("exists"):
            continue
        columns = result.get("columns", [])
        varchar_cols = []
        other_cols = []
        for col_name, col_type in columns:
            if col_type.lower() in ("character varying", "varchar"):
                varchar_cols.append(col_name)
            else:
                other_cols.append((col_name, col_type))

        print(f"  {tname}:")
        print(f"    varchar 字段 ({len(varchar_cols)} 个): {varchar_cols[:15]}{'...' if len(varchar_cols) > 15 else ''}")
        if other_cols:
            print(f"    其他类型字段:")
            for cname, ctype in other_cols:
                print(f"      {cname}: {ctype}")


def main():
    print("=" * 60)
    print("039/040 信访大屏 - 数据依赖确认查询")
    print("=" * 60)
    print(f"连接: {DB_HOST}:{DB_PORT}/{DB_NAME}")

    try:
        conn = connect()
        print("数据库连接成功!")
    except Exception as e:
        print(f"数据库连接失败: {e}")
        sys.exit(1)

    try:
        results = {}
        for table_name, desc in TABLES:
            result = check_table(conn, table_name, desc)
            results[table_name] = result

        # O-2: Compare letter_screen_4 vs letter_screen_5
        o2_result = {"only_in_1": [], "only_in_2": [], "type_mismatches": []}
        if results.get("letter_screen_4", {}).get("exists") and results.get("letter_screen_5", {}).get("exists"):
            o2_result = compare_tables(conn, "letter_screen_4", "letter_screen_5")

        # O-3: varchar types
        check_varchar_types(results)

        # Summary
        print(f"\n{'='*60}")
        print("汇总")
        print(f"{'='*60}")
        for tname, result in results.items():
            if result.get("exists"):
                print(f"  {tname}: ✅ {result['row_count']:,} 条")
            else:
                print(f"  {tname}: ❌ 表不存在")

        # O-2 summary
        if o2_result["only_in_1"] or o2_result["only_in_2"] or o2_result["type_mismatches"]:
            print(f"\n  O-2 结论: ⚠️ letter_screen_4 与 letter_screen_5 结构不同")
            if o2_result["only_in_2"]:
                print(f"    letter_screen_5 独有字段: {o2_result['only_in_2']}")
        else:
            print(f"\n  O-2 结论: ✅ letter_screen_4 与 letter_screen_5 结构一致")

    finally:
        conn.close()
        print("\n数据库连接已关闭。")


if __name__ == "__main__":
    main()