# 任务卡 · 接口地址路由调整（serviceDiscovery 与具体服务分离）

> Status：**已完成（仓库侧）**——2026-11-10 改选方案 B 并已改代码；发版 / 现场配置 / 验收转后续流程（见 §6）
> 需求来源：`../../../pm/2026-11-05/需求.md` + `../../../pm/2026-11-05/家客前端配置.json`
> 机制背景：`../../../design/001-overview/001-overview.md` §3；`../../../design/002-modules/environment-config/overview.md`、`url-composition.md`

## 0. 结论先行

- 方向成立：4 类接口需按具体服务取地址，不再经过 `cloud.view.server-gcss`。
- **原「直接部署现有代码 + 把 `serviceDiscovery` 改成相对值」的方案无效**：当前转换器用 `new URL()` 解析，相对基地址必抛 `TypeError`（见 §2.1），带 `baseUrlType` 的请求会全部 reject，direct 模式也受影响。
- 因此执行前必须选一条路（§6）：
  - ~~方案 A（2026-11-05 曾定稿）~~：`serviceDiscovery` 用绝对网关地址，仅改配置。**2026-11-10 复盘两份配置对照后放弃**——开发环境（`public/environment.json`）是"绝对地址直连"拓扑、陕西现场（k8s）是"同源相对反代"拓扑，方案 A 会把现场全部未带键调用从同源改成跨域，隐含推翻现场流量模型，且依赖网关绝对地址浏览器可达。
  - **方案 B（2026-11-10 最终选定，已实施）**：改 `src/common/api/index.js` 去掉 `new URL()` 依赖，兼容相对 `serviceDiscovery`；实现为简化版（原 url 直接拼接，不做 pathname/search 拆分），见 §5-B。
- **2026-11-05 已核实（§4）**：线上镜像即本仓代码（sourcemap 反解逐字一致），线上故障为配置问题而非代码缺陷，故**无需发版代码**。
- ~~线上镜像判断仍属推断~~（已被 §4 build 包反解取代：镜像即本仓代码）。

## 1. 目标

| #   | 页面             | 接口                                       | 目标服务           |
| --- | ---------------- | ------------------------------------------ | ------------------ |
| 1   | 业务概览右上角   | `dictionary-config/selectedList`           | cloud.view.manager |
| 2   | 宽带业务         | `indicator-config/allList`、`selectedList` | cloud.view.manager |
| 3   | 电视业务         | 同 #2（参数不同）                          | cloud.view.manager |
| 4   | 故障分析管理规则 | `cloud-diagnose/circuitinterrupttitle/*`   | cloud-diagnose     |

## 2. 已核实事实

### 2.1 代码侧（已核实）

- 4 类调用点全部带正确 `baseUrlType`，且键名与目标服务对应：
  - #1：`src/pages/situation/scale/index.jsx` L191-L200 → `situationService.getConfigData`（`src/common/services/situationService.js` L109-L124）→ `situationConfigUrl`
  - #2/#3：`src/common/services/broadbandService.js` L39-L64（allList）、L66-L91（selectedList）→ `configUrl`；宽带/电视页均引用该 service
  - #4：`src/pages/analysis-rules-management/common/interface-config.js` 等 4 文件 → `AnalysisRuleUrl`
- 无后端接口 fullUrl 绕过：全仓 `fullUrl` 仅用于静态资源（`src/common/services/mapConfigs.js`、`src/pages/topo/topo-view/index.jsx` L19 等）。
- path 前缀（`manager/data-manager/v1`、`cloud-diagnose/`）在代码 path 里，`direct` 只需写到服务根。
- **转换器对相对 `serviceDiscovery` 不容忍**（`src/common/api/index.js` L63-L64、L71-L86）：
  - `let { serviceDiscovery: baseUrl } = env` 在模块加载时快照，供 `createWebService` 作 baseURL（相对值可用）；
  - 但带 `baseUrlType` 时先 `url = ${serviceDiscovery}${url}` 再 `new URL(url)` 解析；若 `serviceDiscovery` 为 `/serviceDiscovery...` → `TypeError: Invalid URL` → catch 后 `Promise.reject`；
  - 该解析位于 mode 分流**之前**，故 direct 模式同样中断。

