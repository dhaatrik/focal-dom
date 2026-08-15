# Mode B: Automated Playwright Capture & SDK Guide

This guide explains how to record pixel-perfect, deterministic product demos using declarative `scenario.yaml` files and the programmatic `@focaldom/capture-playwright` TypeScript SDK.

---

## 1. Declarative Scenario Recording (CLI)

Create a YAML scenario file (`scenario.yaml`) describing the interaction steps:

```yaml
name: "Onboarding Flow Demo"
targetUrl: "https://app.example.com/signup"
viewport:
  width: 1920
  height: 1080
fps: 60
headless: true

steps:
  - goto: "https://app.example.com/signup"
  - wait: 600
  - hover: "#pricing-tier-pro"
  - wait: 400
  - click: "#select-pro-btn"
  - wait: 300
  - type:
      selector: "#email-input"
      text: "alex@example.com"
      delayMs: 35
  - wait: 200
  - click: "#create-account-btn"
  - assertVisible:
      selector: "#dashboard-welcome-banner"
      timeoutMs: 5000
  - wait: 1200
```

### Running the Capture CLI
```bash
pnpm --filter @focaldom/capture-playwright focaldom capture scenario.yaml --output ./recordings/onboarding
```

Artifacts generated in `./recordings/onboarding`:
- `events.json`: Time-aligned DOM telemetry stream.
- `manifest.json`: Frame rate, resolution, and session metadata.
- `frames/`: High-resolution sequential PNG frames.

---

## 2. Programmatic TypeScript SDK

You can integrate FocalDOM directly into existing Playwright E2E test suites or node scripts:

```typescript
import { launchFocalSession } from '@focaldom/capture-playwright';

async function recordProductDemo() {
  const session = await launchFocalSession({
    fps: 60,
    viewport: { width: 1920, height: 1080 },
    headless: true,
  });

  const page = session.getPage();

  await page.goto('https://app.example.com');
  await page.focalClick('#login-button');
  await page.focalType('#username', 'demo_user');
  await page.focalHover('#nav-analytics');
  await page.focalScroll(0, 800);
  await page.focalWait(1000);

  // Finalizes capture and outputs aligned artifacts to disk
  const result = await session.finalize('./recordings/demo-session');
  console.log(`Captured ${result.frameCount} frames at 60 FPS.`);
}

recordProductDemo();
```
