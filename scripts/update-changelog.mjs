import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  SKILLS_DIR,
  STORAGE_DIR,
  SKILL_META_FILE,
  SKILL_DOC_FILE,
  extractSkillName,
  readSkillMeta,
  readSkillFrontmatter,
  getSkillLabel,
  classifyFiles,
  isStorageFile,
  isCoreFile,
  getSkillAction,
} from './skill-classifier.mjs';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_COMMIT_SUBJECT = /^chore(\([^)]*\))?: update changelog$/i;

// ─── CLI ────────────────────────────────────────────────

function printHelp() {
  console.log(`用法:
  node scripts/update-changelog.mjs                 # 基于 git 历史自动更新
  node scripts/update-changelog.mjs "手动条目文本"  # 追加一条手动条目
  node scripts/update-changelog.mjs --message "..." # 同上，flag 形式
  node scripts/update-changelog.mjs -- "..."        # 同上，-- 分隔形式
  node scripts/update-changelog.mjs --help          # 查看帮助
`);
}

function parseArgs(argv) {
  const out = { message: null, help: false };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--help' || arg === '-h') {
      out.help = true;
    } else if (arg === '--message' || arg === '-m') {
      const next = rest[i + 1];
      if (next === undefined) break;
      out.message = next;
      i++;
    } else if (arg === '--') {
      const next = rest[i + 1];
      if (next === undefined) break;
      out.message = next;
      i++;
    } else if (!arg.startsWith('-') && out.message === null) {
      out.message = arg;
    }
  }
  return out;
}

// ─── Git helpers ────────────────────────────────────────

async function gitExec(args, cwd) {
  try {
    const result = await execFileAsync('git', args, { cwd, encoding: 'utf-8' });
    return result.stdout.trim();
  } catch {
    return '';
  }
}

/**
 * 获取指定 commit 的文件变更列表
 */
async function getCommitFiles(rootDir, hash) {
  const stdout = await gitExec(
    ['show', '--name-status', '--no-renames', '--format=', hash],
    rootDir
  );
  if (!stdout) return [];
  return stdout
    .split('\n')
    .map((line) => {
      const m = line.match(/^([AMD])\s+(.+)$/);
      return m ? { status: m[1], file: m[2] } : null;
    })
    .filter(Boolean);
}

// classifyFiles / extractSkillName / readSkillMeta / getSkillLabel
// 已移到 skill-classifier.mjs，这里直接复用

// ─── Bullet 构造 ────────────────────────────────────────

/**
 * 从 commit 的文件变更生成分类后的 bullets
 */
