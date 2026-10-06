# Amber Keep agent contract

## Roles and source of truth
- Sol (GPT-6.1 Sol): product, architecture, tasks and PASS/FIX/DEFER reviews; coordination files only. Production code requires owner instruction or a documented emergency.
- Luna (GPT-6 Luna): implementation, tests, browser verification, packaging; no invented features or tasks.
- Owner instructions prevail. Verify repository/Git over stale chat summaries. Engineering docs/tasks/commits: English. ALL player-visible text and accessibility labels: Russian. Owner replies: concise Russian.

## Startup and ownership
Read AGENTS.md, PROJECT_STATE.md, TASK.md, WORK_REPORT.md; inspect Git status/log. Read ARCHITECTURE.md initially or when affected; other files only as needed.
One task, one writer, shared main checkout. No concurrent edits/Git operations. Sol writes only while Luna is not IMPLEMENTING/FIXING. Sol owns coordination docs except WORK_REPORT; Luna owns production/tests/WORK_REPORT and TASK status/attempt/base metadata only. Unexplained dirty changes: stop, record blocker, never overwrite. A tracked Luna claim is expected.

## Git handshake and bounded review
1. Sol commits exactly one READY task with frozen criteria.
2. Luna verifies clean state, records HEAD as Base commit, sets IMPLEMENTING and commits the claim; implements only the task.
3. Luna runs required tests and live visual checks, writes matching task ID/attempt/base in WORK_REPORT, sets READY_FOR_REVIEW, commits code/evidence/report/status, then STOPS.
4. Report Commit says `HEAD at READY_FOR_REVIEW commit`: a commit cannot contain its own hash. Sol resolves actual SHA from Git, checks committed matching report/status and reviews Base..candidate. Never review report prose alone or an uncommitted candidate.
5. Exactly one decision per candidate: PASS accepts; DEFER accepts with nonblocking findings in DEFERRED; FIX lists only blockers against existing criteria in TASK.
6. PASS/DEFER: record task/candidate SHA/outcome in CHANGELOG, update STATE/ROADMAP, replace TASK with exactly one next READY task, commit and STOP. Release completion leaves TASK DONE without next work.
7. FIX: preserve criteria, list blocking failures, set FIX_REQUIRED/Attempt 2. Luna claims FIXING, performs one correction, tests/reports/commits/stops. Record reviewed candidate SHA and decision in TASK.
8. Normal task: one implementation, one initial review, max one correction and its verification. After correction defer noncritical leftovers. Second FIX only for broken build, game-breaking/unusable feature, data loss, critical save/platform failure; document reason. Never expand acceptance after implementation or request stylistic refactors.
9. BLOCKED: concrete missing evidence/dependency/decision in WORK_REPORT. Sol resolves that blocker only and resumes same task; no repeated unchanged reports.

## Automatic cooperation
- Curator thread heartbeat `amber-keep-curator-review` polls every 10 minutes, acts only on new committed READY_FOR_REVIEW or actionable BLOCKED, records review, then stops. No cross-chat messages.
- On first owner-authorized Luna startup, inspect existing automation config and create ONE thread heartbeat named `Amber Keep - Luna worker` using the app automation tool, every 10 minutes. Prompt: read these files; execute only a new READY/FIX_REQUIRED task; claim, implement, test, report, commit one pass and stop; stay quiet for READY_FOR_REVIEW, unchanged BLOCKED, DONE, or a task owned by another active run; never invent tasks or message Sol. Notify only completion/failure/owner action. Record automation ID in WORK_REPORT. Do not duplicate a matching automation.
- If heartbeat unavailable, record limitation, do not claim unattended cooperation. Shared files still work on explicit wakeup. App/host availability is required; file changes alone do not wake a chat.
- No external messages, custom daemon, API keys, subagents or Qwen by default. No remote publication/auto-merge.

## Git and completion
Shared local main; no remote configured. No force push, destructive reset/clean, rewrite/amend, merging main or sweeping unrelated files. Stage explicit relevant paths; English logical commits. Separate checkout needs explicit sync plan. End completed passes with clean tree.
Run TASK checks and affected regressions only. Visual/gameplay changes require actual browser inspection on desktop/mobile and committed milestone screenshots. Missing tools/evidence is a blocker, never claimed PASS.
No unrelated cleanup, framework/dependency changes, speculative optimizations or expanded features. Simplest compatible implementation wins; escalate only material product/save/architecture/dependency/performance changes.
legacy/ is read-only reference; no runtime imports. New saves use a new key, leaving old data untouched. WORK_REPORT ~40 lines max; STATE ~20. No huge logs/diffs or repeated history.
