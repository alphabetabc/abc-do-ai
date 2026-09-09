# frontend-ui · 大屏 UI 组件设计规格（逆向重建级）

本目录是 `web/components/ui/rc-echarts/` 三个图表组件的**设计规格文档**，采用逆向蒸馏：目标是即使源码丢失，AI 仅凭本文档也能重建出**行为一致**的实现（数据流、算法、默认常量完整可推导；代码写法允许不同）。

## 重建能力边界（已验证）

2026-09-09 已做一轮"模拟重建"验证（文档 vs 源码逐项比对），结论：

- **在"echarts / echarts-gl 为可信黑盒（沿用同版本）"的前提下，本文档足以完整重建三个组件**：组件 props 契约、数据装配算法、渲染算法（renderItem / 参数方程）、全部默认样式常量、懒加载与记忆化行为均已规格化。
- 唯一未逆向的层是 `ReactECharts` 本地 minified bundle 的内部实现（见 `rc-shared/overview.md` §2.2），重建时按 `@fedx-vis/react-echarts` 官方行为对齐即可。
- 若更换 echarts / echarts-gl 大版本，`api.barLayout` 返回结构、surface 渲染精度等存在版本敏感性，文档不提供跨版本保证，需实测验证。

## 文档结构

```
rc-bar3d-line/          伪 3D 柱 + 折线 + 标记线混合图
├── overview.md         是什么 / 怎么用 / 原理概览 / 陷阱
├── data-flow.md        createSeries 数据装配算法（逐行等价伪代码）
├── cube-render-spec.md 伪 3D 立方体 renderItem 绘制规格（含全部默认色值与坐标公式）
└── style-defaults.md   组件层 props→option 映射与默认样式常量

rc-gauge/               180° 半环仪表盘
├── overview.md
└── option-spec.md      双层 gauge series 完整 option 规格

rc-pie-3d/              echarts-gl 立体饼图
├── overview.md
└── parametric-spec.md  surface 参数方程与 option 完整规格

rc-shared/              共享基础设施
└── overview.md         ReactIntersectionObserver 规格与共同依赖
```

## 阅读路径（重建时）

1. 先读目标组件 `overview.md` 建立整体认知；
2. 再读各 spec 文档，按规格直接实现；
3. 共享设施（ReactIntersectionObserver / ReactECharts / useMemorizedObject）见 `rc-shared/overview.md`。

## 维护约定

- 文档中所有常量（色值、尺寸、步长、默认参数）均**逆向自源码原文**，修改源码时须同步更新对应 spec；
- spec 中的伪代码块标注"逐行等价"的，重建时不得改变语义（尤其是遍历顺序、merge 深度、覆盖先后）；
- 源码中被禁用/注释的功能（pie-3d 的选中位移与 hover 放大、markerLine 多行覆盖等）已在文档中如实标注为"死代码/已知行为"，重建时可选择保留或删除，但须在文档中记录决策。
