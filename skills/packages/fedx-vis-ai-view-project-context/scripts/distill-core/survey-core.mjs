// survey-core.mjs —— 工作流 1 · 批量评价核心（035 抽取，分析能力仍统一来自 profile-core）
// 职责：画像组装 → 相似度聚类 → 四档预归类 → UPSERT 入库 → stdout 人读视图
// 入口薄壳（survey.mjs / survey-big-screen.mjs）只负责：PROJECT / 源根 / 目录采集（center-section-module 映射）/ SHELVED
// 不落任何文件；db 是唯一状态事实源
import fs from 'node:fs';
import path from 'node:path';
import { profileModule, similarity, normalizedTokens } from './profile-core.mjs';
import { openDb, closeDb, today, listMaterials } from './lib.mjs';

/**
 * @param {object} opts
 * @param {string} opts.project  源项目标识（db project 维度，入口传入，不再硬编码）
 * @param {string} opts.srcRoot  源项目根（绝对路径；须已校验存在）
 * @param {Array<{center: string, section: string|null, module: string, path: string}>} opts.entries
 * @param {Set<string>} opts.shelved 手工定稿的搁置项（归类时视同已处置）
 */
export function runSurvey({ project, srcRoot, entries, shelved = new Set() }) {
  process.env.DISTILL_SRC_ROOT = srcRoot; // 供 profile-core 加载源项目 TS（lib API 完整）
  console.log(`[survey] 源项目：${srcRoot}（project=${project}）`);

  // ── 采集全量画像 ──────────────────────────────────────────────
  const profiles = [];
  for (const e of entries) {
    const p = profileModule(e.path, e.module);
    if (!p) continue;
    p.center = e.center;
    p.section = e.section;
    profiles.push(p);
    console.log(`  + ${e.center}${e.section ? '/' + e.section : ''}/${e.module}（${p.files.length} 文件）`);
  }
  console.log(`[survey] 共 ${profiles.length} 模块`);

  // ── 相似度聚类（两两，n 小可接受）──────────────────────────────
  for (const p of profiles) p._tokens = normalizedTokens(p.files.map((f) => ({ ...f, code: fs.readFileSync(path.join(p.source, f.path), 'utf8') })));
  for (let i = 0; i < profiles.length; i++) {
    profiles[i].similarTo = [];
    for (let j = 0; j < profiles.length; j++) {
      if (i === j) continue;
      const sim = similarity(profiles[i].normalizedHash, profiles[j].normalizedHash, profiles[i]._tokens, profiles[j]._tokens);
      if (sim >= 0.5) profiles[i].similarTo.push({ module: profiles[j].module, center: profiles[j].center, similarity: +sim.toFixed(2) });
    }
    profiles[i].similarTo.sort((a, b) => b.similarity - a.similarity);
    profiles[i].similarTo = profiles[i].similarTo.slice(0, 3);
  }

  // ── 四档预归类（规则与历史版本一致，只搬迁不调整）──────────────
  const KNOWN = new Set([...listMaterials(), ...shelved]);

  for (const p of profiles) {
    let tier, confidence, reason;
    const uiMaterialImports = p.deps.internal.filter((d) => d.kind === 'ui-material');
    const relSpecs = (p.deps.relative || []).map((d) => d.spec);
    const hasBox = relSpecs.some((s) => /(^|\/)box$/.test(s.replace(/^\.\.\//, '').replace(/^\.\//, ''))) || (p.deps.internal || []).some((d) => /share\/box$/.test(d.spec));
    const hasDetailModal = (p.deps.internal || []).some((d) => d.spec.includes('detail-modal')) || relSpecs.some((s) => s.includes('detail-modal'));
    const codeRelCount = relSpecs.filter((s) => !/\.less$/.test(s) && !/(^|\/)box$/.test(s.replace(/^\.{2}\//, '').replace(/^\.\//, ''))).length;
    const npmOnlyReact = (p.deps.npm || []).every((d) => d === 'react' || d === 'classnames');
    const isTrivial = npmOnlyReact && !hasDetailModal && codeRelCount <= 1;
    if (p.heavyDeps.length) {
      tier = 'D'; confidence = 1.0; reason = `重依赖：${p.heavyDeps.join('、')}`;
    } else if (KNOWN.has(p.module)) {
      tier = 'A'; confidence = 0.9; reason = '与已蒸馏物料同名（覆盖/已定稿处置）';
    } else if (uiMaterialImports.length >= 2) {
      tier = 'A'; confidence = 0.8; reason = `组合形态：import ${uiMaterialImports.length} 个已蒸馏 ui 物料（${[...new Set(uiMaterialImports.map((d) => d.spec.split('/').pop()))].slice(0, 4).join('、')}${uiMaterialImports.length > 4 ? '…' : ''}）`;
    } else if (hasBox && hasDetailModal) {
      tier = 'A'; confidence = 0.7; reason = '组合形态：Box(≈panel) + detail-modal 组合模式（016 定稿 A 档共性）';
    } else {
      const top = p.similarTo[0];
      const codeFileCount = p.files.filter((f) => /\.(tsx?|jsx?)$/.test(f.rel || f.path)).length;
      const GENERIC_NAMES = new Set(['components']);
      const sameNameElsewhere = GENERIC_NAMES.has(p.module) ? [] : profiles.filter((q) => q !== p && q.module === p.module && q.center !== p.center);
      if (top && top.similarity >= 0.8 && codeFileCount >= 2) {
        tier = 'C'; confidence = 0.7; reason = `与 ${top.center}/${top.module} 相似度 ${top.similarity}，合并候选`;
      } else if (top && top.similarity >= 0.8) {
        tier = 'A'; confidence = 0.6; reason = `与 ${top.center}/${top.module} 极小同构（相似度 ${top.similarity}、${codeFileCount} 代码文件），补 examples 即可`;
      } else if (sameNameElsewhere.length) {
        tier = 'C'; confidence = 0.8; reason = `跨中心同名多版本（${sameNameElsewhere.map((q) => q.center).join('、')}），合并候选`;
      } else if (isTrivial || relSpecs.some((s) => /(^|\/)fields$/.test(s))) {
        tier = 'D'; confidence = 0.6; reason = '纯 react + 无可复用子组件 / Placeholder（疑似静态/低价值，建议精读确认）';
      } else {
        tier = 'B'; confidence = 0.5; reason = '独立结构（低置信，建议精读）';
      }
    }
    p.tier = tier; p.confidence = confidence; p.tierReason = reason;
  }

  // ── 入库（UPSERT；新行初始化 distill_status，人工决策态不受影响）──
  const db = openDb();
  try {
    const upsert = db.prepare(`INSERT INTO module_survey
      (project, center, section, module, source_path, files, size_kb, normalized_hash, tier, tier_reason, confidence, similar_to, exports_json, detail_json, surveyed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project, center, section, module) DO UPDATE SET
        source_path=excluded.source_path, files=excluded.files, size_kb=excluded.size_kb,
        normalized_hash=excluded.normalized_hash, tier=excluded.tier, tier_reason=excluded.tier_reason,
        confidence=excluded.confidence, similar_to=excluded.similar_to, exports_json=excluded.exports_json,
        detail_json=excluded.detail_json, surveyed_at=excluded.surveyed_at`);
    const initStatus = db.prepare(`INSERT OR IGNORE INTO distill_status (module_survey_id, status, decided_by, decided_at)
      SELECT id, 'not-started', 'auto', ? FROM module_survey WHERE project=? AND center IS ? AND section IS ? AND module=?`);
    db.exec('BEGIN');
    for (const p of profiles) {
      const { _tokens, files, deps, heavyDeps, inlineSuggestions, stripSuggestions, assets, hooks, exports, normalizedHash, ...rest } = p;
      upsert.run(
        project, p.center, p.section, p.module, p.source, files.length, +(p.totalSize / 1024).toFixed(1),
        normalizedHash, p.tier, p.tierReason, p.confidence, JSON.stringify(p.similarTo),
        JSON.stringify(exports || []),
        JSON.stringify({ fileList: files.map((f) => ({ path: f.rel ?? f.path, size: f.size })), deps, heavyDeps, inlineSuggestions, stripSuggestions, assets, hooks }),
        today(),
      );
      initStatus.run(today(), project, p.center, p.section, p.module);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    closeDb(db);
  }

  // ── stdout 人读视图 ──────────────────────────────────────────
  const L = [`# 蒸馏评价 · ${path.basename(srcRoot)}（${today()}）`, '', `共 ${profiles.length} 模块。`, '', '## 四档预归类', '', '| 模块 | 中心/section | 档 | 置信度 | 理由 | 文件 |', '| --- | --- | --- | --- | --- | --- |'];
  for (const p of profiles) L.push(`| ${p.module} | ${p.center}/${p.section ?? '-'} | ${p.tier} | ${p.confidence} | ${p.tierReason} | ${p.files.length} |`);
  L.push('', '## 相似聚类（≥0.5）', '');
  for (const p of profiles) {
    if (p.similarTo.length) L.push(`- **${p.center}/${p.module}**：${p.similarTo.map((s) => `${s.center}/${s.module}(${s.similarity})`).join('、')}`);
  }
  console.log('\n' + L.join('\n'));
  const byTier = {};
  for (const p of profiles) byTier[p.tier] = (byTier[p.tier] || 0) + 1;
  console.log(`\n[survey] ✅ 已入库（UPSERT ${profiles.length} 行，project=${project}），档位分布：`, byTier);
}
