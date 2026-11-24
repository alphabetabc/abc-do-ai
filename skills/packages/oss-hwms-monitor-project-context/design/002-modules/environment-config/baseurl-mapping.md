# baseUrlType 与接口请求映射

> 基于对 `src/` 全量 grep `baseUrlType` 并逐一 Read 源文件梳理（2026-11-24）。
> baseUrlType 的实际地址来自 `public/environment.json`，代码中不写死环境地址。
> 请求层入口：`src/common/api`（proxy），各业务再经 `src/common/services` 或页面内 `interface-config.js` / `api.js` 封装。

## broadbandUrl

重保家宽服务（environment.json：`broadbandUrl.direct`）。使用文件：src/common/services/broadbandService.js

- `view/getViewItemData`（getViewItemData，POST）

## situationUrl

业务概览视图服务接口（environment.json：`situationUrl.direct`）。使用文件：src/common/services/topoService.js、src/common/services/situationService.js、src/pages/topo/left-tabs/index.jsx

- `view/getViewItemData`（topoService：getViewItemData、getViewTableData；situationService：getViewItemData、getViewTableData、getViewTableItemData；topo/left-tabs：getDeviceList，均 POST）
- `manager/viewServerFile/exportViewResult`（situationService.getExportViewResult，POST，blob 导出）

## situationConfigUrl

业务概览设置服务接口（environment.json：`situationConfigUrl.direct`）。使用文件：src/common/services/broadbandService.js、src/common/services/situationService.js、src/pages/situation/setting/util.js

- 动态 url（broadbandService.getChartConfigData、situationService.getConfigData，POST，端点由调用方传入）
- `manager/viewServerFile/vip-client/import`（importVipClientExcel，POST）
- `manager/viewServerFile/vip-client/download`（vipClientDownload，GET，blob）

## configUrl

指标配置服务（environment.json：`configUrl.direct`）。使用文件：src/common/services/broadbandService.js

- `manager/data-manager/v1/indicator-config/allList`（getConfigData，GET）
- `manager/data-manager/v1/indicator-config/selectedList`（getSelectConfigData，POST）
- `manager/data-manager/v1/indicator-config/selectedAdd`（addSelectConfigData，POST）

## AnalysisRuleUrl

故障分析规则管理（environment.json：`AnalysisRuleUrl.direct`）。使用文件：src/common/interface-config.js、src/pages/analysis-rules-management/common/interface-config.js、src/pages/fault-rules-management/common/interface-config.js、src/pages/fault-diagnosis/common/interface-config.js

通用字典（src/common/interface-config.js，也被 fault-rules-management 合并复用）：

- `cloud-diagnose/circuitinterrupttitle/list/vendor`（vendors，GET）
- `cloud-diagnose/circuitinterrupttitle/list/eqpobjectclass`（eqpObjectClass，GET）

分析规则管理（src/pages/analysis-rules-management/common/interface-config.js）：

- `cloud-diagnose/circuitinterrupttitle/list/moduletype`（moduleTypes，POST）
- `cloud-diagnose/circuitinterrupttitle/list/vendor`（vendors，GET）
- `cloud-diagnose/circuitinterrupttitle/list/eqpobjectclass`（eqpObjectClass，GET）
- `cloud-diagnose/circuitinterrupttitle/save`（addAnalysisRule，POST）
- `cloud-diagnose/circuitinterrupttitle/info`（editAnalysisRule，GET）
- `cloud-diagnose/circuitinterrupttitle/update`（updateAnalysisRule，POST）
- `cloud-diagnose/circuitinterrupttitle/delete`（delAnalysisRule，POST）
- `cloud-diagnose/circuitinterrupttitle/list`（queryAnalysisRuleById / queryAnalysisRules，GET）
- `cloud-diagnose/circuitinterrupttitle/export`（exportAnalysisRule，GET，blob）
- `cloud-diagnose/circuitinterrupttitle/import`（importAnalysisRule，POST，multipart）

故障规则管理（src/pages/fault-rules-management/common/interface-config.js）：

