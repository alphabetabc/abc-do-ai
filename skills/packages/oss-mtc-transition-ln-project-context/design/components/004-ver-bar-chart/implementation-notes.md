# 004 · VerBarChart 能力构建推导（先代码后文档）

> 性质：组件设计文档（实现推导 / 复盘）
> 日期：2026-08-26
> 维护规则：本文件不入 `docs/`、不入 Git
> 定位：本组件是**先有代码后补文档**的产物。本文反推「如果从需求出发，如何一步步推导出当前实现」，记录每项能力的：需求来源 → 方案选型 → 为什么是这个实现 → 实现要点。供未来同类大屏装饰组件设计时参考。

---

## 1. 全局推导主线

组件的整体演进逻辑可归纳为四个阶段，后面的能力都建立在前一阶段之上：

```
阶段 1：标准柱图基座
  └── ReactECharts + option（tooltip / 轴 / 渐变柱 / 图例）
阶段 2：ECharts 声明式能覆盖的装饰
  └── markArea（分类底色）+ markLine（分类间虚线）
阶段 3：声明式覆盖不了的装饰 → 引入 graphic 自绘层
  └── drawGraphics：十字角标 / 分界线 / 柱顶装饰条 / 背景立柱
阶段 4：像素级布局控制
  └── blockWidth 等宽卡片 → 动态 grid.right → ResizeObserver 联动
```

**核心分界线**：一项装饰需求要不要走 graphic 自绘？判断标准是它是否满足以下任一条：

1. 同类元素在不同位置**形状不同**（如顶部「+」/ 底部「┴」）
2. 需要**溢出 grid 边界**绘制（`clip:false`）
3. 需要与其他装饰**共享像素基准**（topY/bottomY 交叉复用）
4. 宽度需要**像素级钳制**（如 min(上限, blockPx×0.9)）

markLine/markArea 满足不了任一条就走 graphic。

---

## 2. 阶段 1：标准柱图基座

### 2.1 需求

大屏展示「N 个分类 × M 种类型」的分组柱图，视觉风格：深色背景、渐变柱、白色柱顶数值、虚线坐标轴。

### 2.2 关键实现决策

| 决策点            | 选择                                                 | 理由                                                                                                                                                    |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 渲染库            | `echarts-for-react`（ReactECharts）                  | 仓库既有约定（002-ec-map 同款），D1 已拍板 ECharts 6.1.0                                                                                                |
| option 更新模式   | `notMerge + lazyUpdate`                              | props 驱动全量替换 option，避免残留；lazyUpdate 避免高频 setOption                                                                                      |
| 柱子渐变          | `makeBarGradient` 工具函数                           | 用 `echarts.graphic.LinearGradient(0,0,0,1, stops)` 对象而非字符串写法，TS 类型友好；支持自定义停靠点 `gradient` 优先、退化到 colorTop/colorBottom 两段 |
| Y 轴 max          | `autoMax` 数量级向上取整                             | 保证刻度值是"整"数（如 847 → 900 → 1000），大屏观感规整；全 0 退化到 10                                                                                 |
| 刻度密度          | `tickCount`（默认 5）+ `interval: max/(tickCount-1)` | 刻度数与 max 解耦，均分网格线                                                                                                                           |
| 轴线 / 网格线风格 | `type:'dashed'` + `AXIS_LINE_COLOR` 半透明           | 这里的 dashed 是**轴配置**支持的，与 graphic line 不支持 dashed 是两回事（见 §4.3 的坑）                                                                |

### 2.3 后来补的能力（按需求追加）

| Prop                        | 解决的问题                                                       |
| --------------------------- | ---------------------------------------------------------------- |
| `stack`                     | 堆叠需求；同时柱顶 label `show: !stack` 自动关闭防重叠           |
| `barSolid`                  | 设计稿有的柱子是纯色非渐变；图例图标也用 colorTop 纯色，天然一致 |
| `barBorderRadius`           | 圆角柱变体                                                       |
| `legendPosition`            | 三种图例布局；top 模式用全角空格 pad 文字等宽对齐（CJK 场景）    |
| `xAxisLabelRotate/Interval` | 地市名过长时斜排 / 强制全显                                      |
| `labelFormatter`            | 数值格式化（如万人单位换算）                                     |

