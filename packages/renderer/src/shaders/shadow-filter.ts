import { BlurFilter } from 'pixi.js';

export class DropShadowFilter extends BlurFilter {
  constructor(blurRadius: number = 8, quality: number = 4) {
    super({
      strength: blurRadius,
      quality,
      resolution: 2,
    });
  }
}
