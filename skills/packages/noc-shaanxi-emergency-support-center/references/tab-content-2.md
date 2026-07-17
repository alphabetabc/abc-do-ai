# TabContent2（中屏突发保障）

突发保障 Tab 容器。很薄，只是一个壳，把 props 透传给 `CenterSuddenGis`。

- 源文件：[tab-content-2/index.tsx](web/pages/emergency-support/modules/center/components/tab-content-2/index.tsx)

## 职责

1. 渲染左右两侧栏
2. 把 `{...props}` 透传给 `CenterSuddenGis` 组件

## 与 TabContent1 的差别

| 项 | TabContent1 | TabContent2 |
|---|---|---|
| 子组件 | `CenterPath` + `CenterGis` 切换 | 直接 `CenterSuddenGis` |
| 状态机 | `mapType`/`drillZone`/`leftRepairZone` | 没有，由 `Gis` 内部管 |
| 外部抢修回流 | 支持 | 支持（由 `Gis` 内 effect 处理） |
| 区域配置 | 无 | **有**（突发保障可配置多个区域） |

## 渲染

```tsx
<div className="full-width full-height tab-content-2">
    <div className="side"></div>
    <div className="center">
        <CenterSuddenGis {...props} />
    </div>
    <div className="side side-right"></div>
</div>
```

## className

- 根：`tab-content-2`
- 两侧栏：`.side` / `.side.side-right`

## 易踩坑

- 容器没有 state，所有逻辑在 `CenterSuddenGis` + `Gis` 里，**修改回流 / 区域配置逻辑不要写在这里**
- 不要在这里接收额外 props，全部走 `{...props}` 透传

> 版本：v1.0 · 创建日期：2026-07-13
