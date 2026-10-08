# 003-wireless-quality · 网络质量-left（data-model）

> 接口源码：`web/services/info-management-bureau/game-match/section-left.ts`。

| 接口 | viewItemId | 内容 |
| --- | --- | --- |
| `getLeftWirelessQualityRRCApi` | `wireless-quality-rrc` | RRC 连接数 |
| `getLeftWirelessQualityOnlineUserApi` | `wireless-quality-online-user` | 在线用户数 |

两者返回结构一致：

```ts
{ dataTime: string[], maxValue: number[], averageValue: number[] }
```
