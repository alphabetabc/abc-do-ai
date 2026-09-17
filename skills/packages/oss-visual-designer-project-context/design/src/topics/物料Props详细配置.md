# 物料Props详细配置文档

## 一、完整调用链

物料从配置到渲染的完整调用链如下：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         渲染流程调用链                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GeneratorWidget                                                            │
│       │                                                                     │
│       ▼                                                                     │
│  GeneratorField  ──▶  getMaterialsField(type, container)                    │
│       │                        │                                            │
│       │                        ▼                                            │
│       │              createField(container)                                 │
│       │                        │                                            │
│       ▼                        ▼                                            │
│  generator()          RemoteComponent                                      │
│       │                        │                                            │
│       ▼                        ▼                                            │
│  ItemField  ◀───────── renderProps.Component                               │
│       │                                                                     │
│       ▼                                                                     │
│  物料组件(Field)                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、调用链详细分析

### 1. GeneratorWidget（入口）

```javascript
// GeneratorWidget.js
const loopWidgets = (list, interactions = null, { depth = 0 } = {}) => {
    depth += 1;
    return list.map((prop) => {
        return (
            <GeneratorField
                key={prop.uniqueId}
                value={prop}
                depth={depth}
            >
                {prop.children && loopWidgets(prop.children, interactions, { depth })}
            </GeneratorField>
        );
    }).filter(Boolean);
};
```

**输入**：`widgets` 数组，包含组件配置信息

### 2. GeneratorField（容器层）

```javascript
// GeneratorWidget.js
const GeneratorField = (props) => {
    const { value, children, slider, currentGroupSliderActive, depth } = props;
    const { width, height, background, left, top, isHidden, ...rest } = value.data.config;

    const getSubField = useCallback(
        (m) => {
            const prop = getMaterialsField(value.type, useAppInfoModel?.data?.container);
            return generator(prop)(m);
        },
        [value.type],
    );

    return (
        <div style={overwriteStyle} className={className} data-id={value.uniqueId}>
            {show
                ? getSubField({
                      isDevelop: false,
                      type: value.type,
                      value: value.data,
                      uniqueId: value.uniqueId,
                      options: value.data.config,
                      children: ...,
                      currentGroupSliderActive: depth === 1 ? true : currentGroupSliderActive,
                  })
                : null}
        </div>
    );
};
```

**传递给 getSubField 的参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `isDevelop` | `boolean` | 是否开发模式 |
| `type` | `string` | 组件类型 |
| `value` | `object` | 组件完整数据 |
| `uniqueId` | `string` | 组件唯一ID |
| `options` | `object` | 配置项 |
| `children` | `array` | 子组件（仅GROUP/LAYOUT_BLOCK） |
| `currentGroupSliderActive` | `boolean` | 当前分组滑块激活状态 |

### 3. generator（生成器）

```javascript
// generator.tsx
const fieldGenerator = ({ fieldCanRedefine: can, Field: SourceField = null, props = {} }) => {
    return (args) => {
        const { Field: RedefineField = null, ...fieldProps } = args;
        const Field = (can && RedefineField) || SourceField;

        let fieldElement = ...;

        if (args.type === FIELD_COMP_TYPES.GROUP) {
            fieldElement = <GroupField {...props} {...fieldProps} />;
        } else if (args.type === FIELD_COMP_TYPES.LAYOUT_BLOCK) {
            fieldElement = <LayoutBlock {...props} {...fieldProps} />;
        } else if (Field) {
            fieldElement = <ItemField field={Field} defaultProps={props} compProps={fieldProps} />;
        }

        return fieldElement;
    };
};
```

**关键逻辑**：
- `props`：来自 getMaterialsField 返回的默认属性（通常为空对象）
- `fieldProps`：来自 GeneratorField 传递的组件配置
- 通过 `ItemField` 包装物料组件

### 4. ItemField（注入层）

```typescript
// item-field/index.tsx
const memoField = useMemo(() => {
    const mergedProps = {
        ...fullProps,              // { ...defaultProps, ...compProps }
        ...(fullProps.value || {}), // 配置值展开
        ...fetchResult,            // 数据请求结果
    };
    return (
        <Field
            {..._.omit(mergedProps, ['interactions', 'drillDownLevel', 'children', 'options', 'value', 'onChange'])}
            receivedPropsParams={receivedPropsParams}
            designer={envShare.designer}
            interaction={interactionApi}
            interactionProps={interactionProps}
            onBeforeRender={onBeforeRender}
        />
    );
}, [...]);
```

### 5. getMaterialsField（物料获取）

```javascript
// materials/index.js
export function getMaterialsField(type, container) {
    let fieldCanRedefine = false;
    let Field;

    const materials = getMaterialCache(container);

    if (materials[type]) {
        Field = materials[type];
    } else {
        Field = createField(container);
        materials[type] = Field;
    }

    return {
        fieldCanRedefine,
        Field: Field || null,
    };
}
```