- `cloud-diagnose/circuitinterrupttitle/diagnose/list/moduletype`（moduleTypes，POST）
- `cloud-diagnose/circuitinterrupttitle/diagnose/save`（addFaultRule，POST）
- `cloud-diagnose/circuitinterrupttitle/diagnose/info`（editFaultRule，GET）
- `cloud-diagnose/circuitinterrupttitle/diagnose/update`（updateFaultRule，POST）
- `cloud-diagnose/circuitinterrupttitle/delete`（delFaultRule，POST）
- `cloud-diagnose/circuitinterrupttitle/diagnose/list`（queryFaultRules，GET）
- `cloud-diagnose/circuitinterrupttitle/diagnose/export`（exportFaultRule，GET，blob）
- `cloud-diagnose/circuitinterrupttitle/diagnose/import`（importFaultRule，POST，multipart）

故障诊断（src/pages/fault-diagnosis/common/interface-config.js）：

- `cloud-diagnose/diagnose/export`（导出诊断结果）
- `cloud-diagnose/diagnose/olt/page`（search）
- `cloud-diagnose/diagnose/olt/list`（detail）
- `cloud-diagnose/diagnose/olt/diagnoseOlt`（diagnose）
- `cloud-diagnose/diagnose/onu/page`（search）
- `cloud-diagnose/diagnose/onu/list`（detail）
- `cloud-diagnose/diagnose/olt/diagnoseOnu`（diagnose）
- `cloud-diagnose/diagnose/end/page`（search）
- `cloud-diagnose/diagnose/end/listEnd`（detail）
- `cloud-diagnose/diagnose/end/diagnoseEnd`（diagnose）
- `cloud-diagnose/diagnose/alarm/end`（告警确认/清除）
- `cloud-diagnose/diagnose/alarm/info`（告警确认/清除）
- `cloud-diagnose/andiagnosisresultdetail/info`（list）
- `cloud-diagnose/andiagnosisresult/info`（textarea）
- `cloud-diagnose/andiagnosisresult/list`（his）

## preProcessingManagementUrl

预处理任务管理接口（environment.json：`preProcessingManagementUrl.direct`）。使用文件：src/pages/falutRules-management/api.js

- `scripts/uploadScript`（uploadScripts，POST）
- `vendors`（getVendors，GET）
- `professionTypes`（getProfessionTypes，GET）
- `deviceTypes`（getDeviceTypes，GET）
- `scripts`（getScripts，GET）
- `scripts/{fileName}`（getScriptsDesc，GET，动态拼接）
- `hosts`（getHosts，GET）
- `tasks`（add，POST；getList，GET）
- `tasks/{task_id}`（edit，PUT；del，DELETE）
- `tasks/download`（downLoad，GET，blob）

## experiencesUrl

sqlm 接口（environment.json：`experiencesUrl.direct`）。使用文件：src/common/services/dataService.js、src/pages/emergency/common/export.js

- `apply/executeIdList`（dataService，sqlServices multiplePropKey）
- `apply/execute`（dataService，sqlServices singlePropKey）
- `apply/statement_export/{regionName}`（emergency exportDetailServer，POST，报表导出）

## viewItemUrl

告警右键视图服务地址（environment.json：`viewItemUrl.direct`）。使用文件：src/components/alarm-window-view/alarm-detail-container/index.jsx

- `flow/alarm-detail`（getAlarmDetail，POST）

## monitorSetUrl

告警设置接口地址（environment.json：`monitorSetUrl.direct`）。使用文件：src/components/alarm-window-view/alarm-detail-container/alarm-detail/index.jsx

- `v1/alarm/columns`（getColumnsDict，GET）

## logOperUrl

日志记录（environment.json：`logOperUrl.direct`）。使用文件：src/common/api/service/loggerApi.js

- `bss/api/logs/operation`（logsOperation，POST；handleOperationLog 为其包装）

## 备注

- `environment.json` 中还有未走 baseUrlType 的配置项（如 `iceUrl`、`filterUrl`、`viewItemExportUrl`、`alarmSoundUrl`），由其他机制直接读取，不在本表范围。
- 各文件中的 `DEFAULT_BASE_URL` 常量取值：broadbandService=`broadbandUrl`，topoService / situationService=`situationUrl`，falutRules-management/api.js=`preProcessingManagementUrl`。
- 相关文档：./overview.md、./url-composition.md
