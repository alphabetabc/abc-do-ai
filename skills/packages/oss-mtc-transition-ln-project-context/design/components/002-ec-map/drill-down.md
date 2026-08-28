# 002 · EChartsMap 地图下钻机制（041 比对大屏实例）

> 性质：组件设计文档（下钻专题）
> 日期：2026-08-28
> 维护规则：本文件不入 `docs/`、不入 Git
> 实例来源：041 信访数据比对大屏 模块4 地图（task-060 交付；2026-08-28 task-062 交互改造：双击下钻 + 市级单击选中 + 空白取消；2026-08-28 task-063 口径解耦：区县选中仅周边刷新、地图不重拉）

---

## 1. 分层职责：组件不含下钻，下钻在业务层

**EChartsMap 组件层不包含任何下钻逻辑**，只提供「交互事件 → 结构化区域信息上抛」的通用能力（click / dblclick / geo 选中变化 / 空白点击）；下钻是业务层（页面侧）基于 `onDblClick` 回调 + 全局联动 Store 组合出来的机制。

| 层     | 文件                                                                     | 职责                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组件层 | `frontend/src/components/large-screen/ec-map/map.tsx`                    | 绑定 ECharts `click` / `dblclick` / `geoselectchanged` + zrender 空白 click，按 mapConfig 匹配区域，结构化上抛 `onClick` / `onDblClick` / `onGeoSelectChanged` / `onBlankClick` |
| 联动层 | `frontend/src/pages/visual/big-screen/petition-comparison/store.ts`      | InteractionStore 定义 `organId` / `cantType` 字段 + 原子 setter `setOrganId(cantCode, cantType)`                                                                                |
| 业务层 | `frontend/src/pages/visual/big-screen/petition-comparison/map/index.tsx` | 订阅字段、拉取 `/map`、管理地图视图 `currentAdcode`、双击下钻 / 单击选中 / 空白取消写回 Store                                                                                   |
| 页面层 | `frontend/src/pages/visual/big-screen/petition-comparison/index.tsx`     | 纯 6 模块绝对定位布局壳（返回按钮已迁入地图模块，task-062 收尾修订）                                                                                                            |

> InteractionStore 底座（`createInteractionStore` + `defineFields` + `useSubscribe`）见 `components/001-interaction-store`；字段定义落模块侧 store.ts，共享组件 `large-screen/interaction-store/` 未改动。

---

## 2. 交互模型：双击下钻 · 单击选中 · 空白取消（task-062 起生效；task-063 补「选中仅周边刷新」口径）

统一写入协议 `setOrganId(cantCode, cantType)`，一次 `setState` 原子写入 `organId + cantType` 两个字段（store.ts）：

| 交互                       | 触发源                                                                                                        | 写入                                           | 效果                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **双击地市**（省级视图）   | geo dblclick（`item.level === 'city'` 才响应）                                                                | `setOrganId(地市adcode, '6')`                  | 地图下钻一层到该市（视图切换）+ 全模块数据联动刷新；省级单击无操作                                                                                     |
| **单击区县**（地市下钻后） | geo click / 原生选中 `selectedMode: 'single'`（`onClick` + `geoselectchanged` 双通道，task-063 归档）         | `setOrganId(区县adcode, '6')`                  | geo 高亮选中 + **仅周边模块刷新，/map 不重拉**（请求口径与选中区县解耦，见 §4/§5）；地图保持市级视图不下钻（到下一层不再下钻）                         |
| **取消选中**（地市下钻后） | 再点已选区县（原生 toggle）或点击地图空白（zrender `target === null`）                                        | `setOrganId(currentAdcode, '6')`（回市级口径） | geo 取消高亮（空白点击另 dispatch `geoUnSelect` 清 geo 全部 + `unselect` 带 `selectedNameRef` 名清 series 选中）+ 仅周边模块回市级口径，**地图不重拉** |
| **返回按钮**               | 地图模块 img（`/static/images/map-back.png` 30×30，页面坐标 left 555 / top 68 即模块上方 40px，下钻后才显示） | `setOrganId('210000', '4')`                    | 直达省级：地图恢复省级视图 + 全模块回省级口径                                                                                                          |

