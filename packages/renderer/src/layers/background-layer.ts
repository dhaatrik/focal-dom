import { Container, Graphics } from 'pixi.js';
import { BackgroundStyleConfig, RenderDimensions } from '../engine/scene-types';

export class BackgroundLayer extends Container {
  private gfx: Graphics;

  constructor(private dimensions: RenderDimensions, private style: BackgroundStyleConfig) {
    super();
    this.gfx = new Graphics();
    this.addChild(this.gfx);
    this.renderBackground();
  }

  public updateStyle(style: BackgroundStyleConfig, dimensions?: RenderDimensions): void {
    this.style = style;
    if (dimensions) this.dimensions = dimensions;
    this.renderBackground();
  }

  private renderBackground(): void {
    this.gfx.clear();
    const { width, height } = this.dimensions;

    if (this.style.type === 'solid') {
      const color = this.style.colors[0] || '#0f172a';
      this.gfx.rect(0, 0, width, height).fill(color);
    } else {
      // Modern multi-color gradient / backdrop
      const colorA = this.style.colors[0] || '#1e1b4b';
      const colorB = this.style.colors[1] || '#312e81';

      this.gfx.rect(0, 0, width, height).fill(colorA);

      // Add ambient radial gradient highlight
      this.gfx
        .circle(width * 0.3, height * 0.2, width * 0.6)
        .fill({ color: colorB, alpha: 0.7 });
    }
  }
}
