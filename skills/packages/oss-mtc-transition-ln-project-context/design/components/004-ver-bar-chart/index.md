# 004 · VerBarChart 大屏竖形分组柱图组件

> 性质：组件设计文档（概述）
> 日期：2026-08-26
> 维护规则：本文件不入 `docs/`、不入 Git

---

## 1. 用途

大屏可视化场景下的 **竖形分组 / 堆叠柱状图** 组件。

基于 `echarts` + `echarts-for-react`，在标准柱图之上通过 ECharts `graphic` API 叠加装饰性矢量图形（十字角标、分界虚线、柱顶装饰条、背景立柱），实现大屏设计稿中 ECharts 声明式配置无法直接表达的视觉效果。

### 1.1 适用场景

- 人员 / 信访大屏中按分类分组的柱图（如"已就业 / 未就业 / 失业" × 4 种人员类型）
- 单系列地市柱图（配合 `blockWidth` 等宽卡片 + 十字分界标记）
- 需要堆叠（`stack`）、纯色柱（`barSolid`）、圆角柱等变体
- 需要图例位于顶部居中 / 右侧竖排 / 顶部右上的布局切换

### 1.2 不适用

- 横向条形图（bar 轴向翻转）
- 需要交互式拖拽 / dataZoom 的分析型图表（本组件定位为展示型）

---

## 2. 文件结构

| 类型     | 路径                     | 说明                                                             |
| -------- | ------------------------ | ---------------------------------------------------------------- |
| 组件入口 | `ver-bar-chart/index.tsx` | `VerBarChart`：option 构建 + `drawGraphics` 装饰层绘制 + resize 同步 |
| 样式     | `ver-bar-chart/index.css` | 容器样式（`.ls-ver-bar-chart`）                                |

> 单文件组件（约 1000 行）：类型定义 / 工具函数 / option 构建 / graphic 绘制共存于 `index.tsx`，未拆分。

---

## 3. Props 设计

```tsx
interface VerBarSeries {
    name: string;
    /** 柱子顶部颜色（同时用作图例纯色图标） */
    colorTop: string;
    /** 柱子底部颜色 */
    colorBottom: string;
    /** 自定义渐变停靠点（offset 0 顶部 / 1 底部），优先于 colorTop/colorBottom */
    gradient?: VerBarGradientStop[];
    /** 每个分类下的值（按 groups 顺序） */
    values: number[];
}

interface VerBarGroup {
    label: string;
}
```

### 3.1 核心 Props 语义

| Prop                    | 类型      | 默认值                 | 说明                                                     |
| ----------------------- | --------- | ---------------------- | -------------------------------------------------------- |
| `series`                | `array`   | 必填                   | 柱子系列（name + 颜色 + 每分类值）                       |
| `groups`                | `array`   | 必填                   | X 轴分类（label）                                        |
| `max`                   | `number`  | 自动（`autoMax`）      | Y 轴最大值；不传则按数量级向上取整                       |
| `unit`                  | `string`  | `'单位:（万）'`        | Y 轴左上角单位文字                                       |
| `tickCount`             | `number`  | `5`                    | Y 轴刻度数（含 0 和 max）                                |
| `showLegend`            | `boolean` | `true`                 | 是否显示图例                                             |
| `legendPosition`        | `string`  | `'top'`                | 图例位置：`'top'` / `'right'`（竖排）/ `'top-right'`     |
| `stack`                 | `string`  | -                      | 堆叠分组名；传入后所有 series 堆叠为一组                 |
| `barWidth`              | `number`  | `24`                   | 柱子宽度（px）                                           |
| `barGap`                | `string`  | `'20%'`                | 同分类内相邻柱间距                                       |
| `barSolid`              | `boolean` | `false`                | `true` 时柱子用纯色 `colorTop`（不渐变）                 |
| `barBorderRadius`       | `number`  | `0`                    | 柱子圆角半径                                             |
| `labelFormatter`        | `fn`      | -                      | 柱顶数值标签格式化                                       |
| `xAxisLabelInterval`    | `number`  | ECharts 默认           | 传 `0` 强制显示所有类目标签                              |
| `xAxisLabelRotate`      | `number`  | `0`                    | X 轴标签旋转角度（长标签用 35）                          |

### 3.2 装饰类 Props（graphic 层）

