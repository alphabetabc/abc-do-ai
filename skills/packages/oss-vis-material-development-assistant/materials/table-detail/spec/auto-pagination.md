---
title: table-detail 自动轮播设计 Spec
description: 通过定时更新 current 实现分页自动轮播的设计草案
status: draft
version: 0.1.0
last_updated: 2026-07-30
related_material: table-detail
---

# table-detail 自动轮播设计 Spec

## 1. 目标与动机

### 1.1 目标

为 `table-detail` 物料新增「自动轮播」能力：组件内置定时器，按 N 秒间隔自动将 `paginationState.current += 1`，到末页后回到第 1 页，形成循环翻页效果。

### 1.2 动机

| 场景                    | 当前痛点                                        | 轮播后效果                              |
| ----------------------- | ----------------------------------------------- | --------------------------------------- |
| 大屏"实时数据"展示      | 需要手动配置数据源 + 全量轮询，渲染端无翻页节奏 | 表格按节奏自动翻页，吸引视觉焦点        |
| "Top N 实时榜"型表格    | 一次性渲染所有行，密度太高不易读                | 切成 N 页循环展示，每页一个 time window |
| 多 sheet 切换的数据明细 | 用户点击分页器才能切换                          | 自动播放，无需人工介入                  |

### 1.3 非目标（明确不做）

-   ❌ 不引入动画过渡（CSS transition / motion）
-   ❌ 不接管数据源刷新节奏（仅翻页，不重新拉数据）
-   ❌ 不支持每行不同轮播策略
-   ❌ 不支持服务端分页场景的轮播（理由见 § 5.2 风险）

## 2. 设计方案

### 2.1 行为规则

| 触发条件                                 | 行为                                   |
| ---------------------------------------- | -------------------------------------- |
| `enableCarousel = true`                  | 启动定时器                             |
| `enablePagination = false`               | **不启动**（无分页就无须翻页）         |
| 翻页到末页 (`current >= total`)          | **回到第 1 页**                        |
| `total <= 1`（无页可翻）                 | **不启动**                             |
| `pauseOnHover = true` 且鼠标进入容器     | **暂停**定时器                         |
| 鼠标离开容器                             | **继续**（从暂停点恢复，不重置间隔）   |
| 用户**手动翻页**（点击分页器）           | **不停**轮播（用户行为不破坏自动节奏） |
| 组件卸载 / `enableCarousel` 切为 `false` | **清理**定时器                         |

### 2.2 关键决策

#### 决策 1：自治 vs. 派发

**结论：组件内自治**。

理由：

-   用户已明确"组件内自治"（避免破坏现有派发链路）
-   不通过 `interaction.dispatch` 派发 `actionPaginationCurrent`，**避免与其他订阅者冲突**
-   但仍可监听外部 `subscribePaginationCurrent`（如果外部改了 current，定时器按新值继续）

#### 决策 2：定时器放哪

**结论**：放 `index.tsx`，新增一个 `useCarousel` hook（独立文件 `hooks/useCarousel.tsx`）。

理由：

-   与 `useScroll` 一致（[hooks/useScroll.tsx](src/packages/table-detail/hooks/useScroll.tsx)）
-   单文件不超过 50 行，可独立测试

#### 决策 3：单选 vs. 多选 interval

**结论**：MVP 只支持单一 interval；预留扩展位（如未来"首页停顿 5s，其他页 3s"）。

#### 决策 4：服务端分页是否禁用

**结论**：默认 `enableCarousel = true` 时**禁用服务端分页**，给出明确警告文案。

理由：

-   table-detail 不主动触发 API 请求，但服务端分页下 `tableInfo.total = Infinity`（见 [component-logic.md § 2.2.3](../component-logic.md)），若数据源 hook 监听 current 变化**会触发请求风暴**
-   在 `enableCarousel` 的 schema description 里明确写出此约束

## 3. API 设计

### 3.1 Schema 新增字段（位于 `paginationSetting` 分组下）

