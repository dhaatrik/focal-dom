import { CameraState, AffineMatrix2D, ViewportDimensions } from './camera-types';
import { SpringConfig } from '../events/dom-event-schema';
import { DEFAULT_SPRING_CONFIG } from '../events/validation';

export class SpringCamera {
  private current: CameraState = { x: 0, y: 0, scale: 1.0 };
  private target: CameraState = { x: 0, y: 0, scale: 1.0 };
  private velocity: CameraState = { x: 0, y: 0, scale: 0 };

  public stiffness: number;
  public damping: number;
  public mass: number;
  public precision: number;

  constructor(config: Partial<SpringConfig> = {}) {
    const cfg = { ...DEFAULT_SPRING_CONFIG, ...config };
    this.stiffness = Math.max(1.0, isFinite(cfg.stiffness) ? cfg.stiffness : DEFAULT_SPRING_CONFIG.stiffness);
    this.damping = Math.max(0.1, isFinite(cfg.damping) ? cfg.damping : DEFAULT_SPRING_CONFIG.damping);
    // Lower mass guard to prevent division by zero and numeric instability
    this.mass = Math.max(0.05, isFinite(cfg.mass) ? cfg.mass : DEFAULT_SPRING_CONFIG.mass);
    this.precision = Math.max(0.00001, isFinite(cfg.precision ?? 0.001) ? (cfg.precision ?? 0.001) : 0.001);
  }

  public getCurrent(): Readonly<CameraState> {
    return { ...this.current };
  }

  public getTarget(): Readonly<CameraState> {
    return { ...this.target };
  }

  public getVelocity(): Readonly<CameraState> {
    return { ...this.velocity };
  }

  public setTarget(target: Partial<CameraState>): void {
    if (target.x !== undefined && isFinite(target.x)) this.target.x = target.x;
    if (target.y !== undefined && isFinite(target.y)) this.target.y = target.y;
    if (target.scale !== undefined && isFinite(target.scale) && target.scale > 0) this.target.scale = target.scale;
  }

  public snapTo(state: Partial<CameraState>): void {
    if (state.x !== undefined && isFinite(state.x)) {
      this.current.x = state.x;
      this.target.x = state.x;
      this.velocity.x = 0;
    }
    if (state.y !== undefined && isFinite(state.y)) {
      this.current.y = state.y;
      this.target.y = state.y;
      this.velocity.y = 0;
    }
    if (state.scale !== undefined && isFinite(state.scale) && state.scale > 0) {
      this.current.scale = state.scale;
      this.target.scale = state.scale;
      this.velocity.scale = 0;
    }
  }

  public reset(): void {
    this.snapTo({ x: 0, y: 0, scale: 1.0 });
  }

  /**
   * Advances the spring simulation by delta time (in seconds)
   */
  public step(deltaTimeSeconds: number): CameraState {
    if (deltaTimeSeconds <= 0 || !isFinite(deltaTimeSeconds)) return { ...this.current };

    // Numerical integration with sub-stepping for extreme stability
    const subSteps = Math.max(1, Math.ceil(deltaTimeSeconds / (1 / 120)));
    const dt = deltaTimeSeconds / subSteps;

    for (let i = 0; i < subSteps; i++) {
      // 2nd-order differential equation: F = -k*(x - target) - c*v
      const ax = (this.stiffness * (this.target.x - this.current.x) - this.damping * this.velocity.x) / this.mass;
      const ay = (this.stiffness * (this.target.y - this.current.y) - this.damping * this.velocity.y) / this.mass;
      const aScale =
        (this.stiffness * (this.target.scale - this.current.scale) - this.damping * this.velocity.scale) / this.mass;

      this.velocity.x += ax * dt;
      this.velocity.y += ay * dt;
      this.velocity.scale += aScale * dt;

      this.current.x += this.velocity.x * dt;
      this.current.y += this.velocity.y * dt;
      this.current.scale += this.velocity.scale * dt;
    }

    // Settle when within precision threshold
    if (this.isSettled()) {
      this.current.x = this.target.x;
      this.current.y = this.target.y;
      this.current.scale = this.target.scale;
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.velocity.scale = 0;
    }

    return { ...this.current };
  }

  public isSettled(threshold: number = this.precision): boolean {
    const dx = Math.abs(this.target.x - this.current.x);
    const dy = Math.abs(this.target.y - this.current.y);
    const dScale = Math.abs(this.target.scale - this.current.scale);

    const vx = Math.abs(this.velocity.x);
    const vy = Math.abs(this.velocity.y);
    const vScale = Math.abs(this.velocity.scale);

    return dx < threshold && dy < threshold && dScale < threshold && vx < threshold && vy < threshold && vScale < threshold;
  }

  /**
   * Computes the 2D affine transform matrix centered on the viewport
   */
  public getAffineMatrix(viewport: ViewportDimensions): AffineMatrix2D {
    const scale = this.current.scale;
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;

    // Translation matrix with centered scaling: T(cx, cy) * S(scale) * T(-cx + x, -cy + y)
    const tx = cx + (this.current.x - cx) * scale;
    const ty = cy + (this.current.y - cy) * scale;

    return {
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      tx,
      ty,
    };
  }
}
