# FocalDOM Chrome Extension Deep Investigation, Flaw Analysis & Improvement Plan 🧩📡

**Document Path:** `TODO/Improve_Extension.md`  
**Parent Architecture:** [docs/README.md](../docs/README.md)  
**Audit Reference:** [TODO/AUDIT_REPORT.md](AUDIT_REPORT.md)  
**Suggested Implementation Branch:** `feat/extension-perfection`  
**Target Package:** `packages/extension` (`@focaldom/extension`)  
**Status:** ✅ Completed (All 5 Phases Implemented & Verified)  

---

## 📌 Executive Summary

A comprehensive, line-by-line engineering audit of all source files in `packages/extension/` (`manifest.json`, `service-worker.ts`, `websocket-client.ts`, `content-script.ts`, `dom-tracker.ts`, `visual-overlay.ts`, and `popup.ts`) revealed critical Manifest V3 service worker lifecycle termination risks, brute-force layout thrashing during sticky header scans, linear WebSocket reconnection polling, lack of Shadow DOM traversal, and hardcoded port configurations.

This document details all investigated flaws, classifies them by severity and root cause, and provides an actionable, finely divided multi-phase engineering remediation plan with granular checklists to elevate `packages/extension` to a **10.0 / 10.0**.

---

## 🔍 Detailed Flaw & Vulnerability Audit Matrix

### 1. Manifest V3 Service Worker Lifecycle (`src/background/service-worker.ts`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **EXT-01** | 🔴 **Major** | Worker Suspension | `service-worker.ts:4-7` | Manifest V3 service workers terminate after 30s of inactivity. `isRecording`, `activeRecordingTabId`, and `wsClient` reside strictly in RAM and are lost when the worker goes idle. | Telemetry stream halts mid-recording if no user clicks occur for 30 seconds. |
| **EXT-02** | 🟡 **Medium** | Navigation State Loss | `service-worker.ts:14-45` | If the user navigates to another page or reloads the tab, `chrome.tabs.onUpdated` is not listened to, so tracking is not re-established on the reloaded page. | Tracking silently stops on link clicks or form submissions that trigger page reloads. |

---

### 2. WebSocket Telemetry Client (`src/background/websocket-client.ts`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **EXT-03** | 🟡 **Medium** | Reconnect Hammering | `websocket-client.ts:96-101` | `scheduleReconnect` polls with a fixed 2s `setInterval` forever if the desktop app is closed. | Wastes CPU cycles and spams network logs when the user is not actively recording. |
| **EXT-04** | 🟡 **Medium** | Hardcoded Port | `websocket-client.ts:16-19` | Port `48480` is hardcoded with no UI option to customize the port from `popup.html` or storage. | Inability to connect if desktop app is configured to an alternate port. |

---

### 3. Content Script & DOM Tracker Performance (`src/content/dom-tracker.ts`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **EXT-05** | 🔴 **Major** | Layout Thrashing | `dom-tracker.ts:85-108` | `scanStickyRegions` executes `window.getComputedStyle(el)` on up to 500 elements on every scroll tick. | Causes severe CPU spikes and frame drops on heavy web apps (Notion, Figma, Linear). |
| **EXT-06** | 🟡 **Medium** | Shadow DOM Blindspot | `dom-tracker.ts:58-69` | `e.target` does not pierce Shadow DOM boundaries, so clicks inside Web Components return generic wrapper tags. | Auto-zoom camera cannot calculate precise inner button/input targets in web components. |

---

### 4. Extension Popup & Permissions (`src/popup/` & `manifest.json`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **EXT-07** | 🟢 **Minor** | Missing Settings UI | `popup.html` & `popup.ts` | No configuration menu to adjust desktop WebSocket port or toggle sticky header detection. | Reduced flexibility for power users and enterprise network environments. |

---

## 🏗️ Target Extension Architecture