| Prop                       | 类型      | 默认值                       | 说明                                             |
| -------------------------- | --------- | ---------------------------- | ------------------------------------------------ |
| `showBarTopCap`            | `boolean` | `false`                      | 柱顶白色装饰条                                   |
| `barTopCapColor`           | `string`  | `'rgba(255,255,255,1)'`      | 装饰条颜色                                       |
| `barTopCapSize`            | `object`  | `{width:24, height:2}`       | 装饰条尺寸                                       |
| `showBarBackground`        | `boolean` | `false`                      | 分类背景立柱（graphic 手绘，非 ECharts 内置）    |
| `barBackgroundColor`       | `string`  | `'rgba(108,128,151,0.3)'`    | 背景立柱颜色                                     |
| `barBackgroundOpacity`     | `number`  | `1`                          | 背景立柱不透明度                                 |
| `barBackgroundWidth`       | `number`  | `24`                         | 背景立柱宽度上限                                 |
| `barBackgroundPad`         | `number`  | `0`                          | `>0` 时阴影宽 = 柱宽 + 2×pad（贴柱模式）         |
| `showCrossMarks`           | `boolean` | `false`                      | Y 轴网格线左右两端「+」字角标                    |
| `crossMarkSize`            | `number`  | `4`                          | 角标单边长度                                     |
| `showBlockCornerMarks`     | `boolean` | `false`                      | 分类块边界上下十字 + 竖虚线分界                  |
| `showBlockCornerMidLine`   | `boolean` | `true`                       | 边界中间贯穿竖虚线（关闭仅留上下十字）           |
| `blockCornerMarkSize`      | `number`  | `5`                          | 块边界十字单边长度                               |
| `blockWidth`               | `number`  | -                            | 强制每个分类块固定像素宽（等宽卡片场景）         |
| `showCategoryBg`           | `boolean` | `true`                       | X 轴分类 markArea 底色 + 分类间 markLine 分界线  |

### 3.3 文字类 Props

| Prop              | 类型     | 默认值             | 说明                       |
| ----------------- | -------- | ------------------ | -------------------------- |
| `axisLabelColor`  | `string` | `'rgba(166,190,206,1)'` | 轴刻度文字颜色        |
| `showUnit`        | `boolean`| `true`             | 是否显示单位文字           |
| `unitAlign`       | `string` | `'right'`          | 单位文字水平对齐           |
| `unitGap`         | `number` | `8`                | 单位与 Y 轴间距            |
| `unitTextStyle`   | `object` | -                  | 单位文字自定义样式         |
| `labelFontSize`   | `number` | `12`               | 柱顶标签字号               |

---

## 4. 使用示例

### 4.1 基本分组柱图

```tsx
import VerBarChart from "@/components/large-screen/ver-bar-chart";

function EmploymentChart() {
    return (
        <VerBarChart
            unit="单位:（人）"
            series={[
                { name: "义务兵", colorTop: "#5B8FF9", colorBottom: "#1D4ED8", values: [120, 80, 60] },
                { name: "军士", colorTop: "#5AD8A6", colorBottom: "#0E9F6E", values: [90, 70, 40] },
            ]}
            groups={[{ label: "已就业" }, { label: "未就业" }, { label: "失业" }]}
        />
    );
}
```

### 4.2 等宽地市卡片 + 十字分界（单系列大屏样式）

```tsx
<VerBarChart
    showLegend={false}
    blockWidth={80}
    showBarBackground
    barBackgroundOpacity={0.15}
    showBarTopCap
    showBlockCornerMarks
    series={[{ name: "人口", colorTop: "#00D4FF", colorBottom: "#0077CC", values: [...] }]}
    groups={cities.map((c) => ({ label: c.name }))}
/>
```

### 4.3 堆叠柱图

```tsx
<VerBarChart
    stack="total"
    barBorderRadius={4}
    series={[...]}
    groups={[...]}
/>
```

### 4.4 右侧竖排图例

```tsx
<VerBarChart
    showLegend
    legendPosition="right"
    legendGap={12}
    series={[...]}
    groups={[...]}
/>
```

---

## 5. 相关文档

- [技术实现与边界情况](./reference.md)
- [能力构建推导（先代码后文档复盘）](./implementation-notes.md)
- [组件规格 spec](./spec.md)