### 2.2 配置侧（线上 k8s：截图 image_001 + `家客前端配置.json`）

- `serviceDiscovery = "/serviceDiscovery/cloud.view.server-gcss"`：相对值，且值本身带路由 → 所有未带 `baseUrlType` 的请求被吸到 server-gcss。
- **`situationConfigUrl` 键缺失**：截图是 `situationUrl → monitorSetUrl → AnalysisRuleUrl → broadbandUrl → configUrl` 连续片段，中间没有该键；JSON 亦无。**需现场复核完整 ConfigMap**（见 §7-1，design 文档与本次结论冲突）。
- `configUrl.direct = http://10.206.144.137:8888/cloud.view.manager`（`discover` 空、`mode: direct`）：方向正确。
- `AnalysisRuleUrl.direct = http://10.206.158.227:11557`（`discover` 空、`mode: direct`）：裸 IP，是否即 cloud-diagnose 待确认。
- `monitorSetUrl`：`mode: discover`，`direct = https://10.206.158.208:8077`，`discover = cloud.alarm.model.define`。
- `topoXmlProxyUrl = "/serviceDiscovery/cloud.view.server-gcss"`：被塞了同一条路由，但消费方式见 §2.3。
- `situationUrl.direct`（9011 网关含 `/serviceDiscovery/` 路径段）与 `broadbandUrl.direct`（8888 网关）写法分裂；8888 系为主流。

### 2.3 三类不走本仓转换管道的消费方（已核实）

| 消费方 | 方式 | 位置 |
| --- | --- | --- |
| `filterUrl` | 取 `.direct` 直接交给告警窗组件，**不经 `baseUrlType`** | `src/components/alarm-window-view/index.jsx` L73 |
| `topoXmlProxyUrl` | `setProxyUrl` 注入 oss-topo 请求器 | `src/pages/topo/topo-view/index.jsx` L12、`src/pages/alarm-topo/index.jsx` L9 |
| `iceUrl` / `alarmSoundUrl` | 组件直读 `.direct` 字段 | `src/components/alarm-window-view/index.jsx` L57-L80 |

结论：改 `serviceDiscovery` **不影响** `filterUrl`、`topoXmlProxyUrl`、`iceUrl`；原卡片把 `filterUrl` 列为回归点有误，已移除。

## 3. 修改配置的影响范围（已重核）

改配置键 = 该键下所有调用点一起切换：

- `configUrl`（3 处，全在 broadbandService）：allList、selectedList、**selectedAdd**（`broadbandService.js` L100-L103，需求未点名，属溢出项）。
- `situationConfigUrl`（**8 处请求点**，原卡片写 4 有误）：
  - 需求 #1：`src/pages/situation/scale/index.jsx` L200
  - `dictionary-config/selectedAdd`：`src/pages/situation/scale/scale-topn/topn-header/index.jsx` L47
  - 宽带 detail：`src/pages/broadband-service/detail/index.jsx` L251、L274
  - 电视 detail：`src/pages/television-service/detail/index.jsx` L341、L360
  - VIP 导入/下载：`src/pages/situation/setting/util.js` L29-L55
- `AnalysisRuleUrl`（**23 处 / 4 文件**，原卡片写 27 有误）：analysis-rules-management **11** + fault-rules-management 8 + fault-diagnosis 2 + 公共字典 2。
- 改 `serviceDiscovery` 值：影响
  - `monitorSetUrl`（discover 模式，`src/components/alarm-window-view/alarm-detail-container/alarm-detail/index.jsx` L27-L33）；
  - **所有未带 `baseUrlType` 的 proxy 调用**（全仓 `proxy[...]` 共 43 处，其中未带者依赖 `serviceDiscovery` 作基地址；逐处清单**本次未完成，需补**）；
  - 若方案 A 改用绝对地址，上述未带键的调用会从同源相对变成跨域绝对，风险更大。
