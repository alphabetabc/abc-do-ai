---
title: 组件逻辑维护
description: dock-menu 组件代码（index.tsx + 内联 ItemTitle）的维护要点
version: 1.0.0
last_updated: 2026-06-16
---

# 组件逻辑维护

本文档说明 `dock-menu` 组件代码（`index.tsx` + 内联子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
dock-menu/
├── index.tsx            # 主组件（含内联 ItemTitle）
├── index.less           # 样式
├── schema.ts            # 配置面板（→ schema.md）
├── dataModel.json       # 数据契约（→ data-model.md）
├── oss-material.json    # 物料元信息
├── type.d.ts            # 类型定义
└── doc/
    ├── readme.md
    ├── CHANGELOG.md
    └── images/
```

## 2. 主组件 `index.tsx`

### 2.1 入口签名

```typescript
const DockMenu: React.FC<DesignerField> = (props) => {
    const { dataSource: data, config, designer: { env, constants, mode } } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（width/height/commonStyle/baseStyle/activeStyle） |
| `dataSource` | array | dataConfig | 菜单项数据数组 |
| `designer` | object | 框架 | 设计器上下文（env/constants/mode） |

### 2.2 关键逻辑

#### 2.2.1 Hover 展开/隐藏

```typescript
const [showInner, setShowInner] = useState(false);

function onMouseEnter() {
    !!!(mode === 'development') && setShowInner(true);
}
function onMouseLeave() {
    !!!(mode === 'development') && setShowInner(false);
}
```

**注意**：
- `mode === 'development'` 时**禁用** hover 交互（设计态不展开）
- `showInner` 控制菜单面板宽度：`showInner ? commonStyle?.width : commonStyle?.hideWidth`
- 热区宽度同样受 `showInner` 控制：`showInner ? hotZone.width : hotZone?.hideWidth`

#### 2.2.2 背景样式格式化 `formateItemBgStyle`

```typescript
const formateItemBgStyle = (style) => {
    const { backgroundImg, backgroundType, backgroundColor, backgroundRepeat, textStyle, prefix, ...innerStyle } = style;

    if (backgroundType === 'image' && backgroundImg) {
        innerStyle.backgroundImage = `url(${getImageUrl(backgroundImg, { env, constants })})`;
        if (backgroundRepeat && backgroundRepeat === 'full') {
            innerStyle.backgroundSize = '100% 100%';
            innerStyle.backgroundRepeat = 'no-repeat';
        } else {
            innerStyle.backgroundRepeat = backgroundRepeat;
        }
    } else if (backgroundColor) {
        innerStyle.backgroundColor = backgroundColor;
    }

    const result = { ...innerStyle, ...textStyle };
    return result;
};
```

**注意**：
- 从 style 中解构并移除 `backgroundImg/backgroundType/backgroundColor/backgroundRepeat/textStyle/prefix`
- `backgroundType === 'image'` 时设置 `backgroundImage`；`'color'` 时设置 `backgroundColor`
- `backgroundRepeat === 'full'` 时特殊处理为 `backgroundSize: '100% 100%'`
- 最后合并 `textStyle`（字体样式覆盖到结果对象）
- 每个菜单项根据 `isActive` 分别调用 `formateItemBgStyle(activeStyle)` 或 `formateItemBgStyle(baseStyle)`

#### 2.2.3 菜单项渲染与选中逻辑

```typescript
{data.map((item, index) => {
    const isActive = commonStyle.activeKey.toString() === item.key;
    const itemBgStyle = isActive ? formateItemBgStyle(activeStyle) : formateItemBgStyle(baseStyle);
    const itemNameStyle = isActive ? activeStyle : baseStyle;
    return (
        <div key={`${item.url}_${index}`} className="icon-block" onClick={_.partial(onItemClick, item.url, isActive)} style={itemBgStyle}>
            <ItemTitle style={itemNameStyle} titleName={item.title} />
        </div>
    );
})}
```

**匹配规则**：
- `commonStyle.activeKey.toString() === item.key` — 字符串比较
- 选中项使用 `activeStyle`，非选中项使用 `baseStyle`
- `onItemClick` 在非开发模式下且非选中项时执行 `window.location.assign(url)`

#### 2.2.4 渲染层级

```
.pc-dock-wrapper（根容器，动态宽度）
├── .hot-zone（热区，z-index: 999，hover 触发）
│   └── onMouseEnter / onMouseLeave
└── .dock-inner（菜单面板，transition 动画）
    ├── .icon-block × N（菜单项）
    │   └── ItemTitle（内联组件）
    │       ├── .icon-inner-complex（有前缀时）
    │       │   ├── Image（前缀图标）
    │       │   └── .item-title（标题文本）
    │       └── .icon-inner-single（无前缀时）
    │           └── .item-title（标题文本）
```

### 2.3 维护检查清单

- [ ] `mode === 'development'` 时 hover 交互被禁用
- [ ] `activeKey` 比较使用 `.toString()`，确保字符串/数字兼容
- [ ] `onItemClick` 中 `!!!isActive` 确保已选中项不重复跳转
- [ ] `window.location.assign(url)` 直接跳转，非 react-router 路由

## 3. 子组件 `ItemTitle`（内联）

### 3.1 职责

渲染菜单项的前缀图标 + 标题文本。根据 `prefix.show` 决定是否显示前缀图标。

### 3.2 关键 props

| prop | 类型 | 来源 | 说明 |
| --- | --- | --- | --- |
| `style` | object | `baseStyle` / `activeStyle` | 含 `prefix` 配置 |
| `titleName` | string | `dataSource[].title` | 菜单项名称 |

### 3.3 渲染逻辑

```typescript
const ItemTitle = ({ style, titleName }) => {
    const { prefix } = style;
    if (prefix.show) {
        const { prefixImg, ...innerStyle } = prefix;
        return (
            <div className="icon-inner-complex">
                <Image preview={false} style={{ ...innerStyle }} src={getImageUrl(prefixImg, { env, constants })} />
                <div className={cx('item-title', { right: commonStyle.hotZone.position === 'right' })}>{titleName}</div>
            </div>
        );
    } else {
        return (
            <div className="icon-inner-single">
                <div className={cx('item-title', { right: commonStyle.hotZone.position === 'right' })}>{titleName}</div>
            </div>
        );
    }
};
```

### 3.4 维护检查清单

- [ ] `prefix.show` 为 true 时显示前缀图标，否则只显示标题
- [ ] 热区位置为 'right' 时标题添加 `.right` class
- [ ] 前缀图片使用 `oss-ui` 的 `Image` 组件（非原生 img）

## 4. 样式 `index.less`

### 4.1 命名规范

```less
.pc-dock-wrapper {  // 根 class
    .hot-zone { ... }
    .dock-inner { ... }
    .icon-block { ... }
}
```

### 4.2 关键样式

```less
.pc-dock-wrapper {
    position: absolute;
    left: 0;
    top: 0;

    .hot-zone {
        position: absolute;
        height: 100%;
        width: 80px;
        z-index: 999;
        &.dev-mode { background-color: rgba(242, 211, 149, 0.502); border: 2px dashed rgba(237, 160, 5, 0.98); }
        &.left { left: 0; top: 0; }
        &.right { right: 0; top: 0; }
    }

    .dock-inner {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        transition: transform 0.45s;
        z-index: 999;
        padding: 10px 0;

        &.left.preview-mode { transform: translateX(-100%); }
        &.left.show { transform: translateX(0); }
        &.right.preview-mode { transform: translateX(100%); }
        &.right.show { transform: translateX(0); }
    }

    .icon-block {
        height: 62px;
        cursor: pointer;
        transition: transform 0.45s;
        text-align: center;
    }
}
```

### 4.3 维护检查清单

- [ ] 根 class 是 `pc-dock-wrapper`（注意不是物料名 `dock-menu`）
- [ ] 热区 `z-index: 999`，菜单面板 `z-index: 999`
- [ ] `.dock-inner` 使用 `transition: transform 0.45s` 实现滑动动画
- [ ] `.preview-mode` 时菜单面板默认隐藏（translateX(-100%) / translateX(100%)）
- [ ] `.show` 时菜单面板滑入（translateX(0)）

## 5. 常用工具函数

| 函数 | 来源 | 用途 |
| --- | --- | --- |
| `getImageUrl` | `@Utils` | 通用图片 URL（带 designer 上下文） |
| `_.partial` | `oss-web-toolkits` | 函数柯里化（绑定 item.url 和 isActive） |
| `cx` | `classnames` | 条件 class 拼接 |

## 6. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 菜单项较多（>50） | 每次 hover 触发所有菜单项重渲染，`formateItemBgStyle` 对每项执行 |
| 频繁 hover | `showInner` 状态切换触发整个组件重渲染 |
| 背景图加载 | `getImageUrl` 可能触发网络请求，影响首帧 |

## 7. 调试小技巧

### 7.1 查看当前选中的菜单项

```typescript
// index.tsx
console.log('activeKey:', commonStyle.activeKey, 'matched item:', data.find(item => commonStyle.activeKey.toString() === item.key));
```

### 7.2 设计态查看热区

开发模式下热区会显示半透明黄色背景 + 虚线边框（`.dev-mode` 样式），方便调试热区位置。

### 7.3 强制展开菜单面板

```typescript
// index.tsx
// 临时强制展开
// const [showInner, setShowInner] = useState(true);
```

## 8. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 文档化（基于 develop 分支代码） | 首次梳理 |
