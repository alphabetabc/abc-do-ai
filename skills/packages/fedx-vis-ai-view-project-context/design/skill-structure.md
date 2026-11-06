# Skill 产物目录结构说明

> 来源：`scripts/export-skill.mjs` 导出的 skill 产物（`dist-skill/large-screen-builder/`）。
> 命令：`node scripts/export-skill.mjs [outputDir]`（默认 `dist-skill/large-screen-builder`）

## 顶层结构

```text
dist-skill/
└── large-screen-builder/
    ├── SKILL.md               # Skill 入口（frontmatter：name/description）+ 模块索引 + 构建流程说明
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
| 构建流程 | 五步：检索 → spec → data-model → 复用 code/examples → 组装页面 |
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
