import { ExtensionWebSocketClient } from './websocket-client';
import { DOMEventFrame } from '@focaldom/core';

const wsClient = new ExtensionWebSocketClient();
let isRecording = false;
let activeRecordingTabId: number | null = null;
let heartbeatInterval: any = null;

// Initialize WebSocket connection to desktop server
wsClient.connect();

function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getPlatformInfo) {
      chrome.runtime.getPlatformInfo(() => {
        // Benign keepalive ping maintaining Manifest V3 worker activity
      });
    }
  }, 15000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

async function persistState(recording: boolean, tabId: number | null) {
  isRecording = recording;
  activeRecordingTabId = tabId;
  if (recording) {
    startHeartbeat();
  } else {
    stopHeartbeat();
  }

  if (typeof chrome !== 'undefined' && chrome.storage?.session) {
    try {
      await chrome.storage.session.set({
        isRecording: recording,
        activeRecordingTabId: tabId,
      });
    } catch {}
  }
}

// Rehydrate state on worker spin-up
if (typeof chrome !== 'undefined' && chrome.storage?.session) {
  chrome.storage.session.get(['isRecording', 'activeRecordingTabId']).then((data) => {
    if (data && data.isRecording) {
      isRecording = Boolean(data.isRecording);
      activeRecordingTabId = data.activeRecordingTabId || null;
      startHeartbeat();
    }
  }).catch(() => {});
}

// Listen to navigation events on active recording tab
if (typeof chrome !== 'undefined' && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (isRecording && tabId === activeRecordingTabId && changeInfo.status === 'complete') {
      chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING' }, () => {
        // Re-armed after page reload / navigation
      });
    }
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_RECORDING_REQUEST':
        if (chrome.tabs?.query) {
          chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];
            if (activeTab?.id) {
              await persistState(true, activeTab.id);
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
          chrome.tabs.sendMessage(activeRecordingTabId, { type: 'STOP_RECORDING' }, async () => {
            await persistState(false, null);
            sendResponse({ success: true, isRecording: false });
          });
          return true;
        } else {
          persistState(false, null);
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
