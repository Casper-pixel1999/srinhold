# Legacy review — supplied v8

## Evidence
Inspected README, package/build/browser config, content, engine, renderer, UI/platform and representative tests; inventoried source/assets/tests/tools. app ~42.6KB, engine ~33.6KB, renderer ~35.3KB, localization ~32.5KB. All Node .test.js via explicit Windows file list: 39/39 pass. Inspected publishing/v8-settlement.png and v8-mobile.png; supplied captures, not live proof. Browser suite, release package and real SDK not revalidated.

## Preserve
- Isometric settlement/defense loop: resources, housing/food, siege preparation.
- Coherent painted terrain/buildings and stone/timber/green/amber direction; ~6MB source art. Select runtime copies by task.
- Tested behavior lessons: atomic costs/wall batches, goods credited once, inaccessible routes, garrison collapse and save validation. Adapt isolated useful algorithms with tests; no wholesale class copy.
- Valley-first content inspiration; bridge/convoy later, no original timing/parity requirement.

## Redesign
- Game class mixes economy/weather/missions/combat/navigation/saves/tutorial; UI injects markup and globals. Separate explicit state/commands/simulation/views.
- Renderer imports engine/translations; alpha connected-component scans discover sprite bounds on load. Explicit manifests/anchors replace scanning.
- Mobile capture has substantial objective panel over map. Compact/collapsible panels, hit targets and usable placement area from M1.
- Linux Chromium and python3 commands -> Windows-compatible tooling.
- Old/new production save branches -> new namespace, deferred migration.

## Discard from rebuild runtime
- English dictionary/SDK locale switching.
- Condensed monolithic implementation and standalone generated HTML as source.
- Query debug interface/source-text packaging tricks and old publishing claims; regenerate release material later. Originals remain preserved.

## Assets
README asserts original art/no Stronghold assets, but no independent provenance/license evidence supplied. Verify origin/rights before publication. Keep local reference; no random replacements/mass conversions in setup.
