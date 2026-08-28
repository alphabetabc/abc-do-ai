#!/usr/bin/env python3
"""041 模块1 trend 端点联调对数脚本（task-055 §3.4，PM 返工后 2 线口径）

用法：
    cd backend && uv run python ../.trae/skills/oss-mtc-transition-ln-project-context/scripts/query_055_trend_integration.py

校验：
1. Service mock 输出形状：{ local: { series: 1 }, beijing: { series: 1 } }，每 series 12 月
2. 系列名：local = "本地信访"，beijing = "进京信访"（各 = 三类渠道当月之和，共 2 条线）
3. NUM varchar CAST int 边界（None/空/非法 → 0）
4. 跨渠道求和：同组多行（网上信访/来访/来信 + 沈抚行）逐月累加为 1 条线
5. 沈抚合并：210400 + 211500000 行级数值相加 × local/beijing 两组
6. real 模式 DB 异常 → 真实空结果（仍装配 1 条 series，data 全 0）
"""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

# Windows GBK 控制台兼容：强制 stdout/stderr 用 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# 让 backend 包可被 import：向上遍历定位仓库根（含 backend 目录），再锚定 backend
_REPO_ROOT = Path(__file__).resolve()
while not (_REPO_ROOT / "backend").is_dir():
    _REPO_ROOT = _REPO_ROOT.parent
sys.path.insert(0, str(_REPO_ROOT / "backend"))
os.chdir(_REPO_ROOT / "backend")

from app.core.config import settings  # noqa: E402
from app.services.visual.big_screen.petition_comparison import (  # noqa: E402
    _rows_to_series,
    get_petition_comparison_trend_data,
)


def _check(label: str, ok: bool, detail: str = "") -> None:
    mark = "[OK]" if ok else "[FAIL]"
    print(f"{mark} {label}{(' - ' + detail) if detail else ''}")
    if not ok:
        sys.exit(1)


def main() -> None:
    print("=== 041 模块1 trend 联调对数（task-055，PM 返工后 2 线口径）===")
    print(f"db_mode = {settings.db_mode}")

    # === 1. Service 输出形状（mock 与 real 异常回退均保证每组 1 系列）===
    # real 模式无 DB 连接时，Service 会捕获异常返回真实空结果（每组仍装配 1 条 series）
    data = get_petition_comparison_trend_data("210000")
    _check("local.series 长度=1", len(data.local.series) == 1, f"实际 {len(data.local.series)}")
    _check("beijing.series 长度=1", len(data.beijing.series) == 1, f"实际 {len(data.beijing.series)}")

    local_names = [s.name for s in data.local.series]
    beijing_names = [s.name for s in data.beijing.series]
    _check("本地系列名", set(local_names) == {"本地信访"}, str(local_names))
    _check("进京系列名", set(beijing_names) == {"进京信访"}, str(beijing_names))

    for s in data.local.series + data.beijing.series:
        _check(f"{s.name} data 长度=12", len(s.data) == 12, f"实际 {len(s.data)}")
        _check(
            f"{s.name} data 类型全 int",
            all(isinstance(v, int) for v in s.data),
        )

    # === 2. NUM varchar CAST int 边界（None/空/非法 → 0）===
    boundary_rows = [
        {"num_0": "10", "num_1": None, "num_2": "", "num_3": "xyz", "num_4": "3.7",
         **{f"num_{i}": "0" for i in range(5, 12)}},
    ]
    series = _rows_to_series("local", boundary_rows)
    s = series[0]
    _check("CAST 边界 num_0=10", s.data[0] == 10, str(s.data[0]))
    _check("CAST 边界 None→0", s.data[1] == 0, str(s.data[1]))
    _check("CAST 边界 空串→0", s.data[2] == 0, str(s.data[2]))
    _check("CAST 边界 非法→0", s.data[3] == 0, str(s.data[3]))
    _check("CAST 边界 3.7→3", s.data[4] == 3, str(s.data[4]))

    # === 3. 跨渠道求和：同组多行（三类渠道）逐月累加为 1 条线 ===
    channel_rows = [
        {"num_0": "10", "num_1": "20", **{f"num_{i}": "0" for i in range(2, 12)}},  # 网上信访
        {"num_0": "5", "num_1": "7", **{f"num_{i}": "0" for i in range(2, 12)}},   # 来访
        {"num_0": "2", "num_1": "3", **{f"num_{i}": "0" for i in range(2, 12)}},   # 来信
    ]
    channel_series = _rows_to_series("local", channel_rows)
    cs = channel_series[0]
    _check("跨渠道求和 num_0=10+5+2=17", cs.data[0] == 17, str(cs.data[0]))
    _check("跨渠道求和 num_1=20+7+3=30", cs.data[1] == 30, str(cs.data[1]))

    # === 4. 沈抚合并：210400 + 211500000 行级数值相加 × local/beijing 两组 ===
    local_rows = [
        {"num_0": "10", **{f"num_{i}": "0" for i in range(1, 12)}},  # 抚顺
        {"num_0": "5", **{f"num_{i}": "0" for i in range(1, 12)}},   # 沈抚
    ]
    beijing_rows = [
        {"num_0": "8", **{f"num_{i}": "0" for i in range(1, 12)}},   # 抚顺进京
        {"num_0": "3", **{f"num_{i}": "0" for i in range(1, 12)}},   # 沈抚进京
    ]
    local_series = _rows_to_series("local", local_rows)
    beijing_series = _rows_to_series("beijing", beijing_rows)
    _check("沈抚合并 本地组 10+5=15", local_series[0].data[0] == 15, str(local_series[0].data[0]))
    _check("沈抚合并 进京组 8+3=11", beijing_series[0].data[0] == 11, str(beijing_series[0].data[0]))

    # === 5. 非法 organId 抛 ValueError ===
    try:
        get_petition_comparison_trend_data("abc12!")
        _check("非法 organId 抛 ValueError", False, "未抛出异常")
    except ValueError as exc:
        _check("非法 organId 抛 ValueError", True, str(exc))

    print("\n[DONE] 全部对数项通过")


if __name__ == "__main__":
    main()