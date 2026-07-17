# TabButton（日常 / 突发 Tab 切换）

中心模块唯一的 Tab 切换器。同时支持 URL `?tab=1/2` 初始化与点击切换。

- 源文件：[tab-button/index.tsx](web/pages/emergency-support/modules/center/components/tab-button/index.tsx)
- 样式按钮（styled-components）：[Button.tsx](web/pages/emergency-support/modules/center/components/tab-button/Button.tsx)

## 职责

1. 渲染「日常保障」「突发保障」两个按钮
2. 初始化时读取 `window.location.search.tab`，派发 `center:tabChange`
3. 点击时切换 Tab；同时切回 `tab1` 时清空 `centerAreaId` / `centerAreaNeIds`

## Props

| prop       | 类型                     | 说明                         |
| ---------- | ------------------------ | ---------------------------- |
| `value`    | `TabChangeEnum`          | 当前激活的 Tab（由上层传入） |
| `dispatch` | `(key, payload) => void` | 派发器                       |

## 关键逻辑

### URL 初始化

```ts
useEffect(() => {
    const tabType = new URLSearchParams(window?.location?.search)?.get('tab'); // 1日常 2突发
    props.dispatch(
        widgetFields.getField('center:tabChange'),
        tabType === '2' ? TabChangeEnum.tab2 : TabChangeEnum.tab1,
    );
}, []);
```

URL 中：

- 无 `?tab=` 或 `?tab=1` → tab1（日常）
- `?tab=2` → tab2（突发）

### 点击切换

```ts
const handleClick = (type: TabChangeEnum) => {
    props.dispatch(widgetFields.getField('center:tabChange'), type);
    if (type === TabChangeEnum.tab1) {
        // 重置突发保障区域参数
        props.dispatch(widgetFields.getField('centerAreaId'), '');
        props.dispatch(widgetFields.getField('centerAreaNeIds'), {
            neIds: '',
            data: [],
        });
    }
};
```

切回 `tab1` 必须重置突发保障的 `centerAreaId` 与 `centerAreaNeIds`，否则下次再切到 `tab2` 会看到上次残留。

## ImageButton 样式

`Button.tsx` 用 `styled-components` 实现：

- `width: 60px; height: 50px;` 固定尺寸
- 通过 `bgSettings` getter 选择背景图（来自 `constants.IMAGE_PATH`）
- `bgSettings` 有 4 个 key：`tab1` / `tab1:active` / `tab2` / `tab2:active`，其中 tab1 的两个 key 指向同一张图、tab2 的两个 key 也指向同一张图
- 选中态判断：`$activeValue === $type` 时用 `$type` 对应的图，不等时用 `${$type}:active`（未选中态）
- 文字「日常保障」「突发保障」定位在按钮右侧（`left: 200%; transform: translateX(-50%)`），选中态 `opacity: 1`，未选中态 `opacity: 0.8`

```tsx
<ImageButton $activeValue={value} $type={TabChangeEnum.tab1} onClick={handleClick.bind(null, TabChangeEnum.tab1)}>
    <span className="name">日常保障</span>
</ImageButton>
```

## className

- 根：`center-tab-buttons`

## 易踩坑

- 修改图片路径时只改 `constants.IMAGE_PATH`，不要硬编码 `/static/images/...`
- `ImageButton` 的 key 选择逻辑是 `$activeValue !== $type ? \`${$type}:active\` : $type`——**未选中态**才用 `:active` 后缀的 key，注意这是反向判断
- tab1 的 `tab1` 和 `tab1:active` 用的是同一张图（`button-中屏按钮.png`），tab2 的 `tab2` 和 `tab2:active` 也用的是同一张图（`button-中屏按钮选中.png`）
- URL 参数只接受 `'1'`/`'2'`，其他值（例如 `?tab=日常`）会回退到 `tab1`
- 不要在切换 Tab 时清空 `zoneSelect`，否则会触发下游 `useRequest` 重新请求，省 Path 闪一下

> 版本：v1.0 · 创建日期：2026-07-13
