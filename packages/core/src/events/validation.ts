import { DOMEventFrame, DOMElementRect, FocalDOMProject, SpringConfig } from './dom-event-schema';

export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  stiffness: 140,
  damping: 16,
  mass: 1.0,
  precision: 0.001,
};

export const DEFAULT_PROJECT: Omit<FocalDOMProject, 'id' | 'title' | 'createdAt' | 'updatedAt' | 'rawVideoPath'> = {
  version: '0.1.0',
  aspectRatio: '16:9',
  canvasPadding: 48,
  backgroundStyle: {
    type: 'gradient',
    colors: ['#0f172a', '#1e293b', '#334155'],
  },
  windowFrame: {
    showControls: true,
    borderRadius: 16,
    shadowBlur: 32,
    shadowSpread: 4,
    shadowColor: 'rgba(0, 0, 0, 0.45)',
  },
  springConfig: DEFAULT_SPRING_CONFIG,
  keyframes: [],
  events: [],
};

/**
 * Validates whether an object adheres to DOMElementRect structure
 */
export function isValidDOMElementRect(rect: unknown): rect is DOMElementRect {
  if (!rect || typeof rect !== 'object') return false;
  const r = rect as Record<string, unknown>;
  return (
    typeof r.top === 'number' &&
    typeof r.left === 'number' &&
    typeof r.width === 'number' &&
    typeof r.height === 'number' &&
    typeof r.isFixedOrSticky === 'boolean' &&
    typeof r.computedZIndex === 'number'
  );
}

/**
 * Validates a single DOMEventFrame
 */
export function isValidDOMEventFrame(frame: unknown): frame is DOMEventFrame {
  if (!frame || typeof frame !== 'object') return false;
  const f = frame as Record<string, unknown>;
  const validTypes = ['click', 'scroll', 'hover', 'focus', 'input', 'navigation'];

  if (
    typeof f.frameIndex !== 'number' ||
    typeof f.timestamp !== 'number' ||
    typeof f.eventType !== 'string' ||
    !validTypes.includes(f.eventType) ||
    !f.cursor ||
    typeof (f.cursor as Record<string, unknown>).x !== 'number' ||
    typeof (f.cursor as Record<string, unknown>).y !== 'number' ||
    !f.viewport ||
    typeof (f.viewport as Record<string, unknown>).width !== 'number' ||
    typeof (f.viewport as Record<string, unknown>).height !== 'number' ||
    !Array.isArray(f.activeStickyRegions)
  ) {
    return false;
  }

  return true;
}

/**
 * Validates and normalizes project JSON data
 */
export function createProject(params: {
  id: string;
  title: string;
  rawVideoPath: string;
  events?: DOMEventFrame[];
  springConfig?: Partial<SpringConfig>;
}): FocalDOMProject {
  const now = Date.now();
  return {
    id: params.id,
    title: params.title,
    version: '0.1.0',
    createdAt: now,
    updatedAt: now,
    rawVideoPath: params.rawVideoPath,
    aspectRatio: DEFAULT_PROJECT.aspectRatio,
    canvasPadding: DEFAULT_PROJECT.canvasPadding,
    backgroundStyle: { ...DEFAULT_PROJECT.backgroundStyle },
    windowFrame: { ...DEFAULT_PROJECT.windowFrame },
    springConfig: { ...DEFAULT_SPRING_CONFIG, ...(params.springConfig || {}) },
    keyframes: [],
    events: params.events || [],
  };
}
