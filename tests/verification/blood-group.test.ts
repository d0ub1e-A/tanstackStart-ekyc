import { describe, it, expect } from 'vitest';
import { normalizeBloodGroup } from '../../src/lib/verification/ocr/normalizers';

describe('blood group normalization', () => {
  it('should normalize standard notation', () => {
    expect(normalizeBloodGroup('O+')).toBe('O+');
    expect(normalizeBloodGroup('O-')).toBe('O-');
    expect(normalizeBloodGroup('A+')).toBe('A+');
    expect(normalizeBloodGroup('A-')).toBe('A-');
    expect(normalizeBloodGroup('B+')).toBe('B+');
    expect(normalizeBloodGroup('B-')).toBe('B-');
    expect(normalizeBloodGroup('AB+')).toBe('AB+');
    expect(normalizeBloodGroup('AB-')).toBe('AB-');
  });

  it('should normalize written variants', () => {
    expect(normalizeBloodGroup('O positive')).toBe('O+');
    expect(normalizeBloodGroup('O negative')).toBe('O-');
    expect(normalizeBloodGroup('A positive')).toBe('A+');
    expect(normalizeBloodGroup('B negative')).toBe('B-');
    expect(normalizeBloodGroup('AB positive')).toBe('AB+');
    expect(normalizeBloodGroup('AB negative')).toBe('AB-');
  });

  it('should handle case variations', () => {
    expect(normalizeBloodGroup('o+')).toBe('O+');
    expect(normalizeBloodGroup('O POSITIVE')).toBe('O+');
    expect(normalizeBloodGroup('a+')).toBe('A+');
    expect(normalizeBloodGroup('AB POSITIVE')).toBe('AB+');
  });

  it('should return null for invalid groups', () => {
    expect(normalizeBloodGroup('XYZ')).toBeNull();
    expect(normalizeBloodGroup('O++')).toBeNull();
    expect(normalizeBloodGroup('')).toBeNull();
    expect(normalizeBloodGroup('O')).toBe('O+');
  });
});