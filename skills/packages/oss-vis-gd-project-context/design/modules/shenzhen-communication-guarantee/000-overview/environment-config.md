# 007 · 环境配置清单（shenzhen-communication-guarantee）

> 范围：`web/services/shenzhen-communication-guarantee/` 与 `web/pages/shenzhen-communication-guarantee/` 下所有环境配置读取（`getEnvironment` / `useEnvironment`）。
> 目的：集中登记 key、默认值结构、作用，便于排查「图表指标项来自哪里 / 为什么默认展示模板」的问题。

## 1. 机制说明

- 读取入口有两个，读的都是同一份 env 节点：
    - `web/common/environment.ts` 的 `getEnvironment(keyPath)`：直接从全局对象取值（service 层用）
    - `web/hooks/useEnvironment.ts` 的 `useEnvironment(keyPath)`：从 InitContext 取 env 后按 keyPath 取值（组件层用）
- 写入入口：应用初始化时 `web/components/initializer/index.tsx` 调用 `initEnv(result.env)`，把服务端/启动配置注入全局对象。
- 使用模式（本模块统一约定）：

```ts
const { viewPageArgs, viewItemDataTemplate = [/* 前端默认模板 */] } =
    getEnvironment('shenzhen-communication-guarantee.<scene>Config.<key>') ?? {};
```

- `viewPageArgs`：透传给 `getViewItemDataApi` 的视图页参数。
- `viewItemDataTemplate`：前端兜底模板。环境配置未下发 / 接口报错或返回空时，直接渲染该模板（value 为默认值）；接口正常时按 `type` 匹配行、按 `valueField` / `labelField` / `unitField` 回填。
- `?? {}` 兜底：环境配置不存在时不报错，全部走默认值。

## 2. 配置清单

共 9 个 key（11 处调用，`viewManager.enableViewAnimation` 被 Panel / NoStylePanel 两处消费）。key 前缀 `shenzhen-communication-guarantee.`，二级节点三个：`homeConfig.`（首屏）7 处（5 处接口模板 + 1 处轮巡间隔 + 1 处组件层兜底行）、`areaConfig.`（区域屏）2 处（1 处接口模板 + 1 处轮巡间隔）、`viewManager.`（视图动效开关）1 处。

> 下述 JSON 即环境配置的真实结构（`getEnvironment('shenzhen-communication-guarantee')` 取到的节点），各 key 内以 `// 注释` 标注消费位置（file + function）。配置下发侧可按此结构覆盖；未下发的 key 走源码内默认模板。

