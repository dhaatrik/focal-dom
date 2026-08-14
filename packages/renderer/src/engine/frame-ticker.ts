import {
  FocalDOMProject,
  SpringCamera,
  CubicBezierSmoother,
  evaluateRippleState,
  CameraState,
} from '@focaldom/core';
import { FrameEvaluationResult } from './scene-types';

export class FrameTicker {
  private camera: SpringCamera;
  private smoother: CubicBezierSmoother;
  private lastCameraState: CameraState = { zoomScale: 1.0, panOffset: { x: 0, y: 0 } };
  private lastEvaluatedTime: number = 0;

  constructor(private project: FocalDOMProject) {
    this.camera = new SpringCamera(project.springConfig);
    this.smoother = new CubicBezierSmoother();
  }

  public updateProject(project: FocalDOMProject): void {
    this.project = project;
    this.camera.setSpringConfig(project.springConfig);
  }

  /**
   * Evaluates the complete camera, cursor, and ripple state at timestamp `t` (in milliseconds)
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

    const dt = Math.max(0.001, (timestampMs - this.lastEvaluatedTime) / 1000);
    this.lastEvaluatedTime = timestampMs;

    this.camera.setTarget(targetZoom, { x: targetPanX, y: targetPanY });
    const currentCamera = this.camera.step(dt);

    const velocityX = (currentCamera.panOffset.x - this.lastCameraState.panOffset.x) / dt;
    const velocityY = (currentCamera.panOffset.y - this.lastCameraState.panOffset.y) / dt;
    this.lastCameraState = { ...currentCamera };

    // 2. Evaluate smoothed cursor position
    const cursor = this.evaluateCursor(timestampMs);

    // 3. Evaluate active click ripples
    const activeRipples = this.evaluateRipples(timestampMs);

    return {
      timestampMs,
      camera: {
        zoomScale: currentCamera.zoomScale,
        panX: currentCamera.panOffset.x,
        panY: currentCamera.panOffset.y,
        velocityX,
        velocityY,
      },
      cursor: {
        x: cursor.x,
        y: cursor.y,
        visible: cursor.visible,
      },
      activeRipples,
    };
  }

  private findActiveKeyframe(timestampMs: number) {
    for (const kf of this.project.keyframes) {
      if (timestampMs >= kf.timestampMs && timestampMs <= kf.timestampMs + kf.durationMs) {
        return kf;
      }
    }
    return undefined;
  }

  private evaluateCursor(timestampMs: number): { x: number; y: number; visible: boolean } {
    if (!this.project.events || this.project.events.length === 0) {
      return { x: 0, y: 0, visible: false };
    }

    const events = this.project.events;
    // Find surrounding events
    let prev = events[0];
    let next = events[events.length - 1];

    for (let i = 0; i < events.length; i++) {
      if (events[i].timestamp <= timestampMs) {
        prev = events[i];
      }
      if (events[i].timestamp >= timestampMs) {
        next = events[i];
        break;
      }
    }

    if (prev === next || prev.timestamp === next.timestamp) {
      return { x: prev.cursor.x, y: prev.cursor.y, visible: true };
    }

    const t = (timestampMs - prev.timestamp) / (next.timestamp - prev.timestamp);
    const clampedT = Math.max(0, Math.min(1, t));

    // Linear/Bezier interpolation
    const interpolated = this.smoother.interpolateCubic(prev.cursor, next.cursor, clampedT);
    return { x: interpolated.x, y: interpolated.y, visible: true };
  }

  private evaluateRipples(timestampMs: number) {
    const ripples: Array<{ x: number; y: number; radius: number; alpha: number }> = [];

    for (const ev of this.project.events || []) {
      if (ev.eventType === 'click' && timestampMs >= ev.timestamp && timestampMs <= ev.timestamp + 600) {
        const elapsed = timestampMs - ev.timestamp;
        const rippleState = evaluateRippleState(elapsed, 600, 48);
        if (rippleState.alpha > 0.01) {
          ripples.push({
            x: ev.cursor.x,
            y: ev.cursor.y,
            radius: rippleState.radius,
            alpha: rippleState.alpha,
          });
        }
      }
    }

    return ripples;
  }
}
