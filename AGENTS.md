# Amber Keep agent contract

## Temporary owner-authorized mode (2026-10-06)
Sol is PRIMARY AUTONOMOUS DEVELOPER and CURATOR; Luna is paused. This section overrides the role split and handoff rules below until the owner changes it. Preserve current work; complete only the current task/milestone, implement and fix blockers, run required tests and live visual QA, update TASK/STATE/WORK_REPORT, commit and STOP for external owner review. Do not prepare/start a next task, issue self-PASS or schedule monitoring. Nonblockers go to DEFERRED. No additional dependencies/refactors outside task needs. The former two-agent contract below remains historical/default guidance, not a reason to wait for Luna.

GitHub https://github.com/Casper-pixel1999/srinhold is the source of truth. Before work check branch, HEAD, status, recent log and remote state. Preserve branches/history; no force push or branch replacement. Each completed milestone ends with tests/visual QA, updated coordination, commit, ordinary push and STOP for external review of that GitHub commit. Do not start a new task after pushing. A push failure is a reported delivery blocker, not completion.

## Roles and source of truth
- Sol (GPT-6.1 Sol): CURATOR; product, architecture, tasks and PASS/FIX/DEFER reviews; coordination files only. Do not implement gameplay, UI, rendering, tests or fixes assigned to Luna. Any exception requires a new explicit owner instruction; discovering a bug is not permission to fix it.
- Luna (GPT-6 Luna): implementation, tests, browser verification, packaging; no invented features or tasks.
- Owner instructions prevail. Verify repository/Git over stale chat summaries. Engineering docs/tasks/commits: English. ALL player-visible text and accessibility labels: Russian. Owner replies: concise Russian.

## Startup and ownership
Read AGENTS.md, PROJECT_STATE.md, TASK.md, WORK_REPORT.md; inspect Git status/log. Read ARCHITECTURE.md initially or when affected; other files only as needed.
One task, one writer, shared main checkout. No concurrent edits/Git operations. Sol writes only while Luna is not IMPLEMENTING/FIXING. Sol owns coordination docs except WORK_REPORT; Luna owns production/tests/WORK_REPORT and TASK status/attempt/base metadata only. Unexplained dirty changes: stop, record blocker, never overwrite. A tracked Luna claim is expected.

## Git handshake and bounded review
1. Sol commits exactly one READY task with frozen criteria.
2. Luna verifies clean state, records HEAD as Base commit, sets IMPLEMENTING and commits the claim; implements only the task.
3. Luna runs required tests and live visual checks, writes matching task ID/attempt/base in WORK_REPORT, sets READY_FOR_REVIEW, commits code/evidence/report/status, then STOPS.
4. Luna stops; the owner returns to Sol and explicitly requests review. Only then Sol resolves the actual candidate SHA, checks committed matching report/status and reviews Base..candidate. Report Commit may say `HEAD at READY_FOR_REVIEW commit` to avoid a self-hash. Never review automatically, from report prose alone, or an uncommitted candidate.
5. Exactly one decision per candidate: PASS accepts; DEFER accepts with nonblocking findings in DEFERRED; FIX lists only blockers against existing criteria in TASK.
6. PASS/DEFER: record task/candidate SHA/outcome in CHANGELOG, update STATE/ROADMAP, replace TASK with exactly one next READY task, commit and STOP. Release completion leaves TASK DONE without next work.
7. FIX: preserve criteria, list blocking failures, set FIX_REQUIRED/Attempt 2. Luna claims FIXING, performs one correction, tests/reports/commits/stops. Record reviewed candidate SHA and decision in TASK.
8. Normal task: one implementation, one initial review, max one correction and its verification. After correction defer noncritical leftovers. Second FIX only for broken build, game-breaking/unusable feature, data loss, critical save/platform failure; document reason. Never expand acceptance after implementation or request stylistic refactors.
9. BLOCKED: concrete missing evidence/dependency/decision in WORK_REPORT. Sol resolves that blocker only and resumes same task; no repeated unchanged reports.

## Owner-triggered cooperation
- Sol prepares one TASK and STOPS. The owner starts Luna. Luna implements/reports/commits and STOPS. The owner asks Sol to review. Sol chooses PASS/FIX/DEFER, prepares the single next task or correction instructions, commits and STOPS.
- No recurring reviews, worker heartbeats, continuous monitoring, polling or autonomous review loops. `amber-keep-curator-review` is disabled (PAUSED); do not reactivate it or create a replacement. No Luna heartbeat exists or should be created.
- BLOCKER -> FIX instructions in TASK for Luna; NON-BLOCKER -> DEFERRED. Sol never repairs production code during review. Normal cycle: implementation, one review, at most one correction; the critical exception in rule 8 requires an explicit owner-requested review, never autonomous retry.
- No external messages, custom daemon, API keys, subagents or Qwen by default. No remote publication/auto-merge.

## Git and completion
Shared local main; no remote configured. No force push, destructive reset/clean, rewrite/amend, merging main or sweeping unrelated files. Stage explicit relevant paths; English logical commits. Separate checkout needs explicit sync plan. End completed passes with clean tree.
Run TASK checks and affected regressions only. Visual/gameplay changes require actual browser inspection on desktop/mobile and committed milestone screenshots. Missing tools/evidence is a blocker, never claimed PASS.
No unrelated cleanup, framework/dependency changes, speculative optimizations or expanded features. Simplest compatible implementation wins; escalate only material product/save/architecture/dependency/performance changes.
legacy/ is read-only reference; no runtime imports. New saves use a new key, leaving old data untouched. WORK_REPORT ~40 lines max; STATE ~20. No huge logs/diffs or repeated history.