```jsonc
{
    "shenzhen-communication-guarantee": {
        "viewManager": {
            // web/pages/shenzhen-communication-guarantee/sub-pages/components/container/panel.tsx · Panel（L32）与 NoStylePanel（L80）两处消费，读取方式为 useEnvironment
            // 面板入场动效开关：true 时面板按 animateCss（fadeInLeft/fadeInRight 等）播放动画；false / 未配置时禁用动画
            "enableViewAnimation": true,
        },
        "homeConfig": {
            // web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/area-carousel/index.tsx · Component
            // 首屏区域轮巡间隔（秒），取值直接作为 interval，非模板结构（2026-10-14 由分钟改为秒）
            "areaCarousel": {
                "interval": 60,
            },
            // web/services/shenzhen-communication-guarantee/home/center.ts · getEmergencyResourceApi
            // viewItemId: competition-homepage-resources
            "shenzhen-communication-guarantee-view-competition-homepage-resources": {
                "viewPageArgs": {},
                "viewItemDataTemplate": [
                    {
                        "type": "3",
                        "name": "保障卫星车",
                        "unit": "个",
                        "icon": "icon-保障卫星车.svg",
                        "nameField": "typeName",
                        "valueField": "num",
                        "value": 0,
                    },
                    {
                        "type": "1",
                        "name": "保障通信车",
                        "unit": "个",
                        "icon": "icon-保障通信车.svg",
                        "nameField": "typeName",
                        "valueField": "num",
                        "value": 0,
                    },
                    {
                        "type": "4",
                        "name": "保障发电车",
                        "unit": "个",
                        "icon": "icon-保障发电车.svg",
                        "nameField": "typeName",
                        "valueField": "num",
                        "value": 0,
                    },
                    {
                        "type": "2",
                        "name": "保障人员",
                        "unit": "个",
                        "icon": "icon-保障人员.svg",
                        "nameField": "typeName",
                        "valueField": "num",
                        "value": 0,
                    },
                ],
            },
            // web/services/shenzhen-communication-guarantee/home/section-left.ts · getPersonalBusinessApi
            // viewItemId: chbn-business-personal
            "shenzhen-communication-guarantee-view-chbn-business-personal": {
                "viewPageArgs": {},
                "viewItemDataTemplate": {
                    "top": {
                        "type": "1",
                        "label": "总用户数",
                        "labelField": "typeName",
                        "unit": "万",
                        "unitField": "unit",
                        "valueField": "num",
                    },
                    "parts": [
                        {
                            "type": "2",
                            "label": "5G用户",
                            "labelField": "typeName",
                            "unit": "万",
                            "unitField": "unit",
                            "valueField": "num",
                            "color": "rgba(36, 207, 255, 1)",
                        },
                        {
                            "type": "3",
                            "label": "4G用户",
                            "labelField": "typeName",
                            "unit": "万",
                            "unitField": "unit",
                            "valueField": "num",
                            "color": "rgba(247, 209, 102, 1)",
                        },
                        {
                            "type": "4",
                            "label": "物联网",
                            "labelField": "typeName",
                            "unit": "万",
                            "unitField": "unit",
                            "valueField": "num",
                            "color": "rgba(7, 247, 142, 1)",
                        },
                        {
                            "type": "5",
                            "label": "2G用户数",
                            "labelField": "typeName",
                            "unit": "万",
                            "unitField": "unit",
                            "valueField": "num",
                            "color": "rgba(226, 226, 226, 1)",
                        },
                    ],
                },
            },
            // web/services/shenzhen-communication-guarantee/home/section-left.ts · getHomeBusinessApi
            // viewItemId: chbn-business-home（家庭业务：宽带 / IPTV / 爱家TV / 固话等，部分项含 labelSpiltNumber 换行）
            "shenzhen-communication-guarantee-view-chbn-business-home": {
                "viewPageArgs": {},
                "viewItemDataTemplate": [
                    {
                        "type": "1",
                        "label": "家宽用户数",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(226, 226, 226, 1)",
                        "labelSpiltNumber": 2,
                    },
                    {
                        "type": "2",
                        "label": "IPTV",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(36, 207, 255, 1)",
                    },
                    {
                        "type": "3",
                        "label": "爱家TV",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(247, 209, 102, 1)",
                    },
                    {
                        "type": "4",
                        "label": "固话",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(7, 247, 142, 1)",
                    },
                ],
            },
            // web/services/shenzhen-communication-guarantee/home/section-left.ts · getGovernmentBusinessApi
            // viewItemId: chbn-business-government（政企业务项，含 labelSpiltNumber 换行配置）
            "shenzhen-communication-guarantee-view-chbn-business-government": {
                "viewPageArgs": {},
                "viewItemDataTemplate": [
                    {
                        "type": "1",
                        "label": "专线客户数",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(226, 226, 226, 1)",
                        "labelSpiltNumber": 2,
                    },
                    {
                        "type": "2",
                        "label": "5G专网专网卡数",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(36, 207, 255, 1)",
                        "labelSpiltNumber": 4,
                    },
                    {
                        "type": "3",
                        "label": "物联网客户数",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(247, 209, 102, 1)",
                        "labelSpiltNumber": 3,
                    },
                    {
                        "type": "4",
                        "label": "车联网发卡量",
                        "labelField": "typeName",
                        "unit": "",
                        "unitField": "unit",
                        "valueField": "num",
                        "color": "rgba(7, 247, 142, 1)",
                        "labelSpiltNumber": 3,
                    },
                ],
            },
            // web/services/shenzhen-communication-guarantee/home/section-right.ts · getKeyGuaranteeAreaBusinessApi
            // viewItemId: key-guarantee-area-business（重保区域业务分组，children 为 { label, valueField: num/retireNum }）
            "shenzhen-communication-guarantee-view-key-guarantee-area-business": {
                "viewPageArgs": {},
                "viewItemDataTemplate": [
                    {
                        "key": "2g",
                        "group": "2g",
                        "children": [
                            {
                                "title": "2G基站",
                                "children": [
                                    { "label": "基站数", "valueField": "num" },
                                    { "label": "退服数", "valueField": "retireNum" },
                                ],
                            },
                            {
                                "title": "2G小区",
                                "children": [
                                    { "label": "总数", "valueField": "num" },
                                    { "label": "退服数", "valueField": "retireNum" },
                                ],
                            },
                        ],
                    },
                    {
                        "key": "4g",
                        "group": "4g",
                        "children": [
                            {
                                "title": "4G基站",
                                "children": [
                                    { "label": "基站数", "valueField": "num" },
                                    { "label": "退服数", "valueField": "retireNum" },
                                ],
                            },
                            {
                                "title": "4G小区",
                                "children": [
                                    { "label": "总数", "valueField": "num" },
                                    { "label": "退服数", "valueField": "retireNum" },
                                ],
                            },
                        ],
                    },
                    {
                        "key": "5g",
                        "group": "5g",
                        "children": [
                            {
                                "title": "5G基站",
                                "children": [
                                    { "label": "基站数", "valueField": "num" },
                                    { "label": "退服数", "valueField": "retireNum" },
                                ],
                            },
                            {
                                "title": "5G小区",
                                "children": [
                                    { "label": "总数", "valueField": "num" },
                                    { "label": "退服数", "valueField": "retireNum" },
                                ],
                            },
                        ],
                    },
                    {
                        "key": "通感站",
                        "title": "通感站",
                        "children": [
                            { "label": "基站数", "valueField": "num" },
                            { "label": "退服数", "valueField": "retireNum" },
                        ],
                    },
                    {
                        "key": "重保专线",
                        "title": "重保专线",
                        "children": [
                            { "label": "专线数", "valueField": "num" },
                            { "label": "中断数", "valueField": "retireNum" },
                        ],
                    },
                ],
            },
            // web/pages/shenzhen-communication-guarantee/sub-pages/home/modules/communication-service/RoamingTop5.tsx · RoamingTop5
            // viewItemId: intl-roam-top5；注意：此 key 不含 viewPageArgs，也未被 service 层（getIntlRoamTop5Api）消费
            // 仅作为组件层占位：初始化请求未返回（data 为 undefined）时渲染 defaultRows；接口正常返回（含空数组）即覆盖
            // defaultRows 结构与接口 rows 一致：countryName / userNbr / unit
            // titleUnit：标题后缀（含括号整体下发），默认（15min）；pollingInterval：轮询间隔（毫秒），默认 900000（15 分钟）
            "shenzhen-communication-guarantee-view-intl-roam-top5": {
                "titleUnit": "（15min）",
                "pollingInterval": 900000,
                "defaultRows": [
                    { "countryName": "中国香港", "userNbr": 148370, "unit": "个" },
                    { "countryName": "中国澳门", "userNbr": 9621, "unit": "个" },
                    { "countryName": "美国", "userNbr": 7905, "unit": "个" },
                    { "countryName": "日本", "userNbr": 3105, "unit": "个" },
                    { "countryName": "新加坡", "userNbr": 3054, "unit": "个" },
                ],
            },
        },
        "areaConfig": {
            // web/pages/shenzhen-communication-guarantee/sub-pages/area/modules/area-carousel/index.tsx · Component
            // 区域屏轮巡间隔（秒），与首屏 homeConfig.areaCarousel 互不影响（2026-10-14 由分钟改为秒）
            "areaCarousel": {
                "interval": 60,
            },
            // web/services/shenzhen-communication-guarantee/area/section-center.ts · getAreaPrepositionResourceApi
            // viewItemId: ceremonies-guarantee-resources
            // 注意：此 key 未取 viewPageArgs（接口参数 areaName 由函数入参直接传入）
            "shenzhen-area-view-area-preposition-resource": {
                "viewItemDataTemplate": [
                    {
                        "typeFieldValue": "1",
                        "stateFieldValue": "1",
                        "typeFieldLabel": "保障通信车",
                        "stateFieldLabel": "任务中",
                        "stateUnit": "个",
                    },
                    {
                        "typeFieldValue": "1",
                        "stateFieldValue": "0",
                        "typeFieldLabel": "保障通信车",
                        "stateFieldLabel": "总数",
                        "stateUnit": "个",
                    },
                    {
                        "typeFieldValue": "4",
                        "stateFieldValue": "1",
                        "typeFieldLabel": "保障发电车",
                        "stateFieldLabel": "任务中",
                        "stateUnit": "个",
                    },
                    {
                        "typeFieldValue": "4",
                        "stateFieldValue": "0",
                        "typeFieldLabel": "保障发电车",
                        "stateFieldLabel": "总数",
                        "stateUnit": "个",
                    },
                    {
                        "typeFieldValue": "2",
                        "stateFieldValue": "1",
                        "typeFieldLabel": "保障人员",
                        "stateFieldLabel": "任务中",
                        "stateUnit": "个",
                    },
                    {
                        "typeFieldValue": "2",
                        "stateFieldValue": "0",
                        "typeFieldLabel": "保障人员",
                        "stateFieldLabel": "总数",
                        "stateUnit": "个",
                    },
                ],
            },
        },
    },
}
```

