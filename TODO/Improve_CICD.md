# FocalDOM CI/CD & Automated Semantic Versioning Plan 🚀📦

**Document Path:** `TODO/Improve_CICD.md`  
**Parent Plan:** [docs/Technical Architecture & Engineering Plan.md](../docs/Technical%20Architecture%20&%20Engineering%20Plan.md)  
**Audit Reference:** [TODO/AUDIT_REPORT.md](AUDIT_REPORT.md)  
**Suggested Implementation Branch:** `feat/release-please-cicd`  
**Status:** 🚀 Ready for Implementation  

---

## 📌 Executive Overview

This plan details the transition from the legacy manual version-scraping release workflow to **Google Release Please** (`google-github-actions/release-please-action@v4`)—the industry standard for automated Semantic Versioning (SemVer) and changelog generation in PNPM monorepos.

### 🎯 Core Objectives
1. **Automated SemVer Calculation:** Parse Conventional Commits (`feat:`, `fix:`, `perf:`, `feat!:`, `BREAKING CHANGE:`) to automatically determine patch, minor, or major version increments.
2. **Monorepo Package Synchronization:** Track and bump versions across all 7 workspace packages independently or synchronized via `release-please-config.json`.
3. **Automated `CHANGELOG.md` Generation:** Automatically maintain human-readable changelogs grouped by component and commit type.
4. **Zero-Friction Release PR Workflow:** Release Please continuously maintains an open "Release PR" that aggregates pending release notes. Merging this PR instantly creates GitHub Releases and git tags.

---

## 🏗️ Release Please Workflow Architecture

```mermaid
flowchart TD
    subgraph Development [1. PR & Development Phase]
        D1[Feature Branch Commit: feat(core): ... / fix(desktop): ...] --> PR[Pull Request to main]
        PR -->|CI Validation: Typecheck, Build, Test| M1[Merge PR into main]
    end

    subgraph ReleasePlease [2. Release Please Autonomous Engine]
        M1 --> RP[Google Release Please Action]
        RP --> PARSE[Parse Conventional Commits History]
        PARSE --> CALC[Compute SemVer: Patch / Minor / Major]
        CALC --> REL_PR[Create or Update 'chore: release main' PR]
        REL_PR --> CHANGELOG[Generate CHANGELOG.md per package]
        REL_PR --> BUMP[Bump package.json & manifest versions]
    end

    subgraph Publishing [3. Production Release & Tagging]
        REL_PR -->|Maintainer Merges Release PR| MERGE[Merge Release PR]
        MERGE --> TAG[Auto Create Git Tags: vX.Y.Z]
        MERGE --> GH_REL[Publish GitHub Release with Release Notes]
        MERGE --> BUILD[Build Production Assets & Packages]
    end
```

---

## 📂 Target Configuration File Structure

```
focal-dom/
├── release-please-config.json       # Monorepo release strategies, changelog sections, and package mappings
├── .release-please-manifest.json    # Exact version state tracker for all workspace projects
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Typecheck, build, and test suite on push/PR
│       └── release.yml              # Release Please workflow triggering on main branch
```

---

## 🛠️ Phases & Sub-Phases Checklist

