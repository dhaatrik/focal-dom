# FocalDOM Documentation Hub 📚

Welcome to the **FocalDOM** official documentation. This hub provides in-depth technical architecture specifications, mathematical formulations, schema references, and user guides.

---

## 🏛️ System Architecture

- [**System Overview**](architecture/overview.md) — End-to-end multi-phase architecture, package topology, and ingestion modes.
- [**Spring Camera Physics & Math**](architecture/spring-camera-physics.md) — 2nd-order ODE spring simulation, multi-curve analytical easing, and sticky viewport deadzones.
- [**Telemetry & Data Schemas**](architecture/telemetry-schemas.md) — Canonical TypeScript interfaces and JSON specifications (`DOMEventFrame`, `CameraKeyframe`, `FocalDOMProject`).
- [**WebGPU Render Engine & FFmpeg**](architecture/render-pipeline.md) — Pixi.js scene graph, dual WGSL/GLSL temporal motion blur shaders, and raw RGBA byte streaming.

---

## 📖 Practical Guides

- [**Mode A: Live Chrome Extension Recording**](guides/mode-a-extension-recording.md) — Installing the extension, connecting to the desktop app, and recording live telemetry.
- [**Mode B: Automated Playwright Capture**](guides/mode-b-playwright-automation.md) — Authoring `scenario.yaml` workflows, deterministic CDP virtual clocks, and TypeScript SDK.
- [**Studio NLE Timeline Editing**](guides/studio-nle-editing.md) — Multi-track timeline controls, magnetic snapping, physics tuner, and 4K video export.

---

## 📁 Engineering Roadmaps & Archive

- [**TODO / Active Improvement Roadmaps**](../TODO/README.md) — Phased engineering blueprints, flaw investigations, and 10/10 target checklists.
- [**Original Architecture Plan (Archive)**](archive/initial-engineering-plan.md) — Historical initial engineering RFC and technical foundation document.
