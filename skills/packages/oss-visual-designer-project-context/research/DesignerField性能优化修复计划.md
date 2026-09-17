# DesignerField 性能优化修复计划

## 背景

系统渲染 440 个组件（1.7MB JSON 数据）时严重卡顿。根因是渲染链路中多处缺少 memo 化，导致任何 state 变化都触发全量重渲染。

## 修复项

### 修复 1：DesignerField 加 React.memo（P0）

**文件**：`src/designer/renderer/designer-field/index.tsx`

**问题**：`DesignerField` 未用 `React.memo` 包裹，`RecursionComponents` 每次渲染时所有 440 个 `DesignerField` 都重新执行函数体。

**方案**：

```typescript
// 文件末尾，export 前包裹 memo
import React, { memo } from 'react';

const DesignerField = (props: DesignerFieldProps) => {
    // ... 原有逻辑不变
};

// 自定义比较函数，props 浅比较 + children 引用比较
function areEqual(prevProps: DesignerFieldProps, nextProps: DesignerFieldProps) {
    return (
        prevProps.dataSource === nextProps.dataSource &&
        prevProps.onValueChange === nextProps.onValueChange &&
        prevProps.children === nextProps.children &&
        prevProps.slider === nextProps.slider &&
        prevProps.enableMovable === nextProps.enableMovable &&
        prevProps.enableWidgetMovable === nextProps.enableWidgetMovable
    );
}

export default memo(DesignerField, areEqual);
```

**预期收益**：当 `dataSource` 引用不变时（即该组件数据未变化），直接跳过渲染。从 440 次重渲染减少到仅变化的节点。

**风险**：`dataSource` 是 `useDesignerSettingChange` 返回的 `setting`，需确认其引用稳定性（见修复 2）。

---

### 修复 2：useDesignerSettingChange 消除双重渲染（P0）

**文件**：`src/designer/DataProvider.tsx` 第 59-61 行

**问题**：第二个 `useEffect` 依赖 `[ownerSetting]`，由于 `RecursionComponents` 每次 map 产生新 `item` 引用（即使内容没变），触发 `setSetting(ownerSetting)` → 440 个组件各多渲染一次。

**方案**：用 `_.isEqual` 深比较，只有内容真正变化时才更新：

```typescript
// 修改前
useEffect(() => {
    setSetting(ownerSetting);
}, [ownerSetting]);

// 修改后
const ownerSettingRef = useRef(ownerSetting);
useEffect(() => {
    if (!_.isEqual(ownerSettingRef.current, ownerSetting)) {
        ownerSettingRef.current = ownerSetting;
        setSetting(ownerSetting);
    }
}, [ownerSetting]);
```

**预期收益**：消除 440 次无意义的 `setSetting` 调用和额外渲染。

**风险**：`_.isEqual` 对大对象有性能开销，但比触发 440 次重渲染的开销小得多。如果 `ownerSetting` 结构很深可以考虑用 `JSON.stringify` 快速比较。

---

### 修复 3：overwriteStyle 加 useMemo（P1）

**文件**：`src/designer/renderer/designer-field/index.tsx` 第 158-164 行

**问题**：`createOverwriteStyle` 每次渲染都执行（对象展开 + 函数调用），440 个组件同时做此操作。

**方案**：

```typescript
// 修改前
const overwriteStyle = createOverwriteStyle(
    { width: width as any, height: height as any, background },
    rest,
    slider,
    dataSource,
    overwriteStyleBorder,
);

// 修改后
const overwriteStyle = useMemo(() => {
    return createOverwriteStyle(
        { width: width as any, height: height as any, background },
        rest,
        slider,
        dataSource,
        overwriteStyleBorder,
    );
}, [width, height, background, rest, slider, dataSource, overwriteStyleBorder]);
```

**预期收益**：减少每次渲染的对象创建开销。

**风险**：`rest` 是 `dataSource.data` 解构出来的，引用可能不稳定，需要确认。

