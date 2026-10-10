# shenzhen-communication-guarantee · 深圳重要通信保障大屏业务模块

> 作用：`web/pages/shenzhen-communication-guarantee/`（深圳重要通信保障大屏）业务模块的文档目录。本 README 为目录级入口，只做分组索引；模块全貌见 [000-overview/README.md](./000-overview/README.md)。

## 目录索引

| 子目录 | 内容 |
| --- | --- |
| [000-overview/](./000-overview/README.md) | 模块总览：路由与页面入口、两屏结构与切换机制、共享组件层、数据与配置组织、接口清单 |
| [001-home/](./001-home/README.md) | 首屏视图：6 个 widget 子目录（编号 006 空缺；各含 spec.md + data-model.md） |
| [002-area/](./002-area/README.md) | 重保区域屏视图：4 个 widget 子目录（各含 spec.md + data-model.md） |

## 组织规则

- 入口为 `000-overview/`；各视图为编号目录（`NNN-<view>/`），视图内每个 widget 一个编号子目录（`NNN-<widget>/`），含 `spec.md`（组件构成与交互）+ `data-model.md`（接口与字段结构）
- 新增视图 / widget 时在本表、[000-overview/README.md](./000-overview/README.md) 与所属视图 README 的 widget 索引同步追加
