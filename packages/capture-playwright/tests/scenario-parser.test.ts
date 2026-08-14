import { describe, it, expect } from 'vitest';
import { parseScenarioContent } from '../src/scenario/parser';

describe('Scenario Definition Parser', () => {
  it('parses valid YAML scenario with steps and viewport', () => {
    const yamlContent = `
name: "Product Tour"
description: "Walkthrough of core landing features"
viewport:
  width: 1920
  height: 1080
fps: 60
headless: true
steps:
  - action: goto
    url: "https://example.com"
  - action: wait
    durationMs: 500
  - action: click
    selector: "#get-started-btn"
  - action: type
    selector: "#email-input"
    text: "test@example.com"
  - action: scroll
    x: 0
    y: 400
`;

    const scenario = parseScenarioContent(yamlContent, 'yaml');
    expect(scenario.name).toBe('Product Tour');
    expect(scenario.fps).toBe(60);
    expect(scenario.viewport?.width).toBe(1920);
    expect(scenario.steps.length).toBe(5);
    expect(scenario.steps[0]).toEqual({ action: 'goto', url: 'https://example.com' });
    expect(scenario.steps[2]).toEqual({ action: 'click', selector: '#get-started-btn' });
  });

  it('parses valid JSON scenario', () => {
    const jsonContent = JSON.stringify({
      name: 'JSON Test Flow',
      steps: [
        { action: 'goto', url: 'https://example.com' },
        { action: 'wait', durationMs: 1000 },
      ],
    });

    const scenario = parseScenarioContent(jsonContent, 'json');
    expect(scenario.name).toBe('JSON Test Flow');
    expect(scenario.steps.length).toBe(2);
  });

  it('throws descriptive error on missing required fields', () => {
    expect(() => parseScenarioContent('steps: []', 'yaml')).toThrow(
      'Invalid scenario: "name" is required'
    );

    expect(() =>
      parseScenarioContent(
        `
name: "Broken Step Flow"
steps:
  - action: unknownAction
`,
        'yaml'
      )
    ).toThrow('Invalid step at index 0');
  });
});
