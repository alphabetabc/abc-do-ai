# 详情弹窗列宽配置

详情弹窗的列宽和模态框宽度配置能力。

## 原则

1. **窄口径、增量式**：只覆盖 `width`，不要泛化透传
2. **严格 title 匹配**：只按 `title` 严格匹配，不做 `fieldName`/`dataIndex` 模糊匹配
3. **缺省回退**：配置缺失时使用代码默认列宽和默认逻辑

## 配置位置

`gd-emergency-support.modules.emergency-resources.detailModal` 下，5 个 key：

| key | 组件 | 表格层级 | 配置节点 |
| --- | --- | --- | --- |
| `实时出动` | `EmergencyResourcesDetail` | 2 | `resourceColumns` |
| `全量资源` | `EmergencyResourcesFullDetail` | 2 | `resourceColumns` |
| `跨市调度` | `EmergencyResourcesCrossCityDetail` | 2 | `resourceColumns` |
| `本地预置` | `EmergencyResourcesPresetDetail` | 3 | `resourceColumns` |
| `本地预置-队伍` | `EmergencyResourcesPresetTeamDetail` | 1 | `columns` |

## 模态框宽度

| 字段 | 触发方式 | 配置缺省时的兜底 |
| --- | --- | --- |
| `barModalWidth` | 柱状图点击 | 由 `Modal` 组件 `width={modalWidth ?? 1900}` 兜底为 **1900** |
| `width` | 资源清单按钮点击 | **1900**（代码内 `?? 1900`） |

> 注意：`barModalWidth` **不再** 有 `?? 900` 兜底。当未配置 `barModalWidth` 时，柱状图触发的弹窗会回退到与"资源清单"按钮相同的 1900 宽度。

```typescript
// 模态框宽度：柱状图点击时优先使用 barModalWidth，否则使用 width（默认 1900）
const modalWidth = state._modalSource === "bar"
    ? currentDetailSettings?.barModalWidth
    : (currentDetailSettings?.width ?? 1900);
// ...
<Modal width={modalWidth ?? 1900} ... />

## 完整配置示例

```json
{
    "detailModal": {
        "实时出动": {
            "width": 1900,
            "barModalWidth": 900,
            "resourceColumns": [
                {
                    "title": "人员",
                    "children": [
                        { "title": "总计", "width": 80 },
                        { "title": "任务中(本地)", "width": 135 },
                        { "title": "任务中(被支援)", "width": 155 },
                        { "title": "空闲", "width": 80 }
                    ]
                }
            ]
        },
        "全量资源": {
            "width": 1900,
            "barModalWidth": 900,
            "resourceColumns": [
                {
                    "title": "人员",
                    "children": [
                        { "title": "总计", "width": 80 },
                        { "title": "任务中(本地)", "width": 135 },
                        { "title": "任务中(外派)", "width": 135 },
                        { "title": "空闲", "width": 80 }
                    ]
                }
            ]
        },
        "跨市调度": {
            "width": 1900,
            "barModalWidth": 900,
            "resourceColumns": [
                {
                    "title": "抢修车辆",
                    "children": [
                        { "title": "总计", "width": 80 },
                        { "title": "到达", "width": 100 },
                        { "title": "在途", "width": 100 }
                    ]
                }
            ]
        },
        "本地预置": {
            "width": 1900,
            "barModalWidth": 900,
            "resourceColumns": [
                {
                    "title": "人员",
                    "children": [
                        {
                            "title": "移动",
                            "children": [
                                { "title": "计划", "width": 80 },
                                { "title": "到达", "width": 80 }
                            ]
                        },
                        {
                            "title": "铁塔",
                            "children": [
                                { "title": "计划", "width": 80 },
                                { "title": "到达", "width": 80 }
                            ]
                        }
                    ]
                }
            ]
        },
        "本地预置-队伍": {
            "width": 1900,
            "barModalWidth": 900,
            "columns": [
                { "title": "区域", "width": 80 },
                { "title": "队伍", "width": 100 },
                { "title": "队长", "width": 70 },
                { "title": "电话", "width": 120 },
                { "title": "类型", "width": 70 },
                { "title": "状态", "width": 70 },
                { "title": "任务下发时间", "width": 150 },
                { "title": "要求到达时间", "width": 150 },
                { "title": "预置到位时间", "width": 150 }
            ]
        }
    }
}
```

## 三种实现模式

### 模式 1：2 级表格（实时出动 / 全量资源 / 跨市调度）

```typescript
const applyColumnSettings = (col: any, list: any[] | undefined) => {
    if (!Array.isArray(list)) return;
    const item = list.find((s: any) => s?.title === col.title);
    if (Array.isArray(col.children) && Array.isArray(item?.children)) {
        col.children.forEach((child: any) => {
            const childItem = item.children.find((s: any) => s?.title === child.title);
            if (childItem?.width) {
                child.width = childItem.width;
            }
        });
    }
};

if (!isEmpty(tableColumnsSettings?.resourceColumns)) {
    resourceColumns.forEach((col: any) => {
        applyColumnSettings(col, tableColumnsSettings?.resourceColumns);
    });
}
```

### 模式 2：3 级表格（本地预置）

```typescript
const applyColumnSettings = (col: any, list: any[] | undefined) => {
    if (!Array.isArray(list)) return;
    const item = list.find((s: any) => s?.title === col.title);
    if (!item) return;
    if (Array.isArray(col.children) && Array.isArray(item.children)) {
        col.children.forEach((child: any) => {
            applyColumnSettings(child, item.children);
        });
    } else if (item.width) {
        col.width = item.width;
    }
};

if (!isEmpty(tableColumnsSettings?.resourceColumns)) {
    columns.forEach((col: any) => {
        applyColumnSettings(col, tableColumnsSettings?.resourceColumns);
    });
}
```

### 模式 3：平铺表格（本地预置-队伍）

```typescript
if (!isEmpty(tableColumnsSettings?.columns)) {
    cols.forEach((col) => {
        const item = tableColumnsSettings.columns.find((s: any) => s?.title === col.title);
        if (item?.width) {
            col.width = item.width;
        }
    });
}
```

## 共用约束

- 全部逻辑写在 `useMemo` 内部
- useMemo 依赖必须带上 `tableColumnsSettings`
- 不要把配置相关逻辑写到 `useMemo` 外部
- 不要抽过度通用的 `applyColumnWidth`/`mergeColumnConfig` 公共方法
- 不要递归泛化处理任意属性；后续如需支持 `cellStyle`，应明确设计对应配置结构和赋值位置
- `baseColumns` 暂时只保留代码默认值，不需要在配置中体现
- 缺省配置时必须完全保持现有代码默认列宽

## 相关文档

- [detail.md](detail.md) — 各组件字段与表格结构
- [main.md](main.md) — 配置 key 派发与弹窗来源状态
