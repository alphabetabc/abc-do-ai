# vision.md

## 定位

广东应急保障大屏。基于 Next.js 的大屏可视化工程，一屏统览应急态势：GIS 态势感知、应急资源调度、网络受损情况。服务省市两级应急处置决策。

## 北极星

任何一次改动都应让值守与指挥人员更快回答三类问题：现在哪里出事、手上有什么资源可调、网络恢复到什么程度。与这三问无关的能力不进主屏。

## 禁止清单

- 禁用 npm / yarn，统一 pnpm。
- 不绕过 packages/eslint/flat.mjs 的统一 ESLint 规则另起配置。
- 不复刻 apps/main/app/components/ui/emap-gis 已有的地图能力（WFS 图层、动画点、弹窗等），新 GIS 需求优先扩展该组件。
- 不把密钥、环境配置硬编码进源码；运行时配置走 apps/main/public/config/。
- 不改动 public/static/EMap 运行时文件。

## 假设

- 设计稿固定 5760×1080（左 1148 + 中 3072 + 右 1440），等比缩放适配。
- EMap v2 为地图底座，WFS/WMS 为图层数据来源。
- 后端接口以 packages/docs-api-backend、packages/docs-custom-view 文档为权威契约。
