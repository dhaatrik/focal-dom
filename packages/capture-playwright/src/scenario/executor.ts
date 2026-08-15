import { ScenarioDefinition } from './scenario-types';
import { FocalCaptureSession } from '../runner/session';
import type { Page } from 'playwright';

let lastCursorPos = { x: 0, y: 0 };

/**
 * Moves mouse along a smooth trajectory across multiple virtual frame ticks
 */
async function smoothMoveTo(
  page: Page,
  session: FocalCaptureSession,
  targetX: number,
  targetY: number,
  steps: number = 8
): Promise<void> {
  const startX = lastCursorPos.x;
  const startY = lastCursorPos.y;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Cubic ease-in-out interpolation
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const curX = startX + (targetX - startX) * ease;
    const curY = startY + (targetY - startY) * ease;

    await page.mouse.move(curX, curY);
    lastCursorPos = { x: curX, y: curY };
    await session.tick();
  }
}

/**
 * Executes a parsed ScenarioDefinition using a FocalCaptureSession
 */
export async function executeScenario(
  scenario: ScenarioDefinition,
  session: FocalCaptureSession
): Promise<void> {
  const page = session.getPage();
  lastCursorPos = { x: 0, y: 0 };

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i];

    switch (step.action) {
      case 'goto': {
        await page.goto(step.url, {
          waitUntil: 'domcontentloaded',
          timeout: step.timeoutMs ?? 30000,
        });
        // Capture initial frames after load
        await session.advanceTime(200);
        break;
      }

      case 'wait': {
        await session.advanceTime(step.durationMs);
        break;
      }

      case 'click': {
        await page.waitForSelector(step.selector, { state: 'visible', timeout: 10000 });
        const element = await page.$(step.selector);
        if (element) {
          const box = await element.boundingBox();
          if (box) {
            const targetX = box.x + box.width / 2;
            const targetY = box.y + box.height / 2;
            await smoothMoveTo(page, session, targetX, targetY, 8);
          }
        }
        await page.click(step.selector);
        await session.advanceTime(step.delayAfterMs ?? 400);
        break;
      }

      case 'hover': {
        await page.waitForSelector(step.selector, { state: 'visible', timeout: 10000 });
        const element = await page.$(step.selector);
        if (element) {
          const box = await element.boundingBox();
          if (box) {
            const targetX = box.x + box.width / 2;
            const targetY = box.y + box.height / 2;
            await smoothMoveTo(page, session, targetX, targetY, 8);
          }
        }
        await page.hover(step.selector);
        await session.advanceTime(step.delayAfterMs ?? 300);
        break;
      }

      case 'type': {
        await page.waitForSelector(step.selector, { state: 'visible', timeout: 10000 });
        const element = await page.$(step.selector);
        if (element) {
          const box = await element.boundingBox();
          if (box) {
            await smoothMoveTo(page, session, box.x + box.width / 2, box.y + box.height / 2, 6);
          }
        }
        await page.click(step.selector);
        await page.locator(step.selector).pressSequentially(step.text, { delay: step.delayMs ?? 40 });
        await session.advanceTime(300);
        break;
      }

      case 'press': {
        await page.keyboard.press(step.key);
        await session.advanceTime(step.delayAfterMs ?? 200);
        break;
      }

      case 'scroll': {
        await page.evaluate(({ x, y }) => window.scrollTo({ left: x, top: y, behavior: 'smooth' }), {
          x: step.x,
          y: step.y,
        });
        await session.advanceTime(step.delayAfterMs ?? 600);
        break;
      }

      case 'dragAndDrop': {
        await page.waitForSelector(step.sourceSelector, { state: 'visible', timeout: 10000 });
        await page.waitForSelector(step.targetSelector, { state: 'visible', timeout: 10000 });

        const srcEl = await page.$(step.sourceSelector);
        const dstEl = await page.$(step.targetSelector);

        if (srcEl && dstEl) {
          const srcBox = await srcEl.boundingBox();
          const dstBox = await dstEl.boundingBox();

          if (srcBox && dstBox) {
            const srcX = srcBox.x + srcBox.width / 2;
            const srcY = srcBox.y + srcBox.height / 2;
            const dstX = dstBox.x + dstBox.width / 2;
            const dstY = dstBox.y + dstBox.height / 2;

            await smoothMoveTo(page, session, srcX, srcY, 6);
            await page.mouse.down();
            await session.tick();

            await smoothMoveTo(page, session, dstX, dstY, 12);
            await page.mouse.up();
            await session.tick();
          }
        }
        await session.advanceTime(step.delayAfterMs ?? 400);
        break;
      }

      case 'uploadFile': {
        await page.waitForSelector(step.selector, { state: 'attached', timeout: 10000 });
        await page.setInputFiles(step.selector, step.filePaths);
        await session.advanceTime(step.delayAfterMs ?? 400);
        break;
      }

      case 'assertVisible': {
        await page.waitForSelector(step.selector, {
          state: 'visible',
          timeout: step.timeoutMs ?? 5000,
        });
        await session.tick();
        break;
      }
    }
  }
}
