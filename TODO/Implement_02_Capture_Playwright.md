# Part 02: Deterministic Playwright Capture Engine (`@focaldom/capture-playwright`)

**Document Path:** `TODO/Implement_02_Capture_Playwright.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Previous Part:** [Implement_01_Core_Engine.md](Implement_01_Core_Engine.md)  
**Next Part:** [Implement_03_Renderer_Engine.md](Implement_03_Renderer_Engine.md)  

---

## 📌 Overview & Goals

Build `@focaldom/capture-playwright`—the Mode B automation and recording engine. It controls Chromium via Playwright and Chrome DevTools Protocol (CDP), injects the in-page `dom-logger`, advances a deterministic virtual frame clock, and generates synchronized dual artifacts: raw pixel frames and `events.json`.

---

## 📂 Target Package Structure

```
packages/capture-playwright/
├── src/
│   ├── injected/
│   │   ├── dom-logger.ts            # Client-side script injected via page.addInitScript
│   │   └── sticky-detector.ts       # In-browser getComputedStyle position evaluator
│   ├── runner/
│   │   ├── session.ts               # FocalCaptureSession coordinator
│   │   ├── virtual-clock.ts         # Deterministic rAF and setTimeout step controller
│   │   └── cdp-screencast.ts        # Page.startScreencast & frame buffer writer
│   ├── scenario/
│   │   ├── parser.ts                # YAML/JSON scenario schema validator
│   │   └── actions.ts               # goto, click, hover, type, scroll, wait executors
│   ├── sdk/
│   │   ├── focal-page.ts            # Playwright Page wrapper with semantic instrumentation
│   │   └── index.ts
│   ├── cli.ts                       # CLI entrypoint: `focaldom capture <scenario>`
│   └── index.ts
├── tests/
│   ├── scenario-parser.test.ts
│   └── capture-session.test.ts
├── package.json
└── tsconfig.json
```

---

## 🛠️ Phases & Sub-Phases

### Phase 02.1: In-Page DOM Logger & Telemetry Injector (`src/injected/`)
- [ ] **Sub-phase 02.1.1:** Implement `dom-logger.ts`:
  - Hook `window.addEventListener('click', ..., true)`, `mousemove`, `scroll`, `input`, `focus`.
  - Traverse DOM tree on target elements to detect `position: fixed` and `position: sticky`.
  - Collect `boundingRect` for all active fixed/sticky elements per tick.
  - Store event frames in `window.__FOCAL_EVENT_LOG__`.
- [ ] **Sub-phase 02.1.2:** Inject script during initial navigation using `page.addInitScript()`.

### Phase 02.2: Deterministic Virtual Frame Clock & CDP Screencast (`src/runner/`)
- [ ] **Sub-phase 02.2.1:** Implement `VirtualClock`:
  - Intercept `requestAnimationFrame`, `performance.now()`, `Date.now()`, and CSS animations in page context.
  - Provide `window.__focal_tick(frameIndex, deltaTime)` allowing external step-by-step frame advancement.
- [ ] **Sub-phase 02.2.2:** Implement `CDPScreencastCollector`:
  - Attach CDP session via `page.context().newCDPSession(page)`.
  - Capture frame buffers at target FPS (60 or 120 FPS).
  - Write raw sequential frames (or PNG cache) with zero dropped frames.

### Phase 02.3: Declarative Scenario Parser (`src/scenario/`)
- [ ] **Sub-phase 02.3.1:** Define scenario schema (YAML/JSON):
  - Configuration: `viewport`, `devicePixelRatio`, `fps`, `targetUrl`.
  - Steps: `goto`, `wait`, `click`, `hover`, `type`, `press`, `scroll`, `assertVisible`.
- [ ] **Sub-phase 02.3.2:** Implement step dispatcher executing actions while synchronizing frame ticks.

### Phase 02.4: TypeScript Playwright SDK (`src/sdk/`)
- [ ] **Sub-phase 02.4.1:** Provide `FocalPage` wrapper:
  ```typescript
  export class FocalPage {
    constructor(private page: Page, private session: FocalCaptureSession) {}
    async focalClick(selector: string): Promise<void>;
    async focalType(selector: string, text: string): Promise<void>;
    async focalHover(selector: string): Promise<void>;
    async focalScroll(x: number, y: number): Promise<void>;
  }
  ```
- [ ] **Sub-phase 02.4.2:** Export `launchFocalSession({ fps, viewport, headless })`.

### Phase 02.5: CLI Executable (`src/cli.ts`)
- [ ] **Sub-phase 02.5.1:** Build binary `focaldom capture <scenario-path> --output <dir> --fps 60`.
- [ ] **Sub-phase 02.5.2:** Emit output artifacts:
  - `<output>/frames/frame_000001.png` (or sequential raw buffer)
  - `<output>/events.json` (Structured `DOMEventFrame[]`)
  - `<output>/manifest.json` (Project metadata)

---

## 🧪 Integration Testing Plan
- `capture-session.test.ts`: Run a local static HTTP server, execute a 5-step scenario, and verify `events.json` contains exact click coordinates matching the HTML elements.

---

## ✅ Acceptance Criteria
1. CLI cleanly executes declarative scenario files against local and remote URLs.
2. `events.json` perfectly aligns with generated frame sequences ($T_{\text{frame}} = \text{FrameIndex} \times \frac{1000}{\text{FPS}}$).
