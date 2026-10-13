import { describe, it, expect } from 'vitest';
import { levenshtein } from '../../src/lib/verification/id-cards/ruet/template';

describe('RUET template detector', () => {
  describe('levenshtein', () => {
    it('should calculate edit distance correctly', () => {
      expect(levenshtein('kitten', 'sitting')).toBe(3);
      expect(levenshtein('flaw', 'lawn')).toBe(2);
      expect(levenshtein('test', 'test')).toBe(0);
      expect(levenshtein('', 'abc')).toBe(3);
      expect(levenshtein('abc', '')).toBe(3);
    });
  });
});