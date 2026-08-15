import {
  FocalDOMProject,
  SpringCamera,
  CubicBezierSmoother,
  evaluateClickRipple,
  evaluateEasingCurve,
  interpolateCameraState,
  evaluateEasingVelocity,
  CameraState,
  CursorPoint,
  CameraKeyframe,
} from '@focaldom/core';
import { FrameEvaluationResult } from './scene-types';

export class FrameTicker {
  private camera: SpringCamera;
  private smoother: CubicBezierSmoother;
  private lastCameraState: CameraState = { x: 0, y: 0, scale: 1.0 };
  private lastEvaluatedTime: number = 0;

  constructor(private project: FocalDOMProject) {
    this.camera = new SpringCamera(project.springConfig);
    this.smoother = new CubicBezierSmoother();
    this.initCursorSmoother();
  }

  private initCursorSmoother(): void {
    const cursorPoints: CursorPoint[] = (this.project.events || []).map((e) => ({
      x: e.cursor.x,
      y: e.cursor.y,
      timestampMs: e.timestamp,
      style: 'default',
      visible: true,
    }));
    this.smoother.setPoints(cursorPoints);
  }

  public updateProject(project: FocalDOMProject): void {
    this.project = project;
    this.camera.stiffness = project.springConfig.stiffness;
    this.camera.damping = project.springConfig.damping;
    this.camera.mass = project.springConfig.mass;
    this.initCursorSmoother();
  }

  /**
   * Evaluates the complete camera, cursor, and ripple state at timestamp `t` (in milliseconds)
   * with seek discontinuity protection and dual analytical/spring easing support.
   */
  public evaluate(timestampMs: number): FrameEvaluationResult {
    // 1. Find active keyframe for camera
    const activeKeyframe = this.findActiveKeyframe(timestampMs);
    let targetZoom = 1.0;
    let targetPanX = 0;
    let targetPanY = 0;

    if (activeKeyframe) {
      targetZoom = activeKeyframe.zoomScale;
      targetPanX = activeKeyframe.panOffset.x;
      targetPanY = activeKeyframe.panOffset.y;
    }

    // Detect non-monotonic seek (backward scrubbing) or large jumps
    const isDiscontinuousSeek =
      timestampMs < this.lastEvaluatedTime ||
      Math.abs(timestampMs - this.lastEvaluatedTime) > 500;

    let currentCamera: CameraState;
    let velocityX = 0;
    let velocityY = 0;

    if (activeKeyframe && activeKeyframe.easingCurve && activeKeyframe.easingCurve !== 'spring') {
      // Analytical closed-form curve evaluation (linear / easeInOutCubic)
      const duration = Math.max(1, activeKeyframe.durationMs);
      const normalizedT = Math.max(0, Math.min(1, (timestampMs - activeKeyframe.timestampMs) / duration));

      const fromState: CameraState = { x: 0, y: 0, scale: 1.0 };
      const toState: CameraState = { x: targetPanX, y: targetPanY, scale: targetZoom };

      currentCamera = interpolateCameraState(fromState, toState, normalizedT, activeKeyframe.easingCurve);

      const velRate = evaluateEasingVelocity(activeKeyframe.easingCurve, normalizedT, duration / 1000);
      velocityX = (targetPanX - fromState.x) * velRate;
      velocityY = (targetPanY - fromState.y) * velRate;

      this.camera.snapTo(currentCamera);
    } else {
      // 2nd-order ODE Spring simulation
      this.camera.setTarget({ x: targetPanX, y: targetPanY, scale: targetZoom });

      if (isDiscontinuousSeek) {
        // Snap directly to target on seek / backward scrub to eliminate velocity explosion
        this.camera.snapTo({ x: targetPanX, y: targetPanY, scale: targetZoom });
        currentCamera = this.camera.getCurrent();
        velocityX = 0;
        velocityY = 0;
      } else {
        const dt = Math.max(0.001, (timestampMs - this.lastEvaluatedTime) / 1000);
        currentCamera = this.camera.step(dt);
        velocityX = (currentCamera.x - this.lastCameraState.x) / dt;
        velocityY = (currentCamera.y - this.lastCameraState.y) / dt;
      }
    }

    this.lastEvaluatedTime = timestampMs;
    this.lastCameraState = { ...currentCamera };

    // 2. Evaluate smoothed cursor position
    const sampledCursor = this.smoother.sample(timestampMs);

    // 3. Evaluate active click ripples
    const activeRipples = this.evaluateRipples(timestampMs);

    return {
      timestampMs,
      camera: {
        zoomScale: currentCamera.scale,
        panX: currentCamera.x,
        panY: currentCamera.y,
        velocityX: isFinite(velocityX) ? velocityX : 0,
        velocityY: isFinite(velocityY) ? velocityY : 0,
      },
      cursor: {
        x: sampledCursor.x,
        y: sampledCursor.y,
        visible: sampledCursor.visible,
      },
      activeRipples,
    };
  }

  private findActiveKeyframe(timestampMs: number): CameraKeyframe | undefined {
    for (const kf of this.project.keyframes) {
      if (timestampMs >= kf.timestampMs && timestampMs <= kf.timestampMs + kf.durationMs) {
        return kf;
      }
    }
    return undefined;
  }

  private evaluateRipples(timestampMs: number) {
    const ripples: Array<{ x: number; y: number; radius: number; alpha: number }> = [];

    for (let i = 0; i < (this.project.events || []).length; i++) {
      const ev = this.project.events[i];
      if (ev.eventType === 'click' && timestampMs >= ev.timestamp && timestampMs <= ev.timestamp + 600) {
        const rippleState = evaluateClickRipple(
          {
            id: `ripple-${i}`,
            x: ev.cursor.x,
            y: ev.cursor.y,
            startTimeMs: ev.timestamp,
            durationMs: 600,
            maxRadius: 48,
            color: '#3b82f6',
          },
          timestampMs
        );
        if (rippleState.active && rippleState.alpha > 0.01) {
          ripples.push({
            x: rippleState.x,
            y: rippleState.y,
            radius: rippleState.radius,
            alpha: rippleState.alpha,
          });
        }
      }
    }

    return ripples;
  }
}
