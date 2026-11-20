# 010-wireless-person-manager

> fujian 独有模块，develop 不存在。调研基线：2026-11-20（task-005，概要级）。

福建无线人员管理。src/pages/wireless-person-manager。

## fujian 代码风格样本

本模块是 fujian 新增代码（随 feature-228888 或更早合入），代表了本分支的新代码风格，**cutover-order 等新模块实施时的风格参照优先用本模块**（而非 new-project 巨型类组件）：

- 函数组件 + hooks（useEffect/useRef/useState）
- oss-ui **ProTable**（renderFormItem 查询表单一体化）
- hox：useEnvironmentModel（productVersion.provinceId / authority）、useLoginInfoModel（userId）
- 自带 service/api.js（模块内接口层）

## 六要素

| 要素 | 内容 |
| --- | --- |
| 路由与入口 | `/wireless-person-manager`（src/routes/index.js，fujian 新增） |
| 组件树 | index.jsx（主页面，函数组件）+ service/api.js |
| 状态管理 | hox（useEnvironmentModel/useLoginInfoModel）+ 组件内 state |
| 接口清单 | 见 service/api.js（92 行，福建人员管理域端点；深读待任务驱动） |
| 可复用点 | ProTable + hox 的列表页范式 |
| 已知坑 | 未深读，暂无记录 |
