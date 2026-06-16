---
title: 组件逻辑维护
description: top-rank 组件代码（index.jsx）的维护要点
version: 1.0.0
last_updated: 2026-06-16
---

# 组件逻辑维护

本文档说明 `top-rank` 组件代码（`index.jsx`）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
top-rank/
├── index.jsx                      # 主组件入口
├── index.less                     # 样式
├── schema.ts                      # 配置面板（→ schema.md）
├── dataModel.json                 # 数据契约（→ data-model.md）
└── oss-material.json              # 物料元信息
```

> **本物料无子组件**，所有逻辑集中在 `index.jsx`。

## 2. 主组件 `index.jsx`

### 2.1 入口签名

```javascript
const TopRank = (props) => {
    const {
        config,
        dataSource,
        designer: { env, constants },
    } = props;
    const { itemStyle, itemsSet, indexFontStyle, nameFontStyle, valueFontStyle, unitFontStyle } = config;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（含 6 个 style 对象） |
| `dataSource` | array | dataConfig | 排名数据，每项 `{ id?, name, value, unit }` |
| `designer.env` | string | 框架 | 环境标识（用于 `getImageUrl`） |
| `designer.constants` | object | 框架 | 全局常量（用于 `getImageUrl`） |

### 2.2 关键逻辑

#### 2.2.1 序号样式合成 `indexStyle`

```javascript
const indexStyle = {
    width: itemStyle.indexSize,
    height: itemStyle.indexSize,
    borderRadius: itemStyle.indexSize / 2,  // 圆形 = 边长的一半
    backgroundColor: itemStyle.indexBgColor,
    borderWidth: '2px',       // ⚠️ 写死
    borderStyle: 'solid',     // ⚠️ 写死
    borderColor: itemStyle.indexBorderColor,
};
```

**注意**：
- `borderRadius = indexSize / 2` → 序号是**圆形**
- `borderWidth` / `borderStyle` **未暴露 schema**（详见 gotchas § 4）
- 实际背景色 / 边框色在渲染时被 `itemsSet[index]` 覆盖

#### 2.2.2 单项样式 `style`

```javascript
const style = {
    width: itemStyle.width,
    height: itemStyle.height,
};
```

> 单项尺寸**独立**于外层 `config.width / height`，外层尺寸控制整个组件容器（受 padding / border 影响）。

#### 2.2.3 背景图 fallback `getMarginTop`

```javascript
const getMarginTop = (index) => {
    const backgroundImage = itemsSet[index]
        ? `url(${getImageUrl(itemsSet[index].itemSetting.backgroundImage, { env, constants })})`
        : `url(${getImageUrl(itemStyle.backgroundImage, { env, constants })})`;
    switch (index) {
        case 0:
            return { ...style, backgroundImage };  // 第一项无 marginTop
        default:
            return { ...style, backgroundImage, marginTop: itemStyle.marginTop };  // 其他项加间距
    }
};
```

**注意**：
- 第一项（index === 0）**不应用** `marginTop`，避免顶部多出空隙
- 背景图优先级：`itemsSet[index].itemSetting.backgroundImage` → `itemStyle.backgroundImage`
- 函数名 `getMarginTop` 名实不符，实际还处理 `backgroundImage`（详见 gotchas § 2）

#### 2.2.4 列表渲染

```javascript
{dataSource?.map((item, index) => {
    return (
        <div className="top-rank-container-item" style={getMarginTop(index)}>
            {/* 序号 */}
            <div className="top-rank-container-item-index" style={{ ...indexFontStyle }}>
                <div
                    style={{
                        ...indexStyle,
                        backgroundColor: itemsSet[index] ? itemsSet[index].itemSetting.indexBgColor : indexStyle.backgroundColor,
                        borderColor: itemsSet[index] ? itemsSet[index].itemSetting.indexBorderColor : indexStyle.borderColor,
                    }}
                >
                    {index + 1}
                </div>
            </div>

            {/* 名称 */}
            <div className="top-rank-container-item-name" style={{ ...nameFontStyle }}>
                {item?.name}
            </div>

            {/* 数值 + 单位 */}
            <div className="top-rank-container-item-right">
                <div
                    className="top-rank-container-item-value"
                    style={{ ...valueFontStyle, color: itemsSet[index] ? itemsSet[index].itemSetting.color : valueFontStyle.color }}
                >
                    {item?.value}
                </div>
                <div className="top-rank-container-item-unit" style={{ ...unitFontStyle }}>
                    {item?.unit}
                </div>
            </div>
        </div>
    );
})}
```

**注意**：
- 序号 = `index + 1`（依赖 `dataSource` 已排好序，**无真实排名逻辑**）
- 序号背景 / 边框色优先级：`itemsSet[index].itemSetting` → `indexStyle`（来自 `itemStyle`）
- 数值颜色优先级：`itemsSet[index].itemSetting.color` → `valueFontStyle.color`
- 名称 / 单位颜色**不**支持前三名覆盖，统一用 `nameFontStyle` / `unitFontStyle`

### 2.3 维护检查清单

- [ ] 修改样式时同步检查 `itemsSet` 前三名是否需要同步覆盖
- [ ] `dataSource` 顺序即排名顺序，**不要在组件内做排序**
- [ ] 默认 `value` 是字符串（`'543'`），如需数字运算需 `Number(item.value)`
- [ ] `getImageUrl` 依赖 `designer.env / constants`，传错会导致背景图加载失败

## 3. 样式 `index.less`

### 3.1 命名规范

```less
.top-rank-container {  // 根 class（与 oss-material.json.name 一致 ✓）
    .top-rank-container-item { ... }
    .top-rank-container-item-index { ... }
    .top-rank-container-item-name { ... }
    .top-rank-container-item-right { ... }
    .top-rank-container-item-value { ... }
    .top-rank-container-item-unit { ... }
}
```

> 命名规范遵循"根 class + 子节点"模式，但每个子节点都用 `.top-rank-container-item-*` 前缀，可读性较好。

### 3.2 关键样式

```less
.top-rank-container {
    .top-rank-container-item {
        display: flex;
        align-items: center;
        background-repeat: no-repeat;
        background-position: center;
        background-size: 100%;

        .top-rank-container-item-index {
            width: 20%;            // 序号列宽 20%
            display: flex;
            justify-content: center;
            text-align: center;
        }

        .top-rank-container-item-name {
            width: 40%;            // 名称列宽 40%
        }

        .top-rank-container-item-right {
            width: 40%;            // 数值+单位列宽 40%
            display: flex;
            align-items: baseline;
        }

        .top-rank-container-item-value {
            width: 50%;
            text-align: right;
        }

        .top-rank-container-item-unit {
            margin-left: 5px;
            width: 50%;
        }
    }
}
```

**注意**：
- 三列宽比 `20% / 40% / 40%`
- `.top-rank-container-item-value` `text-align: right`（数值右对齐），单位不右对齐
- ⚠️ 列宽是**百分比**，与 `itemStyle.width` 独立，可能在小宽度下挤压
- 整行 `background-size: 100%` 让背景图铺满每行

### 3.3 维护检查清单

- [ ] 根 class 与 `oss-material.json.name` 一致（`top-rank-container`）✓
- [ ] 容器未显式 `position: relative`（实际通过 flex 布局）
- [ ] 修改列宽时注意 `20% + 40% + 40% = 100%`
- [ ] `align-items: baseline` 让数值和单位基线对齐

## 4. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 大量数据 | 10+ 项时建议外层容器高度足够，否则会溢出（无虚拟滚动） |
| 频繁刷新 | `dataSource.map` 每次重渲，建议加 `React.memo` 包裹 |
| 背景图加载 | `getImageUrl` 每次调用，建议缓存 |

## 5. 调试小技巧

### 5.1 临时显示所有项的 `index`

```javascript
// 在 index.jsx 渲染时
console.log('item', index, item);
```

### 5.2 临时禁用前三名配色

```javascript
// 注释 itemsSet 覆盖逻辑
// backgroundColor: itemsSet[index] ? itemsSet[index].itemSetting.indexBgColor : indexStyle.backgroundColor,
```

### 5.3 临时固定前三项样式（金 / 银 / 铜）

```javascript
// 在 defaultValue 中修改 itemsSet
itemsSet: [
    { itemSetting: { backgroundImage: '', indexBgColor: '#FFD700', indexBorderColor: '#FFEB99', color: '#FFEB99' } },  // 金
    { itemSetting: { backgroundImage: '', indexBgColor: '#C0C0C0', indexBorderColor: '#E0E0E0', color: '#E0E0E0' } },  // 银
    { itemSetting: { backgroundImage: '', indexBgColor: '#CD7F32', indexBorderColor: '#E0A872', color: '#E0A872' } },  // 铜
],
```

## 6. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 文档化 | 首次编写 5+1 文档；标注 doc/README.md 与代码不一致问题 |
