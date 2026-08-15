import { describe, it, expect } from 'vitest';
import { evaluateEasingCurve, interpolateCameraState, evaluateEasingVelocity } from '../src/camera/easing';

describe('Analytical Easing Module', () => {
  describe('evaluateEasingCurve', () => {
    it('evaluates linear easing correctly at boundaries and midpoints', () => {
      expect(evaluateEasingCurve('linear', 0)).toBe(0);
      expect(evaluateEasingCurve('linear', 0.5)).toBe(0.5);
      expect(evaluateEasingCurve('linear', 1)).toBe(1);
    });

    it('evaluates easeInOutCubic with monotonic S-curve continuity', () => {
      expect(evaluateEasingCurve('easeInOutCubic', 0)).toBe(0);
      expect(evaluateEasingCurve('easeInOutCubic', 0.5)).toBe(0.5);
      expect(evaluateEasingCurve('easeInOutCubic', 1)).toBe(1);

      // Verify continuous monotonic acceleration and deceleration
      const t1 = evaluateEasingCurve('easeInOutCubic', 0.25);
      const t2 = evaluateEasingCurve('easeInOutCubic', 0.5);
      const t3 = evaluateEasingCurve('easeInOutCubic', 0.75);

      expect(t1).toBeLessThan(0.25); // Starts slow
      expect(t2).toBe(0.5); // Exact midpoint inflection
      expect(t3).toBeGreaterThan(0.75); // Ends slow
      expect(t1).toBeLessThan(t2);
      expect(t2).toBeLessThan(t3);
    });

    it('clamps out-of-bounds input values safely to [0, 1]', () => {
      expect(evaluateEasingCurve('easeInOutCubic', -0.5)).toBe(0);
      expect(evaluateEasingCurve('easeInOutCubic', 1.5)).toBe(1);
      expect(evaluateEasingCurve('linear', -100)).toBe(0);
      expect(evaluateEasingCurve('linear', 100)).toBe(1);
      expect(evaluateEasingCurve('linear', NaN)).toBe(0);
    });
  });

  describe('interpolateCameraState', () => {
    it('smoothly interpolates between camera states', () => {
      const from = { x: 0, y: 0, scale: 1.0 };
      const to = { x: 200, y: -100, scale: 2.0 };

      const atStart = interpolateCameraState(from, to, 0, 'easeInOutCubic');
      expect(atStart).toEqual(from);

      const atEnd = interpolateCameraState(from, to, 1, 'easeInOutCubic');
      expect(atEnd).toEqual(to);

      const atMid = interpolateCameraState(from, to, 0.5, 'easeInOutCubic');
      expect(atMid.x).toBe(100);
      expect(atMid.y).toBe(-50);
      expect(atMid.scale).toBe(1.5);
    });
  });

  describe('evaluateEasingVelocity', () => {
    it('computes instantaneous derivative velocity multiplier', () => {
      expect(evaluateEasingVelocity('linear', 0.5, 2.0)).toBe(0.5);
      expect(evaluateEasingVelocity('easeInOutCubic', 0, 1.0)).toBe(0);
      expect(evaluateEasingVelocity('easeInOutCubic', 0.5, 1.0)).toBeGreaterThan(1.0); // Peak velocity at midpoint
      expect(evaluateEasingVelocity('easeInOutCubic', 0.5, 0)).toBe(0); // Zero duration guard
    });
  });
});
