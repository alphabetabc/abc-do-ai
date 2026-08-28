"""task-054 联调对数：Service 层 appeal 输出 vs DB 直查聚合（真实库 10.10.6.142）。

输出到 UTF-8 文件避免 Windows 控制台乱码（同 query_054_letter1_schema.py 先例）。
运行：backend 目录下 uv run python <本脚本路径>
"""

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "backend"))

from app.core.config import settings as app_settings  # noqa: E402

app_settings.db_mode = "real"

from app.db.database import get_db_connection  # noqa: E402
from app.services.visual.big_screen.petition_comparison import (  # noqa: E402
    get_petition_comparison_appeal_data,
    resolve_organ_ids,
)

OUT = Path(__file__).with_name("query_054_appeal_out.txt")


def main():
    buf = io.StringIO()

    # ---- Service 输出（默认省 210000；再验证抚顺 210400 触发沈抚合并）----
    for organ_id in ("210000", "210400"):
        data = get_petition_comparison_appeal_data(organ_id)
        print(f"== Service get_petition_comparison_appeal_data(organ_id={organ_id})", file=buf)
        print(f"   resolve_organ_ids -> {resolve_organ_ids(organ_id)}", file=buf)
        print(f"   items({len(data.items)}):", file=buf)
        for item in data.items:
            print(
                f"   {item.key:<22} name={item.name} label={item.label} "
                f"type={item.type} value={item.value} unit={item.unit}",
                file=buf,
            )

    # ---- DB 直查交叉核对：organIds 按 resolve_organ_ids 展开，逐组 SUM 聚合 ----
    with get_db_connection() as conn:
        cur = conn.cursor()
        for organ_id in ("210000", "210400"):
            ids = tuple(resolve_organ_ids(organ_id))
            ph = ",".join(["%s"] * len(ids))
            print(f"== DB 直查（ORGAN_ID IN {ids}）", file=buf)
            for ra, type_key in (("2", "local"), ("1", "beijing")):
                cur.execute(
                    "SELECT ITEM_NAME, REG_MAIN_APPEAL_ONE, "
                    "SUM(COALESCE(NULLIF(TRIM(NUM), '')::int, 0)) "
                    f"FROM dw_basic_lc.letter_screen_1 WHERE REG_AUTHORITY = '{ra}' "
                    f"AND ORGAN_ID IN ({ph}) GROUP BY ITEM_NAME, REG_MAIN_APPEAL_ONE "
                    "ORDER BY REG_MAIN_APPEAL_ONE",
                    ids,
                )
                rows = cur.fetchall()
                print(f"   [{type_key}] {len(rows)} 组", file=buf)
                for r in rows:
                    print("   ", r, file=buf)

    OUT.write_text(buf.getvalue(), encoding="utf-8")
    print(f"written to {OUT}")


if __name__ == "__main__":
    main()
