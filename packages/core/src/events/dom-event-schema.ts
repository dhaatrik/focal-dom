/**
 * Canonical DOM metadata and timeline project data schemas for FocalDOM
 */

export interface DOMElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  isFixedOrSticky: boolean;
  computedZIndex: number;
}

export type DOMEventType = 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'navigation';

export interface DOMEventFrame {
  frameIndex: number;
  timestamp: number; // Milliseconds relative to session start
  eventType: DOMEventType;
  cursor: {
    x: number;
    y: number;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  scrollOffset: {
    x: number;
    y: number;
  };
  targetElement?: {
    tagName: string;
    id: string;
    classList: string[];
    role?: string;
    innerTextSnippet?: string;
    boundingRect: DOMElementRect;
  };
  activeStickyRegions: DOMElementRect[];
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type EasingCurve = 'spring' | 'easeInOutCubic' | 'linear';

export interface CameraKeyframe {
  id: string;
  timestampMs: number;
  durationMs: number;
  zoomScale: number;
  panOffset: {
    x: number;
    y: number;
  };
  easingCurve: EasingCurve;
  autoZoomGenerated: boolean;
  targetElementSelector?: string;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  precision?: number;
}

export interface FocalDOMProject {
  id: string;
  title: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  rawVideoPath: string;
  aspectRatio: AspectRatio;
  canvasPadding: number;
  backgroundStyle: {
    type: 'gradient' | 'solid' | 'blur';
    colors: string[];
  };
  windowFrame: {
    showControls: boolean;
    borderRadius: number;
    shadowBlur: number;
    shadowSpread: number;
    shadowColor: string;
  };
  springConfig: SpringConfig;
  keyframes: CameraKeyframe[];
  events: DOMEventFrame[];
}
