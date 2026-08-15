# Mode A: Chrome Extension Live Recording Guide

This guide walks you through setting up and recording live browser sessions using the **FocalDOM Chrome Extension** and the **Electron Desktop App**.

---

## 1. Installation & Extension Loading

1. Build the extension package from the repository root:
   ```bash
   pnpm --filter @focaldom/extension build
   ```
2. Open Chromium or Google Chrome and navigate to `chrome://extensions/`.
3. Enable the **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** and select the build directory:
   ```
   focal-dom/packages/extension/dist
   ```
5. The **FocalDOM Live Recorder** icon will appear in your browser toolbar.

---

## 2. Starting the Desktop Telemetry Server

Launch the Electron Desktop Application:
```bash
pnpm --filter @focaldom/desktop dev
```
The desktop app starts a local WebSocket telemetry server on `ws://127.0.0.1:48480`.

---

## 3. Recording a Live Session

1. Navigate to the web application you want to record.
2. Click the **FocalDOM** extension icon in your browser toolbar.
3. Verify that the status pill displays **App Connected** (green dot).
4. Click **Start Recording**. A non-intrusive recording badge will appear in the top-right corner of the active tab.
5. Interact with your web page naturally:
   - Clicks, hover states, text inputs, and scroll actions are captured.
   - Sticky and fixed headers are dynamically scanned for viewport deadzone calculations.
6. When finished, click the extension icon and select **Stop Recording**.
7. The recorded session will be imported directly into the FocalDOM Studio timeline editor.
