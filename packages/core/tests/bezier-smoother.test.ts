import { describe, it, expect } from 'vitest';
import { CubicBezierSmoother, getCubicBezierPoint } from '../src/cursor/bezier-smoother';
import { CursorPoint } from '../src/cursor/cursor-types';

describe('Cubic Bezier Cursor Smoother', () => {
  it('calculates exact cubic Bezier interpolation endpoints', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 25, y: 50 };
    const p2 = { x: 75, y: 50 };
    const p3 = { x: 100, y: 100 };

    const start = getCubicBezierPoint(p0, p1, p2, p3, 0);
    expect(start).toEqual({ x: 0, y: 0 });

    const end = getCubicBezierPoint(p0, p1, p2, p3, 1);
    expect(end).toEqual({ x: 100, y: 100 });

    const mid = getCubicBezierPoint(p0, p1, p2, p3, 0.5);
    expect(mid.x).toBeCloseTo(50, 1);
    expect(mid.y).toBeCloseTo(50, 1);
  });

  it('smoothly interpolates cursor positions between sample timestamps', () => {
    const rawPoints: CursorPoint[] = [
      { x: 100, y: 100, timestampMs: 0 },
      { x: 300, y: 200, timestampMs: 500 },
      { x: 600, y: 400, timestampMs: 1000 },
    ];

    const smoother = new CubicBezierSmoother(rawPoints);

    // Sample at midpoint t = 250ms
    const sampleMid = smoother.sample(250);
    expect(sampleMid.visible).toBe(true);
    expect(sampleMid.x).toBeGreaterThan(100);
    expect(sampleMid.x).toBeLessThan(300);
    expect(sampleMid.y).toBeGreaterThan(100);
    expect(sampleMid.y).toBeLessThan(200);
    expect(isFinite(sampleMid.velocity.vx)).toBe(true);
    expect(isFinite(sampleMid.velocity.vy)).toBe(true);
  });

  it('handles duplicate identical timestamps safely without NaN or infinite velocity', () => {
    const rawPoints: CursorPoint[] = [
      { x: 100, y: 100, timestampMs: 500 },
      { x: 150, y: 120, timestampMs: 500 }, // Identical timestamp
      { x: 300, y: 200, timestampMs: 1000 },
    ];

    const smoother = new CubicBezierSmoother(rawPoints);
    const sample = smoother.sample(500);

    expect(isFinite(sample.x)).toBe(true);
    expect(isFinite(sample.y)).toBe(true);
    expect(isFinite(sample.velocity.vx)).toBe(true);
    expect(isFinite(sample.velocity.vy)).toBe(true);
    expect(isNaN(sample.velocity.vx)).toBe(false);
  });

  it('stabilizes velocity spikes on sub-millisecond mouse event bursts', () => {
    const rawPoints: CursorPoint[] = [
      { x: 100, y: 100, timestampMs: 100 },
      { x: 102, y: 101, timestampMs: 100.5 }, // 0.5ms interval
      { x: 105, y: 103, timestampMs: 101 },
    ];

    const smoother = new CubicBezierSmoother(rawPoints);
    const sample = smoother.sample(100.25);

    expect(isFinite(sample.velocity.vx)).toBe(true);
    expect(isFinite(sample.velocity.vy)).toBe(true);
    expect(Math.abs(sample.velocity.vx)).toBeLessThan(100000); // Clamped within realistic physical range
  });
});
