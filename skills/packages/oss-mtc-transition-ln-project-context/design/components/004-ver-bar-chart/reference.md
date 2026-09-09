# 004 · VerBarChart 技术实现与边界

> 性质：组件设计文档（参考）
> 日期：2026-08-26
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 技术实现

### 1.1 整体架构

```
VerBarChart (index.tsx)                → 单文件组件
├── autoMax(values)                    → Y 轴 max 自动计算（数量级向上取整）
├── makeBarGradient(top, bottom, stops)→ 柱子 LinearGradient（offset 0 顶部）
├── useLayoutEffect + ResizeObserver   → blockWidth 模式下动态计算 grid.right
├── option (useMemo)                   → tooltip / legend / grid / 轴 / series
│   ├── markArea                       → 分类背景底色（仅 sIdx===0，showCategoryBg）
│   └── markLine                       → 分类间虚线分界（x = gIdx + 0.5）
├── drawGraphics(instance)             → graphic 装饰层（4 类元素）
│   ├── 1. Y 轴网格线两端「+」角标     → showCrossMarks
│   ├── 2. 分类块边界十字 + 竖虚线     → showBlockCornerMarks
│   ├── 3. 柱顶白色装饰条              → showBarTopCap
│   └── 4. 分类背景立柱                → showBarBackground
├── onChartReady                       → 首绘 drawGraphics + window resize 监听
└── useEffect (依赖数组)               → 数据/配置变化 → rAF 后重画 graphic
```

### 1.2 渲染流水线

1. `ReactECharts` 挂载，`onChartReady(instance)` 触发：`resize()` → `drawGraphics(instance)` → 注册 `window resize` 监听
2. `option`（useMemo）由 `ReactECharts` 以 `notMerge + lazyUpdate` 应用
3. 任何影响布局的 prop / 数据变化 → useEffect → `requestAnimationFrame` 等一帧（让 ECharts 完成 setOption + layout）→ `drawGraphics` 重画
4. `drawGraphics` 末尾 `setOption({ graphic: { $action:'replace', elements, clip:false } })` 全量替换

### 1.3 graphic 装饰层绘制细节

像素基准（所有元素共用）：

```ts
const topY    = instance.convertToPixel({ yAxisIndex: 0 }, max);  // Y=max 像素
const bottomY = instance.convertToPixel({ yAxisIndex: 0 }, 0);    // Y=0 像素
```

| # | 元素               | 关键算法                                                                                                       |
| - | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| 1 | Y 轴两端「+」角标  | `tickCount` 条网格线，左端 `x=gridLeft(40)` / 右端 `x=chartWidth-gridRight(20)`，每处 2 条 line（横+竖）      |
| 2 | 分类块边界十字     | `blockPx` = 相邻 category 中心像素差（退化用 `blockWidth`）；`leftBoundary = firstCenter - blockPx/2`；N 组 → N+1 条边界，顶部「+」（完整竖线）/ 底部「┴」（仅上半段竖线）；最右边界左移 `RIGHT_MARK_INSET=6px` 防裁剪 |
| 2b| 边界中间竖虚线     | line 元素必须用 `lineDash:[4,4]`（graphic line 不支持 `type:'dashed'`），受 `showBlockCornerMidLine` 控制        |
| 3 | 柱顶白色装饰条     | 每个非零值柱顶画 `rect`，`z:100` 盖在柱上                                                                       |
| 4 | 分类背景立柱       | 按分类中心画满高 rect（topY→bottomY），`z:0` 垫底；宽度：`barBackgroundPad>0` → `min(width上限, 柱宽+2×pad)`，否则 `min(width上限, blockPx×0.9)` |

**为什么用 graphic 而非 markLine/markArea/showBackground**（已论证的最优解）：

- 顶部「+」/ 底部「┴」差异化 shape，声明式 API 表达不了
- `clip:false` 让最右十字溢出 grid 不被裁剪
- 4 类元素共享 topY/bottomY 基准，逻辑内聚
- series 中 `showBackground: false` 显式关闭内置背景，避免双重绘制

### 1.4 图例位置与 grid 联动

| legendPosition | grid.top                          | grid.right                                        |
| -------------- | --------------------------------- | ------------------------------------------------- |
| `'top'`（默认）| `showLegend ? 80 : 20`            | `dynamicGridRight ?? 20`                          |
| `'top-right'`  | `LEGEND_TOP_HEIGHT(30) + gap`     | 同上                                              |
| `'right'`（竖排）| `20`                            | `max(LEGEND_RIGHT_WIDTH(90)+gap, dynamicGridRight)` |

