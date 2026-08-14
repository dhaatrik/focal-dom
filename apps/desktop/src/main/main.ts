import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc-handlers';
import { DesktopTelemetryServer } from './telemetry-server';

// Configure hardware acceleration and GPU switches
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

let mainWindow: BrowserWindow | null = null;
let telemetryServer: DesktopTelemetryServer | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090d16',
    title: 'FocalDOM Studio',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Start local WebSocket telemetry server for Chrome Extension (Mode A)
  telemetryServer = new DesktopTelemetryServer({ port: 48480 });
  await telemetryServer.start().catch((err) => {
    console.error('Failed to start telemetry server:', err);
  });

  // Register main process IPC handlers
  registerIpcHandlers(mainWindow, telemetryServer);

  // Load URL or static file
  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production, load bundled studio HTML or fallback
    const studioHtmlPath = path.join(__dirname, '../../studio/dist/index.html');
    mainWindow.loadFile(studioHtmlPath).catch(() => {
      // Fallback placeholder during tests
      mainWindow?.loadURL('data:text/html,<html><body style="background:#090d16;color:white;"><h1>FocalDOM Desktop</h1></body></html>');
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (telemetryServer) {
    await telemetryServer.stop();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
