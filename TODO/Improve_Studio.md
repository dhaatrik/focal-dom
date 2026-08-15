# FocalDOM Studio Deep Investigation, Flaw Analysis & Improvement Plan 🎬✨

**Document Path:** `TODO/Improve_Studio.md`  
**Parent Architecture:** [docs/README.md](../docs/README.md)  
**Audit Reference:** [TODO/AUDIT_REPORT.md](AUDIT_REPORT.md)  
**Suggested Implementation Branch:** `feat/studio-perfection`  
**Target Package:** `packages/studio` (`@focaldom/studio`)  
**Status:** 🚀 In Progress (Implementation Branch Active)  

---

## 📌 Executive Summary

A comprehensive, line-by-line engineering audit of all source files in `packages/studio/` (`App.tsx`, timeline components, viewport canvas, inspector panels, export modal, keyboard hooks, and Zustand state stores) revealed several key usability limitations, missing magnetic timeline snapping, mock video export logic, uncapped undo history memory consumption, and canvas context recreation flashing.

This document details all investigated flaws, classifies them by severity and root cause, and provides an actionable, finely divided multi-phase engineering remediation plan with granular checklists to elevate `packages/studio` to a **10.0 / 10.0**.

---

## 🔍 Detailed Flaw & Vulnerability Audit Matrix

### 1. Timeline & Drag Ergonomics (`src/components/timeline/`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **ST-01** | 🔴 **Major** | Missing Magnetic Snapping | `KeyframeTrack.tsx:16-59` | Dragging or resizing keyframes lacks collision detection with DOM event markers (clicks, inputs, focus). | Keyframes cannot easily snap to precise user interaction moments, causing alignment friction. |
| **ST-02** | 🟡 **Medium** | Timeline Zoom & Pan | `TimelineContainer.tsx:26-49` | Timeline zoom is only adjustable via a small slider. Missing `Ctrl + Wheel` interactive zoom and `Shift + Wheel` horizontal pan. | Suboptimal desktop NLE editing ergonomics compared to Premiere / Final Cut / CapCut. |
| **ST-03** | 🟡 **Medium** | Ruler Scrubbing Offset | `TimelineHeader.tsx:16-35` | `handlePointerDown` computes offset without compensating for `scrollLeft` of the parent container when scrolled horizontally. | Playhead jumps erratically when scrubbing a horizontally-scrolled timeline. |

---

### 2. Video Export Modal & Desktop IPC Integration (`src/components/modal/ExportModal.tsx`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **ST-04** | 🔴 **Major** | Simulated Export | `ExportModal.tsx:21-38` | `ExportModal` uses a fake `setInterval` progress timer and does not connect to `window.focalApi.exportVideo` or subscribe to `window.focalApi.onExportProgress`. | Export modal does not perform actual FFmpeg rendering when running in the Desktop Electron shell. |
| **ST-05** | 🟡 **Medium** | Missing Browser Fallback | `ExportModal.tsx:21-38` | In pure browser environments (outside Electron), no `MediaRecorder` or WebCodecs canvas recording fallback is executed. | In-browser studio users cannot export their creations. |

---

### 3. Viewport Canvas & Pixi Lifecycle (`src/components/viewport/CanvasViewport.tsx`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **ST-06** | 🟡 **Medium** | Context Rebuild Flashing | `CanvasViewport.tsx:29-55` | Changing `aspectRatio` destroys and recreates the entire `FocalPixiApp` WebGL instance rather than resizing the existing renderer. | Causes visible black canvas flashing during aspect ratio toggles. |
| **ST-07** | 🟢 **Minor** | Responsive Resize Observer | `CanvasViewport.tsx:64-70` | Canvas container does not use `ResizeObserver` to adaptively scale when inspector sidebar opens/closes. | Letterboxing does not adapt smoothly to window resizing. |

---

### 4. NLE Keyboard Shortcuts (`src/hooks/useKeyboardShortcuts.ts`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **ST-08** | 🟡 **Medium** | Missing Keyframe Split | `useKeyboardShortcuts.ts` | Missing `S` key shortcut to split selected keyframe at `currentTimeMs`. | Users cannot quickly cut/split zoom blocks without manually calculating timestamps. |
| **ST-09** | 🟢 **Minor** | Missing Shuttle Controls | `useKeyboardShortcuts.ts` | Missing `Home` / `End` (jump to start/end) and `J` / `K` / `L` standard playback shortcuts. | Power users lack fast keyboard-only scrubbing workflows. |

---

### 5. State Management & Undo Memory (`src/store/project-store.ts`)

| ID | Severity | Category | File & Lines | Flaw / Vulnerability Description | Impact |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **ST-10** | 🟡 **Medium** | Uncapped Undo Stack | `project-store.ts:38-147` | History stack grows indefinitely on every slider move / drag event without a 50-step cap. | Potential memory bloat during prolonged editing sessions. |

---

## 🏗️ Target Studio NLE Architecture

