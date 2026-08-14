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
- [x] **Sub-phase 01.1.1:** Implement `DOMElementRect` and `DOMEventFrame` interfaces.
- [x] **Sub-phase 01.1.2:** Define `CameraKeyframe` and `FocalDOMProject` schemas.

### Phase 01.2: Spring Camera Physics & Look-Ahead System (`packages/core/src/camera/`)
- [x] **Sub-phase 01.2.1:** Implement `SpringCamera` with second-order differential equation solvers.
- [x] **Sub-phase 01.2.2:** Implement `LookAheadBuffer` generating 400ms anticipatory keyframes.
- [x] **Sub-phase 01.2.3:** Implement matrix transformation utilities ($2\times3$ affine matrices) for zoom/pan coordinates.

### Phase 01.3: Sticky Header & Viewport Avoidance (`packages/core/src/avoidance/`)
- [x] **Sub-phase 01.3.1:** Implement `computeViewportDeadZones` aggregating sticky/fixed header regions.
- [x] **Sub-phase 01.3.2:** Implement `calculateTargetFromElement` with safe-zone clamping and 1.8x padding.

### Phase 01.4: Vector Cursor Path Smoothing & Ripple Math (`packages/core/src/cursor/`)
- [x] **Sub-phase 01.4.1:** Implement `CubicBezierSmoother` for continuous smooth cursor trajectories.
- [x] **Sub-phase 01.4.2:** Implement `evaluateClickRipple` for radial expansion and alpha decay.

---

## 🧪 Unit Testing Plan
- `spring-camera.test.ts`: Verify convergence, zero overshoot when critically damped, and steady-state accuracy.
- `sticky-avoidance.test.ts`: Verify that target coordinates never overlap top deadzones $>0\text{px}$.
- `bezier-smoother.test.ts`: Verify smooth velocity curves and continuous first derivatives.

---

## ✅ Acceptance Criteria
1. All core mathematical models pass 100% of Vitest unit tests.
2. Zero external runtime dependencies in `@focaldom/core`.
