import type { CDPSession, Page } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface FrameMetadata {
  frameIndex: number;
  timestampMs: number;
  buffer: Buffer;
}

export class CDPScreencastCollector {
  private cdpSession: CDPSession | null = null;
  private frames: FrameMetadata[] = [];
  private isCapturing: boolean = false;

  constructor(private page: Page) {}

  public async start(): Promise<void> {
    this.frames = [];
    this.isCapturing = true;

    try {
      this.cdpSession = await this.page.context().newCDPSession(this.page);
      await this.cdpSession.send('Page.enable');
    } catch {
      // Fallback if CDP session is not available (e.g. non-Chromium or mock context)
      this.cdpSession = null;
    }
  }

  /**
   * Captures the current frame buffer deterministically for the given frame index
   */
  public async captureFrame(frameIndex: number, timestampMs: number): Promise<Buffer> {
    let buffer: Buffer;

    if (this.cdpSession) {
      try {
        const result = await this.cdpSession.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
        });
        buffer = Buffer.from(result.data, 'base64');
      } catch {
        buffer = await this.page.screenshot({ type: 'png' });
      }
    } else {
      buffer = await this.page.screenshot({ type: 'png' });
    }

    const frame: FrameMetadata = {
      frameIndex,
      timestampMs,
      buffer,
    };

    this.frames.push(frame);
    return buffer;
  }

  public getFrames(): ReadonlyArray<FrameMetadata> {
    return this.frames;
  }

  public getFrameCount(): number {
    return this.frames.length;
  }

  public async exportFramesToDisk(outputDir: string): Promise<string[]> {
    const framesDir = join(outputDir, 'frames');
    mkdirSync(framesDir, { recursive: true });

    const paths: string[] = [];
    for (const frame of this.frames) {
      const fileName = `frame_${String(frame.frameIndex).padStart(6, '0')}.png`;
      const filePath = join(framesDir, fileName);
      writeFileSync(filePath, frame.buffer);
      paths.push(filePath);
    }

    return paths;
  }

  public async stop(): Promise<void> {
    this.isCapturing = false;
    if (this.cdpSession) {
      try {
        await this.cdpSession.detach();
      } catch {}
      this.cdpSession = null;
    }
  }
}