export function buildBulletsFromCommit(commit, rootDir) {
  const { skillGroups, nonSkillFiles } = commit.classified;
  const bullets = [];

  // 排除 CHANGELOG/README 自身的非 skill 文件
  const otherNonSkill = nonSkillFiles.filter(
    (f) => !/(^|\/)(CHANGELOG|README)\.md$/.test(f.file)
  );

  if (skillGroups.length === 0) {
    // 无 skill 变更：尝试用"变更文件: ..."列出本次非 skill 改动
    if (otherNonSkill.length > 0) {
      const names = otherNonSkill.map((f) => f.file).join('、');
      bullets.push({ level: 0, text: `变更文件: ${names}` });
    } else {
      bullets.push({ level: 0, text: commit.subject });
    }
    return bullets;
  }

  // 用 skill-classifier 的 getSkillAction 统一判定动作。
  // 关键：同一个 skill 可能同时 isUpdate + hasStorage（更新并发布），
  // 这种情况要生成两条 bullet：一条「更新 skill」+ 一条「发布 skill」子项。
  // getSkillAction 只返回单个动作（按优先级），所以这里单独判定 hasStorage
  // 来识别「发布」维度，其余动作走 getSkillAction。
  const publishChildren = [];
  const actionBullets = [];

  for (const g of skillGroups) {
    const label = getSkillLabel(rootDir, g.skillName);
    const fm = readSkillFrontmatter(rootDir, g.skillName);
    const desc =
      fm?.description && skillGroups.length === 1
        ? fm.description.length > 60
          ? fm.description.slice(0, 60) + '...'
          : fm.description
        : '';
    const descPart = desc ? `；${desc}` : '';

    // 1) 发布维度：hasStorage 为 true 时，加入「发布 skill」子项
    if (g.hasStorage) {
      const meta = readSkillMeta(rootDir, g.skillName);
      const version = meta?.version;
      publishChildren.push(
        version ? `「${label}」 v${version}` : `「${label}」`
      );
    }

    // 2) 非发布维度：根据 getSkillAction 决定「新增/更新/删除」
    //    注意 getSkillAction 对「更新+发布」返回 '更新'（因为 isUpdate 优先于 hasStorage），
    //    对「纯发布」（只动了 storage）返回 '发布'——这种情况已经在上面处理了，跳过。
    const action = getSkillAction(g);
    if (action === '发布') continue; // 纯发布，只走 publishChildren
    if (action === '删除') {
      actionBullets.push({ level: 0, text: `删除 skill「${label}」` });
      continue;
    }
    if (action === '新增') {
      actionBullets.push({
        level: 0,
        text: `新增 skill「${label}」${descPart}`,
      });
      continue;
    }
    if (action === '更新') {
      // 更新场景：列出变更细节（文档 / 配置 / 其他）
      const details = [];
      if (g.hasDoc) details.push('文档');
      if (g.hasMeta) details.push('配置');
      const otherCount = g.files.filter(
        (f) => !isCoreFile(f.file) && !isStorageFile(f.file)
      ).length;
      if (otherCount > 0) details.push('其他');
      const detailStr = details.length > 0 ? `（${details.join('、')}）` : '';
      actionBullets.push({
        level: 0,
        text: `更新 skill「${label}」${detailStr}${descPart}`,
      });
    }
  }

  // 输出顺序：先 action bullets（新增/更新/删除），再「发布 skill」父+子项
  bullets.push(...actionBullets);

  if (publishChildren.length > 0) {
    bullets.push({ level: 0, text: '发布 skill' });
    for (const child of publishChildren) {
      bullets.push({ level: 1, text: child });
    }
  }

  // 3) 非 skill 文件：一条 "变更文件: ..."，排除 CHANGELOG 自身
  if (otherNonSkill.length > 0) {
    const names = otherNonSkill.map((f) => f.file).join('、');
    bullets.push({ level: 0, text: `变更文件: ${names}` });
  }

  return bullets;
}

// ─── Changelog 解析与渲染 ───────────────────────────────

/**
 * 从 markdown 文本解析出 { marker, entries: Map<date, bullets[]> }
 * 自动跳过多个 # Changelog 头和多个 marker
 */
function parseChangelog(content) {
  const result = { marker: null, entries: new Map() };
  if (!content) return result;

  const lines = content.split('\n');
  let i = 0;

  // 跳过 # Changelog 头（可能有多份）
  while (i < lines.length) {
    if (lines[i].trim() === '# Changelog') {
      i++;
      // 跳过紧跟的空行
      while (i < lines.length && lines[i].trim() === '') i++;
      // 跳过 marker
      const m = lines[i]?.match(
        /^<!--\s*changelog-last-commit:\s*([0-9a-fA-F]+)\s*-->$/
      );
      if (m) {
        if (!result.marker) result.marker = m[1];
        i++;
        while (i < lines.length && lines[i].trim() === '') i++;
      }
    } else {
      break;
    }
  }

  // 解析日期段
  let currentDate = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\s*$/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      if (!result.entries.has(currentDate)) {
        result.entries.set(currentDate, []);
      }
      continue;
    }
    const bulletMatch = line.match(/^(\s*)- (.+)$/);
    if (bulletMatch && currentDate) {
      const indentLen = bulletMatch[1].length;
      const level = Math.max(0, Math.floor(indentLen / 4));
      let text = bulletMatch[2].replace(/[；;]\s*$/, '').trim();
      result.entries.get(currentDate).push({ level, text });
    }
  }

  return result;
}