```mermaid
flowchart TD
    subgraph Browser_Tab [Active Web Page Context]
        OVERLAY[Recording Visual Overlay]
        DOM_TRACK[ExtensionDOMTracker: Composed Path & Shadow DOM]
        CACHE_SCAN[Cached Sticky Scanner: 0-Reflow Heuristic] --> DOM_TRACK
    end

    subgraph Content_Bridge [Content Script Bridge]
        DOM_TRACK -->|DOM_EVENT_FRAME| CS_SEND[chrome.runtime.sendMessage]
    end

    subgraph Background_Worker [Manifest V3 Background Service Worker]
        CS_SEND --> SW[service-worker.ts: Keepalive Heartbeat & Tab Listener]
        SESSION[chrome.storage.session: Active State Persistence] <--> SW
        SW --> WS_CLI[Jittered Exponential Backoff WebSocket Client]
    end

    subgraph Desktop_Bridge [Desktop Application]
        WS_CLI -->|ws://127.0.0.1:48480| DESKTOP[apps/desktop Telemetry Server]
    end
```

---

## 🛠️ Granular Phase-Wise Implementation Checklist

### Phase 01: Manifest V3 Service Worker Lifecycle & Keepalive (`src/background/service-worker.ts`)
- [x] **Sub-phase 01.1: 15s Heartbeat Ping Keepalive**
  - [x] Implement periodic keepalive heartbeat preventing service worker sleep during active recording.
- [x] **Sub-phase 01.2: Session Storage State Persistence**
  - [x] Store `{ isRecording, activeRecordingTabId }` in `chrome.storage.session` and rehydrate state on startup.
- [x] **Sub-phase 01.3: Tab Navigation Auto-Reconnection**
  - [x] Listen to `chrome.tabs.onUpdated` to re-arm recording and overlay when active tab navigates.

---

### Phase 02: Jittered Exponential Backoff & Configurable Ports (`src/background/websocket-client.ts`)
- [x] **Sub-phase 02.1: Jittered Exponential Backoff Algorithm**
  - [x] Implement backoff delay calculation $\min(30000, 1000 \cdot 1.5^{\text{attempts}}) + \text{jitter}$.
  - [x] Reset retry count on successful open connection.
- [x] **Sub-phase 02.2: Configurable Custom Port Storage**
  - [x] Support custom port configuration and dynamic port switching.

---

### Phase 03: High-Performance DOM Tracker & Shadow DOM Ingestion (`src/content/dom-tracker.ts`)
- [x] **Sub-phase 03.1: Composed Path Shadow DOM Target Extraction**
  - [x] Use `e.composedPath()[0]` to pierce open shadow roots and extract precise target element metadata.
- [x] **Sub-phase 03.2: Zero-Reflow Sticky Region Scanning**
  - [x] Query targeted selectors (`header, nav, [class*="sticky"], [class*="fixed"], [style*="position"]`) with 500ms scan caching to eliminate layout thrashing.

---

### Phase 04: Popup Settings Drawer (`src/popup/`)
- [x] **Sub-phase 04.1: Settings UI in `popup.html`**
  - [x] Add collapsible settings panel to customize desktop WebSocket port.
- [x] **Sub-phase 04.2: Settings Storage in `popup.ts`**
  - [x] Persist and load preferences from `chrome.storage.sync`.

---

### Phase 05: Unit & Extension Testing Suite
- [x] **Sub-phase 05.1: Test Exponential Backoff Timing**
  - [x] Verify jittered backoff calculation in `websocket-client.test.ts`.
- [x] **Sub-phase 05.2: Test Shadow Root Target Extraction**
  - [x] Verify deep element metadata extraction in `dom-tracker.test.ts`.
- [x] **Sub-phase 05.3: Build & Monorepo Verification**
  - [x] Run `pnpm --filter @focaldom/extension run build`.
  - [x] Run `pnpm test` across monorepo with 100% pass rate.

---

## ✅ Acceptance Criteria & Quality Checklist

1. **Uninterrupted Recording:** Service worker remains active throughout multi-minute recordings without dropping WebSocket connections.
2. **Page Navigation Resilience:** Full-page reloads and link clicks maintain continuous recording seamlessly.
3. **Smooth 60fps Browsing:** Sticky header scans never cause layout thrashing on complex sites.
4. **Deep Component Awareness:** Clicks inside Shadow DOM elements capture precise element bounding rects.
5. **Configurable Port:** Users can set custom WebSocket ports via the popup UI.
