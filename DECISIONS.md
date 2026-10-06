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
Decision: shared main checkout, status claim/report commits, one writer; owner-triggered handoffs only. Supersedes the initial heartbeat plan.
Reason: owner prohibits recurring reviews, continuous monitoring and autonomous loops.
Consequences: Sol coordinates only; Luna implements and stops; owner explicitly requests each review. Curator automation PAUSED; no worker heartbeat.

## D006 Bounded review
Decision: PASS accepts; DEFER accepts nonblockers; FIX only blockers, one normal correction.
Reason: avoid infinite perfection loops.
Consequences: candidate SHA recorded; deferred issues require explicit future task.

## D007 Preserve inherited foundation
Decision: keep production commit 1d835b7; AK-001 remains the single task as a Luna validation handoff before formal review.
Reason: owner restored curator boundaries and explicitly requested preservation of valid existing work.
Consequences: no rollback, self-acceptance, new gameplay scope or Sol fixes; Luna reports evidence/blockers, owner asks Sol to review.

## D008 Temporary autonomous developer, external GitHub review
Decision: Sol finishes the current incomplete AK-002 with production/test/QA authority; Luna paused. GitHub Casper-pixel1999/srinhold is source of truth; commit/push each completed milestone and stop.
Reason: owner explicitly changed workflow and requested completion of current work only.
Consequences: supersedes curator-only rules temporarily; preserve working code/history, no force push, automation or next task before external review/owner approval.
