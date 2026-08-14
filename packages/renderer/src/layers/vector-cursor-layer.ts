import { Container, Graphics } from 'pixi.js';

export interface RippleState {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color?: string;
}

export class VectorCursorLayer extends Container {
  private cursorGfx: Graphics;
  private ripplesGfx: Graphics;

  constructor() {
    super();

    this.ripplesGfx = new Graphics();
    this.cursorGfx = new Graphics();

    this.addChild(this.ripplesGfx);
    this.addChild(this.cursorGfx);

    this.drawCursorShape();
  }

  private drawCursorShape(): void {
    this.cursorGfx.clear();

    // macOS/Modern Style Vector Cursor Arrow
    this.cursorGfx
      .poly([
        0, 0,
        0, 18,
        4.5, 14,
        8.5, 22,
        11.5, 20.5,
        7.5, 12.5,
        13.5, 12.5,
      ])
      .fill('#000000')
      .stroke({ color: '#ffffff', width: 1.5 });
  }

  public updateCursor(x: number, y: number, visible: boolean = true): void {
    this.cursorGfx.visible = visible;
    this.cursorGfx.position.set(x, y);
  }

  public updateRipples(ripples: RippleState[]): void {
    this.ripplesGfx.clear();

    for (const ripple of ripples) {
      if (ripple.alpha <= 0.01) continue;

      const rippleColor = ripple.color || '#3b82f6';

      // Outer expanding shockwave
      this.ripplesGfx
        .circle(ripple.x, ripple.y, ripple.radius)
        .stroke({ color: rippleColor, width: 2.5, alpha: ripple.alpha });

      // Subtle inner glow
      this.ripplesGfx
        .circle(ripple.x, ripple.y, ripple.radius * 0.4)
        .fill({ color: rippleColor, alpha: ripple.alpha * 0.3 });
    }
  }
}
