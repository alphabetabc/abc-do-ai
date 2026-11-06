// sync-status.mjs —— 对账 docs/materials manifest，增量回填 distill_status
// 时机：每次蒸馏完成（硬门槛②）后；立项/规划前。幂等。
// 用法：node sync-status.mjs
import { openDb, closeDb, listMaterials, materialNameOf, today, fail, assertRepoRoot } from './lib.mjs';

function main() {
  assertRepoRoot();
  const materials = listMaterials();
  const db = openDb();
  try {
    const rows = db.prepare(
      'SELECT id, module, tier FROM module_survey WHERE project = (SELECT MIN(project) FROM module_survey) OR 1=1'
    ).all(); // 全项目对账
    const up = db.prepare(`
      INSERT INTO distill_status (module_survey_id, status, matched_material, decided_by, decided_at, reason)
      VALUES (?, ?, ?, ?, ?, NULL)
      ON CONFLICT(module_survey_id) DO UPDATE SET
        status=excluded.status, matched_material=excluded.matched_material,
        decided_by=excluded.decided_by, decided_at=excluded.decided_at
    `);
    const existing = new Map(
      db.prepare('SELECT module_survey_id, status, matched_material FROM distill_status').all()
        .map(r => [r.module_survey_id, r])
    );

    let distilled = 0, changed = 0;
    db.exec('BEGIN');
    for (const r of rows) {
      const target = materialNameOf(r.module);
      const hit = materials.has(target);
      const prev = existing.get(r.id);
      // 人工决策态（queued 已立卡 / enhanced 已增强 / shelved 搁置）不被自动对账覆盖
      if (prev && ['queued', 'enhanced', 'shelved'].includes(prev.status)) {
        if (hit) distilled++;
        continue;
      }
      const status = hit ? 'distilled' : 'not-started';
      if (!prev || prev.status !== status || prev.matched_material !== (hit ? target : null)) {
        up.run(r.id, status, hit ? target : null, 'sync', today());
        changed++;
      }
      if (hit) distilled++;
    }
    db.exec('COMMIT');

    const total = rows.length;
    console.log(`[sync-status] 共 ${total} 项：distilled ${distilled} / not-started ${total - distilled}，本次变更 ${changed} 行`);
    console.log('[sync-status] B/C 档待做：');
    for (const r of rows) {
      const target = materialNameOf(r.module);
      if (!materials.has(target) && (r.tier === 'B' || r.tier === 'C')) {
        const s = existing.get(r.id);
        if (s && ['queued', 'enhanced', 'shelved'].includes(s.status)) {
          console.log(`  [${r.tier}] ${r.module}（${s.status}，立卡/决策见 plans）`);
          continue;
        }
        console.log(`  [${r.tier}] ${r.module}（tier 原因见库）`);
      }
    }
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    closeDb(db);
  }
}

try { main(); } catch (err) { fail('[sync-status]', err); }
