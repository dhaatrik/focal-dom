let isRecording = false;
let startTime = 0;
let timerInterval: any = null;

const toggleBtn = document.getElementById('toggle-record-btn');
const btnText = document.getElementById('btn-text');
const timerDisplay = document.getElementById('recording-timer');
const desktopStatus = document.getElementById('desktop-status');
const statusText = document.getElementById('status-text');

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

// Fetch initial status from background script
if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
  chrome.runtime.sendMessage({ type: 'GET_STATUS_REQUEST' }, (response) => {
    if (response) {
      isRecording = Boolean(response.isRecording);
      updateConnectionStatus(Boolean(response.isConnectedToDesktop));
      updateUI();
    }
  });
}

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