### 6. createField（物料消费）- **真正消费物料的地方**

```javascript
// materials/index.js
const createField = (container) => {
    return (props) => {
        const { components: materialsList } = useComponentsInfo();

        const { onBeforeRender, ...restProps } = props;
        const { type: propsType } = restProps;

        const remoteAssets = useMemo(() => {
            if (!_.isArray(materialsList) || materialsList.length === 0) return null;

            const remoteMaterialUrl = _.get(useEnvironmentModel, 'data.environment.visualMaterialConfig.url', '');
            const material = materialsList.find((d) => d.type === propsType);

            let url = material?.jsPath;
            if (url) url = `${remoteMaterialUrl}/${url}`;

            let css = material?.cssPath;
            if (css) css = `${remoteMaterialUrl}/${css}`;

            return {
                url,
                cssUrls: [css],
            };
        }, [materialsList, propsType]);

        useEffect(() => {
            return () => {
                taskManager.cancel(onBeforeRender);
            };
        }, [onBeforeRender]);

        if (remoteAssets === null) return null;

        const localMaterial = findLocalMaterial({ type: propsType });

        return (
            <RemoteComponent
                url={remoteAssets.url || ''}
                cssUrls={remoteAssets.cssUrls}
                container={document.body}
                loader={<DataStatus status={DataStatus.STATUS.LOADING} />}
                {...restProps}
                render={(renderProps) => {
                    if (renderProps.err) {
                        if (localMaterial.err) {
                            return <ErrorComp err={renderProps.err} />;
                        }
                        return <localMaterial.Component {...restProps} />;
                    }
                    taskManager.add(onBeforeRender);
                    return <renderProps.Component {...restProps} />;
                }}
            />
        );
    };
};
```

---

## 三、物料最终接收的Props

### 第一阶段：GeneratorField → generator

| 参数 | 来源 | 说明 |
|------|------|------|
| `type` | `value.type` | 组件类型标识 |
| `value` | `value.data` | 组件完整配置数据 |
| `uniqueId` | `value.uniqueId` | 组件唯一标识符 |
| `options` | `value.data.config` | 配置项 |
| `children` | `value.children` | 子组件列表（仅GROUP/LAYOUT_BLOCK） |
| `isDevelop` | 硬编码 `false` | 是否开发模式 |
| `currentGroupSliderActive` | `depth === 1` | 分组滑块激活状态 |

### 第二阶段：generator → ItemField

```typescript
<ItemField
    field={Field}           // 物料组件类
    defaultProps={props}    // 空对象或默认属性
    compProps={fieldProps}  // 组件配置
/>
```

### 第三阶段：ItemField → Field（物料组件）

**mergedProps 结构**：

```typescript
const mergedProps = {
    ...fullProps,              // { ...defaultProps, ...compProps }
    ...(fullProps.value || {}), // value 的子属性展开到顶层（如 style, config, dataConfig 等）
    ...fetchResult,            // { dataSource, extraResponse }
};
```

**最终传递给物料的 props**：

```typescript
<Field
    {..._.omit(mergedProps, ['interactions', 'drillDownLevel', 'children', 'options', 'value', 'onChange'])}
    receivedPropsParams={receivedPropsParams}
    designer={envShare.designer}
    interaction={interactionApi}
    interactionProps={interactionProps}
    onBeforeRender={onBeforeRender}
/>
```

> **关键说明**：
> - `fullProps.value` 的子属性（如 `style`、`config`、`dataConfig` 等）会被展开到 `mergedProps` 顶层
> - 独立的 `value` 属性会被 `_.omit` 排除，不会传递给物料

### 第四阶段：RemoteComponent → 物料组件

在 `createField` 中，通过 `RemoteComponent` 加载远程组件：

```javascript
<RemoteComponent
    url={remoteAssets.url || ''}
    cssUrls={remoteAssets.cssUrls}
    container={document.body}
    loader={<DataStatus status={DataStatus.STATUS.LOADING} />}
    {...restProps}  // 这里传递所有 props，包含上述所有内容
    render={(renderProps) => {
        if (renderProps.err) {
            // 错误处理
        }
        taskManager.add(onBeforeRender);
        return <renderProps.Component {...restProps} />;  // 最终渲染
    }}
/>
```

---

## 四、Props详细类型声明

### 1. receivedPropsParams

```typescript
interface ReceivedPropsParams {
    $sysdate?: string;              // 系统当前日期
    $accesstoken?: string;          // 访问令牌
    $sceneIdStr?: string;           // 场景定制ID
    currentLoginInfo?: any;         // 当前登录信息
    [key: string]: any;             // 自定义URL参数
}
```

### 2. designer

