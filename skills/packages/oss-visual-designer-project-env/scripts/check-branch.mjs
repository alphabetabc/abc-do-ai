#!/usr/bin/env node
// check-branch.mjs —— 分支检查脚本（Node.js ES Modules）
// 用法:
//   node .trae/skills/oss-visual-designer-project-env/scripts/check-branch.mjs
//   node .trae/skills/oss-visual-designer-project-env/scripts/check-branch.mjs --branch main
//   node .trae/skills/oss-visual-designer-project-env/scripts/check-branch.mjs -y
//   node .trae/skills/oss-visual-designer-project-env/scripts/check-branch.mjs -h

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createInterface } from 'node:readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 项目根目录：skills/oss-visual-designer-project-env/scripts -> 上溯 4 级
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');

const DEFAULT_EXPECTED_BRANCH = 'release-shaanxi-unicom';

function parseArgs(argv) {
    const args = { branch: DEFAULT_EXPECTED_BRANCH, yes: false, help: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '-h' || a === '--help') args.help = true;
        else if (a === '-y' || a === '--yes') args.yes = true;
        else if (a === '--branch') {
            const next = argv[i + 1];
            if (!next || next.startsWith('-')) {
                process.stderr.write('[check-branch] --branch 需要一个参数\n');
                process.exit(1);
            }
            args.branch = next;
            i++;
        } else {
            process.stderr.write(`[check-branch] 未知参数: ${a}\n`);
            process.exit(1);
        }
    }
    return args;
}

function showHelp() {
    const help = [
        '用法: node check-branch.mjs [选项]',
        '',
        '选项:',
        '  --branch <name>   自定义期望分支（默认: ' + DEFAULT_EXPECTED_BRANCH + '）',
        '  -y, --yes         非交互模式，不询问直接继续',
        '  -h, --help        显示帮助',
        '',
        '退出码:',
        '  0  分支匹配或用户确认继续',
        '  1  分支不匹配且用户取消 / git 不可用 / 非 TTY 且未传 --yes',
    ];
    process.stdout.write(help.join('\n') + '\n');
}

function getCurrentBranch() {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
            cwd: projectRoot,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        return branch;
    } catch (err) {
        process.stderr.write(`[check-branch] git 不可用或不在 git 仓库中: ${err.message}\n`);
        process.exit(1);
    }
}

async function prompt(question) {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stderr });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        showHelp();
        process.exit(0);
    }

    const current = getCurrentBranch();

    if (current === args.branch) {
        process.stdout.write(`✅ 分支匹配: ${current}\n`);
        process.exit(0);
    }

    // 不匹配
    process.stderr.write(`⚠️  当前分支 "${current}" 与期望分支 "${args.branch}" 不一致\n`);
    process.stderr.write('风险项:\n');
    process.stderr.write('  - 依赖版本（overrides）可能与该分支配置不匹配\n');
    process.stderr.write('  - .pnpmfile.cjs 注入规则可能与该分支约束不一致\n');
    process.stderr.write('  - 直接修改可能导致切换分支后依赖树错乱\n');

    // 非 TTY 检测
    if (!process.stdin.isTTY && !args.yes) {
        process.stderr.write('[check-branch] 非交互终端且未传 --yes，已取消\n');
        process.exit(1);
    }

    if (args.yes) {
        process.stderr.write('[check-branch] --yes 已指定，继续执行\n');
        process.exit(0);
    }

    const answer = await prompt('是否仍要继续？(y/N) ');
    if (answer.trim().toLowerCase() === 'y') {
        process.stdout.write('继续执行\n');
        process.exit(0);
    } else {
        process.stderr.write('已取消\n');
        process.exit(1);
    }
}

main();
