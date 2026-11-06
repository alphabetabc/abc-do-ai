/**
 * distill-core/profile-core.mjs
 * 作用：蒸馏画像共用核心（分析规则唯一实现）——文件采集、import 解析、AST Props 提取、
 *       资源扫描、归一化 hash、相似度、重依赖预警、内联映射与剥离规则（蒸馏领域知识库）
 * 被 distill-core/survey.mjs（批量评价）与 distill-core/profile.mjs（单体画像）复用；
 * 禁止在其他脚本重写这些能力
 * 依赖：Node 内置 + 源项目 typescript（Props AST，经 DISTILL_SRC_ROOT 探测）；无第三方新增
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// ── typescript 加载（多路径探测；物料站 TS7 无 lib API，源项目 TS4 可用）──
const require = createRequire(import.meta.url);
function loadTs() {
  const candidates = [
    path.resolve(process.cwd(), 'node_modules/typescript/lib/typescript.js'),
  ];
  // 源项目 TS（lib API 完整）由入口脚本经 DISTILL_SRC_ROOT 注入，禁止硬编码盘符
  if (process.env.DISTILL_SRC_ROOT) {
    candidates.push(path.join(process.env.DISTILL_SRC_ROOT, 'node_modules/typescript/lib/typescript.js'));
  }
  for (const p of candidates) {
    try {
      const ts = require(p);
      if (ts && typeof ts.isFunctionDeclaration === 'function') return ts;
    } catch { /* try next */ }
  }
  return null;
}

// ── 规则库：蒸馏领域知识 ─────────────────────────────────────────
/** 重依赖白名单：命中即搁置预警（不蒸馏） */
const HEAVY_DEPS = [
  'fedx-gis', '@arcgis', 'arcgis', 'mapbox', 'mapbox-gl', 'cesium', 'openlayers', 'ol',
  '@mapbox', 'echarts-gl', 'bmap',
];

/** 内联映射：源依赖 → 蒸馏处置建议 */
const INLINE_MAP = {
  'classnames': { action: 'inline', hint: '模板字符串内联' },
  'useSize': { action: 'inline', hint: 'ResizeObserver 内联（widget-shell 先例）' },
  'useLatest': { action: 'inline', hint: 'useRef 模式内联' },
  'useIntervalTimer': { action: 'inline', hint: 'setInterval + useEffect cleanup' },
  'useMemorizedObject': { action: 'inline', hint: 'useMemo 直接依赖（013/014 先例）' },
  'useRequest': { action: 'strip', hint: '数据 Props 化，examples 用 setInterval 模拟' },
  'useEnvironment': { action: 'strip', hint: '轮询配置剥离' },
  'Decimal': { action: 'inline', hint: '原生乘法（014 先例）' },
};

/** 剥离规则：容器/请求层，蒸馏不做 */
const STRIP_SPECS = [
  '~/web/services', 'services/request', 'getViewItemDataApi', 'useEnvironment',
  'TIME_RANGE', '~/web/common/constants',
];

/** @fedx-web-common/utils → lodash-es 对应 */
const UTILS_TO_LODASH = {
  get: 'get', isEmpty: 'isEmpty', cloneDeep: 'cloneDeep', isUndefined: 'isUndefined',
  merge: 'merge', throttle: 'throttle', debounce: 'debounce',
};

// ── 采集原语 ─────────────────────────────────────────────────────
const CODE_EXT = /\.(tsx?|jsx?)$/;

export function listFiles(dir, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'images' || name === 'node_modules' || name.includes('.bak.')) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) listFiles(full, base, acc);
    else acc.push({ rel: path.relative(base, full).replaceAll('\\', '/'), size: stat.size, full });
  }
  return acc;
}

export function readCode(files) {
  return files.filter((f) => CODE_EXT.test(f.rel)).map((f) => ({
    ...f, code: fs.readFileSync(f.full, 'utf8'),
  }));
}

export function extractImports(code) {
  const out = new Set();
  let m;
  const re = /import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
  while ((m = re.exec(code))) out.add(m[1]);
  const req = /require\(['"]([^'"]+)['"]\)/g;
  while ((m = req.exec(code))) out.add(m[1]);
  return [...out];
}

