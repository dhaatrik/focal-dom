# FocalDOM Implementation Roadmap & Dependency Graph

Welcome to the FocalDOM modular implementation roadmap. This directory breaks down the engineering specification from [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md) into concrete, actionable implementation plans for each subsystem.

---

## 🗺️ Subsystem Dependency Map

```mermaid
graph TD
    M[00. Monorepo & Tooling Setup] --> C[01. Core Engine (@focaldom/core)]
    C --> P[02. Playwright Capture Engine (@focaldom/capture-playwright)]
    C --> R[03. Pixi.js Canvas & Motion Blur Renderer (@focaldom/renderer)]
    R --> S[04. Studio NLE Timeline UI (@focaldom/studio)]
    P --> S
    S --> D[05. Electron Desktop App (apps/desktop)]
    R --> D
    C --> E[06. Chrome Extension Mode A (@focaldom/extension)]
    E --> D
```

---

## 📋 Implementation Parts Directory

| Part | Document | Primary Scope | Status |
| :--- | :--- | :--- | :--- |
| **00** | [Implement_00_Foundation_Monorepo.md](Implement_00_Foundation_Monorepo.md) | PNPM workspaces, TypeScript configs, build pipelines, shared tooling | ✅ Done |
| **01** | [Implement_01_Core_Engine.md](Implement_01_Core_Engine.md) | `@focaldom/core`: Spring physics, Bezier cursor math, sticky avoidance, data schemas | ✅ Done |
| **02** | [Implement_02_Capture_Playwright.md](Implement_02_Capture_Playwright.md) | `@focaldom/capture-playwright`: Mode B deterministic CDP frame clock, in-page logger, scenario runner | ✅ Done |
| **03** | [Implement_03_Renderer_Engine.md](Implement_03_Renderer_Engine.md) | `@focaldom/renderer`: Pixi.js composition, motion blur shaders, raw RGBA FFmpeg pipe | ✅ Done |
| **04** | [Implement_04_Studio_Timeline.md](Implement_04_Studio_Timeline.md) | `@focaldom/studio`: React 19 + Zustand multi-track timeline, physics tuner, styling panel | ✅ Done |
| **05** | [Implement_05_Desktop_App.md](Implement_05_Desktop_App.md) | `apps/desktop`: Electron Windows shell, native FFmpeg bundling, SharedArrayBuffer IPC | ⏳ Ready |
| **06** | [Implement_06_Chrome_Extension.md](Implement_06_Chrome_Extension.md) | `@focaldom/extension`: Mode A Manifest V3 live recording & WebSocket telemetry | ⏳ Ready |

---

## 🎯 Recommended Execution Sequence

1. **Sprint 1 (Foundations & Deterministic Capture):**  
   Complete [Part 00](Implement_00_Foundation_Monorepo.md) ➔ [Part 01](Implement_01_Core_Engine.md) ➔ [Part 02](Implement_02_Capture_Playwright.md).  
   *Milestone:* CLI can execute a web scenario and output frame sequences with zero-drift DOM JSON.

2. **Sprint 2 (Rendering & High-FPS Video Export):**  
   Complete [Part 03](Implement_03_Renderer_Engine.md).  
   *Milestone:* Headless CLI can render spring zooms, motion blur, and vector cursors into a 4K 60fps MP4.

3. **Sprint 3 (Studio UI & Desktop Shell):**  
   Complete [Part 04](Implement_04_Studio_Timeline.md) ➔ [Part 05](Implement_05_Desktop_App.md).  
   *Milestone:* Full desktop app for interactive editing, timeline scrubbing, physics tuning, and one-click export.

4. **Sprint 4 (Live Mode A Extension):**  
   Complete [Part 06](Implement_06_Chrome_Extension.md).  
   *Milestone:* Live browser recording streaming real-time metadata directly into Desktop Studio.