**推导要点**：这些 prop 全是「展示型变体开关」——不改数据流、不改坐标计算，只映射到 option 字段，所以按需增量追加即可，没有架构成本。

---

## 3. 阶段 2：声明式装饰（markArea / markLine）

### 3.1 需求

每个 X 轴分类下有一块淡淡的底色矩形，分类之间用竖虚线分隔。

### 3.2 方案

用 series 的 `markArea`（底色）+ `markLine`（分界虚线），且**只在第一个 series 上挂**（`sIdx === 0`），避免 M 个 series 重复绘制：

```ts
markArea: { silent: true, data: groups.map((_, i) => [
    { xAxis: i - BLOCK_HALF_WIDTH },   // 0.36，分类单位
    { xAxis: i + BLOCK_HALF_WIDTH },
])},
markLine: { symbol: 'none', label:{show:false},
    data: groups.slice(0, -1).map((_, i) => ({ xAxis: i + 0.5 })) },
```

### 3.3 实现要点与权衡

- **坐标用分类索引而非像素**：markArea/markLine 接受 `xAxis: 数值`（类目轴上是索引±偏移），随 resize 自动重算，零维护
- `BLOCK_HALF_WIDTH = 0.36` 是**估算值**（典型 500px 容器 / 3 分类 → 每分类留 ~20px 空白），容器宽度差异大时会偏
- 只画 N-1 条 markLine（分类之间），两端不画——与阶段 3 的边界十字（N+1 条）互补

**为什么没继续用 markLine 做后续装饰**：见 §1 判断标准，后面需求全部踩线。

---

## 4. 阶段 3：graphic 自绘层（drawGraphics）

### 4.1 需求来源（4 个装饰，逐个推导）

#### 装饰 1：Y 轴网格线两端的「+」字角标

- **需求**：设计稿要求每条水平网格线左右两端有技术图纸风格的坐标角标
- **为什么不用 markLine**：markLine 的 symbol 只能整体放在线端，无法"线两端各一个独立小十字"；且十字要**越过 grid 边界向外延伸**（`clip:false`），markLine 受 grid 裁剪
- **实现**：`gridLeft=40`（与 option grid.left 对齐）和 `gridRight=20` 处，每条网格线画 2 条短 line（横 half + 竖 half），tick 值 `(max × i)/(tickCount-1)` 经 `convertToPixel` 转像素

#### 装饰 2：分类块边界「顶部+ / 底部┴」十字 + 中间竖虚线

- **需求**：地市块卡片效果——每两个地市分界处，上下各一个白色十字，中间虚线连接
- **为什么不用 markLine**：
    - 顶部是完整「+」、底部是「┴」（去掉下半段竖线防超出底边）——**同类元素异形**，声明式表达不了
    - 最右侧边界要**左移 6px**（`RIGHT_MARK_INSET`）防 grid 边缘像素裁剪——逐元素位置微调
- **实现三步**：
    1. `blockPx` = 相邻 category 中心像素差（`convertToPixel({xAxisIndex:0}, 1) - (…, 0)`）；只有 1 个分类时退化用 `blockWidth` prop
    2. `leftBoundary = firstCenter - blockPx/2` —— **反推**而非写死，保证最左十字恰好落在 Y 轴竖线上
    3. 循环 `i = 0..groups.length`（N+1 条边界），每条画顶部十字 + 底部十字 + 中间虚线
- **用 category 中心差而非 blockWidth prop 反推的原因**：当 grid.right 因图例 / blockWidth 模式动态变化时，ECharts 实际分类间距会变，实测像素差保证十字始终精准落在边界上

