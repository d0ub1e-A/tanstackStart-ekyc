import { describe, it, expect } from 'vitest';
import { normalizeIssueDate } from '../../src/lib/verification/ocr/normalizers';

describe('date normalization', () => {
  it('should parse DD/MM/YYYY', () => {
    expect(normalizeIssueDate('08/11/2023')).toBe('2023-11-08');
    expect(normalizeIssueDate('01/01/2024')).toBe('2024-01-01');
  });

  it('should parse DD-MM-YYYY', () => {
    expect(normalizeIssueDate('08-11-2023')).toBe('2023-11-08');
  });

  it('should parse DD.MM.YYYY', () => {
    expect(normalizeIssueDate('08.11.2023')).toBe('2023-11-08');
  });

  it('should parse DD MM YYYY', () => {
    expect(normalizeIssueDate('08 11 2023')).toBe('2023-11-08');
  });

  it('should parse YYYY/MM/DD', () => {
    expect(normalizeIssueDate('2023/11/08')).toBe('2023-11-08');
  });

  it('should parse DD MMM YYYY', () => {
    expect(normalizeIssueDate('08 Nov 2023')).toBe('2023-11-08');
    expect(normalizeIssueDate('08 November 2023')).toBe('2023-11-08');
    expect(normalizeIssueDate('01 Jan 2024')).toBe('2024-01-01');
    expect(normalizeIssueDate('31 Dec 2023')).toBe('2023-12-31');
  });

  it('should return null for invalid input', () => {
    expect(normalizeIssueDate('invalid')).toBeNull();
    expect(normalizeIssueDate('')).toBeNull();
    expect(normalizeIssueDate('32/13/2023')).toBeNull();
  });
});