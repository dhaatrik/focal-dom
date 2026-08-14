import { describe, it, expect } from 'vitest';
import { FOCALDOM_VERSION } from '../src/index';

describe('@focaldom/core foundation', () => {
  it('exports valid version string', () => {
    expect(FOCALDOM_VERSION).toBe('0.1.0');
  });
});
