# architecture.md

## 技术栈

- React 18 + Vite 8 + TypeScript
- 包管理：pnpm（packageManager: pnpm@12.16.1）
- 格式：.editorconfig（2 空格、LF、行宽 150）

## 仓库结构概要

```text
fedx-vis-ai-view/
├── src/                     # 站点（查看器），只读消费 docs/
│   ├── loader.ts            # 所有 import.meta.glob 集中于此
│   ├── App.tsx              # 检索索引页 + 模块详情页
│   └── main.tsx
├── docs/materials/
│   └── <模块名>/
│       ├── manifest.json    # 唯一索引来源（name / description / tags）
│       ├── spec.md / data-model.md
│       ├── code/            # 可运行组件源码（.tsx/.ts）
│       └── examples/        # 可运行示例 tsx，default export
├── docs/materials/_templates/  # 产物模板（spec / data-model / prompts）
├── scripts/export-skill.mjs    # skill 导出脚本
└── index.html
```

## 包边界

- `src/` 是站点实现，只读消费 `docs/`；`docs/` 是纯内容，禁止反向依赖站点代码
- 模块即目录：`docs/materials/<模块名>/` 是独立单元，模块间禁止相互 import
- `import.meta.glob` 只允许出现在 `src/loader.ts`

## 关键决策

- manifest 唯一索引：站点只 glob `materials/*/manifest.json` 做检索，eager 加载仅此层
- 按需加载：spec / data-model / code 原样懒加载，examples 经 `lazy()` 懒加载为组件
- 内容与站点分离：`docs/` 只允许纯数据（json/md）和自包含 tsx，保证物料可直接 import 运行
