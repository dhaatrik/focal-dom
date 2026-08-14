import { describe, it, expect } from 'vitest';
import { evaluateClickRipple } from '../src/cursor/ripple-math';
import { ClickRippleState } from '../src/cursor/cursor-types';

describe('Click Ripple Mathematical Evaluator', () => {
  const ripple: ClickRippleState = {
    id: 'rip_1',
    x: 400,
    y: 300,
    startTimeMs: 1000,
    durationMs: 500,
    maxRadius: 60,
    color: '#3b82f6',
  };

  it('evaluates inactive ripple before start time or after duration', () => {
    const before = evaluateClickRipple(ripple, 900);
    expect(before.active).toBe(false);

    const after = evaluateClickRipple(ripple, 1600);
    expect(after.active).toBe(false);
  });

  it('evaluates expanding radius and decaying alpha during ripple lifespan', () => {
    const mid = evaluateClickRipple(ripple, 1250); // Progress = 50%
    expect(mid.active).toBe(true);
    expect(mid.radius).toBeGreaterThan(0);
    expect(mid.radius).toBeLessThanOrEqual(60);
    expect(mid.alpha).toBeCloseTo(0.5, 1);
  });
});
