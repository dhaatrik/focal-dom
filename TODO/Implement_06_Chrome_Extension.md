# Part 06: Mode A Live Recording Chrome Extension (`@focaldom/extension`)

**Document Path:** `TODO/Implement_06_Chrome_Extension.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Previous Part:** [Implement_05_Desktop_App.md](Implement_05_Desktop_App.md)  

---

## 📌 Overview & Goals

Build `@focaldom/extension`—the Manifest V3 Chrome Extension enabling Mode A (Live Human Recording). When activated on any active tab, it injects the DOM event tracker, captures real-time interactions (clicks, hovers, scrolls, text inputs, sticky header bounds), and streams telemetry via WebSocket directly to the FocalDOM desktop app (`apps/desktop`).

---

## 📂 Target Extension Structure

```
packages/extension/
├── manifest.json                    # Chrome Extension Manifest V3 configuration
├── src/
│   ├── content/
│   │   ├── content-script.ts        # Content script injected into host pages
│   │   ├── dom-tracker.ts           # Event listener & sticky rect extractor
│   │   └── visual-overlay.ts        # In-page recording indicator & badge
│   ├── background/
│   │   ├── service-worker.ts        # Background service worker
│   │   └── websocket-client.ts      # Streamer to ws://127.0.0.1:48480
│   ├── popup/
│   │   ├── Popup.tsx                # Quick start/stop recording UI
│   │   ├── popup.html
│   │   └── popup.css
│   └── utils/
│       └── messaging.ts
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Phases & Sub-Phases

### Phase 06.1: Manifest V3 Configuration (`manifest.json`)
- [ ] **Sub-phase 06.1.1:** Configure permissions:
  ```json
  {
    "manifest_version": 3,
    "name": "FocalDOM Live Recorder",
    "version": "1.0.0",
    "permissions": ["activeTab", "scripting", "storage", "tabs"],
    "host_permissions": ["<all_urls>"],
    "background": {
      "service_worker": "dist/background/service-worker.js"
    },
    "action": {
      "default_popup": "dist/popup/index.html"
    }
  }
  ```

### Phase 06.2: In-Page Content Script & Telemetry (`src/content/`)
- [ ] **Sub-phase 06.2.1:** Port `DOMMetadataTracker` from `@focaldom/core`:
  - Intercept user click, hover, scroll, and input events.
  - Scan for `position: fixed` and `position: sticky` headers and compute bounding boxes.
- [ ] **Sub-phase 06.2.2:** Inject minimal floating visual recording badge in the top-right corner of the web page to indicate active capture.

### Phase 06.3: WebSocket Streaming Client (`src/background/`)
- [ ] **Sub-phase 06.3.1:** Connect background service worker to Desktop application WebSocket (`ws://127.0.0.1:48480`).
- [ ] **Sub-phase 06.3.2:** Buffer and stream DOM event frames with high-precision `performance.now()` timestamps.
- [ ] **Sub-phase 06.3.3:** Handle auto-reconnect and heartbeat ping/pong.

### Phase 06.4: Recording Control Popup (`src/popup/`)
- [ ] **Sub-phase 06.4.1:** Build lightweight React popup with:
  - Connection status indicator (🟢 Connected to Desktop App / 🔴 Disconnected).
  - Start Recording / Stop Recording button.
  - Recording duration timer.

---

## 🧪 Extension Testing Plan
- Load unpacked extension in Chrome / Chromium.
- Verify live event streaming to a mock WebSocket server on `ws://127.0.0.1:48480`.
- Verify minimal latency (<10ms) and zero impact on target webpage rendering performance.

---

## ✅ Acceptance Criteria
1. Extension installs cleanly in Chrome Developer mode without errors.
2. Clicking Start Recording streams live DOM click and scroll coordinates to the desktop app.
3. Sticky header boundaries are accurately calculated and transmitted.
