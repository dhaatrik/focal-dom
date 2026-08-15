let isRecording = false;
let startTime = 0;
let timerInterval: any = null;

const toggleBtn = document.getElementById('toggle-record-btn');
const btnText = document.getElementById('btn-text');
const timerDisplay = document.getElementById('recording-timer');
const desktopStatus = document.getElementById('desktop-status');
const statusText = document.getElementById('status-text');

const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsDrawer = document.getElementById('settings-drawer');
const wsPortInput = document.getElementById('ws-port-input') as HTMLInputElement | null;
const saveSettingsBtn = document.getElementById('save-settings-btn');

function updateUI() {
  if (isRecording) {
    toggleBtn?.classList.remove('start');
    toggleBtn?.classList.add('stop');
    if (btnText) btnText.textContent = 'Stop Recording';

    if (!timerInterval) {
      startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;
      }, 1000);
    }
  } else {
    toggleBtn?.classList.remove('stop');
    toggleBtn?.classList.add('start');
    if (btnText) btnText.textContent = 'Start Recording';

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (timerDisplay) timerDisplay.textContent = '00:00';
  }
}

function updateConnectionStatus(connected: boolean) {
  if (connected) {
    desktopStatus?.classList.remove('offline');
    desktopStatus?.classList.add('online');
    if (statusText) statusText.textContent = 'App Connected';
  } else {
    desktopStatus?.classList.remove('online');
    desktopStatus?.classList.add('offline');
    if (statusText) statusText.textContent = 'App Offline';
  }
}

// Fetch initial status and settings from background script & storage
if (typeof chrome !== 'undefined') {
  if (chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: 'GET_STATUS_REQUEST' }, (response) => {
      if (response) {
        isRecording = Boolean(response.isRecording);
        updateConnectionStatus(Boolean(response.isConnectedToDesktop));
        updateUI();
      }
    });
  }

  if (chrome.storage?.sync) {
    chrome.storage.sync.get(['wsPort']).then((data) => {
      if (data && typeof data.wsPort === 'number' && wsPortInput) {
        wsPortInput.value = String(data.wsPort);
      }
    }).catch(() => {});
  }
}

// Toggle Settings Drawer
settingsToggleBtn?.addEventListener('click', () => {
  settingsDrawer?.classList.toggle('hidden');
});

// Save Port Settings
saveSettingsBtn?.addEventListener('click', () => {
  if (!wsPortInput) return;
  const port = parseInt(wsPortInput.value, 10);
  if (port >= 1024 && port <= 65535) {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({ wsPort: port }).then(() => {
        settingsDrawer?.classList.add('hidden');
      }).catch(() => {});
    }
  }
});

// Handle Record Button Click
toggleBtn?.addEventListener('click', () => {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;

  const action = isRecording ? 'STOP_RECORDING_REQUEST' : 'START_RECORDING_REQUEST';
  chrome.runtime.sendMessage({ type: action }, (response) => {
    if (response && response.success) {
      isRecording = Boolean(response.isRecording);
      updateUI();
    }
  });
});
