"""task-059 联调对数：Service 层 identity 输出 vs DB 直查聚合（真实库 10.10.6.142）。

输出到 UTF-8 文件避免 Windows 控制台乱码（同 query_056_rank_integration.py 先例）。
运行：backend 目录下 .venv/Scripts/python.exe <本脚本路径>
"""

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "backend"))

from app.core.config import settings as app_settings  # noqa: E402

app_settings.db_mode = "real"

from app.db.database import get_db_connection  # noqa: E402
from app.services.visual.big_screen.petition_comparison import (  # noqa: E402
    get_petition_comparison_identity_data,
    resolve_organ_ids,
)

OUT = Path(__file__).with_name("query_059_identity_out.txt")

# 11 身份字段（与 identity.sql / data-models §7.3 对齐）
FIELDS = [
    "SB_NCYWB",
    "SB_CZYWB",
    "SB_ZYSG",
    "SB_FYSG",
    "GB_JHFP",
    "GB_ZZZY",
    "GB_QYJZGB",
    "GB_ZYJZGB",
    "GB_JXGB",
    "GB_FY",
    "RY_QT",
]


def main():
    buf = io.StringIO()

    # ---- Service 输出（默认省 210000；再验证抚顺 210400 触发沈抚合并 × 2 次）----
    for organ_id in ("210000", "210400"):
        data = get_petition_comparison_identity_data(organ_id)
        print(f"== Service get_petition_comparison_identity_data(organ_id={organ_id})", file=buf)
        print(f"   resolve_organ_ids -> {resolve_organ_ids(organ_id)}", file=buf)
        print(f"   categories({len(data.categories)}): {data.categories}", file=buf)
        if not data.series:
            print("   series=[] （双查询均无真实数据，空态约定）", file=buf)
        for s in data.series:
            print(f"   series type={s.type} name={s.name}", file=buf)
            print(f"      data({len(s.data)})={s.data}", file=buf)

    # ---- DB 直查交叉核对：ACCEPT_SOURCE IN (1,2,3) SUM 11 字段（与 identity.sql 同口径）----
    with get_db_connection() as conn:
        cur = conn.cursor()
        cols = ", ".join(f"SUM({f}) AS {f}" for f in FIELDS)
        for organ_id in ("210000", "210400"):
            ids = tuple(resolve_organ_ids(organ_id))
            ph = ",".join(["%s"] * len(ids))
            print(f"== DB 直查（ORGAN_ID IN {ids}，ACCEPT_SOURCE IN (1,2,3) SUM）", file=buf)
            for ra, type_key in (("2", "local"), ("1", "beijing")):
                cur.execute(
                    f"SELECT {cols} FROM dw_basic_lc.letter_screen_3 "
                    f"WHERE REG_AUTHORITY = '{ra}' AND ORGAN_ID IN ({ph}) "
                    "AND ACCEPT_SOURCE IN (1, 2, 3)",
                    ids,
                )
                row = cur.fetchone()
                print(f"   [{type_key}] {row}", file=buf)
            # ACCEPT_SOURCE=7 过滤对数（spec O-N3）：含 7 与不含 7 的 SUM 对比，
            # 差值应 = 7 渠道行数值（证明确实过滤掉了 7）
            cur.execute(
                f"SELECT {cols} FROM dw_basic_lc.letter_screen_3 "
                f"WHERE REG_AUTHORITY = '2' AND ORGAN_ID IN ({ph}) "
                "AND ACCEPT_SOURCE IN (1, 2, 3, 7)",
                ids,
            )
            with7 = cur.fetchone()
            print(f"   [local+7对照] ACCEPT_SOURCE IN (1,2,3,7) = {with7}", file=buf)

    # ---- ACCEPT_SOURCE 全渠道分布（验证 7 渠道是否真实存在数据）----
    with get_db_connection() as conn:
        cur = conn.cursor()
        print("== DB 直查（ACCEPT_SOURCE 全渠道分布：COUNT + SUM(SB_NCYWB)）", file=buf)
        cur.execute(
            "SELECT ACCEPT_SOURCE, COUNT(*), SUM(SB_NCYWB) "
            "FROM dw_basic_lc.letter_screen_3 GROUP BY ACCEPT_SOURCE ORDER BY ACCEPT_SOURCE"
        )
        for r in cur.fetchall():
            print(f"   ACCEPT_SOURCE={r[0]} rows={r[1]} sum_ncywb={r[2]}", file=buf)

    OUT.write_text(buf.getvalue(), encoding="utf-8")
    print(f"written to {OUT}")


if __name__ == "__main__":
    main()
