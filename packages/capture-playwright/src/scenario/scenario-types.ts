export type ScenarioStep =
  | { action: 'goto'; url: string; timeoutMs?: number }
  | { action: 'wait'; durationMs: number }
  | { action: 'click'; selector: string; delayAfterMs?: number }
  | { action: 'hover'; selector: string; delayAfterMs?: number }
  | { action: 'type'; selector: string; text: string; delayMs?: number }
  | { action: 'press'; key: string; delayAfterMs?: number }
  | { action: 'scroll'; x: number; y: number; delayAfterMs?: number }
  | { action: 'dragAndDrop'; sourceSelector: string; targetSelector: string; durationMs?: number; delayAfterMs?: number }
  | { action: 'uploadFile'; selector: string; filePaths: string | string[]; delayAfterMs?: number }
  | { action: 'assertVisible'; selector: string; timeoutMs?: number };

export interface ScenarioDefinition {
  name: string;
  description?: string;
  targetUrl?: string;
  viewport?: {
    width: number;
    height: number;
    devicePixelRatio?: number;
  };
  fps?: number; // Default 60
  headless?: boolean; // Default true
  steps: ScenarioStep[];
}
