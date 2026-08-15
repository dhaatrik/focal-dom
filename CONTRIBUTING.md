# Contributing to FocalDOM

Thank you for your interest in contributing to **FocalDOM**! We welcome contributions from developers of all backgrounds—whether fixing bugs, improving documentation, optimizing shaders, or proposing new features.

This document outlines the standard engineering workflows, coding guidelines, and contribution processes for our repository.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Conventional Commits](#conventional-commits)
- [Development Workflow](#development-workflow)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

We are committed to providing a welcoming, respectful, and inclusive environment for everyone. Please be respectful and constructive in all interactions, issues, and pull request discussions.

---

## Development Setup

### Prerequisites
- **Node.js**: `v22.0.0` or higher
- **PNPM**: `v11.0.0` or higher (`npm install -g pnpm`)
- **Git**: `v2.40.0` or higher

### Initial Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/focal-dom.git
   cd focal-dom
   ```

2. **Install all workspace dependencies:**
   ```bash
   pnpm install
   ```

3. **Verify TypeScript compilation:**
   ```bash
   pnpm typecheck
   ```

4. **Build all packages:**
   ```bash
   pnpm build
   ```

5. **Run test suites:**
   ```bash
   pnpm test
   ```

---

## Branching Strategy

We follow a clean, trunk-based feature branching model. Always branch off the latest `main` branch.

### Branch Prefix Conventions

Use concise prefixes aligned with Conventional Commits:

| Prefix | Purpose | Example |
| :--- | :--- | :--- |
| `feat/` | New features, shaders, UI components | `feat/magnetic-timeline-snapping` |
| `fix/` | Bug fixes and patches | `fix/ffmpeg-epipe-crash` |
| `perf/` | Performance optimizations | `perf/direct-disk-frame-streaming` |
| `docs/` | Documentation, roadmaps, and guides | `docs/contributing-guide` |
| `refactor/`| Code refactoring without behavioral change | `refactor/spring-camera-ode` |
| `chore/` | Tooling, dependencies, and CI/CD changes | `chore/release-please-setup` |

```bash
git checkout -b feat/your-feature-name
```

---

## Conventional Commits

FocalDOM uses **Google Release Please** for automated Semantic Versioning (SemVer) and changelog generation. All commit messages and PR titles must adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types & SemVer Impact

- **`feat:`** / **`feat(scope):`** ➔ Triggers a **`MINOR`** version bump (`0.1.0` ➔ `0.2.0`) and adds to ✨ **Features**.
- **`fix:`** / **`fix(scope):`** ➔ Triggers a **`PATCH`** version bump (`0.1.0` ➔ `0.1.1`) and adds to 🐛 **Bug Fixes**.
- **`perf:`** / **`perf(scope):`** ➔ Triggers a **`PATCH`** version bump and adds to ⚡ **Performance Improvements**.
- **`refactor:`** ➔ Code restructuring, adds to ♻️ **Code Refactoring**.
- **`docs:`** ➔ Documentation updates, adds to 📝 **Documentation**.
- **`BREAKING CHANGE:`** ➔ Triggers a **`MAJOR`** version bump (`0.1.0` ➔ `1.0.0`) and adds to 🚨 **Breaking Changes**.

### Examples
```bash
git commit -m "feat(studio): add magnetic snap-to-event collision detection"
git commit -m "fix(renderer): guard against FFmpeg EPIPE process crashes"
git commit -m "perf(capture): stream CDP frame buffers direct to disk"
```

---

## Development Workflow

### Workspace Structure
- [`packages/core`](packages/core): Pure mathematical engine (SpringCamera ODE, Bezier smoother, schemas). No DOM dependencies.
- [`packages/capture-playwright`](packages/capture-playwright): Playwright deterministic CDP screencast runner and in-page logger.
- [`packages/renderer`](packages/renderer): Pixi.js scene graph, motion blur shaders, and raw RGBA FFmpeg streamer.
- [`packages/studio`](packages/studio): React 19 + Zustand multi-track NLE timeline editor.
- [`packages/extension`](packages/extension): Chrome Manifest V3 live recording extension.
- [`apps/desktop`](apps/desktop): Electron desktop shell for Windows.

### Running Local Development Servers

- **Studio NLE Timeline UI:**
  ```bash
  pnpm --filter @focaldom/studio dev
  ```

- **Electron Desktop Shell:**
  ```bash
  pnpm --filter @focaldom/desktop dev
  ```

---

## Testing & Quality Assurance

Before opening a pull request, ensure all local checks pass:

```bash
# 1. Typecheck all workspace packages
pnpm typecheck

# 2. Run all unit and integration tests
pnpm test

# 3. Build all packages
pnpm build
```

---

## Pull Request Process

1. Push your branch to your forked repository:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request on GitHub against the `main` branch.
3. Ensure your PR title follows Conventional Commits format (e.g. `feat(studio): add magnetic timeline snapping`).
4. Provide a clear description of the problem solved, changes made, and test verification evidence.
5. Once CI checks pass and reviews are approved, your PR will be squash-merged into `main`.

Thank you for helping make FocalDOM better! 🚀
