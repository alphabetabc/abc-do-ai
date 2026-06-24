# StreamerPath 可移植版

## 文档元信息

| 字段           | 值                                                                                  |
| -------------- | ----------------------------------------------------------------------------------- |
| 文档版本       | v2.3                                                                                |
| 最后更新       | 2026-06-24                                                                          |
| 同步组件版本   | v2.3（首次发布 portable 自包含版本）                                                  |
| 配套文档       | [../SKILL.md](../SKILL.md) · [../core-implementation.md](../core-implementation.md)  |

把 `StreamerPath` 复制到**任意一个 React + TypeScript 项目**就能用，不需要本项目的 hooks 工具库，也不需要 styled-components。

## 文件清单

```
portable/
├── StreamerPath.tsx   # 主组件
├── Container.tsx      # 内联样式容器（无 styled-components 依赖）
├── hooks.ts           # 4 个轻量 shim hooks
├── types.ts           # 类型契约
├── index.ts           # 桶导出
└── README.md          # 当前文件
```

## 依赖最小化

| 原依赖                                                | 可移植版本         | 备注                                                                                       |
| ----------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `react`                                               | `react`            | 必须                                                                                       |
| `d3`（仅用 `interpolate`）                            | `d3-interpolate`   | 包体积从 ~250KB 降到 ~5KB；功能完全等价，因为本组件只用 `interpolate(a, b)`                  |
| `styled-components`                                   | **移除**           | `Container.tsx` 改用纯内联样式                                                              |
| `@fedx-web-common/react-hooks` 中的 `useLatest`       | `hooks.ts` 内联实现 | 5 行 ref 同步                                                                               |
| `@fedx-web-common/react-hooks` 中的 `useMemoizedFn`   | `hooks.ts` 内联实现 | useCallback + ref                                                                            |
| `@fedx-web-common/react-hooks` 中的 `useSize`         | `hooks.ts` 内联实现 | 改名 `useElementSize`，走 ResizeObserver，兜底 `resize` 事件                                |
| `~/web/hooks/useMemorizedObject`                       | `hooks.ts` 内联实现 | 浅比较（StreamerPath 三个被 memo 的对象都是浅层 props 对象，浅比较完全够用）                  |

> 如果目标项目**已经**提供同名同语义 hooks，把 `hooks.ts` 删掉、改 `StreamerPath.tsx` 顶部的 import 路径即可，组件主体一行不用改。

## 拷贝步骤

1. **复制整个 `portable/` 目录**到目标项目，比如 `src/components/streamer-path/`。
2. **安装唯一外部依赖**：

   ```bash
   npm i d3-interpolate
   # 或
   pnpm add d3-interpolate
   ```

3. **直接使用**：

   ```tsx
   import { StreamerPath } from '@/components/streamer-path';

   export default () => (
       <StreamerPath
           points={[
               { x: 30, y: 30 },
               { x: 700, y: 30 },
               { x: 700, y: 270 },
           ]}
           style={{ width: 740, height: 300 }}
       />
   );
   ```

## 与本项目内 `web/components/ui/streamer-path` 的差异

| 差异点              | 本项目内版本                        | portable 版本                         |
| ------------------- | ----------------------------------- | ------------------------------------- |
| Hooks               | 复用 `@fedx-web-common` 与项目 hooks | 全部内联，零外部 hooks 依赖            |
| 样式                | `styled-components`                 | 内联 style（`forwardRef` + `CSSProperties`） |
| 颜色插值             | `import * as d3 from 'd3'`          | `import { interpolate } from 'd3-interpolate'` |
| `Container` 额外样式 | styled `<canvas>` 绝对定位          | 多套一层 `<div>` 保证绝对定位            |
| `StreamerProps`     | 不含 `style`                        | 新增 `style?: CSSProperties`         |

行为完全一致：API 控制、运行次数、间隔、轨道、自动启停、生命周期清理、性能基线全部保留。

## 兼容性 / 兼容性回退

- `ResizeObserver` 在所有现代浏览器和 React Native Webview 中可用。
- 极老环境（IE11 等）会自动兜底到 `window.resize` 事件，此时容器必须挂在窗口可见层级。
- `requestAnimationFrame` 在所有现代浏览器可用；标签页隐藏时浏览器自动暂停，无需手动处理。

## 验证清单

把目录拷过去后，跑一遍：

- [ ] 渲染基础路径（`points` ≥ 2 个点）
- [ ] 自适应父容器尺寸（不传 `width`/`height`）
- [ ] `onCreation` 拿到 `api`，`api.start() / pause() / stop()` 工作正常
- [ ] `runCount` 控制运行次数
- [ ] `interval` 控制轮间间隔
- [ ] `track.visible = true` 显示轨道
- [ ] `autoStart = false` 不会自动开始
- [ ] 卸载组件后控制台无 `cancelAnimationFrame` 警告
- [ ] 高分屏（DPR > 1）下流光不模糊（按需在 `useEffect [width, height]` 中加入 `dpr` 缩放，参见 `core-implementation.md` 第 5 节）

## 进阶定制

- **添加新属性**：改 `types.ts` 扩展 `StreamerProps`，并在 `StreamerPath.tsx` 中读取并接入默认配置。
- **替换插值器**：把 `d3Interpolate` 换成自己写的线性插值（仅依赖两个颜色字符串与 `[0,1]` 的 `t`），Hook / 渲染循环都不用改。
- **改用 SVG**：参考 `core-implementation.md` 的算法章节，把 `ctx` 换成 `path` 元素即可，参数化、采样、插值逻辑通用。
- **多流光**：在 `StreamerPath.tsx` 内复制 `positionRef` / `currentRunRef` / `animate` 闭包，给每个流光一个独立的 `rafId` 即可，注意 cleanup。

## 关联文档

- [../SKILL.md](../SKILL.md) - 组件属性、API、使用示例
- [../core-implementation.md](../core-implementation.md) - 核心算法与渲染管线