# Task
ID: AK-001
Status: READY_FOR_REVIEW
Attempt: 1
Base commit: 12c21d44a3d06eef9f9c7f4074ba951ec654e357
Report commit: HEAD at READY_FOR_REVIEW commit
Existing implementation: 1d835b7 (preserve; do not rebuild)
Last reviewed commit: none
Review decision: pending

## Goal
Validate and take ownership of the existing AK-001 foundation against the original criteria; preserve working implementation.

## Context
M1. Sol already implemented the foundation in 1d835b7 before the owner restored strict role boundaries. This is an inherited-work validation handoff, not a new implementation or correction cycle. Original acceptance criteria below remain frozen. Read the existing source/report first; do not rebuild working features. legacy/ is reference only. No heartbeat or automatic monitoring. No PASS has been issued.

## Scope
Luna's current operation is verification/reporting only: inspect existing code, run the required checks and live desktop/mobile verification below. The following describes the inherited implementation to validate, not permission to recreate it or add features. If a criterion fails, record the concrete blocker and stop with BLOCKED; do not fix production or add/modify tests until Sol issues an owner-requested FIX.

- New root HTML/CSS/modules, Windows-compatible Node dev command localhost:3000, unit command and minimal static release build.
- Deterministic 24x24 grass/forest/rock/water map, central keep and two houses. Readable isometric rendering with selected legacy sprites and explicit rectangles/anchors; no wholesale old renderer copy.
- Russian title/HUD: Дерево, Камень, Еда, Золото; stocks 150/100/100/100. Build one house type, cost 35 wood/15 gold, free grass only. No spacing rule this task.
- Select house -> Russian name. Preview/confirm/cancel on desktop/touch; invalid terrain/occupied/insufficient resources never charge/create. Escape cancels on desktop.
- Drag camera, wheel/pinch zoom with +/- fallback, reset view. Drag/pinch never builds/selects accidentally. Pause/resume stops clock; hidden tab freezes, resumes without catch-up.
- Small serializable state/command/simulation boundary and local platform stub. Persistence in M2; create only modules needed now.

## Acceptance Criteria
1. npm run dev works on this Windows host. Required assets load without uncaught errors. No runtime request/import from legacy/.
2. Distinct terrain, keep/two houses, correct sprite anchors/depth. Picking matches visible tiles before/after pan/zoom.
3. Confirm valid house -> exactly one house, wood 115/gold 85. Cancel/invalid requests -> unchanged resources/count. Exhaustion rejected in Russian.
4. Russian UI only; usable at 1440x900, 390x844 and 844x390 without horizontal page scroll or controls blocking construction. Touch targets >=44px; useful map area.
5. Mouse/touch drag/pinch never builds; zoom/reset work. Pause/hidden time stays fixed; resume has no large jump.
6. npm test passes focused tests; npm run build produces runnable dist with root index.html, excluding legacy/evidence/tests/debug. Document exact commands.

## Non-goals
Production/population/workers, combat/pathfinding, campaign, persistence/migration UI, SDK/ads/cloud/audio, full polish or v8 parity. No framework/TypeScript migration.

## Required Tests
- Node: valid house/cost/atomicity, invalid terrain/occupied/insufficient resources/cancel, deterministic initial state and stepping/pause as applicable.
- Browser: start/select/confirm/cancel, pan+zoom picking, real touch drag/pinch, pause/visibility resume, console/network failures. Playwright dev dependency allowed; managed Chromium, no Linux path.
- Smoke built dist separately; verify no legacy requests/imports. Record executed commands/results.

## Visual Verification
Inspect actual running source and built app. Commit evidence/AK-001-desktop.png (1440x900), evidence/AK-001-mobile.png (390x844), evidence/AK-001-landscape.png (844x390). At least one shows selected/built house. Inspect clipping/sprite artifacts and touch placement usability. Report interaction checks. Missing browser evidence is a blocker.

## Completion Requirements
Claim/record base per AGENTS; validate inherited work only. WORK_REPORT: ID/attempt/base, executed checks, inspected screenshots and concrete problems; distinguish inherited Sol evidence from Luna's checks. Reuse correct existing screenshots unless new evidence is needed. If checks pass, set READY_FOR_REVIEW; otherwise BLOCKED with failures. Commit report/status and necessary evidence only in English; leave clean tree; STOP. No production/test fixes, next task, heartbeat or curator/legacy edits. Owner requests Sol review separately.
