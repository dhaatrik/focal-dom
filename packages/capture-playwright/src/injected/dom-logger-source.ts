/**
 * In-Page DOM Metadata Tracker Source Script
 * Injected into the browser context via Playwright `page.addInitScript()`.
 */

export const INJECTED_DOM_LOGGER_SOURCE = `
(function() {
  if (window.__FOCAL_LOGGER_INITIALIZED__) return;
  window.__FOCAL_LOGGER_INITIALIZED__ = true;

  window.__FOCAL_EVENT_LOG__ = [];
  window.__FOCAL_ACTIVE_STICKY_REGIONS__ = [];
  window.__FOCAL_LAST_CURSOR__ = { x: 0, y: 0 };
  window.__FOCAL_START_TIME__ = performance.now();

  function isElementFixedOrSticky(element) {
    let current = element;
    while (current && current !== document.body && current !== document.documentElement) {
      try {
        const style = window.getComputedStyle(current);
        if (style.position === 'fixed' || style.position === 'sticky') {
          return true;
        }
      } catch (e) {
        break;
      }
      current = current.parentElement;
    }
    return false;
  }

  function getComputedZIndex(element) {
    let current = element;
    while (current && current !== document.body) {
      try {
        const z = window.getComputedStyle(current).zIndex;
        if (z && z !== 'auto') {
          const parsed = parseInt(z, 10);
          if (!isNaN(parsed)) return parsed;
        }
      } catch (e) {
        break;
      }
      current = current.parentElement;
    }
    return 0;
  }

  function scanStickyRegions() {
    const stickyElements = [];
    const all = document.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      try {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            stickyElements.push({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              isFixedOrSticky: true,
              computedZIndex: getComputedZIndex(el),
            });
          }
        }
      } catch (e) {}
    }
    window.__FOCAL_ACTIVE_STICKY_REGIONS__ = stickyElements;
    return stickyElements;
  }

  function getElementMetadata(element) {
    if (!element || !(element instanceof HTMLElement || element instanceof SVGElement)) return undefined;
    const rect = element.getBoundingClientRect();
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || '',
      classList: Array.from(element.classList || []),
      role: element.getAttribute('role') || undefined,
      innerTextSnippet: (element.innerText || '').slice(0, 80).trim(),
      boundingRect: {
        top: Math.round(rect.top * 100) / 100,
        left: Math.round(rect.left * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        isFixedOrSticky: isElementFixedOrSticky(element),
        computedZIndex: getComputedZIndex(element),
      }
    };
  }

  window.addEventListener('mousemove', function(e) {
    window.__FOCAL_LAST_CURSOR__ = { x: e.clientX, y: e.clientY };
  }, { passive: true, capture: true });

  window.addEventListener('click', function(e) {
    window.__FOCAL_LAST_CURSOR__ = { x: e.clientX, y: e.clientY };
    scanStickyRegions();
    if (window.__focal_on_event) {
      window.__focal_on_event('click', e.target, e.clientX, e.clientY);
    }
  }, { capture: true });

  window.addEventListener('input', function(e) {
    scanStickyRegions();
    if (window.__focal_on_event) {
      window.__focal_on_event('input', e.target, window.__FOCAL_LAST_CURSOR__.x, window.__FOCAL_LAST_CURSOR__.y);
    }
  }, { capture: true });

  window.addEventListener('focusin', function(e) {
    scanStickyRegions();
    if (window.__focal_on_event) {
      window.__focal_on_event('focus', e.target, window.__FOCAL_LAST_CURSOR__.x, window.__FOCAL_LAST_CURSOR__.y);
    }
  }, { capture: true });

  window.addEventListener('scroll', function() {
    scanStickyRegions();
  }, { passive: true, capture: true });

  // Periodic scan for dynamic headers
  setInterval(scanStickyRegions, 1000);
})();
`;
