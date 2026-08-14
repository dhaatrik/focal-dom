import type { Page } from 'playwright';
import { FocalCaptureSession } from '../runner/session';

export class FocalPage {
  constructor(
    private rawPage: Page,
    private session: FocalCaptureSession
  ) {}

  public get page(): Page {
    return this.rawPage;
  }

  public get captureSession(): FocalCaptureSession {
    return this.session;
  }

  public async goto(url: string, options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    await this.rawPage.goto(url, {
      waitUntil: options?.waitUntil ?? 'domcontentloaded',
      timeout: options?.timeout ?? 30000,
    });
    await this.session.advanceTime(200);
  }

  public async focalClick(selector: string, delayAfterMs: number = 400): Promise<void> {
    await this.rawPage.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    const el = await this.rawPage.$(selector);
    if (el) {
      const box = await el.boundingBox();
      if (box) {
        await this.rawPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
      }
    }
    await this.rawPage.click(selector);
    await this.session.advanceTime(delayAfterMs);
  }

  public async focalType(selector: string, text: string, delayMs: number = 40): Promise<void> {
    await this.rawPage.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    await this.rawPage.click(selector);
    await this.rawPage.type(selector, text, { delay: delayMs });
    await this.session.advanceTime(300);
  }

  public async focalHover(selector: string, delayAfterMs: number = 300): Promise<void> {
    await this.rawPage.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    await this.rawPage.hover(selector);
    await this.session.advanceTime(delayAfterMs);
  }

  public async focalScroll(x: number, y: number, delayAfterMs: number = 600): Promise<void> {
    await this.rawPage.evaluate(({ x, y }) => window.scrollTo({ left: x, top: y, behavior: 'smooth' }), { x, y });
    await this.session.advanceTime(delayAfterMs);
  }

  public async focalWait(durationMs: number): Promise<void> {
    await this.session.advanceTime(durationMs);
  }
}
