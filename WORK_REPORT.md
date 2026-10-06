# Work Report
Task: AK-004
Attempt: 1
Base commit: 6a9759183efa118fb9c5b832e1179fe0dc74dd75
Author: Sol, owner-authorized temporary developer; Luna paused.

## Completed
- Recorded AK-003 external PASS and M2 DONE; implemented one minimal M3 defense encounter.
- Paid walls/closed-open gate/tower/holding guard; cardinal free-route search detours around buildings, enclosed keep forces breach before movement.
- 20s manual warning, three eastern raiders, fixed-step ranged/melee damage, HP/deaths, keep defeat, finite-wave victory and fresh-run restart/save.
- Same-key schema 2 persists all combat HP/IDs/cooldowns/wave progress; validated AK-003 schema 1 remains readable. No V8/cloud/offline catch-up.
- Reserved former-water landing prevents overlap with existing eastern-shore buildings. Economy/camera/touch/manual/hidden pause preserved.
- Fixed landscape construction-space regression without weakening the original drag/pinch/build test. Russian controls/outcomes; no campaign/upgrades/SDK/ads/dependencies.

## Changed
- src/combat.js; state/main/render/save.js; index.html/style.css; Node/browser tests and test script.
- Six AK-004 combat/victory screenshots; old accepted evidence preserved. README and coordination docs updated.

## Tests
- npm test: 26/26 (18 existing + 8 defense) passed; atomic costs, detour/breach/gates, damage/death/win/lose/restart, pause, deterministic combat restore and old-save evolution.
- Complete source Playwright suite: 19/19 passed after landscape fix; final landing change additionally verified by 5/5 affected defense scenarios.
- Final built-dist Playwright suite: 19/19 passed; npm run build passed, 18 runtime files / 480211 bytes, no legacy/evidence/tests/debug interface.
- Real desktop/mobile/landscape paid layout, gate open/close, paused warning, warning/active saves and exact reload, real victory and restart. Unprotected defeat/reload/restart checked on desktop/mobile.
- All economy/persistence/camera/touch/native hidden-tab regressions retained. Initial landscape failure fixed; no acceptance tests removed.

## Visual Verification
- Live source/built opened using agent-browser; inspected six combat/victory captures at 1440x900, 390x844 and 844x390.
- Blue guard/red raider, walls/gate/tower, HP bars, phase counter and Russian result/restart visible; page remains within viewport. Real camera drag/pinch retained.

## Findings
- No AK-004 blocker. Optional matching painted defense art/effects and relocation/rally/repairs and short-landscape toast overlap in DEFERRED; old publication/phone/polish findings remain.

## Commit
- HEAD at AK-004 READY_FOR_REVIEW commit; ordinary push main then STOP for external review. No self-PASS or next task.
