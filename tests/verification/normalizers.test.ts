import { describe, it, expect } from 'vitest';
import {
  normalizeBloodGroup,
  normalizePhoneNumber,
  normalizeIdNumber,
  normalizeName,
  normalizeDepartment,
  normalizeIssueDate,
} from '../../src/lib/verification/ocr/normalizers';

describe('normalizers', () => {
  describe('normalizeBloodGroup', () => {
    it('should normalize standard blood groups', () => {
      expect(normalizeBloodGroup('O+')).toBe('O+');
      expect(normalizeBloodGroup('O-')).toBe('O-');
      expect(normalizeBloodGroup('A+')).toBe('A+');
      expect(normalizeBloodGroup('B+')).toBe('B+');
      expect(normalizeBloodGroup('AB+')).toBe('AB+');
    });

    it('should normalize written variants', () => {
      expect(normalizeBloodGroup('O positive')).toBe('O+');
      expect(normalizeBloodGroup('O negative')).toBe('O-');
      expect(normalizeBloodGroup('A positive')).toBe('A+');
      expect(normalizeBloodGroup('B negative')).toBe('B-');
      expect(normalizeBloodGroup('AB positive')).toBe('AB+');
    });

    it('should handle case insensitive input', () => {
      expect(normalizeBloodGroup('o+')).toBe('O+');
      expect(normalizeBloodGroup('O POSITIVE')).toBe('O+');
    });

    it('should return null for invalid blood groups', () => {
      expect(normalizeBloodGroup('XYZ')).toBeNull();
      expect(normalizeBloodGroup('')).toBeNull();
    });
  });

  describe('normalizePhoneNumber', () => {
    it('should normalize Bangladesh mobile numbers', () => {
      expect(normalizePhoneNumber('01712345678')).toBe('+8801712345678');
      expect(normalizePhoneNumber('+8801712345678')).toBe('+8801712345678');
      expect(normalizePhoneNumber('8801712345678')).toBe('+8801712345678');
      expect(normalizePhoneNumber('008801712345678')).toBe('+8801712345678');
    });

    it('should handle numbers with spaces and dashes', () => {
      expect(normalizePhoneNumber('01712-345678')).toBe('+8801712345678');
      expect(normalizePhoneNumber('01712 345 678')).toBe('+8801712345678');
    });

    it('should return null for invalid numbers', () => {
      expect(normalizePhoneNumber('123')).toBeNull();
      expect(normalizePhoneNumber('')).toBeNull();
    });
  });

  describe('normalizeIdNumber', () => {
    it('should remove non-alphanumeric characters except dash', () => {
      expect(normalizeIdNumber('22-10022')).toBe('22-10022');
      expect(normalizeIdNumber(' 22 10022 ')).toBe('2210022');
      expect(normalizeIdNumber('TEST-2210022')).toBe('TEST-2210022');
    });
  });

  describe('normalizeName', () => {
    it('should clean and normalize names', () => {
      expect(normalizeName('  John  Doe  ')).toBe('John Doe');
      expect(normalizeName('John-Doe')).toBe('John-Doe');
      expect(normalizeName("O'Connor")).toBe("O'Connor");
      expect(normalizeName('John123')).toBe('John');
    });
  });

  describe('normalizeDepartment', () => {
    it('should clean and normalize department names', () => {
      expect(normalizeDepartment('  Computer Science  ')).toBe('Computer Science');
      expect(normalizeDepartment('Dept. of CSE')).toBe('Dept. of CSE');
    });
  });

  describe('normalizeIssueDate', () => {
    it('should parse DD/MM/YYYY format', () => {
      expect(normalizeIssueDate('08/11/2023')).toBe('2023-11-08');
      expect(normalizeIssueDate('08-11-2023')).toBe('2023-11-08');
      expect(normalizeIssueDate('08.11.2023')).toBe('2023-11-08');
      expect(normalizeIssueDate('08 11 2023')).toBe('2023-11-08');
    });

    it('should parse YYYY/MM/DD format', () => {
      expect(normalizeIssueDate('2023/11/08')).toBe('2023-11-08');
    });

    it('should parse DD MMM YYYY format', () => {
      expect(normalizeIssueDate('08 Nov 2023')).toBe('2023-11-08');
      expect(normalizeIssueDate('08 November 2023')).toBe('2023-11-08');
    });

    it('should return null for invalid dates', () => {
      expect(normalizeIssueDate('invalid')).toBeNull();
      expect(normalizeIssueDate('')).toBeNull();
    });
  });
});