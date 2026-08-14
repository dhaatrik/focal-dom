/**
 * @focaldom/core
 * Shared mathematical models, spring camera physics, and DOM event schemas
 */

export const FOCALDOM_VERSION = '0.1.0';

export interface DOMElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  isFixedOrSticky: boolean;
  computedZIndex: number;
}

export interface DOMEventFrame {
  frameIndex: number;
  timestamp: number;
  eventType: 'click' | 'scroll' | 'hover' | 'focus' | 'input' | 'navigation';
  cursor: { x: number; y: number };
  viewport: { width: number; height: number; devicePixelRatio: number };
  targetElement?: {
    tagName: string;
    id: string;
    classList: string[];
    role?: string;
    innerTextSnippet?: string;
    boundingRect: DOMElementRect;
  };
  scrollOffset: { x: number; y: number };
  activeStickyRegions: DOMElementRect[];
}
