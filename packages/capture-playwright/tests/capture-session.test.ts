import { describe, it, expect, afterAll } from 'vitest';
import { existsSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { launchFocalSession } from '../src/runner/session';
import { executeScenario } from '../src/scenario/executor';
import { ScenarioDefinition } from '../src/scenario/scenario-types';

describe('Playwright Capture Session & Scenario Execution', () => {
  const testOutputDir = join(__dirname, '../temp_test_output');

  afterAll(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('launches session, executes scenario on HTML page, and exports aligned artifacts with disk streaming', async () => {
    const htmlContent = encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; margin: 0; background: #f8fafc; }
            .navbar { position: fixed; top: 0; left: 0; right: 0; height: 60px; background: #0f172a; color: white; display: flex; align-items: center; padding: 0 20px; }
            .btn { margin-top: 80px; padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="navbar">Sticky Header</div>
          <button id="test-button" class="btn">Click Target</button>
        </body>
      </html>
    `);

    const scenario: ScenarioDefinition = {
      name: 'Integration Test Flow',
      fps: 30, // 30 FPS for fast test execution
      steps: [
        { action: 'goto', url: `data:text/html,${htmlContent}` },
        { action: 'wait', durationMs: 100 },
        { action: 'click', selector: '#test-button', delayAfterMs: 100 },
      ],
    };

    const session = await launchFocalSession({
      fps: 30,
      viewport: { width: 1280, height: 720 },
      headless: true,
      outputDir: testOutputDir,
    });

    await executeScenario(scenario, session);

    const result = await session.finalize(testOutputDir);

    expect(result.frameCount).toBeGreaterThan(0);
    expect(existsSync(result.manifestPath)).toBe(true);
    expect(existsSync(result.eventsPath)).toBe(true);

    const framesDir = join(testOutputDir, 'frames');
    expect(existsSync(framesDir)).toBe(true);
    const files = readdirSync(framesDir);
    expect(files.length).toBe(result.frameCount);

    const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf-8'));
    expect(manifest.fps).toBe(30);
    expect(manifest.frameCount).toBe(result.frameCount);

    const events = JSON.parse(readFileSync(result.eventsPath, 'utf-8'));
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  }, 30000); // 30s timeout for browser automation
});
