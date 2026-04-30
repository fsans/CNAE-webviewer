# CNAE WebViewer

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
| Auto-selection | Primary result is auto-selected on arrival and immediately sent to FileMaker |
| Reasoning disclosure | `<think>…</think>` content collapsed behind a toggle pill |
| Dark / Light theme | Toggle button in the header; also settable via URL param or FileMaker bridge |
| i18n | English, Spanish, Catalan — switchable at runtime |
| FileMaker bridge | Full two-way JS ↔ FileMaker integration (see below) |
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

Open `index.html` and edit the `CONFIG` block near the top of the `<script>` section:

```js
const CONFIG = {
  apiBase: 'http://192.168.30.249/v1',   // Dify server base URL
  apiKey:  'app-xxxxxxxxxxxxxxxxxxxx',   // Dify API key
  userId:  'fm-webviewer-user',          // arbitrary user identifier
  lang:    'ca',                         // default language: 'en' | 'es' | 'ca'
  theme:   'light',                      // default theme: 'light' | 'dark'
  debug:   false                         // show FM bridge debug panel
};
```

### URL parameters

Both `lang` and `theme` can be overridden via query string without touching the file:

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

### Outbound events (HTML → FileMaker)

The widget calls `window.FileMaker.PerformScript('CNAE_WebViewer_Event', payload)` where `payload` is a JSON string.

| `event` | Extra fields | When |
|---|---|---|
| `query_start` | `query`, `conversationId` | User submits a message |
| `answer_received` | `query`, `answer`, `cnaeCodes[]`, `conversationId` | Full answer received |
| `option_selected` | `code`, `description`, `confidence`, `auto`, `conversationId` | Primary result auto-selected (`auto: true`) or user clicked an alternative (`auto: false`) |
| `conversation_reset` | — | New conversation started |
| `error` | `message` | Network or API error |

All payloads also include `ts` (Unix timestamp in ms).

**FileMaker script name:** `CNAE_WebViewer_Event` (hardcoded — create a script with this exact name).

---

### Inbound commands (FileMaker → HTML)

Call `window.fmReceive(jsonString)` from a FileMaker script using *Perform JavaScript in Web Viewer*.

```json
{ "action": "send",            "query": "Venda de roba en linia" }
{ "action": "setApiKey",       "key": "app-xxxx" }
{ "action": "setLang",         "lang": "ca" }
{ "action": "setTheme",        "theme": "dark" }
{ "action": "newConversation"  }
```

---

### Global functions

These are also callable directly from FileMaker's *Perform JavaScript in Web Viewer* step:

| Function | Description |
|---|---|
| `fmReceive(json)` | Process any inbound command (see above) |
| `fmGetState()` | Returns JSON: `{ conversationId, lastAnswer, lastCodes, lang, theme }` |
| `fmNewConversation()` | Reset conversation |
| `fmSetLang(code)` | Switch language: `'en'`, `'es'`, `'ca'` |
| `fmSetTheme(mode)` | Switch theme: `'light'`, `'dark'` |

---

## Theming

The widget uses CSS custom properties. The full light and dark palettes are declared in `:root` and `[data-theme="dark"]` at the top of the `<style>` block — easy to customise without touching layout code.

The toggle button (moon/sun icon) is in the header. Clicking it calls `toggleTheme()`.

---

## CNAE answer format

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
