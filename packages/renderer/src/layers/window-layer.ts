import { Container, Graphics } from 'pixi.js';
import { WindowStyleConfig } from '../engine/scene-types';

export class WindowLayer extends Container {
  private shadowGfx: Graphics;
  private frameGfx: Graphics;
  private controlsGfx: Graphics;

  constructor(
    public windowWidth: number,
    public windowHeight: number,
    private style: WindowStyleConfig
  ) {
    super();

    this.shadowGfx = new Graphics();
    this.frameGfx = new Graphics();
    this.controlsGfx = new Graphics();

    this.addChild(this.shadowGfx);
    this.addChild(this.frameGfx);
    this.addChild(this.controlsGfx);

    this.renderWindow();
  }

  public updateDimensions(width: number, height: number, style?: WindowStyleConfig): void {
    this.windowWidth = width;
    this.windowHeight = height;
    if (style) this.style = style;
    this.renderWindow();
  }

  private renderWindow(): void {
    this.shadowGfx.clear();
    this.frameGfx.clear();
    this.controlsGfx.clear();

    const { borderRadius, shadowBlur, shadowAlpha, shadowColor, showControls } = this.style;

    // 1. Ambient Drop Shadow (multi-pass rounded rect)
    for (let pass = 3; pass >= 1; pass--) {
      const spread = (shadowBlur / 3) * pass;
      const alpha = (shadowAlpha / 3) * (1 / pass);
      this.shadowGfx
        .roundRect(
          -spread,
          spread * 0.6,
          this.windowWidth + spread * 2,
          this.windowHeight + spread * 2,
          borderRadius + spread * 0.5
        )
        .fill({ color: shadowColor || '#000000', alpha });
    }

    // 2. Window Frame Background / Border
    this.frameGfx
      .roundRect(0, 0, this.windowWidth, this.windowHeight, borderRadius)
      .fill({ color: '#000000', alpha: 1 })
      .stroke({ color: '#334155', width: 1, alpha: 0.6 });

    // 3. macOS / Windows Titlebar Controls
    if (showControls) {
      const controlY = 18;
      const controlRadius = 6;

      // Close (Red)
      this.controlsGfx.circle(24, controlY, controlRadius).fill('#ef4444');
      // Minimize (Yellow)
      this.controlsGfx.circle(44, controlY, controlRadius).fill('#eab308');
      // Maximize (Green)
      this.controlsGfx.circle(64, controlY, controlRadius).fill('#22c55e');
    }
  }
}
