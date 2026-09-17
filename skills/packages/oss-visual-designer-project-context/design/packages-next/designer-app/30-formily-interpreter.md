# formily 自建解释器 · 替代 fedx-report 角色 B/C

> 状态：**设计底稿，Phase 2 立项前需用户 review**。
> 事实来源：[src能力差距矩阵.md](skills/oss-visual-designer-project-context/design/packages-next/src能力差距矩阵.md) B41-B44（配置面板）、C26/C27'（交互动作 schema）、A15（/schema-designer）、D9（widget 数量口径）。
> 2026-09-17 用户定调：**版本孤岛架构**（见 §7）——formily 表单能力独立成 pkg、自带锁定版本 React/antd，不进主应用依赖树。

---

## 1. fedx-report 三角色与退场策略

| 角色 | 用法 | 证据 | 退场策略 |
| --- | --- | --- | --- |
| A. resolve 注入给远程物料 | [remote-component.config.js](src/remote-component.config.js) | 老物料 bundle 内 `require('fedx-report')` | **短期必须保留**，长期随老物料退役（Phase 4） |
| B. 配置面板表单引擎 | FedxReportRenderer + onFormInputChange + FormCollapse（[FedxReport.tsx](src/formily/FedxReport.tsx)） | ✅ 本文档替代：SchemaInterpreter 对齐其 props 契约 |
| C. 设计时 API | createResource / createBehavior / createFieldSchema / ISchema | formily/widgets 下 40+ 文件的 schemaDesignerConfig | ✅ 本文档替代：shim 对齐签名，widget 代码几乎不动 |

「放弃 fedx-report」= 先 B 后 C、A 最后退的三步走。

## 2. SchemaInterpreter（角色 B 替代）

props 契约对齐 FedxReportRenderer：

| prop | 说明 |
| --- | --- |
| schema | formily schema |
| customComponentMaps | 自定义组件注入 |
| initialValues / values | 表单值 |
| effects | 副作用（对齐 onFormInputChange / FormCollapse 行为） |

实现：formily 原生 `createSchemaField` + effects 封装。B 角色只需渲染 schema + 注入组件 + 回调 values，原生能力可覆盖。

长尾风险（风险 #4）：FedxReportRenderer 特殊行为覆盖不全 → 逐 case 补齐 + 分批验证兜底。

## 3. 设计时三件套 shim（角色 C 替代）

- `createResource` / `createBehavior` / `createFieldSchema` 重新实现为纯工厂函数，签名与 fedx-report 一致。
- 40+ widget 的 `schemaDesignerConfig` 引用点几乎不动，仅替换 import 来源。
- ISchema 类型 shim。

## 4. Widget 迁移（40+，分批）

数量口径：r1-3 实测 `src/formily/widgets` 40+ 个（矩阵 D9，能力域总览文档「30+」口径作废，排期按 40+）。

分批策略（量大但机械，按依赖与复杂度分层）：

| 批次 | 内容 | 判据 |
| --- | --- | --- |
| 第 1 批 | 基础输入类（无复杂联动） | SchemaInterpreter 冒烟通过 |
| 第 2 批 | 联动 / effects 类（事件、数据源选择器） | effects 契约对齐 |
| 第 3 批 | 复合 widget：define-interaction-action（C26/C27'）、数据源配置、DPU 编辑器联动（B05） | 与 MaterialCompatHost factory 注入联调 |
| 第 4 批 | 长尾（schemaDemo 之外的存量 widget 全量） | 配置面板全量回归 |

每个 widget 验证项：渲染 / 值回填 / onFormInputChange 回调 / effects。

## 5. 配置面板装配（Phase 2 × Phase 3 交界）

- 配置面板 UI 壳（B40-B44：分区 tab、组件配置 / 数据配置 / 交互配置）属 Phase 3 UI，但内部表单域属 Phase 2。
- layout-block 专属配置面板 schema（C22/C23）随第 3 批迁移。
- `/schema-designer` 独立工具（A15，fedx-report 深度绑定）：**已拍板（Q8，2026-09-17）放弃，不迁移**，配置 schema 改由本解释器生态承接。