> 市级双击（`level: 'district'`）不响应下钻——`handleMapDblClick` 早退；市级两次单击只会触发选中/取消 toggle（organId 往返，仅周边模块刷新，地图不重拉，瞬态无害）。

cantType 语义（对齐 api-contracts §7.44 /map）：`'4'` = 地市列表（省级视图），`'6'` = 区县列表（地市下钻后）。

> ⚠️ typo 裁决记录：任务文件 / spec 早前稿中的 `cantType === 4 ? 6 : 4` 是笔误——该式会让区县点击把 cantType 切回 `'4'`，导致地图跳回省图，与验收「点击区县不再下钻」矛盾。实现统一为「点击任何区域都写 `'6'`」，仅返回按钮写 `'4'`。

---

## 3. 事件链路（怎么交互的）

```
用户双击地市（省级视图）/ 单击区县（市级视图）
  │
  ├─ 下钻 · ECharts ecInstance.on('dblclick')          ← ec-map/map.tsx（组件层统一绑定）
  │    emit(params)：params.componentType === 'geo'
  │    → 按 name / alias 在 map-config.json 中匹配 MapConfigItem
  │    → onDblClick({ data: item, type: 'geo', rawParams }, ecInstance)
  │    → 业务层 handleMapDblClick：item.level === 'city' 才 setOrganId(adcode, '6')（区县级早退）
  │
  ├─ 选中 · geo selectedMode='single' 原生 toggle
  │    ecInstance.on('geoselectchanged')（params.name 为当前选中区域名数组）
  │    → 组件层解析为 { selectedNames, items: [{ data: item, type: 'geo', rawParams }] }
  │    → onGeoSelectChanged → 业务层 handleGeoSelectChanged：
  │      有选中 → setOrganId(区县adcode, '6') + selectedNameRef 缓存板块名
  │      无选中 → setOrganId(currentAdcode, '6') + 清缓存
  │
  ├─ 单击区县 · ecInstance.on('click')（geo 分支经 mapConfig 匹配，task-062 后用户会话补）
  │    → onClick → 业务层 onMapClick（市级守卫）：setOrganId(区县adcode, '6')
  │      + selectedNameRef 缓存板块名（rawParams.name，供空白点击 unselect 定位）
  │      与 geoselectchanged 双通道并行：同值重复写入 → zustand 值不变，refreshDeps 不触发
  │
  ├─ 空白点击 · zr.on('click') 且 target === null
  │    → onBlankClick(ecInstance) → 业务层 handleBlankClick：
  │      dispatchAction({ type: 'geoUnSelect', geoIndex: 2 }) 清 geo 全部
  │      + dispatchAction({ type: 'unselect', name: selectedNameRef.current }) 清 series 选中
  │      + setOrganId(currentAdcode, '6')
  │
  └─ setOrganId → zustand setState 原子写入 organId + cantType
       │
       ├─ 支路 A · 数据联动：useSubscribe（useShallow）→ organId/cantType 变化
       │    → 周边 6 个模块 useRequest 的 refreshDeps 触发，并发重拉
       │      （trend / appeal / rank / identity / channel / summary+channels）
       │      **map 除外（task-063）**：/map 请求口径与选中区县解耦——区县选中/取消时
       │      mapQueryOrganId 锁定市级 currentAdcode，请求参数不变 → 不重发
       │
       └─ 支路 B · 地图视图：视图 effect（见 §4）→ cantType 变化才切换
            currentAdcode → EChartsMap 的 adcode prop 变化
            → 重新加载 geojson（`/static/map/geojson/{adcode}.geojson`）
```

### 3.1 组件层事件细节（为什么点击落得准）

