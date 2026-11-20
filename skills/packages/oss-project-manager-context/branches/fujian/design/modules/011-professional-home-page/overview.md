# 011-professional-home-page

> fujian 独有模块，develop 不存在。调研基线：2026-11-20（task-005，概要级）。

福建跨专业工程预约清单。src/pages/professional-home-page。

## 六要素

| 要素 | 内容 |
| --- | --- |
| 路由与入口 | `/professional-home-page`、`/professional-home-page/cascade-home-page`（src/routes/index.js，fujian 新增） |
| 组件树 | index.jsx（类组件 ProfessionalHomePage）+ home-page-list/ + home-page-export-column/ + cascade-home-page/ + service/api.js |
| 状态管理 | hox（withModel + useEnvironmentModel/useLoginInfoModel/userInfoMap） |
| 接口清单 | 见 service/api.js（深读待任务驱动） |
| 可复用点 | 跨专业清单查询 + 导出列配置（home-page-export-column）+ 级联首页（cascade-home-page） |
| 已知坑 | 未深读，暂无记录 |

> 深读提示：类组件风格（区别于 wireless-person-manager 的函数组件风格），两种风格在本分支并存。
