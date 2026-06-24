# 设计原则与跨子模块工作流

> **所属技能**：`noc-shaanxi-management-overview-first`
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/principles.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.0     |
| 最后更新 | 2026-06-24 |

本文档收录本技能涉及的**设计原则、跨子模块扩展工作流、已知差异与注意事项**。SKILL.md 仅作索引入口，详细规则请查阅本文档。

---

## 一、设计原则

### 1. 配置驱动（Configuration-Driven）

- 政府企业业务模块以 `presets.ts` 为**单一入口**。
- 其他子模块在新增/扩展时，沿用此模式：把可参数化的能力下沉到配置中心，避免在组件中硬编码。

### 2. 职责分离（Separation of Concerns）

- 每个 `tab-content-*` 是**自包含**的页面单元。
- 跨 tab 通信走 `center/index.tsx` 的状态提升，不要在子组件内相互 import。

### 3. 样式隔离（Style Isolation）

- 每个子模块自带 `index.less`，避免全局污染。
- 公共变量放 `index.less` 顶层，子模块按需 import。

### 4. 数字人交互统一（Unified MetaHuman Interaction）

- 所有数字人指令集中在 `metaHumanPresets.ts`，按业务模块分组。
- 子模块通过 `useMetaHumanEffect` 注册响应，不在子组件内独立写死。

### 5. 文档即代码（Docs as Code）

- 本技能目录与源码同仓：`web/pages/management-overview-first/` 的任何改动都应同步更新对应子组件文档。
- 详见 `how-to-extend.md`。

---

## 二、跨子模块扩展工作流

```
需求分析
    ↓
判断：是否跨子模块？
    ├── 否 → 直接查阅对应子组件文档（SKILL.md 子组件文档索引）
    └── 是 → 调用本技能（noc-shaanxi-management-overview-first）
            ↓
        列出涉及的子模块，逐一进入
            ↓
        公共装配 / 数字人联动 / 全屏样式 → 在本技能层级处理
            ↓
        子模块内部细节 → 查阅对应子组件文档
            ↓
        联调（render.tsx / 区域切换）
```

---

## 三、核心职责速查

| 职责       | 说明                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| 屏幕装配   | `render.tsx` 把 `page-title` / `zone-select` / `center` / 三大业务模块组装成完整屏 |
| 区域切换   | `zone-select` 改变 `currentZone`，通过 `screen.ts` 决定中心点 / 缩放级别           |
| 中心区调度 | `modules/center/index.tsx` 通过 `tab-button` 切换 `tab-content-1/2/3`              |
| 数字人联动 | `metaHumanPresets.ts` 提供语音→模块动作映射；`meta-human-helper-zone` 提供视觉辅助 |
| 数据接入   | 三大业务模块（家庭 / 个人 / 政企）各自负责本业务的指标、布局与详情                 |

---

## 四、已知差异 / 注意事项

| 项                                                        | 说明                                                                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 政府企业业务有旧版 `overview/` 与新版 `overview-v2/`      | 当前仅使用 `overview-v2/`，`overview/` 已废弃，详见 `modules/government-enterprise-business/`               |
| `tab-content-3/components/echarts-fly-line/index-bak.tsx` | 备份文件，请优先修改 `index.tsx`                                                                           |
| `metaHumanPresets.ts` 体积较大                            | 按业务模块分组，新增模块时在对应分组下扩展，避免一次塞进根级                                                |
| 数字人激活时部分模块暂停自动旋转                          | 详见 `modules/government-enterprise-business/overview-v2-documentation.md` 中的「数字人模式」说明          |
| 高分屏 / Retina 适配                                       | `StreamerPath` 等 Canvas 组件未做 DPR 缩放，详见 `@noc-shaanxi-ui-streamer-path` 的 `core-implementation.md` |

---

## 五、版本演进说明

| 版本  | 关键变更                                                                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| v1.0  | 初始版本：抽出设计原则、跨子模块工作流、已知差异等内容，从 SKILL.md 拆出为独立文档，SKILL.md 转为纯索引                  |

---

## 六、相关引用

引用其他技能时使用 skill id 形式（不带文件路径），便于技能迁移和重构：

- `@noc-shaanxi-management-overview-first`（本文档所属）
- `@noc-shaanxi-ui-streamer-path`（流光路径组件技能，本屏多处使用）

具体子组件文档路径在 SKILL.md 的「子组件文档索引」表格中维护。