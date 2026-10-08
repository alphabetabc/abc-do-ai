# 003-bottom-indicators · bottom-指标（data-model）

> 接口源码：`web/services/info-management-bureau/home/`。

## getHomeBottomIndicatorsApi

- viewItemId `competition-homepage-resources`
- 模板来自环境配置 `homeConfig.open-close-ceremonies-view-competition-homepage-resources`（缺省：保障卫星车/通信车/发电车/人员 4 项），返回：

```ts
{ name, value, unit, iconPath } // iconPath = IMAGE_PATH/info-management-bureau/<icon>
```
