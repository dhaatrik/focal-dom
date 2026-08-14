# Part 00: Foundation & PNPM Monorepo Setup

**Document Path:** `TODO/Implement_00_Foundation_Monorepo.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Next Part:** [Implement_01_Core_Engine.md](Implement_01_Core_Engine.md)  

---

## 📌 Overview & Goals

Establish the PNPM monorepo workspace, root TypeScript project references, ESLint/Prettier code standards, and shared build scripts to support cross-package imports across `@focaldom/core`, `@focaldom/capture-playwright`, `@focaldom/renderer`, `@focaldom/studio`, `@focaldom/extension`, and `apps/desktop`.

---

## 📂 Target Directory Structure

```
focal-dom/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.json
├── .prettierrc
├── packages/
│   ├── core/
│   ├── capture-playwright/
│   ├── renderer/
│   ├── studio/
│   └── extension/
└── apps/
    └── desktop/
```

---

## 🛠️ Phases & Sub-Phases

### Phase 00.1: Workspace Configuration
- [ ] **Sub-phase 00.1.1:** Create `pnpm-workspace.yaml` defining package and app glob directories:
  ```yaml
  packages:
    - 'packages/*'
    - 'apps/*'
  ```
- [ ] **Sub-phase 00.1.2:** Configure root `package.json` with workspace script shortcuts:
  - `pnpm build`: Builds all packages in dependency order.
  - `pnpm dev`: Runs studio and desktop in development watch mode.
  - `pnpm test`: Runs Vitest across all unit test suites.
  - `pnpm lint`: Runs ESLint check across all TS/TSX source files.

### Phase 00.2: TypeScript Shared Base Configuration
- [ ] **Sub-phase 00.2.1:** Create `tsconfig.base.json` with strict typing, ES2022 target, NodeNext/Bundler module resolution, and path mappings:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "isolatedModules": true
    }
  }
  ```
- [ ] **Sub-phase 00.2.2:** Set up package-level `tsconfig.json` files extending `../../tsconfig.base.json`.

### Phase 00.3: Shared Build & Testing Infrastructure
- [ ] **Sub-phase 00.3.1:** Configure `tsup` / `vite` build configs for package bundling.
- [ ] **Sub-phase 00.3.2:** Configure `vitest` at root for lightning-fast unit testing across `@focaldom/core` and math calculations.

---

## ✅ Acceptance Criteria
1. `pnpm install` succeeds without dependency conflicts.
2. Root `pnpm build` triggers builds across all child packages in proper topographical order.
3. Vitest runs cleanly across test suites.
