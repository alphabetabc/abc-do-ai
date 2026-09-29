"""task-084 附查：040 (RA=1) 与 041 地图 vs 柱图数据对照

040: 地图 S4(RA=1) vs 柱图 S5(RA=1)
041: 地图 S4(RA IN (1,2) SUM) vs 柱图 S5(RA=2) + S5(RA=1) 两条系列
"""

from decimal import Decimal

import psycopg2

conn = psycopg2.connect(
    host="10.10.6.142", port=54321, dbname="pdva_prod", user="system",
    password="kingbase",
    options="-c search_path=umc,vportal,dw_comparison,dw_basic_lc,public",
)
conn.set_client_encoding("GBK")
cur = conn.cursor()

ORG = "('210000','210000000')"
SHENFU, FUSHUN = "2115", "2104"


def fetch(sql):
    cur.execute(sql)
    return cur.fetchall()


def merge(rows):
    m = {}
    for code, name, num in rows:
        code = str(code or "")
        if code[:4] == SHENFU:
            code = FUSHUN + code[4:]
        if code[:4] == FUSHUN and not code[4:].strip("0"):
            name = "抚顺市"
        if code in m:
            m[code][1] += Decimal(str(num or 0))
        else:
            m[code] = [name, Decimal(str(num or 0))]
    return m


def s4(ra):
    return fetch(f"""
        SELECT CANT_CODE, CANT_NAME,
               NVL(SUM(CAST(NULLIF(TRIM(NUM),'') AS DECIMAL)),0)
        FROM dw_basic_lc.letter_screen_4
        WHERE REG_AUTHORITY = '{ra}' AND ORGAN_ID IN {ORG}
        GROUP BY CANT_CODE, CANT_NAME""")


def s5(ra):
    return fetch(f"""
        SELECT CANT_CODE, CANT_NAME,
               NVL(SUM(CAST(NULLIF(TRIM(NUM),'') AS DECIMAL)),0)
        FROM dw_basic_lc.letter_screen_5
        WHERE REG_AUTHORITY = '{ra}' AND ORGAN_ID IN {ORG}
          AND CAST(STATS_DATE AS DATE) = (
            SELECT MAX(CAST(STATS_DATE AS DATE)) FROM dw_basic_lc.letter_screen_5
            WHERE REG_AUTHORITY = '{ra}' AND ORGAN_ID IN {ORG})
        GROUP BY CANT_CODE, CANT_NAME""")


def dump(title, a, b, la, lb):
    print("=" * 76)
    print(title)
    codes = sorted(set(a) | set(b))
    diff = 0
    for c in codes:
        na = a.get(c, [None, Decimal(0)])[1]
        nb = b.get(c, [None, Decimal(0)])[1]
        f = "" if na == nb else "  ←不一致"
        if f:
            diff += 1
        name = (a.get(c) or b.get(c))[0]
        print(f"   {name:<10} {la}={na:>8}  {lb}={nb:>8}{f}")
    print(f"   差异地区数 {diff}/{len(codes)}；合计 {la}={sum(v[1] for v in a.values())}  {lb}={sum(v[1] for v in b.values())}")


# 040：RA=1
dump("040 进京信访：地图 S4(RA=1, 全量含NULL日期) vs 柱图 S5(RA=1, 最新快照)",
     merge(s4("1")), merge(s5("1")), "S4地图", "S5柱图")

# 041：地图 = S4 RA1+RA2 相加；柱图 = S5 RA=2 / RA=1 两系列
m41a = merge(s4("1"))
m41b = merge(s4("2"))
m41 = {}
for src in (m41a, m41b):
    for k, (n, v) in src.items():
        if k in m41:
            m41[k][1] += v
        else:
            m41[k] = [n, v]
dump("041 比对：地图 S4(RA IN(1,2) 相加) vs 柱图系列1 S5(RA=2, 本地)",
     m41, merge(s5("2")), "S4地图", "S5本地")
dump("041 比对：地图 S4(RA IN(1,2) 相加) vs 柱图系列2 S5(RA=1, 进京)",
     m41, merge(s5("1")), "S4地图", "S5进京")

conn.close()
