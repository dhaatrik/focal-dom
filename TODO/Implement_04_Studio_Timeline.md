# Part 04: Studio NLE Timeline UI (`@focaldom/studio`)

**Document Path:** `TODO/Implement_04_Studio_Timeline.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Previous Part:** [Implement_03_Renderer_Engine.md](Implement_03_Renderer_Engine.md)  
**Next Part:** [Implement_05_Desktop_App.md](Implement_05_Desktop_App.md)  

---

## 📌 Overview & Goals

Build `@focaldom/studio`—the modern, responsive Non-Linear Editing (NLE) dashboard for FocalDOM. Built with React 19, TailwindCSS, and Zustand, it provides an interactive multi-track timeline, real-time Pixi.js canvas preview viewport, physics damping/stiffness inspector, canvas background & window styler, and export modal.

---

## 📂 Target Package Structure

```
packages/studio/
├── src/
│   ├── components/
│   │   ├── header/
│   │   │   ├── TopNavBar.tsx        # Project title, undo/redo, export trigger button
│   │   │   └── ProjectControls.tsx
│   │   ├── viewport/
│   │   │   ├── CanvasViewport.tsx   # Embedded Pixi.js canvas container & zoom controls
│   │   │   └── PlaybackControls.tsx # Play/pause, scrub, loop, speed (0.5x, 1x, 2x)
│   │   ├── timeline/
│   │   │   ├── TimelineHeader.tsx   # Timecode ruler, playhead marker
│   │   │   ├── VideoTrack.tsx       # Video frame thumbnails & waveform
│   │   │   ├── KeyframeTrack.tsx    # Draggable camera zoom segments & ease curves
│   │   │   ├── EventTrack.tsx       # DOM click, scroll, and input badge markers
│   │   │   ├── CursorTrack.tsx      # Cursor visibility & ripple triggers
│   │   │   └── TimelineContainer.tsx
│   │   ├── inspector/
│   │   │   ├── PhysicsTuner.tsx     # Stiffness, damping, mass, lookahead sliders
│   │   │   ├── StylingPanel.tsx     # Window frame, aspect ratio, gradient background
│   │   │   └── KeyframeInspector.tsx# Selected zoom level, target element details
│   │   └── modal/
│   │       └── ExportModal.tsx      # 4K/1080p preset selector, encoder progress bar
│   ├── store/
│   │   ├── project-store.ts         # Active project state, keyframes, DOM events
│   │   ├── playback-store.ts        # Current timestamp, isPlaying, speed
│   │   └── ui-store.ts              # Selected keyframe ID, active sidebar tab
│   ├── hooks/
│   │   ├── usePlaybackLoop.ts       # requestAnimationFrame synchronized playback
│   │   ├── useKeyframeDrag.ts       # Smooth drag-and-drop keyframe timeline resizing
│   │   └── useKeyboardShortcuts.ts  # Space (play/pause), J/K/L, Ctrl+Z/Ctrl+Y
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Phases & Sub-Phases

### Phase 04.1: State Management & Project Model (`src/store/`)
- [x] **Sub-phase 04.1.1:** Implement Zustand `projectStore`:
  - Load project (`FocalDOMProject`), add/remove/update keyframes, undo/redo history stack.
- [x] **Sub-phase 04.1.2:** Implement Zustand `playbackStore`:
  - `currentTimeMs`, `durationMs`, `isPlaying`, `playbackRate` $(0.25\times - 4\times)$, `loop`.

### Phase 04.2: Interactive Multi-Track Timeline (`src/components/timeline/`)
- [x] **Sub-phase 04.2.1:** Implement `TimelineHeader` with sub-millisecond timecode ruler, zoomable scale ($1\text{s} = 50\text{px} \dots 500\text{px}$), and draggable playhead.
- [x] **Sub-phase 04.2.2:** Implement `KeyframeTrack`:
  - Visual blocks representing active zoom intervals.
  - Left/right handles to drag duration; double click to edit zoom scale; delete key to remove.
- [x] **Sub-phase 04.2.3:** Implement `EventTrack`:
  - Visual icons for DOM clicks (🎯), text input (⌨️), scroll (📜), and hover (👆).
  - Hovering an event reveals element tagName, id, class, and bounding box dimensions.

### Phase 04.3: Real-Time Canvas Viewport & Inspector Panel (`src/components/viewport/` & `src/components/inspector/`)
- [x] **Sub-phase 04.3.1:** Embed `@focaldom/renderer` Pixi.js canvas within `CanvasViewport`.
- [x] **Sub-phase 04.3.2:** Implement `PhysicsTuner`:
  - Sliders for Stiffness ($20 \dots 400$), Damping ($5 \dots 50$), Mass ($0.1 \dots 5$), Lookahead ($0 \dots 1000\text{ms}$).
  - Live feedback updates camera physics immediately on playback.
- [x] **Sub-phase 04.3.3:** Implement `StylingPanel`:
  - Aspect Ratio presets (`16:9`, `9:16`, `1:1`, `4:3`).
  - Window frame styling (Show titlebar, corner radius, shadow spread/blur).
  - Background options: Gradient presets, solid color picker, blurred background image.

### Phase 04.4: Export Modal with Progress Monitoring (`src/components/modal/`)
- [x] **Sub-phase 04.4.1:** Implement `ExportModal`:
  - Resolution selector (4K 2160p, 1440p, 1080p, 720p).
  - Framerate (30, 60, 120 FPS).
  - Codec (H.264 MP4, HEVC H.265, ProRes 422, GIF).
  - Live progress bar, elapsed time, remaining ETA, and cancel button.

---

## 🧪 UI Testing & Verification Plan
- Component tests via Vitest & React Testing Library for timeline scrubber, keyframe dragging, and playback controls.
- E2E testing using Playwright to verify project load, keyframe adjustment, and export dialog triggering.

---

## ✅ Acceptance Criteria
1. Timeline supports smooth scrubbing and 60 FPS real-time canvas playback.
2. Keyframes are freely draggable, resizable, and modifiable.
3. Physics and styling controls immediately update the preview canvas.
