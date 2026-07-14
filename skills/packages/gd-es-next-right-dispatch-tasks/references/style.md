# 样式

样式集中在两个 `index.css`：

- [dispatch-tasks/index.css](apps/main/app/components/right/dispatch-tasks/index.css) — 主组件（顶部工具条）
- [dispatch-tasks/dispatch-summary/index.css](apps/main/app/components/right/dispatch-tasks/dispatch-summary/index.css) — 汇总子组件
- [dispatch-tasks/resource-usage/index.css](apps/main/app/components/right/dispatch-tasks/resource-usage/index.css) — 资源子组件

## 关键 class

### 主组件 `dispatch-tasks/index.css`

| class                                   | 作用                                            |
| --------------------------------------- | ----------------------------------------------- |
| `.dispatch-tasks-container`             | 上下两行的容器（padding: 5px 6px）              |
| `.dispatch-tasks-header`                | 行头（高 20，绿色左边框 `rgb(13, 255, 122)`）   |
| `.dispatch-tasks-header-title`          | 行头标题（白字 18px）                           |
| `.dispatch-tasks-header-right`          | 行头右侧容器（flex 居右）                       |
| `.dispatch-tasks-header-date`           | 日期选择器容器                                  |
| `.dispatch-tasks-header-type`           | 专业类型 Tab 容器                               |
| `.dispatch-tasks-header-type > div`     | Tab 单项（90×24，hover 样式）                   |
| `.dispatch-tasks-header-type > .active` | Tab 选中态（灰底圆角 `rgba(172, 178, 192, 1)`） |

### DispatchSummary `dispatch-summary/index.css`

| class                                                          | 作用                                         |
| -------------------------------------------------------------- | -------------------------------------------- |
| `.dispatch-tasks-dispatch-summary-content`                     | 整体内容（650px 高）                         |
| `.dispatch-tasks-dispatch-summary-top`                         | 顶部统计行（flex 3 卡）                      |
| `.dispatch-tasks-dispatch-summary-top-item`                    | 顶部统计卡（289×90，半透白底）               |
| `.dispatch-tasks-dispatch-summary-top-item-title-line`         | 标题色条（蓝/黄/绿）                         |
| `.dispatch-tasks-dispatch-summary-top-item-title-text`         | 标题文字（白 80% 透明）                      |
| `.dispatch-tasks-dispatch-summary-top-item-value-number`       | 数值（D-DIN-PRO 大字号）                     |
| `.dispatch-tasks-dispatch-summary-top-item-value-unit`         | 单位（白 60% 透明）                          |
| `.dispatch-tasks-dispatch-summary-center`                      | 中部 Tab + 输入区                            |
| `.dispatch-tasks-dispatch-summary-center-efficiency`           | 效率 Tab 容器                                |
| `.dispatch-tasks-dispatch-summary-center-efficiency > .active` | 效率 Tab 选中态                              |
| `.dispatch-tasks-dispatch-summary-input`                       | 检索输入框（240×24）                         |
| `.dispatch-summary-bottom`                                     | 底部表格容器                                 |
| `.dispatch-summary-bottom-table`                               | 队伍/工单表格                                |
| `.dispatch-summary-bottom-table-order`                         | 工单表格（斑马纹反向）                       |
| `.row-selected`                                                | 行选中态（蓝半透 `rgba(41, 122, 191, 0.5)`） |
| `.dispatch-summary-bottom-table-steps`                         | Steps 步骤样式（覆盖 fedx-ui）               |
| `.dispatch-summary-steps-item-abnormal`                        | Steps 异常结束步骤（金黄）                   |

### ResourceUsage `resource-usage/index.css`

