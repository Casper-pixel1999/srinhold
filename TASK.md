# Task
ID: AK-002
Status: READY_FOR_REVIEW
Owner: Sol (temporary autonomous developer); Luna paused
Attempt: 1
Base commit: 513c9450d7adfcbe61ee8e8cc89e690fad009b06
Report commit: HEAD at completed milestone commit; external reviewer resolves GitHub SHA
Last reviewed commit: none
Review decision: pending

## Goal
Turn the accepted construction foundation into a small settlement economy: produce wood/food, feed residents and expand housing.

## Context
M2, first economy task. AK-001 accepted at candidate 5a61604ac40279381712b12817df540a554024c3. Preserve its map/camera/input/atomic commands and fixed-step lifecycle. Work within existing JS/Canvas/DOM architecture; no framework or broad refactor. This task does not complete M2: save/load is a later task.
Owner authorized Sol to finish the already-started AK-002 working changes, verify and commit, then stop for external review. Scope/criteria unchanged; no next milestone.
Delivery: commit and push to origin/main (GitHub Casper-pixel1999/srinhold), then STOP for external review. Owner permits coordination updates; previous Luna-only ownership wording below is superseded by this temporary mode.

## Scope
- Three build choices: existing Дом (35 wood/15 gold), Ферма (45 wood/20 gold), Лесоруб (25 wood/25 gold). Keep initial resources 150 wood/100 stone/100 food/100 gold. All build on free grass; lumber additionally requires at least one cardinally adjacent forest tile. Reject atomically with Russian feedback.
- Farms produce 2 food/s; lumber buildings produce 1.5 wood/s, in simulation time. Forest does not deplete. Stone/gold stay construction reserves; no extraction/taxes yet. Resources retain fractional precision in state and display whole units without long decimals.
- Initial population 12. Capacity: keep 8, each house 6 (initial capacity 20). Residents consume 0.04 food/person/s; resource amounts clamp at zero and remain finite. No worker assignment, transport, happiness or deaths in this task.
- Add one resident after 30 continuous simulation seconds with food >=10 and population below capacity. Reset the growth timer when either condition fails; never grant catch-up growth. Population stays within housing capacity. Food shortage stops growth; farms restore supply without an unrecoverable defeat.
- Russian population/capacity HUD and concise status: housing full, food shortage or settlement growing. Selected farm/lumber identifies its resource/rate. Build cards show real costs; preview uses selected sprite/type and real validity. Reuse only farm/lumber art from the existing painted atlas, with explicit cropped bounds/anchors, optimized runtime WebP.
- Compact three-card layout on desktop and both mobile orientations; within-panel scrolling allowed, no page overflow or controls covering the only usable placement area. Preserve touch confirm/cancel, pan/pinch arbitration, pause/hidden-tab behavior.

## Acceptance Criteria
1. All three types can be built/selected with correct Russian names, costs and previews. Wrong terrain/occupied/insufficient resources/forest adjacency and cancel leave state unchanged.
2. Build one farm and lumber from initial stock: wood 80, gold 55 before stepping. With population 12, after 10 active seconds wood is 95 and food 115.2 (floating tolerance); stone/gold unchanged. No production during pause/hidden time.
3. Initial population/capacity is 12/20. Eligible 30s produces exactly one newcomer; full housing/food <10 stops and resets growth. A house raises capacity by six and permits growth. Empty food cannot go negative, corrupt state or prevent later farm recovery.
4. A deterministic 300s scenario demonstrates farm/lumber production, food consumption, housing expansion and growth without negative/nonfinite stocks, capacity overflow or duplicated payments.
5. Actual running source and built app support the loop at 1440x900, 390x844, 844x390: readable resources/population, all three cards reachable, >=44px touch targets, correct pan/zoom picking and usable map. No English player text, failed runtime assets or uncaught errors.
6. Existing foundation behavior remains intact; required tests/build pass. Build includes only necessary runtime assets and updated asset allowlist; no legacy/evidence/tests/debug imports or new runtime dependencies.

## Non-goals
Save/cloud/migration, SDK/ads, quarry/taxes/trading, combat/campaign/tutorial systems, worker agents/pathfinding, flour/bread chains, storage caps, demolition/upgrades, art redesign and unrelated optimization. Do not modify curator documents or issue another task.

## Required Tests
- Focused Node tests: costs/atomic rejections for each type, lumber adjacency, exact production/consumption, fractional precision/nonnegative food, growth timing/reset/capacity/recovery, pause and deterministic 300s scenario.
- Retain existing projection/gesture/lifecycle regressions. When resources become time-dependent, assert cost deltas at a controlled paused moment; do not remove atomicity checks or weaken expected outcomes.
- npm test, npm run build, npm run test:browser; repeat browser smoke against built dist with BUILT_TEST=1. Ensure new meaningful Node tests are included by the npm test command.
- Browser: all three build/select/cancel paths, forest rejection, real touch gestures/placement and changing economy. Observe at least 30 active seconds of the real loop; use deterministic stepping for the longer balance scenario, not a substitute for live behavior. No production-only debug API in dist.

## Visual Verification
Inspect live source and built app. Commit evidence/AK-002-desktop.png, AK-002-mobile.png and AK-002-landscape.png at the three specified dimensions. Show farm/lumber, changed stocks and population HUD; inspect atlas edges, preview/depth and all cards. Report source vs built interaction checks briefly.

## Completion Requirements
Claim/record base per AGENTS.md; implement only this task. WORK_REPORT uses Completed/Changed/Tests/Visual Verification/Problems/Deferred Findings/Commit and matching ID/attempt/base; concise actual results. Set READY_FOR_REVIEW, commit relevant implementation/tests/assets/evidence/report/status, leave clean tree and STOP. Owner requests Sol review; no heartbeat, monitoring, self-review or next task.
