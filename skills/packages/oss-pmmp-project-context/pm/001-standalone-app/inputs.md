# 001 · pmmp 独立部署并嵌入新系统

## 需求

- 将 oss-pmmp 部署到新服务器 10.10.6.53（部署目录 /opt/iptv）。
- 将「性能监控」功能嵌入 http://10.10.6.53:20020/ 系统的「性能监控」分组。

## 环境

| 项 | 值 |
|---|---|
| 现运行地址 | http://10.10.2.8:9001/（含菜单管理页 /security/menu-admin-manage） |
| 现菜单托管服务 | http://10.10.2.8:5412（菜单条目指向的端口） |
| 目标系统 | http://10.10.6.53:20020/（admin / Admin@1234） |
| 部署服务器 | 10.10.6.53，root / yiyangboco |
| 部署目录 | /opt/iptv |

## 已确认信息（2026-11-19 菜单管理页核对）

- 10.10.2.8:9001 菜单管理中「性能监控」分组共 16 条菜单，分页 2 页（每页 10 条）。
- 菜单条目字段：协议 http、端口 5412、域名/IP 空、类型「默认打开」、父级=性能监控。
- 16 条菜单路径去掉 `/pmmp` 前缀后，与本仓库 src/routes/index.js 注册路由一一对应（整应用部署即可全覆盖）。
- 仓库中未被菜单收录的路由仅：`/`、`/test`、/performance-data/performance-data-table（子页）。
- 「性能数据」菜单（pmmp-data）启用状态为「隐藏」，其余 15 条为「显示」。

### 性能监控分组 16 条菜单清单

| # | 菜单名称 | 菜单描述 | 路径 |
|---|---|---|---|
| 1 | 性能数据 | pmmp-data | /pmmp/performance-data（隐藏） |
| 2 | 告警条件设置 | pmmp-1 | /pmmp/performance-rules |
| 3 | 性能分类查询 | performance-query-type | /pmmp/performance-query-type |
| 4 | 缺数检测设置 | data-verifying | /pmmp/data-verifying |
| 5 | 性能指标组管理 | performance-indicator-group | /pmmp/performance-indicator-group |
| 6 | 性能趋势 | performance-trend-modal | /pmmp/performance-trend-modal |
| 7 | 性能趋势页面 | performance-trend | /pmmp/performance-trend |
| 8 | 阈值设置 | threshold-setting | /pmmp/threshold-setting |
| 9 | 性能数据查询 | performance-query | /pmmp/performance-query |
| 10 | 性能指标管理 | /pmmp/performance-indicator-manage | /pmmp/performance-indicator-manage |
| 11 | 报告模板管理 | /pmmp/performance-report-template | /pmmp/performance-report-template |
| 12 | 总体监控视图 | /pmmp/performance-over-monitor | /pmmp/performance-over-monitor |
| 13 | 测量指标查询 | performance-mea-indicator | /pmmp/performance-mea-indicator |
| 14 | 报告实例管理 | /pmmp/performance-report-example | /pmmp/performance-report-example |
| 15 | 性能指标查询 | performance-per-indicator | /pmmp/performance-per-indicator |
| 16 | 性能批量查询 | performance-query-batch | /pmmp/performance-query-batch |

### 二级子节点（按钮/操作权限，含权限 key）

**告警条件设置**（7 个）

| 按钮 | 权限 key |
|---|---|
| 导出 | pmmpPerformanceRulesExportBatch:Other |
| 编辑 | pmmpPerformanceRulesEdit:Other |
| 删除 | pmmpPerformanceRulesDelete:Other |
| 禁用启用 | pmmpPerformanceRulesEnable:Other |
| 查看 | pmmpPerformanceRulesDetail:Other |
| 新建 | pmmpPerformanceRulesCreate:Other |
| 复制 | pmmpPerformanceRulesCopy:Other |

**缺数检测设置**（10 个）

