import { Container, Graphics, Sprite, Texture } from 'pixi.js';

export class VideoViewportLayer extends Container {
  private contentContainer: Container;
  private videoSprite: Sprite;
  private maskGfx: Graphics;

  constructor(
    public viewportWidth: number,
    public viewportHeight: number,
    public borderRadius: number = 16
  ) {
    super();

    this.contentContainer = new Container();
    this.videoSprite = new Sprite(Texture.WHITE);
    this.maskGfx = new Graphics();

    this.contentContainer.addChild(this.videoSprite);
    this.contentContainer.mask = this.maskGfx;

    this.addChild(this.maskGfx);
    this.addChild(this.contentContainer);

    this.updateMask();
  }

  public setTexture(texture: Texture): void {
    this.videoSprite.texture = texture;
  }

  public updateDimensions(width: number, height: number, borderRadius: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.borderRadius = borderRadius;
    this.updateMask();
  }

  private updateMask(): void {
    this.maskGfx.clear();
    this.maskGfx
      .roundRect(0, 0, this.viewportWidth, this.viewportHeight, this.borderRadius)
      .fill('#ffffff');
  }

  /**
   * Applies the SpringCamera transform matrix
   * @param zoomScale Magnification factor (e.g. 1.0 -> 2.5)
   * @param panX Horizontal translation offset (px)
   * @param panY Vertical translation offset (px)
   */
  public applyCameraTransform(zoomScale: number, panX: number, panY: number): void {
    // Zoom centered around focal point with pan offset
    this.contentContainer.scale.set(zoomScale);
    this.contentContainer.position.set(panX, panY);
  }
}
