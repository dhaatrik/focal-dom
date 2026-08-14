# Part 01: Core Math, Physics & Schema Engine (`@focaldom/core`)

**Document Path:** `TODO/Implement_01_Core_Engine.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Previous Part:** [Implement_00_Foundation_Monorepo.md](Implement_00_Foundation_Monorepo.md)  
**Next Part:** [Implement_02_Capture_Playwright.md](Implement_02_Capture_Playwright.md)  

---

## 📌 Overview & Goals

Build `@focaldom/core`—the zero-dependency TypeScript engine containing shared mathematical models, spring-physics camera simulation, Bezier cursor path smoothing, sticky header avoidance geometry, and canonical event/timeline schemas.

---

## 📂 Target Package Structure

```
packages/core/
├── src/
│   ├── camera/
│   │   ├── spring-camera.ts         # Spring physics simulation & 2D matrix calculation
│   │   ├── camera-types.ts          # CameraState, CameraKeyframe, SpringConfig
│   │   └── lookahead-buffer.ts      # 400ms anticipatory ease-in generator
│   ├── cursor/
│   │   ├── bezier-smoother.ts       # Cubic Bezier path interpolation (getCubicBezierPoint)
│   │   ├── ripple-math.ts           # Click ripple radius & alpha decay equations
│   │   └── cursor-types.ts          # VectorCursorState, CursorStyle
│   ├── avoidance/
│   │   ├── sticky-detector.ts       # Sticky/fixed header deadzone analyzer
│   │   └── viewport-avoidance.ts    # Safe-zone camera bounds clamping
│   ├── events/
│   │   ├── dom-event-schema.ts      # DOMEventFrame, DOMElementRect, ProjectSchema
│   │   └── validation.ts            # Schema parsing & validation helpers
│   └── index.ts
├── tests/
│   ├── spring-camera.test.ts
│   ├── bezier-smoother.test.ts
│   └── sticky-avoidance.test.ts
├── package.json
└── tsconfig.json
```

---

## 🛠️ Phases & Sub-Phases

### Phase 01.1: Event & Project Data Schemas (`packages/core/src/events/`)
- [ ] **Sub-phase 01.1.1:** Implement `DOMElementRect` and `DOMEventFrame` interfaces:
  - Supports `eventType`: `click`, `scroll`, `hover`, `focus`, `input`, `navigation`.
  - Captures `cursor` $(x, y)$, `scrollOffset` $(x, y)$, `viewport` (width, height, dpr).
  - Captures `activeStickyRegions: DOMElementRect[]`.
- [ ] **Sub-phase 01.1.2:** Define `CameraKeyframe` and `FocalDOMProject` schemas:
  - Timeline keyframes: `id`, `timestampMs`, `zoomScale`, `panOffset`, `easingCurve`, `autoZoomGenerated`.
  - Project configuration: `aspectRatio` (16:9, 9:16, 1:1, 4:3), `windowFrame` styles, `backgroundStyle`, `keyframes`, `events`.

### Phase 01.2: Spring Camera Physics & Look-Ahead System (`packages/core/src/camera/`)
- [ ] **Sub-phase 01.2.1:** Implement `SpringCamera` with second-order differential equation solvers:
  $$a = \frac{\text{stiffness} \cdot (\text{target} - \text{current}) - \text{damping} \cdot v}{\text{mass}}$$
- [ ] **Sub-phase 01.2.2:** Implement `LookAheadBuffer`:
  - Scans DOM event timeline for upcoming click/focus events at timestamp $T$.
  - Generates an anticipatory camera transition starting at $T - 400\text{ms}$.
- [ ] **Sub-phase 01.2.3:** Implement matrix transformation utilities ($2\times3$ affine matrices) for zoom/pan coordinates.

### Phase 01.3: Sticky Header & Viewport Avoidance (`packages/core/src/avoidance/`)
- [ ] **Sub-phase 01.3.1:** Implement `computeUsableViewport`:
  - Merges overlapping fixed/sticky rects into top, bottom, and side deadzones.
- [ ] **Sub-phase 01.3.2:** Implement `setTargetWithAvoidance`:
  - Clamps zoom scale so target elements are framed cleanly inside unobstructed viewport real estate with default 1.8x padding.

### Phase 01.4: Vector Cursor Path Smoothing & Ripple Math (`packages/core/src/cursor/`)
- [ ] **Sub-phase 01.4.1:** Implement `CubicBezierSmoother`:
  - Reconstructs jittery mouse point clouds into continuous $C^1$-smooth Bezier spline trajectories.
- [ ] **Sub-phase 01.4.2:** Implement `ClickRippleSimulator`:
  - Calculates instantaneous radius $r(t) = R_{\max} \cdot (1 - e^{-k t})$ and alpha decay $\alpha(t) = e^{-\lambda t}$.

---

## 🧪 Unit Testing Plan
- `spring-camera.test.ts`: Verify convergence, zero overshoot when critically damped, and steady-state accuracy.
- `sticky-avoidance.test.ts`: Verify that target coordinates never overlap top deadzones $>0\text{px}$.
- `bezier-smoother.test.ts`: Verify smooth velocity curves and continuous first derivatives.

---

## ✅ Acceptance Criteria
1. All core mathematical models pass 100% of Vitest unit tests.
2. Zero external runtime dependencies in `@focaldom/core`.
