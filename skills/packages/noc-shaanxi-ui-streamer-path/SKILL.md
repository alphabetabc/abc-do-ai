---
name: 'noc-shaanxi-ui-streamer-path'
version: '2.3'
updated: '2026-06-24'
component-version: '2.3'
description: '维护和扩展 StreamerPath 组件 - 一个基于 Canvas 的流光路径动画组件，支持自定义路径、颜色、线宽、运行次数、间隔控制和 API 控制。当用户需要修改、增强或排查 StreamerPath 组件时调用此技能。'
---

# StreamerPath 组件技能

## 文档元信息

| 字段         | 值                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------- |
| 文档版本     | v2.3                                                                                            |
| 最后更新     | 2026-06-24                                                                                      |
| 同步组件版本 | v2.3（首次发布 portable 自包含版本）                                                            |
| 关联文档     | [core-implementation.md](./core-implementation.md) · [portable/README.md](./portable/README.md) |

此技能用于管理 StreamerPath 组件，这是一个基于 Canvas 的流光路径动画组件，可以沿自定义路径创建发光流动效果。

## 组件位置

### 本项目内

```
web/components/ui/streamer-path/
├── index.tsx      # 主组件
├── types.ts       # TypeScript 接口定义
└── Container.tsx  # 样式容器组件（styled-components）
```

### 可移植版（拷贝即用）

```
.trae/skills/noc-shaanxi-ui-streamer-path/portable/
├── StreamerPath.tsx   # 主组件（无 styled-components / 无项目 hooks 依赖）
├── Container.tsx      # 内联样式容器
├── hooks.ts           # useLatest / useMemoizedFn / useElementSize / useMemorizedObject 自带 shim
├── types.ts           # 类型契约
├── index.ts           # 桶导出
└── README.md          # 拷贝步骤与差异说明
```

直接复制整个 `portable/` 目录到任意 React + TS 项目，安装 `d3-interpolate` 即可运行。详见 [可移植版 README](./portable/README.md)。

## 核心功能

| 功能         | 描述                             |
| ------------ | -------------------------------- |
| 自定义路径   | 支持通过点数组定义任意多边形路径 |
| 颜色渐变     | 支持配置尾部和头部颜色           |
| 线宽控制     | 可配置尾部和头部线条粗细         |
| 自适应尺寸   | 自动检测父容器尺寸或使用显式尺寸 |
| 动画回调     | 动画完成时触发回调函数           |
| 运行次数控制 | 支持指定运行次数或无限循环       |
| 间隔配置     | 支持每轮动画之间的等待时间       |
| API 控制     | 提供 start/stop/pause 控制接口   |
| 轨道呈现     | 支持显示/隐藏轨道及自定义样式    |
| 自动启动控制 | 支持控制组件创建时是否自动启动   |

## API 控制接口

```typescript
interface StreamerApi {
    start: () => void; // 开始动画
    stop: () => void; // 停止动画
    pause: () => void; // 暂停动画
}
```

## 属性参考

```typescript
interface StreamerProps {
    points: StreamerPoint[]; // 必填：路径点数组
    width?: number; // Canvas 宽度（未设置时自动）
    height?: number; // Canvas 高度（未设置时自动）
    colors?: {
        tail: string; // 尾部颜色（默认: '#0098ff'）
        head: string; // 头部颜色（默认: '#ffffff'）
    };
    lineWidth?: {
        tail: number; // 尾部线宽（默认: 1px）
        head: number; // 头部线宽（默认: 2px）
    };
    speed?: number; // 动画速度（默认: 2.5）
    streamerLength?: number; // 流光长度（默认: 220）
    steps?: number; // 渲染步数（默认: 200）
    onAnimationComplete?: () => void; // 动画完成回调
    className?: string; // 容器类名
    runCount?: number; // 运行次数（默认: -1，无限循环）
    interval?: number; // 每轮间隔时间（毫秒，默认: 0）
    onCreation?: (api: StreamerApi) => void; // 组件创建回调，暴露 API
    track?: {
        visible?: boolean; // 是否显示轨道（默认: false）
        color?: string; // 轨道颜色（默认: 'rgba(255,255,255,0.2)'）
        width?: number; // 轨道线宽（默认: 1）
    };
    autoStart?: boolean; // 是否自动启动动画（默认: true）
}
```

