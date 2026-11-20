# enum-and-dictionary.md · 枚举 / 字典 / 常量清单

> 真源：取值逐条对照源码核对（2026-11-19）。本域为 develop-fujian；枚举框架文件 src/common/enum 与 develop 一致（2026-11-20 diff 验证），业务内嵌枚举涉 new-project/quick-project 变更文件时须现场核对。

## 枚举框架（src/common/enum/enums.js）

`EnumItemClass` / `EnumClass`：oss 风格枚举基类（id/value 归一、name 函数懒缓存）。`src/common/enum/index.js` 用 `Enums.rebuild` 把 `common.js` + `filter.js` 合并导出为 `enumsContainer`。**注意：`operatorEnum.js` 未被 index.js 引入，属独立导出文件。**

## common.js（src/common/enum/common.js）

| 名称 | 取值（id/key/name） |
| --- | --- |
| enableStatus | 0/disable/停用（i18n），1/enable/启用（i18n） |
| logicRelation | 0/AND/且，1/OR/或 |
| operatorMapNumber | 0/GT/大于，1/GTEQ/大于等于，2/LT/小于，3/LTEQ/小于等于，4/EQ/等于，5/NOTEQ/不等于，6/BETWEEN/介于 |
| operatorMapBoolean | 0/YES/是，1/NOT/不是 |
| operatorMapText | 0/INCLUDE/包含，1/EXCLUDE/不包含 |
| operatorMapTime | 1/RANGE/固定时段 |

## filter.js（src/common/enum/filter.js，经 index.js 导出）

| 名称 | 取值 |
| --- | --- |
| numberOperator | lteq/小于等于，gteq/大于等于，eq/等于，between/区间 |
| windowTypeList | '0'/sys/当班窗口，'1'/custom/自定义窗口 |
| windowAttrBute | '0'/false/不共享，'1'/true/共享 |
| windowIfUse | '0'/false/不启用，'1'/true/启用 |

## operatorEnum.js（src/common/enum/operatorEnum.js，独立）

| 名称 | 取值（value/key） |
| --- | --- |
| text | 包含/like（有 default），不包含/notLike，等于/eq（default），不等于/ne |
| date / dateTime / time / number / money | 等于/eq（default），不等于/ne，大于/gt，大于等于/ge，小于/lt，小于等于/le |
| dateRange / dateTimeRange | 等于/between（default） |
| enumeration | 等于/in（default），不等于/notIn |
| cascader | 等于/eq（default） |

## 常量（src/common/constants.js）

由 process.env 派生：`BASE_NAME = '/' + REACT_APP_KEY`；`MICRO_APP_URL`（微前端内取 `getMicroUrl(window)`，生产再加 BASE_NAME）；`STATIC_PATH/IMAGE_PATH/LOCALES_PATH/MOCK_DATA_PATH`（MICRO_APP_URL 下的 static 子路径）；`IMP_ALARM_REPORT`；`CONFIG_HOST`（REACT_APP_CONFIG_HOST）、`CONFIG_LOCAL`（REACT_APP_CONFIG_LOCAL）。

## dbNames（src/common/services/constants.js）

`NMOSDB: 'nmosdb'`，`NRMDB: 'nrmdb'`（sqlm 通道 dataSourceName 取值）。

## 页面级字典（源码确认）

- 工程状态三态：surplusTime 0=未执行 / 1=正在执行 / 2=已执行（home-page，见 modules/001）；home-executing 固定查询 `executeStatus: '正在执行'`。
- 工程状态/工程类型配置表：**不在前端硬编码**，存库经 system-options 维护（sqlId selectArProStatusByPage 等）与 `api.getEnum({}, 'project-status')` 拉取（过滤 commonFlag===1）。
- i18n 语言枚举：SUPPORT_LOCALES = en-US/English、zh-CN/中文，默认 zh-CN（src/components/locale-provider/index.js）。
- 时间段常量：interval.second/minute/hour（src/common/timer/index.js）。
- 干扰预约工程类型 id=30；链路开关 dateLk 来自版本常量 type=23 的 isShow（见 modules/001、003）。

## 未验证项

- 页面内散落的局部 statusMap/options 数组未逐一穷举（如各专题表单下拉），需要时按 Grep `options` 在对应页面目录核查。
- 后端枚举真源在 sql/ mapper 与 environment.json 配置，前端仅消费。
