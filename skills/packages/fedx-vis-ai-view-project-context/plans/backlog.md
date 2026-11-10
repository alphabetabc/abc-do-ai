# backlog.md

## 待评估

- **echarts-ver-bar Y 轴刻度自动整化**（2026-11-10 记入，暂不实现；来源：task-2026-11-09-041-chart-basics-batch.md「遗留待决策」）
  - 背景：当前实现与源码等价——autoMax 定 max（如 410→500），再强制 `interval = max/(tickCount-1)` = 125，刻度出现 0/125/250/375/500 这类非整刻度；源站真实数据恰好落整所以未暴露。
  - 方案（倾向，即「ECharts 自动整化」）：保留 autoMax 定上限（graphic / 堆叠逻辑不变），去掉强制 interval，让 echarts 自动出整数刻度（0/100/…/500）。
  - 副作用：tickCount 不再精确控制刻度条数（graphic 十字仍用）；属物料化增强，落地时需在 `echarts-ver-bar` 的 spec.md §6 记录该偏离。
  - 注意：graphic 的 topY 仍用 `convertToPixel(max)`（max 保留传给 yAxis，不受影响），`graphics.ts` 无需重算。
  - 其他已否决候选：保持源逻辑只调 mock 数据；自研「漂亮刻度」（max 取整到 1/2/2.5/5×10^n 且被 tickCount-1 整除，410→800 柱子偏矮观感差）。

<!-- 仅当有真实待评估 / 否决项时写入；可含 [REJECTED] 区段 -->
