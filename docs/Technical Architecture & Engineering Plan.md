# FocalDOM: Technical Architecture & Detailed Engineering Plan

**Project Codename:** `FocalDOM`  
**License:** MIT License  
**Document Version:** 3.1.0 (Production Specification)  
**Target Platform:** Windows (Desktop & CLI) + Chrome Extension / Headless Pipeline *(macOS and Linux planned for future releases)*  

---

## 1. Executive Architecture Summary

`FocalDOM` bridges browser DOM automation (Mode B: Deterministic Playwright capture) and live browser recording (Mode A: Chrome Extension / Desktop hook) with post-processing virtual camera rendering.

Standard screen recorders are DOM-blind—they capture raw pixels, leading to clumsy manual zooms, jagged cursor trajectories, and awkward cuts. `FocalDOM` pairs frame-accurate 60/120 FPS video capture with **semantic DOM metadata extraction**.

The post-processing engine reads DOM bounding boxes (`boundingRect`), calculates spring-physics camera transitions with sticky/fixed header avoidance safe-zones, reconstructs smoothed vector cursors with cubic Bezier interpolation and animated click ripples, and renders sub-frame motion blur via a hardware-accelerated Pixi.js (WebGL2/WebGPU) accumulation pass, exporting directly to 4K H.264/HEVC/ProRes via raw RGBA FFmpeg streaming pipes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PHASE 1: CAPTURE ENGINE                          │
├─────────────────────────────────────┬───────────────────────────────────────┤
│    Mode B: Automated Playwright     │     Mode A: Live Human Recording      │
│     (Deterministic CDP Runner)      │   (Chrome Ext / Desktop Screen Hook)  │
└───────────────────────────────────┬─┴───────────────────────────────────────┘
                                    │
                         Generates Dual Artifacts
                                    │
                                    ├──────► Raw Frame Sequence / Video (.mp4 / .webm)
                                    └──────► Structured Event Log (.json)
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                      PHASE 2: POST-PROCESSING CANVAS ENGINE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Deterministic Frame Alignment with DOM Metadata Timeline                │
│  2. Spring Camera Matrix (x, y, scale) + Sticky Viewport Avoidance Framing  │
│  3. Reconstructed Vector SVG/Path Cursor with Bezier Smoothing & Ripples   │
│  4. Pixi.js Accumulation Render Pass (Motion Blur, Shadows, Gradients)      │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                      PHASE 3: STUDIO & EXPORT PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. React + Zustand + TailwindCSS Multi-Track NLE Timeline Editor           │
│  2. Direct Raw RGBA Byte Stream ──► FFmpeg H.264/HEVC/ProRes (4K @ 120 FPS) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Architecture & Package Layout

FocalDOM is structured as a **PNPM Monorepo** for clean separation of concerns, Windows desktop portability, and headless CLI compatibility:

```
focal-dom/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── docs/                            # Engineering specifications and architecture guides
│   └── Technical Architecture & Engineering Plan.md
├── packages/
│   ├── core/                        # Shared math, spring physics, event schemas & types
│   │   ├── src/
│   │   │   ├── camera/              # SpringCamera, Bezier easing, viewport matrices
│   │   │   ├── events/              # DOMEventFrame, DOMElementRect, Keyframe types
│   │   │   ├── cursor/              # Cubic Bezier cursor smoothing & ripple math
│   │   │   ├── avoidance/           # Sticky/fixed header deadzone calculations
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── capture-playwright/          # Mode B deterministic Playwright/CDP runner & injector
│   │   ├── src/
│   │   │   ├── runner.ts            # Deterministic step-by-step frame clock & CDP screencast
│   │   │   ├── injector.ts          # In-page dom-logger injection script
│   │   │   ├── scenario-parser.ts   # Declarative JSON/YAML scenario interpreter
│   │   │   ├── playwright-sdk.ts    # TypeScript API wrapper (focalPage)
│   │   │   └── cli.ts               # CLI executable: `focaldom capture <scenario.json>`
│   │   └── package.json
│   │
│   ├── renderer/                    # Pixi.js WebGL2/WebGPU composition & motion blur engine
│   │   ├── src/
│   │   │   ├── engine.ts            # PixiJS Application lifecycle & render loop
│   │   │   ├── layers/              # Video frame sprite, Vector Cursor, Window Frame, Background
│   │   │   ├── shaders/             # Multi-pass accumulation motion blur & gradient shaders
│   │   │   ├── exporter.ts          # Raw RGBA frame buffer extraction & FFmpeg pipe stream
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── studio/                      # React NLE timeline editor dashboard
│   │   ├── src/
│   │   │   ├── components/          # Timeline tracks, Canvas viewport, Inspector, ExportModal
│   │   │   ├── store/               # Zustand state (project, active keyframe, playback state)
│   │   │   ├── hooks/               # usePlaybackSync, useKeyframeDrag, usePhysicsTuner
│   │   │   ├── App.tsx
│   │   │   └── index.css
│   │   └── package.json
│   │
│   └── extension/                   # Mode A Chrome Extension (Manifest V3) metadata logger
│       ├── manifest.json
│       ├── src/
│       │   ├── content.ts           # Injected dom-logger.ts
│       │   ├── background.ts        # WebSocket / Native messaging streamer
│       │   └── popup/
│       └── package.json
│
└── apps/
    └── desktop/                     # Electron desktop shell (Windows)
        ├── src/
        │   ├── main/                # Electron main process, native menu, FFmpeg spawning
        │   └── preload/             # Context bridge for raw IPC & SharedArrayBuffer
        └── package.json
```

---

## 3. Detailed Component Specifications

### 3.1 In-Page Semantic Metadata Tracker (`packages/core/src/events/dom-logger.ts`)

Injected directly into browser pages to capture click, hover, input, scroll, and layout changes:

```typescript
export interface DOMElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  isFixedOrSticky: boolean;
  computedZIndex: number;
}

export interface DOMEventFrame {
  frameIndex: number;
  timestamp: number; // Milliseconds relative to session start
  eventType: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'navigation';
  cursor: { x: number; y: number };
  viewport: { width: number; height: number; devicePixelRatio: number };
  targetElement?: {
    tagName: string;
    id: string;
    classList: string[];
    role?: string;
    innerTextSnippet?: string;
    boundingRect: DOMElementRect;
  };
  scrollOffset: { x: number; y: number };
  activeStickyRegions: DOMElementRect[]; // Bounding rects of all visible sticky/fixed headers
}
```

---

### 3.2 Deterministic Frame Capture Engine (`packages/capture-playwright`)

To guarantee zero-drift frame alignment between DOM coordinates and pixel frames:
1. Chromium is launched via Playwright with CDP session enabled.
2. A deterministic virtual frame tick advances page time (`requestAnimationFrame` / `window.__focal_tick()`).
3. For each frame tick (at 60 or 120 FPS):
   - DOM state and bounding rects are captured.
   - CDP screenshot or screencast buffer is acquired for the exact frame index.
   - Raw frame is written to disk / cache alongside `events.json`.

Dual authoring format:
- **Declarative YAML/JSON Scenarios:**
  ```yaml
  name: "User Signup Flow"
  viewport: { width: 1920, height: 1080 }
  fps: 60
  steps:
    - goto: "https://example.com"
    - wait: 500
    - hover: "#features-menu"
    - wait: 300
    - click: "#signup-button"
    - type: { selector: "#email-input", text: "user@example.com", delay: 50 }
    - click: "#submit-btn"
    - wait: 1200
  ```
- **TypeScript Playwright SDK:**
  ```typescript
  import { launchFocalSession } from '@focaldom/capture-playwright';

  const session = await launchFocalSession({ fps: 60, viewport: { width: 1920, height: 1080 } });
  const page = session.getPage();
  await page.goto('https://example.com');
  await page.focalClick('#signup-button');
  await session.finalize('recordings/signup-flow');
  ```

---