- **series 静默 + geo 层可交互**：`mapSeriesBuilder` 生成 map series 时 `silent: true`（热力层不吃事件），`EChartsMap` 传 `geoSilent={false}` → 点击/双击事件落在可交互 geo 层
- **emit 匹配**（map.tsx）：`componentType === 'geo'` 分支按 `params.name` → `params.alias` 顺序查 mapConfig 缓存（`getMapConfig()`），命中才回调，未命中静默忽略（如沈抚合并虚拟行等未知区域）
- **事件绑定一次化 + latestPropsRef（task-062）**：click / dblclick / geoselectchanged / zr 空白 click 在 useLayoutEffect（deps `[ecInstance]`）中绑定一次；handler 经 ahooks `useLatest(props)` 取最新值，避免业务侧依赖变化（`effectiveCantType` / `currentAdcode`）导致闭包过期
- **geoselectchanged 独立分支（task-062）**：其 `params.name` 是数组（当前选中区域名集合），与 click 的字符串 name 不同 → 组件层先解析为 `{ selectedNames, items: [{ data, type: 'geo', rawParams }] }` 再上抛（置于 geo 字符串匹配分支之前）；未传 `onGeoSelectChanged` 直接 return，对既有页面零影响
- **空白点击挂 zrender 层（task-062）**：geo/series 事件不触发于区域缝隙与空白处，须 `ecInstance.getZr().on('click')`，`zrParams.target == null` 判定空白；未传 `onBlankClick` 不做任何事
- **业务层 onMapClick + selectedNameRef（task-062 后用户会话补，task-063 归档）**：市级单击区县除原生选中链路外，组件层 geo click 分支也上抛 → 业务层 `onMapClick`（市级守卫）`setOrganId(区县adcode,'6')` + 缓存最近选中板块名；与 `geoselectchanged` 双通道并行，同值重复写入时 zustand 值不变 → 各模块 refreshDeps 不触发，无多余请求
- **series-map 同步 selectedMode + unselect 带 name（用户会话补，task-063 归档）**：`presets.ts` series map 层 `selectedMode` 跟随 `geoSelectedMode`（geo 与 series 选中态同步）；ECharts 通用 `unselect` action 必须携带板块名才能定位清除，而空白点击无 name 入参 → 业务层 `selectedNameRef` 记录最近选中名，`handleBlankClick` 依次 dispatch `geoUnSelect`（geo 层清全部）+ `unselect`（series 层按名清除）
- **组件卸载时逐项 `off` 解绑**；`useRawEvent` 未开启（默认走 mapConfig 匹配）

### 3.2 adcode 的来源

- `info.data` 即 `MapConfigItem`（map-config.json，含 `name / alias / adcode / level / cp / parent`），点击回调直接取 `item.adcode` 作为下钻目标，**业务层无需自行解析区域**
- map-config.json 已验证闭合：`level: 'city'` 369 条 / `level: 'district'` 2850 条（沈阳市 `210100`、和平区 `210102` 等均可命中）

---

## 4. 视图切换 vs 数据联动（怎么处理的）

核心机制：**`currentAdcode` 只跟随 `cantType` 变化，不跟随 `organId` 变化**。用 `prevCantTypeRef` 记录上一次 cantType，effect 中先比对、没变就早退：

```tsx
// map/index.tsx（节选，task-062 建立；task-063 补 selectedNameRef 清空）
const [currentAdcode, setCurrentAdcode] = useState("210000");
const prevCantTypeRef = useRef(effectiveCantType);
const mapEcRef = useRef<any>(null);
const selectedNameRef = useRef<string | null>(null);
useEffect(() => {
    if (prevCantTypeRef.current === effectiveCantType) return; // cantType 未变 → 视图不动
    prevCantTypeRef.current = effectiveCantType;
    setCurrentAdcode(effectiveCantType === "4" ? "210000" : effectiveOrganId);
    // 视图切换时防御性清除 geo 选中残留（replaceMerge 重建 geo 已天然清选中，此处兜底）
    mapEcRef.current?.instance()?.dispatchAction?.({ type: "geoUnSelect", geoIndex: 2 });
    selectedNameRef.current = null;
}, [effectiveCantType, effectiveOrganId]);
```

