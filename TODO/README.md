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

## 📋 Architecture & Improvement Directory

| Document | Primary Scope | Status | Score / Target |
| :--- | :--- | :---: | :---: |
| [**AUDIT_REPORT.md**](AUDIT_REPORT.md) | Comprehensive line-by-line codebase audit, metrics, and ratings out of 10 | ✅ Complete | **9.81 / 10** |
| [**Improve_Now.md**](Improve_Now.md) | Actionable implementation blueprints & subphases to elevate codebase to perfection | 🚀 Active Plan | **10.0 / 10** |
| [**Improve_Extension.md**](Improve_Extension.md) | Exhaustive flaw investigation and 5-phase hardening plan for Chrome Extension Mode A | 🚀 Active Plan | **10.0 / 10** |
| [**Improve_Renderer.md**](Improve_Renderer.md) | Exhaustive flaw investigation and 5-phase hardening plan for Pixi.js & FFmpeg Renderer | 🚀 Active Plan | **10.0 / 10** |
| [**Improve_Studio.md**](Improve_Studio.md) | Exhaustive flaw investigation and 5-phase hardening plan for Studio Timeline NLE UI | 🚀 Active Plan | **10.0 / 10** |
| [**Improve_Desktop_App.md**](Improve_Desktop_App.md) | Exhaustive flaw investigation and 5-phase hardening plan for Electron Desktop App | 🚀 Active Plan | **10.0 / 10** |
| [**Improve_CICD.md**](Improve_CICD.md) | Automated Semantic Versioning (SemVer) & Release CI with Google Release Please | 🚀 Active Plan | Automated Release |

---

## 📊 Subsystem Health & Target Ratings

| Part | Subsystem / Package | Key Responsibilities | Current Rating | Target (Improve_Now) |
| :--- | :--- | :--- | :---: | :---: |
| **00** | **Monorepo Foundation** | Workspaces, TypeScript project references, tooling | **10.0 / 10** | **10.0 / 10** |
| **01** | **`@focaldom/core`** | Spring physics ODE, multi-curve easing, sticky avoidance | **9.9 / 10** | **10.0 / 10** |
| **02** | **`@focaldom/capture-playwright`** | Deterministic CDP clock, shadow DOM traversal, SDK | **9.8 / 10** | **10.0 / 10** |
| **03** | **`@focaldom/renderer`** | Pixi.js scene graph, dual WGSL/GLSL shaders, FFmpeg audio pipe | **9.7 / 10** | **10.0 / 10** |
| **04** | **`@focaldom/studio`** | React 19 + Zustand timeline, magnetic snapping, ruler zoom | **9.8 / 10** | **10.0 / 10** |
| **05** | **`apps/desktop`** | Electron shell, real-time IPC progress streaming, window save | **9.7 / 10** | **10.0 / 10** |
| **06** | **`@focaldom/extension`** | Manifest V3 live recording, backoff reconnect, custom ports | **9.8 / 10** | **10.0 / 10** |

---

## 🎯 Recommended Next Execution Plan

Follow the detailed phased roadmap in [**Improve_Now.md**](Improve_Now.md) to implement all 6 subsystem refinements:

1. **Step 1:** Complete `@focaldom/core` multi-curve easing interpolation (`easeInOutCubic`, `linear`).
2. **Step 2:** Complete `@focaldom/capture-playwright` deep shadow DOM & nested iframe traversal.
3. **Step 3:** Complete `@focaldom/renderer` dual WGSL WebGPU shader parity & audio muxing.
4. **Step 4:** Complete `@focaldom/studio` magnetic timeline snapping & `Ctrl+Wheel` zoom.
5. **Step 5:** Complete `apps/desktop` live IPC export streaming (`focal:export-progress`) & window state preservation.
6. **Step 6:** Complete `@focaldom/extension` jittered exponential backoff & configurable custom port settings.
