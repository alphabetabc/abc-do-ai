# 006-line-quality · 网络质量（data-model）

> 接口源码：`web/services/info-management-bureau/open-and-close/`（section-left / section-right）。

- viewItemId `ceremonies-line-quality-up` 等（上/下行流量，`_<area>` fallback）：

```ts
{ dataTime: string[], maxValue: flowRate[], averageValue: flowValue[] }
```
