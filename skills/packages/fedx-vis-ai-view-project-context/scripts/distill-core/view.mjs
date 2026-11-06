// view.mjs —— materials.db 的本地只读视图：内置 HTTP server + 简单 HTML 表格（SQLite 的 view 层）
// 用法：node view.mjs [端口]（默认 8899）；浏览器打开 http://localhost:8899
// 路由：/ 概览 + 状态分布；/survey /status /profile 三表明细（?page=N 分页，?id=N 单行详情）
import http from 'node:http';
import { assertRepoRoot, DB_PATH, openDb, closeDb } from './lib.mjs';

const PORT = Number(process.argv[2]) || 8899;
const TABLES = {
  survey: { table: 'module_survey', title: '模块勘察（module_survey）', order: 'center, section, module' },
  status: { table: 'distill_status', title: '蒸馏状态（distill_status）', order: 'status, module_survey_id' },
  profile: { table: 'module_profile', title: '模块画像（module_profile）', order: 'module_survey_id' },
};
const PAGE_SIZE = 50;

assertRepoRoot();

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function badge(status) {
  const color = { distilled: '#52c41a', queued: '#1677ff', shelved: '#999', enhanced: '#722ed1', 'not-started': '#d48806' }[status] || '#333';
  return `<span style="background:${color};color:#fff;border-radius:4px;padding:1px 8px;font-size:12px">${esc(status)}</span>`;
}
function page(title, body) {
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>${esc(title)} · materials.db</title>
<style>body{font-family:system-ui,Segoe UI,Microsoft YaHei,sans-serif;margin:24px;color:#222}h1{font-size:20px}h1 a{color:#1677ff;text-decoration:none;margin-right:8px}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:5px 8px;text-align:left;vertical-align:top}th{background:#f5f5f5;position:sticky;top:0}
tr:hover td{background:#f0f7ff}.muted{color:#888}.cut{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}code{background:#f5f5f5;padding:0 4px}
nav a{margin-right:14px}.pager{margin:12px 0}.pager a{margin-right:8px}</style></head><body>
<h1><a href="/">⟳ materials.db</a>${esc(title)}</h1>
<nav><a href="/survey">勘察</a><a href="/status">状态</a><a href="/profile">画像</a></nav><hr>${body}</body></html>`;
}

function renderList(db, key, url) {
  const cfg = TABLES[key];
  const pageN = Math.max(1, Number(new URL(url, 'http://localhost').searchParams.get('page')) || 1);
  const total = db.prepare(`SELECT COUNT(*) n FROM ${cfg.table}`).get().n;
  const cols = db.prepare(`PRAGMA table_info(${cfg.table})`).all().map(c => c.name);
  const rows = db.prepare(`SELECT * FROM ${cfg.table} ORDER BY ${cfg.order} LIMIT ? OFFSET ?`).all(PAGE_SIZE, (pageN - 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  let html = `<p class="muted">共 ${total} 行，第 ${pageN}/${pages} 页</p><div class="pager">`;
  if (pageN > 1) html += `<a href="?page=${pageN - 1}">← 上一页</a>`;
  if (pageN < pages) html += `<a href="?page=${pageN + 1}">下一页 →</a>`;
  html += `</div><table><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>`;
  for (const r of rows) {
    html += '<tr>' + cols.map(c => {
      let v = r[c];
      if (v === null || v === undefined) return '<td class="muted">—</td>';
      if (c === 'status') return `<td>${badge(v)}</td>`;
      if (c === 'id' || c === 'module_survey_id') return `<td><a href="/${key}/${v}">${esc(v)}</a></td>`;
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      if (s.length > 80) return `<td class="cut" title="${esc(s.slice(0, 400))}…">${esc(s.slice(0, 80))}…</td>`;
      return `<td>${esc(s)}</td>`;
    }).join('') + '</tr>';
  }
  return page(cfg.title, html + '</table>');
}

function renderRow(db, key, id) {
  const cfg = TABLES[key];
  const row = db.prepare(`SELECT * FROM ${cfg.table} WHERE ${key === 'survey' ? 'id' : 'module_survey_id'} = ?`).get(id);
  if (!row) return page(cfg.title, `<p>无此行：${esc(id)}</p>`);
  let html = '<table>';
  for (const [c, v] of Object.entries(row)) {
    let out;
    if (v === null || v === undefined) out = '<span class="muted">—</span>';
    else if (c === 'status') out = badge(v);
    else if (c === 'detail_json' || typeof v === 'object') {
      const obj = typeof v === 'object' ? v : JSON.parse(v);
      out = `<pre style="white-space:pre-wrap;margin:0;font-size:12px">${esc(JSON.stringify(obj, null, 2))}</pre>`;
    } else out = esc(String(v));
    html += `<tr><th style="width:140px">${esc(c)}</th><td>${out}</td></tr>`;
  }
  return page(`${cfg.title} · 行 ${id}`, html + '</table>');
}

function renderHome(db) {
  const counts = db.prepare('SELECT status, COUNT(*) n FROM distill_status GROUP BY status ORDER BY n DESC').all();
  const bars = counts.map(c => {
    const pct = Math.round((c.n / 40) * 100);
    return `<tr><td>${badge(c.status)}</td><td>${c.n}</td><td><div style="background:#e6f4ff;height:14px;width:${pct}%"></div></td></tr>`;
  }).join('');
  const survey = db.prepare('SELECT COUNT(*) n FROM module_survey').get().n;
  const profile = db.prepare('SELECT COUNT(*) n FROM module_profile').get().n;
  return page('概览', `
<table style="width:auto"><tr><th>表</th><th>行数</th></tr>
<tr><td><a href="/survey">module_survey 勘察</a></td><td>${survey}</td></tr>
<tr><td><a href="/status">distill_status 状态</a></td><td>${counts.reduce((s, c) => s + c.n, 0)}</td></tr>
<tr><td><a href="/profile">module_profile 画像</a></td><td>${profile}</td></tr></table>
<h3>蒸馏状态分布（共 ${counts.reduce((s, c) => s + c.n, 0)} 项）</h3>
<table style="width:70%"><tr><th>状态</th><th>数量</th><th>占比</th></tr>${bars}</table>`);
}

const server = http.createServer((req, res) => {
  const db = openDb();
  try {
    const url = new URL(req.url, 'http://localhost');
    const seg = url.pathname.split('/').filter(Boolean);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!seg.length) res.end(renderHome(db));
    else if (TABLES[seg[0]] && seg.length === 1) res.end(renderList(db, seg[0], req.url));
    else if (TABLES[seg[0]] && seg.length === 2) res.end(renderRow(db, seg[0], Number(seg[1])));
    else { res.statusCode = 404; res.end(page('404', '<p>未知路径</p>')); }
  } catch (err) {
    res.statusCode = 500;
    res.end(page('错误', `<pre>${esc(err.stack)}</pre>`));
  } finally {
    closeDb(db);
  }
});

server.listen(PORT, () => {
  console.log(`[view] materials.db 视图已启动：http://localhost:${PORT}`);
  console.log('[view] Ctrl+C 停止（只读访问，不改库）');
});
