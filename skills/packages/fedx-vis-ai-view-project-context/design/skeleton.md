# skeleton · 大屏项目骨架设计

> 源目录：`docs/skeleton/`；随 `pnpm export:skill` 拷入 `dist-skill/large-screen-builder/skeleton/`。
> 配套工作流：`docs/workflows/big-screen-assembly.md`。

## 1. 定位与设计原则

骨架是 skill 产物中「AI 搭屏的工程起点」：一个可独立 `pnpm install && pnpm dev` 的 Vite + React 18 + TS 工程，**预置布局层基础能力，不预设任何业务布局**。

| 原则 | 说明 |
| --- | --- |
| 能力预置、业务留白 | 基础设施（缩放/联动/请求/环境配置）预置好，分区/坐标/字段全由 PM inputs 推导（workflow B1） |
| 拷贝式接入 | 物料从 `specs/<模块>/code/` 拷入 `src/components/`，产出完全自包含项目，非 npm 包 |
| 零改写承诺 | 依赖版本与物料站对齐 + vite 别名把物料内部 `@/materials/components/*` 映射到 `src/components/*`，物料代码拷入即用 |
| 物料层零请求 | 请求只写在编排层（screens/services），经 props 下发物料 |

## 2. 目录结构与职责

```
docs/skeleton/
├── package.json            # 依赖版本与物料站对齐（echarts 6.1.0 / antd 6.7 / swiper 11.2.10 / react 18.3）
├── vite.config.ts          # 别名：@/components/*、@/common/*、@/materials/components/*（物料零改写关键）
├── tsconfig.json           # paths 与 vite 别名对齐
├── index.html
├── public/
│   └── environment.json    # 运行时环境配置（接口地址/静态直出数据/开关，改文件不重构建）
└── src/
    ├── main.tsx            # bootstrap：先 initEnvironment() 再 render
    ├── App.tsx             # 路由分发（HashRouter，一屏一路径，/ → /home；静态部署 404 免疫）
    ├── screens/
    │   └── home/
    │       ├── index.tsx        # 本屏布局：ScalerContainer + sections（TODO(B1) 指引）
    │       └── interactions.ts  # 本屏联动单例（TODO(B3) 填 defineFields）
    ├── components/         # 物料落地区（骨架预置 scaler-container、interaction-store、section-frame、error-boundary）
    ├── common/
    │   ├── api/index.ts    # createService：localMockUrl / converter / fallback，配置支持 getter
    │   └── environment.ts  # initEnvironment / getEnvironment（点路径读取）
    └── services/
        └── home/overview.ts  # 接口示例：按屏/模块分文件，示范读环境配置静态直出
```

## 3. 关键设计决策

| # | 决策 | 理由 |
| --- | --- | --- |
| 1 | 预置 ScalerContainer（scaleFull）而非手搓缩放 | 物料站现成能力，手搓重复且易错；设计稿尺寸/mode 留 TODO(B1) |
| 2 | 预置 interaction-store 且单例收敛到屏目录 | 屏级单例初始化位置是最易错点；确立「联动边界 = 屏」，跨屏传参走 URL query |
| 3 | 多屏 = react-router 一屏一目录一路径 | 屏内切换（轮巡/Tab）不开路由，走屏内 state 或联动 |
| 4 | createService 三能力对齐参考项目 services 层 | localMockUrl（mock 切换）/ converter（响应→物料契约）/ fallback（兜底）；不猜响应结构，payload 原样交 converter |
| 5 | USE_MOCK = `import.meta.env.DEV && VITE_USE_MOCK !== 'false'` | 生产构建恒关（防误发 mock），dev 可 env 临时关 |
| 6 | environment.json 启动加载 + getter 运行时求值 | 配置下发不重构建；enableStaticData 静态直出对齐参考项目「反拉终端」模式 |
| 7 | SectionFrame = 薄编排壳（坐标 + loading/error + 内置 ErrorBoundary） | 评审 P1「缺布局壳」的落点。与 ui-widget-shell 分工：widget-shell 管视觉（标题栏/边框/皮肤），SectionFrame 管「摆得准 + 挂得稳」；两层不互替（用户拍板 2026-11-11） |
| 8 | 不设统一 types/ 目录 | 类型跟数据走：契约类型定义在使用处（services/<module>/<name>.ts 或屏编排组件内，参考 overview.ts 的 OverviewIndicator），随屏自包含（用户拍板 2026-11-11） |
| 9 | HashRouter（原 BrowserRouter） | 静态部署（nginx/对象存储/任意子路径）深链接刷新不 404，无需服务器 rewrite；支持 history 模式的环境可自行换回，路由代码不变（用户拍板 2026-11-11） |
| 10 | package.json 保留全量依赖 | 开箱即 install 即跑，免去逐物料按需核对成本；依赖表用途改为「裁剪 / 排查」参考（用户拍板 2026-11-11） |

## 4. 已知缺口（外部模型设计评审结论，2026-11-11）

「零改写」承诺的 P0 缺陷已修复（2026-11-11，随 task-001 一并实施）：`_assets` 随产物导出并预置骨架别名、骨架补 less、补 `public/mock/` 示例、L3 明确「按别名层级落位」拷贝规则、interaction-store spec 对齐 getField API。

**P1 结构性缺口已清零**（2026-11-11，task-002）：SectionFrame / ErrorBoundary 预置（决策 7）、types 归属约定（决策 8）、mock 闭环（B3 约定 `public/mock/<module>/<name>.json`）、依赖策略矛盾消除（决策 10）、HashRouter 部署约束（决策 9）；屏清单模板补 7 类字段 + B1 无设计稿推导规则（栅格 / 边距 / z-index 四档命名层），B1 产出可判定。各项决策记录见第 3 节。

- **P2 已清零**（2026-11-12，task-003）：硬纪律机器化兜底落地——骨架 `eslint.config.mjs`（物料层禁请求库/请求 API）、`scripts/check-materials.mjs`（sha256 物料改写比对，独立命令 `pnpm check:materials`）、`scripts/check-discipline.mjs`（联动边界=屏 + 禁 vw/rem）、workflow B1 用户确认硬门槛。命令与规则见 skeleton/eslint.config.mjs 头部注释与 workflows/big-screen-assembly.md「纪律机器化」节。
