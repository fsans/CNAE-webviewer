# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