- 不受影响：`situationUrl` / `broadbandUrl`（视图服务，需求明确"其他保持不变"）、`filterUrl` / `topoXmlProxyUrl` / `iceUrl`。

## 4. 线上镜像判断（**已核实**，2026-11-05 build 包反解）

已拿到现场 build 包 `.local-source/oss-hwms-monitor-1.0.0-20240320084444/build`，其 sourcemap 含 `sourcesContent`，直接反解出镜像真实源码：

- **镜像内 `common/api/index.js` 与本仓 `src/common/api/index.js` 逐字一致**（3366 字符，同样的 `new URL()` 转换器与 `baseUrlType` 分流）。
- chunk 内 `baseUrlType` 命中 412 处、`situationConfigUrl` 命中 55 处 → **镜像基线包含本仓配置转换机制**，原「镜像不含 baseUrlType 调用点」推断不成立。
- 原「双斜杠矛盾」（§10 上一版）系误判：实测单斜杠请求应属**未带 `baseUrlType` 的 proxy 调用**（直接以 `serviceDiscovery` 作 baseURL，不经过 `new URL()`），与「线上运行本仓转换器」不矛盾。**「线上即本仓代码 + 现场注入配置」成立。**
- build 包自带 `environment.json` 为构建残留（开发环境值），线上以 k8s ConfigMap 注入为准，两者差异不能互证。
- **发版基线（用户提供）**：陕西家客使用 tag `tag-v1.3.0.0.20240322`，来源分支 `develop-shaanxi`；现场 build 包（`1.0.0-20240320084444`）即构建自该 tag。
- 结论：**线上问题是配置问题（`serviceDiscovery` 相对值触发 `new URL` 抛错），不是代码缺陷；构建产物无需更换，无需发版代码。**

## 5. 方案（二选一，执行前定稿）

### 方案 A：配置侧（`serviceDiscovery` 改绝对地址）

前提：该绝对地址从浏览器可达，且 https 页面允许（无混合内容/CORS 拦截）。

```json
{
    "serviceDiscovery": "http://<网关host>:8888/serviceDiscovery",
    "situationConfigUrl": {
        "describe1": "业务概览指标配置服务",
        "direct": "http://10.206.144.137:8888/cloud.view.manager",
        "discover": "cloud.view.manager",
        "mode": "direct"
    },
    "configUrl": {
        "describe1": "指标配置服务",
        "direct": "http://10.206.144.137:8888/cloud.view.manager",
        "discover": "cloud.view.manager",
        "mode": "direct"
    },
    "AnalysisRuleUrl": {
        "describe1": "故障分析规则管理",
        "direct": "http://10.206.158.227:11557",
        "discover": "cloud-diagnose",
        "mode": "direct"
    }
}
```

- `monitorSetUrl` **不在改动块内**（值不变，仅列入回归）。
- 未带 `baseUrlType` 的调用会随 `serviceDiscovery` 变成绝对基地址，需单独回归。
- `<网关host>` 待现场确认；若页面为 https 而目标为 http，此方案大概率被混合内容拦截。

### 方案 B：代码简化 + 兼容相对地址（**最终实施版**，2026-11-10）

1. **实际实现**（比原设想的 pathname/search 拆分更简）：`src/common/api/index.js` requestTransforms 中删除"拼 `serviceDiscovery` 前缀 → `new URL()` 拆 pathname/search"整段，改为原 `url` 直接拼接：

