# Studio NLE Timeline Editing & Export Guide

This guide covers editing keyframes, tuning spring physics parameters, customizing window styling, and exporting videos using the **FocalDOM Studio NLE**.

---

## 1. Launching Studio

Start the Studio web application locally:
```bash
pnpm --filter @focaldom/studio dev
```
Or open the **Electron Desktop Shell** (`pnpm --filter @focaldom/desktop dev`) to access native desktop export pipelines.

---

## 2. Timeline Tracks & Navigation

The Studio interface features a responsive multi-track NLE timeline:

```
┌─────────────────────────────────────────────────────────────┐
│ Ruler / Timecode Bar: [ 00:00.000 ]                         │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Event Track:    [🎯 Click]    [⌨️ Input]    [📜 Scroll]  │
├─────────────────────────────────────────────────────────────┤
│ 🎥 Camera Track:   [── Zoom In ──]         [── Focus ──]    │
├─────────────────────────────────────────────────────────────┤
│ 🖱️ Cursor Track:   ══════ Spline Trajectory ═══════════════ │
└─────────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Key / Gesture | Action |
| :--- | :--- |
| **`Space`** | Play / Pause playback |
| **`Ctrl + Wheel`** | Zoom in / out on timeline horizontal scale |
| **`Shift + Wheel`** | Scroll / Pan timeline horizontally |
| **`S`** | Split selected keyframe block at current playhead position |
| **`Delete` / `Backspace`** | Delete selected keyframe |
| **`Home` / `End`** | Jump playhead to start / end of project |
| **`Ctrl + Z` / `Ctrl + Y`** | Undo / Redo timeline edits |

---

## 3. Real-Time Physics Tuning

Open the **Physics Tuner** tab in the right inspector sidebar to adjust the spring camera feel:

- **Stiffness ($k$):** Controls the speed and snap of camera transitions ($50 \dots 400$).
- **Damping ($c$):** Controls bounciness and settling time ($5 \dots 50$).
- **Mass ($m$):** Sets the virtual camera inertia ($0.2 \dots 5.0$).

---

## 4. Video Exporting

1. Click the **Export Video** button in the top navigation bar.
2. Select your target **Export Preset**:
   - **4K UHD Master (3840x2160 @ 60 FPS, ProRes / H.264)**
   - **YouTube 1080p HD (1920x1080 @ 60 FPS, H.264)**
   - **Twitter / Web 720p (1280x720 @ 30 FPS, H.264)**
   - **GIF Animated Preview (800x450 @ 15 FPS)**
3. Click **Start Export**. The FFmpeg streamer compiles the final video directly to disk with real-time encoding progress.
