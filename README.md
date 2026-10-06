# Amber Keep — clean rebuild workspace

Public title Янтарная крепость; player UI Russian, engineering English.
Read AGENTS.md, PROJECT_STATE.md, TASK.md. Sol curates/reviews, Luna implements one task and stops. Shared local main is source of truth; no remote/publication configured.

## Rebuilt foundation (AK-001)
Requires Node.js 20+ and npm. No runtime dependencies.
- `npm ci` installs the Playwright development dependency.
- `npm run dev` -> http://127.0.0.1:3000.
- `npm test` runs state/command/projection tests.
- `npx playwright install chromium` installs the managed test browser when absent.
- `npm run test:browser` verifies desktop/touch and actual native-tab visibility (Windows host; Chromium runs offscreen for that check).
- `npm run build` creates runtime-only dist/; `npm run preview` -> http://127.0.0.1:3002.
- Built-browser checks in PowerShell: `$env:BUILT_TEST='1'; npm run test:browser; Remove-Item Env:BUILT_TEST`.
Build a house: choose «Построить дом», tap a free grass tile, confirm or cancel. Drag the map, wheel/pinch or +/- to zoom, home button returns to the keep. «Пауза» freezes the clock. No economy/combat/persistence yet.

Important visual evidence: evidence/AK-001-desktop.png, evidence/AK-001-mobile.png, evidence/AK-001-landscape.png.

Preserved reference: legacy/README.md and legacy/standalone/amber-keep-v8-play.html. Old source on Windows: `python -m http.server 3001 --directory legacy --bind 127.0.0.1`, then http://127.0.0.1:3001. Old Linux browser config intentionally untouched.

Automatic handoff: curator heartbeat checks committed TASK/WORK_REPORT every 10 minutes; Luna creates worker heartbeat at first start. Requires available app/host; file changes alone do not wake agents. No manual report copying between chats.

Owner startup message for GPT-6 Luna (same folder/local checkout):
> You are the GPT-6 Luna DEVELOPER for Amber Keep in C:/Users/Ярослав/Desktop/Game. Read AGENTS.md, PROJECT_STATE.md, TASK.md, ARCHITECTURE.md and WORK_REPORT.md. Follow the repository handshake, create the single Luna worker thread heartbeat described in AGENTS.md, and execute AK-001. Inspect the running desktop/mobile game, run required checks, commit code/evidence/report with READY_FOR_REVIEW, then stop. Future work comes only from a new READY or FIX_REQUIRED TASK.md. Do not message the curator chat or create your own tasks.

References checked during setup: https://yandex.com/dev/games/doc/en/sdk/sdk-about and https://learn.chatgpt.com/docs/automations?surface=app.
