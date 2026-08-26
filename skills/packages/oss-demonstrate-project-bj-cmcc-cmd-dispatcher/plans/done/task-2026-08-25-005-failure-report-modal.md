# Task 005 — 故障分析报告弹窗（图片兜底）

> **前置**：
>
> -   [done/task-2026-08-24-001-module-init.md](../done/task-2026-08-24-001-module-init.md) 骨架已落地
> -   [done/task-2026-08-24-002-03-map-detail-modal.md](../done/task-2026-08-24-002-03-map-detail-modal.md) 框选弹窗已完工（图片弹窗 + 智能避让 + street 层级约束，本 task 复用其模式）
>
> **关联文档**：
>
> -   设计稿：[../../design/001-pm-output.md](../../design/001-pm-output.md) §场景 1「故障报告」
> -   原始需求：[../../design/000-pm-input-spec.md](../../design/000-pm-input-spec.md) (1)「点击按钮可查询对应维度的故障分析报告」
> -   会议纪要：[../../design/000-pm-input-meeting.md](../../design/000-pm-input-meeting.md) 提及"分公司、区、街道三级查询"
> -   前端规范：[../../design/003-frontend.md](../../design/003-frontend.md)
> -   当前状态：[../../status/current.md](../../status/current.md)
>
> **日期**：2026-08-25
> **状态**：已完成（代码 + 文档已落地，待 PM review）

---

## 一、目标

落地场景 1 中的"故障分析报告"交互：在网络影响模块右上角放置"故障分析报告"透明入口（仅 `cursor: pointer`，跟随模块显隐），点击后弹出 antd `Modal`：

-   弹窗内容是 PM 提供的背景图 + 级联选择器 + 内容图组合：
    -   **背景图**：`故障分析报告弹窗-背景.png`（作为弹窗内容容器）
    -   **右上角级联选择**：antd `Cascader`，支持选择 `分公司 → 区 → 街道`（PM 已确认示例：`城区三分公司 → 石景山区 → 广宁`），输入框自动展示路径 `城区三分公司 / 石景山区 / 广宁`
    -   **内容图**：选中路径命中内置映射时（如 `/城区三分公司/石景山区/广宁`）切换到对应内容图，否则只显示背景
-   **数据兜底**：本 task 不接入真实接口，级联选项使用 mock 数据（数据由本 task 编写，3 个分公司 + 若干区/街道的最小可用集）。

实现 PM 标书 (1) 中"点击按钮可查询对应维度的故障分析报告"的验收点。

> **明确"图片兜底"**：本 task 不将 5 个结构化字段（全阻物理站 / 受影响物理站 / 资源数 / 退服占比 / RRC 最大连接数）拆解为 React 组件。弹窗内容是 PM 提供的整图（1 张背景 + 3 张内容），结构化拆解留待后续真实接口接入时再做。

---

## 二、背景 / 现状盘点

### 2.1 PM 原始需求（标书 (1)）

> 大屏支持地图呈现退服分布、物资、车辆、人员位置等多种图层呈现，支持按照分公司-行政区-街道乡镇-社区村庄-物理站-逻辑站逐级下钻数据统计呈现、支持查询不同空间维度的故障分析报告、支持查询不同时间粒度的重要指标趋势。

要点：

-   **可查询范围**：分公司 / 区 / 街道 三级（**未要求**社区 / 物理站 / 逻辑站层级）
-   **触发方式**：点击按钮（无具体 UI 形态要求，由前端自行决定）

### 2.2 现状盘点