#### 装饰 2b：中间竖虚线的 dashed 坑

- graphic 的 line 元素**不支持** `style.type: 'dashed'`（与轴配置不同），必须用 `lineDash: [4, 4]` 数组。这是实现时踩过的坑，已写注释固化
- `showBlockCornerMidLine` prop（默认 true）控制是否画中间线——某些设计稿只要上下十字

#### 装饰 3：柱顶白色装饰条

- **需求**：单系列柱图柱顶一条白色细矩形，视觉强调
- **实现**：遍历 series × groups 的非零值，`convertToPixel` 得柱顶中心，画 `rect`（`z:100` 盖在柱子上）
- **为什么不用 label.backgroundColor**：装饰条尺寸独立于文字，且非零值才画，label 做不到条件隐藏自身背景

#### 装饰 4：分类背景立柱

- **需求**：每个分类一块满高（Y=0 到 Y=max）半透明"底盘"立柱
- **为什么不用 ECharts 内置 `showBackground`**：
    1. 内置背景按**每根柱子**绘制（M 根柱 M 块背景），需求是**每分类一块**
    2. 高度只能跟随柱子，不能满高
    3. 宽度无法做 `min(上限, blockPx×0.9)` 像素钳制（保证不跨分界线、相邻留缝）
- **实现**：按分类中心画满高 rect（`z:0` 垫底），高度直接复用 topY/bottomY（**与装饰 2 共享基准**，这是 graphic 内聚优势）
- **宽度双模式**（`barBackgroundPad`）：
    - `pad = 0`（默认）：`min(barBackgroundWidth, blockPx × 0.9)` —— 占分类块 90%，通用大屏底盘
    - `pad > 0`：`min(barBackgroundWidth, 柱宽 + 2×pad)` —— 贴柱阴影模式（身份类型组件需求），柱宽估算 `barWidth` 或 `blockPx × (1 - catGap)`（对应写死的 `barCategoryGap:'50%'` → catGap=0.5）
- series 中显式 `showBackground: false` 并留注释，防止后人误开造成双重绘制

### 4.2 drawGraphics 的生命周期（这是最容易出 bug 的部分）

推导过程（每条都对应一个真实问题）：

| 问题                                    | 解法                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| graphic 何时画？坐标像素何时可用？      | `onChartReady` 首绘一次；后续任何布局相关变化走 useEffect                                         |
| setOption 合并导致旧 elements 累积      | `graphic: { $action: 'replace', elements, clip:false }` 全量替换                                  |
| effect 触发时 ECharts 还没完成新 layout | `requestAnimationFrame` 等一帧再画                                                                |
| 组件卸载时 rAF 回调仍执行               | `rafRef` 记录，cleanup 里 `cancelAnimationFrame`（convertToPixel 在已 dispose 实例上会抛错/卡顿） |
| window resize 后十字错位                | `handleResize`：`instance.resize()` 后**立即**重画 graphic                                        |
| resize 监听器泄漏                       | `drawGraphicsRef` 持最新函数引用 + `useCallback([])` 保证 add/remove 同引用                       |
| ReactECharts ref 时序                   | ref 回调里 `if (e)` 才取 `getEchartsInstance()`                                                   |

**核心认知**：graphic 元素是**一次性像素快照**，不随 ECharts 内部 layout 自动更新。所以所有能改变像素布局的输入（数据、max、图例位置、dynamicGridRight、容器尺寸）都要触发重画。effect 依赖数组就是这份"像素布局输入清单"。

### 4.3 方案选型结论（对比记录）

| 方案                 | 结论     | 关键缺陷                                     |
| -------------------- | -------- | -------------------------------------------- |
| graphic 自绘（现状） | **最优** | —（维护成本：需手动管理重绘时机）            |
| markLine / markArea  | 否       | 异形元素、clip 控制、像素钳制都做不了        |
| custom renderItem    | 否       | 装饰硬塞数据系列，语义错位，复杂度不降反增   |
| SVG 叠加层           | 否       | 自管 resize / 坐标同步 / z-index，工作量翻倍 |

