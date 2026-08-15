import { Application, Texture } from 'pixi.js';
import { RenderDimensions, RendererOptions } from './scene-types';
import { FocalSceneGraph } from './scene-graph';
import { FrameTicker } from './frame-ticker';
import { FocalDOMProject } from '@focaldom/core';

export class FocalPixiApp {
  private app: Application | null = null;
  private sceneGraph: FocalSceneGraph | null = null;
  private ticker: FrameTicker;
  private currentVideoTexture: Texture | null = null;
  private isInitialized: boolean = false;

  constructor(private options: RendererOptions) {
    this.ticker = new FrameTicker(options.project);
  }

  public async init(canvasElement?: HTMLCanvasElement): Promise<Application> {
    const { dimensions } = this.options;

    this.app = new Application();
    await this.app.init({
      canvas: canvasElement,
      width: dimensions.width,
      height: dimensions.height,
      resolution: dimensions.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      preference: 'webgl', // WebGL2/WebGPU preferred
      clearBeforeRender: true,
      backgroundAlpha: 1,
    });

    this.sceneGraph = new FocalSceneGraph(this.options);
    this.app.stage.addChild(this.sceneGraph);
    this.isInitialized = true;

    return this.app;
  }

  public getApplication(): Application {
    if (!this.app) {
      throw new Error('FocalPixiApp has not been initialized. Call app.init() first.');
    }
    return this.app;
  }

  public getSceneGraph(): FocalSceneGraph {
    if (!this.sceneGraph) {
      throw new Error('FocalPixiApp has not been initialized. Call app.init() first.');
    }
    return this.sceneGraph;
  }

  public getTicker(): FrameTicker {
    return this.ticker;
  }

  /**
   * Resizes the canvas and updates scene graph layout without destroying the WebGL/WebGPU context
   */
  public resize(dimensions: RenderDimensions, project?: FocalDOMProject): void {
    this.options.dimensions = dimensions;
    if (project) {
      this.options.project = project;
      this.ticker.updateProject(project);
    }

    if (this.app) {
      this.app.renderer.resize(
        dimensions.width,
        dimensions.height,
        dimensions.devicePixelRatio || 1
      );
    }

    if (this.sceneGraph) {
      this.sceneGraph.updateDimensions(dimensions, project);
    }
  }

  public setVideoTexture(texture: Texture): void {
    if (this.currentVideoTexture && this.currentVideoTexture !== texture && this.currentVideoTexture !== Texture.WHITE) {
      // Release previous transient GPU texture if dynamic
      try {
        this.currentVideoTexture.destroy(true);
      } catch {
        // Safe fallback
      }
    }
    this.currentVideoTexture = texture;
    if (this.sceneGraph) {
      this.sceneGraph.setVideoTexture(texture);
    }
  }

  /**
   * Renders the frame at the specified timestamp in milliseconds
   */
  public renderFrame(timestampMs: number, videoTexture?: Texture): void {
    if (!this.app || !this.sceneGraph) return;

    if (videoTexture) {
      this.setVideoTexture(videoTexture);
    }

    const evalResult = this.ticker.evaluate(timestampMs);
    this.sceneGraph.updateFromEvaluation(evalResult);
    this.app.renderer.render(this.app.stage);
  }

  /**
   * Extracts raw uncompressed RGBA pixel buffer from current canvas
   */
  public async extractRawPixels(): Promise<Uint8Array | Uint8ClampedArray | null> {
    if (!this.app) return null;
    try {
      const pixels = this.app.renderer.extract.pixels(this.app.stage);
      return pixels.pixels;
    } catch {
      return null;
    }
  }

  public destroy(): void {
    if (this.currentVideoTexture && this.currentVideoTexture !== Texture.WHITE) {
      try {
        this.currentVideoTexture.destroy(true);
      } catch {
        // Safe fallback
      }
      this.currentVideoTexture = null;
    }

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
      this.sceneGraph = null;
      this.isInitialized = false;
    }
  }
}
