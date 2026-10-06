# Initial architecture

## Stack and structure
Plain JavaScript ES modules, Canvas 2D map, DOM/CSS HUD. No runtime framework/engine/backend. Node built-ins for dev server, unit tests and packaging; Playwright allowed as dev-only browser dependency. Commands work on Windows without python3 or hardcoded Linux Chromium.
Root: index.html, style.css, package.json; src/; assets/runtime/; tests/; tools/; evidence/. Create modules only when needed:
- main.js: bootstrap/lifecycle/frame loop/composition.
- state.js: serializable state and validated atomic commands; no DOM/platform imports.
- simulation.js: deterministic economy/combat stepping; extract systems only as they arrive.
- render.js: projection/camera/picking/drawing; no game-state mutation.
- input.js: Pointer Events/gesture arbitration -> camera or commands.
- ui.js: Russian DOM views/actions.
- assets.js: explicit atlas rectangles/anchors and loading.
- save.js: versioned validation/serialization and storage boundary.
- platform.js: local adapter first; Yandex adapter later.
- content.js: declarative maps/building/mission/balance data.

## State and simulation
Single plain state: schemaVersion, mapId, tick, resources, population, buildings, units, enemies, mission, nextId, seed as needed. Stable IDs; no DOM/Canvas/timers in snapshots. Selection/camera are transient. Commands validate then apply atomically; invalid builds never charge.
Fixed step 0.1s, requestAnimationFrame renderer, capped accumulator. Pause/hidden tab freezes time; resume without catch-up. No simulation in drawing. Seed randomness when needed. Simple arrays/grid for 24-32 tile maps; no ECS/event bus infrastructure.

## Rendering, assets and controls
2:1 isometric projection and tested inverse; depth order by ground position, DPR cap 2. Cache terrain/cull when useful. Explicit sprite bounds replace startup alpha-component scans.
Copy only selected assets from legacy into runtime; prefer WebP when quality/transparency holds. Keep coherent painted style and source/reference assets outside release. Missing required art shows a recoverable Russian error.
Pointer Events unify mouse/touch. Drag never builds; wheel/pinch zoom anchors to input, +/- fallback. Build preview with confirm/cancel. Controls >=44 CSS px; no hover-only actions. Portrait/landscape supported from M1; HUD leaves useful map area.

## Saves and missions
New key amber-keep-rebuild-save-v1; never overwrite/import v8 saves implicitly. Validate versions, finite numbers, IDs/types; Russian feedback for corrupt/unavailable storage. Local adapter first, cloud conflict policy/throttling later. No initial migration burden.
Declarative maps/missions; first map 24x24. Tutorial/unlock/win/lose belong to simulation/content, not renderer branches. Every milestone runnable.

## Platform and packaging
Core uses adapter init/ready/setGameplayActive/load/save/showRewarded/onPause. Local works without SDK/network; no ads in foundation. Yandex later: bounded initialization/fallback, visibility/SDK/ads pause simulation/audio, preserve user pause, reward once only on onRewarded, throttle cloud writes. Russian stays fixed regardless of SDK locale.
ZIP root index.html; local runtime paths only; exclude legacy/evidence/tests/debug API. Recheck current requirements and actual platform draft before claiming real ads/cloud. SDK reference checked 2026-10-06: https://yandex.com/dev/games/doc/en/sdk/sdk-about.

## Tests
Node: command/cost atomicity, deterministic stepping, save roundtrip/corruption; affected navigation/combat regressions later. Browser: scoped gameplay flow, console/network failures, real touch drag/pinch, desktop 1440x900, portrait 390x844, landscape 844x390. Inspect live interactions and screenshots. SDK mocks do not prove platform behavior.

## AK-003 local persistence
The local adapter reads/writes only amber-keep-rebuild-save-v1. A schema-v1 envelope holds a validated state snapshot and user pause; no camera/selection/preview or wall-clock timestamp. State includes growthSeconds and simulationRemainder so restoring a partial fixed step preserves deterministic continuation. Pause/hidden transitions discard inactive remainder as before; no offline catch-up.
Startup/manual load validates the complete snapshot before changing the live state. Autosave every 15 seconds and on hidden/pagehide; corrupt/incompatible or unavailable storage disables automatic writes until an explicit successful save. Failures give Russian feedback and preserve current gameplay. Cloud remains a future adapter task.
