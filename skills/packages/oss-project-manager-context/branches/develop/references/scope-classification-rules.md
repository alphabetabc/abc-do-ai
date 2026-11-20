# scope-classification-rules.md · 需求条目归属判定规则

> 用途：评估一条需求时，判定它由本前端仓做、后端做、还是跨系统联调。判定依据全部来自本仓真源（api-catalog.md、reusable-capabilities.md、design/modules/*）。

## 判定规则

### 前端做（本仓 oss-project-manager）

1. 纯 UI / 交互变化：现有路由页面（src/routes/index.js 的 14 条路由）内的展示、表单、弹窗、列配置调整。
2. 前端导出：`src/pages/common/export.js` 能满足的本地 Excel 拼装。
3. environment.json 开关类个性化：显隐、列配置、省分差异（参照 modules/003 的 isHLJDisabled/isAHEms/specificProvince 模式）。
4. hox 模型/微前端桥层面的状态传递（src/hox/、src/share/actions.js）。

### 后端做（接口/数据侧，前端仅改调用）

1. 需要新端点或改返回结构：本仓端点全部列在 api-catalog.md，若端点不存在或字段不够 → 后端新增/修改，前端补 service 方法。
2. sqlm 数据：新 sqlId 需后端在 mapper（sql/，前端只读）定义并登记；前端只需在 `src/common/services/configs.js` 加配置 + 调 dataService。configs.js 中 56 个「仅定义未使用」的 sqlId 复用前需后端确认仍有效。
3. 工程状态/工程类型等字典数据变更：存库经 system-options 维护，不是前端改代码。

### 跨系统联调

1. qiankun 主应用相关：登录/用户信息注入、主题切换、全局状态（src/index.js mount props、src/share/actions.js、tokenUrl/userUrl 端点）→ 需主应用（portal）配合。
2. 审批流：project/approval 接口对接审批系统；短信 appointment/sendSms 对接短信平台。
3. 4A 金库认证（安徽）：treasury-auth-flow-anhui 组件 + alarmmodel/treasury4A/* 端点。
4. 异步导出：netWork/exportNwInfoAsync + getProcess + downloadExportedFile 三段式，后端任务队列 + 前端轮询。

## 例外与陷阱

- home-executing 无独立逻辑（10 行包装器），「改安徽正在执行页」需求实际落 home-page（modules/002）。
- quick-project 是 new-project 复制分叉：改通用建项逻辑通常需**双改**两边 service/subjects/model 同名文件。
- search-demo/demo/test 是调试残留页，除排障外不在此承接需求（modules/007）。
- 「前端导出 vs 后端导出」二选一：大数据量必须走后端（netWork/export*），勿用 export.js 硬扛。
- 新增页面需同步三处：src/routes/index.js 路由项、src/pages 新目录、design/modules 新文档（续编号）。
