# Skill 产物目录结构说明

> 来源：`scripts/export-skill.mjs` 导出的 skill 产物（`dist-skill/large-screen-builder/`）。
> 命令：`node scripts/export-skill.mjs [outputDir]`（默认 `dist-skill/large-screen-builder`）

## 顶层结构

```text
dist-skill/
└── large-screen-builder/
    ├── SKILL.md               # Skill 入口（frontmatter：name/description）+ 模块索引 + 构建流程说明
    ├── workflows/             # 大屏组装工作流文档（docs/workflows/ 原样拷贝，2026-11-09 task-038 起）
    │   ├── big-screen-assembly.md        # 主工作流：步骤 0 环境依赖 → 1 屏清单 → 2 骨架 → 3 物料实例化 → 4 数据契约 → 5 联动编排 → 6 整屏验收
    │   └── screen-inventory-template.md  # 屏清单标准模板（步骤 1 产出物）
    └── specs/
        ├── <模块名>/          # 每个物料模块一个目录（manifest.json 不导出，其内容已汇入 SKILL.md）
        │   ├── spec.md        # 规格：用途、Props 表、交互行为
        │   ├── data-model.md  # 数据模型：接口、状态、请求契约
        │   ├── code/          # 可运行组件源码（.tsx）
        │   └── examples/      # 示例（.tsx，default export React 组件）
        └── ...
```

## SKILL.md 内容

| 段落 | 内容 |
| ---- | ---- |
| frontmatter | `name: large-screen-builder` + description（供 skill 平台发现） |
| 构建流程 | 指向 `workflows/big-screen-assembly.md` 标准工作流（步骤 0~6），辅以屏清单模板 / spec / data-model / 复用 code 的要点 |
| 模块索引 | 每模块一节：名称、key、描述、标签、路径 |
| 目录一览 | `specs/<模块名>/` 扁平列表 |

## 模块内容与 docs/materials 的关系

- **逐目录拷贝**：`docs/materials/<模块名>/` → `specs/<模块名>/`，内容不变
- **剔除 manifest.json**：仅站点检索用，其 name/description/tags 已汇总进 SKILL.md，产物中冗余
- **排除项**：`_templates/` 与无 `manifest.json` 的目录不导出
- **不导出**：站点代码（`src/`）、模板（`_templates/`）、源项目素材（`vis-git-source/`）

## 新增模块后的动作

1. 在 `docs/materials/<新模块>/` 放好四件套（manifest.json / spec.md / data-model.md / code/ + examples/）
2. 执行 `node scripts/export-skill.mjs` 重新导出（产物目录会整体重建）
3. SKILL.md 的模块索引与目录一览自动更新

## 工作流文档维护

- 源文件在 `docs/workflows/`（仓内演进、可 review），导出时**原样拷贝**到产物 `workflows/`
- 脚本不改写工作流内容——改工作流 = 改 `docs/workflows/` 源文件后重跑导出
- `docs/workflows/` 不存在时脚本跳过拷贝（产物无 workflows/，向后兼容）
