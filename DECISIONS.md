# Decisions

## D001 Clean rebuild
Decision: preserve v8 in read-only legacy/; new app at root.
Reason: retain assets/behavior lessons without intertwined implementation.
Consequences: no runtime legacy imports; original baseline in Git; curator writes no production code.

## D002 Minimal web stack
Decision: JS modules, Canvas 2D, DOM/CSS, Node built-ins, Playwright dev-only.
Reason: sufficient for small isometric game, Windows/mobile compatible.
Consequences: explicit state/simulation/view boundaries, extract only needed systems.

## D003 Russian and new saves
Decision: Russian-only player UI, new versioned storage key, no initial migration.
Reason: owner requirement and clean state model.
Consequences: no English dictionary/SDK locale override; preserve old data.

## D004 Finite release
Decision: one polished guided mission before advanced campaign/logistics/weather.
Reason: early playable loop and achievable publication.
Consequences: foundation -> economy -> siege; v8 parity not acceptance gate.

## D005 Serialized local handoff
Decision: shared main checkout, status claim/report commits, one writer, thread heartbeats every 10 minutes.
Reason: no manual report forwarding/shared-chat assumptions or branch bureaucracy.
Consequences: Sol coordinates; Luna commits and stops. App/host required. Curator monitor created; Luna creates worker monitor at startup.

## D006 Bounded review
Decision: PASS accepts; DEFER accepts nonblockers; FIX only blockers, one normal correction.
Reason: avoid infinite perfection loops.
Consequences: candidate SHA recorded; deferred issues require explicit future task.