### 3.3 Spring Camera & Smart Viewport Avoidance Engine (`packages/core/src/camera`)

Calculates smooth continuous 2D affine transformation matrices with sticky avoidance deadzones and 400ms look-ahead easing:

```typescript
export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export class SpringCamera {
  private current: CameraState = { x: 0, y: 0, scale: 1.0 };
  private target: CameraState = { x: 0, y: 0, scale: 1.0 };
  private velocity: CameraState = { x: 0, y: 0, scale: 0 };

  public stiffness: number = 140;
  public damping: number = 16;
  public mass: number = 1.0;

  public setTargetWithAvoidance(
    elementRect: DOMElementRect,
    viewport: { width: number; height: number },
    stickyHeaders: DOMElementRect[],
    paddingRatio: number = 1.8,
    minScale: number = 1.25,
    maxScale: number = 2.2
  ): void {
    // 1. Calculate sticky deadzone offset
    const topSafeZone = stickyHeaders.reduce((maxH, h) => Math.max(maxH, h.top + h.height), 0);
    const usableHeight = viewport.height - topSafeZone;

    // 2. Compute zoom scale bounded by usable area
    const scaleX = viewport.width / (elementRect.width * paddingRatio);
    const scaleY = usableHeight / (elementRect.height * paddingRatio);
    const desiredScale = Math.min(Math.max(Math.min(scaleX, scaleY), minScale), maxScale);

    // 3. Center element in usable viewport area below sticky headers
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;
    const targetViewportCenterY = topSafeZone + usableHeight / 2;

    this.target = {
      x: (viewport.width / 2 - elementCenterX) * desiredScale,
      y: (targetViewportCenterY - elementCenterY) * desiredScale,
      scale: desiredScale,
    };
  }

  public step(deltaTimeSeconds: number): CameraState {
    const ax = (this.stiffness * (this.target.x - this.current.x) - this.damping * this.velocity.x) / this.mass;
    const ay = (this.stiffness * (this.target.y - this.current.y) - this.damping * this.velocity.y) / this.mass;
    const aScale = (this.stiffness * (this.target.scale - this.current.scale) - this.damping * this.velocity.scale) / this.mass;

    this.velocity.x += ax * deltaTimeSeconds;
    this.velocity.y += ay * deltaTimeSeconds;
    this.velocity.scale += aScale * deltaTimeSeconds;

    this.current.x += this.velocity.x * deltaTimeSeconds;
    this.current.y += this.velocity.y * deltaTimeSeconds;
    this.current.scale += this.velocity.scale * deltaTimeSeconds;

    return this.current;
  }
}
```

---

### 3.4 Vector Cursor Reconstructor (`packages/core/src/cursor`)

Replaces jerky raw screen cursor recordings with a high-fidelity vector cursor:
- Cubic Bezier path smoothing (`getCubicBezierPoint`) over a sliding window of mouse positions.
- Click ripple animations (expanding radial circle with alpha decay on click timestamps).
- State-aware cursor shapes: `default` (arrow), `pointer` (hand), `text` (I-beam).

---

### 3.5 Pixi.js Canvas & Motion Blur Shader (`packages/renderer`)

Hardware-accelerated composition structure:
1. **Background Layer:** Mesh gradients, dark wallpapers, or blurred glassmorphism.
2. **Window Container:**
   - Window Titlebar with control buttons.
   - Rounded corners (`border-radius: 16px`) and multi-layer drop shadow.
3. **Video Viewport Sprite:** The captured frame transformed by `(currentCamera.x, currentCamera.y, currentCamera.scale)`.
4. **Motion Blur Pass:** 4-sample sub-frame accumulation shader dynamically blending camera velocity vectors.
5. **Vector Cursor Layer:** Rendered on top of the transformed viewport with scale-independent crispness.

---

### 3.6 Studio NLE Timeline UI (`packages/studio`)

