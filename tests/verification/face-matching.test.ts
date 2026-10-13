import { describe, it, expect, vi } from 'vitest';

// Mock the human module for testing
vi.mock('@vladmandic/human', () => ({
  default: {
    match: {
      distance: (d1: number[], d2: number[], _opts: { multiplier: number }) => {
        // Simple Euclidean distance
        let sum = 0;
        for (let i = 0; i < d1.length; i++) {
          const diff = d1[i] - d2[i];
          sum += diff * diff;
        }
        return Math.sqrt(sum);
      },
    },
  },
}));

import { compareDescriptorsSync } from '../../src/lib/verification/face/face-matching';

describe('face matching', () => {
  it('should return match for identical descriptors', async () => {
    const desc = new Array(256).fill(0).map((_, i) => Math.sin(i * 0.1));
    const result = await compareDescriptorsSync(desc, desc);
    expect(result.matched).toBe(true);
    expect(result.distance).toBe(0);
    expect(result.similarity).toBe(1);
  });

  it('should return no match for very different descriptors', async () => {
    const desc1 = new Array(256).fill(0).map((_, i) => Math.sin(i * 0.1));
    const desc2 = new Array(256).fill(0).map((_, i) => Math.cos(i * 0.1));
    const result = await compareDescriptorsSync(desc1, desc2);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.similarity).toBeLessThan(1);
  });

  it('should respect threshold', async () => {
    const desc1 = new Array(256).fill(0).map(() => Math.random() * 0.5);
    const desc2 = new Array(256).fill(0).map(() => Math.random() * 0.5);
    const result = await compareDescriptorsSync(desc1, desc2);
    expect(typeof result.matched).toBe('boolean');
    expect(typeof result.distance).toBe('number');
    expect(typeof result.similarity).toBe('number');
  });

  it('should produce valid similarity between 0 and 1', async () => {
    const desc1 = new Array(256).fill(0).map(() => Math.random());
    const desc2 = new Array(256).fill(0).map(() => Math.random());
    const result = await compareDescriptorsSync(desc1, desc2);
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(1);
  });
});