---
title: export-btn 组件逻辑维护
description: 导出按钮物料（export-btn）的组件代码维护要点，包含导出逻辑、样式构建、前缀图标渲染
version: 1.0.0
last_updated: 2026-06-16
---

# export-btn 组件逻辑维护

本文档说明 `export-btn` 组件代码（`index.tsx` + `CustomIcon` 子组件）的维护要点。

> 与 [schema.md](./schema.md)（配置面板）和 [data-model.md](./data-model.md)（数据契约）并列。

## 1. 文件结构

```
export-btn/
├── index.tsx          # 主组件
├── index.less         # 样式
├── schema.ts          # 配置面板（→ schema.md）
├── oss-material.json  # 物料元信息
└── doc/readme.md      # 用户向文档
```

## 2. 主组件 `ExportBtn`

### 2.1 入口签名

```typescript
const ExportBtn: React.FC<DesignerField & { exportAPIConfig: any }> = (props) => {
    const {
        className,
        config,
        customDataSourceApiConfig,
        exportAPIConfig, // 导出参数历史数据，新组件中弃用该参数
        designer: { env, constants, api },
        receivedPropsParams,
    } = props;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `config` | object | schema | 用户配置（baseStyle） |
| `customDataSourceApiConfig` | object | schema | 导出接口配置 |
| `exportAPIConfig` | object | 历史 | 导出接口配置（已弃用） |
| `designer` | object | 框架 | 设计器上下文（env、constants、api） |
| `receivedPropsParams` | object | 框架 | 接收的参数参数 |
| `interactionProps` | object | 框架 | 交互参数（customDataSourceApiParams） |

### 2.2 关键逻辑

#### 2.2.1 导出逻辑

```typescript
const onInnerClick = () => {
    const apiConfig = exportAPIConfig || customDataSourceApiConfig;
    const { dataType } = apiConfig;
    const { customDataSourceApiParams } = props.interactionProps;
    const config = _.cloneDeep(apiConfig[`${dataType}`]);

    api.buildCustomApiParams(config.params, { receivedPropsParams, customDataSourceApiParams });

    // 导出接口必要参数
    const extraConfig = { responseType: 'blob' };
    api.customDataSourceApi(dataType, {
        config,
        extraConfig,
        cancel: (c: any) => {
            preApiCancelTokenRef.current = c;
        },
    }).then(
        (data) => {
            const url = _.get(data, 'data');
            let href = url;
            if (!_.isString(url)) {
                // type 为需要导出的文件类型，此处为xls表格类型
                const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
                // 兼容不同浏览器的URL对象
                const myurl = window.URL || window.webkitURL || window.moxURL;
                // 创建下载链接
                href = myurl.createObjectURL(blob);
            }

            // 创建a标签并为其添加属性
            const downloadLink = document.createElement('a');
            downloadLink.href = href;
            downloadLink.download = `导出数据${dayjs().format('YYYYMMDDHHmmss')}.xls`;
            // 触发点击事件执行下载
            downloadLink.click();
        },
        (error) => {
            logger.default.debug(error);
        },
    );
};
```

**注意**：
- 优先使用 `exportAPIConfig`（历史参数），否则使用 `customDataSourceApiConfig`
- 使用 `api.buildCustomApiParams` 合并参数
- 使用 `api.customDataSourceApi` 发起导出请求
- `responseType: 'blob'` 确保返回二进制数据
- 文件名包含时间戳：`导出数据${dayjs().format('YYYYMMDDHHmmss')}.xls`
- 使用 `preApiCancelTokenRef` 存储取消令牌

#### 2.2.2 样式构建

```typescript
const formateStyle = () => {
    const { backgroundImg, backgroundType, backgroundColor, backgroundRepeat, textStyle, prefixStyle, ...innerStyle } = baseStyle;

    if (backgroundType === 'image' && backgroundImg) {
        innerStyle.backgroundImage = `url(${getImageUrl(backgroundImg, { env, constants })})`;

        if (backgroundRepeat && backgroundRepeat === 'full') {
            innerStyle.backgroundSize = '100% 100%';
            innerStyle.backgroundRepeat = 'no-repeat';
        } else {
            innerStyle.backgroundRepeat = backgroundRepeat;
        }
    } else if (backgroundColor) {
        innerStyle.backgroundColor = backgroundColor;
    }

    const result = { ...innerStyle, ...textStyle, height, width };
    return result;
};
```

**注意**：
- 背景类型：`image` 或 `color`
- `backgroundRepeat === 'full'` 时转换为 `backgroundSize: '100% 100%'` + `backgroundRepeat: 'no-repeat'`
- 合并 `textStyle` 和 `height`、`width`

#### 2.2.3 渲染结构

```typescript
return (
    <ConfigProvider prefixCls="oss-ui">
        <div
            className={`table-list-container ${className || ''}`}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <section className="export-btn-inner-container" onClick={onInnerClick} style={formateStyle()}>
                <CustomIcon style={baseStyle.prefix} data={baseStyle.prefix.prefixImg} env={env} constants={constants}></CustomIcon>
                <span className="export-btn-content">{baseStyle.content}</span>
            </section>
        </div>
    </ConfigProvider>
);
```

**注意**：
- 使用 `ConfigProvider` 包裹（oss-ui 要求）
- 外层 `div` 阻止事件冒泡
- 内层 `section` 绑定点击事件
- 根 class 名为 `table-list-container`（⚠️ 与物料名不一致）

### 2.3 维护检查清单

- [ ] 导出接口配置是否正确
- [ ] 参数合并是否正确
- [ ] 样式构建是否正确
- [ ] 前缀图标渲染是否正确

## 3. 子组件 `CustomIcon`

### 3.1 入口签名

```typescript
const CustomIcon = (props) => {
    const { style = {}, data, env, constants } = props;
    const { show = false, prefixType = 'img', prefixImg, ...prefixStyle } = style;
    // ...
};
```

| props | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `style` | object | baseStyle.prefix | 前缀样式 |
| `data` | object | baseStyle.prefix.prefixImg | 前缀图片数据 |
| `env` | string | designer.env | 环境 |
| `constants` | object | designer.constants | 常量 |

### 3.2 关键逻辑

```typescript
const iconComp = useMemo(() => {
    return () => <Image width={prefixStyle.width} preview={false} src={`${getImageUrl(data, { env, constants })}`} />;
}, [data, prefixStyle.width, env, constants]);

