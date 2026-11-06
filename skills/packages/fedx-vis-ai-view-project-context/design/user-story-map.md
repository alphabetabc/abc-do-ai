# user-story-map.md

## 角色

- 物料作者：解析外部业务项目源码、产出并维护物料模块的人
- 物料消费者：检索、预览并复用物料组件的人

## 主旅程

### 物料作者

1. 选定外部项目中的目标组件，通读源码与用法
2. 按模板（`docs/materials/_templates/`）产出 spec.md / data-model.md
3. 提炼可运行源码到 `code/`，编写带 mock 数据的 `examples/*.tsx`
4. 填写 `manifest.json`（name / description / tags），模块自动进入站点索引

### 物料消费者

1. 在检索索引页按名称 / 标签查找模块
2. 进入模块详情页，阅读 spec 与 data-model
3. 预览 examples 的实际渲染效果
4. 复制 `code/` 源码到自己的项目接入使用
