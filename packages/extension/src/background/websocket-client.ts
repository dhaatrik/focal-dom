import { DOMEventFrame } from '@focaldom/core';

export interface WebSocketClientOptions {
  url?: string;
  port?: number;
}

export class ExtensionWebSocketClient {
  private ws: any = null;
  private url: string;
  private reconnectTimer: any = null;
  private isConnected = false;
  private pendingQueue: DOMEventFrame[] = [];
  public reconnectAttempts = 0;

  constructor(options: WebSocketClientOptions = {}) {
    const port = options.port ?? 48480;
    this.url = options.url ?? `ws://127.0.0.1:${port}`;

    // Load custom port from extension storage if available
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(['wsPort']).then((data) => {
        if (data && typeof data.wsPort === 'number') {
          this.setPort(data.wsPort);
        }
      }).catch(() => {});
    }
  }

  public setPort(port: number): void {
    this.url = `ws://127.0.0.1:${port}`;
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  public calculateReconnectDelay(): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponential = Math.min(maxDelay, baseDelay * Math.pow(1.5, this.reconnectAttempts));
    const jitter = Math.random() * 500;
    return exponential + jitter;
  }

  /**
   * Connects to the FocalDOM desktop telemetry server.
   */
  connect(): void {
    if (this.isConnected && this.ws) return;

    try {
      const WebSocketImpl = typeof WebSocket !== 'undefined' ? WebSocket : (globalThis as any).WebSocket;
      if (!WebSocketImpl) return;

      this.ws = new WebSocketImpl(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.flushQueue();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnects from the server and cancels reconnection.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Sends a DOM event frame over the WebSocket.
   */
  sendFrame(frame: DOMEventFrame): void {
    if (this.isConnected && this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(frame));
    } else {
      this.pendingQueue.push(frame);
      if (this.pendingQueue.length > 500) {
        this.pendingQueue.shift(); // Drop oldest if buffer overflows
      }
      this.connect();
    }
  }

  private flushQueue(): void {
    while (this.pendingQueue.length > 0 && this.isConnected && this.ws) {
      const frame = this.pendingQueue.shift();
      if (frame) {
        this.ws.send(JSON.stringify(frame));
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = this.calculateReconnectDelay();
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