三种场景逐一推演：

| 场景                      | cantType 变化     | currentAdcode                                                   | 地图视图                                                                                          | 数据                                                 |
| ------------------------- | ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 初始 / 返回省级           | `'6'→'4'` 或未变  | `'210000'`                                                      | 辽宁省 14 地市                                                                                    | 省级口径                                             |
| **双击地市**              | `'4'→'6'`         | `= effectiveOrganId`（本次双击的地市 adcode，原子写入同批可达） | 下钻为该市（区县列表）                                                                            | 全模块换该市口径                                     |
| **单击区县（选中/取消）** | `'6'→'6'`（不变） | 不变（effect 早退）                                             | **保持市级视图**，geo 原生选中高亮切换；**/map 不重拉**（mapQueryOrganId 锁定市级参数，task-063） | 仅周边模块刷新（选中 → 区县口径；取消 → 回市级口径） |

**为什么区县点击不会误切回省图**：`setOrganId(adcode, '6')` 原子写入后 cantType 仍是 `'6'`，`prevCantTypeRef.current === effectiveCantType` 成立 → effect 早退，`currentAdcode` 不动 → `EChartsMap` adcode 不变 → 不重新加载 geojson。

**/map 请求口径解耦（task-063，两层刷新语义）**：周边模块 refreshDeps 仍含全局 `effectiveOrganId`（区县选中即重拉）；地图侧请求参数经 `mapQueryOrganId` 归一化——区县码（末 2 位非 `'00'`，与 `buildMapData` 区县判定同款）回退市级 `currentAdcode`，`refreshDeps: [mapQueryOrganId, effectiveCantType]` 两项均不变 → 不重发。四场景无中间态：双击下钻那帧 organId 已是市级 9 位码（不满足区县判定，不归一化）→ 单请求；区县选中/取消 → 参数锁死不重发；返回省级 → 正常刷新。

### 4.1 常驻渲染保证下钻可用

- 地图 **常驻渲染**（不因空数据卸载 `EChartsMap`）：组件树不卸载，点击事件始终可用（早期版本的 `Empty` 覆盖层已移除；`map/index.tsx` 头部残留的同名注释待顺带清理）
- loading 用 `Spin` 覆盖（`spinning={mapLoading}`），不阻断后续点击
- 若按「无数据就不渲染地图」实现，空态时地图消失、无法点击下钻——这是本设计的反向约束

---

## 5. 数据口径与下钻粒度

| 项                            | 说明                                                                                                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 粒度决定方式                  | `organId` 右补 `'0'` 至 9 位即隐式决定粒度（`210000` → 14 地市行；地市 → 区县行；区县 → 该区县行）；前端发送 `organId + cantType`（cantType 契约已登记 §7.44，默认 `'4'`；早期「后端无 cantType 参数」记录过时，后端实现是否消费该参数待联调核对，顺延 041 M5） |
| /map 请求口径解耦（task-063） | `mapQueryOrganId = cantType === '6' && Number(organId.slice(4)) !== 0 ? currentAdcode : organId`（区县码归一化回市级）；`refreshDeps: [mapQueryOrganId, effectiveCantType]`——实现「市级单击选中仅周边刷新、地图不重拉；层级切换正常刷新」的两层语义             |
| 兜底                          | runtime 不会自动初始化 defineFields 的 default → 模块侧一律 `organId ?? DEFAULT_ORGAN_ID`（`'210000'`）、`cantType ?? '4'`                                                                                                                                      |
| 区县 / 地市行判定             | `buildMapData`：`cantCode` 取前 6 位，末 2 位非 `'00'`（`Number(code6.slice(4)) !== 0`）→ `level: 'district'`；地市行按 14 地市固定名称集合过滤（丢弃沈抚合并前独立行）                                                                                         |
| visualMap max                 | `computeVisualMapMax`：取数据 max，max=0 兜底 1（防除零），省级/市级各自独立计算                                                                                                                                                                                |

