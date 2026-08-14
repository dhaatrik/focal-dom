import { AspectRatio, FocalDOMProject } from '@focaldom/core';

export interface RenderDimensions {
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  devicePixelRatio: number;
}

export interface WindowStyleConfig {
  showControls: boolean;
  borderRadius: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowColor: string;
  shadowAlpha: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface BackgroundStyleConfig {
  type: 'gradient' | 'solid' | 'blur';
  colors: string[];
  gradientAngle?: number; // In degrees, default 135
}

export interface RendererOptions {
  dimensions: RenderDimensions;
  project: FocalDOMProject;
  fps?: number; // Default 60
  enableMotionBlur?: boolean;
}

export interface FrameEvaluationResult {
  timestampMs: number;
  camera: {
    zoomScale: number;
    panX: number;
    panY: number;
    velocityX: number;
    velocityY: number;
  };
  cursor: {
    x: number;
    y: number;
    visible: boolean;
  };
  activeRipples: Array<{
    x: number;
    y: number;
    radius: number;
    alpha: number;
  }>;
}