| 项                   | 状态                                                                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 故障报告入口         | ❌ **完全未实现**（grep "故障" 在 `web/pages/bj-cmcc-cmd-dispatcher/` 0 命中）                                                                                                                                                                                                      |
| 故障分析报告图片资源 | ✅ **PM 已出图**，4 张位于 `public/static/images/bj-cmcc-cmd-dispatcher/`：<br>① `故障分析报告弹窗-背景.png`（弹窗背景）<br>② `故障分析报告弹窗-城区三分公司.png`（公司级内容图）<br>③ `故障分析报告弹窗-石景山.png`（区级内容图）<br>④ `故障分析报告弹窗-广宁.png`（街道级内容图） |
| 框选弹窗（参考实现） | ✅ [map-detail-modal.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-detail-modal.tsx) 模式可复用                                                                                                                                                                             |
| antd Modal           | ✅ 已在项目内引用，见 [LargeScreenEnv.tsx](web/components/large-screen/LargeScreenEnv.tsx#L2) 等处                                                                                                                                                                                  |
| antd Cascader        | ✅ antd 内置组件，项目内尚无直接引用（不影响引入，本 task 首次落地）；**输入框自带路径展示，无需额外 Breadcrumb**                                                                                                                                                                   |

### 2.3 可复用资产

-   **背景图作为弹窗容器**：弹窗整体内容用 `故障分析报告弹窗-背景.png` 作容器（背景图 / 边框），其上叠加 Cascader + 路径命中内容图，避免再用 antd 默认白色弹窗样式覆盖 PM 设计。
-   **层级判断**：`useCurrentLevel()`（[store/index.ts](web/pages/bj-cmcc-cmd-dispatcher/store/index.ts)）已可用；本 task 仅在 `company` / `district` / `street` 三级显示触发 div。
-   **状态隔离**：故障报告弹窗开关、级联选中路径均用本地 `useState`（模态框作用域），不进 store；与框选弹窗的 `modalOpen` 互不耦合。

### 2.4 与已有"弹窗"概念的关系

| 弹窗                 | 触发                           | 内容                                                     | 层级                                 | 实现方式                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------ | -------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 框选区域详情弹窗     | select 模式选中 shape          | `地图弹窗-1.png`                                         | street                               | 独立模块 [map-detail-modal.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/map/map-detail-modal.tsx)                                                                                                                                              |
| **故障分析报告弹窗** | **点击网络影响右上角透明 div** | **背景图 + Cascader（自带路径展示） + 路径命中后内容图** | 跟随网络影响模块（`MY_LEVELS` 5 级） | 抽出至 [network-impact/failure-report-modal.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/failure-report-modal.tsx)，由 [network-impact/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx) 引入并渲染 |

两个弹窗实现路径完全不同，互不耦合，可同时存在。

---

## 三、落地方案

### 3.1 文件改动

> **简化说明**：把触发 div + antd Modal/Cascader + 级联数据全部抽出至 `modules/network-impact/failure-report-modal.tsx`，由 `network-impact/index.tsx` 引入并渲染。无需改动 `store/index.ts`、`render.tsx`。Cascader 自带路径展示，不需要额外 Breadcrumb。

| 文件                                                                               | 类型   | 改动                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/failure-report-modal.tsx` | 新增   | 抽出组件：`FailureReportModal`，内含触发 div（透明 + 手型，定位网络影响右上角）+ antd `Modal`（背景图容器 + Cascader + 路径命中内容图）+ mock 级联数据与图片映射 |
| `web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx`                | 改     | 删掉原内联的触发 div / Modal / 级联数据；改为 `import { FailureReportModal } from './failure-report-modal'` 后渲染 `<FailureReportModal />`                      |
| `public/static/images/bj-cmcc-cmd-dispatcher/故障分析报告弹窗-背景.png`            | 已存在 | 弹窗背景图（PM 已出图）                                                                                                                                          |
| `public/static/images/bj-cmcc-cmd-dispatcher/故障分析报告弹窗-城区三分公司.png`    | 已存在 | 公司级内容图（路径 `/城区三分公司` 命中）                                                                                                                        |
| `public/static/images/bj-cmcc-cmd-dispatcher/故障分析报告弹窗-石景山.png`          | 已存在 | 区级内容图（路径 `/城区三分公司/石景山区` 命中）                                                                                                                 |
| `public/static/images/bj-cmcc-cmd-dispatcher/故障分析报告弹窗-广宁.png`            | 已存在 | 街道级内容图（路径 `/城区三分公司/石景山区/广宁` 命中）                                                                                                          |
| `status/current.md`                                                                | 改     | 资源表追加 4 张图片；网络影响模块说明追加故障报告能力                                                                                                            |
| `status/checklist.md`                                                              | 改     | 追加本 task 收口自检段                                                                                                                                           |

### 3.2 触发按钮位置（PM 已确认）

PM 已明确：**故障报告入口是网络影响模块（[network-impact/index.tsx](web/pages/bj-cmcc-cmd-dispatcher/modules/network-impact/index.tsx)）右上角的一个透明 div**，仅 `cursor: pointer`，无任何视觉元素，点击即出弹框。

> 网络影响模块定位：`left: 1878, top: 87, width: 906, height: 635`（见 `network-impact/index.tsx` 第 6-9 行）。
> 触发 div 锚点改用 wrapper 相对定位：`right: 0, top: 0`（详见 §3.4 实现）。等价绝对坐标：`left: 1878 + 906 - 100 = 2684, top: 87`。

### 3.3 store 扩展

**不再扩展 store**：弹窗开关与级联选中都是 `FailureReportModal` 组件内的 `useState`，作用域仅在该组件内部，不影响其它模块。

### 3.4 抽出 `FailureReportModal` 组件 + 网络影响模块接入

#### 3.4.1 新增 `modules/network-impact/failure-report-modal.tsx`

```tsx
// modules/network-impact/failure-report-modal.tsx（新增）
import { useState } from 'react';
import { Modal, Cascader } from 'antd';

import { constants } from '@/common/constants';

// 触发 div 尺寸（锚定在父模块容器右上角，父容器由 modules/network-impact/index.tsx 提供）
const TRIGGER_WIDTH = 100;
const TRIGGER_HEIGHT = 30;

// Cascader 默认选中路径：打开弹窗即命中公司级内容图
const DEFAULT_CASCADE_PATH: string[] = ['城区三分公司'];

// 弹窗背景图（PM 提供）
const FAILURE_REPORT_BG = '故障分析报告弹窗-背景.png';

/**
 * 故障分析报告：级联选项 mock 数据
 * 真实接口未接入，按 PM 提供的 3 张内容图反推最小可用结构：
 * - 城区三分公司 → 石景山区 → 广宁（PM 主演示路径，覆盖 3 张内容图）
 * - 同公司下补门头沟区等兄弟节点；另补 2 个分公司作为级联完整性
 */
interface CascaderNode {
    value: string;
    label: string;
    children?: CascaderNode[];
}

const FAILURE_REPORT_CASCADE: CascaderNode[] = [
    {
        value: '城区三分公司',
        label: '城区三分公司',
        children: [
            {
                value: '石景山区',
                label: '石景山区',
                children: [
                    { value: '广宁', label: '广宁街道' },
                    { value: '八宝山', label: '八宝山街道' },
                    { value: '老山', label: '老山街道' },
                ],
            },
            {
                value: '门头沟区',
                label: '门头沟区',
                children: [
                    { value: '大峪', label: '大峪街道' },
                    { value: '城子', label: '城子街道' },
                ],
            },
        ],
    },
    {
        value: '城区二分公司',
        label: '城区二分公司',
        children: [
            {
                value: '海淀区',
                label: '海淀区',
                children: [
                    { value: '中关村', label: '中关村街道' },
                    { value: '海淀街道', label: '海淀街道' },
                ],
            },
        ],
    },
    {
        value: '城区一分公司',
        label: '城区一分公司',
        children: [
            {
                value: '朝阳区',
                label: '朝阳区',
                children: [{ value: '建国门', label: '建国门街道' }],
            },
        ],
    },
];

/**
 * 选中路径 → 内容图映射（key 为 "/" + 各级 value 拼接）。
 * 仅 PM 提供 3 张内容图的路径有命中，其余路径不展示内容图（仅显示背景）。
 */
const CONTENT_IMG_BY_PATH: Record<string, string> = {
    '/城区三分公司': '故障分析报告弹窗-城区三分公司.png',
    '/城区三分公司/石景山区': '故障分析报告弹窗-石景山.png',
    '/城区三分公司/石景山区/广宁': '故障分析报告弹窗-广宁.png',
};

/**
 * 故障分析报告弹窗组件
 * - 透明触发 div：锚定父容器（网络影响模块）右上角，纯透明 + cursor: pointer
 * - antd Modal：背景图容器 + 右上角 Cascader（自带路径展示）+ 路径命中后切换内容图
 * - 状态全部组件内 useState，不进 store
 *
 * 注：父容器由 modules/network-impact/index.tsx 提供（absolute 定位 + 模块尺寸），
 *     本组件 trigger div 用 right/top 相对父容器定位，无需重复模块坐标常量。
 *     是否渲染由父模块的 MY_LEVELS 决定，组件内部不再做层级判断。
 */
export const FailureReportModal: React.FC = () => {
    const [open, setOpen] = useState(false);
    // Cascader 选中路径：默认 DEFAULT_CASCADE_PATH，打开弹窗即命中公司级内容图
    const [cascadePath, setCascadePath] = useState<string[]>(DEFAULT_CASCADE_PATH);

    const pathKey = '/' + cascadePath.join('/');
    const contentImg = CONTENT_IMG_BY_PATH[pathKey];

    return (
        <>
            {/* 触发 div：锚定父容器（网络影响模块）右上角，无层级判断 */}
            <div
                onClick={() => setOpen(true)}
                title="点击查看故障分析报告"
                style={{
                    position: 'absolute',
                    // 父容器右上角：(right: 0, top: 0)
                    right: 0,
                    top: 0,
                    width: TRIGGER_WIDTH,
                    height: TRIGGER_HEIGHT,
                    cursor: 'pointer',
                    // 透明：仅作为点击热区，不展示任何视觉元素
                    background: 'transparent',
                    zIndex: 5,
                }}
            />
            {/* 故障分析报告 antd Modal：背景图 + 右上角 Cascader（Cascader 输入框自带路径展示）+ 路径命中内容图 */}
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                // 关闭完成后重置为默认路径，下次打开仍命中公司级内容图
                afterClose={() => setCascadePath(DEFAULT_CASCADE_PATH)}
                footer={null}
                // 不显示 antd 默认标题栏与遮罩白底（PM 设计稿由背景图承载视觉）
                title={null}
                width={960}
                centered
                destroyOnClose
                styles={{
                    body: { padding: 0, background: 'transparent' },
                    content: { background: 'transparent', boxShadow: 'none' },
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        minHeight: 600,
                        // 背景图作为整个弹窗容器（边框/装饰/底色）
                        backgroundImage: `url(${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/${FAILURE_REPORT_BG})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '100% 100%',
                    }}
                >
                    {/* 右上角级联选择（Cascader 输入框自带路径展示，无需额外 Breadcrumb） */}
                    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
                        <Cascader
                            options={FAILURE_REPORT_CASCADE}
                            value={cascadePath}
                            onChange={(v) => setCascadePath(v as string[])}
                            placeholder="请选择分公司 / 区 / 街道"
                            changeOnSelect
                            expandTrigger="hover"
                            style={{ width: 280 }}
                        />
                    </div>

                    {/* 内容图：路径命中 CONTENT_IMG_BY_PATH 时渲染 */}
                    {contentImg && (
                        // paddingTop: 75 给 Cascader 与内容图之间留白，避免覆盖
                        <div style={{ padding: '75px 24px 24px', position: 'relative', zIndex: 2 }}>
                            <img
                                src={`${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/${contentImg}`}
                                alt={`故障分析报告-${pathKey}`}
                                style={{ width: '100%', display: 'block' }}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default FailureReportModal;
```

#### 3.4.2 改造 `modules/network-impact/index.tsx`

```tsx
// modules/network-impact/index.tsx（完整替换）
import { constants } from '@/common/constants';

import { useCurrentLevel, type Level } from '../../store';
import { FailureReportModal } from './failure-report-modal';

const MY_LEVELS: Level[] = ['city', 'company', 'district', 'street', 'community'];
const LEFT = 1878;
const TOP = 87;
const WIDTH = 906;
const HEIGHT = 635;

/**
 * 网络影响（city ~ community 层共用）
 * 图片型模块：按层级切换 UI 出图
 *
 * 层级 → 图片映射：
 * - city     → 网络影响.png
 * - company  → 网络影响-2.png
 * - district → 网络影响-3.png
 * - street   → 网络影响-4.png
 * - community→ 网络影响-5.png
 *
 * 故障分析报告弹窗已抽出至 './failure-report-modal'，本模块直接渲染即可。
 *
 * constants.IMAGE_PATH 在运行时才初始化完成，用 getter 延迟取值
 */
const NETWORK_IMPACT_IMG: Record<Level, { get src(): string }> = {
    city: {
        get src() {
            return `${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/网络影响.png`;
        },
    },
    company: {
        get src() {
            return `${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/网络影响-2.png`;
        },
    },
    district: {
        get src() {
            return `${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/网络影响-3.png`;
        },
    },
    street: {
        get src() {
            return `${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/网络影响-4.png`;
        },
    },
    community: {
        get src() {
            return `${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/网络影响-5.png`;
        },
    },
    // 以下层级本模块不展示，占位以满足 Record<Level, ...>
    station: {
        get src() {
            return '';
        },
    },
    logical: {
        get src() {
            return '';
        },
    },
};

export const NetworkImpactModule: React.FC = () => {
    const currentLevel = useCurrentLevel();
    if (!MY_LEVELS.includes(currentLevel)) return null;
    const src = NETWORK_IMPACT_IMG[currentLevel].src;

    return (
        // 外部 wrapper div：absolute 定位 + 模块尺寸；img 用 100% 填充；
        // <FailureReportModal /> 中的触发 div 用 right/top 相对此 wrapper 定位，
        // 避免重复声明 LEFT/TOP/WIDTH 坐标常量。
        <div
            style={{
                position: 'absolute',
                left: LEFT,
                top: TOP,
                width: WIDTH,
                height: HEIGHT,
            }}
        >
            <img
                src={src}
                alt="网络影响"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                }}
            />
            <FailureReportModal />
        </div>
    );
};

export default NetworkImpactModule;
```

要点：

-   **组件拆分清晰**：`FailureReportModal` 自包含所有故障报告逻辑（触发 div、Modal、Cascader、mock 级联数据），`NetworkImpactModule` 只剩网络影响图片渲染 + 引入弹窗。
-   **wrapper div 模式（**[design/003-frontend.md](../../design/003-frontend.md) §5.1 新增**）**：`NetworkImpactModule` 外层包一个 absolute 定位的 `div`（left/top/width/height = 模块坐标），`<img>` 用 `width:100%/height:100%` 填充，子模块（如触发 div）改用 `right/top` 相对 wrapper 定位。**好处**：① 子模块不重复模块坐标常量；② 子模块调整位置不影响主图尺寸。
-   **不扩展 store**：`open` 与 `cascadePath` 都是 `FailureReportModal` 内 `useState`；关闭时通过 `afterClose` 重置 `cascadePath` 为 `DEFAULT_CASCADE_PATH = ['城区三分公司']`，下次打开仍命中公司级内容图。
-   **默认选中 `城区三分公司`**：打开弹窗即命中 `CONTENT_IMG_BY_PATH['/城区三分公司']`，无需先选路径就能看到报告内容，提升 Demo 体验。
-   **无层级守卫**：组件内部不再判断层级（PM 指示"模块能显示就都显示"），跟随父模块 `MY_LEVELS`（city/company/district/street/community 5 级）一起显隐。
-   **级联数据**：3 个分公司 + 若干区/街道；真实接口接入前先以 mock 数据驱动 demo。
-   **路径命中映射**：`CONTENT_IMG_BY_PATH` 仅记录 PM 已出图的 3 条路径，其它路径只显示背景（不渲染 `<img>`）。
-   **Modal 视觉**：用 PM 背景图作为容器，因此关闭 antd 默认标题栏 / 关闭按钮 / body padding（`title={null}`、`styles.body.padding=0`），避免覆盖 PM 设计稿。关闭走"点击遮罩 / 按 ESC"。
-   **内容图 padding**：内容图容器 `padding: '75px 24px 24px'`，顶部 75px 给 Cascader 与内容图之间留白，避免覆盖。
-   **Modal 行为参考**：用 antd `Modal`（项目已有引用，见 [LargeScreenEnv.tsx](web/components/large-screen/LargeScreenEnv.tsx#L2)）。

### 3.5 智能避让（可选，review 时定）

弹窗使用 antd `Modal` 的 `centered` 居中显示，位置由 antd 默认决定。是否需要"根据其他 UI 元素自动避让"取决于 PM 录屏效果，**先简单实现**（沿用 antd 默认居中），review 时按需扩展。

---

## 四、交互流程

### 4.1 打开弹窗

```
1. currentLevel ∈ MY_LEVELS（city / company / district / street / community）
2. 网络影响模块渲染 → 内部 <FailureReportModal /> 跟随渲染（触发 div 跟着出现）
3. click(触发 div) → setOpen(true)
4. antd Modal 打开：背景图容器 + 右上角 Cascader 默认选中 `['城区三分公司']` → 即时命中公司级内容图
```

### 4.2 选择级联

```
1. click(Cascader) → 弹出多级下拉
2. 选择 城区三分公司 → cascadePath = ['城区三分公司'] → Cascader 输入框显示 城区三分公司；路径命中 → 显示 公司级内容图
3. 选择 石景山区 → cascadePath = ['城区三分公司', '石景山区'] → 输入框显示 城区三分公司/石景山区；路径命中 → 显示 区级内容图
4. 选择 广宁 → cascadePath = ['城区三分公司', '石景山区', '广宁'] → 输入框显示 城区三分公司/石景山区/广宁；路径命中 → 显示 街道级内容图
5. 选到非命中路径（如 门头沟区）→ cascadePath = ['城区三分公司', '门头沟区'] → 输入框显示路径；不渲染内容图，仅显示背景
```

> `changeOnSelect` 让用户可在任一级停手并触发路径命中检查（如停在"城区三分公司"就能看公司级报告）。
> **无需额外 Breadcrumb**：Cascader 输入框自带路径展示（默认 `/` 分隔）。

### 4.3 关闭弹窗

```
click(Modal 遮罩) 或 按 ESC → setOpen(false)
antd Modal close 动画结束 → afterClose → setCascadePath(DEFAULT_CASCADE_PATH)（下次打开默认选中 `['城区三分公司']`，即时命中公司级内容图）
切换 currentLevel → 离开 MY_LEVELS → 模块本身 return null（自动隐藏），触发 div 与 Modal 一起消失
切换工具 / 绘制 shape → 不影响弹窗（与框选弹窗独立）
```

### 4.4 与框选弹窗共存

两个弹窗独立实现、独立状态：

| 场景                                 | 框选弹窗  | 故障分析报告弹窗                       |
| ------------------------------------ | --------- | -------------------------------------- |
| 街道级选中 shape                     | ✅ 显示   | ❌ 不显示                              |
| 公司/区/街道级点击网络影响右上角 div | ❌ 不显示 | ✅ 显示（带 Cascader）                 |
| 街道级框选 + 同时点故障报告 div      | ✅ 显示   | ✅ 显示（两个 Modal 各自居中，可同时） |

---

## 五、不在本次范围

-   ❌ 5 个结构化字段拆解为 React 组件（全阻物理站 / 受影响物理站 / 资源数 / 退服占比 / RRC 最大连接数）——图片兜底足够 demo
-   ❌ 真实接口对接（图片内容写死；级联选项为 mock 数据）
-   ❌ 弹窗内列表分页 / 排序 / 筛选
-   ❌ 弹窗自定义动画（沿用 antd `Modal` 默认）
-   ❌ 智能避让算法（沿用 antd 居中）
-   ❌ 历史回溯功能（场景 3，由 task006 处理）
-   ❌ 社区 / 物理站 / 逻辑站层级的故障报告按钮（PM 标书仅要求 3 级）
-   ❌ 单独的 `failure-report-button` / `failure-report-modal` 模块（PM 要求内联到 `network-impact`）
-   ❌ 非命中路径自定义"暂无数据"提示（仅显示背景图，不渲染内容图与占位文案）

---

## 六、待 PM 确认（review 时定）

| #   | 待确认项                       | 状态 / 默认决策                                                                 |
| --- | ------------------------------ | ------------------------------------------------------------------------------- |
| 1   | 故障报告图片资源是否已出图？   | **✅ PM 已出图**：`故障分析报告弹窗-{背景,城区三分公司,石景山,广宁}.png`        |
| 2   | **触发位置 + 形态？**             | **✅ PM 已确认**：网络影响模块右上角透明 div，仅 `cursor: pointer`            |
| 3   | **弹窗内容布局？**                | **✅ PM 已确认**：背景图容器 + 右上角 Cascader（自带路径展示） + 路径命中内容图             |
| 4   | **级联样例路径？**             | **✅ PM 已确认**：`城区三分公司 → 石景山区 → 广宁`                            |
| 5   | **是否限定触发 div 显隐层级？**    | **✅ PM 已确认**：不需要判断，模块能渲染就跟随显示（覆盖 `MY_LEVELS` 5 级）    |
| 6   | **是否抽出独立组件？**             | **✅ PM 已确认**：抽出至 `modules/network-impact/failure-report-modal.tsx`，由 `network-impact/index.tsx` 引入 |
| 7   | 级联选项的 mock 数据？         | 默认决策：本 task 内联 3 个分公司 + 若干区/街道的 mock，PM 提供真实清单后替换              |
| 8   | 弹窗位置（左/右/上/下）？      | 默认决策：antd `Modal` `centered`（居中显示）                                   |
| 9   | 弹窗尺寸？                     | 默认决策：`width={960}`（按背景图实际比例微调）                                 |
| 10  | 透明 div 是否需要 hover 高亮？ | 待 PM 确认；默认不加（保持纯透明 + 手型）                                       |
| 11  | 透明 div 的尺寸？              | 默认决策：宽 100px / 高 30px                                                  |

---

## 七、验收标准

### 7.1 资源（4 条，全部已存在）

1. `public/static/images/bj-cmcc-cmd-dispatcher/故障分析报告弹窗-背景.png` 存在
2. `故障分析报告弹窗-城区三分公司.png` 存在
3. `故障分析报告弹窗-石景山.png` 存在
4. `故障分析报告弹窗-广宁.png` 存在

### 7.2 触发 div 显隐（4 条）

5. `currentLevel ∈ MY_LEVELS`（city / company / district / street / community）→ 网络影响模块渲染（外层 wrapper div `left: 1878, top: 87, width: 906, height: 635`），`<FailureReportModal />` 跟随渲染，触发 div 用 `right: 0, top: 0` 相对 wrapper 定位 → 等价绝对坐标 `left: 2684, top: 87, width: 100, height: 30`
6. `currentLevel ∉ MY_LEVELS`（station / logical 等）→ 模块 `return null`，触发 div 自动消失（无需额外判断）
7. 透明 div 没有任何视觉元素（无边框 / 无文字 / 无背景）；鼠标悬停时 `cursor` 变为手型
8. 点击透明 div → 组件内 `setOpen(true)`

### 7.3 弹窗布局（3 条）

9. 弹窗打开后渲染 `故障分析报告弹窗-背景.png` 作为内容容器（`backgroundImage`）
10. 弹窗内容右上角渲染 antd `Cascader`，选项来自 `FAILURE_REPORT_CASCADE`（含城区三分公司、石景山区、广宁 等节点）
11. 弹窗关闭 antd 默认标题栏（`title={null}`、`closable={false}`）

### 7.4 级联交互（5 条）

12. Cascader 选中 `城区三分公司` → `cascadePath = ['城区三分公司']` → Cascader 输入框显示 `城区三分公司` → 命中 `CONTENT_IMG_BY_PATH['/城区三分公司']` → 显示 `故障分析报告弹窗-城区三分公司.png`
13. 继续选中 `石景山区` → `cascadePath = ['城区三分公司', '石景山区']` → Cascader 输入框显示 `城区三分公司 / 石景山区` → 显示 `故障分析报告弹窗-石景山.png`
14. 继续选中 `广宁` → `cascadePath = ['城区三分公司', '石景山区', '广宁']` → Cascader 输入框显示 `城区三分公司 / 石景山区 / 广宁` → 显示 `故障分析报告弹窗-广宁.png`
15. 选中非命中路径（如 `城区三分公司 / 门头沟区`）→ Cascader 输入框显示路径，**不**渲染内容图（仅显示背景）
16. `changeOnSelect` 生效：可在任一级停手（不必选到底层）

### 7.5 关闭交互（3 条）

17. 点击 Modal 遮罩或按 ESC → `setOpen(false)` → 弹窗消失
18. `afterClose` 触发 → `setCascadePath(DEFAULT_CASCADE_PATH)`（下次打开默认选中 `['城区三分公司']`，即时命中公司级内容图）
19. 切换 currentLevel 到 `MY_LEVELS` 之外（如 `station`）→ 模块 `return null` → 触发 div 与弹窗同时消失

### 7.6 工程约束（3 条）

20. TS 编译 0 错误（cmd-dispatcher scope 内）
21. 不引入新依赖（antd `Modal` / `Cascader` 均为 antd 内置）
22. 仅在 `modules/network-impact/` 目录新增 1 个文件 `failure-report-modal.tsx`（与网络影响模块同级），由 `network-impact/index.tsx` 引入；不创建顶层 `modules/failure-report-modal/` 目录

---

## 八、文档同步要求

| 触发动作                                            | 必须更新                                                       |
| --------------------------------------------------- | -------------------------------------------------------------- |
| 新增 `network-impact/failure-report-modal.tsx`      | `status/current.md`（模块清单追加新组件）                      |
| `network-impact/index.tsx` 改动（引入 `FailureReportModal`） | `status/current.md`（模块说明追加故障分析报告能力）  |
| 新增 / 已存在图片资源                               | `status/current.md`（静态资源表追加 4 张图）                   |
| 本 task 收口                    | `status/checklist.md` 追加本 task 收口自检段        |

---

## 九、与上下游的衔接

| 上下游                             | 衔接内容                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 上游 task-002-03（框选弹窗）       | 概念参考：图片型弹窗 + 层级守卫；本 task 未复用其模块（实现路径不同：antd Modal + Cascader vs 自定义 div）                          |
| 下游真实接口接入（暂未立项）       | 后续将 5 个字段拆为 React 组件替换 antd Modal 内 `<img>`；本 task 保留的 `FAILURE_REPORT_CASCADE` 与 `CONTENT_IMG_BY_PATH` 便于迁移 |
| 下游 PM 真实分公司 / 区 / 街道清单 | 替换 `FAILURE_REPORT_CASCADE` 即可，组件其它逻辑（路径计算、Cascader 渲染、命中渲染）无需改动                                       |
| task-2026-08-25-006（历史回溯）    | 同属场景 3 前的演示补全，但本 task 与历史回溯**独立**，不联动                                                                       |

---

## 文档元信息

> 日期：2026-08-25
> 状态：已完成（含 §3.4 实施落地后 review 期内的 3 项调整：① 引入外层 wrapper div 模式，触发 div 改 `right/top` 相对定位；② Cascader 默认选中 `['城区三分公司']`，afterClose 同步重置；③ 内容图容器 `paddingTop: 75` 给 Cascader 留白）
