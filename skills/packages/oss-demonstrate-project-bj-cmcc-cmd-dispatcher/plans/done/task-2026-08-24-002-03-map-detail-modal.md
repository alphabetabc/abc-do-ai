# Task 002-03 — 框选区域详情弹窗

> 文档定位：北京移动指挥调度模块（`cmd-dispatcher`）task 002 拆分第三部分，在 002-02 绘制交互基础上接入"框选/选中 shape 后弹出区域详情弹窗"。
> 父任务：[task-2026-08-24-002-map.md](./task-2026-08-24-002-map.md)
> 前置：[task-2026-08-24-002-02-map-draw.md](./task-2026-08-24-002-02-map-draw.md) 全部看板项通过
> 关联文档：
> - 设计稿：[../design/001-pm-output.md](../design/001-pm-output.md) §场景 2
> - 前端规范：[../design/003-frontend.md](../design/003-frontend.md)
> - 当前状态：[../status/current.md](../status/current.md)
> - 自检清单：[../status/checklist.md](../status/checklist.md)
>
> 日期：2026-08-25
> 状态：已完成

---

## 一、目标

在 002-02 落地的"绘制 + 选中 + 删除"交互基础上，**选中 shape 后弹出区域详情弹窗**：

1. **详情弹窗组件**：新建 `modules/map/map-detail-modal.tsx`，直接展示 `地图弹窗-1.png` 图片作为弹窗内容
2. **弹窗触发**：select 模式下点击 shape 选中时自动弹出；取消选中或切换工具时关闭
3. **弹窗定位**：**不遮住框选区域**——根据 shape 在视口中的位置自动避让
4. **store 扩展**：复用预留的 `modalOpen`，补充 setter
5. **层级约束**：仅在街道（street）层级显示该弹窗

明确**不做**的事（推到后续 task）：

- ❌ 弹窗内容拆解为 React 组件（当前直接用图片）
- ❌ 真实接口对接（图片内容为写死数据）
- ❌ 弹窗内列表分页 / 排序 / 筛选
- ❌ 弹窗内嵌地图缩略图
- ❌ 历史回溯时间轴
- ❌ 弹窗样式可配置
- ❌ 多 shape 同时选中 + 多弹窗

---

## 二、技术决策

### 2.1 弹窗触发时机

- select 模式下，点击 shape → `setSelected(id)` → 同时 `setModalOpen(true)`
- 点击空白处取消选中 → `setSelected(null)` + `setModalOpen(false)`
- 切换工具（toggleTool）→ `clearShapes()` + `setModalOpen(false)`
- 点击弹窗关闭按钮 → `setSelected(null)` + `setModalOpen(false)`

### 2.2 弹窗定位：智能避让框选区域

**核心约束**：弹窗不能遮住已选中的 shape。

方案：弹窗根据 shape 的 bounding box 在视口中的位置，自动选择左侧或右侧弹出：

```
┌──────────────────────────────────────┐
│                                      │
│   ┌─────────┐      ┌──────────────┐  │
│   │  shape  │      │   弹窗        │  │
│   │ (选中)  │      │ (图片)        │  │
│   └─────────┘      └──────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

- shape 在视口右半区 → 弹窗出现在左侧
- shape 在视口左半区 → 弹窗出现在右侧
- 弹窗垂直居中对齐 shape 的垂直中心点

实现：
- `ShapeRenderer` 选中时通过 `ref` + `getBBox()` 获取 shape 的 SVG 坐标
- 转换为视口像素坐标，判断中心点在左/右半区
- 弹窗用 `position: absolute` + 计算后的 `left`/`top`

### 2.3 弹窗内容：图片

直接展示 `/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png`，不拆解为 React 组件。

图片路径：`public/static/images/bj-cmcc-cmd-dispatcher/地图弹窗-1.png`

### 2.4 层级约束：仅街道层显示

仅在 `currentLevel === 'street'` 时弹窗可见。其它层级框选不弹窗。

### 2.5 store 扩展

复用预留字段，补充 setter：

```ts
// 新增 actions
setModalOpen: (open: boolean) => void;
```

`selectedModuleId` 暂不使用（复用 `selectedShapeId` 即可关联弹窗与 shape）。

### 2.6 弹窗与 SVG overlay 的层级关系

弹窗 z-index 高于 SVG overlay（z=3），设为 z=10。弹窗 `pointerEvents: 'auto'`，点击弹窗内部不会取消选中（`stopPropagation`）。

---

## 三、落地方案

### 3.1 目录结构（新增 1 文件，改 3 文件）

```
web/pages/bj-cmcc-cmd-dispatcher/
├── store/index.ts                    # 改：新增 setModalOpen
├── modules/map/
│   ├── map-stage.tsx                 # 改：渲染 MapDetailModal
│   ├── map-detail-modal.tsx          # 新：详情弹窗组件（图片 + 避让）
│   ├── use-draw.ts                   # 改：选中/取消时联动 modalOpen
│   └── shape-renderer.tsx            # 不变
```

### 3.2 `store/index.ts`（改）

```ts
// 类型声明新增
setModalOpen: (open: boolean) => void;

