"""task-084 附查：S4 明细与 S5 明细原始行"""

import psycopg2

conn = psycopg2.connect(
    host="10.10.6.142", port=54321, dbname="pdva", user="system",
    password="kingbase",
    options="-c search_path=umc,vportal,dw_comparison,dw_basic_lc,public",
)
conn.set_client_encoding("GBK")
cur = conn.cursor()

cur.execute("SELECT CANT_CODE, CANT_NAME, NUM, ORGAN_ID, STATS_DATE "
            "FROM dw_basic_lc.letter_screen_4 WHERE REG_AUTHORITY='2' ORDER BY CANT_CODE")
print("--- S4 (RA=2) 全部行 ---")
for r in cur.fetchall():
    print(r)

cur.execute("SELECT CANT_CODE, CANT_NAME, NUM, ORGAN_ID, STATS_DATE "
            "FROM dw_basic_lc.letter_screen_5 WHERE REG_AUTHORITY='2' "
            "AND ORGAN_ID IN ('210000','210000000') ORDER BY CAST(NULLIF(TRIM(NUM),'') AS DECIMAL) DESC")
print("--- S5 (RA=2, 省级) 按NUM降序 ---")
for r in cur.fetchall():
    print(r)

conn.close()