```typescript
{
    enableCarousel: {
        title: '启用自动轮播',
        type: 'boolean',
        'x-component': 'Switch',
        'x-component-props': {},
        'x-decorator': 'FormItem',
        default: false,
    },
    carouselInterval: {
        title: '轮播间隔（秒）',
        type: 'number',
        'x-component': 'NumberPicker',
        'x-component-props': { min: 1, max: 60, step: 1 },
        'x-decorator': 'FormItem',
        default: 5,
        // 仅 enableCarousel=true 时显示
        'x-reactions': { fulfill: { state: { visible: '{{ $deps[0] === true }}' } } },
    },
    pauseOnHover: {
        title: '鼠标悬停时暂停',
        type: 'boolean',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true,
        'x-reactions': { fulfill: { state: { visible: '{{ $deps[0] === true }}' } } },
    },
}
```

> 注：3 个字段都是 `paginationSetting` 内部的二级字段，**不会破坏现有 schema 结构**。

### 3.2 默认值

```typescript
paginationSetting: {
    // ... 已有字段
    enableCarousel: false,
    carouselInterval: 5,
    pauseOnHover: true,
}
```

### 3.3 用户文档同步点

-   `src/packages/table-detail/doc/readme.md` "分页器配置"段落：加 3 行说明
-   `src/packages/table-detail/doc/CHANGELOG.md`：加 changelog
-   `src/packages/table-detail/doc/images/`：可选加 GIF 演示（不在 MVP 范围）

## 4. 实现要点

### 4.1 新增 `hooks/useCarousel.tsx`

```typescript
interface UseCarouselParams {
    enabled: boolean; // 总开关
    total: number; // 总页数（Infinity 表示服务端分页）
    interval: number; // 间隔（秒）
    pauseOnHover: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
    currentPage: number;
    onChange: (next: number) => void; // 翻页回调
}

const useCarousel = (params: UseCarouselParams) => {
    // 1. setInterval 定时调用 onChange((currentPage % total) + 1)
    // 2. ResizeObserver 不需要（不需要重算）
    // 3. 监听 containerRef.current 的 mouseenter / mouseleave 控制暂停
    // 4. cleanup 时 clearInterval
};
```

> 完整代码草稿见 § 4.4

### 4.2 `index.tsx` 改动

```typescript
// 1. 新增 containerRef（挂到 StyledContainer 根 div）
const containerRef = useRef<HTMLDivElement>(null);

// 2. 读配置
const { enable: enablePagination, enableCarousel = false, carouselInterval = 5, pauseOnHover = true } = paginationSetting;

// 3. 计算 total（本地分页从 chunk.length，服务端 Infinity）
const safeTotal = Number.isFinite(tableInfo.total) ? tableInfo.total : Infinity;

// 4. 调用 hook（仅在 enableCarousel=true 时生效）
useCarousel({
    enabled: enableCarousel && enablePagination && safeTotal > 1,
    total: safeTotal,
    interval: carouselInterval,
    pauseOnHover,
    containerRef,
    currentPage: paginationState.current,
    onChange: (next) => setPaginationState({ current: next }),
});
```

### 4.3 边界与守卫

| 边界                                                  | 处理                                                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `safeTotal === Infinity`（服务端分页）                | hook 内部 `enabled = false`，不启动                                                |
| `safeTotal <= 1`                                      | hook 内部 `enabled = false`，不启动                                                |
| 数据从有变无（dataSource 清空）                       | `useMemo` 重算 total，hook 依赖触发停止                                            |
| 切换 `dataType`（json → api）导致 total 变成 Infinity | 立即停止（依赖追踪自动生效）                                                       |
| 组件卸载                                              | `useEffect` cleanup 清理 interval 和事件监听                                       |
| 用户连续快速手动翻页                                  | setInterval 仍按节奏触发，可能"翻过去"——接受此行为（避免与用户操作打架反而更困惑） |

### 4.4 完整 hook 实现草稿

