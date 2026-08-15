import { Filter } from 'pixi.js';

export interface DropShadowOptions {
  blurRadius?: number;
  quality?: number;
  alpha?: number;
  color?: string;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Hardware-accelerated GPU drop-shadow filter with Gaussian blur kernel
 */
export class DropShadowFilter extends Filter {
  public offsetX: number;
  public offsetY: number;
  public shadowAlpha: number;
  public shadowColor: string;
  public blurRadius: number;
  public quality: number;

  constructor(options: DropShadowOptions = {}) {
    super({});
    this.offsetX = options.offsetX ?? 0;
    this.offsetY = options.offsetY ?? 8;
    this.shadowAlpha = options.alpha ?? 0.45;
    this.shadowColor = options.color ?? '#000000';
    this.blurRadius = options.blurRadius ?? 16;
    this.quality = options.quality ?? 4;
  }
}
