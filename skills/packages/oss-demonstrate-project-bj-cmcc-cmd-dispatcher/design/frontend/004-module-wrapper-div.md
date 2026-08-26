# 模块「外层 wrapper div」约定

> 从 `003-frontend.md` §5.1 拆出，仅在本页按需引用。通用规范见 `../003-frontend.md`。

当一个模块除了主图还要承载子组件（弹窗 / 透明触发 div / 子面板 / 工具栏 / 折线图 等）时，**必须**用「外层 wrapper div」模式集中模块定位。

---

## 1. 核心问题

cmd-dispatcher 大屏采用 `LargeScreenEnv` 缩放容器，所有模块用 `position: absolute` + 设计稿像素坐标定位。当模块只有一张图时，直接 `<img style={{ position: 'absolute', left, top, width, height }}>` 即可；但模块有子组件时，如果子组件也各自声明绝对坐标，会产生：

1. **坐标重复**：子组件必须引用父模块的 `LEFT/TOP/WIDTH` 常量算自己的绝对位置
2. **耦合扩散**：父模块坐标变更时需同步改所有子组件，容易遗漏
3. **无法用 right/top**：子组件只能用 `left = LEFT + WIDTH - SUB_W` 换算，不能用 `right: 0`

wrapper div 模式把模块定位收敛到一个外层 div，子组件用 `position: absolute` + `right/top/left/bottom` 相对 wrapper 定位，彻底解耦。

---

## 2. 推荐结构

### 2.1 模板

```tsx
// modules/<module-name>/index.tsx
const MY_LEVELS: Level[] = [...];
const LEFT = 1878;
const TOP = 87;
const WIDTH = 906;
const HEIGHT = 635;

export const MyModule: React.FC = () => {
    const currentLevel = useCurrentLevel();
    if (!MY_LEVELS.includes(currentLevel)) return null;
    const src = IMG_BY_LEVEL[currentLevel];

    return (
        // ✅ 外层 wrapper div：absolute 定位 + 模块尺寸，集中承载模块定位信息
        <div
            style={{
                position: 'absolute',
                left: LEFT,
                top: TOP,
                width: WIDTH,
                height: HEIGHT,
            }}
        >
            {/* 主图：用 100% 填充 wrapper，不重复模块坐标 */}
            <img
                src={src}
                alt="模块名"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                }}
            />
            {/* 子组件：在 wrapper 内部用 absolute + right/top 相对定位 */}
            <SubComponent />
        </div>
    );
};
```

### 2.2 子组件定位

子组件内的绝对定位元素**不再引用** `LEFT/TOP/WIDTH`，改用相对 wrapper 的偏移：

```tsx
// modules/<module-name>/sub-component.tsx
return (
    <div
        style={{
            position: 'absolute',
            // 父容器右上角：用 right/top 相对 wrapper
            right: 20,
            top: 17,
            width: 100,
            height: 30,
            cursor: 'pointer',
            background: 'transparent',
            zIndex: 5,
        }}
    />
);
```

### 2.3 多子组件叠加

wrapper 内可叠加任意数量子组件，每个用 `position: absolute` + 相对偏移独立定位：

```tsx
<div style={{ position: 'absolute', left: LEFT, top: TOP, width: WIDTH, height: HEIGHT }}>
    <img style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
    {/* 子组件 1：右上角触发热区 */}
    <TriggerDiv />
    {/* 子组件 2：标题栏右侧 tab */}
    <div style={{ position: 'absolute', right: 14, top: 14, display: 'flex', gap: 4 }}>
        {TABS.map(...)}
    </div>
    {/* 子组件 3：图表 */}
    <div style={{ position: 'absolute', left: 50, right: 50, top: 50, bottom: 28 }}>
        <ReactECharts option={option} />
    </div>
    {/* 子组件 4：弹窗（antd Modal 即使 portal 到 body 也不依赖父坐标，wrapper 主要为了 trigger） */}
    <DetailModal />
</div>
```

---

## 3. 实际案例（cmd-dispatcher 已落地）

### 3.1 ✅ network-impact：图 + 透明触发 div + 弹窗

[`modules/network-impact/index.tsx`](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx) —— wrapper div 承载主图 + `FailureReportModal` 子组件：