## 6. 验收判据（Phase 2）

1. 配置面板用 SchemaInterpreter 渲染，fedx-report 不再出现在 designer-app 自身依赖（resolve map 中角色 A 条目保留）。
2. 40+ widget 全部分批验证通过。
3. 一块存量大屏的配置数据在新面板可正常加载、编辑、保存（ConfigFormatter 兼容，协议 P7）。

---

## 7. 版本孤岛架构（用户定调，2026-09-17）

### 7.1 设计动机

formily 生态（formily-core/react/antd 三件套）对 React 与 antd 版本**刚性耦合**：

- formily 2.x 适配层锁 antd 4.x API 面；antd 5 的 CSS-in-JS 与 API 变更会打断它；
- src 应用至今用 legacy `ReactDOM.render` 挂载，部分即 formily 时代历史包袱；
- formily 触达面大（属性面板 + 40+ widget + fedx-report B/C 角色），留在主依赖树里会让**主应用每次 React/antd 升级都被 formily 拖住**。

**策略**：与 MaterialCompatHost 对老物料同族——**不改造存量，而是隔离存量**。formily 表单能力独立成 pkg（版本孤岛），内部 React/antd 版本随 formily 锁定且不再升级；主应用（designer-next + 壳层）升级路径彻底解耦。孤岛与 MaterialCompatHost 是并列的两个隔离单元，互不拖累。

### 7.2 形态约定

- 单独一个 pkg（命名暂定 `formily-island`，立项时定）；
- 内部自带锁定版本的 react / react-dom / antd / formily 三件套，**不与外部共享任何运行时依赖**；
- 对外暴露**纯函数挂载 API**（非 React 组件），壳层只提供 DOM 宿主：

```ts
// 孤岛内部
export function createPropertyPanel(rootDom, propertyPanelConfig) {
    const root = cache.get(rootDom) ?? ReactDOM.createRoot(rootDom);
    cache.set(rootDom, root);
    root.render(<PropertyPanel {...propertyPanelConfig} />);
}

// 壳层（外部）——只当 DOM 宿主，不 import 孤岛内部组件
export const PropertyPanelHost = () => {
    useEffect(() => {
        createPropertyPanel(rootDom, propertyPanelConfig);
    }, [rootDom, propertyPanelConfig]);
    return <div ref={propertyListRef} />;
};
```

（示意代码，接口细节见 7.4 待讨论议题）

### 7.3 跨边界硬约束

双 React 实例并存，跨孤岛边界**只能传可序列化数据 + 普通函数回调，禁止传 React 元素 / 组件 / context**。TS 类型通过 pkg **只导出类型、不导出运行时**的方式共享。

### 7.4 待讨论议题（Phase 2 立项前定稿）

| # | 议题 | 选项与倾向 |
| --- | --- | --- |
| a | 通信协议：面板值变更如何回传壳层 | CustomEvent on rootDom / 回调注册 API（`createPropertyPanel(dom, cfg, { onChange })`，普通函数不跨 React 树，可行） |
| b | 生命周期 API：配置更新与销毁 | 拆分 `createPropertyPanel` / `updatePropertyPanel(cfg)` / `destroyPropertyPanel(dom)`（cache 只 set 不清会泄漏 root）；避免 config 引用变化触发全量重 render |
| c | CSS 隔离：孤岛 antd 样式 vs 壳层样式 | 类名前缀 / Shadow DOM（popover 等浮层事件有坑，需验证） |
| d | widget 供给：40+ 自定义 widget 归属 | 内部打包（彻底隔离、包体大）vs 注册表模式 `registerWidget(name, comp)`（组件须在孤岛 React 内创建） |

### 7.5 收益联动

- `schemaDesignerConfig`（矩阵 B50）等 formily 耦合配置可整体封进孤岛内部，壳层零感知；
- 孤岛最终随存量 schema 生态退役（同 Phase 4 老物料退役节奏），退役 = 整包移除，无残骸。

### 7.6 验证前置

冻结接口前先做 **10 行级 PoC**：双 React 实例共存下的事件回调 / 样式隔离表现，验证议题 a、c 的可行性后再定稿 API。
