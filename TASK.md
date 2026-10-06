# Task
ID: AK-001
Status: READY
Attempt: 1
Base commit: set by Luna when claiming
Report commit: pending (resolve committed READY_FOR_REVIEW HEAD)
Last reviewed commit: none
Review decision: pending

## Goal
Clean runnable Russian settlement foundation with visible map interaction and one atomic construction action.

## Context
M1. legacy/ is reference only; see LEGACY_REVIEW.md and ARCHITECTURE.md. Do not import old modules or recreate v8 scope. Register Luna heartbeat on first start per AGENTS.md.

## Scope
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
Claim/record base per AGENTS; implement only scope. WORK_REPORT: ID/attempt/base, paths/checks/screenshots/problems and worker heartbeat ID. Set READY_FOR_REVIEW; commit relevant code/tests/evidence/report/status in English; leave clean tree; STOP. No next task or curator/legacy edits.
