# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.5.0] — 2026-05-01

### Added

- `onfmready.js` loaded as the very first `<script>` in `<head>`, before Bootstrap and the app script. It intercepts `window.FileMaker` from page load and queues any `PerformScript()` calls made before FileMaker injects its object, flushing them automatically once it does — no polling, no `Pause[]` steps needed.
- `fmContext` module-level flag (`null` / `true` / `false`) tracks whether the widget is running inside a FileMaker WebViewer or a plain browser.
- `filemaker-expected` event listener: sets `fmContext` at DOMContentLoaded time; logs context in debug mode.
- `filemaker-ready` event listener: confirms FileMaker object fully available; logs in debug mode.

### Changed

- `fmBridge()` simplified: the `if (window.FileMaker && ...)` guard removed — `onfmready.js` guarantees `window.FileMaker` always exists (real or queuing stub), so `FileMaker.PerformScript()` is always safe to call directly.
- Bridge comment block updated to document `onfmready.js` integration, the two events, and the `fmContext` flag.

---

## [1.4.0] — 2026-05-01

### Changed

- **Breaking:** `window.fmGetState()`, `window.fmNewConversation()`, `window.fmSetLang()`, and `window.fmSetTheme()` global aliases removed — `window.fmReceive` is now the single callable entry point from FileMaker
- `getState` added as an inbound `cmd` in `FM_HANDLERS`; responds by firing an outbound `state` envelope containing `{ conversationId, lastAnswer, lastCodes, lang, theme }`, with the inbound `token` echoed back for async correlation
- Comment block updated: removed "GLOBAL FUNCTIONS" section, added `state` to the outbound cmd table, added `getState` to the inbound cmd table

---

## [1.3.0] — 2026-04-30

### Fixed

- `parseCnaeAnswer()` completely rewritten to be robust against all observed model output variants:
  - Markdown bold/italic markers (`**key**:` or `*key*:`) stripped via `normaliseMd()` before any regex runs, so bold formatting never prevents parsing
  - CNAE key now matches Catalan (`Codi CNAE`), Spanish (`Codigo CNAE`), and English (`CNAE Code`)
  - Alternatives section detected by either a known section header (`Opcions addicionals`, `Otras opciones`, `Other options`, `Alternatives`) or a leading `1.` numbered entry — whichever comes first
  - Layout A (inline): `1. Codi CNAE: XX.XX – Description – Confiança: Value` with all en-dash/em-dash/hyphen variants
  - Layout B (multi-line blocks): code, description, and confidence on separate lines within each numbered entry
  - Layout C (bare code): `1. XX.XX Description – Confiança: Value` without a `Codi CNAE:` prefix on the alternatives
  - All three layouts covered by a 9-case automated test suite (all passing)

---

## [1.2.0] — 2026-04-30

### Added

- `FILEMAKER_CALLBACK` string constant — single place in the code to define the FileMaker script name that receives all outbound events (default: `'handle_app_event'`)
- Standardised bridge envelope used in **both directions**:
  ```json
  { "cmd": "<action>", "data": { ... }, "token": "<string>" }
  ```
- `token` field in every envelope — async correlation id; echoed back by handlers so FileMaker can resolve promise-based calls; empty string when unused
- `FM_HANDLERS` dispatch table — one named function per inbound `cmd`; adding a new command requires only a single entry in the table
- `module_loaded` outbound event — fired on startup so FileMaker knows the widget is fully initialised and ready to receive commands

### Changed

- **Breaking:** `fmBridge(event, data)` renamed to `fmBridge(cmd, data, token)` and now wraps the payload in `{ cmd, data, token }` instead of spreading fields at the top level
- **Breaking:** inbound `fmReceive` now expects `{ cmd, data, token }` instead of `{ action, ... }`; `cmd` replaces `action`, all payload fields move inside `data`
- `fmBridge` calls `PerformScript(FILEMAKER_CALLBACK, ...)` instead of the hardcoded string `'CNAE_WebViewer_Event'`
- `fmReceive` dispatch replaced: flat `switch` on `action` replaced by `FM_HANDLERS[cmd](data, token)` lookup

---

## [1.1.0] — 2026-04-30

### Added

- Collapsible CNAE-2025 legal/technical note banner below the header — collapsed by default, expands on click; translated in English, Spanish, and Catalan
- Fluid layout: widget fills the container width, clamped between `min-width: 300px` and `max-width: 800px`

### Changed

- Colour palette replaced: Bootstrap blue (`#0d6efd`) replaced with a neutral slate-grey throughout (`#4b5563` light / `#9ca3af` dark) — discrete in both themes
- Header background is now a fixed dark charcoal (`#374151` light / `#1f2937` dark) independent of the accent colour
- Dark-mode confidence badge colours updated to match the new grey palette

### Fixed

- Corrected SRI integrity hash for the Bootstrap 5.3.3 JS bundle (previous hash caused a load failure in strict-mode browsers)

---

## [1.0.0] — 2026-04-30

### Added

- Streaming chat via Dify SSE API (`response_mode: streaming`)
- Structured CNAE result card: primary code badge, confidence pill (Alta / Mitjana / Baixa), description, category
- Clickable alternative options list
- Auto-selection of primary result on answer arrival — fires `option_selected` to FileMaker with `auto: true`
- User override: clicking an alternative fires `option_selected` with `auto: false` and highlights the chosen row
- `<think>…</think>` collapsible reasoning block with animated toggle
- Dark / Light theme toggle (moon/sun button in header); CSS custom property architecture
- Theme settable via URL param `?theme=dark` or FileMaker bridge `setTheme`
- i18n support: English, Spanish, Catalan; switchable at runtime via URL param `?lang=ca` or bridge `setLang`
- FileMaker WebViewer bridge — outbound events: `query_start`, `answer_received`, `option_selected`, `conversation_reset`, `error`
- FileMaker bridge — inbound actions: `send`, `setApiKey`, `setLang`, `setTheme`, `newConversation`
- Global functions: `fmGetState()`, `fmNewConversation()`, `fmSetLang()`, `fmSetTheme()`
- `fmGetState()` returns `{ conversationId, lastAnswer, lastCodes, lang, theme }`
- Typing indicator (3 bouncing dots) and status dot (online / working)
- Suggestion chips on empty state
- Auto-resizing textarea; Enter to send, Shift+Enter for newline
- Neutral grey palette (replaces Bootstrap blue) — discrete in both light and dark modes
- Bootstrap 5.3.3 + Bootstrap Icons 1.11.3 via CDN (SRI hashes verified)
- Conversation ID bar in footer
- `?debug=` replaced by `CONFIG.debug` flag; FM debug panel overlay
