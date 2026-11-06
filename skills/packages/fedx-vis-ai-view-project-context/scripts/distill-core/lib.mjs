// lib.mjs —— distill-core 公共库：开库/建表/checkpoint/ALIAS/工具
// 依赖：Node >=22.5 内置 node:sqlite（当前环境 Node 26），零第三方依赖
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// 路径锚定：一律从 process.cwd()（物料站仓库根 fedx-vis-ai-view）起算，与脚本存放位置解耦，
// 换电脑/换盘符只需在仓库根目录运行即可。运行目录校验见 assertRepoRoot()。
export const REPO_ROOT = process.cwd();
export const SKILL_DIR = path.join(REPO_ROOT, '.agents/skills/fedx-vis-ai-view-project-context');
export const DB_PATH = path.join(SKILL_DIR, 'research/materials.db');
export const MATERIALS_DIR = path.join(REPO_ROOT, 'docs/materials');

/** 校验当前 cwd 是物料站仓库根（有 docs/materials 与 .trae skill 目录），防止误跑 */
export function assertRepoRoot() {
  const ok = fs.existsSync(MATERIALS_DIR) && fs.existsSync(SKILL_DIR);
  if (!ok) {
    console.error(`[distill-core] 请在物料站仓库根目录运行（当前 cwd：${REPO_ROOT}，未找到 docs/materials 或 ${SKILL_DIR}）`);
    process.exit(1);
  }
}

// module 名 -> 物料目录名 的别名映射（蒸馏时改名/合并在此登记，否则对账失真）
export const ALIAS = {
  // 例：'map-view': 'echarts-map',
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS module_survey (
  id INTEGER PRIMARY KEY,
  project TEXT NOT NULL,
  center TEXT, section TEXT, module TEXT,
  source_path TEXT,
  files INTEGER, size_kb REAL,
  normalized_hash TEXT,
  tier TEXT, tier_reason TEXT, confidence REAL,
  similar_to TEXT,
  exports_json TEXT,
  detail_json TEXT,
  surveyed_at TEXT,
  UNIQUE(project, center, section, module)
);
CREATE TABLE IF NOT EXISTS distill_status (
  module_survey_id INTEGER PRIMARY KEY REFERENCES module_survey(id),
  status TEXT NOT NULL,
  matched_material TEXT,
  decided_by TEXT, decided_at TEXT, reason TEXT
);
CREATE TABLE IF NOT EXISTS module_profile (
  module_survey_id INTEGER PRIMARY KEY REFERENCES module_survey(id),
  profile_json TEXT NOT NULL,
  profiled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_survey_hash ON module_survey(normalized_hash);
CREATE INDEX IF NOT EXISTS idx_survey_project ON module_survey(project);
`;

/** 打开数据库并确保 schema 存在 */
export function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  return db;
}

/** 收尾：checkpoint 截断 WAL，保证 .db 主文件完整可提交（gitignore *.db-wal/-shm） */
export function closeDb(db) {
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  } finally {
    db.close();
  }
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** 扫物料站全部 manifest 目录名（materials/ 下任意深度，模块即含 manifest.json 的目录） */
export function listMaterials() {
  const out = new Set();
  if (!fs.existsSync(MATERIALS_DIR)) return out;
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (!fs.statSync(p).isDirectory()) continue;
      if (fs.existsSync(path.join(p, 'manifest.json'))) out.add(name);
      else walk(p);
    }
  };
  walk(MATERIALS_DIR);
  return out;
}

/** 模块名 -> 物料目录名（走 ALIAS） */
export function materialNameOf(module) {
  return ALIAS[module] || module;
}

/** 统一错误出口 */
export function fail(prefix, err) {
  console.error(`${prefix} ❌ 异常：`, err.message);
  process.exit(1);
}
