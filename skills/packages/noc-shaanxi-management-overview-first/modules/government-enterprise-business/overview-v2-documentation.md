# overview-v2 模块详细文档

> **所属技能**：[noc-shaanxi-first-government-enterprise-business](./SKILL.md)（政府企业业务子技能）
> **所属父技能**：[noc-shaanxi-management-overview-first](../../SKILL.md)
> **本文档位置**：`.trae/skills/noc-shaanxi-management-overview-first/modules/government-enterprise-business/overview-v2-documentation.md`

## 文档元信息

| 字段     | 值       |
| -------- | -------- |
| 文档版本 | v1.0     |
| 最后更新 | 2026-06-24 |

## 核心定位

**overview-v2 是政府企业业务模块的主页面入口，负责以椭圆轨道动画形式展示6种业务类型（ICT、专线、5G专网、物联网、企业宽带、IDC）的概览数据。**

## 设计特点

- **椭圆轨道布局**：6个业务图标沿椭圆轨迹排列
- **自动轮播**：图标沿轨道自动旋转，高亮当前选中项
- **交互支持**：点击切换、暂停/恢复控制
- **数字人联动**：支持数字人交互控制

---

## 目录结构

```
overview-v2/
├── Container.tsx       # 容器组件（样式定义）
├── Icons.tsx           # 业务图标组件
├── Line.tsx            # 连接线组件
├── ellipse-track.ts    # 椭圆轨道动画核心逻辑
├── images/
│   ├── icon-pause.png  # 暂停图标
│   └── icon-start.png  # 开始图标
└── index.tsx           # 入口组件
```

---

## 核心组件详解

### 1. 入口组件 (index.tsx)

**功能说明**：
- 数据请求和状态管理
- 椭圆轨道动画控制
- 数字人交互响应
- 业务图标渲染

**核心状态**：
| 状态 | 类型 | 说明 |
|------|------|------|
| currentItemId | string/null | 当前激活的业务项ID |
| dataSource | array | 布局后的数据列表（包含位置信息） |
| switchStatusRunRotateFlag | boolean | 自动旋转开关状态 |

**数据请求**：
```typescript
const { loading } = useRequest(
    () => getGovEnterBusinessTopDataApi(pick(props.currentZone, ['zoneId', 'zoneLevel'])),
    {
        refreshDeps: [props.currentZone],
        ready: isDefined(props.currentZone?.zoneId) && isDefined(props.currentZone?.zoneLevel),
        onSuccess: (data) => { /* 初始化椭圆轨道 */ }
    }
);
```

**数字人交互**：
```typescript
useMetaHumanEffect({
    action: [MetaHumanActions.SWITCH_OPERATE],
    effect: (metaHumanData, metaHumanPresets) => {
        const hit = metaHumanPresets['政企业务'][metaHumanData?.data?.module];
        // 根据数字人指令切换业务类型
    }
});
```

### 2. 容器组件 (Container.tsx)

**样式特点**：
- 宽度：100%
- 高度：`calc(560px - 40px)`
- 椭圆形轨道容器：1165px × 272px
- 背景图：`background-7.png`

**关键样式区域**：

| 区域 | 定位 | 尺寸 | 说明 |
|------|------|------|------|
| overview-background | 绝对定位 | 1275px × 840px | 背景装饰图 |
| track-container | 绝对定位 | 1165px × 272px | 椭圆轨道容器 |
| icon-run-status-switch | 绝对定位 | 65px × 67px | 暂停/开始按钮 |

### 3. 图标组件 (Icons.tsx)

**功能**：展示单个业务类型的图标和数据

**Props**：
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 业务项ID |
| imageId | string | 图标ID |
| businessTypeName | string | 业务类型名称 |
| active | boolean | 是否激活 |
| left/top | number | 位置坐标 |
| scale | number | 缩放比例 |
| zIndex | number | 层级 |
| leftData/rightData | object | 左右两侧数据 |
| onClick | function | 点击回调 |

**数据展示格式**：
```typescript
interface IndData {
    name: string;   // 指标名称
    value: number;  // 指标值
}
```

### 4. 连接线组件 (Line.tsx)

**功能**：连接业务图标到中心的装饰线

**Props**：
| 参数 | 类型 | 说明 |
|------|------|------|
| left/top | number | 位置坐标 |
| active | boolean | 是否激活（切换图片） |
| style | object | 额外样式 |

**激活状态切换**：
- 激活：`decoration-4.png`
- 未激活：`decoration-6.png`

---

## 椭圆轨道动画机制 (ellipse-track.ts)

### 核心算法

**椭圆参数**：
```typescript
const width = 1165;
const height = 272;
const ellipseParameters = {
    width,
    height,
    cx: width / 2,   // 中心点X
    cy: height / 2,  // 中心点Y
};
```

