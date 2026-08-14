/**
 * Deterministic Virtual Clock Injected Script
 * Overrides `requestAnimationFrame`, `performance.now()`, and CSS animation time
 * so that each frame tick advances page animations and timers with zero temporal jitter.
 */

export const INJECTED_VIRTUAL_CLOCK_SOURCE = `
(function() {
  if (window.__FOCAL_CLOCK_INITIALIZED__) return;
  window.__FOCAL_CLOCK_INITIALIZED__ = true;

  var currentVirtualTime = 0;
  var rAFCallbacks = [];
  var nextCallbackId = 1;

  window.__focal_virtual_time__ = 0;

  // Intercept performance.now
  var originalPerformanceNow = window.performance.now.bind(window.performance);
  window.performance.now = function() {
    return window.__focal_virtual_time__;
  };

  // Intercept requestAnimationFrame
  window.requestAnimationFrame = function(callback) {
    var id = nextCallbackId++;
    rAFCallbacks.push({ id: id, callback: callback });
    return id;
  };

  window.cancelAnimationFrame = function(id) {
    rAFCallbacks = rAFCallbacks.filter(function(item) { return item.id !== id; });
  };

  /**
   * Called by the Node/Playwright runner to advance the virtual frame by dt milliseconds
   */
  window.__focal_tick = function(frameIndex, deltaTimeMs) {
    window.__focal_virtual_time__ += deltaTimeMs;
    var currentTime = window.__focal_virtual_time__;

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