## 使用示例

```tsx
// 基本用法：L形路径
<StreamerPath
    points={[
        { x: 30, y: 30 },
        { x: 700, y: 30 },
        { x: 700, y: 270 },
        { x: 30, y: 270 },
    ]}
    width={740}
    height={300}
/>

// 自定义颜色和线宽
<StreamerPath
    points={points}
    colors={{ tail: '#00ff88', head: '#ffff00' }}
    lineWidth={{ tail: 2, head: 6 }}
    speed={3}
/>

// 自适应父容器尺寸
<div style={{ width: 500, height: 200 }}>
    <StreamerPath points={points} />
</div>

// 带完成回调
<StreamerPath
    points={points}
    onAnimationComplete={() => console.log('动画完成')}
/>

// 运行指定次数（3次后停止）
<StreamerPath
    points={points}
    runCount={3}
/>

// 带间隔的动画（每轮等待1秒）
<StreamerPath
    points={points}
    interval={1000}
/>

// 显示轨道
<StreamerPath
    points={points}
    track={{
        visible: true,
        color: 'rgba(100, 200, 255, 0.3)',
        width: 2,
    }}
/>

// 延迟启动（手动控制）
const [api, setApi] = useState<StreamerApi | null>(null);

<StreamerPath
    points={points}
    autoStart={false}
    onCreation={setApi}
/>

<button onClick={() => api?.start()}>开始</button>
<button onClick={() => api?.pause()}>暂停</button>
<button onClick={() => api?.stop()}>停止</button>
```

## 典型增强需求

此技能处理的常见请求：

- 添加新属性（如透明度控制、动画方向）
- 修复渲染问题（如路径起点位置、颜色插值）
- 性能优化（如减少步数提升帧率）
- 添加新功能（如多个流光、暂停/恢复控制）
- 更新样式（如发光效果、阴影）

## 维护指南

1. **性能**: 保持步数在 100-300 之间以平衡效果和性能
2. **颜色支持**: 使用 d3.interpolate 支持多种颜色格式（hex、rgb、rgba、hsl）
3. **类型安全**: 添加新属性时务必更新 types.ts
4. **内存泄漏**: 确保在组件卸载时调用 cancelAnimationFrame 和 clearTimeout
5. **响应式**: 测试各种容器尺寸下的自适应行为
6. **函数稳定性**: 使用 useMemoizedFn 包裹回调函数，useLatest 包裹回调引用
7. **对象稳定性**: 使用 useMemorizedObject 包裹配置对象

## 详细文档

- [核心实现文档](./core-implementation.md) - 路径参数化、流光采样、颜色插值、渲染循环、自适应尺寸、API 控制、清理与扩展点
- [可移植版本 (portable)](./portable/README.md) - 自包含源码，可直接拷贝到任意 React + TS 项目，零项目内 hooks / styled-components 依赖

## 版本历史

- **v1.0**: 初始版本，支持基本路径动画
- **v1.1**: 添加颜色自定义和完成回调
- **v1.2**: 添加线宽控制和自动尺寸支持
- **v1.3**: 集成 d3.interpolate 处理颜色
- **v2.0**: 添加运行次数、间隔配置、API 控制（start/stop/pause）和 useMemoizedFn 优化
- **v2.1**: 添加轨道呈现功能，支持显示/隐藏轨道及自定义颜色和线宽
- **v2.2**: 添加 autoStart 属性，支持控制组件创建时是否自动启动动画
