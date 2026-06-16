import { readFile, writeFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_COMMIT_SUBJECT = /^chore(\([^)]*\))?: update changelog$/i;

const SKILLS_DIR = 'skills/packages';
const STORAGE_DIR = 'skills/storage';
const SKILL_META_FILE = 'beehive-skill.json';
const SKILL_DOC_FILE = 'SKILL.md';

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

function extractSkillName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const pkgMatch = normalized.match(new RegExp(`^${SKILLS_DIR}/([^/]+)/`));
  if (pkgMatch) return pkgMatch[1];
  const storMatch = normalized.match(new RegExp(`^${STORAGE_DIR}/([^/]+)/`));
  if (storMatch) return storMatch[1];
  return null;
}

function readSkillMeta(rootDir, skillName) {
  const metaPath = path.join(rootDir, SKILLS_DIR, skillName, SKILL_META_FILE);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf-8'));
  } catch {
    return null;
  }
}

function getSkillLabel(rootDir, skillName) {
  const meta = readSkillMeta(rootDir, skillName);
  return meta?.id || meta?.name || skillName;
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

/**
 * 将文件按 skill 维度分组
 */
function classifyFiles(files) {
  const groups = new Map();
  const nonSkillFiles = [];

  for (const f of files) {
    const skillName = extractSkillName(f.file);
    if (skillName) {
      if (!groups.has(skillName)) {
        groups.set(skillName, {
          skillName,
          files: [],
          isNew: false,
          isUpdate: false,
          hasMeta: false,
          hasDoc: false,
          hasStorage: false,
          storageStatus: null,
        });
      }
      const g = groups.get(skillName);
      g.files.push(f);
      const base = path.basename(f.file);
      if (base === SKILL_META_FILE) g.hasMeta = true;
      if (base === SKILL_DOC_FILE) g.hasDoc = true;
      if (f.file.includes(`${STORAGE_DIR}/`)) {
        g.hasStorage = true;
        g.storageStatus = f.status;
      }
      if (f.status === 'A' && !f.file.includes(`${STORAGE_DIR}/`))
        g.isNew = true;
      if (f.status === 'M' && !f.file.includes(`${STORAGE_DIR}/`))
        g.isUpdate = true;
      if (f.status === 'D' && !f.file.includes(`${STORAGE_DIR}/`))
        g.isNew = false;
    } else {
      nonSkillFiles.push(f);
    }
  }

  return { skillGroups: [...groups.values()], nonSkillFiles };
}

// ─── Bullet 构造 ────────────────────────────────────────

/**
 * 从 commit 的文件变更生成分类后的 bullets
 */
function buildBulletsFromCommit(commit, rootDir) {
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

  // 区分"需要发布"的 skill（storage 有变更）和"仅更新/删除"的 skill
  const publishGroups = skillGroups.filter((g) => g.hasStorage);
  const nonPublishGroups = skillGroups.filter((g) => !g.hasStorage);

  // 1) 非发布的 skill：每个一条 "更新 skill「...」（细节）" / "新增 skill「...」" / "删除 skill「...」"
  for (const g of nonPublishGroups) {
    const label = getSkillLabel(rootDir, g.skillName);
    if (
      g.files.every(
        (f) =>
          f.status === 'D' ||
          (f.status === 'D' && !f.file.includes(`${STORAGE_DIR}/`))
      )
    ) {
      bullets.push({ level: 0, text: `删除 skill「${label}」` });
      continue;
    }
    if (g.isNew) {
      bullets.push({ level: 0, text: `新增 skill「${label}」` });
      continue;
    }
    const details = [];
    if (g.hasDoc) details.push('文档');
    if (g.hasMeta) details.push('配置');
    const otherCount = g.files.filter(
      (f) =>
        path.basename(f.file) !== SKILL_DOC_FILE &&
        path.basename(f.file) !== SKILL_META_FILE &&
        !f.file.includes(`${STORAGE_DIR}/`)
    ).length;
    if (otherCount > 0) details.push('其他');
    const detailStr = details.length > 0 ? `（${details.join('、')}）` : '';
    bullets.push({
      level: 0,
      text: `feat: 更新 skill「${label}」${detailStr}`,
    });
  }

  // 2) 需要发布的 skill：合并到一个 "发布 skill" 父条目下
  if (publishGroups.length > 0) {
    bullets.push({ level: 0, text: '发布 skill' });
    for (const g of publishGroups) {
      const label = getSkillLabel(rootDir, g.skillName);
      const meta = readSkillMeta(rootDir, g.skillName);
      const version = meta?.version;
      const text = version ? `「${label}」 v${version}` : `「${label}」`;
      bullets.push({ level: 1, text });
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

  // 收集新增的 manual message（基于文本去重，避免重复）
  const existingTexts = new Set();
  for (const bullets of parsed.entries.values()) {
    for (const b of bullets) existingTexts.add(b.text);
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
    if (!existingTexts.has(text)) {
      if (!parsed.entries.has(date)) parsed.entries.set(date, []);
      parsed.entries.get(date).push({ level: 0, text });
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
