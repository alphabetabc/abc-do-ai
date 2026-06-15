---
title: 组件代码模式
description: 物料组件实现模式，包含基础模板、props 契约、class 命名规范、常用工具、hooks 注意事项、数据读取规范、渲染层级、性能要点、调试技巧
version: 1.0.0
last_updated: 2026-06-12
---

# 组件代码模式

> 本文档从 `SKILL.md` 抽出，集中说明物料组件的实现模式。
> SKILL.md 仅作为入口，详细规范在此查阅。

## 1. 基础模板

```typescript
import type { DesignerField } from '@fedx-vis/designer-types';
import React from 'react';
import './index.less';

const MyComponent: React.FC<DesignerField> = (props) => {
    const { config } = props;
    const { width, height, containerStyle, contentStyle } = config;

    const getContainerStyle = (): React.CSSProperties => {
        const style: React.CSSProperties = { width, height };

        if (containerStyle?.bgType === 'image' && containerStyle?.bgImage) {
            style.backgroundImage = `url(${containerStyle.bgImage})`;
        } else if (containerStyle?.bgColor) {
            style.backgroundColor = containerStyle.bgColor;
        }

        return style;
    };

    return (
        <div className="my-component-root" style={getContainerStyle()}>
            <div className="my-component-content">{props.children}</div>
        </div>
    );
};

export default MyComponent;
```

## 2. props 契约

```typescript
interface DesignerField {
    config: object;          // 用户配置（来自 schema）
    dataSource: any[];       // 数据数组（来自 dataConfig）
    designer: object;        // 设计器上下文
    interaction: {           // 交互（可空）
        defined: any;
        dispatch: (params) => void;
    };
    children?: ReactNode;
}
```

## 3. Class 命名规范

根据 `oss-material.json` 的 `name` 字段（kebab-case）：

```typescript
const COMPONENT_NAME = 'common-container';

// class 命名
`${COMPONENT_NAME}-root`      // common-container-root
`${COMPONENT_NAME}-header`    // common-container-header
`${COMPONENT_NAME}-title`     // common-container-title
`${COMPONENT_NAME}-extra`     // common-container-extra
`${COMPONENT_NAME}-content`   // common-container-content
```

**根 class 可省略 `-root` 后缀**（如 `free-layout-indicators-viewer`）。

## 4. 常用工具

| 工具 | 来源 | 用途 |
|------|------|------|
| `getMaterialImageUrl` | `@Src/utils/getImageUrl` | 解析物料静态资源 |
| `useLatest` | `@Src/hooks/useLatest` | 闭包内取最新 props |
| `_` | `oss-web-toolkits` | lodash 工具集（**必须用 `_.get` 兜底读取**） |
| `DigitalNumber` | `@Src/components/digital-number` | 数字翻牌器 |

## 5. hooks 注意事项

### 5.1 useMemo 依赖

```typescript
const points = useMemo(() => {
    // ...
    return config.layout.points.map((point) => {
        const dataItem = dataSource.find((item) => item.indicatorId === point.id);
        // ...
    });
}, [config.indicatorItemSetting, config.layout.points, dataSource]);
```

- 依赖数组**必须完整**，否则会拿到旧值
- 涉及 `props.designer` 时用 `useLatest` 避免过期闭包

### 5.2 闭包陷阱

```typescript
const latestProps = useLatest(props);

useMemo(() => {
    // 闭包内用 latestProps.current 取最新值
    return getMaterialImageUrl(name, latestProps.current, dir);
}, [name, latestProps]);
```

## 6. 数据读取规范

```typescript
// ✅ 推荐：用 _.get 兜底
const value = _.get(props, 'dataItem.indicatorValue', '');
const fontSize = _.get(props, 'indicatorValueSetting.fontSetting.fontStyle.fontSize', 16);

// ❌ 禁止：直接点链访问
const value = props.dataItem.indicatorValue;  // dataItem 不存在时崩溃
```

## 7. 渲染层级最佳实践

```
组件根（position: relative）
├── 背景层（position: absolute, z-index: 0）
├── 内容层（position: relative, z-index: 1）
└── 事件层（position: absolute, z-index: 999）
```

**事件层置顶**确保点击事件能正确触发。

## 8. 性能要点

| 场景 | 建议 |
|------|------|
| 列表项 < 20 | 无需优化 |
| 20-50 | `useMemo` 缓存列表 |
| 50-200 | 虚拟滚动 / canvas 渲染 |
| ≥ 200 | 重构，避免 React 全量渲染 |

## 9. 调试技巧

```typescript
// 临时查看最终 props
console.log('[component]', { config, dataSource, designer });

// 临时高亮边界
style={{ ..., outline: '1px solid red' }}

// 临时禁用某个功能
$enableGradient={false}
```
