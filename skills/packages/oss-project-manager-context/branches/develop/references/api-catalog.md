# api-catalog.md · 接口端点全量清单

> 真源：本仓前端发起的全部后端调用。base URL 策略见下；每条端点附调用文件（仓库根相对路径）。
> 生成日期：2026-11-19（逐文件扫描 `request(` 与 `proxy[` 得出）。

## base URL 策略

两套调用通道，均由 `src/common/api/index.js`（proxy，`createWebService`，baseUrl 取 `environment.serviceDiscovery`）与 `src/common/api/request.js`（request，`createWebRequest`）导出。运行时配置经 hox `useEnvironmentModel`（`src/hox/index.js`）从 `${CONFIG_HOST}/configmanage/environment.json?projectName=oss-project-manager` 加载。

- `requestTransforms` 中若传 `baseUrlType`，按 `env[baseUrlType]` 的 `mode`（direct→`${direct}${url}`；discover→`${serviceDiscovery}/${discover}${url}`）重写地址（src/common/api/index.js、src/common/api/request.js）。
- 本仓实际使用的 `baseUrlType` 取值（全仓扫描）：
  - `exportUrl`：全部业务 service/api.js（home-page、new-project、quick-project、resource-search、search-demo、treasury-auth-flow-anhui）。
  - `default`：`src/common/services/dataService.js` 的 sqlm 通道。
  - `tokenUrl`：`src/App.js` L89 `bss/api/v1/user`。
  - `userUrl`：`src/App.js` L110/L128 `api/v1/users/*`。
- sqlm 端点：`apply/execute`（单 sqlId）与 `apply/executeIdList`（多 sqlId 批量）；responseTransforms 对这两个端点做下划线→驼峰转换（src/common/api/index.js、src/common/api/request.js）。
- 超时：200000ms（src/common/api/config.js）。

## 方式 A · request() 直连端点（按模块）

### home-page（src/pages/home-page/service/api.js，均 baseUrlType=exportUrl）