```mermaid
flowchart TD
    subgraph UI_Shell [Studio Application Shell]
        NAV[TopNavBar: Title, Undo/Redo, Export]
        WORKSPACE[Studio Workspace Grid]
        TIMELINE[Multi-Track NLE Timeline]
    end

    subgraph State_Management [Zustand Reactive Stores]
        P_STORE[ProjectStore: Capped 50-step History & Keyframe Split]
        PB_STORE[PlaybackStore: 60fps Loop & Shuttle]
        UI_STORE[UIStore: Selection, Zoom, Modals]
    end

    subgraph Timeline_Engine [Magnetic Multi-Track Engine]
        SNAP[Magnetic Snap Engine: Proximity Detection] --> KF_TRACK[KeyframeTrack: Camera Zooms]
        EVENT_TRACK[EventTrack: DOM Clicks & Focus] --> SNAP
        RULER[TimelineHeader: Ctrl+Wheel Zoom & Scroll Safe Scrub]
    end

    subgraph Export_Pipeline [Hybrid Export Engine]
        MODAL[ExportModal UI]
        MODAL -->|Electron Shell| IPC_EXP[window.focalApi.exportVideo + live progress]
        MODAL -->|Web Browser| WEB_EXP[Client MediaRecorder / Manifest Generator]
    end
```

---

## 🛠️ Granular Phase-Wise Implementation Checklist

### Phase 01: Multi-Track Magnetic Snapping & Timeline Ergonomics (`src/components/timeline/`)
- [ ] **Sub-phase 01.1: Implement Magnetic Snapping Engine (`src/hooks/useMagneticSnapping.ts`)**
  - [ ] Implement `findMagneticSnapPoint(targetMs, snapTargetsMs, timelineZoom, thresholdPx = 10)` utility.
  - [ ] Integrate snapping into `KeyframeTrack.tsx` for dragging keyframe start times and resizing durations.
  - [ ] Collect snap targets from DOM event timestamps (`events.map(e => e.timestamp)`) and adjacent keyframe boundaries.
- [ ] **Sub-phase 01.2: Interactive Timeline Zoom & Pan (`TimelineContainer.tsx`)**
  - [ ] Add `onWheel` listener on `.timeline-scroll-area` for `Ctrl + Wheel` smooth zoom ($30\text{px}/s \dots 600\text{px}/s$).
  - [ ] Support horizontal trackpad pan and `Shift + Wheel` scrolling.
- [ ] **Sub-phase 01.3: Scroll-Compensated Ruler Scrubbing (`TimelineHeader.tsx`)**
  - [ ] Compute playhead position relative to ruler element with parent `scrollLeft` compensation.

---

### Phase 02: Real Video Export Integration (`src/components/modal/ExportModal.tsx`)
- [ ] **Sub-phase 02.1: Native Desktop IPC Export Connection**
  - [ ] Connect `ExportModal.tsx` to `window.focalApi.exportVideo` when available in Electron desktop environment.
  - [ ] Subscribe to `window.focalApi.onExportProgress` for real-time percentage, frame count, and FPS stats.
- [ ] **Sub-phase 02.2: In-Browser Client-Side Export Fallback**
  - [ ] Provide client-side export fallback in web browser environments.

---

### Phase 03: Viewport Lifecycle & Dynamic Resizing (`src/components/viewport/CanvasViewport.tsx`)
- [ ] **Sub-phase 03.1: Dynamic Viewport Resize Method**
  - [ ] Call `appRef.current.resize(dimensions, project)` on aspect ratio changes instead of destroying and recreating the WebGL instance.
- [ ] **Sub-phase 03.2: ResizeObserver for Responsive Viewport**
  - [ ] Add `ResizeObserver` on `.canvas-viewport-container` to automatically update viewport canvas scaling.

---

### Phase 04: NLE Power Shortcuts & Split Editing (`src/hooks/useKeyboardShortcuts.ts`)
- [ ] **Sub-phase 04.1: Keyframe Split Action (`S` Key)**
  - [ ] Implement `splitKeyframe(selectedKeyframeId, currentTimeMs)` action in `useProjectStore`.
  - [ ] Bind `S` key in `useKeyboardShortcuts.ts` to split keyframe at current playhead timestamp.
- [ ] **Sub-phase 04.2: Shuttle & Navigation Shortcuts**
  - [ ] `Home`: Seek to `0ms`.
  - [ ] `End`: Seek to `durationMs`.
  - [ ] `J` / `K` / `L`: Reverse / Pause / Fast-Forward shuttle controls.

---

### Phase 05: State Hardening & Memory Guarding (`src/store/project-store.ts`)
- [ ] **Sub-phase 05.1: Capped 50-Step Undo/Redo Stack**
  - [ ] Limit `history` array to maximum 50 states (`history.slice(-50)`).
  - [ ] Limit `future` array to maximum 50 states (`future.slice(-50)`).
- [ ] **Sub-phase 05.2: Structured Cloning & Immutability**
  - [ ] Ensure deep immutability when capturing history snapshots.
- [ ] **Sub-phase 05.3: Unit Testing & Monorepo Verification**
  - [ ] Add unit tests for capped history and keyframe splitting in `studio-store.test.ts`.
  - [ ] Verify full monorepo with `pnpm test`.

---

## ✅ Acceptance Criteria & Quality Checklist

1. **Magnetic Snapping:** Keyframes snap to exact DOM click/input timestamps when dragged within $10\text{px}$.
2. **Smooth Ergonomic Zoom:** `Ctrl + Wheel` zooms the timeline smoothly centered on the cursor.
3. **Live Desktop Export:** `ExportModal` connects to desktop IPC and streams real-time FFmpeg encoding progress.
4. **NLE Split Tool:** Pressing `S` cleanly splits the active keyframe at the playhead position.
5. **Bounded Memory Footprint:** History stack remains capped at 50 steps without memory leaks.
6. **Zero-Flicker Viewport:** Aspect ratio toggles smoothly without canvas recreation flashing.
