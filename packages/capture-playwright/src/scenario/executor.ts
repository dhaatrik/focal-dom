import { ScenarioDefinition } from './scenario-types';
import { FocalCaptureSession } from '../runner/session';

/**
 * Executes a parsed ScenarioDefinition using a FocalCaptureSession
 */
export async function executeScenario(
  scenario: ScenarioDefinition,
  session: FocalCaptureSession
): Promise<void> {
  const page = session.getPage();

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
            // Smooth mouse movement to element center
            const targetX = box.x + box.width / 2;
            const targetY = box.y + box.height / 2;
            await page.mouse.move(targetX, targetY, { steps: 5 });
          }
        }
        await page.click(step.selector);
        await session.advanceTime(step.delayAfterMs ?? 400);
        break;
      }

      case 'hover': {
        await page.waitForSelector(step.selector, { state: 'visible', timeout: 10000 });
        await page.hover(step.selector);
        await session.advanceTime(step.delayAfterMs ?? 300);
        break;
      }

      case 'type': {
        await page.waitForSelector(step.selector, { state: 'visible', timeout: 10000 });
        await page.click(step.selector);
        await page.type(step.selector, step.text, { delay: step.delayMs ?? 40 });
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