---

## 5. 阶段 4：blockWidth 等宽卡片模式

### 5.1 需求

地市人口图要求**每个地市卡片严格等宽**（如 80px），不随容器拉伸均分；且最右侧十字不能被裁剪。

### 5.2 推导

问题：ECharts grid 默认把绘图区拉伸到容器宽，分类间距 = 容器宽/N，不等于 blockWidth。

思路：**反向挤压 grid.right**。固定 grid.left=40，让 `N × blockWidth` 恰好占满剩余绘图区：

```ts
right = max(0, 容器宽 - 40 - N×blockWidth - blockCornerMarkSize - 3)
//                                              └ 右侧留十字右半边 ┘└ 呼吸空间 ┘
```

链条：容器宽变化 → ResizeObserver（useLayoutEffect 内）→ `setDynamicGridRight` → option grid.right 变 → ECharts layout 变 → effect 依赖 dynamicGridRight 触发 graphic 重画。

### 5.3 联动矩阵

`dynamicGridRight` 与图例位置叠加时的 grid.right 取值：

```
legendPosition='right'：max(LEGEND_RIGHT_WIDTH + legendGap, dynamicGridRight ?? 0)
其余：                  dynamicGridRight ?? 20
```

（图例也要占右侧空间，两者取大者，避免块或十字被图例挤出。）

---

## 6. 遗留耦合与已知脆弱点

先代码后文档的典型产物——以下是当前实现中「当时没抽象、事后看应该抽象」的点：

| 脆弱点                                                                 | 影响                                                                                                                                   | 建议修法                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 绘制侧 `gridLeft=40`/`gridRight=20` 与 option 的 grid 配置**双源写死** | 改 option grid 不改绘制 → Y 轴角标错位；`legendPosition='right'` 时 option 的 grid.right 动态变大而绘制侧仍是 20，右侧角标会画进图例区 | 抽常量 / props，或用 `convertToPixel({gridLayoutInfo})` 反查真实 grid 边界 |
| `catGap=0.5` 镜像 series 写死的 `barCategoryGap:'50%'`                 | 改 barCategoryGap 忘改 catGap → 贴柱阴影宽度算错                                                                                       | 抽为共享常量                                                               |
| `blockPx` 计算在装饰 2 / 4 重复                                        | 两处逻辑漂移风险                                                                                                                       | 抽局部函数                                                                 |
| index.tsx 单文件 ~1000 行                                              | 阅读 / review 成本高                                                                                                                   | 拆 option.ts / graphics.ts                                                 |

---

## 7. 未来同类装饰组件的设计模板

从本组件复盘出的可复用流程：

1. **先问声明式能不能做**：对照 §1 的 4 条判断标准，全不踩线 → markLine/markArea，踩线 → graphic
2. **建立像素基准**：所有 graphic 元素统一从 `convertToPixel` 推导（topY/bottomY/firstCenter/blockPx），**禁止写死像素位置**（反推边界用"中心 - 半宽"模式）
3. **定义重绘触发清单**：列出所有影响像素布局的输入，作为 effect 依赖；resize 必须走"instance.resize() 后立即重画"
4. **生命周期三件套**：`$action:'replace'` 全量替换 + rAF 延后一帧 + 卸载 cancelAnimationFrame
5. **溢出需求**：`clip:false`，并给边界元素留 inset 防像素级裁剪
6. **graphic dashed**：只用 `lineDash:[x,y]`，不用 `type:'dashed'`
7. **z 分层约定**：背景垫底层 z:0，柱上装饰 z:100，中间元素不设 z

---

## 8. 相关文档

- [概述与使用示例](./index.md)
- [技术实现与边界](./reference.md)
- [组件规格 spec](./spec.md)