```typescript
import { useEffect } from 'react';

interface UseCarouselParams {
    enabled: boolean;
    total: number;
    interval: number;
    pauseOnHover: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
    currentPage: number;
    onChange: (next: number) => void;
}

export const useCarousel = ({ enabled, total, interval, pauseOnHover, containerRef, currentPage, onChange }: UseCarouselParams) => {
    useEffect(() => {
        if (!enabled || !Number.isFinite(total) || total <= 1) return;

        let timer: ReturnType<typeof setInterval> | null = null;
        let paused = false;

        const tick = () => {
            if (paused) return;
            // currentPage 来自闭包，需通过 ref 拿最新
            onChange((currentPageRef.current % total) + 1);
        };

        const start = () => {
            if (timer) return;
            timer = setInterval(tick, interval * 1000);
        };
        const stop = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        // 用 ref 保存最新 currentPage（避免每次 effect 重建）
        const currentPageRef = { current: currentPage };
        currentPageRef.current = currentPage;

        start();

        if (pauseOnHover) {
            const el = containerRef.current;
            const onEnter = () => {
                paused = true;
            };
            const onLeave = () => {
                paused = false;
            };
            el?.addEventListener('mouseenter', onEnter);
            el?.addEventListener('mouseleave', onLeave);
            return () => {
                stop();
                el?.removeEventListener('mouseenter', onEnter);
                el?.removeEventListener('mouseleave', onLeave);
            };
        }

        return stop;
    }, [enabled, total, interval, pauseOnHover, currentPage, onChange, containerRef]);
};
```

> ⚠️ 上面 `currentPageRef` 写法略丑陋，正式实现需用 `useRef`（完整版会在 PR 时给出）。

## 5. 风险与回退

### 5.1 已知风险

| 风险                                          | 等级  | 说明                                                                        |
| --------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| 与 `useScroll` 的 `MutationObserver` 性能叠加 | 🟡 中 | 新增 setInterval 可能与 ResizeObserver 互相影响滚动计算。**需压测**         |
| 服务端分页下数据源请求风暴                    | 🔴 高 | 见 § 2.2 决策 4。**MVP 禁用服务端分页 + schema description 警告**           |
| 用户手动翻页与自动翻页冲突                    | 🟢 低 | 当前设计"不停轮播"，可接受                                                  |
| 容器 ref 跨 iframe / 微前端                   | 🟢 低 | MVP 范围内                                                                  |
| hover 暂停在移动端（无 hover）                | 🟢 低 | 移动端天然不触发，自动运行                                                  |
| 与外部 `subscribePaginationCurrent` 联动      | 🟡 中 | 外部改 current 后，轮播应继续按新 current 推进。`currentPageRef` 设计已考虑 |

### 5.2 服务端分页请求风暴详细说明

**问题**：

-   table-detail 在本地分页下：`tableInfo.total = chunk.length`（真实页数，如 5）
-   在服务端分页下：`tableInfo.total = Infinity`（[component-logic.md § 2.2.3](../component-logic.md)）
-   如果数据源 hook 监听 `paginationState.current` 变化重新发请求：
    -   `setInterval` 每 5 秒触发 `onChange(current + 1)`
    -   数据源 hook 每 5 秒发一次 API 请求
    -   1 小时 = 720 次请求，**流量风暴**

**缓解**：

1. hook 内部 `Number.isFinite(total)` 守卫 → `enabled = false`，**MVP 不启动**
2. schema description 加警告文案："启用轮播后仅支持本地分页，接入服务端分页可能导致请求频繁"
3. 未来若要支持服务端分页轮播，需额外机制（如"轮播周期内只发一次请求"）

### 5.3 回退方案

如果发现严重 bug：

-   **轻度回退**：把 `enableCarousel` 默认值改为 `false`（之前已配置的不受影响）
-   **完全回退**：删除 `useCarousel` + 3 个 schema 字段，已配置的用户看到"未识别字段"提示（设计器兜底）

## 6. 影响范围