| class                                            | 作用                            |
| ------------------------------------------------ | ------------------------------- |
| `.dispatch-tasks-resource-usage-content`         | 整体内容（180px 高，flex 左右） |
| `.dispatch-tasks-resource-usage-liquid`          | 水球图容器（150×130）           |
| `.right-part`                                    | 右侧饼图组容器（flex 3 卡）     |
| `.dispatch-tasks-resource-usage-child`           | 单个饼图卡片（min-width 440）   |
| `.dispatch-tasks-resource-usage-header`          | 卡片头部（金黄左边框）          |
| `.dispatch-tasks-resource-usage-title`           | 卡片标题                        |
| `.dispatch-tasks-resource-usage-pie`             | 饼图区域（flex 总数 + ECharts） |
| `.dispatch-tasks-resource-usage-pie-total-text`  | "XX总数" 文字                   |
| `.dispatch-tasks-resource-usage-pie-total-value` | 数值（D-DIN-PRO 40px）          |

## 表格样式（基于 fedx-ui）

`dispatch-summary` 表格覆盖 Ant Design / FedX UI 默认样式：

```css
.dispatch-summary-bottom-table {
    .fedx-ui-table-thead .fedx-ui-table-cell {
        background-color: transparent !important;
        &::before {
            display: none;
        } /* 隐藏 thead 边框 */
    }
    .fedx-ui-table {
        background-color: transparent !important;
    }

    .fedx-ui-table-tbody {
        .fedx-ui-table-row:nth-child(odd) {
            background-color: transparent;
        }
        .fedx-ui-table-row:nth-child(even) {
            background-color: rgba(96, 103, 117, 0.3);
        }
        .fedx-ui-table-cell-row-hover {
            background-color: rgba(41, 122, 191, 0.5) !important;
        }
    }

    /* 工单表格：反向斑马纹 */
    &.dispatch-summary-bottom-table-order {
        .fedx-ui-table-tbody {
            .fedx-ui-table-row:nth-child(even) {
                background-color: transparent;
            }
            .fedx-ui-table-row:nth-child(odd) {
                background-color: rgba(96, 103, 117, 0.3);
            }
        }
    }
}
```

## Steps 样式（覆盖 fedx-ui）

```css
.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-icon {
    border: 1px solid rgba(61, 255, 99, 0.6) !important;
    background: rgba(61, 255, 99, 0.2) !important;
    width: 20px !important;
    height: 20px !important;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-wait .fedx-ui-steps-item-icon {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border: 1px solid rgba(255, 255, 255, 0.6) !important;
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-tail::after {
    background-color: rgba(61, 255, 99, 0.6) !important; /* 已完成连线 */
}

.dispatch-summary-bottom-table-steps .fedx-ui-steps-item-wait .fedx-ui-steps-item-tail::after {
    background-color: rgba(255, 255, 255, 0.6) !important; /* 未完成连线 */
}

/* 异常结束步骤 */
.dispatch-summary-bottom-table-steps .dispatch-summary-steps-item-abnormal .fedx-ui-steps-item-icon {
    background: rgba(247, 181, 1, 0.27) !important;
    border: 1px solid rgba(251, 212, 103, 1) !important;
}
.dispatch-summary-bottom-table-steps .dispatch-summary-steps-item-abnormal .fedx-ui-steps-item-title,
.dispatch-summary-bottom-table-steps .dispatch-summary-steps-item-abnormal .anticon {
    color: rgba(251, 212, 103, 1) !important;
}
```

## 注意事项

- 项目中的表格 / Steps 使用 `.fedx-ui-*` 类名覆盖底层组件库，**修改时要确认实际 DOM 类名仍一致**。
- 顶部统计卡固定 **3 个**，多于 3 个需要调整 `dispatch-tasks-dispatch-summary-top` 布局。
- Tab 选中态统一规则：`.active` 类加灰底 `rgba(172, 178, 192, 1)` + 黑字 `rgba(36, 38, 48, 1)`。
- ECharts 样式统一在 `index.tsx` 内联配置（颜色、位置），无独立配置文件。

## 相关文档

- [main.md](./main.md) — 主组件
- [dispatch-summary.md](./dispatch-summary.md) — 汇总子组件
- [resource-usage.md](./resource-usage.md) — 资源子组件
