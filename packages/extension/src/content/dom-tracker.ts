import { DOMEventFrame, DOMElementRect, DOMEventType } from '@focaldom/core';

export type EventFrameCallback = (frame: DOMEventFrame) => void;

export class ExtensionDOMTracker {
  private isTracking = false;
  private frameIndex = 0;
  private lastCursor = { x: 0, y: 0 };
  private callback: EventFrameCallback | null = null;
  private stickyRegionCache: DOMElementRect[] = [];
  private lastStickyScanTime = 0;

  constructor(callback?: EventFrameCallback) {
    if (callback) {
      this.callback = callback;
    }
  }

  /**
   * Starts tracking DOM interactions and sticky regions.
   */
  start(callback?: EventFrameCallback): void {
    if (this.isTracking) return;
    if (callback) {
      this.callback = callback;
    }
    this.isTracking = true;
    this.frameIndex = 0;

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('click', this.handleClick, { passive: true, capture: true });
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      window.addEventListener('input', this.handleInput, { passive: true, capture: true });
    }
  }

  /**
   * Stops tracking and cleans up event listeners.
   */
  stop(): void {
    if (!this.isTracking) return;
    this.isTracking = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('click', this.handleClick, true);
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('input', this.handleInput, true);
    }
  }

  private handlePointerMove = (e: PointerEvent): void => {
    this.lastCursor = { x: e.clientX, y: e.clientY };
    this.emitEvent('hover', e.clientX, e.clientY, e.target as HTMLElement);
  };

  private handleClick = (e: MouseEvent): void => {
    this.lastCursor = { x: e.clientX, y: e.clientY };
    this.emitEvent('click', e.clientX, e.clientY, e.target as HTMLElement);
  };

  private handleScroll = (): void => {
    this.emitEvent('scroll', this.lastCursor.x, this.lastCursor.y);
  };

  private handleInput = (e: Event): void => {
    this.emitEvent('input', this.lastCursor.x, this.lastCursor.y, e.target as HTMLElement);
  };

  /**
   * Scans DOM for fixed/sticky headers and extracts bounding geometry.
   */
  public scanStickyRegions(): DOMElementRect[] {
    if (typeof document === 'undefined') return [];

    const now = performance.now();
    // Cache sticky scan for 200ms to avoid unnecessary layout reflows
    if (now - this.lastStickyScanTime < 200 && this.stickyRegionCache.length > 0) {
      return this.stickyRegionCache;
    }

    this.lastStickyScanTime = now;
    const regions: DOMElementRect[] = [];
    const elements = document.querySelectorAll('*');

    for (let i = 0; i < Math.min(elements.length, 500); i++) {
      const el = elements[i] as HTMLElement;
      if (!el || typeof el.getBoundingClientRect !== 'function') continue;

      const style = window.getComputedStyle(el);
      const pos = style.position;

      if (pos === 'fixed' || pos === 'sticky') {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const zIndex = parseInt(style.zIndex, 10);
          regions.push({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            isFixedOrSticky: true,
            computedZIndex: isNaN(zIndex) ? 0 : zIndex,
          });
        }
      }
    }

    this.stickyRegionCache = regions;
    return regions;
  }

  /**
   * Emits a normalized DOMEventFrame.
   */
  private emitEvent(
    eventType: DOMEventType,
    x: number,
    y: number,
    targetElement?: HTMLElement | null
  ): void {
    if (!this.isTracking || !this.callback) return;

    let targetInfo;
    if (targetElement && typeof targetElement.getBoundingClientRect === 'function') {
      const rect = targetElement.getBoundingClientRect();
      targetInfo = {
        tagName: targetElement.tagName.toLowerCase(),
        id: targetElement.id || '',
        classList: targetElement.classList ? Array.from(targetElement.classList) : [],
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          isFixedOrSticky: false,
          computedZIndex: 0,
        },
      };
    }

    const frame: DOMEventFrame = {
      frameIndex: this.frameIndex++,
      timestamp: performance.now(),
      eventType,
      cursor: { x, y },
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      },
      scrollOffset: {
        x: typeof window !== 'undefined' ? window.scrollX || window.pageXOffset || 0 : 0,
        y: typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0,
      },
      targetElement: targetInfo,
      activeStickyRegions: this.scanStickyRegions(),
    };

    this.callback(frame);
  }

  get tracking(): boolean {
    return this.isTracking;
  }
}
