// survey.mjs —— 工作流 1 · 批量评价入口（源 1：oss-visual-gd-emergency-support 薄壳，035 抽取后）
// 采集→画像→相似度→四档归类→入库 的核心逻辑在 survey-core.mjs；本文件只定义源 1 的采集口径
// 用法（物料站仓库根运行）：node .trae/fedx-vis-ai-view-project-context/scripts/distill-core/survey.mjs [源项目根]
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, assertRepoRoot } from './lib.mjs';
import { runSurvey } from './survey-core.mjs';

const PROJECT = 'oss-visual-gd-emergency-support';
const SRC_ROOT = path.resolve(process.argv[2] || path.join(REPO_ROOT, '..', 'oss-visual-gd-emergency-support'));
const PAGES = [
  'web/pages/five-major-center/cmd-dispatcher-center',
  'web/pages/five-major-center/comprehensive-display-center',
  'web/pages/five-major-center/information-hub-center',
  'web/pages/gd-emergency-support',
];
// 手工定稿的搁置项（不进 materials，但归类时视同已处置）
const SHELVED = new Set(['emap-gis', 'decoration', 'screen-title', 'titles', 'map-gis']);

assertRepoRoot();
if (!fs.existsSync(SRC_ROOT)) {
  console.error(`[survey] 错误：源项目不存在：${SRC_ROOT}`);
  process.exit(1);
}

// ── 源 1 采集：四层形态 <page>/modules/<section>/<module> ─────────
const entries = [];
for (const page of PAGES) {
  const modulesPath = path.join(SRC_ROOT, page, 'modules');
  if (!fs.existsSync(modulesPath)) continue;
  const center = path.basename(page);
  for (const section of fs.readdirSync(modulesPath)) {
    const sectionPath = path.join(modulesPath, section);
    if (!fs.statSync(sectionPath).isDirectory()) continue;
    for (const modName of fs.readdirSync(sectionPath)) {
      const modPath = path.join(sectionPath, modName);
      if (!fs.statSync(modPath).isDirectory()) continue;
      entries.push({ center, section, module: modName, path: modPath });
    }
  }
}

runSurvey({ project: PROJECT, srcRoot: SRC_ROOT, entries, shelved: SHELVED });
