# Trae Rule：Node.js 脚本优先

> **作用范围**：所有 AI 操作（特别是 docs 文档化相关批处理 / 跨文件 / 验证类任务）。
> **沉淀位置**：Trae rules（项目内 `.trae/rules/`）。
> **与 roadmap 的关系**：本文件对应 roadmap §2 决策表 D-13。
> **触发场景**：AI 准备执行「批处理 / 跨文件 / 需要错误处理 / 需要日志 / 可重复执行」的任务时，**优先使用 Node.js 脚本**，而非一次性 AI 内联命令或手动复制粘贴。

---

## 1. 规则

完成 docs 文档化相关工作时，**优先使用 Node.js 脚本**：

- ✅ 可重复执行的批处理任务（如：拷贝模板 → 重命名 → 替换占位符、批量生成模块骨架、验证 docs/ 完整性）
- ✅ 跨文件 / 跨目录的操作（如：扫描 `src/` 输出 code-inventory.md、整合 4 个 data-model-extensions.md）
- ✅ 需要错误处理 / 日志 / 进度显示的任务
- ❌ 禁止：一次性 AI 内联命令完成上述任务（除非调试 / 验证场景）

---

## 2. 脚本存放位置

所有脚本统一存放：

```
.trae/skills/oss-vis-gd-project-context/scripts/
```

> 2026-10-08 起（D-E2）：`.trae/documents/` 已整体迁入 skill，脚本存放位置随之变更；历史脚本已随迁移保留在上述目录。

**禁止**放在其他位置（如 `src/`、`docs/`、`scripts/`、`tools/`）。

---

## 3. 命名约定

- **推荐**：`<action>-<target>.js`
  - 例：`copy-template.js`、`generate-spec-skeleton.js`、`verify-docs-isolation.js`、`scan-code-inventory.js`
- **一次性脚本**：`YYYY-MM-DD-<purpose>.js`
  - 例：`2026-07-29-bootstrap-docs.js`
- **示例 / 模板**：`example-<purpose>.js`
  - 例：`example-template-skeleton.js`

> 所有脚本均为 `.js`（CommonJS，无需 ESM 配置；本项目无独立 Node 运行时）

---

## 4. 脚本基本要求

1. **可重复执行**：幂等设计；二次执行不报错
2. **CLI 友好**：通过 `node <script>.js [args]` 调用；参数清晰
3. **进度输出**：用 `console.log` 输出关键步骤与进度
4. **错误处理**：try/catch + 显式退出码（`process.exit(1)`）
5. **无副作用文件外写**：默认不修改业务代码（`src/`、`public/`、`package.json`）
6. **依赖**：仅用 Node.js 内置 API（`fs` / `path` / `child_process` 等）；不引入第三方 npm 包
7. **路径处理**：统一用 `path.resolve(__dirname, ...)` 避免相对路径歧义

---

## 5. 脚本示例（最小骨架）

```javascript
#!/usr/bin/env node
/**
 * scripts/example-action.js
 * 作用：示例 Node.js 脚本
 * 用法：node scripts/example-action.js [target-dir]
 */
const fs = require('fs');
const path = require('path');

function main() {
    const targetDir = process.argv[2] || path.resolve(__dirname, '../../docs');
    console.log(`[example-action] 目标目录：${targetDir}`);

    if (!fs.existsSync(targetDir)) {
        console.error(`[example-action] 错误：目录不存在：${targetDir}`);
        process.exit(1);
    }

    // ... 业务逻辑 ...

    console.log('[example-action] ✅ 完成');
}

try {
    main();
} catch (err) {
    console.error('[example-action] ❌ 异常：', err.message);
    process.exit(1);
}
```

---

## 6. 验证清单

- [ ] 涉及批处理 / 跨文件操作时，已在 `.trae/skills/oss-vis-gd-project-context/scripts/` 创建脚本
- [ ] 脚本命名符合 `<action>-<target>.js` 或日期约定
- [ ] 脚本无第三方依赖（仅用 Node.js 内置）
- [ ] 脚本可重复执行（幂等）
- [ ] 脚本有进度输出与错误处理
- [ ] 脚本用 `process.exit(1)` 显式退出码
- [ ] 脚本统一 `path.resolve(__dirname, ...)`

---

## 7. 修订记录

| 日期       | 修订内容 | 出处 |
| ---------- | -------- | ---- |
| 2026-07-29 | 初版：从 docs-authoring-rules.md 拆出为独立 rule 文件 | user 反馈 2026-07-29 + roadmap D-13 |