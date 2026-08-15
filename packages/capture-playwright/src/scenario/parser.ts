import { parse as parseYaml } from 'yaml';
import { readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { ScenarioDefinition, ScenarioStep } from './scenario-types';

/**
 * Validates a single scenario step
 */
function isValidStep(step: unknown): step is ScenarioStep {
  if (!step || typeof step !== 'object') return false;
  const s = step as Record<string, unknown>;
  const validActions = [
    'goto',
    'wait',
    'click',
    'hover',
    'type',
    'press',
    'scroll',
    'dragAndDrop',
    'uploadFile',
    'assertVisible',
  ];

  if (typeof s.action !== 'string' || !validActions.includes(s.action)) {
    return false;
  }

  switch (s.action) {
    case 'goto':
      return typeof s.url === 'string';
    case 'wait':
      return typeof s.durationMs === 'number' && s.durationMs >= 0;
    case 'click':
    case 'hover':
      return typeof s.selector === 'string';
    case 'type':
      return typeof s.selector === 'string' && typeof s.text === 'string';
    case 'press':
      return typeof s.key === 'string';
    case 'scroll':
      return typeof s.x === 'number' && typeof s.y === 'number';
    case 'dragAndDrop':
      return typeof s.sourceSelector === 'string' && typeof s.targetSelector === 'string';
    case 'uploadFile':
      return (
        typeof s.selector === 'string' &&
        (typeof s.filePaths === 'string' || (Array.isArray(s.filePaths) && s.filePaths.every((f) => typeof f === 'string')))
      );
    case 'assertVisible':
      return typeof s.selector === 'string';
    default:
      return false;
  }
}

/**
 * Parses and validates raw scenario object/text into a typed ScenarioDefinition
 */
export function parseScenarioContent(content: string, format: 'json' | 'yaml' = 'yaml'): ScenarioDefinition {
  let parsed: unknown;
  try {
    if (format === 'json') {
      parsed = JSON.parse(content);
    } else {
      parsed = parseYaml(content);
    }
  } catch (err: unknown) {
    throw new Error(`Failed to parse scenario (${format.toUpperCase()}): ${(err as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid scenario: Root must be an object');
  }

  const p = parsed as Record<string, unknown>;

  if (typeof p.name !== 'string' || p.name.trim() === '') {
    throw new Error('Invalid scenario: "name" is required and must be a non-empty string');
  }

  if (!Array.isArray(p.steps) || p.steps.length === 0) {
    throw new Error('Invalid scenario: "steps" must be a non-empty array of action steps');
  }

  for (let i = 0; i < p.steps.length; i++) {
    if (!isValidStep(p.steps[i])) {
      throw new Error(`Invalid step at index ${i}: ${JSON.stringify(p.steps[i])}`);
    }
  }

  return {
    name: p.name,
    description: typeof p.description === 'string' ? p.description : undefined,
    targetUrl: typeof p.targetUrl === 'string' ? p.targetUrl : undefined,
    viewport: p.viewport && typeof p.viewport === 'object'
      ? {
          width: typeof (p.viewport as Record<string, unknown>).width === 'number' ? (p.viewport as Record<string, unknown>).width as number : 1920,
          height: typeof (p.viewport as Record<string, unknown>).height === 'number' ? (p.viewport as Record<string, unknown>).height as number : 1080,
          devicePixelRatio: typeof (p.viewport as Record<string, unknown>).devicePixelRatio === 'number' ? (p.viewport as Record<string, unknown>).devicePixelRatio as number : 1,
        }
      : { width: 1920, height: 1080, devicePixelRatio: 1 },
    fps: typeof p.fps === 'number' ? p.fps : 60,
    headless: typeof p.headless === 'boolean' ? p.headless : true,
    steps: p.steps as ScenarioStep[],
  };
}

/**
 * Loads and parses a scenario file from disk (.yaml, .yml, or .json)
 */
export function loadScenarioFile(filePath: string): ScenarioDefinition {
  if (!existsSync(filePath)) {
    throw new Error(`Scenario file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();
  const format = ext === '.json' ? 'json' : 'yaml';

  return parseScenarioContent(content, format);
}
