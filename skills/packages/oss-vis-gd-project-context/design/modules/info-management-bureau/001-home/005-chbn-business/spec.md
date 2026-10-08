# 005-chbn-business · chbn业务（spec）

> 源码：`web/pages/info-management-bureau/sub-pages/home/modules/chbn-business/`。注册名「chbn业务」，布局 66/181。

## 组件构成

- `PanelLeft`（360×782）内四个子组件 + 辅助 `IndBox`：

| 子组件 | 内容 |
| --- | --- |
| `PersonalBusiness` | 个人业务：top 总量 + parts 环图 |
| `FamilyBusiness` | 家庭业务 |
| `GEBusinessTop4` | 政企 Top4 |
| `NewBusinessTop5` | 新业务 Top5 |

## 维护准则

- 指标模板（label/单位/颜色）可经 `homeConfig.*` 环境配置覆盖，改文案优先走配置
