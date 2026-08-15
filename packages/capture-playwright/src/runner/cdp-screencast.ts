import type { CDPSession, Page } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface FrameMetadata {
  frameIndex: number;
  timestampMs: number;
  filePath?: string;
  buffer?: Buffer;
}

export class CDPScreencastCollector {
  private cdpSession: CDPSession | null = null;
  private frames: FrameMetadata[] = [];
  private isCapturing: boolean = false;
  private framesDir: string | null = null;

  constructor(private page: Page, framesDir?: string) {
    if (framesDir) {
      this.framesDir = framesDir;
      mkdirSync(framesDir, { recursive: true });
    }
  }

  public setFramesDir(dir: string): void {
    this.framesDir = dir;
    mkdirSync(dir, { recursive: true });
  }

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
   * Captures the current frame buffer deterministically for the given frame index.
   * If framesDir is configured, streams directly to disk to maintain a constant O(1) RAM footprint.
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

    if (this.framesDir) {
      const fileName = `frame_${String(frameIndex).padStart(6, '0')}.png`;
      const filePath = join(this.framesDir, fileName);
      writeFileSync(filePath, buffer);

      const frameMeta: FrameMetadata = {
        frameIndex,
        timestampMs,
        filePath,
      };
      this.frames.push(frameMeta);
    } else {
      const frameMeta: FrameMetadata = {
        frameIndex,
        timestampMs,
        buffer,
      };
      this.frames.push(frameMeta);
    }

    return buffer;
  }

  public getFrames(): ReadonlyArray<FrameMetadata> {
    return this.frames;
  }

  public getFrameCount(): number {
    return this.frames.length;
  }

  /**
   * Finalizes frame exports, writing any remaining in-memory frames to disk
   */
  public async exportFramesToDisk(outputDir: string): Promise<string[]> {
    const framesTargetDir = join(outputDir, 'frames');
    mkdirSync(framesTargetDir, { recursive: true });

    const paths: string[] = [];
    for (const frame of this.frames) {
      const fileName = `frame_${String(frame.frameIndex).padStart(6, '0')}.png`;
      const filePath = join(framesTargetDir, fileName);

      if (frame.buffer) {
        writeFileSync(filePath, frame.buffer);
        paths.push(filePath);
      } else if (frame.filePath) {
        paths.push(frame.filePath);
      }
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