---

## 6. 已确认决策

- [x] **原子 setter**：`setOrganId(cantCode, cantType)` 一次 setState 同时写两字段，避免 organId/cantType 分离写入引发两次渲染/两套数据口径错位
- [x] **字段定义落模块侧**：041 的 organId/cantType 定义在 `petition-comparison/store.ts`，共享组件 `interaction-store/` 未改（沿 039 petition 模式）
- [x] **区县点击不下钻**：`prevCantTypeRef` + cantType 比对早退，数据联动与视图切换解耦
- [x] **地图常驻渲染**：Empty 仅作覆盖层，保证空数据/加载中仍可点击下钻
- [x] **series silent + geoSilent=false**：点击事件统一落 geo 层，经 mapConfig 匹配上抛，业务侧只认 `item.adcode`
- [x] **返回按钮模块内（2026-08-28 修订）**：原页面入口 index.tsx 迁入地图模块 map/index.tsx（Fragment 兄弟节点），页面坐标 left 555 / top 68 不变；`canGoBack = effectiveOrganId !== '210000'`，图片加载失败 onError 隐藏；页面入口只剩纯 6 模块渲染
- [x] **双击下钻一层（task-062）**：下钻触发由单击改双击，`item.level !== 'city'` 早退 → 区县级天然不再下钻；省级双击前导的两次 click 无副作用
- [x] **geo 原生选中（task-062）**：`selectedMode: 'single'`（市级才传）+ select 样式与 emphasis 一致 + `geoselectchanged` 上抛；ECharts 管理选中态，组件层 additive 转发（未传 props 的 038/039/040 零影响）
- [x] **取消选中回市级口径（task-062）**：再点已选区县（原生 toggle）或点空白 → organId 回 `currentAdcode`；空白点击 dispatch `geoUnSelect` 清全部；视图 effect 追加防御性 geoUnSelect
- [x] **返回图片直链（task-062）**：`src="/static/images/map-back.png"` 直接路径（public/ 映射站点根），移除 `resolvePublicAssetUrl` 包装
- [x] **两层刷新语义（task-063 定稿）**：省级双击下钻 → 周边 + 地图都刷新；市级单击选中区县 / 取消 → **仅周边模块刷新，地图不重拉**（用户澄清「第一层双击下钻 带动周边+地图的数据刷新；第二层 点击选中某个区域，只有周边需要刷新」）
- [x] **/map 请求口径解耦（task-063）**：`mapQueryOrganId` 区县码归一化回市级 `currentAdcode`，`refreshDeps` 改 `[mapQueryOrganId, effectiveCantType]` 与全局 organId 解耦；四场景推演无中间态（下钻那帧 organId 为市级码不触发归一化）；实施中曾因声明顺序引发 TDZ（`Cannot access 'currentAdcode' before initialization`），已重排修复
- [x] **onMapClick + selectedNameRef + series selectedMode（task-062 后用户会话补，task-063 归档）**：市级单击双通道（onClick + geoselectchanged）同值写入无多余请求；空白点击 `geoUnSelect` + `unselect` 带 name 双层清选中
- [ ] 运行时联调（双击下钻/区县选中地图不重拉/空白取消/返回）未实测，顺延 041 M5
- [ ] 后端 `/map` 实现是否消费 cantType（契约 §7.44 已登记 cantType 默认 4；早期「后端无 cantType 参数」记录过时），顺延 041 M5
- [ ] 041 spec §4.4 / tasks.md 旧「单击下钻」描述同步（L3 门禁需提案会签），task-062 拍板顺延

---

## 7. 相关文档

- [概述与使用示例](./index.md)
- [技术实现与边界情况](./reference.md)
- 041 spec：`docs/specs/041-bigdata-petition-comparison-display/spec.md`（§3.3 模块4 / §4.4.2 下钻协议）
- API 契约：`docs/design/api-contracts.md` §7.44（/map organId/cantType 口径）