> 说明：以上为源码内默认模板的完整结构（chbn-business-home / chbn-business-government 的具体 label 以源码为准，此处节选示例）；配置下发侧覆盖时结构与字段名必须一致。除 areaConfig、viewManager 与 intl-roam-top5（纯组件兜底）外，其余 5 处均把配置中的 `viewPageArgs` 透传给接口。

## 3. 维护注意

- 新增/修改视图指标项时，默认值改在源码默认模板里，生产覆盖值改在环境配置下发侧；两侧结构必须一致（字段名、type 编码）。
- key 命名规律：`shenzhen-communication-guarantee-view-<viewItemId>`（#1–#5），仅 #6 是 `shenzhen-area-view-<viewItemId>` 风格，新增配置时保持与所在屏（home/area）前缀一致。
- 接口均复用信管局视图页 `open-close-ceremonies-view`（2026-10-12 服务端确认），详见各文件内注释。

## 4. 数据相关图片（按区域名动态取图）

模块内有两处图片与接口数据联动：图片 URL 由数据中的区域 / 场馆名拼出，运维按名投放图片即可，前端不改代码。

- 路径出口：`share/presets.ts` 的 `staticAssets`（基于 `constants.IMAGE_PATH` = `<origin>/static/images`）

```jsonc
// staticAssets（share/presets.ts）
{
    "areaThumbnail": "static/images/shenzhen-communication-guarantee/area-thumb", // 区域缩略图
    "stadiumImage": "static/images/shenzhen-communication-guarantee/stadium-images", // 场馆背景大图
}
```

- `areaThumbnail`（区域缩略图）
    - 作用：首屏 / 区域轮巡的缩略图
    - 命名规则：`${区域名}.png`（数据中的 name）
    - 缺省图：`default-thumb.png`
    - 消费方：components/area-carousel（轮巡）
- `stadiumImage`（场馆背景大图）
    - 作用：区域屏场馆背景大图
    - 命名规则：`${场馆名}.png`（数据中的 stadiumName）
    - 缺省图：`default-stadium.png`
    - 消费方：sub-pages/area/index.tsx

> 目录下的图片由运维按数据返回的区域 / 场馆名投放（area-thumb 内有 readme.txt 说明）；加载失败时自动回退缺省图。新增区域只需投放图片，无需改代码。
