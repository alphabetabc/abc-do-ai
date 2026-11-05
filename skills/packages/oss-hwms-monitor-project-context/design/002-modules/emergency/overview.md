# emergency · 应急保障报表

> 上位文档：`001-overview/001-overview.md`

## 职责

路由 `/report/emergency`。应急保障概况报表：地市 + 月份条件查询 VirtualTable，支持 Excel 导出（列配置在模块内 `exportData-collect/detailed.json`）。

## 服务层与接口

- `src/common/services/dataService.js`（sqlServices，baseUrlType `experiencesUrl`，sqlm 下沉查询）
- 导出开关受 environment.json `emergencyServerExport` 控制

## 依赖

search-condition、VirtualTable、upload（导出相关组件）。