```js
const {
    [baseUrlType]: { mode = "", direct: realurl = "", discover = "" },
    serviceDiscovery,
} = env;
if (mode === "direct") {
    res.url = `${realurl}${url}`;
} else if (mode === "discover") {
    res.url = `${serviceDiscovery}/${discover}${url}`;
}
```

   依据：旧逻辑中"拼前缀再剥掉"在正常输入下净效果即原 url 原样返回，`new URL()` 只带来"必须绝对地址"的隐含契约，无实际收益。删除后：
   - 相对 `serviceDiscovery`（同源反代拓扑）从 TypeError 变为可用；
   - direct 模式拼接 `realurl + url`（url 需以 `/` 开头，全仓 services 均如此）；
   - `mode` 非直连/发现时不再兜底走 discover，原样放行（现有配置所有键均显式带 mode，无影响）。

2. `serviceDiscovery` 现场保持相对 `"/serviceDiscovery"`（同源代理拓扑不变）。
3. 4 个目标键优先 `mode: "discover"`（`discover` 写 `cloud.view.manager` / `cloud-diagnose`），拼出同源 `/serviceDiscovery/<服务名>/...`；若现场要求 direct，再切 mode。
4. 回归：所有带 `baseUrlType` 的既有接口 + `monitorSetUrl`。

**已知残留（代码救不了，转配置侧）**：`env[baseUrlType]` 键缺失（现场 ConfigMap 疑缺 `situationConfigUrl`）仍会解构抛错 reject——必须现场补键。

> 发版：方案 B 需在 `develop-shaanxi` 上打新 tag 构建镜像，替换现场 `1.0.0-20240320084444.A2`。

## 6. 下一步（按序；1-3 已完成，4-7 转现场/后续流程）

1. ~~用户决策方案 A / B~~（2026-11-05 曾定 A；**2026-11-10 改定 B**，见 §0）。
2. ~~代码修改~~（已完成 2026-11-10：`src/common/api/index.js` requestTransforms 按 §5-B 简化，注释残留已清理）。
3. ~~任务卡与 design 文档回填~~（2026-11-10 完成：本卡 + environment-config 两篇；任务卡归档至 `plans/done/2026-11/`）。
4. 发版：`develop-shaanxi` 打新 tag，构建镜像替换现场 `1.0.0-20240320084444.A2`（发版前本地 `yarn build` 验证构建通过）。
5. 现场配置：ConfigMap **补 `situationConfigUrl` 键**（代码救不了缺键，需求 #1 的关键）+ 核对 `configUrl` / `AnalysisRuleUrl` 指向（建议 discover 模式，见 §5-B）。
6. 现场验收（§9）：F12 复查 4 类接口地址；控制台无 `Invalid URL`、无混合内容报错；回归 `monitorSetUrl`、未带键调用、VIP 导入下载、指标配置新增、拓扑。
7. 仓库 `public/environment.json` 开发配置对齐（另行处理，不阻塞线上）。

## 7. 待确认（外部输入）

1. 完整 k8s ConfigMap 是否确无 `situationConfigUrl` 键（截图仅局部片段；design 文档与本次结论冲突，必须以现场为准）。
2. `serviceDiscovery` 是否有浏览器可达的绝对地址；或同源相对是否必须保留。
3. 页面实际协议（是否为 https）与 direct 目标（`10.206.144.137:8888`、`10.206.158.227:11557`）的浏览器可达性、CORS、混合内容。
4. `AnalysisRuleUrl.direct` 的 `10.206.158.227:11557` 是否即 cloud-diagnose；8888 网关是否路由 cloud-diagnose。
5. 网关是否支持 `/serviceDiscovery/<服务名>/` 纯前缀路由（方案 B discover 模式的前提）。
6. 顺带切换的接口在目标服务是否可用：`dictionary-config/selectedAdd`、VIP 导入/下载、`indicator-config/selectedAdd`。
7. ~~发版基线：镜像实际来源 tag/分支，chunk 内是否存在 `baseUrlType` 读取。~~（已核实：存在，且 `api/index.js` 与本仓一致，见 §4。用户确认基线：tag `tag-v1.3.0.0.20240322`，分支 `develop-shaanxi`。）

