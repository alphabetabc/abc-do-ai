# tab-list Schema 配置

## 1. 概述

tab-list 的 schema 配置分为三个面板：
1. **配置**（config）：包含通用样式、元素样式、选中样式、点击事件
2. **数据**（dataConfig）：数据源配置
3. **交互**（interaction）：订阅与派发配置

## 2. Schema 结构

```typescript
export const schema = {
    materials: 'tab-list',
    fields: [
        {
            name: '配置',
            key: 'config',
            schema: {
                type: 'object',
                properties: {
                    config: {
                        type: 'object',
                        properties: {
                            ...getCompTitle(material, dataModel),
                            ...BASE_LAYOUT,
                            $collapse: {
                                type: 'void',
                                'x-component': 'FormCollapse',
                                properties: {
                                    commonStyle: { /* 通用配置 */ },
                                    baseStyle: { /* 元素设置 */ },
                                    activeStyle: { /* 选中设置 */ },
                                    clickEventConfig: { /* 点击事件 */ }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            name: '数据',
            key: 'dataConfig',
            schema: { /* DynamicData 组件 */ }
        },
        defineInteractionSchema({
            subscribe: { /* 订阅配置 */ },
            action: { /* 派发配置 */ }
        })
    ]
};
```

## 3. 配置面板详解

### 3.1 通用配置（commonStyle）

| 字段 | x-component | 说明 |
|------|-------------|------|
| `defaultCheck` | Input | 默认选中的 Tab ID |
| `isRadioDisplay` | Switch | 是否显示 Radio 前缀圆点 |
| `groupLayout` | FormCollapse.CollapsePanel | 组合布局（flexDirection、justifyContent、alignItems） |
| `carousel` | CustomCollapse | 轮播配置（show、period、isAutoPlayControler） |

**轮播配置**：
- `show`：轮播开关（Switch，隐藏字段）
- `period`：轮播周期（NumberPicker，单位秒）
- `isAutoPlayControler`：轮播控制开关（Switch），开启后鼠标悬停显示播放/暂停按钮

### 3.2 元素样式（baseStyle）与选中样式（activeStyle）

两者共享相同的 `commonStyle` 配置对象，包含：

| 配置组 | 字段 | x-component | 说明 |
|--------|------|-------------|------|
| 元素尺寸 | `width`、`height` | NumberPicker | 元素宽高 |
| 元素边距 | `marginTop/Right/Bottom/Left` | NumberPicker | 元素外边距 |
| 元素文本 | `textStyle` | VisualTextStyle | 文本样式（disableLineHeight: true） |
| 元素行高 | `lineHeight` | NumberPicker | 行高 |
| 元素边框 | `borderStyle`、`borderWidth`、`borderColor`、`borderRadius` | Select、NumberPicker、ColorPicker | 边框配置 |
| 元素背景 | `backgroundType` | Radio.Group | 背景类型（image/color） |
| 背景颜色 | `backgroundColor` | ColorPicker | 当 backgroundType='color' 时显示 |
| 背景图片 | `backgroundImg` | Background | 当 backgroundType='image' 时显示 |
| 背景重复 | `backgroundRepeat` | Select | 背景重复方式（full/no-repeat/repeat-x/repeat-y/repeat） |
| 元素前缀 | `prefix` | CustomCollapse | 前缀图标配置 |

**前缀配置（prefix）**：
- `show`：前缀开关（Switch，隐藏字段）
- `prefixType`：前缀类型（Radio.Group，icon/image）
- `prefixMargin`：前缀边距（Space + NumberPicker）
- `width`：图片前缀尺寸（NumberPicker，仅 image 类型显示）
- `fontSize`：Icon 前缀尺寸（NumberPicker，仅 icon 类型显示）
- `color`：Icon 前缀颜色（ColorPicker，仅 icon 类型显示）
- `prefixImg`：前缀图片（Background，仅 image 类型显示）

### 3.3 点击事件（clickEventConfig）

| 字段 | x-component | 说明 |
|------|-------------|------|
| `clickParams` | Input | 点击派发的全量参数值 |

## 4. 交互配置

### 4.1 订阅（subscribe）

| 字段 | x-component | 说明 |
|------|-------------|------|
| `visible` | Input | 组件显示控制（接收参数值 == 1 时不显示） |
| `stopCarouselParam` | Input | 组件停止轮播（接收到参数值时停止） |
| `startCarouselParam` | Input | 组件启动轮播（接收到参数值时启动） |

### 4.2 派发（action）

**元素选中事件**（$onClickAction）：

| 字段 | 说明 |
|------|------|
| `onClick` | 元素:param |
| `onClickId` | 元素:id |
| `onClickName` | 元素:name |
| `clickParams` | 元素全量值（等同于一条数据源） |
| `onClickParams1` ~ `onClickParams9` | 元素:params1 ~ params9 |

## 5. 联动逻辑

### 5.1 背景类型联动

```typescript
backgroundColor: {
    'x-reactions': {
        dependencies: ['.backgroundType'],
        when: "{{ $deps[0] === 'color' }}",
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } }
    }
}
```

### 5.2 前缀类型联动

```typescript
width: {
    'x-reactions': {
        dependencies: ['.prefixType'],
        when: "{{ $deps[0] === 'image' }}",
        fulfill: { state: { visible: true } },
        otherwise: { state: { visible: false } }
    }
}
```

## 6. 默认值（defaultValue）

```typescript
export const defaultValue = {
    dataConfig: {
        dataType: 'json',
        json: [
            { id: '1', content: '数字乡村', icon: 'visual-manager-logo-shuzixiangcun' },
            { id: '2', content: '工信部', icon: 'visual-manager-gongxinbu' },
            { id: '3', content: '交通枢纽', icon: 'visual-manager-jiaotongshuniu' }
        ],
        isRefresh: false,
        refreshTime: 5 * 60
    },
    config: {
        title: 'TAB列表',
        width: 1800,
        height: 210,
        commonStyle: {
            groupLayout: {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-start'
            },
            carousel: {
                show: true,
                period: 5,
                isAutoPlayControler: false
            },
            defaultCheck: '1',
            isRadioDisplay: false
        },
        baseStyle: { /* 元素样式 */ },
        activeStyle: { /* 选中样式 */ }
    }
};
```

## 7. 跨文档引用

- **组件逻辑**：`config.commonStyle.carousel` 控制轮播行为 → 参见 [component-logic.md](./component-logic.md#21-轮播逻辑)
- **数据格式**：`dataConfig.json` 默认数据结构 → 参见 [data-model.md](./data-model.md#2-数据结构)
- **交互派发**：`onClick` 等字段映射 → 参见 [component-logic.md](./component-logic.md#23-交互派发)