/**
 * 把 bullets 渲染为 markdown 文本。
 * - 去掉文本末尾的 `；`
 * - 每个"叶子"bullet（没有子 bullet 的）自动补 `；`
 * - 父 bullet（后接子 bullet 的）不补 `；`
 * - 顶层用 0 空格缩进，level 1 用 4 空格缩进
 */
function renderBullets(bullets) {
  return bullets
    .map((b, i) => {
      const text = (b.text || '').replace(/[；;]\s*$/, '').trim();
      const indent = '    '.repeat(b.level || 0);
      const next = bullets[i + 1];
      const isParent = next && (next.level || 0) > (b.level || 0);
      const sep = isParent ? '' : '；';
      return `${indent}- ${text}${sep}`;
    })
    .join('\n');
}

/**
 * 对单个日期的 bullets 做合并去重，解决一天多次提交产生的脏数据：
 *   1. 多个 "发布 skill" 父条目 → 合并为一个，子项去重 + 排序
 *   2. 同 action + 同 skill 名称的条目 → 只保留最详细的那条（带 description 的优先）
 *   3. 低价值的 "新增/更新/变更 N 个文件" 条目 → 仅在没有其他有意义 bullets 时保留
 *   4. 完全重复的 "变更文件: ..." 条目 → 只保留一条
 *   5. 按固定顺序输出：发布 skill → 新增 → 更新 → 删除 → 变更文件 → 其他
 */
export function consolidateBullets(bullets) {
  if (!bullets || bullets.length === 0) return bullets;

  const SKILL_ACTION_RE = /^(新增|更新|删除) skill「([^」]+)」(?:；(.+))?$/;
  const GENERIC_COUNT_RE = /^(新增|更新|删除|变更)\s*\d+\s*个文件$/;
  const PUBLISH_PARENT_TEXT = '发布 skill';
  const PUBLISH_CHILD_RE = /^「(.+?)」(?: (v\S+))?$/;

  // 1) 发布 skill 子项收集
  const publishChildren = [];
  // 2) skill 动作去重：key = `${action}:${label}`
  const skillActions = new Map();
  // 3) 变更文件条目去重
  const fileListMap = new Map();
  // 4) 低价值 generic count 条目，仅作为兜底保留
  const genericBullets = [];
  // 5) 其他条目按文本去重
  const otherBullets = new Map();
  // 6) 脏前缀清理缓存
  const dirtyPrefixRe =
    /^(feat|fix|docs|chore|build|ci|style|refactor|perf|test|revert)\s*[:：]\s*/i;

  let hasPublishParent = false;

  for (const b of bullets) {
    const rawText = (b.text || '').trim();
    if (!rawText) continue;

    // 发布 skill 子项（level === 1 且属于发布 skill 组）
    if (b.level === 1 && PUBLISH_CHILD_RE.test(rawText)) {
      publishChildren.push(rawText);
      continue;
    }

    // 发布 skill 父条目
    if (b.level === 0 && rawText === PUBLISH_PARENT_TEXT) {
      hasPublishParent = true;
      continue;
    }

    // 清理历史脏前缀（"feat: 更新 skill「X」..." 之类）
    const text = rawText.replace(dirtyPrefixRe, '').trim();

    // skill 动作：新增/更新/删除 skill「X」...
    const m = text.match(SKILL_ACTION_RE);
    if (m) {
      const [, action, label, desc] = m;
      const key = `${action}:${label}`;
      const descLen = desc ? desc.length : 0;
      const existing = skillActions.get(key);
      if (!existing || descLen > existing.descLen) {
        skillActions.set(key, { bullet: { level: 0, text }, descLen });
      }
      continue;
    }

    // 变更文件: ...
    if (text.startsWith('变更文件:')) {
      if (!fileListMap.has(text)) {
        fileListMap.set(text, { level: 0, text });
      }
      continue;
    }

    // 低价值 generic count
    if (GENERIC_COUNT_RE.test(text)) {
      genericBullets.push({ level: 0, text });
      continue;
    }

    // 其他：按文本去重
    if (!otherBullets.has(text)) {
      otherBullets.set(text, { level: 0, text });
    }
  }

  // 组装结果
  const result = [];

  // a) 发布 skill 组（子项去重 + 排序）
  if (hasPublishParent && publishChildren.length > 0) {
    // 「name」 v1.2.3 形式归一化用于去重
    const seen = new Set();
    const uniqueChildren = [];
    for (const child of publishChildren) {
      const cm = child.match(PUBLISH_CHILD_RE);
      const key = cm ? `${cm[1]}@${cm[2] || ''}` : child;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueChildren.push(child);
      }
    }
    // 按 skill 名排序，稳定性更好
    uniqueChildren.sort((a, b) => {
      const an = a.match(PUBLISH_CHILD_RE)?.[1] || a;
      const bn = b.match(PUBLISH_CHILD_RE)?.[1] || b;
      return an.localeCompare(bn);
    });
    result.push({ level: 0, text: PUBLISH_PARENT_TEXT });
    for (const c of uniqueChildren) {
      result.push({ level: 1, text: c });
    }
  }

  // b) skill 动作：按 新增 → 更新 → 删除 → 名称排序
  const ACTION_ORDER = { 新增: 0, 更新: 1, 删除: 2 };
  const sortedActions = [...skillActions.values()]
    .map((v) => v.bullet)
    .sort((a, b) => {
      const ak = a.text.match(SKILL_ACTION_RE)?.[1] || '';
      const bk = b.text.match(SKILL_ACTION_RE)?.[1] || '';
      const ao = ACTION_ORDER[ak] ?? 99;
      const bo = ACTION_ORDER[bk] ?? 99;
      if (ao !== bo) return ao - bo;
      return a.text.localeCompare(b.text);
    });
  for (const b of sortedActions) {
    result.push(b);
  }

  // c) 变更文件 / 其他条目
  for (const b of fileListMap.values()) result.push(b);
  for (const b of otherBullets.values()) result.push(b);

  // d) generic count 仅在没有任何有意义 bullets 时兜底
  if (result.length === 0 && genericBullets.length > 0) {
    result.push(...genericBullets);
  }

  return result;
}

