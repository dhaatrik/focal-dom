import { Container, Texture } from 'pixi.js';
import { BackgroundLayer } from '../layers/background-layer';
import { WindowLayer } from '../layers/window-layer';
import { VideoViewportLayer } from '../layers/video-viewport-layer';
import { VectorCursorLayer } from '../layers/vector-cursor-layer';
import { MotionBlurFilter } from '../shaders/motion-blur-filter';
import { FrameEvaluationResult, RendererOptions } from './scene-types';

export class FocalSceneGraph extends Container {
  public backgroundLayer: BackgroundLayer;
  public windowLayer: WindowLayer;
  public videoViewportLayer: VideoViewportLayer;
  public vectorCursorLayer: VectorCursorLayer;
  private motionBlurFilter: MotionBlurFilter | null = null;

  constructor(public options: RendererOptions) {
    super();

    const { dimensions, project } = options;
    const padding = project.canvasPadding ?? 64;

    const windowWidth = dimensions.width - padding * 2;
    const windowHeight = dimensions.height - padding * 2;
    const borderRadius = project.windowFrame.borderRadius ?? 16;

    // 1. Background Layer
    this.backgroundLayer = new BackgroundLayer(dimensions, {
      type: project.backgroundStyle.type,
      colors: project.backgroundStyle.colors,
    });
    this.addChild(this.backgroundLayer);

    // Window Container Group
    const windowGroup = new Container();
    windowGroup.position.set(padding, padding);

    // 2. Window Layer (Shadow, Border, Controls)
    this.windowLayer = new WindowLayer(windowWidth, windowHeight, {
      showControls: project.windowFrame.showControls,
      borderRadius,
      shadowBlur: project.windowFrame.shadowBlur,
      shadowSpread: project.windowFrame.shadowSpread,
      shadowColor: project.windowFrame.shadowColor,
      shadowAlpha: 0.45,
    });
    windowGroup.addChild(this.windowLayer);

    // 3. Video Viewport Layer (Clipped Content & Camera Transform)
    this.videoViewportLayer = new VideoViewportLayer(windowWidth, windowHeight, borderRadius);
    windowGroup.addChild(this.videoViewportLayer);

    // 4. Vector Cursor Layer (Cursor Pointer & Ripples)
    this.vectorCursorLayer = new VectorCursorLayer();
    windowGroup.addChild(this.vectorCursorLayer);

    this.addChild(windowGroup);

    // 5. Optional Motion Blur Filter
    if (options.enableMotionBlur) {
      this.motionBlurFilter = new MotionBlurFilter();
      this.videoViewportLayer.filters = [this.motionBlurFilter];
    }
  }

  public setVideoTexture(texture: Texture): void {
    this.videoViewportLayer.setTexture(texture);
  }

  /**
   * Updates all visual layers from an evaluated frame state
   */
  public updateFromEvaluation(evalResult: FrameEvaluationResult): void {
    const { camera, cursor, activeRipples } = evalResult;

    // Update Camera Zoom & Pan on Viewport
    this.videoViewportLayer.applyCameraTransform(camera.zoomScale, camera.panX, camera.panY);

    // Update Motion Blur Velocity
    if (this.motionBlurFilter) {
      this.motionBlurFilter.setVelocity(camera.velocityX, camera.velocityY);
    }

    // Update Cursor Pointer Position
    this.vectorCursorLayer.updateCursor(cursor.x, cursor.y, cursor.visible);

    // Update Click Ripples
    this.vectorCursorLayer.updateRipples(activeRipples);
  }
}
