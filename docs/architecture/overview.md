# System Architecture Overview

**FocalDOM** bridges deterministic browser automation (Mode B: Playwright CDP) and live telemetry recording (Mode A: Chrome Extension) with a hardware-accelerated post-processing virtual camera engine.

---

## 🏗️ Multi-Phase Pipeline Architecture

```mermaid
flowchart TD
    subgraph Ingestion [Phase 1: Ingestion & Telemetry Capture]
        direction TB
        A1[Mode A: Live Human Telemetry<br/>Chrome Extension Manifest V3] -->|WebSocket IPC: 48480| SERVER[apps/desktop Telemetry Server]
        A2[Mode B: Automated Playwright<br/>Deterministic CDP Frame Stepper] -->|__focal_tick & rAF Hook| SESSION[FocalCaptureSession Runner]
        SERVER --> DUAL[Dual Artifacts Bundle]
        SESSION --> DUAL
        DUAL --> RAW[Raw Frame Sequence / Video]
        DUAL --> JSON[Structured DOM Event Log JSON]
    end

    subgraph CoreEngine [Phase 2: Core Math, Physics & Lookahead]
        direction TB
        RAW & JSON --> LOOKAHEAD[400ms Lookahead Buffer<br/>Smart Event Clustering]
        LOOKAHEAD --> SPRING[2nd-Order Spring Camera ODE<br/>& Multi-Curve Analytical Easing]
        LOOKAHEAD --> AVOID[Sticky Header Safe-Zones<br/>Viewport Deadzone Avoidance]
        JSON --> CURSOR[Catmull-Rom Bezier Spline<br/>Cursor Smoother & Ripple Math]
    end

    subgraph Rendering [Phase 3: Post-Processing & Export]
        direction TB
        SPRING & AVOID & CURSOR --> PIXI[Pixi.js WebGL2 / WebGPU Scene Graph]
        PIXI --> SHADERS[Dual WGSL/GLSL Motion Blur<br/>& Elevation Drop-Shadow Shaders]
        SHADERS --> STUDIO[React 19 + Zustand NLE Studio]
        SHADERS -->|Raw RGBA Byte Stream Pipe| FFMPEG[FFmpeg Engine<br/>4K 60/120 FPS H.264/HEVC/ProRes]
    end
```

---

## 📦 Monorepo Package Topology

FocalDOM is architected as an immutable, strictly-typed monorepo managed via **PNPM Workspaces**:

```mermaid
graph TD
    CORE["@focaldom/core<br/>(Zero Dependencies)"]
    
    PLAYWRIGHT["@focaldom/capture-playwright<br/>(Playwright + CDP)"]
    RENDERER["@focaldom/renderer<br/>(Pixi.js WebGPU + FFmpeg)"]
    EXTENSION["@focaldom/extension<br/>(Manifest V3 Chrome Extension)"]
    
    STUDIO["@focaldom/studio<br/>(React 19 + Zustand NLE)"]
    DESKTOP["apps/desktop<br/>(Electron Windows Shell)"]

    CORE --> PLAYWRIGHT
    CORE --> RENDERER
    CORE --> EXTENSION
    CORE --> STUDIO
    
    RENDERER --> STUDIO
    PLAYWRIGHT --> STUDIO
    
    RENDERER --> DESKTOP
    STUDIO --> DESKTOP
```

### Subsystem Boundaries & Responsibilities

| Package / App | Core Responsibilities | Technology Stack |
| :--- | :--- | :--- |
| [`@focaldom/core`](../../packages/core) | Pure mathematical formulas, 2nd-order ODE spring camera, cubic Bezier cursor smoothing, sticky avoidance heuristics, and canonical project schemas. | Vanilla TypeScript (Zero external dependencies) |
| [`@focaldom/capture-playwright`](../../packages/capture-playwright) | Deterministic CDP screencast collector, in-page DOM metadata tracker, virtual clock injector, and scenario CLI runner. | Playwright, Chromium CDP, CAC |
| [`@focaldom/renderer`](../../packages/renderer) | Pixi.js scene graph compositing, dual WebGPU WGSL / WebGL2 GLSL 4-pass temporal motion blur shaders, and raw RGBA FFmpeg streaming pipes. | Pixi.js v8, WebGPU, WebGL2, FFmpeg |
| [`@focaldom/studio`](../../packages/studio) | Multi-track NLE timeline UI, magnetic snap-to-event collision detection, real-time physics tuner, styling inspector, and export modal. | React 19, Zustand, Lucide Icons, Vite |
| [`@focaldom/extension`](../../packages/extension) | Manifest V3 Chrome Extension streaming live DOM bounding boxes and pointer telemetry over WebSocket. | Chrome Extensions MV3, WebSockets |
| [`apps/desktop`](../../apps/desktop) | Electron desktop shell for Windows, WebSocket telemetry server, `.focal` ZIP project manager, and native FFmpeg process controller. | Electron, Node.js, Archiver, Adm-Zip |

---

## 🔄 Dual Ingestion Modes

### Mode A: Live Human Telemetry Recording
- The user browses naturally on any live website with the **FocalDOM Chrome Extension** active.
- As the user clicks, types, hovers, and scrolls, the injected content script serializes DOM element coordinates, computed z-indices, and sticky header bounds.
- Telemetry is streamed over local WebSocket (`ws://127.0.0.1:48480`) to the **Electron Desktop App**, creating an editable project in the Studio.

### Mode B: Automated Playwright Deterministic Capture
- Automated test scripts or declarative `scenario.yaml` files drive a headless Chromium instance.
- The **Virtual Clock** overrides `requestAnimationFrame` and `performance.now()`, locking browser time strictly to sequential frame indices.
- Captures pixel-perfect, 60/120 FPS videos with zero dropped frames even on complex, computationally heavy web applications.
