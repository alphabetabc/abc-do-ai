"""task-054 O-2 补充核实：编码输出到 UTF-8 文件避免控制台乱码。"""

import io
import sys

import psycopg2

DB = dict(
    host="10.10.6.142",
    port=54321,
    dbname="pdva",
    user="system",
    password="kingbase",
    options="-c search_path=dw_basic_lc,public",
)

OUT = r"e:/oss-fe-git/phoenix/oss-mtc-transition-ln/.trae/skills/oss-mtc-transition-ln-project-context/scripts/query_054_out.txt"


def main():
    buf = io.StringIO()
    conn = psycopg2.connect(**DB)
    try:
        conn.set_client_encoding("UTF8")
    except Exception:
        pass
    cur = conn.cursor()

    def q(sql, label, params=None):
        cur.execute(sql, params or ())
        print(f"== {label}", file=buf)
        for row in cur.fetchall():
            print("  ", row, file=buf)

    q("SELECT DISTINCT ITEM_NAME FROM dw_basic_lc.letter_screen_1 ORDER BY 1", "ITEM_NAME distinct")
    q(
        "SELECT REG_MAIN_APPEAL_ONE, COUNT(DISTINCT ITEM_NAME), MIN(ITEM_NAME) "
        "FROM dw_basic_lc.letter_screen_1 GROUP BY REG_MAIN_APPEAL_ONE ORDER BY 1",
        "RA_MO -> distinct ITEM_NAME",
    )
    q("SELECT DISTINCT STATS_DATE::date FROM dw_basic_lc.letter_screen_1 ORDER BY 1", "STATS_DATE distinct")
    q(
        "SELECT ORGAN_ID, REG_AUTHORITY, STATS_DATE::date, NUM FROM dw_basic_lc.letter_screen_1 "
        "WHERE ORGAN_ID='210000000' AND REG_AUTHORITY='2' ORDER BY STATS_DATE DESC LIMIT 12",
        "SAMPLE organ=210000000 ra=2",
    )
    q(
        "SELECT ORGAN_ID FROM dw_basic_lc.letter_screen_1 WHERE ORGAN_ID LIKE '2115%%' LIMIT 3",
        "SHENFU 2115* exists?",
    )
    q(
        "SELECT LENGTH(ORGAN_ID) AS len, COUNT(*) FROM dw_basic_lc.letter_screen_1 GROUP BY 1",
        "ORGAN_ID length distribution",
    )
    q(
        "SELECT NUM FROM dw_basic_lc.letter_screen_1 WHERE NUM !~ '^[0-9]+$' AND NUM IS NOT NULL LIMIT 10",
        "non-pure-numeric NUM samples",
    )

    conn.close()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(buf.getvalue())
    print(f"written to {OUT}")


if __name__ == "__main__":
    main()
