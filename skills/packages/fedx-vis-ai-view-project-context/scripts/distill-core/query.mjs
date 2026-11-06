// query.mjs —— 人读查询视图（stdout，不落地）
// 用法：node query.mjs <pending|similar|duplicates|status|tiers>
//   pending     未蒸馏的 B/C 档（待做清单）
//   similar     相似聚类（similarTo 非空的组）
//   duplicates  跨项目 normalized_hash 相同的模块（代码一致候选）
//   status      全量状态统计
//   tiers       各档分布
import { openDb, closeDb, materialNameOf, fail, assertRepoRoot } from './lib.mjs';

function main() {
  assertRepoRoot();
  const cmd = process.argv[2] || 'status';
  const db = openDb();
  try {
    const q = (sql, ...args) => db.prepare(sql).all(...args);
    if (cmd === 'pending') {
      const rows = q(`SELECT s.id, s.project, s.center, s.module, s.tier, s.tier_reason, COALESCE(st.status,'(无)') AS status
        FROM module_survey s LEFT JOIN distill_status st ON st.module_survey_id = s.id
        WHERE s.tier IN ('B','C') ORDER BY s.tier, s.project, s.center, s.module`);
      console.log(`[pending] B/C 档共 ${rows.length} 项：`);
      for (const r of rows) {
        const mark = r.status === 'not-started' ? '' : `（${r.status}）`;
        console.log(`  [${r.tier}] ${r.project}/${r.center || '-'}/${r.module} ${mark}`);
        if (r.tier_reason) console.log(`        ${r.tier_reason}`);
      }
    } else if (cmd === 'similar') {
      const rows = q(`SELECT project, center, module, tier, similar_to FROM module_survey WHERE similar_to IS NOT NULL AND similar_to != '[]'`);
      console.log(`[similar] 相似聚类 ${rows.length} 项：`);
      for (const r of rows) {
        const sim = JSON.parse(r.similar_to).map(s => `${s.center}/${s.module}@${s.similarity}`).join(', ');
        console.log(`  ${r.project}/${r.center || '-'}/${r.module}（${r.tier}）→ ${sim}`);
      }
    } else if (cmd === 'duplicates') {
      const rows = q(`SELECT normalized_hash, COUNT(*) AS n, GROUP_CONCAT(project || '/' || COALESCE(center,'-') || '/' || module, ' | ') AS mods
        FROM module_survey WHERE normalized_hash IS NOT NULL
        GROUP BY normalized_hash HAVING n > 1 ORDER BY n DESC`);
      if (!rows.length) console.log('[duplicates] 无跨模块/跨项目完全一致（hash 相同）的模块');
      for (const r of rows) {
        console.log(`  hash=${r.normalized_hash.slice(0, 8)}… ×${r.n}：${r.mods}`);
      }
    } else if (cmd === 'status') {
      const rows = q(`SELECT COALESCE(st.status,'(未初始化)') AS status, COUNT(*) AS n
        FROM module_survey s LEFT JOIN distill_status st ON st.module_survey_id = s.id
        GROUP BY status ORDER BY n DESC`);
      const total = rows.reduce((s, r) => s + r.n, 0);
      console.log(`[status] 共 ${total} 项：`);
      for (const r of rows) console.log(`  ${r.status}: ${r.n}`);
    } else if (cmd === 'tiers') {
      const rows = q(`SELECT tier, COUNT(*) AS n FROM module_survey GROUP BY tier ORDER BY tier`);
      console.log('[tiers] 档位分布：');
      for (const r of rows) console.log(`  ${r.tier || '(null)'}: ${r.n}`);
    } else {
      console.error('[query] 未知子命令：' + cmd + '（可用：pending | similar | duplicates | status | tiers）');
      process.exit(1);
    }
  } finally {
    closeDb(db);
  }
}

try { main(); } catch (err) { fail('[query]', err); }
