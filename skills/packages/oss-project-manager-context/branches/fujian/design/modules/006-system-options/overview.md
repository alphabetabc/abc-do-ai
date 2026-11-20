# 006-system-options

> fujian 状态：与 develop 一致（2026-11-20 diff 验证），下述内容可直接使用。

系统配置管理页。src/pages/system-options。

## 功能

- 左侧 Menu 按配置表切换，右侧 VirtualTable 展示 + 增删改（edit/ 子表单、Modal.confirm 删除确认）。
- 当前两张配置表（systemOptions.js 中 SystemOptions.data）：
  - project-type 工程类型：typeCode/typeName/typeNameEn/commonFlag 公私有/valid 生效/comments；接口 InsertProjectTypeObj、UpdateProjectTypeModuleObj、selectProjectTypeModuleByCount + ByPage、DeleteProjectTypeModule。
  - project-status 工程状态：切到该表时额外经 api.getEnum({}, 'project-status') 拉取枚举（过滤 commonFlag===1）供下拉与展示。
- 每张表动态追加操作列（getOptionCol）。

## 结构

```text
index.jsx          主容器（类组件，无路由状态）
systemOptions.js   配置表元数据（tableId/label/url/rowKey/columns）+ api（走 @Common/services/dataService）
edit/index.jsx     新增/编辑表单
```

## 维护要点

- 新增配置表只需在 SystemOptions.data 追加一项（columns + url + rowKey），主容器自动适配；project-status 的枚举加载是特例分支。
- 公共 dataService 在 src/common/services/dataService，接口走通用 CRUD url 约定。

## 六要素补齐（2026-11-19 真源核查）

- **路由与入口**：/system-options（src/routes/index.js）。
- **组件树**：src/pages/system-options → index.jsx（外壳）+ systemOptions.js（两块配置表逻辑）。
- **状态管理**：无全局状态，组件内 state。
- **接口清单**：不走 request，直接经 dataService sqlm：InsertProjectTypeObj、UpdateProjectTypeModuleObj、DeleteProjectTypeModule、selectProjectTypeModuleByCount/ByPage、selectArProStatusByCount/ByPage、SelectArProStatusObj、Insert/Update/DeleteArProStatusObj（sqlId 定义在 src/common/services/configs.js）。
- **可复用点**：VirtualTable 分页 CRUD 配置表整页可作模板复制。
- **已知坑**：sqlId 命名大小写不一（Insert/select/Delete 混用）；工程状态/类型字典真源在此维护，前端代码无硬编码。
