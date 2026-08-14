# Part 03: Pixi.js Canvas & High-Throughput Video Renderer (`@focaldom/renderer`)

**Document Path:** `TODO/Implement_03_Renderer_Engine.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Previous Part:** [Implement_02_Capture_Playwright.md](Implement_02_Capture_Playwright.md)  
**Next Part:** [Implement_04_Studio_Timeline.md](Implement_04_Studio_Timeline.md)  

---

## 📌 Overview & Goals

Build `@focaldom/renderer`—the hardware-accelerated post-processing and video composition engine. Built on Pixi.js (WebGL2/WebGPU), it composites raw recorded video frames inside stylized window frames, executes spring camera zooms, renders multi-pass sub-frame accumulation motion blur, overlays smoothed vector cursors, and streams uncompressed raw RGBA bytes directly into FFmpeg `stdin` for 4K 60/120 FPS video encoding.

---

## 📂 Target Package Structure

```
packages/renderer/
├── src/
│   ├── engine/
│   │   ├── pixi-app.ts              # Pixi.js Application lifecycle & WebGPU/WebGL context
│   │   ├── scene-graph.ts           # Layer hierarchy (Background -> Window -> Frame -> Cursor)
│   │   └── frame-ticker.ts          # Deterministic time/frame playback evaluator
│   ├── layers/
│   │   ├── background-layer.ts      # Mesh gradients, solid colors, blurred backdrop
│   │   ├── window-layer.ts          # Window frame, titlebar controls, drop shadows
│   │   ├── video-viewport-layer.ts  # Transformed sprite container (x, y, scale)
│   │   └── vector-cursor-layer.ts   # Bezier smoothed SVG cursor & click ripple emitter
│   ├── shaders/
│   │   ├── motion-blur-filter.ts    # 4-sample temporal accumulation fragment shader
│   │   └── shadow-filter.ts         # High-precision multi-pass box/gaussian blur
│   ├── export/
│   │   ├── ffmpeg-streamer.ts       # Direct raw RGBA byte pipe to FFmpeg process
│   │   ├── export-presets.ts        # 4K, 1080p, 9:16 Shorts, ProRes, GIF configs
│   │   └── export-progress.ts       # Real-time throughput & ETA tracker
│   └── index.ts
├── tests/
│   ├── render-pipeline.test.ts
│   └── ffmpeg-streamer.test.ts
├── package.json
└── tsconfig.json
```

---

## 🛠️ Phases & Sub-Phases

### Phase 03.1: Pixi.js Scene Graph & Layer Composition (`src/engine/` & `src/layers/`)
- [x] **Sub-phase 03.1.1:** Initialize PixiJS `Application` configured with high-performance WebGL2/WebGPU backend.
- [x] **Sub-phase 03.1.2:** Implement `BackgroundLayer`:
  - Renders customizable radial gradients, modern mesh gradients, or solid backgrounds.
- [x] **Sub-phase 03.1.3:** Implement `WindowLayer`:
  - Renders rounded window container (`borderRadius: 16px`), customizable titlebar controls, and ambient drop shadow.
- [x] **Sub-phase 03.1.4:** Implement `VideoViewportLayer`:
  - Transforms the video/frame texture according to `SpringCamera` matrix $(x, y, \text{scale})$.
- [x] **Sub-phase 03.1.5:** Implement `VectorCursorLayer`:
  - Draws sharp vector cursors and animated expanding click ripples over the window canvas.

### Phase 03.2: Multi-Pass Sub-Frame Motion Blur (`src/shaders/`)
- [x] **Sub-phase 03.2.1:** Implement `MotionBlurFilter`:
  - Custom GLSL / WGSL fragment shader executing 4 temporal accumulation samples per frame.
  - Dynamically weights sample opacity proportional to camera velocity vector $(\Delta x, \Delta y, \Delta \text{scale})$.

### Phase 03.3: High-Throughput Raw RGBA FFmpeg Export Pipeline (`src/export/`)
- [x] **Sub-phase 03.3.1:** Implement `FFmpegStreamer`:
  - Spawns FFmpeg child process on Windows:
    ```bash
    ffmpeg -y -f rawvideo -pix_fmt rgba -s 3840x2160 -r 60 -i pipe:0 \
      -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
      -movflags +faststart output.mp4
    ```
  - Directly pipes uncompressed RGBA pixel buffers (`gl.readPixels` / `renderer.extract.pixels`) into FFmpeg `stdin`.
- [x] **Sub-phase 03.3.2:** Provide presets:
  - YouTube (3840x2160 @ 60 FPS, H.264 CRF 16)
  - Twitter / Web (1920x1080 @ 60 FPS, H.264 CRF 18)
  - Shorts / Reels (1080x1920 @ 60 FPS, 9:16 vertical crop/fit)
  - Apple ProRes (4K ProRes 422 HQ)
  - GitHub GIF (Palettized high-framerate GIF)
- [x] **Sub-phase 03.3.3:** Real-time progress callback emitting `currentFrame`, `totalFrames`, `fpsThroughput`, and `percentComplete`.

---

## 🧪 Verification & Benchmark Plan
- `ffmpeg-streamer.test.ts`: Verify that piping 300 test frames to FFmpeg produces a valid playable MP4 without corruption.
- Benchmark: Verify $\ge 60\text{ FPS}$ sustained compilation speed at 4K resolution on local hardware.

---

## ✅ Acceptance Criteria
1. WebGL/WebGPU canvas composites video frames, spring camera transforms, vector cursor, and window styling in real time.
2. Motion blur shader produces realistic sub-frame streaks during rapid camera pans.
3. Raw RGBA pipe to FFmpeg encodes 4K MP4 cleanly.