// store 新增
setModalOpen: (open) => set({ modalOpen: open }),
```

### 3.3 `use-draw.ts`（改）

选中/取消时联动 `modalOpen`：

```ts
const setModalOpen = useCmdDispatcherStore((s) => s.setModalOpen);

// onClick 中 select 空白处取消选中
if (e.target === svgRef.current) {
    setSelected(null);
    setModalOpen(false);
}

// selectShape 包装
const selectShape = (id: string) => {
    setSelected(id);
    setModalOpen(true);
};
```

### 3.4 `map-detail-modal.tsx`（新）

```tsx
/**
 * MapDetailModal：框选区域详情弹窗
 *
 * 选中 shape 后弹出，直接展示 地图弹窗-1.png 图片。
 * 智能避让：根据 shape 位置自动选择左/右侧弹出，不遮住框选区域。
 * 仅在 street 层级显示。
 */
import { constants } from '@/common/constants';
import { useCmdDispatcherStore } from '../../store';
import type { Shape } from './types';

const DESIGN_WIDTH = 2880;

// 计算 shape 中心 X 坐标（SVG 设计坐标系）
const getShapeCenterX = (shape: Shape): number => {
    if (shape.type === 'rect') return shape.x + shape.w / 2;
    if (shape.type === 'circle') return shape.cx;
    if (shape.type === 'polygon') {
        const xs = shape.points.map((p) => p.x);
        return (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    return DESIGN_WIDTH / 2;
};

export const MapDetailModal: React.FC = () => {
    const modalOpen = useCmdDispatcherStore((s) => s.modalOpen);
    const currentLevel = useCmdDispatcherStore((s) => s.currentLevel);
    const setSelected = useCmdDispatcherStore((s) => s.setSelected);
    const setModalOpen = useCmdDispatcherStore((s) => s.setModalOpen);
    const shapes = useCmdDispatcherStore((s) => s.shapes);
    const selectedId = useCmdDispatcherStore((s) => s.selectedShapeId);

    // 仅街道层 + modalOpen + 有选中 shape 时显示
    if (!modalOpen || currentLevel !== 'street' || !selectedId) return null;

    const selectedShape = shapes.find((s) => s.id === selectedId);
    if (!selectedShape) return null;

    const isLeftSide = getShapeCenterX(selectedShape) < DESIGN_WIDTH / 2;

    const onClose = () => {
        setSelected(null);
        setModalOpen(false);
    };

    return (
        <div
            style={{
                position: 'absolute',
                [isLeftSide ? 'right' : 'left']: '4%',
                top: '20%',
                zIndex: 10,
                pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <img
                src={`${constants.IMAGE_PATH}/bj-cmcc-cmd-dispatcher/地图弹窗-1.png`}
                alt="区域详情"
                draggable={false}
                style={{ width: 400, height: 'auto' }}
            />
            <button onClick={onClose} title="关闭" style={{ /* 关闭按钮样式 */ }} />
        </div>
    );
};
```

> 具体避让算法和样式以最终代码为准；本片段为方案骨架。

### 3.5 `map-stage.tsx`（改）

在 SVG overlay 之后渲染 `MapDetailModal`：

```tsx
import { MapDetailModal } from './map-detail-modal';

// JSX 末尾、打点之前
{hasActiveTool && <MapDetailModal />}
```

---

## 四、交互流程

### 4.1 弹窗弹出

```
setTool(select)                → SVG overlay 存在，shape 可命中
click(shape)                   → setSelected(id) + setModalOpen(true)
                               → 弹窗弹出（仅 street 层），避让 shape 位置
```

### 4.2 弹窗关闭

```
click(空白处)                  → setSelected(null) + setModalOpen(false)
click(弹窗关闭按钮)            → setSelected(null) + setModalOpen(false)
toggleTool(取消高亮)           → clearShapes() + setModalOpen(false)
```

### 4.3 弹窗不干扰绘制

```
rect/circle/polygon 模式        → 弹窗不显示（modalOpen 仅在 select 选中时触发）
绘制过程中                      → 弹窗不弹出
非 street 层级                  → 弹窗不显示
```

---

## 五、不在本次范围

| 不做 | 原因 | 推到哪 |
|---|---|---|
| 弹窗内容拆解为 React 组件 | 当前直接用图片 | 后续 task |
| 真实接口对接 | 图片内容为写死数据 | 后续 task |
| 弹窗内列表分页/排序/筛选 | 超出 demo 范围 | 后续 task |
| 弹窗内嵌地图缩略图 | 设计稿未要求 | — |
| 历史回溯时间轴 | 属 task-C | 后续 task |
| 弹窗样式可配置 | 用户已确认写死 | — |
| 多 shape 同时选中 + 多弹窗 | 当前为单选 | 后续 task |
| 非 street 层级弹窗 | 当前仅 street 层有弹窗图片 | 后续 task |

---

## 六、验收标准

完成 review 后，需同时满足：

### 6.1 弹窗触发（3 条）

1. street 层级 + select 模式下点击 shape → 弹窗弹出，展示 `地图弹窗-1.png`
2. 点击空白处 → 弹窗关闭 + 取消选中
3. 切换工具（toggleTool）→ 弹窗关闭 + 清空图形

### 6.2 弹窗避让（3 条）

4. shape 在视口左半区 → 弹窗出现在右侧
5. shape 在视口右半区 → 弹窗出现在左侧
6. 弹窗不遮挡选中的 shape 边界

### 6.3 弹窗内容与关闭（2 条）

7. 弹窗展示 `地图弹窗-1.png` 图片
8. 弹窗有关闭按钮，点击后关闭弹窗 + 取消选中

### 6.4 层级约束（1 条）

9. 非 street 层级框选 shape 不弹出弹窗

### 6.5 工程约束（2 条）

10. 不引入新依赖
11. TS 0 错误（cmd-dispatcher scope 内）

---

## 七、看板

- [x] 改 `store/index.ts`（新增 `setModalOpen` action）
- [x] 改 `modules/map/use-draw.ts`（选中/取消时联动 `modalOpen`）
- [x] 新增 `modules/map/map-detail-modal.tsx`（弹窗组件 + 图片 + 避让逻辑）
- [x] 改 `modules/map/map-stage.tsx`（渲染 `MapDetailModal`）
- [x] 改 `modules/map/map-toolbar-svg.tsx`（toggleTool / 删除时关闭弹窗）
- [x] 验证 street 层 select 选中 shape → 弹窗弹出
- [x] 验证弹窗不遮挡 shape（左/右避让）
- [x] 验证点击空白 / 切换工具 → 弹窗关闭
- [x] 验证弹窗关闭按钮
- [x] 验证非 street 层级不弹窗
- [x] 同步 `status/current.md`（新增弹窗组件 + 交互记录）
- [x] 同步 `design/003-frontend.md`（弹窗避让约定 + 图片弹窗说明）
- [x] 按 `status/checklist.md` 自检

---

## 八、文档同步要求

| 触发动作 | 必须更新 |
|---|---|
| 新增 `map-detail-modal.tsx` + 弹窗交互 | `status/current.md`（map 模块文件清单 + 弹窗能力） |
| 弹窗避让约定（左/右自动避让） | `design/003-frontend.md` |
| 图片弹窗 + street 层级约束 | `design/003-frontend.md` |
| 自检 | `status/checklist.md`（前端项） |

---

## 九、与下游 task 的衔接

| 下游 task | 范围 |
|---|---|
| 后续 task 弹窗组件化 | 将图片拆解为 React 组件（5 指标卡 + 列表） |
| 后续 task-C 历史回溯 | 时间轴拖动 + 地图点位回放 |
| 后续 task 接口对接 | 弹窗内容接真实接口 |
| task003 | B/C/D 组模块图片 + 命名二次确认 |

---

## 文档