## 8. 不做清单

- ~~不改 `src/common/api/index.js` 的 URL 重写机制~~（**2026-11-10 解除**：方案 B 获用户批准并已实施，见 §5-B）。
- 不新增环境配置键；不合并 `situationConfigUrl` / `configUrl`。
- 不改 `config/`、`scripts/`；不升级依赖。
- 本轮不改 `topoXmlProxyUrl` / `situationUrl` / `broadbandUrl` / `filterUrl`。
- 不处理 fullUrl 分支（全仓 fullUrl 仅用于静态资源，不走本转换器；`http://` 协议判断随 `new URL()` 一并删除后该分支不复存在）。

## 9. 验收标准（发版 + 现场配置落地后执行，转现场流程）

- [ ] 业务概览 `dictionary-config/selectedList` 请求指向 cloud.view.manager
- [ ] 宽带/电视 `indicator-config/*` 请求指向 cloud.view.manager
- [ ] 分析规则 `circuitinterrupttitle/*` 请求指向 cloud-diagnose
- [ ] 上述请求均不再经过 `cloud.view.server-gcss`
- [ ] 4 类接口均返回成功；浏览器控制台无 `Invalid URL` / 混合内容 / CORS 报错
- [ ] 回归：告警列设置（`monitorSetUrl`）、未带 `baseUrlType` 的调用、VIP 导入下载、指标配置新增、拓扑 XML、告警导出

## 10. 变更记录

- 2026-11-05：建卡（素材自 design 侧 api-url-routing 设计草案拆解归位）
- 2026-11-05：补充影响范围核实、fullUrl 排查、git 时间线考古；发现"镜像日期晚于配置机制进仓库"的矛盾，结论从"发版+改配置"降级为"待判定"，阻塞项重排
- 2026-11-05：review 修订——①新增"相对 `serviceDiscovery` 触发 `new URL` 抛错"硬阻塞与方案 A/B；②修正计数（AnalysisRuleUrl 27→23、situationConfigUrl 4→8）；③移除 `filterUrl` 回归点，改列 `monitorSetUrl` + 未带 `baseUrlType` 调用；④补镜像判断的现场验证法、混合内容/CORS 风险、完整 ConfigMap 复核；⑤标注 design 文档 mislabel
- 2026-11-05：**方案定稿 A（不改代码）**——通过现场 build 包（`.local-source/oss-hwms-monitor-1.0.0-20240320084444/build`）sourcemap `sourcesContent` 反解：镜像 `common/api/index.js` 与本仓逐字一致、`baseUrlType`/`situationConfigUrl` 均在 chunk 中；原 §4「镜像不含调用点」「双斜杠矛盾」两条推断均推翻（后者系未带键 proxy 调用所致）。线上为配置问题，改 ConfigMap 即可，镜像与代码均不动；§7-7 关闭
- 2026-11-10：**方案 A → B 改选并实施**——对照 `public/environment.json`（开发：绝对地址直连拓扑）与 `家客前端配置.json`（现场：同源相对反代拓扑），方案 A 会把现场未带键调用整体改跨域且依赖网关绝对地址可达，放弃。用户判断 `new URL()` 为代码 bug（相对 `serviceDiscovery` 必抛 TypeError + 缺键抛错 + http 判断缺陷），选定方案 B 简化版：删除 `new URL()` 与前缀拼接整段，改为 `direct/discover + 原 url` 直接拼接（`src/common/api/index.js` requestTransforms）。代码已改并清理注释残留；发版、现场 ConfigMap 补键、验收转 §6-4~6。design 回填：environment-config `overview.md`（mislabel 修正）+ `url-composition.md`（算法更新）；本卡归档 `plans/done/2026-11/`
