# FocalDOM 🎯🎥

**DOM-Aware Intelligent Video Recording & Dynamic Virtual Camera Studio**

FocalDOM bridges browser automation and post-processing virtual camera rendering. Instead of recording blind raw pixels that require tedious manual zooms and result in awkward cuts, FocalDOM pairs frame-accurate 60/120 FPS video capture with **semantic DOM metadata extraction**.

---

## ✨ Key Features

- **🎯 Semantic Auto-Zooming:** Tracks clicked elements, input fields, and hover targets with dynamic spring-physics camera transitions.
- **🛡️ Sticky/Fixed Header Avoidance:** Intelligent safe-zone calculations ensure sticky navigation bars are never awkwardly cropped or obscured.
- **🖱️ Vector Cursor Smoothing:** Reconstructs mouse trajectories with smooth cubic Bezier paths, dynamic click ripples, and state-aware cursor icons.
- **⚡ Hardware-Accelerated Motion Blur:** 4-sample sub-frame accumulation rendering via Pixi.js (WebGL2/WebGPU).
- **🎬 Multi-Track NLE Timeline Studio:** React 19 + Zustand timeline editor to adjust keyframes, physics damping/stiffness, window styling, and backgrounds.
- **🚀 High-Throughput 4K Export:** Streams raw uncompressed RGBA pixel buffers directly into FFmpeg (`stdin`) for maximum encoding performance.

---

## 🏗️ Architecture

```
focal-dom/
├── docs/                            # Architecture and engineering specifications
│   └── Technical Architecture & Engineering Plan.md
├── packages/
│   ├── core/                        # Spring camera math, Bezier curves, DOM event schemas
│   ├── capture-playwright/          # Deterministic CDP runner, TypeScript SDK, scenario parser
│   ├── renderer/                    # Pixi.js WebGL2/WebGPU engine & FFmpeg RGBA streamer
│   ├── studio/                      # React NLE timeline GUI editor
│   └── extension/                   # Manifest V3 Chrome Extension
└── apps/
    └── desktop/                     # Electron desktop shell (Windows)
```

For complete technical specifications, see [docs/Technical Architecture & Engineering Plan.md](docs/Technical%20Architecture%20&%20Engineering%20Plan.md).

---

## 📜 License

[MIT License](LICENSE) © 2026 Dhaatrik Chowdhury