/** import 分类：npm / 内部别名 / 相对引用（含 kind 判定） */
export function classifyImports(allImports) {
  const npm = new Set(), internal = [], relative = [];
  for (const spec of allImports) {
    if (spec.startsWith('.')) {
      relative.push({ spec, kind: guessRelKind(spec) });
    } else if (spec.startsWith('~/') || spec.startsWith('@fedx-web-common') || spec.startsWith('@fedx-bff')) {
      internal.push({ spec, kind: guessInternalKind(spec) });
    } else {
      npm.add(spec.split('/')[0].startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
    }
  }
  return { npm: [...npm].sort(), internal, relative };
}

function guessRelKind(spec) {
  const s = spec.toLowerCase();
  if (/(hook|use[A-Z])/.test(spec)) return 'hooks';
  if (/(util|helper|constant)/.test(s)) return 'utils';
  if (/\.(less|css|scss|svg|png|jpe?g)$/.test(s)) return 'style/asset';
  return 'component';
}

function guessInternalKind(spec) {
  if (spec.includes('/services')) return 'service';
  if (spec.includes('/hooks') || spec.includes('react-hooks')) return 'hooks';
  if (spec.includes('/utils')) return 'utils';
  if (spec.includes('/components/ui/')) return 'ui-material';
  return 'other';
}

/** 资源扫描：img src / url() / import 资源 */
export function extractAssets(codeFiles) {
  const assets = new Map();
  for (const f of codeFiles) {
    let m;
    const imgRe = /(src|href)=["']([^"']+\.(png|jpe?g|svg|gif|webp))["']/g;
    while ((m = imgRe.exec(f.code))) {
      const p = m[2];
      if (!assets.has(p)) assets.set(p, { path: p, usage: 'img src', files: [] });
      assets.get(p).files.push(f.rel);
    }
    // 模板字符串形式：src={`${constants.IMAGE_PATH}/xxx.png`}
    const tplRe = /(src|href)=\{?`([^`]*\.(png|jpe?g|svg|gif|webp))`\}?/g;
    while ((m = tplRe.exec(f.code))) {
      const p = m[2];
      if (!assets.has(p)) assets.set(p, { path: p, usage: 'img src (template)', files: [] });
      assets.get(p).files.push(f.rel);
    }
    const cssRe = /url\(["']?([^"')]+\.(png|jpe?g|svg|gif|webp|woff2?|ttf))["']?\)/g;
    while ((m = cssRe.exec(f.code))) {
      const p = m[1];
      if (!assets.has(p)) assets.set(p, { path: p, usage: 'css url()', files: [] });
      assets.get(p).files.push(f.rel);
    }
  }
  for (const a of assets.values()) {
    a.equivalent = a.path.endsWith('.svg')
      ? 'SVG 内联重绘候选'
      : /\.(png|jpe?g|gif|webp)$/.test(a.path)
        ? 'CSS 渐变/纯色等价候选（不分发位图）'
        : '字体声明保留，不分发字体文件';
  }
  return [...assets.values()];
}

/** hooks 使用统计 */
export function extractHooks(codeFiles) {
  const hooks = {};
  for (const f of codeFiles) {
    let m;
    const re = /\b(use[A-Z][A-Za-z0-9]*)\s*\(/g;
    while ((m = re.exec(f.code))) hooks[m[1]] = (hooks[m[1]] || 0) + 1;
    const legacy = /\b(useRequest|useInterval|useLatest|useSize|useEnvironment|useMemorizedObject)\b/g;
    while ((m = legacy.exec(f.code))) hooks[m[1]] = (hooks[m[1]] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(hooks).sort((a, b) => b[1] - a[1]));
}

/** AST Props 提取：导出组件的 Props 接口（字段 + 类型）；ts 不可用时正则兜底 */
export function extractExportProps(codeFiles) {
  const ts = loadTs();
  if (!ts) return extractExportPropsRegex(codeFiles);
  const exports = [];
  for (const f of codeFiles) {
    if (!/\.tsx?$/.test(f.rel)) continue;
    let sf;
    try {
      sf = ts.createSourceFile(f.full, f.code, ts.ScriptTarget.ES2022, true, f.rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    } catch { continue; }

    // 收集 interface/type 声明（名称 → 字段）
    const ifaceMap = new Map();
    const visitType = (node) => {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        const fields = [];
        const collect = (n) => {
          if (ts.isPropertySignature(n) && n.name) {
            fields.push({
              name: n.name.getText(sf),
              type: n.type ? n.type.getText(sf).replace(/\s+/g, ' ') : 'unknown',
              optional: !!n.questionToken,
            });
          }
          ts.forEachChild(n, collect);
        };
        ts.forEachChild(node, collect);
        if (fields.length) ifaceMap.set(node.name.getText(sf), fields);
      }
      ts.forEachChild(node, visitType);
    };
    visitType(sf);

    // 找导出的函数组件：export default function X(props: P) / function X({…}: P)
    const visit = (node) => {
      if (ts.isFunctionDeclaration(node) && node.name && /export|default/.test(getModifiersText(node, sf))) {
        exports.push(makeExport(node.name.getText(sf), f.rel, node.parameters[0], sf, ifaceMap));
      }
      if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
        // export { A, B } 形态：登记名字（类型从同名声明补）
        for (const el of node.exportClause.elements) {
          const name = el.name.getText(sf);
          if (!exports.some((e) => e.name === name && e.file === f.rel)) {
            exports.push({ name, file: f.rel, propsType: null, fields: null, note: 'named export，需 AI 精读' });
          }
        }
      }
      if (ts.isVariableStatement(node)) {
        for (const d of node.declarationList.declarations) {
          const init = d.initializer;
          if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && /export/.test(getModifiersText(node, sf))) {
            exports.push(makeExport(d.name.getText(sf), f.rel, init.parameters[0], sf, ifaceMap));
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return exports;
}

/** 正则兜底：interface Props 块 + 导出组件名（ts 不可用时） */
function extractExportPropsRegex(codeFiles) {
  const exports = [];
  for (const f of codeFiles) {
    if (!/\.tsx?$/.test(f.rel)) continue;
    const code = f.code;
    // interface X { ... } 字段提取（含嵌套一层）
    const ifaceMap = new Map();
    const ifaceRe = /(?:export\s+)?(?:interface|type)\s+([A-Z]\w*)\s*(?:=\s*)?\{([\s\S]*?)\n\}/g;
    let m;
    while ((m = ifaceRe.exec(code))) {
      const fields = [];
      const fieldRe = /(\w+)\??\s*:\s*([^;\n]+)[;\n]/g;
      let fm;
      while ((fm = fieldRe.exec(m[2]))) {
        fields.push({ name: fm[1], type: fm[2].trim().replace(/\s+/g, ' '), optional: fm[0].includes('?') });
      }
      if (fields.length) ifaceMap.set(m[1], fields);
    }
    // export default function X(props: P) / const X = (props: P) =>
    const fnRe = /export\s+default\s+function\s+([A-Z]\w*)\s*\(\s*(\w+)\s*(?::\s*([\w.<>[\]]+))?\)/g;
    while ((m = fnRe.exec(code))) {
      exports.push({ name: m[1], file: f.rel, propsType: m[3] || null, fields: m[3] ? (ifaceMap.get(m[3]) || null) : null, note: m[3] ? null : '参数无类型标注，需 AI 精读' });
    }
    const namedRe = /export\s*\{([^}]+)\}/g;
    while ((m = namedRe.exec(code))) {
      for (const part of m[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop();
        if (/^[A-Z]\w*$/.test(name) && !exports.some((e) => e.name === name && e.file === f.rel)) {
          exports.push({ name, file: f.rel, propsType: null, fields: ifaceMap.get(name + 'Props') || null, note: 'named export，需 AI 精读' });
        }
      }
    }
  }
  return exports;
}

function makeExport(name, file, param, sf, ifaceMap) {
  const propsType = param?.type?.getText(sf) || null;
  return {
    name, file,
    propsType,
    fields: propsType ? (ifaceMap.get(stripQualifiers(propsType)) || null) : null,
    note: propsType ? null : '参数无类型标注，需 AI 精读',
  };
}

function getModifiersText(node, sf) {
  const mods = node.modifiers?.map((m) => m.getText(sf)) || [];
  return mods.join(' ');
}

function stripQualifiers(t) { return (t || '').replace(/[<>\s]/g, ''); }

function inferFromDestructure(param) {
  if (!param) return null;
  // 无类型标注时不推断（保持诚实，交 AI 精读）
  return null;
}

/** 归一化 hash：去注释/空白/字符串内容后 sha1，跨模块跨项目比对 */
export function normalizedHash(codeFiles) {
  const combined = codeFiles
    .filter((f) => CODE_EXT.test(f.rel))
    .map((f) => f.rel.split('/').pop() + '\n' + normalizeCode(f.code))
    .sort()
    .join('\n===\n');
  return crypto.createHash('sha1').update(combined).digest('hex');
}

function normalizeCode(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')      // 块注释
    .replace(/\/\/[^\n]*/g, '')            // 行注释
    .replace(/(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, '""') // 字符串字面量归一
    .replace(/\s+/g, '')                   // 空白
    .trim();
}

/** 相似度：token 集合 Jaccard（粗粒度，够用） */
export function similarity(hashA, hashB, tokensA, tokensB) {
  if (hashA === hashB) return 1;
  const sa = new Set(tokensA), sb = new Set(tokensB);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter || 1);
}

/** 归一化 token 集（供相似度） */
export function normalizedTokens(codeFiles) {
  const tokens = new Set();
  for (const f of codeFiles) {
    for (const t of normalizeCode(f.code).match(/[A-Za-z_$][A-Za-z0-9_$]{2,}/g) || []) tokens.add(t);
  }
  return [...tokens];
}

// ── 画像组装 ─────────────────────────────────────────────────────
export function profileModule(modulePath, moduleName) {
  const allFiles = listFiles(modulePath);
  const codeFiles = readCode(allFiles);
  if (!codeFiles.length) return null;
  // 资源扫描覆盖样式文件（less/css 里的 url()/背景图）
  const styleFiles = allFiles
    .filter((f) => /\.(less|css|scss)$/.test(f.rel))
    .map((f) => ({ ...f, code: fs.readFileSync(f.full, 'utf8') }));

  const allImports = new Set();
  for (const f of codeFiles) for (const s of extractImports(f.code)) allImports.add(s);
  const deps = classifyImports([...allImports].filter(Boolean));

  const heavyDeps = deps.npm.filter((d) => HEAVY_DEPS.some((h) => d === h || d.startsWith(h + '/')));

  // 内联/剥离建议
  const inlineSuggestions = [];
  for (const f of codeFiles) {
    for (const [key, rule] of Object.entries(INLINE_MAP)) {
      if (new RegExp(`\\b${key}\\b`).test(f.code) && !inlineSuggestions.some((s) => s.key === key)) {
        inlineSuggestions.push({ key, ...rule });
      }
    }
  }
  const stripSuggestions = [];
  for (const imp of [...deps.internal, ...deps.relative]) {
    if (STRIP_SPECS.some((s) => imp.spec.includes(s))) stripSuggestions.push(imp.spec);
  }

  return {
    module: moduleName,
    source: path.resolve(modulePath),
    files: allFiles.map((f) => ({ path: f.rel, size: f.size })),
    totalSize: allFiles.reduce((s, f) => s + f.size, 0),
    codeFileCount: codeFiles.length,
    deps,
    heavyDeps,
    inlineSuggestions,
    stripSuggestions,
    assets: extractAssets([...codeFiles, ...styleFiles]),
    hooks: extractHooks(codeFiles),
    exports: extractExportProps(codeFiles),
    normalizedHash: normalizedHash(codeFiles),
    _tokens: normalizedTokens(codeFiles), // 内部字段，survey 比对用
  };
}

/** 清理内部字段（出画像前） */
export function sanitize(p) {
  const { _tokens, ...rest } = p;
  return rest;
}

// ── md 渲染 ─────────────────────────────────────────────────────
export function renderMd(p) {
  const L = [];
  L.push(`# 蒸馏画像 · ${p.module}`, '');
  L.push(`- 源路径：\`${p.source}\``);
  L.push(`- 体量：${p.files.length} 文件 / ${(p.totalSize / 1024).toFixed(1)}KB（代码 ${p.codeFileCount} 文件）`);
  L.push(`- 归一化 hash：\`${p.normalizedHash.slice(0, 12)}\``, '');
  L.push('## 依赖面', '');
  L.push(`- npm：${p.deps.npm.length ? p.deps.npm.map((d) => `\`${d}\``).join('、') : '无'}`);
  L.push(`- 内部：${p.deps.internal.length ? p.deps.internal.map((d) => `\`${d.spec}\`(${d.kind})`).join('、') : '无'}`);
  L.push(`- 相对：${p.deps.relative.length ? p.deps.relative.map((d) => `\`${d.spec}\`(${d.kind})`).join('、') : '无'}`, '');
  if (p.heavyDeps.length) L.push(`## ⚠️ 重依赖预警（搁置候选）`, '', ...p.heavyDeps.map((d) => `- \`${d}\``), '');
  if (p.inlineSuggestions.length) {
    L.push('## 内联映射建议', '', '| 依赖 | 处置 | 说明 |', '| --- | --- | --- |');
    for (const s of p.inlineSuggestions) L.push(`| \`${s.key}\` | ${s.action} | ${s.hint} |`);
    L.push('');
  }
  if (p.stripSuggestions.length) L.push('## 剥离项（容器/请求层）', '', ...[...new Set(p.stripSuggestions)].map((s) => `- \`${s}\``), '');
  if (p.assets.length) {
    L.push('## 资源面（不分发，需等价重绘）', '', '| 资源 | 用法 | 等价方案 |', '| --- | --- | --- |');
    for (const a of p.assets) L.push(`| \`${a.path}\` | ${a.usage} | ${a.equivalent} |`);
    L.push('');
  }
  const hookEntries = Object.entries(p.hooks);
  if (hookEntries.length) L.push('## hooks 使用', '', ...hookEntries.map(([k, v]) => `- \`${k}\` ×${v}`), '');
  if (p.exports.length) {
    L.push('## 导出组件与 Props', '');
    for (const e of p.exports) {
      L.push(`### ${e.name}（${e.file}）`, '', `- Props 类型：${e.propsType ? `\`${e.propsType}\`` : '未标注'}`);
      if (e.fields) {
        L.push('', '| Prop | 类型 | 可选 |', '| --- | --- | --- |');
        for (const f of e.fields) L.push(`| ${f.name} | \`${f.type}\` | ${f.optional ? '是' : '否'} |`);
      } else if (e.note) {
        L.push('', `- ${e.note}`);
      }
      L.push('');
    }
  }
  return L.join('\n');
}
