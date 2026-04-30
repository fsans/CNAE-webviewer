# CNAE WebViewer

> **Current version: 1.2.0** — see [CHANGELOG](CHANGELOG.md) for full history.

A standalone single-file HTML chat widget that identifies Spanish/Catalan economic activity codes (CNAE — *Clasificación Nacional de Actividades Económicas*) through a conversational AI. Designed to be embedded inside a **FileMaker Pro WebViewer** but works in any modern browser.

---

## Dependency — CNAE Classifier chatflow

This widget is a **front-end only**. It does not contain any classification logic. All AI inference is performed by the **CNAE Classifier** chatflow, which must be deployed separately on a [Dify](https://dify.ai) instance.

The chatflow definition, prompt design, and model configuration are maintained in a separate repository:

**https://github.com/fsans/CNAE_classifier**

You need a running Dify deployment with that chatflow imported and an API key generated before this widget will produce any results.

---

## How it works

The user types a plain-language description of an economic activity. The widget sends it to the self-hosted Dify instance running the CNAE Classifier chatflow via its streaming API. The AI responds with a primary CNAE code (highest confidence) plus optional alternatives. The widget parses the structured response, renders a result card, and immediately notifies FileMaker via a JavaScript bridge.

---

## Features

| Feature | Details |
|---|---|
| Streaming chat | SSE streaming from Dify (`response_mode: streaming`) with live typing indicator |
| Structured CNAE card | Primary code badge + confidence pill + description + category |
| Alternative options | Clickable list; selecting one fires `option_selected` to FileMaker |
| Auto-selection | Primary result is auto-selected on arrival and immediately sent to FileMaker (`auto: true`) |
| Reasoning disclosure | `<think>…</think>` content collapsed behind a toggle pill |
| CNAE-2025 info banner | Collapsible legal/technical note with the official INE description of CNAE-2025; translated in English, Spanish, and Catalan |
| Dark / Light theme | Toggle button in the header; also settable via URL param or FileMaker bridge |
| i18n | English, Spanish, Catalan — switchable at runtime |
| Fluid width | Fills the container; clamped between 300 px and 800 px |
| FileMaker bridge | Full two-way JS ↔ FileMaker integration with standardised `{cmd, data, token}` envelope |
| No build step | Pure HTML + CSS + vanilla JS; Bootstrap 5.3 + Bootstrap Icons from CDN |

---

## Files

```
index.html        Main widget (multilingual, recommended)
index.es.html     Spanish-only build (legacy, same codebase)
index.ca.html     Catalan-only build (legacy)
index.en.html     English-only build (legacy)
CHANGELOG.md      Version history
```

The single `index.html` is the active file. The language-specific builds are kept for reference but are not maintained going forward.

---

## Configuration

Open `index.html` and edit the `CONFIG` block and the `FILEMAKER_CALLBACK` constant near the top of the `<script>` section:

```js
const CONFIG = {
  apiBase: 'http://192.168.30.249/v1',   // Dify server base URL
  apiKey:  'app-xxxxxxxxxxxxxxxxxxxx',   // Dify API key
  userId:  'fm-webviewer-user',          // arbitrary user identifier
  lang:    'ca',                         // default language: 'en' | 'es' | 'ca'
  theme:   'light',                      // default theme: 'light' | 'dark'
  debug:   false                         // show FM bridge debug panel
};

// Name of the FileMaker script that handles all inbound events from this widget
const FILEMAKER_CALLBACK = 'handle_app_event';
```

### URL parameters

`lang` and `theme` can be overridden via query string without touching the file:

```
index.html?lang=es
index.html?lang=ca&theme=dark
```

---

## FileMaker WebViewer integration

### Embedding

In FileMaker, create a WebViewer object and set its URL to the full path of `index.html`, e.g.:

```
"file:///path/to/CNAE-webviewer/index.html?lang=ca"
```

Or serve it from your LAN and use an `http://` URL.

---

### Bridge envelope format

All communication in both directions uses the same JSON envelope:

```json
{ "cmd": "<action_name>", "data": { }, "token": "<string>" }
```

| Field | Description |
|---|---|
| `cmd` | Name of the action to perform |
| `data` | JSON object containing the payload for that action |
| `token` | Async correlation id — echoed back so FileMaker can resolve promise-based calls; pass `""` when unused |

---

### Outbound events (HTML → FileMaker)

The widget calls `window.FileMaker.PerformScript(FILEMAKER_CALLBACK, json)` with a `{cmd, data, token}` envelope.

| `cmd` | `data` fields | When |
|---|---|---|
| `module_loaded` | `{}` | Widget has fully initialised and is ready |
| `query_start` | `{ query, conversationId }` | User submits a message |
| `answer_received` | `{ query, answer, cnaeCodes[], conversationId }` | Full answer received from Dify |
| `option_selected` | `{ code, description, confidence, auto, conversationId }` | Result selected — see below |
| `conversation_reset` | `{}` | New conversation started |
| `error` | `{ message }` | Network or API error |

#### The `auto` field on `option_selected`

| Value | Meaning |
|---|---|
| `true` | Fired automatically when the answer arrives — primary (highest-confidence) result |
| `false` | Fired when the user explicitly clicks an alternative from the list |

FileMaker scripts can use this flag to decide whether to write the value immediately or wait for user confirmation.

---

### Inbound commands (FileMaker → HTML)

Call `window.fmReceive(jsonString)` from a FileMaker script using *Perform JavaScript in Web Viewer*, passing a `{cmd, data, token}` envelope.

| `cmd` | `data` fields | Effect |
|---|---|---|
| `send` | `{ query }` | Pre-fill and submit a query |
| `setApiKey` | `{ key }` | Replace the Dify API key at runtime |
| `setLang` | `{ lang }` | Switch language: `'en'` \| `'es'` \| `'ca'` |
| `setTheme` | `{ theme }` | Switch theme: `'light'` \| `'dark'` |
| `newConversation` | `{}` | Reset the conversation |

**Example FileMaker script parameter:**

```json
{ "cmd": "send", "data": { "query": "Venda de roba en linia" }, "token": "" }
```

```json
{ "cmd": "setLang", "data": { "lang": "ca" }, "token": "req-42" }
```

If a `token` is included, the corresponding handler receives it and can include it in any follow-up `fmBridge` call so FileMaker can match the response to the original request.

---

### Extending the bridge

To add a new inbound command, add a single entry to the `FM_HANDLERS` object in `index.html`:

```js
const FM_HANDLERS = {
  // ... existing handlers ...
  myNewCommand(data, token) {
    // do something with data
    // optionally call fmBridge('some_response', { ... }, token) to reply
  }
};
```

No other changes are needed.

---

### Global functions

These are callable directly from FileMaker's *Perform JavaScript in Web Viewer* step:

| Function | Description |
|---|---|
| `fmReceive(json)` | Process any inbound envelope |
| `fmGetState()` | Returns JSON: `{ conversationId, lastAnswer, lastCodes, lang, theme }` |
| `fmNewConversation()` | Reset conversation |
| `fmSetLang(code)` | Switch language: `'en'`, `'es'`, `'ca'` |
| `fmSetTheme(mode)` | Switch theme: `'light'`, `'dark'` |

---

## Theming

The widget uses CSS custom properties throughout. The full light and dark palettes are declared in `:root` and `[data-theme="dark"]` at the top of the `<style>` block — easy to customise without touching layout code.

The accent colour is a neutral slate-grey (`#4b5563` in light mode, `#9ca3af` in dark mode). The header uses a fixed dark charcoal (`#374151` / `#1f2937`) that keeps white text readable in both themes.

The toggle button (moon/sun icon) is in the header. Clicking it calls `toggleTheme()`.

---

## CNAE-2025

The widget includes a collapsible informational banner with the official INE description of CNAE-2025 — its statistical purpose, the joint revision process with NACE Rev. 2.1 (European) and ISIC Rev. 5 (international), and the phased adoption from 1 January 2025. The text is translated in all three supported languages.

### Answer format

The Dify chatflow is expected to return structured text in this format (Spanish or Catalan field names, both accepted):

```
Codi CNAE: 56.30
Categoria: I - HOSTELERIA
Descripcio oficial: Servicios de bebidas
Confianca: Alta

Opcions addicionals (per ordre de relevancia):
1. Codi CNAE: 56.12 – Puestos de comidas – Confianca: Mitjana
2. Codi CNAE: 56.11 – Restaurantes – Confianca: Mitjana
```

If the response does not match this structure, it is rendered as a plain text bubble.

---

## Dify API requirements

- Endpoint: `POST /v1/chat-messages`
- Mode: `response_mode: streaming`
- SSE events used: `message`, `agent_message`, `message_end`
- `<think>…</think>` reasoning blocks are handled transparently

The chatflow that drives this widget is defined in [fsans/CNAE_classifier](https://github.com/fsans/CNAE_classifier). Refer to that repository for deployment instructions, model selection, and prompt customisation.

---

## Browser / WebViewer compatibility

Requires a browser engine with support for:
- `fetch` + `ReadableStream` (streaming SSE)
- CSS custom properties
- `100dvh`

FileMaker 19+ WebViewer (Chromium-based) meets all requirements.

---

## License

MIT
