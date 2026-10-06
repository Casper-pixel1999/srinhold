# Task
ID: AK-003
Status: READY_FOR_REVIEW
Owner: Sol (temporary developer); Luna paused
Attempt: 1
Base commit: df687d98fcb7e3e5e9dd1d24091e298388509542
Report commit: HEAD at AK-003 READY_FOR_REVIEW commit
Review decision: pending external review

## Goal
Finish M2 persistence with safe versioned local save/load and exact settlement continuation.

## Context
External reviewer accepted AK-002 at df687d98fcb7e3e5e9dd1d24091e298388509542. Preserve existing economy, input, layout and platform boundary. Use amber-keep-rebuild-save-v1 only; no V8 reads/writes or implicit migration.

## Scope
- Dedicated save.js validates/serializes versioned snapshots; local platform adapter handles fallible storage.
- Persist resources with fractions, all buildings/IDs/nextId, population/growth timer, map/schema/tick and fixed-step remainder needed for deterministic continuation; preserve user pause. Exclude camera/selection/build preview and hidden-tab state. No offline catch-up.
- Restore valid local settlement at startup. Minimal Russian Save/Load actions and periodic/lifecycle saving; failed/invalid load leaves current state untouched with concise Russian feedback. Do not silently overwrite corrupt/incompatible saves through autosave; explicit save can replace them.
- Missing/blocked/quota storage never blocks play. Preserve manual pause/hidden-tab behavior and existing regressions.

## Acceptance Criteria
1. Round-trip restores persistent state exactly; continuation matches uninterrupted simulation, including partial ticks. No transient view state enters snapshots.
2. Validate versions/map, data shape/types, finite nonnegative stocks, population/capacity, timers/tick, building types/placement, unique IDs/tiles and valid nextId before applying. Reject corrupt/incompatible data safely, without mutation.
3. Startup/manual load restores built economy and user pause on desktop/mobile; display Russian errors for invalid/unavailable storage, remain playable. Old V8 keys untouched.
4. Automatic saving and hidden-tab save preserve state without catch-up. Existing build/camera/touch/pause behavior remains intact.
5. Node tests and source/built browser suites/build pass; inspect live app/screenshots at desktop/portrait/landscape. No cloud/account/combat/debug API/dependencies.

## Non-goals
Yandex cloud/accounts, legacy migration, combat/M3, UI redesign, unrelated refactor/polish, new economy features.

## Required Tests
Node: roundtrip/corrupt JSON/malformed/nonfinite/schema/map mismatch, IDs/types/placement/capacity/timers, storage errors and deterministic continuation. Browser: build/save/reload/restore exact resources/buildings/population/time, pause, legacy isolation, corrupt and storage failure safety on desktop/mobile. Retain all regressions; npm test/build/source browser/built browser.

## Visual Verification
Inspect live source/built and evidence/AK-003-desktop.png, AK-003-mobile.png, AK-003-landscape.png with restored settlement and persistence controls/feedback. No clipped controls/page overflow.

## Completion Requirements
Update TASK/STATE/WORK_REPORT, record nonblockers in DEFERRED, commit/push main, verify remote SHA and STOP for external review. No next task or self-PASS.
