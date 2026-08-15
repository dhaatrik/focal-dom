import { CursorPoint, VectorCursorState, CursorStyle } from './cursor-types';

/**
 * Calculates a point on a cubic Bezier curve for parameter t in [0, 1]
 */
export function getCubicBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const clampedT = Math.max(0, Math.min(1, isFinite(t) ? t : 0));
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * clampedT;

  const x = uuu * p0.x + 3 * uu * clampedT * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
  const y = uuu * p0.y + 3 * uu * clampedT * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

  return { x, y };
}

/**
 * Cubic Bezier Vector Cursor Smoother
 * Reconstructs jerky, low-framerate mouse event series into a smooth, continuous trajectory.
 */
export class CubicBezierSmoother {
  private points: CursorPoint[] = [];

  constructor(points: CursorPoint[] = []) {
    this.setPoints(points);
  }

  public setPoints(points: CursorPoint[]): void {
    this.points = [...points].sort((a, b) => a.timestampMs - b.timestampMs);
  }

  public addPoint(point: CursorPoint): void {
    this.points.push(point);
    this.points.sort((a, b) => a.timestampMs - b.timestampMs);
  }

  /**
   * Samples the smoothed cursor state at an exact timestamp
   */
  public sample(timestampMs: number): VectorCursorState {
    if (this.points.length === 0 || !isFinite(timestampMs)) {
      return {
        x: 0,
        y: 0,
        style: 'default',
        visible: false,
        velocity: { vx: 0, vy: 0 },
      };
    }

    if (this.points.length === 1 || timestampMs <= this.points[0].timestampMs) {
      const p = this.points[0];
      return {
        x: p.x,
        y: p.y,
        style: p.style || 'default',
        visible: true,
        velocity: { vx: 0, vy: 0 },
      };
    }

    const last = this.points[this.points.length - 1];
    if (timestampMs >= last.timestampMs) {
      return {
        x: last.x,
        y: last.y,
        style: last.style || 'default',
        visible: true,
        velocity: { vx: 0, vy: 0 },
      };
    }

    // Find the bounding segment [p1, p2] where p1.timestampMs <= timestampMs < p2.timestampMs
    let idx = 0;
    while (idx < this.points.length - 1 && this.points[idx + 1].timestampMs <= timestampMs) {
      idx++;
    }

    const p0 = this.points[Math.max(0, idx - 1)];
    const p1 = this.points[idx];
    const p2 = this.points[Math.min(this.points.length - 1, idx + 1)];
    const p3 = this.points[Math.min(this.points.length - 1, idx + 2)];

    // Minimum segment duration baseline of 16.6ms to avoid division by zero or sub-millisecond noise spikes
    const rawDuration = p2.timestampMs - p1.timestampMs;
    const segmentDuration = Math.max(1, rawDuration);
    const t = rawDuration <= 0 ? 1 : (timestampMs - p1.timestampMs) / segmentDuration;

    // Compute Catmull-Rom style control points derived from neighboring tangent slopes
    const tension = 0.5;
    const cp1 = {
      x: p1.x + ((p2.x - p0.x) / 6) * tension,
      y: p1.y + ((p2.y - p0.y) / 6) * tension,
    };
    const cp2 = {
      x: p2.x - ((p3.x - p1.x) / 6) * tension,
      y: p2.y - ((p3.y - p1.y) / 6) * tension,
    };

    const currentPos = getCubicBezierPoint(p1, cp1, cp2, p2, t);

    // Estimate instantaneous velocity using finite difference with minimum 16.6ms (60fps) time baseline
    const dt = 0.01;
    const effectiveDurationSeconds = Math.max(0.0166, segmentDuration / 1000);
    const nextPos = getCubicBezierPoint(p1, cp1, cp2, p2, Math.min(1, t + dt));
    const rawVx = (nextPos.x - currentPos.x) / (dt * effectiveDurationSeconds);
    const rawVy = (nextPos.y - currentPos.y) / (dt * effectiveDurationSeconds);

    const vx = isFinite(rawVx) ? rawVx : 0;
    const vy = isFinite(rawVy) ? rawVy : 0;

    return {
      x: Math.round(currentPos.x * 100) / 100,
      y: Math.round(currentPos.y * 100) / 100,
      style: (p1.style || 'default') as CursorStyle,
      visible: true,
      velocity: {
        vx: Math.round(vx * 10) / 10,
        vy: Math.round(vy * 10) / 10,
      },
    };
  }
}
