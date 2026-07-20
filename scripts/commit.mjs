#!/usr/bin/env node

/**
 * ABC AI 能力库 —— 智能提交脚本
 * 支持 Windows / macOS / Linux
 * 遵循 Conventional Commits 规范
 *
 * 项目特性适配：
 *   - 自动识别 skills/packages 下的 skill 模块变更
 *   - 自动识别 storage 打包产物变更
 *   - 区分 skill 新增 / 更新 / 发布 / 项目配置 等场景
 *   - 从 beehive-skill.json 和 SKILL.md frontmatter 中提取上下文
 *
 * AI 模式（可选）：
 *   在项目根目录创建 .commit-ai.json:
 *   {
 *     "apiUrl": "https://api.openai.com/v1/chat/completions",
 *     "apiKey": "sk-xxx",
 *     "model": "gpt-4o-mini"
 *   }
 */

import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename, extname, dirname } from 'node:path';
import { updateChangelog } from './update-changelog.mjs';

const CHANGELOG_FILE = 'skills/CHANGELOG.md';

// ─── 工具函数 ───────────────────────────────────────────

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const CHANGELOG_COMMIT_MSG = `chore(${formatDate(new Date())}): update changelog`;

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
}

function println(msg = '') {
  console.log(msg);
}

function printError(msg) {
  console.error(`\x1b[31m✖ ${msg}\x1b[0m`);
}

function printSuccess(msg) {
  console.log(`\x1b[32m✔ ${msg}\x1b[0m`);
}

function printInfo(msg) {
  console.log(`\x1b[36mℹ ${msg}\x1b[0m`);
}

function printWarn(msg) {
  console.log(`\x1b[33m⚠ ${msg}\x1b[0m`);
}

// ─── 交互工具 ───────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function select(question, options) {
  return new Promise((resolve) => {
    println(`\n${question}`);
    options.forEach((opt, i) => {
      println(`  \x1b[33m${i + 1}\x1b[0m) ${opt.label}`);
    });
    rl.question('\n请选择序号: ', (answer) => {
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < options.length) {
        resolve(options[idx]);
      } else {
        printError('无效选择，请重新输入');
        resolve(select(question, options));
      }
    });
  });
}

// ─── 提交类型定义 ────────────────────────────────────────

const COMMIT_TYPES = [
  { label: 'feat:     新功能', value: 'feat' },
  { label: 'fix:      修复 Bug', value: 'fix' },
  { label: 'docs:     文档变更', value: 'docs' },
  { label: 'style:    代码格式（不影响逻辑）', value: 'style' },
  { label: 'refactor: 重构（非新功能、非修复）', value: 'refactor' },
  { label: 'perf:     性能优化', value: 'perf' },
  { label: 'test:     测试相关', value: 'test' },
  { label: 'build:    构建系统或外部依赖变更', value: 'build' },
  { label: 'ci:       CI 配置变更', value: 'ci' },
  { label: 'chore:    其他杂项', value: 'chore' },
  { label: 'revert:   回滚提交', value: 'revert' },
];

// ─── Skill 识别 ──────────────────────────────────────────

const SKILLS_DIR = 'skills/packages';
const STORAGE_DIR = 'skills/storage';
const SKILL_META_FILE = 'beehive-skill.json';
const SKILL_DOC_FILE = 'SKILL.md';

/**
 * 从文件路径中提取 skill 名称
 * skills/packages/agent-creator/SKILL.md → agent-creator
 * skills/storage/agent-creator/agent-creator@0.0.0.tgz → agent-creator
 */
function extractSkillName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // skills/packages/<name>/...
  const pkgMatch = normalized.match(new RegExp(`^${SKILLS_DIR}/([^/]+)/`));
  if (pkgMatch) return pkgMatch[1];
  // skills/storage/<name>/...
  const storMatch = normalized.match(new RegExp(`^${STORAGE_DIR}/([^/]+)/`));
  if (storMatch) return storMatch[1];
  return null;
}

/**
 * 读取 skill 元信息（从 beehive-skill.json）
 */
