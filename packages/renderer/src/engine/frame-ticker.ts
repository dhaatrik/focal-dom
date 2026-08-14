import {
  FocalDOMProject,
  SpringCamera,
  CubicBezierSmoother,
  evaluateClickRipple,
  CameraState,
  CursorPoint,
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

    this.camera.setTarget({ x: targetPanX, y: targetPanY, scale: targetZoom });
    const currentCamera = this.camera.step(dt);

    const velocityX = (currentCamera.x - this.lastCameraState.x) / dt;
    const velocityY = (currentCamera.y - this.lastCameraState.y) / dt;
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
        velocityX,
        velocityY,
      },
      cursor: {
        x: sampledCursor.x,
        y: sampledCursor.y,
        visible: sampledCursor.visible,
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
