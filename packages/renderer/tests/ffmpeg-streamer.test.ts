import { describe, it, expect } from 'vitest';
import { EXPORT_PRESETS } from '../src/export/export-presets';
import { ExportProgressTracker, ExportProgress } from '../src/export/export-progress';
import { FFmpegStreamer } from '../src/export/ffmpeg-streamer';

describe('FFmpeg Streamer & Export Presets Pipeline', () => {
  it('defines standard production export presets with valid dimensions and formats', () => {
    const youtube = EXPORT_PRESETS['youtube-4k'];
    expect(youtube).toBeDefined();
    expect(youtube.width).toBe(3840);
    expect(youtube.height).toBe(2160);
    expect(youtube.fps).toBe(60);
    expect(youtube.format).toBe('mp4');

    const shorts = EXPORT_PRESETS['shorts-9-16'];
    expect(shorts).toBeDefined();
    expect(shorts.width).toBe(1080);
    expect(shorts.height).toBe(1920);

    const prores = EXPORT_PRESETS['prores-422'];
    expect(prores).toBeDefined();
    expect(prores.format).toBe('mov');
  });

  it('generates exact FFmpeg CLI arguments matching rawvideo RGBA pipe', () => {
    const preset = EXPORT_PRESETS['youtube-4k'];
    const streamer = new FFmpegStreamer({
      preset,
      outputPath: './out.mp4',
      totalFrames: 300,
    });

    const args = streamer.getFFmpegCommandArgs();
    expect(args).toContain('-f');
    expect(args).toContain('rawvideo');
    expect(args).toContain('rgba');
    expect(args).toContain('3840x2160');
    expect(args).toContain('pipe:0');
    expect(args[args.length - 1]).toBe('./out.mp4');
  });

  it('accurately computes throughput and progress percentage', () => {
    let latestProgress: ExportProgress | null = null;
    const tracker = new ExportProgressTracker(100, (p) => {
      latestProgress = p;
    });

    tracker.start();
    for (let i = 0; i < 50; i++) {
      tracker.advanceFrame();
    }

    expect(latestProgress).toBeDefined();
    expect(latestProgress!.currentFrame).toBe(50);
    expect(latestProgress!.totalFrames).toBe(100);
    expect(latestProgress!.percent).toBe(50);
  });
});
