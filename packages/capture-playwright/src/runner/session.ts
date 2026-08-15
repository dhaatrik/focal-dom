import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DOMEventFrame, DOMEventType } from '@focaldom/core';
import { INJECTED_DOM_LOGGER_SOURCE } from '../injected/dom-logger-source';
import { INJECTED_VIRTUAL_CLOCK_SOURCE } from './virtual-clock';
import { CDPScreencastCollector } from './cdp-screencast';

export interface FocalSessionOptions {
  fps?: number; // Default 60
  viewport?: {
    width: number;
    height: number;
    devicePixelRatio?: number;
  };
  headless?: boolean;
  browser?: Browser;
}

export class FocalCaptureSession {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private collector: CDPScreencastCollector | null = null;

  public fps: number;
  public frameDurationMs: number;
  public currentFrameIndex: number = 0;
  public currentTimestampMs: number = 0;

  private events: DOMEventFrame[] = [];
  private isFinalized: boolean = false;

  constructor(private options: FocalSessionOptions = {}) {
    this.fps = options.fps ?? 60;
    this.frameDurationMs = 1000 / this.fps;
  }

  public async init(): Promise<Page> {
    const viewport = this.options.viewport ?? { width: 1920, height: 1080, devicePixelRatio: 1 };

    if (!this.options.browser) {
      this.browser = await chromium.launch({
        headless: this.options.headless ?? true,
        args: [
          '--hide-scrollbars',
          '--mute-audio',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
        ],
      });
    } else {
      this.browser = this.options.browser;
    }

    this.context = await this.browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.devicePixelRatio ?? 1,
    });

    // Inject DOM metadata tracker and virtual frame clock
    await this.context.addInitScript({ content: INJECTED_DOM_LOGGER_SOURCE });
    await this.context.addInitScript({ content: INJECTED_VIRTUAL_CLOCK_SOURCE });

    this.page = await this.context.newPage();

    // Expose binding to receive high-frequency interaction events from page
    await this.page.exposeFunction(
      '__focal_on_event',
      async (type: DOMEventType, targetElement: any, cursorX: number, cursorY: number) => {
        await this.recordInteractionEvent(type, targetElement, cursorX, cursorY);
      }
    );

    this.collector = new CDPScreencastCollector(this.page);
    await this.collector.start();

    return this.page;
  }

  public getPage(): Page {
    if (!this.page) {
      throw new Error('FocalCaptureSession has not been initialized. Call session.init() first.');
    }
    return this.page;
  }

  /**
   * Records an interaction event frame synchronized with current virtual time
   */
  private async recordInteractionEvent(
    eventType: DOMEventType,
    targetElement: any,
    cursorX: number,
    cursorY: number
  ): Promise<void> {
    if (!this.page) return;

    try {
      const activeStickyRegions = await this.page.evaluate(() => (window as any).__FOCAL_ACTIVE_STICKY_REGIONS__ || []);
      const viewport = this.options.viewport ?? { width: 1920, height: 1080, devicePixelRatio: 1 };

      const eventFrame: DOMEventFrame = {
        frameIndex: this.currentFrameIndex,
        timestamp: this.currentTimestampMs,
        eventType,
        cursor: { x: cursorX, y: cursorY },
        viewport: {
          width: viewport.width,
          height: viewport.height,
          devicePixelRatio: viewport.devicePixelRatio ?? 1,
        },
        scrollOffset: { x: 0, y: 0 },
        targetElement: targetElement || undefined,
        activeStickyRegions,
      };

      this.events.push(eventFrame);
    } catch {}
  }

  /**
   * Advances the session by one deterministic frame tick, capturing the frame buffer
   */
  public async tick(): Promise<Buffer | null> {
    if (!this.page || !this.collector) return null;

    // Advance page virtual time
    await this.page.evaluate(
      ({ frameIndex, deltaMs }) => {
        const w = window as any;
        if (w.__focal_tick) {
          w.__focal_tick(frameIndex, deltaMs);
        }
      },
      { frameIndex: this.currentFrameIndex, deltaMs: this.frameDurationMs }
    );

    // Capture exact frame
    const buffer = await this.collector.captureFrame(this.currentFrameIndex, this.currentTimestampMs);

    this.currentFrameIndex++;
    this.currentTimestampMs += this.frameDurationMs;

    return buffer;
  }

  /**
   * Advances the session for a duration in milliseconds (e.g. wait 500ms)
   */
  public async advanceTime(durationMs: number): Promise<void> {
    const totalFrames = Math.max(1, Math.round(durationMs / this.frameDurationMs));
    for (let i = 0; i < totalFrames; i++) {
      await this.tick();
    }
  }

  public getEvents(): ReadonlyArray<DOMEventFrame> {
    return this.events;
  }

  /**
   * Finalizes the capture session and exports all artifacts to disk
   */
  public async finalize(outputDir: string): Promise<{
    manifestPath: string;
    eventsPath: string;
    frameCount: number;
  }> {
    if (this.isFinalized) {
      throw new Error('Session is already finalized');
    }
    this.isFinalized = true;

    mkdirSync(outputDir, { recursive: true });

    // Export sequential frames
    if (this.collector) {
      await this.collector.exportFramesToDisk(outputDir);
      await this.collector.stop();
    }

    // Export events.json
    const eventsPath = join(outputDir, 'events.json');
    writeFileSync(eventsPath, JSON.stringify(this.events, null, 2), 'utf-8');

    // Export manifest.json
    const manifestPath = join(outputDir, 'manifest.json');
    const manifest = {
      version: '0.1.0',
      fps: this.fps,
      frameCount: this.currentFrameIndex,
      durationMs: this.currentTimestampMs,
      viewport: this.options.viewport ?? { width: 1920, height: 1080 },
      createdAt: Date.now(),
      eventsCount: this.events.length,
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    // Clean up browser
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser && !this.options.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }

    return {
      manifestPath,
      eventsPath,
      frameCount: this.currentFrameIndex,
    };
  }
}

/**
 * Helper to launch a new FocalCaptureSession
 */
export async function launchFocalSession(options: FocalSessionOptions = {}): Promise<FocalCaptureSession> {
  const session = new FocalCaptureSession(options);
  await session.init();
  return session;
}
