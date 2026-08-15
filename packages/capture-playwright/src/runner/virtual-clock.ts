/**
 * Deterministic Virtual Clock Injected Script
 * Overrides `requestAnimationFrame`, `performance.now()`, `AudioContext.currentTime`,
 * and `document.timeline.currentTime` so that each frame tick advances page animations,
 * audio graphs, and timers with zero temporal jitter.
 */

export const INJECTED_VIRTUAL_CLOCK_SOURCE = `
(function() {
  if (window.__FOCAL_CLOCK_INITIALIZED__) return;
  window.__FOCAL_CLOCK_INITIALIZED__ = true;

  var currentVirtualTime = 0;
  var rAFCallbacks = [];
  var nextCallbackId = 1;

  window.__focal_virtual_time__ = 0;

  // 1. Intercept performance.now
  if (window.performance) {
    window.performance.now = function() {
      return window.__focal_virtual_time__;
    };
  }

  // 2. Intercept requestAnimationFrame
  window.requestAnimationFrame = function(callback) {
    var id = nextCallbackId++;
    rAFCallbacks.push({ id: id, callback: callback });
    return id;
  };

  window.cancelAnimationFrame = function(id) {
    rAFCallbacks = rAFCallbacks.filter(function(item) { return item.id !== id; });
  };

  // 3. Intercept Web Audio AudioContext / BaseAudioContext currentTime
  function hookAudioContext(ctxProto) {
    if (ctxProto && Object.getOwnPropertyDescriptor(ctxProto, 'currentTime')) {
      try {
        Object.defineProperty(ctxProto, 'currentTime', {
          get: function() {
            return window.__focal_virtual_time__ / 1000;
          },
          configurable: true,
        });
      } catch (e) {}
    }
  }

  if (typeof BaseAudioContext !== 'undefined') {
    hookAudioContext(BaseAudioContext.prototype);
  }
  if (typeof AudioContext !== 'undefined') {
    hookAudioContext(AudioContext.prototype);
  }
  if (typeof webkitAudioContext !== 'undefined') {
    hookAudioContext(webkitAudioContext.prototype);
  }

  // 4. Intercept DocumentTimeline / Web Animations API
  if (typeof DocumentTimeline !== 'undefined' && DocumentTimeline.prototype) {
    try {
      Object.defineProperty(DocumentTimeline.prototype, 'currentTime', {
        get: function() {
          return window.__focal_virtual_time__;
        },
        configurable: true,
      });
    } catch (e) {}
  } else if (document && document.timeline) {
    try {
      Object.defineProperty(document.timeline, 'currentTime', {
        get: function() {
          return window.__focal_virtual_time__;
        },
        configurable: true,
      });
    } catch (e) {}
  }

  /**
   * Called by the Node/Playwright runner to advance the virtual frame by dt milliseconds
   */
  window.__focal_tick = function(frameIndex, deltaTimeMs) {
    window.__focal_virtual_time__ += deltaTimeMs;
    var currentTime = window.__focal_virtual_time__;

    // Rescan sticky headers synchronously with frame progression
    if (typeof window.__focal_scan_sticky__ === 'function') {
      try {
        window.__focal_scan_sticky__();
      } catch (e) {}
    }

    // Execute pending rAF callbacks
    var callbacksToRun = rAFCallbacks.slice();
    rAFCallbacks = [];

    for (var i = 0; i < callbacksToRun.length; i++) {
      try {
        callbacksToRun[i].callback(currentTime);
      } catch (e) {
        console.error('Error in rAF callback:', e);
      }
    }

    return {
      frameIndex: frameIndex,
      timestamp: currentTime,
      pendingCallbacks: rAFCallbacks.length
    };
  };
})();
`;
