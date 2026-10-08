# 005-chbn-business · chbn业务（data-model）

> 接口源码：`web/services/info-management-bureau/home/section-left.ts`，均 viewPageId `open-close-ceremonies-view`，模板可由 `homeConfig.*` 环境配置覆盖。

| 接口 | viewItemId | 返回结构 |
| --- | --- | --- |
| `getPersonalBusinessApi` | `chbn-business-personal` | `{ top: {label,unit,value}, parts: [{type,label,unit,value,color}] }`（总用户数 + 5G/4G/物联网/其他） |
| `getFamilyBusinessApi` | `chbn-business-home` | `[{type,label,unit,value,color,labelSpiltNumber?}]`（家宽/IPTV/爱家TV/固话） |
| `getGEBusinessTop4Api` | `chbn-business-government` | 同上结构（专线客户/5G专网卡/物联网客户/车联网发卡量） |
| `getNewBusinessTop5Api` | `chbn-business-emerging` | Top5 列表 |

## 遗留接口（无组件引用）

`getLeftCloudNetworkApi` / `getLeftGamePrivateNetworkApi` / `getLeftPublicNetworkStationApi` 对应模块目录（cloud-video / game-private-network / public-network）当前无引用，属遗留代码。
