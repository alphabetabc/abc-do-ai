# 001-emap-gis · fedx-gis 地图组件

> 源码：`web/components/ui/emap-gis`。基于外部 EMap 库（OpenLayers 系，运行时动态加载）。

## 快速上手

```tsx
// 方式一：EMapView（带工具栏/事件/轮廓的常用组合）
import { EMapView } from '~/web/components/ui/emap-gis';

<EMapView showToolbar={false} onClick={({ feature, lonLat }) => {}}>
    {children}
</EMapView>;

// 方式二：MapContext（裸容器，自己组合 widgets）
import { MapContext } from '~/web/components/ui/emap-gis/MapContext';
<MapContext className="full-width full-height">
    <YourWidget />
</MapContext>;
```

## 文档索引

| 文档                             | 内容                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| [components.md](./components.md) | 文件清单、组件导出、各子 Widget 的 Props 与用法                    |
| [utils.md](./utils.md)           | useEMapUtil、EMapUtils 方法一览、EMapFormatter / EMapGlobalRequest |
| [loader.md](./loader.md)         | EMap 外部库动态加载机制、EMapConfig 配置项                         |
| [lifecycle.md](./lifecycle.md)   | 地图销毁、TaskScheduler 空闲调度、Widget 副作用模式                |