`'top'` 模式下图例文字用全角空格 pad 到等宽（`'　'.repeat(pad)`），视觉对齐。

### 1.5 blockWidth 等宽卡片模式

`useLayoutEffect` + `ResizeObserver` 监听容器宽，计算：

```ts
right = max(0, 容器宽 - 40 - N×blockWidth - blockCornerMarkSize - 3)
```

存入 `dynamicGridRight` state → 驱动 option 的 grid.right → effect 依赖触发 graphic 重画。保证每个分类恰好占 `blockWidth` 像素、右侧十字不被挤出。

### 1.6 堆叠模式（stack）

- 传入 `stack` 后所有 series 同组堆叠
- 柱顶 label 默认关闭（`show: !stack`），避免堆叠中段标签重叠

### 1.7 resize / 清理

| 机制                    | 作用                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| `drawGraphicsRef`       | ref 持有最新 drawGraphics，resize 监听器 add/remove 引用一致     |
| `handleResize`（useCallback, []）| `instance.resize()` 后立即重画 graphic                  |
| `rafRef` + cleanup      | 数据变化的重绘走 rAF；卸载时 cancelAnimationFrame，防止对已 dispose 实例调 convertToPixel |
| 卸载 removeEventListener | 清理 window resize 监听                                         |

---

## 2. 依赖

| 包                  | 版本     | 用途                          |
| ------------------- | -------- | ----------------------------- |
| `echarts`           | `^6.1.0` | 核心 + graphic + LinearGradient |
| `echarts-for-react` | `^3.0.6` | React 封装（`ReactECharts`）  |

无 antd / ahooks 依赖（纯展示组件，无 loading/error 态）。

---

## 3. 边界情况

| 场景                          | 处理                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| 数据全 0                      | `autoMax` 返回 10，图表仍可渲染                                         |
| `convertToPixel` 返回 null    | 各绘制分支 `if (x == null) continue/return`，跳过该元素                 |
| groups 只有 1 个              | `blockPx` 无法由中心差算出 → 退化用 `blockWidth` prop                    |
| 容器尺寸变化                  | window resize → `resize()` + 重画；blockWidth 模式另有 ResizeObserver  |
| 组件卸载时 rAF 未执行         | cleanup 取消 rAF，避免对已 dispose 实例调用 convertToPixel              |
| 最右侧十字被 grid 裁剪        | `clip:false` + `RIGHT_MARK_INSET=6px` 双保险                            |
| ECharts 实例未就绪时重绘      | effect 中 `chartRef.current` 判空；ref 回调只在 `e` 存在时赋值          |
| graphic 元素累积              | `$action:'replace'` 全量替换，不与旧 elements 合并                      |
| 堆叠标签重叠                  | `stack` 传入时柱顶 label 自动关闭                                       |

---

## 4. 已知硬编码常量

| 常量               | 值  | 含义                                       |
| ------------------ | --- | ------------------------------------------ |
| `gridLeft`（绘制） | 40  | 与 option 中 grid.left 一致，但**两处独立写死** |
| `gridRight`（绘制）| 20  | 同上，与 option grid.right 默认值耦合      |
| `RIGHT_MARK_INSET` | 6   | 最右边界十字左移量                         |
| `catGap`           | 0.5 | 对应 series 写死的 `barCategoryGap:'50%'`  |
| `BLOCK_HALF_WIDTH` | 0.36| markArea 分类底色半宽（分类单位）          |

> ⚠️ 绘制用的 gridLeft/gridRight 与 option 的 grid 配置是**两份独立来源**，改动 grid 时需同步两处，否则十字错位。这是当前实现最脆弱的耦合点。

---

## 5. 改进方向（未实施）

- [ ] gridLeft / gridRight / RIGHT_MARK_INSET 抽为常量或 props，消除双源耦合
- [ ] `blockPx` 计算在装饰 2 和 4 中重复，可抽局部函数
- [ ] 重复的 line 元素结构（shape + stroke + lineWidth:1）可抽 helper
- [ ] index.tsx 约 1000 行，可拆 option.ts / graphics.ts
- [ ] Y 轴两端角标的 gridRight 硬编码 20 未跟随 legendPosition='right' 的动态 grid.right

---

## 6. 相关文档

- [概述与使用示例](./index.md)
- [能力构建推导（先代码后文档复盘）](./implementation-notes.md)
- [组件规格 spec](./spec.md)
