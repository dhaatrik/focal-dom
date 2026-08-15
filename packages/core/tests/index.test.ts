import { describe, it, expect } from 'vitest';
import {
  FOCALDOM_VERSION,
  SpringCamera,
  evaluateEasingCurve,
  interpolateCameraState,
  evaluateEasingVelocity,
  generateKeyframesFromEvents,
  computeViewportDeadZones,
  calculateTargetFromElement,
  clampTargetToBounds,
  CubicBezierSmoother,
  getCubicBezierPoint,
  evaluateClickRipple,
  isValidDOMElementRect,
  isValidDOMEventFrame,
  isValidSpringConfig,
  isValidCameraKeyframe,
  isValidFocalDOMProject,
  createProject,
} from '../src/index';

describe('@focaldom/core foundation exports', () => {
  it('exports valid version string', () => {
    expect(FOCALDOM_VERSION).toBe('0.1.0');
  });

  it('exports all mathematical, physical, and schema utility functions', () => {
    expect(typeof SpringCamera).toBe('function');
    expect(typeof evaluateEasingCurve).toBe('function');
    expect(typeof interpolateCameraState).toBe('function');
    expect(typeof evaluateEasingVelocity).toBe('function');
    expect(typeof generateKeyframesFromEvents).toBe('function');
    expect(typeof computeViewportDeadZones).toBe('function');
    expect(typeof calculateTargetFromElement).toBe('function');
    expect(typeof clampTargetToBounds).toBe('function');
    expect(typeof CubicBezierSmoother).toBe('function');
    expect(typeof getCubicBezierPoint).toBe('function');
    expect(typeof evaluateClickRipple).toBe('function');
    expect(typeof isValidDOMElementRect).toBe('function');
    expect(typeof isValidDOMEventFrame).toBe('function');
    expect(typeof isValidSpringConfig).toBe('function');
    expect(typeof isValidCameraKeyframe).toBe('function');
    expect(typeof isValidFocalDOMProject).toBe('function');
    expect(typeof createProject).toBe('function');
  });
});