| 端点 | 行 | 用途 |
| --- | --- | --- |
| homePage/getProjectInfo | L14 | 工程查询（核心） |
| appointment/selectArProjectInfoByPrimaryKey | L28 | 工程信息校验 |
| /homePage/terminateProject | L42 | 提前结束工程 |
| homePage/deleteProject | L56 | 删除工程 |
| appointment/options | L70 | 高级预约下拉 |
| netWork/exportNwInfo / exportNwInfoAsync / exportNwInfoBatch | L85/101/142 | 网元导出（同步/异步/批量） |
| netWork/getProcess/${userId} | L116 | 异步导出进度 |
| netWork/downloadExportedFile?userId= | L131 | 下载导出文件 |
| appointment/senior/insetProjectInfo | L160 | 高级预约插入 |
| appointment/updateArProInfo | L174 | 更新工程 |
| arProStatusImp/*（select/selectTmp/insert/update/delete ×网元与链路 DateLk 变体，约 20 个） | L188~L464 | 网元/链路临时表与正式表 CRUD |
| netWork/downloadExcelModel / uploadExcel / confirmImport / revoke / getImportModelOptions / downloadModelByNename | L478~L566 | 网元导入导出 |
| v1/alarmAdvice/export | L507 | 告警建议导出 |
| appointment/getUserInfo | L583 | 用户信息 |
| homePage/getLegalUsers / addUrgentUser | L598/613 | 加急用户 |
| netWork/exportProInfo | L626 | 工程导出 |
| homePage/findAlarmMarked | L656 | 告警标记查询 |
| netWork/queryColumnConfig / saveColumnConfig | L671/685 | 导出列配置 |

已知坑：`arProStatusImp/deleteTmpArProStatusImp` 在本文件 L397 与 L412 定义两次（类字段，后者覆盖前者）。

### new-project（src/pages/new-project/service/api.js，均 exportUrl）

| 端点 | 行 |
| --- | --- |
| appointment/selectArProjectInfoByPrimaryKey / senior/insetProjectInfo / createProject / updateArProInfo / updateProject | L15/29/43/57/71 |
| arProStatusImp/*（含 selectTccArProStatusImp、insertTmpArProStatusImpWithPeriod、checkDuplicate 变体） | L85~L414 |
| netWork/*（downloadExcelModel/uploadExcel/confirmImport/revoke/getImportModelOptions/downloadModelByNename） | L428~L516 |
| v1/alarmAdvice/export | L457 |
| appointment/getUserInfo / options | L553/567 |
| project/approval/judge、project/approval、project/approval/isProvinceCompany | L581/590/690 |
| appointment/downloadExcelModel / importProInfo / sendSms / findApprovalUser / checkIfHoliday | L616~L675 |
| v1/reportAppointment | L705 |
| neInfo/getPortDetail | L720 |

已知坑：`deleteTmpArProStatusImp` 同样重复定义（L348/L362）。

页内直连（不经 service）：`src/pages/new-project/subjects/new-project-fgss/search-fgss/index.jsx` L376、`.../new-project-gcss/search-gcss/index.jsx` L160 调 `appointment/options`；`src/pages/new-project/upload/index.jsx` L115 调 `netWork/downloadErrorExcel`。

### quick-project（src/pages/quick-project/service/api.js，均 exportUrl）

new-project 的裁剪版；差异：存在 `quick/arProStatusImp/*` 前缀变体（L96/113/207/240/353），无 createProject/updateProject、sendSms、v1/reportAppointment、neInfo/getPortDetail。`src/pages/quick-project/upload/index.jsx` L87 调 `netWork/downloadErrorExcel`。

### resource-search（src/pages/resource-search/api.js，exportUrl）

| 端点 | 行 | 用途 |
| --- | --- | --- |
| appointment/options | L21 | 区域树等参数 |
| projectResource/findObjectsByCondition | L35 | 核心查询 |
| projectResource/export | L49 | 导出 |

### system-options（src/pages/system-options/systemOptions.js）

走 dataService（sqlm 通道，见方式 B 的 system-options 节）。

### demo/search-demo（src/pages/search-demo/index.jsx，exportUrl）

| 端点 | 行 |
| --- | --- |
| appointment/options | L483 |
| neInfo/findNeinfo | L739 |
| neInfo/exportNeinfo | L882 |

### 公共组件（src/components/treasury-auth-flow-anhui/index.jsx，exportUrl）

`alarmmodel/treasury4A/v1/getAccount`（L68）、`getTreasuryStatus`（L85）、`remoteFirstAuth`（L100）、`remoteSecondAuth`（L115）——安徽 4A 金库认证流。

### App.js（src/App.js，tokenUrl/userUrl）

| 端点 | 行 | baseUrlType | 用途 |
| --- | --- | --- | --- |
| bss/api/v1/user | L89 | tokenUrl | hash token 换用户信息 |
| api/v1/users/${id} | L110 | userUrl | 用户地区 zones |
| api/v1/users/${id}/roles | L128 | userUrl | 用户角色 isAdmin |

## 方式 B · dataService sqlm 通道（sqlId）

通道：`src/common/services/dataService.js` = `sqlServices(proxy, sqlConfig, {multiplePropKey:'apply/executeIdList', singlePropKey:'apply/execute', baseUrlType:'default'})`；sqlId 定义在 `src/common/services/configs.js`（75 个条目，含 dataSourceName NMOSDB/NRMDB，见 `src/common/services/constants.js` dbNames）。

### 已使用的 sqlId（19 个）

| sqlId | 调用文件 |
| --- | --- |
| selectArProjectInfoByPrimaryKey、insertArProStatusImpFromTemp、deleteTmpArProStausImpBySessionId、selectProjectByCondtion、deleteProjectNeStatusForProjectDelete、deleteProjectLinkNeStatusForProjectDelete、insertArProStatusDateLkImpFromTemp、deleteTmpArProStausDateLkImpBySessionId、selectLinkProjectByCondtion、selectProjectTypeObj | src/pages/new-project/service/apiSqlm.js 与 src/pages/quick-project/service/apiSqlm.js（两文件内容相同，复制分叉） |
| selectNewProjectCities | src/pages/new-project/subjects/new-project-gcss/search-gcss/index.jsx |
| selectGcssNe | 同上 |
| selectFgssNe / selectFgssBoardNe / selectFgssPortNe / selectFgssONUNe / selectFgssONUBoard / selectFgssONUPort | src/pages/new-project/subjects/new-project-fgss/search-fgss/index.jsx |
| selectIpInfoByNeListInfo | src/pages/new-project/subjects/new-project-ip/new-project-ip-resources/index.jsx |
| selectSpcInfoByNeListInfo | new-project-spc/new-project-spc-resources/index.jsx、new-project-link/new-project-link-resources/index.jsx |
| selectLinkInfoByNeListInfo | new-project-link/new-project-link-resources/index.jsx |
| InsertProjectTypeObj、UpdateProjectTypeModuleObj、DeleteProjectTypeModule、selectProjectTypeModuleByCount、selectProjectTypeModuleByPage、selectArProStatusByCount、selectArProStatusByPage、SelectArProStatusObj、InsertArProStatusObj、UpdateArProStatusObj、DeleteArProStatusObj | src/pages/system-options/systemOptions.js |

### 仅定义未使用（56 个）

configs.js 中其余条目全仓无引用，包括：SelectMajor、SelectExperienceLibrary、SelectDeviceCompanys、SelectDeviceTypes、SelectStatusIcon 系列、Insert/Delete/UpdateStatusIconTemplate、SelectAlarmColumnTemplates/Dict、MonitorView 系列、AlarmExperienceLibrary 系列、selectHomePageProjectList、selectProjectObjects、selectNewProjectCitiesAll、insertTmpArProRelation、updateProjectDetailsForAdvanceStop 等 AdvanceStop 系列、updateProjectStatusForProjectDelete 系列、selectCoreMscpool、selectCoreNegrp、selectOMCNameforDaFan、selectTransSubNetWork、selectEmsNameforDaFan、insertTmpArProStausDateLkImp、selectUserIdsByCurUser* 系列、selectHomePageProjectList。新增需求若涉及这些 id，先确认后端 mapper（sql/）仍在再用，勿直接复用。
