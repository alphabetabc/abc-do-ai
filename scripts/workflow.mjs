#!/usr/bin/env node

/**
 * ABC AI 能力库 —— 提交工作流编排
 *
 * 职责：串联 stage → analyze → commit → changelog → push 的完整流程，
 * 把原来塞在 commit.mjs main() 里的编排逻辑抽出来，让 commit.mjs
 * 专注「commit message 生成」这一件事。
 *
 * 入口：
 *   node scripts/workflow.mjs --auto          # 自动模式（commit:auto）
 *   node scripts/workflow.mjs --auto --push   # 自动模式 + 推送
 *   node scripts/workflow.mjs --auto --no-changelog  # 跳过 changelog
 *
 * 设计原则：
 *   - workflow.mjs 只负责「流程编排」和「输入输出」
 *   - commit.mjs 提供 generateCommitMessage(diff) 等纯函数
 *   - update-changelog.mjs 负责 changelog 解析/合并/渲染
 *   - skill-classifier.mjs 提供 skill 识别 / 动作判定，被两边共用
 */

import {
  parseCliArgs,
  ensureGitRepo,
  stageChangesExcludingChangelog,
  analyzeDiff,
  printDiffSummary,
  ruleBasedGenerate,
  inferScope,
  performCommit,
  syncChangelog,
  pushCurrentBranch,
  runAutoCommit,
} from './commit.mjs';

// ─── 入口 ───────────────────────────────────────────────

async function main() {
  const options = parseCliArgs(process.argv);

  if (options.auto) {
    await runAutoCommit(options);
    return;
  }

  // 非自动模式目前直接走 commit.mjs 的交互流程
  // （交互逻辑较重，暂不拆分，保持现有体验）
  console.error(
    '非自动模式请使用 node scripts/commit.mjs（交互式）。\n' +
      '自动模式：node scripts/workflow.mjs --auto [--push] [--no-changelog]'
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(`\x1b[31m✖ ${err.message}\x1b[0m`);
  process.exit(1);
});

// 导出各步骤，方便外部测试 / 编排
export {
  parseCliArgs,
  ensureGitRepo,
  stageChangesExcludingChangelog,
  analyzeDiff,
  printDiffSummary,
  ruleBasedGenerate,
  inferScope,
  performCommit,
  syncChangelog,
  pushCurrentBranch,
  runAutoCommit,
};
