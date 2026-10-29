/**
 * Skill 分类器 —— 被 commit.mjs 和 update-changelog.mjs 共用
 *
 * 提供统一的 skill 识别 / 文件分组 / 动作判定逻辑，避免两个文件各自维护
 * 一份有细微差异（且都有 Bug）的副本。
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

// ─── 常量 ───────────────────────────────────────────────

export const SKILLS_DIR = 'skills/packages';
export const STORAGE_DIR = 'skills/storage';
export const SKILL_META_FILE = 'beehive-skill.json';
export const SKILL_DOC_FILE = 'SKILL.md';

/** 用于判定「新增 skill」的核心文件：只有这些文件是 A 状态才算新增 */
const CORE_FILES = [SKILL_DOC_FILE, SKILL_META_FILE];

// ─── 路径识别 ───────────────────────────────────────────

/**
 * 从文件路径中提取 skill 名称
 *   skills/packages/agent-creator/SKILL.md         → agent-creator
 *   skills/storage/agent-creator/agent-creator@0.0.0.tgz → agent-creator
 * 非 skill 路径返回 null
 */
export function extractSkillName(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const pkgMatch = normalized.match(new RegExp(`^${SKILLS_DIR}/([^/]+)/`));
  if (pkgMatch) return pkgMatch[1];
  const storMatch = normalized.match(new RegExp(`^${STORAGE_DIR}/([^/]+)/`));
  if (storMatch) return storMatch[1];
  return null;
}

/** 判断文件是否位于 storage 目录（打包产物） */
export function isStorageFile(filePath) {
  return filePath.includes(`${STORAGE_DIR}/`);
}

/** 判断文件是否为 skill 核心文件（SKILL.md / beehive-skill.json） */
export function isCoreFile(filePath) {
  return CORE_FILES.includes(basename(filePath));
}

// ─── 元信息读取 ─────────────────────────────────────────

/**
 * 读取 skill 元信息（从 beehive-skill.json）
 * @param {string} rootDir 仓库根目录
 * @param {string} skillName skill 目录名
 */