```tsx
const LEFT = 1878;
const TOP = 87;
const WIDTH = 906;
const HEIGHT = 635;

return (
    <div style={{ position: 'absolute', left: LEFT, top: TOP, width: WIDTH, height: HEIGHT }}>
        <img src={src} alt="网络影响" style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        <FailureReportModal />
    </div>
);
```

[`failure-report-modal.tsx`](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/failure-report-modal.tsx) —— 子组件内 trigger div 用 `right: 20, top: 17` 相对 wrapper：

```tsx
<div
    onClick={() => setOpen(true)}
    style={{
        position: 'absolute',
        right: 20, // ← 相对 wrapper 右边距，不引用 LEFT/WIDTH
        top: 17, // ← 相对 wrapper 顶部
        width: 100,
        height: 30,
        cursor: 'pointer',
        background: 'transparent',
    }}
/>
```

### 3.2 ✅ station-outage：图 + tab + 折线图 + 日期选择器

[`modules/station-outage/index.tsx`](web/pages/bj-cmcc-cmd-dispatcher/modules/station-outage/index.tsx) —— wrapper 内叠加 4 个子元素：

```tsx
return (
    <div style={{ position: 'absolute', left: LEFT, top: TOP, width: WIDTH, height: HEIGHT }}>
        {/* 背景图 */}
        <img src={bgSrc} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} />
        {/* 标题右侧 tab：right: 14, top: 14 相对 wrapper */}
        <div style={{ position: 'absolute', right: 14, top: 14, display: 'flex', gap: 4 }}>
            {TABS.map(...)}
        </div>
        {/* 折线图：left/right/top/bottom 相对 wrapper 撑开 */}
        <div style={{ position: 'absolute', left: 50, right: 50, top: 50, bottom: 28 }}>
            <ReactECharts option={option} />
        </div>
        {/* 自定义档日期选择器：相对 wrapper 右侧 */}
        {range === 'custom' && (
            <div style={{ position: 'absolute', right: 14, top: 50 }}>
                <DatePicker ... />
            </div>
        )}
    </div>
);
```

### 3.3 ✅ service-recovery：图 + 时间轴（非 wrapper 模式的变体）

[`modules/service-recovery/index.tsx`](web/pages/bj-cmcc-cmd-dispatcher/modules/service-recovery/index.tsx) —— 用 `<ServiceRecoveryPanel>` 组件承载主图，`<TimelineHistory>` 作为同级兄弟元素：

```tsx
const TIMELINE_LEFT = LEFT + 40;
const TIMELINE_WIDTH = WIDTH - 90;

return (
    <>
        <ServiceRecoveryPanel left={LEFT} top={TOP} width={WIDTH} height={HEIGHT} src={...} />
        <TimelineHistory width={TIMELINE_WIDTH} style={{ left: TIMELINE_LEFT, top: 872, zIndex: 100 }} />
    </>
);
```

> **变体说明**：当主图由独立 Panel 组件承载（Panel 内部已有自己的 absolute 定位），子组件可直接作为同级兄弟元素，用基于 `LEFT/TOP/WIDTH` 派生的坐标定位。这种模式适用于子组件数量少（1~2 个）且坐标依赖主图尺寸的场景。子组件多时仍推荐 wrapper div。

---

## 4. 好处

| #   | 好处                           | 说明                                                                        |
| --- | ------------------------------ | --------------------------------------------------------------------------- |
| 1   | **共享 positioning context**   | 子组件不再重复声明 `LEFT/TOP/WIDTH` 等模块坐标常量                          |
| 2   | **子组件位置调整不影响主图**   | 触发 div 改成 `right: 0, top: 0` 仅影响子组件，对主图无副作用               |
| 3   | **模块显隐一致**               | `return null` 时 wrapper 一起消失，子组件跟着卸载（无需单独处理子组件显隐） |
| 4   | **支持 right/top/bottom 定位** | 子组件可直接用 `right: 14` 而非 `left: LEFT + WIDTH - 14 - SUB_W`           |
| 5   | **z-index 局部可控**           | 子组件 zIndex 相对 wrapper 内部排序，不污染全局 stacking context            |

---

## 5. 反例（不要这么做）

### 5.1 子组件平铺 + 各自绝对坐标