Built with React 19, TailwindCSS, and Zustand:
- **Timeline Canvas:** Multi-track editor displaying:
  - Video scrub bar with action waveform.
  - Auto-generated Camera Zoom segments (with drag handles to adjust start/end times and zoom level).
  - DOM Event Markers (clickable icons revealing element metadata).
  - Cursor track.
- **Inspector Panel:**
  - Real-time Spring Physics sliders (Stiffness, Damping, Mass, Look-ahead buffer).
  - Canvas Padding & Aspect Ratio switcher (`16:9`, `9:16`, `1:1`, `4:3`).
  - Window Frame Styler (Show/hide controls, shadow intensity, border radius).
  - Background palette & gradient presets.
- **Export Dialog:**
  - Presets for YouTube (4K 60fps), Twitter/X (1080p 60fps), TikTok/Reels (9:16 vertical), and GitHub README (optimized GIF).
  - Live compilation progress bar with real-time FPS throughput and ETA.

---

### 3.7 High-Throughput FFmpeg Export Pipeline (`packages/renderer/src/exporter.ts`)

Instead of CPU-heavy PNG encoding, raw uncompressed RGBA pixel buffers are read from the WebGL/WebGPU render target and streamed directly into FFmpeg's `stdin` pipe:

```bash
ffmpeg -y -f rawvideo -pix_fmt rgba -s 3840x2160 -r 60 -i pipe:0 \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -movflags +faststart output_4k_60fps.mp4
```

Yields maximum throughput and handles 4K 60/120 FPS rendering on Windows workstations without memory exhaustion.

---

## 4. Phase-by-Phase Execution Roadmap

### Phase 1: Core Foundation & Mode B Capture (Weeks 1–3)
- [ ] Initialize PNPM monorepo with `@focaldom/core`, `@focaldom/capture-playwright`, `@focaldom/renderer`, `@focaldom/studio`, and `@focaldom/desktop`.
- [ ] Implement `dom-logger.ts` in `@focaldom/core` for DOM event tracking and sticky header extraction.
- [ ] Build `@focaldom/capture-playwright` deterministic frame-stepping runner with CDP screencast and scenario parser.
- [ ] Implement `@focaldom/capture-playwright` CLI (`focaldom capture <scenario.json>`).

### Phase 2: Post-Processing Motion & Pixi.js Canvas Engine (Weeks 4–6)
- [ ] Implement `SpringCamera` with sticky viewport avoidance framing and 400ms look-ahead buffer in `@focaldom/core`.
- [ ] Implement Vector Cursor Bezier smoothing and click ripple renderer.
- [ ] Build `@focaldom/renderer` Pixi.js engine with custom accumulation motion blur shader.
- [ ] Implement direct raw RGBA FFmpeg streaming export pipeline.

### Phase 3: Studio GUI Timeline Editor & Windows Desktop Packaging (Weeks 7–9)
- [ ] Build `@focaldom/studio` React + Zustand multi-track timeline UI with draggable keyframes.
- [ ] Integrate real-time Canvas preview with interactive physics tuner and background styler.
- [ ] Implement Export Modal with 4K/1080p presets, format selection, and progress monitoring.
- [ ] Wrap into Electron desktop shell (`@focaldom/desktop`) for Windows with native menus and bundled FFmpeg.

### Phase 4: Mode A Live Recording Extension (Weeks 10–11)
- [ ] Build Manifest V3 Chrome Extension (`@focaldom/extension`) streaming metadata to desktop app via WebSocket.
- [ ] Screen capture hook integration in Electron.

---

## 5. Verification & Acceptance Criteria

1. **Deterministic Sync:** 100% frame-to-DOM synchronization with 0 dropped frames and 0 ms drift across a 10-minute session.
2. **Auto-Zoom Precision:** Elements maintain 1.8x padding ratio with sticky headers correctly factored into safe viewport calculations.
3. **Smoothness Quality:** Cursor and camera motions exhibit smooth spring damping without jitter or sub-pixel aliasing.
4. **Export Performance:** 4K 60 FPS video export compiles at $\ge 60\text{ FPS}$ sustained throughput on Windows workstations.
