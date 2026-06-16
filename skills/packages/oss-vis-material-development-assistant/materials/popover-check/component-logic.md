---
title: 组件逻辑维护
description: popover-check 组件代码（index.jsx + tooltip-border.jsx）的维护要点
version: 1.0.0
last_updated: 2026-06-16
---

# 组件逻辑维护

本文档说明 `popover-check` 组件代码（`index.jsx` + `tooltip-border.jsx`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
popover-check/
├── index.jsx                      # 主组件入口
├── index.less                     # 样式
├── schema.ts                      # 配置面板（→ schema.md）
├── dataModel.json                 # 数据契约（→ data-model.md）
├── oss-material.json              # 物料元信息
└── tooltip-border.jsx             # 弹窗边框 SVG 子组件
```

## 2. 主组件 `index.jsx`

### 2.1 入口签名

```javascript
const PopoverCheck = (props) => {
    const { config, dataSource: data, interaction } = props;
    const { defaultCheckedValue, funcSettings, selectedStyle, popoverStyle, arrowStyle, height: compHeight } = config;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（含 4 个 style 对象） |
| `dataSource` | array | dataConfig | 选项数据，每项 `{ id, label }` |
| `interaction` | object | 框架 | 交互派发对象（含 `dispatch` / `defined`） |

> ⚠️ `defaultCheckedValue` 是 schema 中**未声明**的隐式字段（详见 gotchas.md § 1）。

### 2.2 关键逻辑

#### 2.2.1 派发选中事件

```javascript
const onChange = (checkedListIds) => {
    interaction.dispatch({
        data: [
            {
                fieldName: interaction.defined?.select,
                state: checkedListIds,
            },
            {
                fieldName: interaction.defined?.selectLabel,
                state: data.filter((item) => _.includes(checkedListIds, item.id)).map((item) => item.label),
            },
        ],
    });
};
```

**注意**：
- 派发两个参数：`select`（id 数组）和 `selectLabel`（label 数组）
- 派发字段名从 `interaction.defined` 读取，由用户通过 schema 的交互面板配置
- 派发值始终是**数组**（即使单选模式），下游消费者需按数组处理

#### 2.2.2 选中 / 取消逻辑

```javascript
const onCheckedItemChange = (e) => {
    const { id, checked } = e.target;
    const findItem = data.find((d) => d.id === id);
    if (findItem) {
        let result = null;
        if (checked) {
            if (isSingleMode) {
                result = [findItem.id];  // 单选：直接替换为新 id
            } else {
                result = [...checkedItemId, findItem.id];  // 多选：追加
            }
        } else {
            // 单选 / 多选时，均支持清空（取消选中）
            result = checkedItemId.filter((item) => item !== id);
        }
        updateCheckedList(result);
    }
    if (isSingleMode) {
        setShowPopover(false);  // 单选：点击后自动关闭弹窗
    }
};
```

**注意**：
- 单选：直接替换；多选：追加 / 移除
- 单选 / 多选都支持"取消全部选中"（即清空）
- 单选模式下点击后弹窗自动关闭（来自 `doc/CHANGELOG.md` 的 20230815 更新）

#### 2.2.3 自动初始化

```javascript
useEffect(() => {
    const checkedItemId = latestCheckedItemId.current;
    if (funcSettings.autoInit && _.isArray(dataMemorized) && dataMemorized.length) {
        let result = null;
        const fullList = dataMemorized.map((d) => d.id);
        result = checkedItemId.filter((id) => fullList.includes(id));  // 过滤掉已不在 data 中的旧选中
        if (result.length === 0) {
            result = [fullList[0]];  // 无选中时默认选第一项
        }
        if (!_.isEqual(preResult.current, result)) {
            preResult.current = result;
            updateCheckedList(result);
        }
    } else {
        preResult.current = null;
        setCheckedItemId([]);
    }
}, [dataMemorized, funcSettings.autoInit, updateCheckedList]);
```

**注意**：
- 依赖 `useMemorizedObject` 包装的 `data`，避免相同引用重复触发
- 切换数据源时自动剔除"已不存在"的旧选中项
- 无选中时回退到第一项
- `preResult` ref 用于"幂等"判断，避免重复派发

#### 2.2.4 点击外部关闭弹窗

```javascript
useEffect(() => {
    const hiddenPopover = () => {
        setShowPopover(false);
    };
    document.addEventListener('click', hiddenPopover);
    return () => {
        document.removeEventListener('click', hiddenPopover);
    };
}, []);
```

**注意**：
- 全局 `document.click` 监听，**未做来源判断**
- 组件根 div 需 `e.stopPropagation()` 阻止冒泡，否则点自己也会关闭
- 详见 gotchas.md § 2

#### 2.2.5 单 / 多选切换的清空逻辑

```javascript
useEffect(() => {
    if (mountedRef.current) {  // 仅在已挂载后（即切换时）才清空
        setCheckedItemId([]);
    }
    mountedRef.current = true;
}, [isSingleMode]);
```

**注意**：
- 首次挂载时 `mountedRef.current === false`，不执行清空
- 后续 `isSingleMode` 变化时清空已选状态
- 配合 `useEffect(() => { return () => { mountedRef.current = false; } }, [])` 卸载时重置

### 2.3 渲染结构

```jsx
<ConfigProvider prefixCls="oss-ui">
  <section className="popover-check-root" style={containerStyle}>
    {/* 头部：选中项显示 + 三角形箭头 */}
    <div className="checked-list-container" style={containerStyle}>
      <div style={overflow: hidden + ellipsis}>
        <Tooltip placement="top" title={formatCheckedList()}>
          {formatCheckedList()}
        </Tooltip>
      </div>
      <i style={triangleCSS} />  {/* 三角形箭头（CSS border 实现） */}
    </div>

    {/* 弹窗（条件渲染） */}
    {showPopover && (
      <section className="check-list-popover-root" style={{ top: ... }}>
        <TooltipBorder style={{ ...popoverStyles, transform: ... }} />
        <section className="popover-arrow" />
        <section className="popover-content-check-list" style={{ maxHeight: ... }}>
          <section className="check-list-item-group">
            {data?.map((item) => (
              <section key={item.id} className="check-list-item">
                <Checkbox id={item.id} checked={...} onChange={onCheckedItemChange}>
                  {item.label}
                </Checkbox>
              </section>
            ))}
          </section>
        </section>
      </section>
    )}
  </section>
</ConfigProvider>
```

### 2.4 维护检查清单

- [ ] 修改派发参数时同步更新 `schema.ts` 的 `defineInteractionSchema`
- [ ] 修改 `onCheckedItemChange` 时同时考虑单 / 多选模式
- [ ] 修改 `useEffect` 依赖项时检查是否引入死循环
- [ ] 弹窗开关使用 `document.click`，嵌套场景注意事件冒泡
- [ ] `useMemorizedObject` 是性能优化关键，**不要直接用 `data` 作依赖**

## 3. 子组件 `tooltip-border.jsx`

### 3.1 职责

绘制带"指向上方箭头"的 SVG 装饰边框，作为弹窗容器背景。

### 3.2 关键 props

| prop | 类型 | 来源 | 说明 |
| --- | --- | --- | --- |
| `style` | object | `index.jsx` 透传 | 含 `position / left / top / borderWidth / borderColor / backgroundColor / transform` |

### 3.3 关键实现

```javascript
const { width, height, domRef } = useAutoResize();

const path = useMemo(() => {
    if (isNaN(Number(width)) || isNaN(Number(height))) return false;
    const tooltipBorder = ({ width, height, padding = 0, borderRadius = 2 }) => {
        const arrowHeight = 6;
        const arrowWidth = 10;
        const arrowToRightPos = 25;  // 箭头距离右侧 25px
        return `M ...`;  // SVG path 字符串
    };
    return tooltipBorder({ width: Number(width), height: Number(height) });
}, [width, height]);
```

**注意**：
- 使用 `useAutoResize` 监听容器尺寸自动重绘
- 箭头位置写死 `arrowToRightPos = 25`（距离右侧）
- 圆角写死 `borderRadius = 2`，**未暴露 schema 配置**
- 当 `width / height` 为 NaN 时返回 `false`（不渲染）

### 3.4 渲染

```jsx
<section style={{ width: '100%', height: '100%', ...restStyle }} ref={domRef}>
  <svg width={width} height={height}>
    <path d={path} fill={backgroundColor} stroke={borderColor} strokeWidth={borderWidth} />
  </svg>
</section>
```

## 4. 样式 `index.less`

### 4.1 命名规范

```less
.popover-check-root {  // 根 class（与 oss-material.json.name 一致 ✓）
    .checked-list-container { ... }
    .check-list-popover-root { ... }
    .popover-arrow { ... }
    .popover-content-check-list { ... }
    .check-list-item-group { ... }
    .check-list-item-checkbox { ... }
}
```

### 4.2 关键样式

```less
.popover-check-root {
    position: relative;  // 容器相对定位

    .checked-list-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 0 4px;
        pointer-events: all;  // 保证点击事件不穿透
    }

    .check-list-popover-root {
        position: absolute;
        right: 0;
        min-width: 100px;
        overflow: hidden;

        .popover-arrow {
            width: 8.48528137px;  // √2 * 6 (三角形斜边)
            height: 8.48528137px;
        }

        .popover-content-check-list {
            position: relative;
            z-index: 1;
            padding: 0 20px 10px;
            overflow-y: auto;  // 超出 maxHeight 滚动
            max-height: calc(100% - 10px);
            min-width: 150px;

            .oss-ui-checkbox {
                margin-right: 20px;
            }
        }
    }
}
```

### 4.3 维护检查清单

- [ ] 根 class 与 `oss-material.json.name` 一致（`popover-check-root`）✓
- [ ] 容器 `position: relative`
- [ ] 弹窗 `position: absolute` 覆盖在容器上
- [ ] `.popover-arrow` 宽高为 `√2 * 6`（特殊值）

## 5. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 数据频繁变化 | `useMemorizedObject(data)` 避免无意义重渲染 |
| 派发频率 | `preResult` ref 保证相同选中状态不重复派发 |
| SVG 重绘 | `useAutoResize` + `useMemo([width, height])` 避免 path 重复计算 |

## 6. 调试小技巧

### 6.1 临时禁用点击外部关闭

```javascript
// useEffect(() => {
//     document.addEventListener('click', hiddenPopover);
//     // ...
// }, []);
```

### 6.2 临时打印派发数据

```javascript
console.log('dispatch:', { fieldName: interaction.defined?.select, state: checkedListIds });
```

### 6.3 临时禁用自动初始化

```javascript
// 在 onCheckedItemChange 中加：
if (funcSettings.autoInit) return;
```

## 7. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 文档化 | 首次编写 5+1 文档；标注隐式字段 `defaultCheckedValue` 问题 |
