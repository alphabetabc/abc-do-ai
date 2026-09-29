"""task-2026-09-20-084 排查：039 地图(letter_screen_4) vs 柱图(letter_screen_5) 数值不一致

验证两点：
1. 两表同地区 NUM 是否本身不一致（PM 将地图与排名定义为两张不同数据源表）
2. letter_screen_4 是否同时存在 STATS_DATE NULL 与非 NULL 行（map.sql NULL 保留逻辑会多算）

对照口径：REG_AUTHORITY='2'，省级（ORGAN_ID 210000 / 210000000），沈抚合并（2115→2104，前 4 位）
"""

import sys
from decimal import Decimal

import psycopg2

DB_HOST = "10.10.6.142"
DB_PORT = 54321
DB_NAME = "pdva_prod"
DB_USER = "system"
DB_PASSWORD = "kingbase"
DB_SEARCH_PATH = "umc,vportal,dw_comparison,dw_basic_lc,public"

SHENFU, FUSHUN = "2115", "2104"


def connect():
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER,
        password=DB_PASSWORD, options=f"-c search_path={DB_SEARCH_PATH}",
    )
    try:
        conn.set_client_encoding("GBK")
    except Exception:
        pass
    return conn


def q(cur, sql, params=None):
    cur.execute(sql, params or ())
    return cur.fetchall()


def merge_shenfu(rows):
    """前 4 位前缀合并 2115→2104，市级汇总行重命名抚顺市（对齐 service.py _merge_shenfu）"""
    merged = {}
    for code, name, num in rows:
        code = str(code or "")
        if code[:4] == SHENFU:
            code = FUSHUN + code[4:]
        name = str(name or "")
        if code[:4] == FUSHUN and not code[4:].strip("0"):
            name = "抚顺市"
        if code in merged:
            merged[code][1] += Decimal(str(num or 0))
        else:
            merged[code] = [name, Decimal(str(num or 0))]
    return merged


def main():
    conn = connect()
    with conn.cursor() as cur:
        print("=" * 72)
        print("1) letter_screen_4 STATS_DATE 分布（RA=2，省级）")
        rows = q(cur, """
            SELECT CASE WHEN STATS_DATE IS NULL THEN 'NULL' ELSE 'NOT_NULL' END,
                   COUNT(*)
            FROM dw_basic_lc.letter_screen_4
            WHERE REG_AUTHORITY = '2'
              AND ORGAN_ID IN ('210000', '210000000')
            GROUP BY 1
        """)
        for r in rows:
            print(f"   STATS_DATE={r[0]:<8} rows={r[1]}")
        if any(r[0] == "NULL" and r[1] > 0 for r in rows) and \
           any(r[0] == "NOT_NULL" and r[1] > 0 for r in rows):
            print("   ⚠️ 两类行并存 → map.sql 的 (NULL OR 最新快照) 条件会叠加多算")
        rows_null_detail = q(cur, """
            SELECT MIN(CAST(STATS_DATE AS DATE)), MAX(CAST(STATS_DATE AS DATE)),
                   COUNT(DISTINCT CAST(STATS_DATE AS DATE))
            FROM dw_basic_lc.letter_screen_4
            WHERE REG_AUTHORITY = '2' AND STATS_DATE IS NOT NULL
              AND ORGAN_ID IN ('210000', '210000000')
        """)
        print(f"   非 NULL 行日期范围: {rows_null_detail[0]}")

        print("=" * 72)
        print("2) letter_screen_4 vs letter_screen_5 同地区对照（RA=2，省级，沈抚合并后）")
        s4 = q(cur, """
            SELECT CANT_CODE, CANT_NAME, NVL(SUM(CAST(NULLIF(TRIM(NUM),'') AS DECIMAL)),0)
            FROM dw_basic_lc.letter_screen_4
            WHERE REG_AUTHORITY = '2' AND ORGAN_ID IN ('210000','210000000')
            GROUP BY CANT_CODE, CANT_NAME
        """)  # 全量（含 NULL 日期行），模拟 map.sql 行为
        s4_snap = q(cur, """
            SELECT CANT_CODE, CANT_NAME, NVL(SUM(CAST(NULLIF(TRIM(NUM),'') AS DECIMAL)),0)
            FROM dw_basic_lc.letter_screen_4
            WHERE REG_AUTHORITY = '2' AND ORGAN_ID IN ('210000','210000000')
              AND STATS_DATE IS NOT NULL
              AND CAST(STATS_DATE AS DATE) = (
                SELECT MAX(CAST(STATS_DATE AS DATE)) FROM dw_basic_lc.letter_screen_4
                WHERE REG_AUTHORITY = '2' AND ORGAN_ID IN ('210000','210000000'))
            GROUP BY CANT_CODE, CANT_NAME
        """)  # 仅最新快照
        s5 = q(cur, """
            SELECT CANT_CODE, CANT_NAME, NVL(SUM(CAST(NULLIF(TRIM(NUM),'') AS DECIMAL)),0)
            FROM dw_basic_lc.letter_screen_5
            WHERE REG_AUTHORITY = '2' AND ORGAN_ID IN ('210000','210000000')
              AND CAST(STATS_DATE AS DATE) = (
                SELECT MAX(CAST(STATS_DATE AS DATE)) FROM dw_basic_lc.letter_screen_5
                WHERE REG_AUTHORITY = '2' AND ORGAN_ID IN ('210000','210000000'))
            GROUP BY CANT_CODE, CANT_NAME
        """)

        m4, m4s, m5 = merge_shenfu(s4), merge_shenfu(s4_snap), merge_shenfu(s5)
        print(f"   {'地区':<10} {'S4全量(地图)':>14} {'S4快照':>12} {'S5(柱图)':>12}  差异")
        codes = sorted(set(m4) | set(m4s) | set(m5))
        diff_cnt = 0
        for c in codes:
            n4 = m4.get(c, [None, Decimal(0)])[1]
            n4s = m4s.get(c, [None, Decimal(0)])[1]
            n5 = m5.get(c, [None, Decimal(0)])[1]
            d1 = "" if n4 == n5 else " ←S4全量≠S5"
            d2 = "" if n4s == n5 else " ←S4快照≠S5"
            d3 = "" if n4 == n4s else " ←全量≠快照(多算)"
            flag = (d1 + d2 + d3) or ""
            if flag:
                diff_cnt += 1
            name = (m4.get(c) or m4s.get(c) or m5.get(c))[0]
            print(f"   {name:<10} {n4:>14} {n4s:>12} {n5:>12}  {flag}")
        print(f"\n   差异地区数: {diff_cnt} / {len(codes)}")
        tot4 = sum(v[1] for v in m4.values())
        tot4s = sum(v[1] for v in m4s.values())
        tot5 = sum(v[1] for v in m5.values())
        print(f"   合计  S4全量={tot4}  S4快照={tot4s}  S5={tot5}")

        print("=" * 72)
        print("3) 两表最新快照日期对照")
        d4 = q(cur, "SELECT MAX(CAST(STATS_DATE AS DATE)) FROM dw_basic_lc.letter_screen_4 "
                    "WHERE REG_AUTHORITY='2' AND ORGAN_ID IN ('210000','210000000')")
        d5 = q(cur, "SELECT MAX(CAST(STATS_DATE AS DATE)) FROM dw_basic_lc.letter_screen_5 "
                    "WHERE REG_AUTHORITY='2' AND ORGAN_ID IN ('210000','210000000')")
        print(f"   S4 最新快照: {d4[0][0]}    S5 最新快照: {d5[0][0]}")

    conn.close()


if __name__ == "__main__":
    sys.exit(main())
