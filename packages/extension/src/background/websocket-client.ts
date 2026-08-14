import { DOMEventFrame } from '@focaldom/core';

export interface WebSocketClientOptions {
  url?: string;
  reconnectIntervalMs?: number;
}

export class ExtensionWebSocketClient {
  private ws: any = null;
  private url: string;
  private reconnectIntervalMs: number;
  private reconnectTimer: any = null;
  private isConnected = false;
  private pendingQueue: DOMEventFrame[] = [];

  constructor(options: WebSocketClientOptions = {}) {
    this.url = options.url ?? 'ws://127.0.0.1:48480';
    this.reconnectIntervalMs = options.reconnectIntervalMs ?? 2000;
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
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
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
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
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
    this.reconnectTimer = setInterval(() => {
      this.connect();
    }, this.reconnectIntervalMs);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
