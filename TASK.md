# Task
ID: AK-004
Status: READY_FOR_REVIEW
Owner: Sol (temporary developer); Luna paused
Attempt: 1
Base commit: 6a9759183efa118fb9c5b832e1179fe0dc74dd75
Report commit: HEAD at AK-004 READY_FOR_REVIEW commit
Review decision: pending external review

## Goal
One minimal playable M3 defense slice, preserving accepted M2 economy/persistence.

## Frozen scope and acceptance
- Wall, closed/open gate, ranged tower and one stationary defender type with paid placement. Enemy cannot pass closed defenses; deterministic cardinal pathing detours through gaps/open gates or attacks a blocking structure when enclosed. Health, damage and deaths affect gameplay.
- One finite wave of three raiders, manually triggered after preparation; readable 20-second east-approach warning. Fixed-step attacks/movement, keep destruction defeats settlement; eliminating the finite wave wins. Finished simulation freezes; explicit restart clears current run and save without touching legacy.
- Russian placement/cost/health/gate/phase/result feedback and mobile-accessible controls. Preserve map/economy/touch/pause and hidden-tab freeze. No campaign/AI expansion/upgrades/weather/SDK/ads/redesign.
- Persist all new combat state/IDs/HP/cooldowns/wave progress deterministically; accept existing AK-003 schema-v1 saves through explicit validated same-key evolution, never V8 import. Reject malformed combat snapshots before mutation.
- Focused Node tests: obstacle detours/breach/gates, damage/death/defeat/victory/restart, command costs, determinism/pause and save continuation/old-save compatibility. Real desktop/portrait/landscape browser defense win and undefended defeat/restart, combat save/reload, all existing regressions.

## Required verification
npm test; npm run build; complete source and built-dist Playwright suites; real live browser and visual screenshots evidence/AK-004-{desktop,mobile,landscape}.png. Fix only blockers; defer optional polish.

## Completion
Record AK-003 external PASS and M2 DONE; update report/state/roadmap. Commit/push ONE completed AK-004 to main; verify remote SHA and clean tree, then STOP for external review. No next task.