function readSkillMeta(skillName) {
  const metaPath = resolve(
    process.cwd(),
    SKILLS_DIR,
    skillName,
    SKILL_META_FILE
  );
  if (existsSync(metaPath)) {
    try {
      return JSON.parse(readFileSync(metaPath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 从 SKILL.md frontmatter 提取 name 和 description
 */
function readSkillFrontmatter(skillName) {
  const mdPath = resolve(process.cwd(), SKILLS_DIR, skillName, SKILL_DOC_FILE);
  if (!existsSync(mdPath)) return null;
  try {
    const content = readFileSync(mdPath, 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;
    const fm = fmMatch[1];
    const nameMatch = fm.match(/name:\s*['"]?([^'"\n]+)['"]?/);
    const descMatch = fm.match(/description:\s*['"]?([^'"\n]+)['"]?/);
    return {
      name: nameMatch?.[1]?.trim() || '',
      description: descMatch?.[1]?.trim() || '',
    };
  } catch {
    return null;
  }
}

/**
 * 将 diff 文件分组到 skill 维度
 */
function groupFilesBySkill(files) {
  const groups = {};
  const nonSkillFiles = [];

  for (const f of files) {
    const skillName = extractSkillName(f.file);
    if (skillName) {
      if (!groups[skillName]) {
        groups[skillName] = {
          skillName,
          files: [],
          hasMeta: false,
          hasDoc: false,
          hasStorage: false,
          isNew: false,
        };
      }
      groups[skillName].files.push(f);
      const base = basename(f.file);
      if (base === SKILL_META_FILE) groups[skillName].hasMeta = true;
      if (base === SKILL_DOC_FILE) groups[skillName].hasDoc = true;
      if (f.file.includes(STORAGE_DIR)) groups[skillName].hasStorage = true;
      if (f.status === 'A') groups[skillName].isNew = true;
      if (f.status === 'D' && !f.file.includes(`${STORAGE_DIR}/`)) {
        groups[skillName].isDeleted = true;
      }
    } else {
      nonSkillFiles.push(f);
    }
  }

  return { skillGroups: Object.values(groups), nonSkillFiles };
}

// ─── Diff 分析引擎 ──────────────────────────────────────

/**
 * 解析 git diff 的结构化信息
 */
function analyzeDiff() {
  const result = {
    files: [],
    stats: { insertions: 0, deletions: 0, files: 0 },
    diffContent: '',
    newFiles: [],
    deletedFiles: [],
    renamedFiles: [],
    modifiedFiles: [],
    // skill 相关
    skillGroups: [],
    nonSkillFiles: [],
  };

  // 获取文件名与状态
  let nameStatus;
  try {
    nameStatus = exec('git diff --cached --name-status');
  } catch {
    nameStatus = '';
  }
  if (!nameStatus) return result;

  const lines = nameStatus.split('\n');
  for (const line of lines) {
    const parts = line.split('\t');
    const status = parts[0]?.[0];
    const file = parts[parts.length - 1];

    result.files.push({ status, file, fullStatus: parts[0] });

    switch (status) {
      case 'A':
        result.newFiles.push(file);
        break;
      case 'D':
        result.deletedFiles.push(file);
        break;
      case 'R':
        result.renamedFiles.push({ from: parts[1], to: parts[2] });
        break;
      case 'M':
      default:
        result.modifiedFiles.push(file);
        break;
    }
  }

  result.stats.files = result.files.length;

  // 获取统计信息
  try {
    const stat = exec('git diff --cached --shortstat');
    const insMatch = stat.match(/(\d+) insertion/);
    const delMatch = stat.match(/(\d+) deletion/);
    if (insMatch) result.stats.insertions = parseInt(insMatch[1], 10);
    if (delMatch) result.stats.deletions = parseInt(delMatch[1], 10);
  } catch {
    // ignore
  }

  // 获取 diff 内容（截断防止过大）
  try {
    let diff = exec('git diff --cached --no-color');
    if (diff.length > 8000) {
      diff = diff.slice(0, 8000) + '\n... [diff truncated]';
    }
    result.diffContent = diff;
  } catch {
    // ignore
  }

  // 按 skill 分组
  const { skillGroups, nonSkillFiles } = groupFilesBySkill(result.files);
  result.skillGroups = skillGroups;
  result.nonSkillFiles = nonSkillFiles;

  return result;
}

/**
 * 从文件路径推断 scope（优先识别 skill 名称）
 */
function inferScope(diff) {
  if (diff.files.length === 0) return '';

  // 如果只涉及一个 skill group，用 skill 名称
  if (diff.skillGroups.length === 1) {
    return diff.skillGroups[0].skillName;
  }

  // 单文件 —— 用文件名（不含扩展名）
  if (diff.files.length === 1) {
    const f = diff.files[0].file;
    return basename(f, extname(f));
  }

  // 多文件多 skill —— 找公共目录
  const dirs = diff.files.map((f) => dirname(f.file));
  const uniqueDirs = [...new Set(dirs)];

  if (uniqueDirs.length === 1 && uniqueDirs[0] !== '.') {
    return basename(uniqueDirs[0]);
  }

  const parts0 = dirs[0].split(/[/\\]/);
  let common = '';
  for (let i = 0; i < parts0.length; i++) {
    if (dirs.every((d) => d.split(/[/\\]/)[i] === parts0[i])) {
      common = parts0[i];
    } else {
      break;
    }
  }

  return common && common !== '.' ? common : '';
}

/**
 * 构建 skill 变更描述
 */
function describeSkillChanges(group) {
  const meta = readSkillMeta(group.skillName);
  const fm = readSkillFrontmatter(group.skillName);
  const label = fm?.name || group.skillName;

  const actions = [];
  if (group.isDeleted) {
    actions.push('删除');
  } else if (group.hasStorage) {
    actions.push('发布');
  } else if (group.isNew) {
    actions.push('新增');
  } else {
    actions.push('更新');
  }

  // 判断变更细节
  const detail = [];
  if (group.hasDoc) detail.push('文档');
  if (group.hasMeta) detail.push('配置');
  const otherFiles = group.files.filter(
    (f) =>
      basename(f.file) !== SKILL_DOC_FILE &&
      basename(f.file) !== SKILL_META_FILE &&
      !f.file.includes(STORAGE_DIR)
  );
  if (otherFiles.length > 0) detail.push(`${otherFiles.length} 个其他文件`);

  let desc = `${actions[0]} skill「${label}」`;
  if (detail.length > 0 && !group.hasStorage) {
    desc += `（${detail.join('、')}）`;
  }
  if (meta?.version && group.hasStorage) {
    desc += ` v${meta.version}`;
  }

  return desc;
}

/**
 * 基于规则推断 commit type 和 message（项目定制版）
 */
function ruleBasedGenerate(diff) {
  let type = 'chore';
  const messages = [];

  const allFiles = diff.files.map((f) => f.file.toLowerCase());
  const { skillGroups, nonSkillFiles } = diff;

  // ── Skill 维度分析（项目核心逻辑） ──

  const hasSkillChanges = skillGroups.length > 0;
  const hasOnlySkillChanges = hasSkillChanges && nonSkillFiles.length === 0;
  const hasStorageOnly =
    hasSkillChanges &&
    skillGroups.every((g) => g.hasStorage && g.files.length === 1);

  // 场景 1：纯 storage 发布（打包产物）
  if (hasStorageOnly && hasOnlySkillChanges) {
    type = 'chore';
    const names = skillGroups.map((g) => {
      const fm = readSkillFrontmatter(g.skillName);
      return fm?.name || g.skillName;
    });
    if (names.length <= 3) {
      messages.push(`发布 skill: ${names.join('、')}`);
    } else {
      messages.push(`发布 ${names.length} 个 skill`);
    }
    return { type, message: messages.join('；') };
  }

  // 场景 2：新增 skill 模块
  const newSkills = skillGroups.filter((g) => g.isNew && g.hasDoc && g.hasMeta);
  if (
    newSkills.length > 0 &&
    nonSkillFiles.length === 0 &&
    skillGroups.every((g) => g.isNew)
  ) {
    type = 'feat';
    const names = newSkills.map((g) => {
      const fm = readSkillFrontmatter(g.skillName);
      return fm?.name || g.skillName;
    });
    if (names.length === 1) {
      messages.push(`新增 skill「${names[0]}」`);
      const fm = readSkillFrontmatter(newSkills[0].skillName);
      if (fm?.description) {
        messages.push(
          fm.description.length > 60
            ? fm.description.slice(0, 60) + '...'
            : fm.description
        );
      }
    } else {
      messages.push(`新增 ${names.length} 个 skill: ${names.join('、')}`);
    }
    return { type, message: messages.join('；') };
  }

  // 场景 2.5：删除 skill 模块
  const deletedSkills = skillGroups.filter(
    (g) => g.isDeleted && g.files.every((f) => f.status === 'D')
  );
  if (
    deletedSkills.length > 0 &&
    nonSkillFiles.length === 0 &&
    skillGroups.every((g) => g.isDeleted)
  ) {
    type = 'chore';
    const names = deletedSkills.map((g) => {
      const fm = readSkillFrontmatter(g.skillName);
      return fm?.name || g.skillName;
    });
    if (names.length === 1) {
      messages.push(`删除 skill「${names[0]}」`);
    } else {
      messages.push(`删除 ${names.length} 个 skill: ${names.join('、')}`);
    }
    return { type, message: messages.join('；') };
  }

  // 场景 3：更新已有 skill（SKILL.md 或 beehive-skill.json）
  const updatedSkills = skillGroups.filter((g) => !g.isNew && !g.hasStorage);
  if (updatedSkills.length > 0 && nonSkillFiles.length === 0) {
    type = 'feat';
    if (updatedSkills.length <= 2) {
      for (const g of updatedSkills) {
        messages.push(describeSkillChanges(g));
      }
    } else {
      messages.push(`更新 ${updatedSkills.length} 个 skill`);
    }
    return { type, message: messages.join('；') };
  }

  // 场景 4：混合变更（skill + 非 skill）
  if (hasSkillChanges && nonSkillFiles.length > 0) {
    type = 'feat';
    for (const g of skillGroups.slice(0, 2)) {
      messages.push(describeSkillChanges(g));
    }
    if (skillGroups.length > 2) {
      messages.push(`等 ${skillGroups.length} 个 skill`);
    }
    // 非 skill 文件概述
    messages.push(`其他 ${nonSkillFiles.length} 个文件变更`);
    return { type, message: messages.join('；') };
  }

  // ── 通用文件分析（非 skill 变更） ──

  // revert
  if (diff.diffContent.includes('This reverts commit')) {
    type = 'revert';
    messages.push('回滚之前的提交');
  }
  // docs
  else if (
    allFiles.every((f) => /\.(md|mdx|txt|rst)$/.test(f)) ||
    allFiles.every((f) => f.includes('doc') || f.includes('readme'))
  ) {
    type = 'docs';
    if (diff.newFiles.length > 0)
      messages.push(
        `新增文档: ${diff.newFiles.map((f) => basename(f)).join(', ')}`
      );
    if (diff.modifiedFiles.length > 0)
      messages.push(
        `更新文档: ${diff.modifiedFiles.map((f) => basename(f)).join(', ')}`
      );
    if (diff.deletedFiles.length > 0)
      messages.push(
        `删除文档: ${diff.deletedFiles.map((f) => basename(f)).join(', ')}`
      );
  }
  // test
  else if (
    allFiles.every((f) => /test|spec|__test__|\.test\.|\.spec\./.test(f))
  ) {
    type = 'test';
    messages.push('更新测试用例');
  }
  // ci
  else if (
    allFiles.every((f) =>
      /ci|github|gitlab|\.yml$|\.yaml$|dockerfile|jenkins/.test(f)
    )
  ) {
    type = 'ci';
    messages.push('更新 CI/CD 配置');
  }
  // build
  else if (
    allFiles.every((f) =>
      /package\.json|pnpm-lock|tsconfig|webpack|vite|rollup|build/.test(f)
    )
  ) {
    type = 'build';
    messages.push('更新项目配置');
  }
  // style
  else if (
    allFiles.every((f) => /\.(css|scss|less|json|prettierrc|eslintrc)$/.test(f))
  ) {
    type = 'style';
    messages.push('调整代码格式');
  }
  // 有新增文件
  else if (
    diff.newFiles.length > 0 &&
    diff.stats.insertions > diff.stats.deletions * 2
  ) {
    type = 'feat';
    const newNames = diff.newFiles.map((f) => basename(f, extname(f)));
    messages.push(
      newNames.length <= 3
        ? `新增 ${newNames.join(', ')}`
        : `新增 ${newNames.length} 个文件`
    );
  }
  // 修改为主
  else if (diff.modifiedFiles.length > 0) {
    const modNames = diff.modifiedFiles.map((f) => basename(f, extname(f)));
    messages.push(
      modNames.length <= 3
        ? `更新 ${modNames.join(', ')}`
        : `更新 ${modNames.length} 个文件`
    );
  }

  if (messages.length === 0) {
    messages.push(`变更 ${diff.stats.files} 个文件`);
  }

  return { type, message: messages.join('；') };
}

// ─── AI 生成引擎 ────────────────────────────────────────

/**
 * 加载 AI 配置
 */
function loadAiConfig() {
  const configPaths = ['.commit-ai.json', '.git/.commit-ai.json'];
  for (const p of configPaths) {
    const fullPath = resolve(process.cwd(), p);
    if (existsSync(fullPath)) {
      try {
        return JSON.parse(readFileSync(fullPath, 'utf-8'));
      } catch {
        printWarn(`AI 配置文件 ${p} 格式错误，已跳过`);
      }
    }
  }
  return null;
}

/**
 * 调用 AI API 生成 commit message
 */
async function aiGenerate(diff) {
  const config = loadAiConfig();
  if (!config) {
    printWarn('未找到 AI 配置文件 .commit-ai.json，回退到规则模式');
    return null;
  }

  if (!config.apiUrl || !config.apiKey || !config.model) {
    printWarn('AI 配置不完整（需要 apiUrl / apiKey / model），回退到规则模式');
    return null;
  }

  const { apiUrl, apiKey, model } = config;

  // 截断过大的 diff
  let diffForAi = diff.diffContent;
  if (diffForAi.length > 6000) {
    diffForAi = diffForAi.slice(0, 6000) + '\n... [truncated]';
  }

  const systemPrompt = `你是一个 Git 提交信息生成助手。根据用户提供的 git diff 内容，生成一条符合 Conventional Commits 规范的提交信息。

项目背景：这是一个 AI 能力库（Skills 仓库），每个 skill 是一个独立模块，位于 skills/packages/<name>/ 目录下，包含 SKILL.md（技能描述）和 beehive-skill.json（元数据）。skills/storage/ 下存储打包产物（.tgz）。

规则：
1. 格式: <type>(<scope>): <subject>
2. type 只能是: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
3. scope 用 skill 名称，非 skill 变更用文件目录名
4. 新增 skill 用 feat，发布打包产物用 chore，更新 skill 文档用 feat
5. subject 用中文描述，简洁准确，不超过 50 字
6. 只输出提交信息本身，不要任何解释或多余文字`;

  const userPrompt = `以下是 git diff 内容：\n\n变更文件: ${diff.files.map((f) => `${f.status} ${f.file}`).join(', ')}\n统计: ${diff.stats.insertions} insertions(+), ${diff.stats.deletions} deletions(-)\n\n\`\`\`diff\n${diffForAi}\n\`\`\``;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      printWarn(
        `AI API 返回错误 (${response.status}): ${errText.slice(0, 200)}`
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      printWarn('AI 返回内容为空');
      return null;
    }

    // 解析 AI 返回的 type(scope): message 格式
    const match = content.match(/^(\w+)(?:\(([^)]*)\))?:\s*(.+)$/);
    if (match) {
      return { type: match[1], scope: match[2] || '', message: match[3] };
    }

    return { type: 'chore', message: content };
  } catch (e) {
    printWarn(`AI 请求失败: ${e.message}`);
    return null;
  }
}

// ─── CLI / 自动提交 ───────────────────────────────────────

function parseCliArgs(argv) {
  return {
    auto: argv.includes('--auto') || argv.includes('-y'),
    skipChangelog: argv.includes('--no-changelog'),
    push: argv.includes('--push'),
  };
}

function extractCommitSubject(commitMsg) {
  const match = commitMsg.match(/^(\w+)(?:\([^)]*\))?:\s*(.+)$/);
  return match ? match[2] : commitMsg;
}

function ensureGitRepo() {
  try {
    exec('git rev-parse --is-inside-work-tree');
  } catch {
    printError('当前目录不是 Git 仓库');
    process.exit(1);
  }
}

function stageChangesExcludingChangelog() {
  let stagedFiles;
  try {
    stagedFiles = exec('git diff --cached --name-only');
  } catch {
    stagedFiles = '';
  }

  if (!stagedFiles) {
    printInfo('暂存区为空，自动执行 git add .');
    exec('git add .');
  }

  try {
    exec(`git restore --staged -- ${CHANGELOG_FILE}`);
  } catch {
    // changelog 未暂存时可忽略
  }

  try {
    return exec('git diff --cached --name-only');
  } catch {
    return '';
  }
}

function performCommit(commitMsg) {
  const escapedMsg = commitMsg.replace(/"/g, '\\"');
  exec(`git commit -m "${escapedMsg}"`);
}

async function syncChangelog(commitMsg) {
  const title = extractCommitSubject(commitMsg);
  const result = await updateChangelog({
    message: title,
    rootDir: process.cwd(),
  });

  if (!result.updated) {
    printInfo('Changelog 无新增内容，跳过');
    return false;
  }

  printSuccess(`Changelog 已更新 (${result.commitCount} 条提交)`);
  exec(`git add -- ${CHANGELOG_FILE}`);
  performCommit(CHANGELOG_COMMIT_MSG);
  return true;
}

async function pushCurrentBranch() {
  try {
    printInfo('正在推送...');
    let branch;
    try {
      branch = exec('git branch --show-current');
    } catch {
      branch = exec('git rev-parse --abbrev-ref HEAD');
    }
    exec(`git push origin ${branch}`);
    printSuccess(`已推送到 origin/${branch}`);
  } catch (e) {
    printError(`推送失败: ${e.message}`);
    process.exit(1);
  }
}

function printDiffSummary(diff) {
  println(`\n\x1b[1m本次变更:\x1b[0m`);
  println('');

  if (diff.skillGroups.length > 0) {
    for (const g of diff.skillGroups) {
      const meta = readSkillMeta(g.skillName);
      const fm = readSkillFrontmatter(g.skillName);
      const label = fm?.name || g.skillName;
      const ver = meta?.version ? ` \x1b[90mv${meta.version}\x1b[0m` : '';
      let action;
      if (g.isDeleted) {
        action = '\x1b[31m删除\x1b[0m';
      } else if (g.hasStorage) {
        action = '\x1b[35m发布\x1b[0m';
      } else if (g.isNew) {
        action = '\x1b[32m新增\x1b[0m';
      } else {
        action = '\x1b[33m更新\x1b[0m';
      }
      const details = [];
      if (g.hasDoc) details.push('文档');
      if (g.hasMeta) details.push('配置');
      const otherCount = g.files.filter(
        (f) =>
          basename(f.file) !== SKILL_DOC_FILE &&
          basename(f.file) !== SKILL_META_FILE &&
          !f.file.includes(STORAGE_DIR)
      ).length;
      if (otherCount > 0) details.push(`其他 ${otherCount} 个文件`);
      const detailStr =
        details.length > 0 && !g.hasStorage
          ? ` \x1b[90m(${details.join('、')})\x1b[0m`
          : '';
      println(`  ${action} skill「\x1b[1m${label}\x1b[0m」${ver}${detailStr}`);
    }
    if (diff.nonSkillFiles.length > 0) {
      println('');
      println(`  \x1b[90m其他文件:\x1b[0m`);
      for (const f of diff.nonSkillFiles) {
        const statusColors = {
          A: '\x1b[32m新增\x1b[0m',
          M: '\x1b[33m修改\x1b[0m',
          D: '\x1b[31m删除\x1b[0m',
          R: '\x1b[36m重命名\x1b[0m',
        };
        const s = statusColors[f.status] || f.status;
        println(`    ${s} ${f.file}`);
      }
    }
  } else {
    const added = diff.files.filter((f) => f.status === 'A');
    const modified = diff.files.filter((f) => f.status === 'M');
    const deleted = diff.files.filter((f) => f.status === 'D');
    const renamed = diff.files.filter((f) => f.status === 'R');

    if (added.length > 0) {
      println(
        `  \x1b[32m新增\x1b[0m ${added.map((f) => basename(f.file)).join('、')}`
      );
    }
    if (modified.length > 0) {
      println(
        `  \x1b[33m修改\x1b[0m ${modified.map((f) => basename(f.file)).join('、')}`
      );
    }
    if (deleted.length > 0) {
      println(
        `  \x1b[31m删除\x1b[0m ${deleted.map((f) => basename(f.file)).join('、')}`
      );
    }
    if (renamed.length > 0) {
      println(
        `  \x1b[36m重命名\x1b[0m ${renamed.map((f) => basename(f.file)).join('、')}`
      );
    }
  }
  println('');
}

async function runAutoCommit(options) {
  println('\n\x1b[1m🤖 Git Auto Commit\x1b[0m\n');
  ensureGitRepo();

  const stagedFiles = stageChangesExcludingChangelog();
  if (!stagedFiles) {
    printError('没有任何可提交的变更');
    process.exit(1);
  }

  printInfo('正在分析变更...');
  const diff = analyzeDiff();
  printDiffSummary(diff);

  const generated = ruleBasedGenerate(diff);
  const commitScope = inferScope(diff);
  const scopeStr = commitScope ? `(${commitScope})` : '';
  const commitMsg = `${generated.type}${scopeStr}: ${generated.message}`;

  println(`\x1b[1m提交信息:\x1b[0m \x1b[33m${commitMsg}\x1b[0m`);

  try {
    performCommit(commitMsg);
    printSuccess(`提交成功: ${commitMsg}`);
    println(`  ${exec('git log --oneline -1')}`);
  } catch (e) {
    printError(`提交失败: ${e.message}`);
    process.exit(1);
  }

  if (!options.skipChangelog) {
    try {
      await syncChangelog(commitMsg);
    } catch (e) {
      printError(`Changelog 更新失败: ${e.message}`);
      process.exit(1);
    }
  }

  if (options.push) {
    await pushCurrentBranch();
  }

  println('\n\x1b[1m🎉 完成！\x1b[0m\n');
}

// ─── 主流程 ─────────────────────────────────────────────

async function main() {
  const options = parseCliArgs(process.argv);
  if (options.auto) {
    await runAutoCommit(options);
    return;
  }

  println('\n\x1b[1m🤖 Git Smart Commit Helper\x1b[0m\n');

  // 1. 检查 Git 仓库
  try {
    exec('git rev-parse --is-inside-work-tree');
  } catch {
    printError('当前目录不是 Git 仓库');
    process.exit(1);
  }

  // 2. 检查暂存区
  let stagedFiles;
  try {
    stagedFiles = exec('git diff --cached --name-only');
  } catch {
    stagedFiles = '';
  }

  if (!stagedFiles) {
    printInfo('暂存区为空，自动执行 git add .');
    try {
      exec('git add .');
      stagedFiles = exec('git diff --cached --name-only');
      if (!stagedFiles) {
        printError('没有任何可提交的变更');
        process.exit(1);
      }
    } catch {
      printError('git add 失败');
      process.exit(1);
    }
  }

  // 3. 分析 diff
  printInfo('正在分析变更...');
  const diff = analyzeDiff();

  // 4. 显示变更摘要（含 skill 维度）
  println(`\n\x1b[1m本次变更:\x1b[0m`);
  println('');

  // 按 skill 分组展示
  if (diff.skillGroups.length > 0) {
    for (const g of diff.skillGroups) {
      const meta = readSkillMeta(g.skillName);
      const fm = readSkillFrontmatter(g.skillName);
      const label = fm?.name || g.skillName;
      const ver = meta?.version ? ` \x1b[90mv${meta.version}\x1b[0m` : '';
      // 生成动作描述
      let action;
      if (g.isDeleted) {
        action = '\x1b[31m删除\x1b[0m';
      } else if (g.hasStorage) {
        action = '\x1b[35m发布\x1b[0m';
      } else if (g.isNew) {
        action = '\x1b[32m新增\x1b[0m';
      } else {
        action = '\x1b[33m更新\x1b[0m';
      }
      // 变更内容细节
      const details = [];
      if (g.hasDoc) details.push('文档');
      if (g.hasMeta) details.push('配置');
      const otherCount = g.files.filter(
        (f) =>
          basename(f.file) !== SKILL_DOC_FILE &&
          basename(f.file) !== SKILL_META_FILE &&
          !f.file.includes(STORAGE_DIR)
      ).length;
      if (otherCount > 0) details.push(`其他 ${otherCount} 个文件`);
      const detailStr =
        details.length > 0 && !g.hasStorage
          ? ` \x1b[90m(${details.join('、')})\x1b[0m`
          : '';
      println(`  ${action} skill「\x1b[1m${label}\x1b[0m」${ver}${detailStr}`);
    }
    if (diff.nonSkillFiles.length > 0) {
      println('');
      println(`  \x1b[90m其他文件:\x1b[0m`);
      for (const f of diff.nonSkillFiles) {
        const statusColors = {
          A: '\x1b[32m新增\x1b[0m',
          M: '\x1b[33m修改\x1b[0m',
          D: '\x1b[31m删除\x1b[0m',
          R: '\x1b[36m重命名\x1b[0m',
        };
        const s = statusColors[f.status] || f.status;
        println(`    ${s} ${f.file}`);
      }
    }
  } else {
    // 无 skill 变更，按操作类型分组展示
    const added = diff.files.filter((f) => f.status === 'A');
    const modified = diff.files.filter((f) => f.status === 'M');
    const deleted = diff.files.filter((f) => f.status === 'D');
    const renamed = diff.files.filter((f) => f.status === 'R');

    if (added.length > 0) {
      println(
        `  \x1b[32m新增\x1b[0m ${added.map((f) => basename(f.file)).join('、')}`
      );
    }
    if (modified.length > 0) {
      println(
        `  \x1b[33m修改\x1b[0m ${modified.map((f) => basename(f.file)).join('、')}`
      );
    }
    if (deleted.length > 0) {
      println(
        `  \x1b[31m删除\x1b[0m ${deleted.map((f) => basename(f.file)).join('、')}`
      );
    }
    if (renamed.length > 0) {
      println(
        `  \x1b[36m重命名\x1b[0m ${renamed.map((f) => basename(f.file)).join('、')}`
      );
    }
  }
  println('');

  // 5. 选择生成模式
  const hasAiConfig = !!loadAiConfig();

  const modeOptions = [{ label: '🧩 规则分析（快速，零依赖）', value: 'rule' }];
  if (hasAiConfig) {
    modeOptions.push({ label: '🤖 AI 生成（智能分析 diff）', value: 'ai' });
  } else {
    modeOptions.push({
      label: '🤖 AI 生成（需配置 .commit-ai.json）',
      value: 'ai',
    });
  }
  modeOptions.push({ label: '✏️  手动输入', value: 'manual' });

  const mode = await select('选择提交信息生成方式:', modeOptions);

  let commitType, commitScope, commitMessage;

  if (mode.value === 'rule') {
    // ── 规则分析模式 ──
    printInfo('正在基于规则分析变更...');
    const generated = ruleBasedGenerate(diff);
    commitType = generated.type;
    commitScope = inferScope(diff);
    commitMessage = generated.message;
    printSuccess('分析完成');
  } else if (mode.value === 'ai') {
    // ── AI 生成模式 ──
    printInfo('正在调用 AI 分析 diff...');
    const aiResult = await aiGenerate(diff);
    if (aiResult) {
      commitType = aiResult.type;
      commitScope = aiResult.scope || inferScope(diff);
      commitMessage = aiResult.message;
      printSuccess('AI 分析完成');
    } else {
      printWarn('AI 生成失败，回退到规则模式');
      const generated = ruleBasedGenerate(diff);
      commitType = generated.type;
      commitScope = inferScope(diff);
      commitMessage = generated.message;
    }
  } else {
    // ── 手动模式 ──
    commitType = null;
    commitScope = '';
    commitMessage = '';
  }

  // 6. 交互确认/编辑
  if (mode.value !== 'manual') {
    // 显示自动生成的结果
    const scopeStr = commitScope ? `(${commitScope})` : '';
    const fullMsg = `${commitType}${scopeStr}: ${commitMessage}`;
    println(`\n\x1b[1m自动生成的提交信息:\x1b[0m`);
    println(`  \x1b[33m${fullMsg}\x1b[0m`);

    const action = await select('下一步操作:', [
      { label: '✅ 直接使用这条提交信息', value: 'accept' },
      { label: '✏️  编辑提交信息', value: 'edit' },
      { label: '🔄 重新生成', value: 'regenerate' },
      { label: '❌ 取消', value: 'cancel' },
    ]);

    if (action.value === 'cancel') {
      printInfo('已取消提交');
      rl.close();
      process.exit(0);
    }

    if (action.value === 'edit') {
      // 允许分别编辑 type / scope / message
      const typeObj = COMMIT_TYPES.find((t) => t.value === commitType);
      const newType = await select(
        `提交类型 (当前: ${commitType}):`,
        COMMIT_TYPES
      );
      commitType = newType.value;

      const newScope = await ask(
        `scope (当前: ${commitScope || '无'}，回车保持): `
      );
      if (newScope) commitScope = newScope;

      const newMsg = await ask(`提交信息 (当前: ${commitMessage}，回车保持): `);
      if (newMsg) commitMessage = newMsg;
    }

    if (action.value === 'regenerate') {
      // 手动选择 type + 自动 message
      const typeObj = await select('重新选择提交类型:', COMMIT_TYPES);
      commitType = typeObj.value;
      // 重新生成 message
      const regenerated = ruleBasedGenerate(diff);
      commitMessage = regenerated.message;
      commitScope = inferScope(diff);
      println(
        `  新提交信息: \x1b[33m${commitType}(${commitScope}): ${commitMessage}\x1b[0m`
      );

      const editMsg = await ask(
        '需要修改提交信息吗？(回车跳过 / 输入新信息): '
      );
      if (editMsg) commitMessage = editMsg;
    }
  } else {
    // 手动输入模式
    const typeObj = await select('请选择提交类型:', COMMIT_TYPES);
    commitType = typeObj.value;
    commitScope = await ask('请输入 scope（可选，直接回车跳过）: ');
    commitMessage = await ask('请输入提交信息: ');
    if (!commitMessage) {
      printError('提交信息不能为空');
      rl.close();
      process.exit(1);
    }
  }

  // 7. 构建最终 commit message
  const scopeStr = commitScope ? `(${commitScope})` : '';
  const commitMsg = `${commitType}${scopeStr}: ${commitMessage}`;

  // 8. 最终确认
  println(`\n\x1b[1m最终提交信息:\x1b[0m \x1b[33m${commitMsg}\x1b[0m`);
  const confirm = await ask('\n确认提交？(Y/n): ');

  if (confirm.toLowerCase() === 'n') {
    printInfo('已取消提交');
    rl.close();
    process.exit(0);
  }

  // 9. 执行提交
  try {
    const escapedMsg = commitMsg.replace(/"/g, '\\"');
    exec(`git commit -m "${escapedMsg}"`);
    printSuccess(`提交成功: ${commitMsg}`);

    const log = exec('git log --oneline -1');
    println(`  ${log}`);
  } catch (e) {
    printError(`提交失败: ${e.message}`);
    process.exit(1);
  }

  // 10. 询问是否推送
  const push = await ask('\n是否推送到远程？(y/N): ');
  if (push.toLowerCase() === 'y') {
    try {
      printInfo('正在推送...');
      let branch;
      try {
        branch = exec('git branch --show-current');
      } catch {
        branch = exec('git rev-parse --abbrev-ref HEAD');
      }
      exec(`git push origin ${branch}`);
      printSuccess(`已推送到 origin/${branch}`);
    } catch (e) {
      printError(`推送失败: ${e.message}`);
      process.exit(1);
    }
  }

  rl.close();
  println('\n\x1b[1m🎉 完成！\x1b[0m\n');
  process.exit(0);
}

main().catch((err) => {
  printError(err.message);
  rl.close();
  process.exit(1);
});
