import { ExtensionDOMTracker } from './dom-tracker';
import { RecordingOverlay } from './visual-overlay';
import { DOMEventFrame } from '@focaldom/core';

const tracker = new ExtensionDOMTracker((frame: DOMEventFrame) => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: 'DOM_EVENT_FRAME',
      payload: frame,
    }).catch(() => {
      // Background worker might be idle
    });
  }
});

const overlay = new RecordingOverlay();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_RECORDING':
        tracker.start();
        overlay.show();
        sendResponse({ success: true, tracking: true });
        break;

      case 'STOP_RECORDING':
        tracker.stop();
        overlay.hide();
        sendResponse({ success: true, tracking: false });
        break;

      case 'GET_STATUS':
        sendResponse({ tracking: tracker.tracking });
        break;
    }
    return true;
  });
}
