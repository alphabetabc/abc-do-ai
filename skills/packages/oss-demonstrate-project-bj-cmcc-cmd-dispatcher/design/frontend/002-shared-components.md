# 共享 UI 组件约定（service-recovery-panel）

> 从 `003-frontend.md` 第 6 节拆出，仅在本页按需引用。通用规范见 `../003-frontend.md`。

页面级共享组件典型形态（源码：`web/pages/bj-cmcc-cmd-dispatcher/components/service-recovery-panel/index.tsx`）：

```tsx
// components/<shared-ui>/index.tsx
export type ServiceRecoveryVariant = 'city' | 'cell';

export interface ServiceRecoveryPanelProps {
    /** 'city' = A 组（退服恢复情况）/ 'cell' = B/C/D 组（退服小区恢复情况） */
    variant: ServiceRecoveryVariant;
    /** 设计稿坐标（统一从外部传入，便于复用） */
    left: number;
    top: number;
    width: number;
    height: number;
    /** 图片资源（来自 UI 出图）；提供则用 <img>，否则用占位 div */
    src?: string;
}

export const ServiceRecoveryPanel: React.FC<ServiceRecoveryPanelProps> = ({
    variant,
    left,
    top,
    width,
    height,
    src,
}) => {
    const title = variant === 'city' ? '退服恢复情况' : '退服小区恢复情况';
    // 有 src → 渲染 <img objectFit="fill">；无 src → 渲染占位 div（dashed 边框 + 标题）
};
```

## Props 字段表

| 字段               | 类型               | 必填 | 说明                                               |
| ------------------ | ------------------ | ---- | -------------------------------------------------- |
| `variant`          | `'city' \| 'cell'` | ✅   | 区分同形不同义的模块；同时决定占位时的标题文案     |
| `left` / `top`     | `number`           | ✅   | 设计稿绝对坐标（px）                               |
| `width` / `height` | `number`           | ✅   | 设计稿尺寸（px）                                   |
| `src`              | `string`           | ❌   | 图片资源路径；提供渲染 `<img>`，不提供渲染占位 div |

## 使用方（modules 内）

```tsx
import { ServiceRecoveryPanel } from '../../components/service-recovery-panel';

// 模块 A（已接图）
<ServiceRecoveryPanel variant="city" src="/static/images/bj-cmcc-cmd-dispatcher/退服恢复情况.png" ... />

// 模块 B（占位，未传 src）
<ServiceRecoveryPanel variant="cell" ... />
```

> 消费方模块（`service-recovery` / `service-recovery-cell`）的坐标与 Group 配置见 `./001-modules-params.md`。

---

## 文档元信息

> 版本：v1.0.0
> 日期：2026-08-24
