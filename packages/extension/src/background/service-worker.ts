import { ExtensionWebSocketClient } from './websocket-client';
import { DOMEventFrame } from '@focaldom/core';

const wsClient = new ExtensionWebSocketClient();
let isRecording = false;
let activeRecordingTabId: number | null = null;

// Initialize WebSocket connection to desktop server
wsClient.connect();

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_RECORDING_REQUEST':
        if (chrome.tabs?.query) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab?.id) {
              activeRecordingTabId = activeTab.id;
              isRecording = true;
              chrome.tabs.sendMessage(activeTab.id, { type: 'START_RECORDING' }, () => {
                sendResponse({ success: true, isRecording: true });
              });
            } else {
              sendResponse({ success: false, error: 'No active tab found' });
            }
          });
          return true; // async sendResponse
        }
        break;

      case 'STOP_RECORDING_REQUEST':
        if (activeRecordingTabId && chrome.tabs?.sendMessage) {
          chrome.tabs.sendMessage(activeRecordingTabId, { type: 'STOP_RECORDING' }, () => {
            isRecording = false;
            activeRecordingTabId = null;
            sendResponse({ success: true, isRecording: false });
          });
          return true;
        } else {
          isRecording = false;
          activeRecordingTabId = null;
          sendResponse({ success: true, isRecording: false });
        }
        break;

      case 'GET_STATUS_REQUEST':
        sendResponse({
          isRecording,
          isConnectedToDesktop: wsClient.connected,
          activeTabId: activeRecordingTabId,
        });
        break;

      case 'DOM_EVENT_FRAME':
        if (isRecording && message.payload) {
          wsClient.sendFrame(message.payload as DOMEventFrame);
        }
        break;
    }
    return true;
  });
}