function renderChangelog(marker, entriesMap) {
  let out = '# Changelog\n\n';
  if (marker) {
    out += `<!-- changelog-last-commit: ${marker} -->\n\n`;
  }
  const dates = [...entriesMap.keys()].sort((a, b) => b.localeCompare(a));
  for (const date of dates) {
    const bullets = entriesMap.get(date);
    if (!bullets || bullets.length === 0) continue;
    out += `## ${date}\n\n${renderBullets(bullets)}\n\n`;
  }
  return out;
}

// ─── 主流程 ─────────────────────────────────────────────

export function getChangelogPaths(rootDir = path.join(__dirname, '..')) {
  return {
    rootDir,
    changelogPath: path.join(rootDir, 'skills', 'CHANGELOG.md'),
  };
}

/**
 * @param {{
 *   message?: string | null,
 *   rootDir?: string,
 *   changelogPath?: string,
 *   now?: Date,
 * }} options
 */
export async function updateChangelog(options = {}) {
  const { rootDir, changelogPath } = getChangelogPaths(options.rootDir);
  const resolvedPath = options.changelogPath || changelogPath;
  const message = options.message ?? null;

  let content = '';
  if (existsSync(resolvedPath)) {
    content = await readFile(resolvedPath, 'utf8');
  }
  const parsed = parseChangelog(content);

  // 取自 marker 之后的所有 commit（用于判断是否有新内容；不过滤 changelog commit）
  const rawArgs = [
    'log',
    '--pretty=format:%H%x1f%ad%x1f%s',
    '--date=short',
    '--no-decorate',
  ];
  if (parsed.marker) {
    rawArgs.push(`${parsed.marker}..HEAD`);
  }
  const rawStdout = await gitExec(rawArgs, rootDir);
  const allCommits = [];
  if (rawStdout) {
    for (const line of rawStdout.split('\n').filter(Boolean)) {
      const [hash, date, subject] = line.split('\x1f');
      allCommits.push({ hash, date, subject });
    }
  }
  // 过滤掉 changelog 自身 commit（但保留在 latestCommit 跟踪范围内）
  const newCommits = allCommits.filter(
    (c) => !CHANGELOG_COMMIT_SUBJECT.test(c.subject)
  );

  if (newCommits.length === 0 && !message) {
    return { updated: false, changelogPath: resolvedPath, commitCount: 0 };
  }

  // 收集已有 bullets 的 action:label 维度（用于 manual message 去重）
  // 不再用全文本去重——否则 7-17 和 7-24 两次「新增 skill「X」；description」
  // 文本完全相同会被误判为重复，导致 7-24 的更新条目被吞掉。
  // 改为按 `${action}:${label}` 去重，和 consolidateBullets 维度一致，
  // 让 consolidateBullets 在日期内部决定保留哪条（更详细的优先）。
  const existingKeys = new Set();
  const SKILL_ACTION_KEY_RE = /^(新增|更新|删除) skill「([^」]+)」/;
  for (const bullets of parsed.entries.values()) {
    for (const b of bullets) {
      const m = (b.text || '').match(SKILL_ACTION_KEY_RE);
      if (m) existingKeys.add(`${m[1]}:${m[2]}`);
    }
  }

  // marker 取"最近一次被处理过文件变更的 commit"——即 allCommits 的第一个。
  // git log 默认倒序，第一个就是 HEAD 方向最近的；这样下次跑 marker..HEAD
  // 才能正确切到最新提交，不会把历史全量重新处理。
  let latestCommit = parsed.marker;
  if (allCommits.length > 0) {
    latestCommit = allCommits[0].hash;
  }

  for (const commit of newCommits) {
    const files = await getCommitFiles(rootDir, commit.hash);
    const classified = classifyFiles(files);
    const bullets = buildBulletsFromCommit({ ...commit, classified }, rootDir);

    if (!parsed.entries.has(commit.date)) {
      parsed.entries.set(commit.date, []);
    }
    // 直接追加，不再做"逐 bullet 去重"，否则会把"发布 skill"这种共享父条目误判为重复
    parsed.entries.get(commit.date).push(...bullets);
  }

  if (message) {
    const date = (options.now || new Date()).toISOString().slice(0, 10);
    const text = message.replace(/[；;]\s*$/, '').trim();
    // 按 action:label 去重：如果 manual message 是「新增/更新/删除 skill「X」」
    // 且已有同 action:label 的条目，则跳过（consolidateBullets 会保留更详细的）
    const m = text.match(SKILL_ACTION_KEY_RE);
    const key = m ? `${m[1]}:${m[2]}` : null;
    const isDupAction = key && existingKeys.has(key);
    if (!isDupAction) {
      if (!parsed.entries.has(date)) parsed.entries.set(date, []);
      parsed.entries.get(date).push({ level: 0, text });
    }
  }

  // 按日期对 bullets 做合并去重，避免一天多次提交产生的脏数据
  for (const [date, bullets] of parsed.entries) {
    const consolidated = consolidateBullets(bullets);
    if (consolidated.length === 0) {
      parsed.entries.delete(date);
    } else {
      parsed.entries.set(date, consolidated);
    }
  }

  const newContent = renderChangelog(latestCommit, parsed.entries);
  await writeFile(resolvedPath, newContent, 'utf8');
  return {
    updated: true,
    changelogPath: resolvedPath,
    commitCount: newCommits.length,
  };
}

async function main() {
  const { message, help } = parseArgs(process.argv);
  if (help) {
    printHelp();
    return;
  }
  const result = await updateChangelog({ message });

  if (!result.updated) {
    console.log(
      'No new git commits to add to changelog. Use --message to add a manual entry.'
    );
    return;
  }
  console.log(
    `Changelog updated: ${result.changelogPath} (${result.commitCount} commits)`
  );
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