| 文件 | 改动类型 | 行数估算 |
| --- | --- | --- |
| `src/packages/table-detail/schema.ts` | 新增 3 个字段（[§ 3.1](#31-schema-新增字段位于-paginationsetting-分组下)） | +30 |
| `src/packages/table-detail/index.tsx` | 加 `containerRef` + 调 `useCarousel` | +15 |
| `src/packages/table-detail/hooks/useCarousel.tsx` | **新建** | +60 |
| `src/packages/table-detail/oss-material.json` | 不改（`version` 由构建流程管控） | 0 |
| `src/packages/table-detail/dataModel.json` | 不改（无新增字段） | 0 |
| `src/packages/table-detail/doc/readme.md` | "分页器配置"段落加 3 行 | +10 |
| `src/packages/table-detail/doc/CHANGELOG.md` | 加 1 条 | +5 |
| `.trae/skills/.../materials/table-detail/component-logic.md` | 加 `useCarousel` 子章节 | +30 |
| `.trae/skills/.../materials/table-detail/schema.md` | 加 3 个字段表行 | +10 |
| `.trae/skills/.../materials/table-detail/README.md` | 核心特性加第 7 条 | +10 |
| `.trae/skills/.../materials/table-detail/gotchas.md` | 加 2 条踩坑点（hover 暂停 / 跨页面持久化） | +15 |
| `.trae/skills/.../materials/table-detail/common-tasks.md` | 加 1 个新任务（"调整轮播行为"） | +30 |
| `materials/README.md` | 表格分类更新 | +1 |

**合计**：约 +210 行（其中 60 行是新文件）

## 7. 验收标准

### 7.1 功能验收

-   [ ] schema 出现 3 个新字段，默认值生效
-   [ ] `enableCarousel = true` 且 `enablePagination = true` 且 `total > 1` → 表格每 5 秒自动翻页
-   [ ] 翻到末页后回到第 1 页（确认 last → 1）
-   [ ] `pauseOnHover = true` 时鼠标进入容器 → 暂停；离开 → 继续
-   [ ] `pauseOnHover = false` 时不挂事件监听器（验证 DevTools 不出现 mouseenter）
-   [ ] `enableCarousel = false` → 无定时器运行（验证 DevTools Performance）
-   [ ] `total = 1` 或 `0` → 不启动
-   [ ] 服务端分页（total = Infinity） → 不启动
-   [ ] 切换 `enableCarousel` 字段值 → 立即启停（不需刷新组件）
-   [ ] 组件卸载 → setInterval 被清理，无内存泄漏

### 7.2 性能验收

-   [ ] `useScroll` 滚动计算正常（不因 setInterval 频繁触发）
-   [ ] 启用轮播时浏览器 Performance 无明显 setInterval 抖动
-   [ ] 关闭轮播后 Performance 回到基线

### 7.3 文档验收

-   [ ] doc/readme.md 加 3 行配置说明
-   [ ] doc/CHANGELOG.md 加 1 条
-   [ ] 5+1 文档同步更新（[§ 6](#6-影响范围)）

## 8. 实现计划（建议 PR 拆分）

| 阶段     | 内容                                    | 估时（人天） |
| -------- | --------------------------------------- | ------------ |
| Phase 1  | schema 新增字段 + index.tsx 接入空 hook | 0.5          |
| Phase 2  | `useCarousel` 完整实现 + 自测           | 0.5          |
| Phase 3  | 文档同步（doc + 5+1）                   | 0.5          |
| Phase 4  | 联调 + 验收                             | 0.5          |
| **合计** |                                         | **2.0**      |

> 注：表里"估时"仅供参考，以实际为准。

## 9. 替代方案（未采纳）

### 方案 A：纯 CSS 动画轮播

-   ❌ 不能与 `paginationState.current` 联动，不能触发数据重渲
-   ❌ 不能响应用户手动翻页

### 方案 B：用 `useEffect` + `setTimeout` 链式

-   ❌ 写法复杂，不如 `setInterval` 直观
-   ❌ 暂停 / 恢复逻辑需要更多 ref

### 方案 C：复用 `pagination-table` 的轮播逻辑

-   ❌ pagination-table 也没有轮播（[README.md](../../../../skills/oss-vis-material-development-assistant/materials/pagination-table/README.md) 未提）
-   ❌ 即便复用，pagination-table 主动调 API，table-detail 是被动消费，**不能直接复用**

### 方案 D：通过派发 `actionPaginationCurrent` 让外部控制

-   ❌ 破坏"组件内自治"原则
-   ❌ 需要外部有"定时派发器"配合，复杂度反而上升

## 10. 变更记录

| 日期       | 版本  | 变更      | 作者 |
| ---------- | ----- | --------- | ---- |
| 2026-07-30 | 0.1.0 | 起草 spec | —    |
