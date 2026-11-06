// profile.mjs —— 工作流 2 · 单模块画像：profileModule 画像 → UPSERT module_profile + stdout 人读视图（不落任何文件）
// 分析能力唯一来源是 ./profile-core.mjs（与 survey 同一套 import 解析 / hash / 内联规则）
// 用法（物料站仓库根运行）：node …/distill-core/profile.mjs <模块源码路径> [project] [center] [section] [module]
//   或先有 survey 行：node …/distill-core/profile.mjs <survey-id>
import fs from "node:fs";
import path from "node:path";
import { profileModule, sanitize, renderMd } from "./profile-core.mjs";
import { REPO_ROOT, openDb, closeDb, today, fail, DB_PATH, assertRepoRoot } from "./lib.mjs";

function main() {
  assertRepoRoot();
  const arg = process.argv[2];
  if (!arg) {
    console.error("[profile] 用法：node profile.mjs <模块源码路径 | survey-id> [project] [center] [section] [module]");
    process.exit(1);
  }
  const db = openDb();
  try {
    let id, project, center, section, module, sourcePath;
    if (/^\d+$/.test(arg)) {
      const row = db.prepare("SELECT id, project, center, section, module, source_path FROM module_survey WHERE id=?").get(Number(arg));
      if (!row) {
        console.error(`[profile] survey id=${arg} 不存在`);
        process.exit(1);
      }
      ({ id, project, center, section, module, source_path: sourcePath } = row);
    } else {
      project = process.argv[3] || "unknown-project";
      center = process.argv[4] || null;
      section = process.argv[5] || null;
      module = process.argv[6] || path.basename(arg.replace(/[\\/]+$/, ""));
      sourcePath = path.resolve(arg);
      db.prepare(
        `INSERT INTO module_survey (project, center, section, module, source_path, surveyed_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(project, center, section, module) DO UPDATE SET source_path=excluded.source_path, surveyed_at=excluded.surveyed_at`,
      ).run(project, center, section, module, sourcePath, today());
      id = db
        .prepare("SELECT id FROM module_survey WHERE project=? AND center IS ? AND section IS ? AND module=?")
        .get(project, center, section, module).id;
    }
    if (!fs.existsSync(sourcePath)) {
      console.error(`[profile] 源码目录不存在：${sourcePath}（survey 记录路径可能已失效）`);
      process.exit(1);
    }
    // 尽力注入源项目根，供 profile-core 加载其 TS（lib API 完整）；禁止硬编码盘符
    if (!process.env.DISTILL_SRC_ROOT) {
      const guess = path.join(REPO_ROOT, "..", "oss-visual-gd-emergency-support");
      if (fs.existsSync(path.join(guess, "node_modules/typescript"))) process.env.DISTILL_SRC_ROOT = guess;
    }

    const p = profileModule(sourcePath, module);
    if (!p) {
      console.error("[profile] 目录内无代码文件");
      process.exit(1);
    }
    db.prepare(
      `INSERT INTO module_profile (module_survey_id, profile_json, profiled_at)
      VALUES (?, ?, ?)
      ON CONFLICT(module_survey_id) DO UPDATE SET profile_json=excluded.profile_json, profiled_at=excluded.profiled_at`,
    ).run(id, JSON.stringify(sanitize(p)), today());

    console.log(`[profile] ✅ ${project}/${center || "-"}/${module}（survey id=${id}）已入库 ${DB_PATH}\n`);
    console.log(renderMd(p));
  } finally {
    closeDb(db);
  }
}

try {
  main();
} catch (err) {
  fail("[profile]", err);
}
