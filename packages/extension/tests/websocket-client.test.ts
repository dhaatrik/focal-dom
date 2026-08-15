import { describe, it, expect, afterEach } from 'vitest';
import { WebSocketServer } from 'ws';
import { ExtensionWebSocketClient } from '../src/background/websocket-client';
import { DOMEventFrame } from '@focaldom/core';

describe('ExtensionWebSocketClient (Telemetry Streamer)', () => {
  let wss: WebSocketServer | null = null;
  let client: ExtensionWebSocketClient | null = null;
  const testPort = 48512;

  afterEach(async () => {
    if (client) {
      client.disconnect();
      client = null;
    }
    if (wss) {
      await new Promise<void>((resolve) => wss?.close(() => resolve()));
      wss = null;
    }
  });

  it('buffers frames when offline and flushes upon connection', async () => {
    client = new ExtensionWebSocketClient({ url: `ws://127.0.0.1:${testPort}` });

    const mockFrame: DOMEventFrame = {
      frameIndex: 0,
      timestamp: 100,
      eventType: 'click',
      cursor: { x: 120, y: 340 },
      viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
      scrollOffset: { x: 0, y: 0 },
      activeStickyRegions: [],
    };

    // Send while server is offline -> should buffer
    client.sendFrame(mockFrame);
    expect(client.connected).toBe(false);

    // Spin up server
    const receivedFrames: DOMEventFrame[] = [];
    wss = new WebSocketServer({ port: testPort, host: '127.0.0.1' });

    const receivePromise = new Promise<void>((resolve) => {
      wss?.on('connection', (ws) => {
        ws.on('message', (msg) => {
          const parsed = JSON.parse(msg.toString('utf-8'));
          receivedFrames.push(parsed);
          resolve();
        });
      });
    });

    // Connect client
    client.connect();

    await receivePromise;
    expect(receivedFrames.length).toBe(1);
    expect(receivedFrames[0].eventType).toBe('click');
    expect(receivedFrames[0].cursor.x).toBe(120);
  });

  it('calculates jittered exponential backoff delays properly', () => {
    client = new ExtensionWebSocketClient();
    client.reconnectAttempts = 0;
    const delay0 = client.calculateReconnectDelay();
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThanOrEqual(1600);

    client.reconnectAttempts = 4;
    const delay4 = client.calculateReconnectDelay();
    expect(delay4).toBeGreaterThan(delay0);
  });
});
