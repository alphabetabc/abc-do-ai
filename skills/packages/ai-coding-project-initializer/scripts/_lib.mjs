/**
 * _lib.mjs — 脚本共享工具
 *
 * 供 init.mjs / new-spec.mjs / legacy-change.mjs 复用，避免重复实现。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES = path.join(__dirname, '..', 'references', 'templates');

/**
 * 读取模板并替换 {KEY} 占位符。
 * @param {string} templateRelPath — 相对 templates/ 的路径
 * @param {Record<string, string>} vars — 占位符键值
 * @returns {string}
 */
export function render(templateRelPath, vars = {}) {
  const templatePath = path.join(TEMPLATES, templateRelPath);
  let content = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    content = content.replaceAll(`{${key}}`, value);
  }
  return content;
}

/**
 * 校验"编号-短名"格式：小写字母、数字、短横线，以字母或数字开头。
 * 例：001-model-management、fix-login-redirect
 * @param {string} name
 * @throws {Error} 格式不合法时抛错
 */
export function validateSlug(name) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `✗ 名称必须使用小写字母、数字、短横线，且以字母或数字开头（如 001-model-management）\n  收到: ${name}`
    );
  }
}

/**
 * 写文件；已存在时跳过（除非 overwrite）。
 * @returns {boolean} 是否实际写入
 */
export function writeFile(filePath, content, { overwrite = false, cwd = process.cwd() } = {}) {
  if (!overwrite && fs.existsSync(filePath)) {
    console.log(`  跳过（已存在）: ${path.relative(cwd, filePath)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  创建: ${path.relative(cwd, filePath)}`);
  return true;
}

/** 创建 .gitkeep 占位 */
export function gitkeep(dir, { cwd = process.cwd() } = {}) {
  writeFile(path.join(dir, '.gitkeep'), '', { cwd });
}

/**
 * 递归复制模板目录到目标，支持占位符替换。
 */
export function copyTemplateDir(templateRelDir, destDir, vars = {}, opts = {}) {
  const srcDir = path.join(TEMPLATES, templateRelDir);
  if (!fs.existsSync(srcDir)) return;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTemplateDir(path.join(templateRelDir, entry.name), destPath, vars, opts);
    } else {
      const content = render(path.join(templateRelDir, entry.name), vars);
      writeFile(destPath, content, opts);
    }
  }
}

export { TEMPLATES };