```typescript
interface Designer {
    env: any;                        // 环境变量
    constants: Record<string, any>;  // 常量配置
    mode: 'development' | 'preview'; // 运行模式
    container: HTMLElement;          // 设计器容器
    prefix: {
        dynamicEventPrefix: string;   // 动态事件前缀
    };
    permissions: {                   // 权限信息
        zoneName?: any;
        zoneLevel?: any;
        zoneId?: any;
        parentZoneId?: any;
        userId?: any;
        currentLoginInfo?: any;
    };
    systemInfo: any;                 // 系统信息
    cache: IFieldCache;              // 缓存对象
    fieldName: {
        DRILL_DOWN: string;          // 下钻字段名
    };
    utils: {                         // 工具方法
        logger: any;
        getDesignerOriginData: (data: any) => any;
        eachRequestParams: (params: any, callback: any) => void;
        parseSubscribeParams: (value: string) => {
            subscribeKey: string | null;
            isSubscribeKey: boolean;
        };
        remoteModuleFetcher: (opts: { url: string; exportsFields?: string[]; importFields: string[] }) => Promise<any>;
        navigateTo: (to: string, opts?: { type?: 'push' | 'replace'; state?: any }) => void;
        history: History;
    };
    api: {                           // API接口
        customDataSourceApi: (type: 'api' | 'dataSet', params: any) => Promise<any>;
        request: (...args: any[]) => Promise<any>;
        buildCustomApiParams: (params: any, paramsMapping: any, callback?: any) => {
            params: any;
            hasInvalidateParams: boolean;
        };
    };
}
```

### 3. interaction

```typescript
interface Interaction {
    dispatch: (args: {
        type?: string;
        data: Array<{ fieldName: string; state: any }>;
    }) => void;
    dispatchRealtimeDataFlow: (list: any[]) => void;
    subscribe: InteractionEvent[] | null;
    defined: Record<string, any>;
    action: Map<string, any>;
}

interface InteractionEvent {
    fieldName: string | number | null;
    uniqueId: string | number | null;
    state: any;
    time: number;
    specVersion?: string | null;
    type?: string | null;
    dataContentType?: string;
    dataSchema?: any;
    data?: any;
}
```

### 4. interactionProps

```typescript
interface InteractionProps {
    [key: string]: any;                              // 订阅的交互数据
    customDataSourceApiParams?: Record<string, any>; // 自定义接口动态参数
}
```

### 5. fetchResult

```typescript
interface FetchResult {
    dataSource: any[];      // 数据源数组
    extraResponse?: any;    // 额外响应数据
}

enum DataStatus {
    SUCCESS = 'success',
    LOADING = 'loading',
    ERROR = 'error',
}

enum DataSourceEnum {
    Json = 'json',
    Api = 'api',
    BusinessIndicator = 'businessIndicator',
    Dataset = 'dataSet',
    IframeSource = 'iframeSource',
}
```

---

## 五、被排除的Props

```typescript
_.omit(mergedProps, [
    'interactions',    // 交互配置，由插件处理（其能力通过 interaction 对象提供）
    'drillDownLevel',  // 下钻层级
    'children',        // 子组件由编辑器管理
    'options',         // 选项配置由编辑器管理
    'value',           // value 的子属性被展开到顶层，但独立的 value 对象被排除
    'onChange'         // 由编辑器处理
])
```

---

## 六、完整Props传递流程图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  widgets[]                                                                  │
│       │                                                                      │
│       ▼                                                                      │
│  GeneratorWidget                                                             │
│       │                                                                      │
│       ▼                                                                      │
│  GeneratorField                                                              │
│       │                                                                      │
│       │  { type, value, uniqueId, options, children, isDevelop, ... }        │
│       ▼                                                                      │
│  generator()                                                                │
│       │                                                                      │
│       │  { fieldCanRedefine, Field, props }                                  │
│       ▼                                                                      │
│  ItemField                                                                  │
│       │                                                                      │
│       │  注入: designer, interaction, interactionProps, receivedPropsParams  │
│       │  合并: fullProps + (fullProps.value 展开) + fetchResult             │
│       │  排除: interactions, drillDownLevel, children, options, value, onChange│
│       ▼                                                                      │
│  RemoteComponent (createField)                                              │
│       │                                                                      │
│       │  {...restProps}                                                     │
│       ▼                                                                      │
│  renderProps.Component (物料组件)                                            │
│       │                                                                      │
│       │  最终props = fullProps子属性 + fetchResult + designer + interaction  │
│       │               + interactionProps + receivedPropsParams + onBeforeRender│
│       ▼                                                                      │
│  物料渲染完成                                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、相关源文件路径

| 文件 | 说明 |
|------|------|
| `src/designer/renderer/GeneratorWidget.js` | 组件列表渲染入口 |
| `src/designer/renderer/generator.tsx` | 组件生成器 |
| `src/designer/renderer/components/item-field/index.tsx` | ItemField包装器 |
| `src/designer/materials/index.js` | **物料消费核心** |
| `src/plugins/interaction/component/hooks.ts` | 交互插件 |
| `src/plugins/data-fetcher/DataFetcher.ts` | 数据获取插件 |
| `packages/types/DesignerField.d.ts` | 类型定义 |