### Phase 01: Release Please Monorepo Configuration
- [ ] **Sub-phase 01.1: Author `release-please-config.json`**
  - Define root and individual package release strategies:
    ```json
    {
      "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
      "release-type": "node",
      "include-component-in-tag": true,
      "packages": {
        ".": {
          "package-name": "focal-dom-monorepo",
          "component": "focal-dom",
          "changelog-path": "CHANGELOG.md"
        },
        "packages/core": {
          "package-name": "@focaldom/core",
          "component": "core",
          "changelog-path": "CHANGELOG.md"
        },
        "packages/capture-playwright": {
          "package-name": "@focaldom/capture-playwright",
          "component": "capture-playwright",
          "changelog-path": "CHANGELOG.md"
        },
        "packages/renderer": {
          "package-name": "@focaldom/renderer",
          "component": "renderer",
          "changelog-path": "CHANGELOG.md"
        },
        "packages/studio": {
          "package-name": "@focaldom/studio",
          "component": "studio",
          "changelog-path": "CHANGELOG.md"
        },
        "packages/extension": {
          "package-name": "@focaldom/extension",
          "component": "extension",
          "changelog-path": "CHANGELOG.md"
        },
        "apps/desktop": {
          "package-name": "@focaldom/desktop",
          "component": "desktop",
          "changelog-path": "CHANGELOG.md"
        }
      },
      "changelog-sections": [
        { "type": "feat", "section": "✨ Features", "hidden": false },
        { "type": "fix", "section": "🐛 Bug Fixes", "hidden": false },
        { "type": "perf", "section": "⚡ Performance Improvements", "hidden": false },
        { "type": "refactor", "section": "♻️ Code Refactoring", "hidden": false },
        { "type": "docs", "section": "📝 Documentation", "hidden": false },
        { "type": "chore", "section": "🔧 Miscellaneous Chores", "hidden": true }
      ]
    }
    ```
- [ ] **Sub-phase 01.2: Author `.release-please-manifest.json`**
  - Initialize baseline versions for all packages:
    ```json
    {
      ".": "0.1.0",
      "packages/core": "0.1.0",
      "packages/capture-playwright": "0.1.0",
      "packages/renderer": "0.1.0",
      "packages/studio": "0.1.0",
      "packages/extension": "0.1.0",
      "apps/desktop": "0.1.0"
    }
    ```

---

### Phase 02: Modernize GitHub Actions Release Workflow (`.github/workflows/release.yml`)
- [ ] **Sub-phase 02.1: Configure Release Please Action Runner**
  - Replace the legacy version scraper with `google-github-actions/release-please-action@v4`:
    ```yaml
    name: Automated Release (Release Please)

    on:
      push:
        branches:
          - main

    permissions:
      contents: write
      pull-requests: write

    jobs:
      release-please:
        runs-on: ubuntu-latest
        outputs:
          releases_created: ${{ steps.release.outputs.releases_created }}
          paths_released: ${{ steps.release.outputs.paths_released }}
        steps:
          - uses: google-github-actions/release-please-action@v4
            id: release
            with:
              config-file: release-please-config.json
              manifest-file: .release-please-manifest.json

      build-and-publish:
        needs: release-please
        if: ${{ needs.release-please.outputs.releases_created == 'true' }}
        runs-on: ubuntu-latest
        steps:
          - name: Checkout Repository
            uses: actions/checkout@v4

          - name: Setup Node.js & PNPM
            uses: actions/setup-node@v4
            with:
              node-version: 22.x

          - name: Install pnpm
            run: npm install -g pnpm@11.21.0

          - name: Install Dependencies
            run: pnpm install --ignore-scripts --no-frozen-lockfile

          - name: Typecheck & Build Monorepo
            run: |
              pnpm typecheck
              pnpm build

          - name: Run Tests
            run: pnpm test
    ```

---

### Phase 03: Conventional Commit Validation
- [ ] **Sub-phase 03.1: Add PR title / commit format check in `ci.yml`**
  - Ensure all incoming pull request titles follow the Conventional Commits specification:
    - `feat(scope): message` $\rightarrow$ Minor release
    - `fix(scope): message` $\rightarrow$ Patch release
    - `feat(scope)!: message` or `BREAKING CHANGE:` $\rightarrow$ Major release
    - `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`

---

### Phase 04: Verification & Dry-Run
- [ ] **Sub-phase 04.1: Dry-Run Release Please Manifest Validation**
  - Verify JSON schema validity and package path alignment across monorepo directory tree.
- [ ] **Sub-phase 04.2: CI Pipeline Validation**
  - Run full test and build cycles to ensure zero regressions.

---

## ✅ Acceptance Criteria

1. `release-please-config.json` and `.release-please-manifest.json` track all 7 workspace packages.
2. Pushing Conventional Commits to `main` automatically opens / updates a single organized Release PR.
3. Merging the Release PR automatically creates GitHub Releases and tags with formatted `CHANGELOG.md`.