export function readSkillMeta(rootDir, skillName) {
  const metaPath = resolve(rootDir, SKILLS_DIR, skillName, SKILL_META_FILE);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * 从 SKILL.md frontmatter 提取 name 和 description
 */
export function readSkillFrontmatter(rootDir, skillName) {
  const mdPath = resolve(rootDir, SKILLS_DIR, skillName, SKILL_DOC_FILE);
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
 * 获取 skill 的展示标签：优先 beehive-skill.json 的 id/name，回退目录名
 */
export function getSkillLabel(rootDir, skillName) {
  const meta = readSkillMeta(rootDir, skillName);
  return meta?.id || meta?.name || skillName;
}

// ─── 文件分组 ───────────────────────────────────────────

/**
 * 将 diff 文件列表按 skill 维度分组
 *
 * 每个 skillGroup 包含：
 *   - skillName      skill 目录名
 *   - files          该 skill 下的所有文件变更
 *   - hasMeta        beehive-skill.json 有变更
 *   - hasDoc         SKILL.md 有变更
 *   - hasStorage     storage 打包产物有变更（含删除）
 *   - isPublished    storage 产物是新增或修改（A/M）；仅删除 .tgz 不算发布
 *   - isUnpublished  只删除了 storage .tgz，源码仍在（撤回发布）
 *   - isNew          核心文件（SKILL.md / beehive-skill.json）是 A 状态
 *   - isUpdate       核心文件是 M 状态（且不是新增）
 *   - isDeleted      packages 下文件全是 D 状态
 *   - storageStatus  发布相关的 storage status；仅删除时为 D
 *
 * @param {Array<{status: string, file: string}>} files
 * @returns {{ skillGroups: SkillGroup[], nonSkillFiles: Array<{status, file}> }}
 */
export function classifyFiles(files) {
  const groups = new Map();
  const nonSkillFiles = [];

  for (const f of files) {
    const skillName = extractSkillName(f.file);
    if (!skillName) {
      nonSkillFiles.push(f);
      continue;
    }

    if (!groups.has(skillName)) {
      groups.set(skillName, {
        skillName,
        files: [],
        hasMeta: false,
        hasDoc: false,
        hasStorage: false,
        isPublished: false,
        isUnpublished: false,
        isNew: false,
        isUpdate: false,
        isDeleted: false,
        storageStatus: null,
      });
    }

    const g = groups.get(skillName);
    g.files.push(f);

    const base = basename(f.file);
    if (base === SKILL_META_FILE) g.hasMeta = true;
    if (base === SKILL_DOC_FILE) g.hasDoc = true;

    if (isStorageFile(f.file)) {
      g.hasStorage = true;
      // 发布 = 打包产物新增或修改。只删掉 .tgz、源码仍留在 packages 时不是发布。
      // 换版本常见「旧包 D + 新包 A」，只要存在 A/M 就仍算发布，不能被后面的 D 盖掉。
      if (f.status === 'A' || f.status === 'M') {
        g.isPublished = true;
        g.storageStatus = f.status;
      } else if (!g.isPublished) {
        g.storageStatus = f.status;
      }
      continue; // storage 文件不参与新增/更新/删除判定
    }

    // 核心 bug 修复：只有核心文件是 A 才算新增 skill
    // 之前是「任意一个 A 文件就算新增」，导致更新已有 skill 时
    // 顺手新增了 CHANGELOG.md / references/* 就被误判成新增
    if (f.status === 'A' && isCoreFile(f.file)) {
      g.isNew = true;
    }
    if (f.status === 'M' && isCoreFile(f.file)) {
      g.isUpdate = true;
    }
    if (f.status === 'D') {
      g.isDeleted = true;
    }
  }

  // 二次判定：只有 packages 下所有文件都是 D，才是真正的删除；
  // 否则把循环里宽松置上的 isDeleted 清掉，避免单个 D 文件误判
  for (const g of groups.values()) {
    const pkgFiles = g.files.filter((f) => !isStorageFile(f.file));
    if (pkgFiles.length > 0 && pkgFiles.every((f) => f.status === 'D')) {
      g.isDeleted = true;
      g.isNew = false;
      g.isUpdate = false;
    } else {
      g.isDeleted = false;
    }
    // 只删掉打包产物、源码还在：撤回发布。旧包 D + 新包 A 仍是发布，不算撤回。
    const removedStorage = g.files.some(
      (f) => isStorageFile(f.file) && f.status === 'D'
    );
    g.isUnpublished = removedStorage && !g.isPublished && !g.isDeleted;
  }

  return { skillGroups: [...groups.values()], nonSkillFiles };
}

// ─── 动作判定 ───────────────────────────────────────────

/**
 * 判定单个 skill group 的动作类型
 * @returns {'新增'|'更新'|'删除'|'发布'|null}
 *   - 如果 storage 产物是新增或修改（packages 没动）→ '发布'
 *   - 如果核心文件是新增 → '新增'
 *   - 如果 packages 下全删 → '删除'
 *   - 如果核心文件是修改 → '更新'
 *   - 仅删除 storage .tgz（撤回发布、只留源码）→ null
 *     调用方用 isUnpublished 单独记一条「撤回发布」，不和「发布」混用
 *   - 否则 null（无法判定）
 *
 * 注意：同一个 commit 里「更新 + 发布」会通过 isPublished + isUpdate
 * 两个标志同时为 true 来表达，调用方需要分别生成两条 bullet。
 * 「更新 + 撤回发布」同理，用 isUnpublished 额外记一条。
 */
export function getSkillAction(group) {
  if (group.isDeleted) return '删除';
  if (group.isNew) return '新增';
  if (group.isUpdate) return '更新';
  if (group.isPublished) return '发布';
  return null;
}

/**
 * 被删除的 storage 包版本，来自 `name@version.tgz`。
 * 源码里的 beehive-skill.json 可能还在，不能用它代表已撤回的发布版本。
 * @returns {string[]} 如 ['0.0.0']
 */
export function removedStorageVersions(group) {
  const versions = [];
  for (const f of group.files || []) {
    if (!isStorageFile(f.file) || f.status !== 'D') continue;
    const matched = f.file.match(/@([^/@]+)\.tgz$/);
    if (matched) versions.push(matched[1]);
  }
  return versions;
}
