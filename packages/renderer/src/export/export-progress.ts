export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number; // 0 - 100
  fpsThroughput: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

export class ExportProgressTracker {
  private startTime: number = 0;
  private currentFrame: number = 0;

  constructor(private totalFrames: number, private onProgress?: ExportProgressCallback) {}

  public start(): void {
    this.startTime = Date.now();
    this.currentFrame = 0;
    this.emitProgress();
  }

  public advanceFrame(): void {
    this.currentFrame++;
    this.emitProgress();
  }

  private emitProgress(): void {
    if (!this.onProgress) return;

    const elapsedMs = Math.max(1, Date.now() - this.startTime);
    const elapsedSeconds = elapsedMs / 1000;
    const fpsThroughput = this.currentFrame / elapsedSeconds;
    const percent = Math.min(100, Math.round((this.currentFrame / Math.max(1, this.totalFrames)) * 100));

    const remainingFrames = Math.max(0, this.totalFrames - this.currentFrame);
    const estimatedRemainingSeconds = fpsThroughput > 0 ? remainingFrames / fpsThroughput : 0;

    this.onProgress({
      currentFrame: this.currentFrame,
      totalFrames: this.totalFrames,
      percent,
      fpsThroughput: Math.round(fpsThroughput * 10) / 10,
      elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
      estimatedRemainingSeconds: Math.round(estimatedRemainingSeconds * 10) / 10,
    });
  }
}
