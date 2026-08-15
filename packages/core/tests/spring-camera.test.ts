import { describe, it, expect } from 'vitest';
import { SpringCamera } from '../src/camera/spring-camera';

describe('SpringCamera Physics Engine', () => {
  it('initializes with default zero state', () => {
    const camera = new SpringCamera();
    expect(camera.getCurrent()).toEqual({ x: 0, y: 0, scale: 1.0 });
    expect(camera.getTarget()).toEqual({ x: 0, y: 0, scale: 1.0 });
  });

  it('snaps directly to target when requested', () => {
    const camera = new SpringCamera();
    camera.snapTo({ x: 100, y: -50, scale: 1.8 });
    expect(camera.getCurrent()).toEqual({ x: 100, y: -50, scale: 1.8 });
    expect(camera.isSettled()).toBe(true);
  });

  it('smoothly converges to target state over multiple physics steps', () => {
    const camera = new SpringCamera({ stiffness: 140, damping: 16, mass: 1.0 });
    camera.setTarget({ x: 200, y: 100, scale: 1.5 });

    expect(camera.isSettled()).toBe(false);

    // Step 90 times at 1/60s delta time (1.5 seconds of simulation)
    for (let i = 0; i < 90; i++) {
      camera.step(1 / 60);
    }

    const current = camera.getCurrent();
    expect(current.x).toBeCloseTo(200, 0);
    expect(current.y).toBeCloseTo(100, 0);
    expect(current.scale).toBeCloseTo(1.5, 1);
    expect(camera.isSettled()).toBe(true);
  });

  it('handles zero or negative mass safely without producing NaN states', () => {
    const zeroMassCamera = new SpringCamera({ mass: 0, stiffness: 140, damping: 16 });
    expect(zeroMassCamera.mass).toBeGreaterThanOrEqual(0.05);

    zeroMassCamera.setTarget({ x: 150, y: 50, scale: 2.0 });
    for (let i = 0; i < 60; i++) {
      zeroMassCamera.step(1 / 60);
    }

    const state = zeroMassCamera.getCurrent();
    expect(isFinite(state.x)).toBe(true);
    expect(isFinite(state.y)).toBe(true);
    expect(isFinite(state.scale)).toBe(true);
    expect(isNaN(state.x)).toBe(false);
  });

  it('safely handles non-positive and non-finite delta times', () => {
    const camera = new SpringCamera();
    camera.setTarget({ x: 100, y: 100, scale: 1.5 });

    const before = camera.getCurrent();
    camera.step(0);
    expect(camera.getCurrent()).toEqual(before);

    camera.step(-1);
    expect(camera.getCurrent()).toEqual(before);

    camera.step(NaN);
    expect(camera.getCurrent()).toEqual(before);
  });

  it('calculates valid affine transformation matrix for 2D canvas', () => {
    const camera = new SpringCamera();
    camera.snapTo({ x: 0, y: 0, scale: 2.0 });

    const matrix = camera.getAffineMatrix({ width: 1920, height: 1080 });
    expect(matrix.a).toBe(2.0);
    expect(matrix.d).toBe(2.0);
    expect(matrix.b).toBe(0);
    expect(matrix.c).toBe(0);
    expect(matrix.tx).toBe(1920 / 2 + (0 - 1920 / 2) * 2.0);
  });
});