| 按钮 | 权限 key |
|---|---|
| 批量导出 | pmmpDataVerifyingExportBatch:Other |
| 批量删除 | pmmpDataVerifyingDeleteBatch:Other |
| 删除 | pmmpDataVerifyingDelete:Other |
| 新建 | pmmpDataVerifyingCreate:Other |
| 停用启用 | pmmpDataVerifyingEnable:Other |
| 导出 | pmmpDataVerifyingExport:Other |
| 编辑 | pmmpDataVerifyingEdit:Other |
| _过滤器树形界面删除 | pmmpDataVerifyingDelDataVerify:Other |
| 批量启用 | pmmpDataVerifyingStartEnableFlagBatch:Other |
| 批量停用 | pmmpDataVerifyingEndEnableFlagBatch:Other |

**阈值设置**（4 个）

| 按钮 | 权限 key |
|---|---|
| _设置观察期 | pmmpThresholdSettingSettingStickTimes:Other |
| _导出 | pmmpThresholdSettingthresholdlistIndexExport:Other |
| _导入 | pmmpThresholdSettingthresholdlistFileUpload:Other |
| _全部导出 | pmmpThresholdSettingthresholdlistAllExport:Other |

**性能数据查询**（3 个）

| 按钮 | 权限 key |
|---|---|
| _导出 | pmmpPerformanceQueryQueryViewHandleExport:Other |
| _重置 | pmmpPerformanceQueryQueryViewHandleReset:Other |
| _查询 | pmmpPerformanceQueryQueryViewHandleQuery:Other |

- 按钮节点字段：协议/端口/域名IP/路径均为空，类型「默认打开」，全屏「禁用」。
- 其余 12 个菜单无二级节点。
- 二级节点为操作权限项，不涉及路由部署，但迁移菜单时需连同 key 一并建到新环境。

## 接入方式预研（2026-11-19 已验证通过）

**结论：采用宿主「第三方链接 / iframe」+「Shell 内 iframe 嵌入」方式接入。**

验证链路（宿主 10.10.6.53:20020，菜单管理 /system/menus）：

1. 目标系统菜单树里已有「性能监控」根菜单（/pmmp，内部页面，仅作分组）。
2. 在其下新增子菜单「预研-嵌入百度」验证：
   - 菜单行为：第三方链接 / iframe
   - 打开方式：Shell 内 iframe 嵌入
   - 第三方 URL 模板：https://www.baidu.com
   - 平台路由 path：`/ext/baidu-test`（系统强制 iframe 菜单路径必须以 /ext/ 开头；子菜单路径不必以父级为前缀）
   - 「允许 URL 传递 Token」可选（pmmp 需要宿主鉴权信息时再开）
3. 新建菜单后**必须在角色管理（/system/roles）对目标角色授权勾选**，否则菜单不显示。已对「超级管理员」授权。
4. 验证结果：顶部菜单出现「性能监控」→ 侧边栏出现子菜单 → 点击后 Shell 打开页签，1310×1143 iframe 正常渲染外部站点。

**pmmp 正式接入清单（待部署后执行）**：

- 每条 pmmp 菜单 = 一条「Shell 内 iframe 嵌入」子菜单：
  - 上级菜单：性能监控
  - 菜单行为：第三方链接 / iframe；打开方式：Shell 内 iframe 嵌入
  - 第三方 URL 模板：`http://10.10.6.53:<pmmp端口>/<pmmp路由>`（对应上表 16 条，隐藏的「性能数据」可不建）
  - 平台路由 path：`/ext/pmmp-<slug>`
- 按钮权限：宿主另有「动作管理/权限码管理」模块，24 个按钮权限 key（见上表）如何迁移待研究。
- 全部建完后统一在角色管理授权。

## 待确认

- pmmp 在 10.10.6.53 /opt/iptv 下的部署端口与静态托管方式（nginx？）
- 预研菜单「预研-嵌入百度」（/ext/baidu-test）验证完成后是否删除
- 「允许 URL 传递 Token」是否需要开启（取决于 pmmp 后端接口鉴权方式）
