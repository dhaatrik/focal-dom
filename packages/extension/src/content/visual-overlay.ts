export class RecordingOverlay {
  private container: HTMLDivElement | null = null;
  private timerInterval: any = null;
  private startTime = 0;

  show(): void {
    if (this.container || typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'focaldom-recording-badge';
    this.container.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(239, 68, 68, 0.4);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      padding: 6px 12px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #f8fafc;
      pointer-events: none;
      user-select: none;
      transition: all 0.2s ease;
    `;

    const dot = document.createElement('span');
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      background-color: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 8px #ef4444;
      animation: focaldom-pulse 1.5s infinite;
    `;

    const text = document.createElement('span');
    text.id = 'focaldom-badge-text';
    text.textContent = 'REC 00:00';

    this.container.appendChild(dot);
    this.container.appendChild(text);
    document.body.appendChild(this.container);

    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      const badgeText = document.getElementById('focaldom-badge-text');
      if (badgeText) {
        badgeText.textContent = `REC ${mins}:${secs}`;
      }
    }, 1000);
  }

  hide(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}
