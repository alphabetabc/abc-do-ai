#!/usr/bin/env node
/**
 * check-branch.mjs
 * 在执行 oss-visual-material-project-pnpm skill 前检查当前 git 分支
 * 本 skill 配置针对 develop 分支，在其他分支上需谨慎使用
 *
 * 使用方式：
 *   node scripts/check-branch.mjs
 *   node scripts/check-branch.mjs --branch main
 *   node scripts/check-branch.mjs --yes
 */

import { execSync } from 'node:child_process';

const EXPECTED_BRANCH = 'develop';

function getArgs() {
    const args = process.argv.slice(2);
    const opts = { branch: EXPECTED_BRANCH, force: false, showHelp: false };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--branch' && args[i + 1]) {
            opts.branch = args[i + 1];
            i++;
        } else if (args[i] === '--yes' || args[i] === '-y') {
            opts.force = true;
        } else if (args[i] === '--help' || args[i] === '-h') {
            opts.showHelp = true;
        }
    }
    return opts;
}

function printHelp() {
    console.log(`用法: node scripts/check-branch.mjs [options]

选项:
  --branch <name>   期望分支名（默认: develop）
  -y, --yes         非期望分支时不询问，直接继续
  -h, --help        显示帮助`);
}

function getCurrentBranch() {
    try {
        const out = execSync('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        return out.trim();
    } catch {
        return null;
    }
}

function readLine(question) {
    return new Promise((resolve) => {
        process.stdout.write(question);
        process.stdin.setEncoding('utf8');
        process.stdin.once('data', (data) => {
            resolve(data.toString().trim());
        });
    });
}

async function main() {
    const opts = getArgs();

    if (opts.showHelp) {
        printHelp();
        process.exit(0);
    }

    const currentBranch = getCurrentBranch();

    if (!currentBranch) {
        console.error('❌ 无法获取当前 git 分支，请确认当前在 git 仓库中执行此脚本');
        process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 分支检查');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`当前分支：${currentBranch}`);
    console.log(`期望分支：${opts.branch}`);

    if (currentBranch === opts.branch) {
        console.log('✅ 分支匹配，可继续执行 skill');
        process.exit(0);
    }

    // 分支不匹配
    console.log(`⚠️  当前分支不是 ${opts.branch}`);
    console.log(`本 skill 中的 pnpm 配置（pnpm-workspace.yaml / .pnpmfile.cjs）针对 ${opts.branch} 分支设计。`);
    console.log(`在 ${currentBranch} 分支上继续可能导致：`);
    console.log('  - 本地 tarball 与目标分支 lockfile 不一致');
    console.log('  - 依赖解析失败');
    console.log('  - 已有修改被覆盖');
    console.log('');

    if (opts.force) {
        console.log('✅ 通过 --yes 参数强制继续');
        process.exit(0);
    }

    if (!process.stdin.isTTY) {
        console.error('❌ 当前非交互终端，请使用 --yes 参数明确确认或手动切换分支');
        console.error(`   git checkout ${opts.branch}`);
        process.exit(1);
    }

    const answer = await readLine('是否仍要继续？(y/N) ');
    if (answer === 'y' || answer === 'Y') {
        console.log('✅ 用户确认继续');
        process.exit(0);
    } else {
        console.log(`❌ 已取消，请切换到 ${opts.branch} 分支后再执行`);
        console.log(`   命令：git checkout ${opts.branch}`);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('❌ 脚本执行出错:', err.message);
    process.exit(1);
});