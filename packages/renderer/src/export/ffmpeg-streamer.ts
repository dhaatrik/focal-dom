import type { ChildProcess } from 'node:child_process';
import { ExportPreset } from './export-presets';
import { ExportProgressTracker, ExportProgressCallback } from './export-progress';

export interface StreamerOptions {
  preset: ExportPreset;
  outputPath: string;
  totalFrames: number;
  audioInputPath?: string;
  ffmpegPath?: string;
  onProgress?: ExportProgressCallback;
}

export class FFmpegStreamer {
  private process: ChildProcess | null = null;
  private tracker: ExportProgressTracker;
  private isStreaming: boolean = false;
  private processError: Error | null = null;
  private ffmpegPath: string;

  constructor(private options: StreamerOptions) {
    this.ffmpegPath = options.ffmpegPath || 'ffmpeg';
    this.tracker = new ExportProgressTracker(options.totalFrames, options.onProgress);
  }

  public getFFmpegCommandArgs(): string[] {
    const { preset, outputPath, audioInputPath } = this.options;
    const args = [
      '-y',
      '-f', 'rawvideo',
      '-pix_fmt', 'rgba',
      '-s', `${preset.width}x${preset.height}`,
      '-r', `${preset.fps}`,
      '-i', 'pipe:0',
    ];

    if (audioInputPath) {
      args.push('-i', audioInputPath, '-c:a', 'aac', '-b:a', '192k', '-shortest');
    }

    args.push(...preset.ffmpegArgs, outputPath);
    return args;
  }

  public async start(): Promise<void> {
    const args = this.getFFmpegCommandArgs();
    const { spawn } = await import('node:child_process');

    return new Promise((resolve, reject) => {
      try {
        this.process = spawn(this.ffmpegPath, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.isStreaming = true;
        this.processError = null;
        this.tracker.start();

        this.process.stdin?.on('error', (err: Error) => {
          this.processError = err;
          this.isStreaming = false;
        });

        this.process.on('error', (err: Error) => {
          this.processError = err;
          this.isStreaming = false;
          reject(new Error(`Failed to spawn FFmpeg at "${this.ffmpegPath}": ${err.message}`));
        });

        // Resolve immediately after process is started and ready to receive frames
        resolve();
      } catch (err: unknown) {
        reject(err);
      }
    });
  }

  /**
   * Writes a single raw uncompressed RGBA pixel buffer to FFmpeg stdin
   * with EPIPE / broken pipe safety guards.
   */
  public async writeFrame(pixelBuffer: Uint8Array | Buffer): Promise<boolean> {
    if (!this.process || !this.process.stdin || !this.isStreaming || this.processError) {
      throw new Error(`FFmpeg stream is not active: ${this.processError?.message || 'Process terminated'}`);
    }

    const buffer = Buffer.isBuffer(pixelBuffer) ? pixelBuffer : Buffer.from(pixelBuffer);

    return new Promise((resolve, reject) => {
      try {
        const canContinue = this.process!.stdin!.write(buffer, (err) => {
          if (err) {
            this.processError = err;
            this.isStreaming = false;
            return reject(new Error(`FFmpeg stdin write error: ${err.message}`));
          }
        });
        this.tracker.advanceFrame();

        if (!canContinue) {
          this.process!.stdin!.once('drain', () => resolve(true));
        } else {
          resolve(true);
        }
      } catch (err: unknown) {
        this.isStreaming = false;
        const error = err instanceof Error ? err : new Error(String(err));
        this.processError = error;
        reject(new Error(`FFmpeg broken pipe (EPIPE): ${error.message}`));
      }
    });
  }

  /**
   * Closes stdin and waits for FFmpeg to finalize encoding
   */
  public async finish(): Promise<void> {
    if (!this.process || !this.process.stdin) return;

    return new Promise((resolve, reject) => {
      this.process!.stdin!.end();

      let stderrOutput = '';
      if (this.process!.stderr) {
        this.process!.stderr.on('data', (chunk) => {
          stderrOutput += chunk.toString();
        });
      }

      this.process!.on('close', (code) => {
        this.isStreaming = false;
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}. Error log: ${stderrOutput.slice(-300)}`));
        }
      });
    });
  }

  public abort(): void {
    if (this.process) {
      this.process.kill('SIGKILL');
      this.process = null;
      this.isStreaming = false;
    }
  }
}
