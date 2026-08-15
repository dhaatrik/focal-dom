import {
  DOMEventFrame,
  DOMElementRect,
  FocalDOMProject,
  SpringConfig,
  CameraKeyframe,
  AspectRatio,
  EasingCurve,
} from './dom-event-schema';

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
    typeof r.computedZIndex === 'number' &&
    isFinite(r.top) &&
    isFinite(r.left) &&
    isFinite(r.width) &&
    isFinite(r.height)
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
    !Array.isArray(f.activeStickyRegions) ||
    !f.activeStickyRegions.every(isValidDOMElementRect)
  ) {
    return false;
  }

  if (f.targetElement) {
    const el = f.targetElement as Record<string, unknown>;
    if (
      typeof el.tagName !== 'string' ||
      typeof el.id !== 'string' ||
      !Array.isArray(el.classList) ||
      !isValidDOMElementRect(el.boundingRect)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a SpringConfig object
 */
export function isValidSpringConfig(config: unknown): config is SpringConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.stiffness === 'number' &&
    c.stiffness > 0 &&
    isFinite(c.stiffness) &&
    typeof c.damping === 'number' &&
    c.damping > 0 &&
    isFinite(c.damping) &&
    typeof c.mass === 'number' &&
    c.mass > 0 &&
    isFinite(c.mass) &&
    (c.precision === undefined || (typeof c.precision === 'number' && c.precision > 0 && isFinite(c.precision)))
  );
}

/**
 * Validates a CameraKeyframe object
 */
export function isValidCameraKeyframe(kf: unknown): kf is CameraKeyframe {
  if (!kf || typeof kf !== 'object') return false;
  const k = kf as Record<string, unknown>;
  const validEasings: EasingCurve[] = ['spring', 'easeInOutCubic', 'linear'];

  if (
    typeof k.id !== 'string' ||
    k.id.trim().length === 0 ||
    typeof k.timestampMs !== 'number' ||
    k.timestampMs < 0 ||
    !isFinite(k.timestampMs) ||
    typeof k.durationMs !== 'number' ||
    k.durationMs <= 0 ||
    !isFinite(k.durationMs) ||
    typeof k.zoomScale !== 'number' ||
    k.zoomScale < 1.0 ||
    k.zoomScale > 5.0 ||
    !isFinite(k.zoomScale) ||
    !k.panOffset ||
    typeof (k.panOffset as Record<string, unknown>).x !== 'number' ||
    typeof (k.panOffset as Record<string, unknown>).y !== 'number' ||
    !isFinite((k.panOffset as Record<string, unknown>).x as number) ||
    !isFinite((k.panOffset as Record<string, unknown>).y as number) ||
    typeof k.easingCurve !== 'string' ||
    !validEasings.includes(k.easingCurve as EasingCurve) ||
    typeof k.autoZoomGenerated !== 'boolean' ||
    (k.targetElementSelector !== undefined && typeof k.targetElementSelector !== 'string')
  ) {
    return false;
  }

  return true;
}

/**
 * Validates whether an unknown bundle strictly adheres to the FocalDOMProject specification.
 */
export function isValidFocalDOMProject(project: unknown): project is FocalDOMProject {
  if (!project || typeof project !== 'object') return false;
  const p = project as Record<string, unknown>;
  const validAspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3'];
  const validBackgroundTypes = ['gradient', 'solid', 'blur'];

  if (
    typeof p.id !== 'string' ||
    p.id.trim().length === 0 ||
    typeof p.title !== 'string' ||
    typeof p.version !== 'string' ||
    typeof p.createdAt !== 'number' ||
    typeof p.updatedAt !== 'number' ||
    typeof p.rawVideoPath !== 'string' ||
    typeof p.aspectRatio !== 'string' ||
    !validAspectRatios.includes(p.aspectRatio as AspectRatio) ||
    typeof p.canvasPadding !== 'number' ||
    p.canvasPadding < 0 ||
    !p.backgroundStyle ||
    typeof (p.backgroundStyle as Record<string, unknown>).type !== 'string' ||
    !validBackgroundTypes.includes((p.backgroundStyle as Record<string, unknown>).type as string) ||
    !Array.isArray((p.backgroundStyle as Record<string, unknown>).colors) ||
    !p.windowFrame ||
    typeof (p.windowFrame as Record<string, unknown>).showControls !== 'boolean' ||
    typeof (p.windowFrame as Record<string, unknown>).borderRadius !== 'number' ||
    typeof (p.windowFrame as Record<string, unknown>).shadowBlur !== 'number' ||
    typeof (p.windowFrame as Record<string, unknown>).shadowSpread !== 'number' ||
    typeof (p.windowFrame as Record<string, unknown>).shadowColor !== 'string' ||
    !isValidSpringConfig(p.springConfig) ||
    !Array.isArray(p.keyframes) ||
    !p.keyframes.every(isValidCameraKeyframe) ||
    !Array.isArray(p.events) ||
    !p.events.every(isValidDOMEventFrame)
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