---

### 修复 4：RecursionComponents 的 loopComponents memo 化（P1）

**文件**：`src/designer/recursion-components/index.tsx`

**问题**：`loopComponents` 每次渲染重新创建，且没有对 `state.components` 做引用比较。

**方案**：用 `useMemo` 缓存渲染结果：

```typescript
export const RecursionComponents = (props) => {
    const { state } = useDesigner();

    const components = useMemo(() => {
        if (_.isEmpty(state.components)) return null;

        const loopComponents = (data: any, parentPosition = { left: 0, top: 0 }) => {
            if (data.length > 0) {
                return data
                    .map((item: any, index: any) => {
                        return (
                            <DesignerField
                                key={item.uniqueId}
                                index={index}
                                dataSource={item}
                                onValueChange={props.onValueChange}
                                parentPosition={parentPosition}
                                enableWidgetMovable={props.enableWidgetMovable}
                            >
                                {item.children && [FIELD_COMP_TYPES.GROUP, FIELD_COMP_TYPES.LAYOUT_BLOCK].includes(item.type)
                                    ? loopComponents(item.children)
                                    : undefined}
                            </DesignerField>
                        );
                    })
                    .filter(Boolean);
            } else {
                return null;
            }
        };

        return loopComponents(state.components);
    }, [state.components, props.onValueChange, props.enableWidgetMovable]);

    return components;
};
```

**预期收益**：当 `state.components` 引用不变时，跳过整棵树的 JSX 构建。

**注意**：此修复依赖修复 1（`DesignerField` 的 `React.memo`）才能发挥最大效果。如果 `DesignerField` 没有 memo，即使 `loopComponents` 缓存了，React 仍需遍历所有子节点做 reconciliation。

---

### 修复 5：GeneratorWidget / GeneratorField memo 化（P1）

**文件**：`src/designer/renderer/GeneratorWidget.js`

**问题**：预览模式下 `loopWidgets` 和 `GeneratorField` 均无 memo 化。

**方案**：

1. `GeneratorField` 用 `React.memo` 包裹
2. `overwriteStyle` 加 `useMemo`
3. `loopWidgets` 结果用 `useMemo` 缓存

```javascript
// GeneratorField 包裹 memo
const GeneratorField = React.memo((props) => {
    // ... 原有逻辑
    const overwriteStyle = useMemo(() => {
        return {
            ...(slider ? { position: 'unset', left: 0, top: 0 } : { position: 'absolute', left, top }),
            width, height, borderColor: 'transparent', borderWidth: 0.5, borderStyle: 'solid',
            background, boxShadow: getBoxShadow(rest),
            transform: `translate(${left},${top})`,
            ...(slider && value.type === FIELD_COMP_TYPES.GROUP ? { position: 'relative' } : {}),
        };
    }, [width, height, background, left, top, slider, rest, value.type]);
    // ...
});

// GeneratorWidget memo 化
const GeneratorWidget = React.memo(({ widgets = [] }) => {
    if (widgets.length === 0) return null;
    return useMemo(() => loopWidgets(widgets), [widgets]);
});
```

**预期收益**：预览模式下同样避免全量重渲染。

---

## 修复顺序

```
修复 1 (DesignerField memo)  ─┐
                               ├─ 修复 4 (RecursionComponents memo) — 依赖修复 1
修复 2 (useDesignerSettingChange) ─┘
修复 3 (overwriteStyle useMemo)     — 独立
修复 5 (GeneratorWidget memo)       — 独立
```

建议先做 1+2+4（设计器模式），再做 3+5（预览模式）。

## 验证方式

1. 加载 `广东节假日大屏.json`（440 组件）
2. 选中任意图层，观察高亮是否即时响应
3. 拖拽组件，观察是否流畅
4. 派发交互，观察非相关组件是否不重渲染
5. 可用 React DevTools Profiler 对比优化前后的渲染次数和耗时
