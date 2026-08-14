# Part 05: Electron Desktop Application (`apps/desktop`)

**Document Path:** `TODO/Implement_05_Desktop_App.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Previous Part:** [Implement_04_Studio_Timeline.md](Implement_04_Studio_Timeline.md)  
**Next Part:** [Implement_06_Chrome_Extension.md](Implement_06_Chrome_Extension.md)  

---

## 📌 Overview & Goals

Build `apps/desktop`—the Windows desktop shell powering FocalDOM. Built with Electron, it wraps `@focaldom/studio` and `@focaldom/renderer`, integrates native Windows file dialogs, bundles static FFmpeg binaries, hosts a local WebSocket server for Chrome Extension telemetry, and enables high-speed zero-copy IPC.

---

## 📂 Target App Structure

```
apps/desktop/
├── src/
│   ├── main/
│   │   ├── main.ts                  # Electron app lifecycle & window manager
│   │   ├── ffmpeg-manager.ts        # Bundled static FFmpeg binary locator & runner
│   │   ├── file-manager.ts          # Native file open/save, project file (.focal) I/O
│   │   ├── telemetry-server.ts      # Local WebSocket server receiving Extension events
│   │   └── ipc-handlers.ts          # Main-to-renderer IPC bridge
│   ├── preload/
│   │   ├── preload.ts               # contextBridge exposure (focalApi)
│   │   └── types.ts                 # FocalDesktopAPI interface definitions
│   └── assets/                      # Icons, app splash, bundled tools
├── resources/
│   └── bin/
│       └── ffmpeg.exe               # Bundled static Windows FFmpeg binary
├── electron-builder.yml             # Windows installer & portable packaging config
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🛠️ Phases & Sub-Phases

### Phase 05.1: Electron Main Process & Window Lifecycle (`src/main/`)
- [ ] **Sub-phase 05.1.1:** Implement `main.ts` with custom titlebar, frameless window support, and hardware acceleration flags (`--enable-gpu-rasterization`, `--enable-zero-copy`).
- [ ] **Sub-phase 05.1.2:** Configure auto-reload and HMR bridge in development mode.

### Phase 05.2: Bundled FFmpeg Manager (`src/main/ffmpeg-manager.ts`)
- [ ] **Sub-phase 05.2.1:** Detect bundled `ffmpeg.exe` in `resources/bin` or system PATH.
- [ ] **Sub-phase 05.2.2:** Expose high-speed streaming pipe handler from Renderer process to FFmpeg `stdin`.

### Phase 05.3: Project File System & Native Dialogs (`src/main/file-manager.ts`)
- [ ] **Sub-phase 05.3.1:** Implement `.focal` project package format (ZIP bundle containing `project.json`, `events.json`, and raw video/frame assets).
- [ ] **Sub-phase 05.3.2:** Implement native file pickers: Open Project, Save Project As, Import Video, Export Video.

### Phase 05.4: Local WebSocket Telemetry Server (`src/main/telemetry-server.ts`)
- [ ] **Sub-phase 05.4.1:** Spin up a lightweight local WebSocket server (`ws://127.0.0.1:48480`) to receive live events streamed from the Chrome Extension (Mode A).
- [ ] **Sub-phase 05.4.2:** Buffer incoming events and synchronize with Electron screen recording stream.

### Phase 05.5: Secure Preload Bridge (`src/preload/`)
- [ ] **Sub-phase 05.5.1:** Expose type-safe `window.focalApi`:
  ```typescript
  export interface FocalDesktopAPI {
    openProject: () => Promise<FocalDOMProject | null>;
    saveProject: (project: FocalDOMProject) => Promise<boolean>;
    exportVideo: (config: ExportConfig, onProgress: (p: ExportProgress) => void) => Promise<string>;
    onExtensionEvent: (callback: (event: DOMEventFrame) => void) => () => void;
  }
  ```

### Phase 05.6: Windows Packaging & Installer (`electron-builder.yml`)
- [ ] **Sub-phase 05.6.1:** Configure `electron-builder` to produce Windows portable `.exe` and NSIS installer with bundled FFmpeg.

---

## 🧪 Desktop Testing Plan
- Test opening, saving, and rendering `.focal` projects on Windows 10/11.
- Validate FFmpeg spawn and encoding process under high frame-throughput stress.

---

## ✅ Acceptance Criteria
1. Desktop application launches smoothly with bundled React Studio and PixiJS canvas.
2. Projects can be saved and opened as `.focal` bundles.
3. High-FPS 4K video export executes flawlessly through bundled FFmpeg.