if (show && data) {
    const isIcon = prefixType === 'icon';
    if (isIcon) {
        return <Icon type={data} antdIcon style={prefixStyle} />;
    } else {
        return <Icon style={prefixStyle} component={iconComp} />;
    }
} else {
    return <></>;
}
```

**注意**：
- `prefixType` 支持 `icon` 和 `img` 两种类型
- 使用 `useMemo` 缓存图片组件
- `show` 字段在 schema 中设置为 `x-hidden: true`（隐藏但保留）

### 3.3 维护检查清单

- [ ] 前缀类型判断是否正确
- [ ] 图片缓存是否正确
- [ ] 样式传递是否正确

## 4. 样式 `index.less`

### 4.1 命名规范

```less
.table-list-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    cursor: pointer;
}
```

**注意**：
- 根 class 名为 `table-list-container`（⚠️ 与物料名不一致）
- 使用 flex 布局

### 4.2 维护检查清单

- [ ] 根 class 与 `oss-material.json.name` 一致（当前不一致）

## 5. 常用工具函数

| 函数 | 来源 | 用途 |
| --- | --- | --- |
| `getImageUrl` | `@Utils` | 获取图片 URL |
| `_.cloneDeep` | `oss-web-toolkits` | 深拷贝对象 |
| `_.get` | `oss-web-toolkits` | 安全获取对象属性 |
| `dayjs` | `dayjs` | 日期格式化 |
| `api.buildCustomApiParams` | 框架 | 构建自定义 API 参数 |
| `api.customDataSourceApi` | 框架 | 调用自定义数据源 API |

## 6. 性能要点

| 场景 | 注意事项 |
| --- | --- |
| 图片加载 | `CustomIcon` 使用 `useMemo` 避免重复加载 |
| 导出请求 | 使用 `preApiCancelTokenRef` 存储取消令牌 |
| 事件处理 | 外层 `div` 阻止事件冒泡 |

## 7. 调试技巧

### 7.1 查看导出配置

```typescript
console.log('apiConfig:', apiConfig);
console.log('config:', config);
```

### 7.2 查看样式

```typescript
console.log('formateStyle:', formateStyle());
```

## 8. 维护历史

| 日期 | 变更 | 原因 |
| --- | --- | --- |
| 2026-06-16 | 首次文档化 | 物料文档体系建设 |
