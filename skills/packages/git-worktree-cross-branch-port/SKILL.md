---
name: 'git-worktree-cross-branch-port'
description: 'Creates an isolated git worktree on target branch and cherry-picks a commit from another branch. Invoke when porting/backporting/移植/同步/移植commit/跨分支同步 a commit between branches.'
---

# Git Worktree Cross-Branch Port

Port one or more commits from one branch to another using an isolated worktree plus `git cherry-pick`. Designed to be robust against common pitfalls: target already has older versions of the same files, structured file (JSON/YAML) context mismatches, Windows-specific lock / hook issues, and iterative local squash workflows.

## When to Invoke

-   Porting / backporting / 移植 / 同步 one or more commits between branches
-   Apply a fix or feature to a release / customer branch without disturbing the main worktree
-   Target branch already contains an older version of the same package (typical re-port scenario)

## Inputs

-   `source_commit` (required): SHA / ref / range to cherry-pick. A single SHA, a branch tip, or `SHA1^..SHA2` for a range (inclusive of both ends).
-   `target_branch` (required): destination branch.
-   `worktree_path` (optional): path for the new worktree; default is `<repo-parent>/<repo-basename>-wt-<target_branch-short-hash>` (e.g. `../oss-visual-material-wt-a1b2c3`).
-   `push` (optional, default ask): whether to push after success.
-   `force_push` (optional, default ask): whether to use `--force-with-lease` when local history has been rewritten (squash / rebase).

## Dependencies

-   Git (支持 worktree 的版本,≥ 2.15)
-   可选: Node.js(用于 JSON/YAML 语法校验)
-   无 pnpm / 工作区依赖,纯 Git 操作

## Inputs Gathering

Before executing, check what the user has provided. Any required input that is **missing or ambiguous** must be obtained via `AskUserQuestion` before starting the workflow. Typical questions:

1. Which commit(s) to port? (single SHA / range / branch tip)
2. Which branch is the destination?
3. Push after success? (yes / no / wait)
4. **If target already has older versions of touched files** — strategy: `overwrite` (take source), `keep-target` (preserve target), or `per-file-decide` (resolve each conflict manually)?

Do **not** start with `git worktree add` or any side-effect command until the required inputs are clear. Pre-flight checks (read-only `git show --stat`, `git diff <target>..<source> --stat`, `git ls-tree`) are fine as long as they don't modify state and are used only to help the user decide.

If `source_commit` is a branch name (e.g. `feature/xxx`), run `git fetch origin <branch>` first to ensure the local ref is up to date.

## Workflow

