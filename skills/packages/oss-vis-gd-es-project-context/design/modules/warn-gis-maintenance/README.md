---
name: gd-es-next-warn-gis-maintenance
description: 用于维护和拓展 warn-gis 预警感知 GIS 组件的可复用技能，涵盖 center-gis 地图引擎与 risk-prediction-points 风险预测打点模块（天气、气象预警、水情预警、高风险乡镇）
tags:
    - GIS
    - 预警
    - 维护
    - 风险预测打点
---

# warn-gis 组件维护技能 (Skill)

## 技能概述

用于维护和拓展 `warn-gis` 预警感知 GIS 组件，覆盖两大核心模块：

1. **center-gis**：地图引擎层（地图初始化、图层管理、应急资源打点、聚合、zIndex 体系）。
2. **risk-prediction-points**：风险预测打点层（天气、气象预警、水情预警、高风险乡镇）。

## 使用场景

- 添加新图例项 / 新增打点类型 / 修改弹窗字段 / 添加地图图层
- 调试数据不更新问题 / 优化性能问题 / 扩展台风功能 / 添加新的预警类型
- zIndex 体系（数据层赋值 + 渲染层消费）
- 风险预测打点模块（天气/气象预警/水情预警/高风险乡镇）：修改 `risk-prediction-points` 相关代码、调整打点展示、修改弹窗/详情卡片/图例控制/点位数据匹配逻辑、排查打点不显示/弹窗被遮挡/数据不更新

## 技能模块索引

详细操作指南已拆分到 `references/` 目录，按需查阅：

### center-gis 地图引擎

| 模块         | 文档                                                              | 涵盖内容                                                                     |
| ------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 模块 1-5     | [center-gis-operations.md](./references/center-gis-operations.md) | 图例管理、打点管理、弹窗字段、图层管理、调试技巧                             |
| 模块 6-9     | [center-gis-advanced.md](./references/center-gis-advanced.md)     | 性能优化、同经纬度处理、扩展功能、zIndex 体系                                |
| 完整技术文档 | [CENTER-GIS.md](./CENTER-GIS.md)                                  | 地图初始化、聚合、图层管理、弹窗系统、API 接口、数据流程、配置参数、性能优化 |

### risk-prediction-points 风险预测打点

| 模块           | 文档                                                                | 涵盖内容                                                                                            |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 模块 10        | [risk-prediction-points.md](./references/risk-prediction-points.md) | 概述、核心组件、Presets、数据获取、API 接口依赖、配置依赖、数据流、常见维护任务、注意事项、故障排查 |
| OverlayPoint   | [overlay-point.md](./references/overlay-point.md)                   | 打点定位、Portal 管理、zIndex 自管理、zoneId 兜底                                                   |
| Weather        | [weather.md](./references/weather.md)                               | 天气图标、温度展示                                                                                  |
| WeatherDetail  | [weather-detail.md](./references/weather-detail.md)                 | 天气详情 Hook（状态、API、弹窗内容结构）                                                            |
| WeatherWarning | [weather-warning.md](./references/weather-warning.md)               | 气象预警图标、预警详情卡片、预警级别映射、点位匹配逻辑                                              |
| WaterWarning   | [water-warning.md](./references/water-warning.md)                   | 水情预警详情、降雨量详情表格                                                                        |
| HighRiskTown   | [high-risk-town.md](./references/high-risk-town.md)                 | 高风险乡镇数量、详情表格、省级统计卡片、退服趋势图、已知 bug                                        |

## 技能检查清单

### 添加新功能

- [ ] 确定组件位置
- [ ] 添加数据请求 (useRequest)
- [ ] 添加状态管理
- [ ] 添加 UI 渲染
- [ ] 添加地图操作 (MapInit)
- [ ] 添加事件处理
- [ ] 测试数据流
- [ ] 测试用户交互

### 调试问题

- [ ] 检查依赖项
- [ ] 检查轮询间隔
- [ ] 检查 ready 条件
- [ ] 添加调试日志
- [ ] 检查数据格式
- [ ] 检查图层配置
- [ ] 检查样式设置

### 性能优化

- [ ] 使用 Ref 缓存数据
- [ ] 使用 useMemo 缓存计算
- [ ] 优化图层清理
- [ ] 减少不必要的重渲染
- [ ] 优化数据结构

## 最佳实践

### 1. 代码组织

- 按功能模块组织文件
- 使用清晰的命名约定
- 添加详细的注释

### 2. 状态管理

- 优先使用组件 state
- 避免过度使用 store
- 使用 ahooks 管理副作用

### 3. 性能优化

- 使用 Ref 存储大数据
- 使用 useMemo 缓存计算
- 优化图层清理逻辑

### 4. 调试技巧

- 添加前缀日志
- 使用条件断点
- 检查数据流

### 5. 测试验证

- 单元测试关键函数
- E2E 测试用户流
- 性能测试大数据量

## 相关资源

### 代码

- `apps/main/app/components/center/warn-gis/` - 组件源码
- `apps/main/app/request/center.ts` - API 请求
- `apps/main/app/store.ts` - 状态管理

### 工具

- React DevTools - 组件调试
- Redux DevTools - 状态调试
- Chrome Performance - 性能分析

---

**技能版本**: 1.3
**最后更新**: 2026-07-08
**维护团队**: GD Emergency Support Team
**更新内容**: 拆分 SKILL.md 为精简索引版，模块 1-5/6-9/10 及业务组件详情迁移至 references/ 目录