**点计算函数**：
```typescript
const point = (theta: number) => {
    return {
        x: ellipseParameters.cx * (1 + Math.cos(theta)),
        y: ellipseParameters.cy * (1 + Math.sin(theta)),
    };
};
```

**缩放变化**：基于角度动态调整图标大小
```typescript
const scaleSize = d3.scaleLinear()
    .domain([0, Math.PI * 0.5, Math.PI, Math.PI * 1.5, Math.PI * 2])
    .range([0.8, 1, 0.8, 0.6, 0.8]);
```

### 动画控制

**创建动画实例**：
```typescript
ellipseTrackRef.current = ellipseTrack.create(data, (info) => {
    setState({ 
        dataSource: info.layout, 
        currentItemId: data[info.activeIndex].id 
    });
});
```

**控制方法**：
| 方法 | 功能 |
|------|------|
| clear() | 清除动画，释放资源 |
| pause() | 暂停动画 |
| resume() | 恢复动画 |

**动画参数**：
- 旋转角度：0.5° 每帧
- 数据间隔角度：360° / 数据长度
- 切换间隔：可配置（默认2000ms）

---

## 数据流架构

```
┌──────────────────────────────────────────────────────────────────┐
│                    overview-v2/index.tsx                        │
├──────────────────────────────────────────────────────────────────┤
│  useRequest                                                     │
│       ↓                                                         │
│  getGovEnterBusinessTopDataApi(zoneId, zoneLevel)               │
│       ↓                                                         │
│  onSuccess: ellipseTrack.create(data, callback)                 │
│       ↓                                                         │
│  ellipse-track.ts                                               │
│       ↓                                                         │
│  layout() → 计算每个数据项的椭圆位置                             │
│       ↓                                                         │
│  callback({ layout, activeIndex })                              │
│       ↓                                                         │
│  setState({ dataSource, currentItemId })                        │
│       ↓                                                         │
│  渲染 IndItem 组件                                              │
│       ↓                                                         │
│  用户点击 / 自动轮播 → indItemChangeHandle → props.onChange     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 与 presets.ts 的关系

### 数据来源

overview-v2 的数据来自 API `getGovEnterBusinessTopDataApi`，返回的业务类型顺序与 `presets.ts` 中的 `overviewTypes` 对应：

| 业务类型 | 值 | 顺序 |
|----------|-----|------|
| ICT | 1 | 根据API返回顺序 |
| 专线 | 2 | 根据API返回顺序 |
| 5G专网 | 3 | 根据API返回顺序 |
| 物联网 | 4 | 根据API返回顺序 |
| 企业宽带 | 5 | 根据API返回顺序 |
| IDC | 6 | 根据API返回顺序 |

### 环境配置支持

overview-v2 支持通过环境配置自定义行为：

```typescript
// 自动旋转间隔
const interval = getEnvironment('shaanxiCustomSettings.screen1.政企业务.overview.interval') ?? 2000;

// 是否始终旋转（数字人模式下）
enableAlwaysRotate = get(env, 'shaanxiCustomSettings.screen1.政企业务.overview.enableAlwaysRotate', false);

// 背景样式
backgroundStyle = get(env, 'shaanxiCustomSettings.screen1.政企业务.overview.backgroundStyle');
```

---

## 扩展指南

### 1. 修改动画参数

在 `ellipse-track.ts` 中调整：
- `rotateAngle`：旋转速度
- `interval`：切换间隔（通过环境配置）
- `scaleSize`：缩放范围

### 2. 修改布局尺寸

在 `ellipse-track.ts` 中修改：
- `width`：椭圆宽度
- `height`：椭圆高度

### 3. 修改图标样式

在 `Icons.tsx` 中修改：
- `IndContainer`：图标容器样式
- 字体、颜色、间距等

### 4. 添加新业务类型

**注意**：overview-v2 展示的业务类型由 API 返回决定，如需新增业务类型：
1. 在 `presets.ts` 的 `overviewTypes` 中添加枚举
2. 确保后端 API 返回新业务的数据
3. 无需修改 overview-v2 代码（自动适应）

---

## 关键设计要点

1. **D3.js 依赖**：使用 D3.js 进行椭圆计算和缩放
2. **requestAnimationFrame**：使用浏览器动画API实现平滑动画
3. **资源管理**：组件卸载时清理动画资源
4. **数字人集成**：通过 `useMetaHumanEffect` 响应数字人指令
5. **环境配置**：支持通过环境变量动态调整行为

---

## 注意事项

1. **动画资源清理**：组件卸载时会自动调用 `clear()` 方法
2. **数字人模式**：数字人激活时会暂停自动旋转（可配置）
3. **响应式**：布局基于固定像素值，需注意屏幕适配
4. **API 依赖**：数据完全依赖 `getGovEnterBusinessTopDataApi` 返回