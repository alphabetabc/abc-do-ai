# 005-large-screen-page-init.md · 大屏页面骨架初始化

> 作用：基于图像分析或用户描述，初始化大屏页面框架。**只搭框架，不生成具体模块实现。**

## 页面结构模式

```tsx
import { LargeScreenEnv, WidgetsRender } from '~/web/components/large-screen';
import { getWidgets } from './modules';

export default function PageComponent() {
    return (
        <LargeScreenEnv
            className="page-root"
            designWidth={3360} // 取图像原始宽度
            designHeight={1008} // 取图像原始高度
            enableScreenControl={false}
            enableMetaHuman={true}
        >
            <WidgetsRender getWidgets={getWidgets} />
        </LargeScreenEnv>
    );
}
```

## 目录结构

```text
web/pages/<page-name>/
  modules/
    center/          中心组件框架
    section-left/    左侧部分组件框架
    section-right/   右侧部分组件框架
    fields.ts        定义交互字段
    index.ts         注册组件和布局
    screen.ts        大屏实例配置
  index.less
  render.tsx
```

## 图像尺寸规则

基于图像创建页面框架时：分析图像 → 提取原始宽高 → 分别设置为 `LargeScreenEnv` 的 `designWidth` / `designHeight`。

## 核心文件模板

### screen.ts

```typescript
import { createLargeScreen } from '~/web/components/large-screen';

export const { registerWidget, getWidgets, defineInteractionFields, internalFields, screenName } =
    createLargeScreen('page-name');
```

### fields.ts

```typescript
import { defineInteractionFields, internalFields } from './screen';

const widgetFields = defineInteractionFields([
    { value: 'field1', label: 'field1', name: '字段1' },
    { value: 'field2', label: 'field2', name: '字段2' },
]);

export { widgetFields, internalFields };
```

### index.ts

```typescript
import { lazy } from 'react';
import { getWidgets, screenName, registerWidget } from './screen';
import { widgetFields } from './fields';

// 各区域组件注册，layout 尺寸/坐标按图像分析结果填写
registerWidget({
    name: '左侧组件1',
    element: lazy(() => import('./section-left/component1')),
    layout: { width: 0, height: 0, left: 20, top: 32 },
});

registerWidget({
    name: '右侧组件1',
    element: lazy(() => import('./section-right/component1')),
    layout: { width: 0, height: 0, left: 4160, top: 32 },
});

registerWidget({
    name: '中心组件',
    element: lazy(() => import('./center')),
    layout: { width: 0, height: 0, left: 5760 / 2, top: 492 },
});

export { getWidgets, screenName };
```

## 组件注册与布局调整

- 注册时可加 `animateCss`（`fadeIn` / `slideInRight` / `slideInUp` 等动画）
- 运行时改布局：从 `getWidgets()` 找到 `widgetName` 对应项改 `layout`

```tsx
registerWidget({
    name: 'NewWidget',
    element: lazy(() => import('./section-right/NewWidget')),
    layout: { width: 1200, height: 300, left: 0, top: 600 },
    animateCss: 'slideInUp',
});

const widget = getWidgets().find((w) => w.widgetName === 'NewWidget');
if (widget) {
    widget.layout = { ...widget.layout, width: 900, height: 650 };
}
```

## 最佳实践

- 使用高分辨率、组件边界清晰的图像
- 遵循现有代码库模式与命名约定（页面 / 接口层 / mock 三者同 slug 对应）
- 框架生成后再按任务实现具体模块功能