1. **Pre-flight inspection** (read-only, in the main worktree):
    - `git show --stat <source_commit>` — confirm contents of source commit.
    - `git diff <target_branch>..<source_commit> --stat` — preview the patch surface and anticipate conflicts.
    - `git ls-tree -r <target_branch> -- <paths>` — check if target already contains files touched by the source (typical for "target already has a copy" scenario).
    - If target already has the files, ask the user for the conflict strategy (see Inputs Gathering #4).
2. **Create worktree** (from the main worktree): `git worktree add <worktree_path> <target_branch>`.
3. **Cherry-pick** in the new worktree: `git -c core.hooksPath=NUL cherry-pick <source_commit>`.
    - For a single SHA: `git -c core.hooksPath=NUL cherry-pick <SHA>`.
    - For a range (inclusive of both ends): `git -c core.hooksPath=NUL cherry-pick <SHA1>^..<SHA2>`.
        - `A..B` is **exclusive** of A (picks commits after A up to B).
        - `A^..B` is **inclusive** of A (picks A up to B) — usually what users want.
4. **Resolve conflicts** per file (at any conflict stage, you can exit with `git cherry-pick --abort` to return to the pre-cherry-pick state):
    - Inspect: `git status`, `git diff --cached` (already-staged), `git diff` (unstaged).
    - For **add/add** conflicts (both sides created/modified the same path differently):
        - `git checkout --theirs <file>` → use the source-commit version (typical when porting forward).
        - `git checkout --ours <file>` → keep the target-branch version.
        - Then `git add <file>`.
        - > **Note**: During `cherry-pick`, `--ours` refers to the target branch (HEAD) and `--theirs` refers to the commit being picked. This is the **opposite** of `git merge` semantics.
    - If patch context doesn't match (typical for JSON / YAML / registry files that diverged in structure):
        - `git checkout HEAD -- <file>` to reset to target branch's version.
        - Apply the source's intended change manually at a sensible location.
        - For structured files, **validate** before continuing:
            - JSON (PowerShell): `Get-Content -Raw <file> | ConvertFrom-Json` (throws on syntax error).
            - JSON (Node): `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"`.
            - YAML: `npx js-yaml <file>` (auto-fetches `js-yaml` if not installed; avoids dependency on local `node_modules` which may be absent in the worktree).
    - Edit, `git add`, continue.
5. **Continue**: `git -c core.hooksPath=NUL cherry-pick --continue`.
6. **Verify**:
    - `git log --oneline -3` — confirm new commit landed.
    - `git show --stat HEAD` — confirm file set matches intent (esp. when strategy = `keep-target` for some files).
    - `git status` — should be clean.
7. **Push** — only after explicit user confirmation:
    - Normal push: `git -c core.hooksPath=NUL push origin <target_branch>`.
    - Force push (only after user explicitly opts in): `git -c core.hooksPath=NUL push --force-with-lease origin <target_branch>`. See [Force Push Policy](#force-push-policy).
8. **Cleanup** (from the main worktree):
    - Normal case: `git worktree remove <worktree_path>` then `git worktree prune --verbose`.
    - **Fallback** when `git worktree remove` reports `is not a working tree` (registration already cleared but directory remains):
        1. `git worktree prune --verbose` (no-op if already clean).
        2. PowerShell: `Remove-Item -Path <worktree_path> -Recurse -Force`.
        3. Bash: `rm -rf <worktree_path>`.

## Example

**Input:**

-   `source_commit`: `a1b2c3d`
-   `target_branch`: `release/customer-x`
-   `push`: yes

**Execution:**

1. Pre-flight: `git show --stat a1b2c3d` → touches `src/packages/foo/index.tsx`, `public/static/components/comp-list.json`
2. `git diff release/customer-x..a1b2c3d --stat` → preview patch surface
3. `git ls-tree -r release/customer-x -- src/packages/foo/index.tsx` → target already has the file → ask user for strategy
4. `git worktree add ../oss-visual-material-wt-customer-x release/customer-x`
5. `git -c core.hooksPath=NUL cherry-pick a1b2c3d`
6. Conflict on `comp-list.json` (add/add) → `git checkout HEAD -- comp-list.json`, manually insert entry, `npx js-yaml comp-list.json` (if YAML) / `node -e "JSON.parse(...)"` (if JSON), `git add comp-list.json`
7. `git -c core.hooksPath=NUL cherry-pick --continue`
8. Verify: `git log --oneline -3`, `git show --stat HEAD`, `git status`
9. Push: `git -c core.hooksPath=NUL push origin release/customer-x`
10. Cleanup: `git worktree remove ../oss-visual-material-wt-customer-x && git worktree prune --verbose`

## Failure Recovery

| Symptom | Action |
| --- | --- |
| Merge conflict (modify/modify) | Edit the file, `git add <file>`, `git cherry-pick --continue` |
| Add/add conflict | `git checkout --theirs <file>` (use source) or `--ours` (keep target), then `git add` |
| Patch context doesn't match (structured file) | `git checkout HEAD -- <file>`, apply change manually, validate syntax, `git add` |
| `fatal: Unable to create ... index.lock: File exists` | Another git process is mid-flight. Wait, or remove the stale lock: `Remove-Item <repo>/.git/worktrees/<name>/index.lock -Force` (PowerShell) / `rm -f <repo>/.git/worktrees/<name>/index.lock` (Bash). Re-run the failed command. |
| Wrong commit | `git cherry-pick --abort` (exits cherry-pick, returns to pre-pick state) |
| Skip commit (in a range) | `git cherry-pick --skip` |
| Push rejected (non-fast-forward) | Re-fetch and inspect `git fetch origin <target_branch>`; never `--force` blindly. If user opted into force-push, use `--force-with-lease`. |
| Push rejected (hooks) | `git -c core.hooksPath=NUL push ...` to bypass pre-push hooks (e.g. husky) when `node_modules` is absent in the worktree. |
| `git worktree add` → path already exists / not empty | Use a different `worktree_path`, or if stale: `git worktree remove --force <path>` then retry. |
| `git worktree remove` → `is not a working tree` | Registration already cleared. Run `git worktree prune --verbose` then manually `Remove-Item -Recurse -Force <path>`. |
| Worktree registration corrupted | `git worktree prune --verbose` then re-add or manually clean up. |

## Force Push Policy

-   **Never force-push without explicit user confirmation in the current session.**
-   Allowed scenarios (after explicit user opt-in):
    -   User performed a local `git rebase -i` / `squash` / `reset` and wants the rewritten history reflected on the remote.
    -   Target branch is a customer / release branch (never `main` / `master` / `develop` unless the user is the maintainer and explicitly confirms).
-   **Always use `--force-with-lease`, never `--force`.** `--force-with-lease` checks that the remote ref hasn't moved since your last fetch; if someone else pushed in the meantime, the push is refused.
-   After force-push, verify with `git log --oneline -3` and `git rev-parse origin/<target_branch>`.

## Project-Specific Patterns (Reference)

Some repos add hooks or auto-generated files that complicate cherry-pick. Common patterns:

-   **Material / component registries**: source commits often add an entry to a global list file (e.g. `public/static/components/comp-list.json`). If the target branch's file structure diverged (different ordering, extra entries, schema change), the patch context won't match — reset the file to HEAD and insert the entry at a sensible position. **Validate JSON after editing.** Re-check that the entry's `id` / `groupId` is not already present (duplicate IDs silently break the registry).
-   **Husky / pre-commit hooks on Windows**: if `node_modules` is missing in the new worktree, `.husky/_/husky.sh` errors. Bypass with `git -c core.hooksPath=NUL` for both `cherry-pick --continue` and `push`. `GIT_SKIP_HOOKS=1` and `--no-verify` do **not** work here.
-   **Target branch already has an older version**: pre-flight `git ls-tree -r <target_branch> -- <paths>` reveals this. Common for forked/customer branches that backported an earlier version. Recommend `keep-target` strategy unless the user explicitly wants the new version.
-   **Stale `index.lock` on Windows**: PowerShell pipelines or interleaved async commands may leave a lock file. Safe to remove if no git process is actually running (check via Task Manager / `ps` first).

## Notes

-   Never push without explicit user confirmation.
-   Never force-push without explicit user opt-in, and never to `main` / `master`.
-   Prefer `--force-with-lease` over `--force` when force-pushing.
-   Always verify the cherry-picked commit(s) match the source via `git show --stat` and the resulting tree via `git diff <target_branch>..HEAD`.
-   For structured files (JSON / YAML / XML), validate syntax after manual editing before `git add`.
-   At any conflict stage, `git cherry-pick --abort` safely exits and returns to the pre-cherry-pick state.