```tsx
// ❌ 反例：img + 子组件平铺，各自声明 absolute 定位
return (
    <>
        <img
            style={{
                position: 'absolute',
                left: LEFT,
                top: TOP,
                width: WIDTH,
                height: HEIGHT,
            }}
        />
        <SubComponent
            style={{
                position: 'absolute',
                // 子组件必须自己算绝对坐标，重复声明 LEFT/WIDTH
                left: LEFT + WIDTH - TRIGGER_WIDTH,
                top: TOP,
                width: TRIGGER_WIDTH,
                height: TRIGGER_HEIGHT,
            }}
        />
    </>
);
```

**问题**：

-   子组件必须引用 `LEFT/WIDTH` 等父模块常量算自己的位置
-   模块坐标变更时（如调整 `LEFT`）需要同步改子组件，容易遗漏
-   子组件无法直接用 `right/top` 相对父模块定位，必须换算

### 5.2 子组件用 `display: none` 而非 `return null`

```tsx
// ❌ 反例：模块不可见时用 display: none
return <div style={{ position: 'absolute', left: LEFT, top: TOP, display: isvisible ? 'block' : 'none' }}>...</div>;
```

**问题**：模块 DOM 长期占位，17 个模块 × `display: none` = 17 个空壳 DOM 占内存；且 `useRequest` 等副作用 hook 不会因 `display: none` 停止。

**正确做法**：`if (!MY_LEVELS.includes(currentLevel)) return null;`（见 `003-frontend.md` §8）。

---

## 6. 适用场景

| 场景                                | 推荐模式                                                                          | 示例                                        |
| ----------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| 模块只有 1 张图，不需要子组件       | 直接 `<img style={{ position: 'absolute', left, top, width, height }}>`           | 多数纯图片模块                              |
| 模块有图 + 触发按钮 / 透明 div      | **wrapper div**                                                                   | network-impact + FailureReportModal         |
| 模块有图 + 子组件弹窗（antd Modal） | **wrapper div**（Modal 即使 portal 也不依赖父坐标，wrapper 主要为了 trigger div） | network-impact + FailureReportModal         |
| 模块有图 + 子面板 / 工具栏 / 图表   | **wrapper div**                                                                   | station-outage（tab + 折线图 + 日期选择器） |
| 模块有图 + 少量同级兄弟子组件       | **变体**：兄弟元素 + 派生坐标（子组件 ≤ 2 个时可接受）                            | service-recovery + TimelineHistory          |

---

## 7. 坐标约定速查

### 7.1 wrapper 内子组件定位方式

| 子组件位置 | 推荐写法                                     | 不推荐写法                                                                |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 右上角     | `right: 14, top: 14`                         | `left: LEFT + WIDTH - 14 - SUB_W, top: TOP + 14`                          |
| 左上角     | `left: 14, top: 14`                          | `left: LEFT + 14, top: TOP + 14`                                          |
| 撑满留边距 | `left: 50, right: 50, top: 50, bottom: 28`   | `left: LEFT + 50, width: WIDTH - 100, top: TOP + 50, height: HEIGHT - 78` |
| 居中       | `left: '50%', transform: 'translateX(-50%)'` | `left: LEFT + (WIDTH - SUB_W) / 2`                                        |

### 7.2 zIndex 约定

wrapper 内子组件 zIndex 从 1 起递增，不与全局 zIndex 冲突：

| 层级         | zIndex            | 说明       |
| ------------ | ----------------- | ---------- |
| 主图         | 不设（默认 auto） | 最底层     |
| 子面板 / tab | `1` ~ `4`         | 覆盖主图   |
| 触发 div     | `5`               | 需可点击   |
| 弹窗 trigger | `5`               | 同触发 div |

---

## 8. checklist（新增模块时自检）

-   [ ] 模块有子组件时，外层是否用了 wrapper div？
-   [ ] 子组件是否**未引用** `LEFT/TOP/WIDTH` 等父模块常量？
-   [ ] 子组件是否用 `right/top/left/bottom` 相对 wrapper 定位？
-   [ ] 主图是否用 `width: '100%', height: '100%'` 填充 wrapper？
-   [ ] `return null` 是否在 wrapper 外层（卸载时子组件跟着消失）？
-   [ ] zIndex 是否在 wrapper 内局部排序，未污染全局？

---

## 文档元信息

> 版本：v1.1.0
> 日期：2026-08-25（v1.1.0：补充实际案例 network-impact / station-outage / service-recovery + 坐标速查 + checklist；原 v1.0.0 从 003-frontend.md §5.1 拆出）
