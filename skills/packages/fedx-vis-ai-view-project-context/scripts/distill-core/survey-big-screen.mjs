// survey-big-screen.mjs —— 工作流 1 · 批量评价入口（源 2：oss-mtc-transition-ln 大屏，task-035）
// 核心逻辑在 survey-core.mjs；本文件只定义源 2 的采集口径（Q2 映射，2026-11-06 拍板）：
//   1) pages/visual/big-screen 四大屏：大屏名=center；叶子目录=module；嵌套真子模块（自带 index.tsx，
//      如 beijing-summary/overview-indicator）记 section；名为 components 的子目录视为内部子组件（整体一个 module）
//   2) big-screen/components（background/header/fullscreen-button 基建层）：center=big-screen-components
//   3) components/large-screen 16 组件：center=large-screen-components，每目录一个 module（overlay 等子目录视为内部实现）
//   各大屏 store.ts 计入模块画像但不单独立行（Q4：请求层剥离、Props 化）
// 用法（物料站仓库根运行）：node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/survey-big-screen.mjs [源项目根]
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, assertRepoRoot } from './lib.mjs';
import { runSurvey } from './survey-core.mjs';

const PROJECT = 'oss-mtc-transition-ln-big-screen';
const SRC_ROOT = path.resolve(process.argv[2] || path.join(REPO_ROOT, '..', 'oss-mtc-transition-ln'));
const SCREENS = ['personnel', 'petition', 'beijing-petition', 'petition-comparison'];
const SHELVED = new Set(); // 源 2 初始为空（F1 约定），定档时人工补充

assertRepoRoot();
if (!fs.existsSync(SRC_ROOT)) {
  console.error(`[survey] 错误：源项目不存在：${SRC_ROOT}`);
  process.exit(1);
}

const CODE_FILE = /\.(tsx?|jsx?)$/;
const SKIP_DIRS = new Set(['assets', 'images', 'node_modules']);
const hasDirectCode = (dir) => fs.readdirSync(dir).some((n) => CODE_FILE.test(n));
const hasCodeDeep = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isFile() && CODE_FILE.test(name)) return true;
    if (st.isDirectory() && hasCodeDeep(p)) return true;
  }
  return false;
};

// 页面树采集：真子模块（自带 index.tsx 且非 components/assets 命名）→ 父目录记 section，递归下钻；
// 其余（叶子目录 / 只含内部 components 子目录）→ 整目录一个 module（store.ts 等一并计入画像）
const entries = [];
function walkScreen(dir, center, section) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name) || name === 'shared') continue;
    const child = path.join(dir, name);
    if (!fs.statSync(child).isDirectory() || !hasCodeDeep(child)) continue;
    const subDirs = fs.readdirSync(child)
      .filter((n) => !SKIP_DIRS.has(n) && n !== 'components')
      .map((n) => path.join(child, n))
      .filter((p) => fs.statSync(p).isDirectory() && hasDirectCode(p)); // 自带 index 的真子模块
    if (subDirs.length) {
      // 嵌套中间层：目录本体记 section（其顶层 index.tsx 为编排层，不单独成 module）
      walkScreen(child, center, section ? `${section}/${name}` : name);
    } else {
      entries.push({ center, section, module: name, path: child });
    }
  }
}

const bigScreenRoot = path.join(SRC_ROOT, 'frontend/src/pages/visual/big-screen');
for (const s of SCREENS) walkScreen(path.join(bigScreenRoot, s), s, null);

// 大屏页面共享基建层：background / header / fullscreen-button
for (const name of fs.readdirSync(path.join(bigScreenRoot, 'components')).sort()) {
  const p = path.join(bigScreenRoot, 'components', name);
  if (fs.statSync(p).isDirectory() && hasCodeDeep(p)) entries.push({ center: 'big-screen-components', section: null, module: name, path: p });
}

// 跨大屏共享组件层：16 目录，每目录一个 module（子目录一律内部实现）
for (const name of fs.readdirSync(path.join(SRC_ROOT, 'frontend/src/components/large-screen')).sort()) {
  const p = path.join(SRC_ROOT, 'frontend/src/components/large-screen', name);
  if (fs.statSync(p).isDirectory() && hasCodeDeep(p)) entries.push({ center: 'large-screen-components', section: null, module: name, path: p });
}

runSurvey({ project: PROJECT, srcRoot: SRC_ROOT, entries, shelved: SHELVED });
