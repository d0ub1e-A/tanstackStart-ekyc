import { describe, it, expect } from 'vitest';
import {
  canTransition,
  isTerminal,
  isProcessing,
  getStepNumber,
  transition,
} from '../../src/lib/verification/state-machine';

describe('state machine', () => {
  describe('canTransition', () => {
    it('should allow valid transitions', () => {
      expect(canTransition('IDLE', 'FRONT_UPLOAD')).toBe(true);
      expect(canTransition('FRONT_UPLOAD', 'BACK_UPLOAD')).toBe(true);
      expect(canTransition('BACK_UPLOAD', 'PROCESSING_ID')).toBe(true);
      expect(canTransition('REVIEW', 'CAMERA_PERMISSION')).toBe(true);
      expect(canTransition('CAMERA_PERMISSION', 'CAMERA_READY')).toBe(true);
      expect(canTransition('LIVENESS', 'FACE_MATCHING')).toBe(true);
      expect(canTransition('SAVING_RESULT', 'SUCCESS')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(canTransition('IDLE', 'BACK_UPLOAD')).toBe(false);
      expect(canTransition('FRONT_UPLOAD', 'REVIEW')).toBe(false);
      expect(canTransition('SUCCESS', 'FAILED')).toBe(false);
      expect(canTransition('FAILED', 'SUCCESS')).toBe(false);
    });

    it('should allow retry from FAILED', () => {
      expect(canTransition('FAILED', 'FRONT_UPLOAD')).toBe(true);
      expect(canTransition('FAILED', 'IDLE')).toBe(true);
    });
  });

  describe('isTerminal', () => {
    it('should identify terminal states', () => {
      expect(isTerminal('SUCCESS')).toBe(true);
      expect(isTerminal('FAILED')).toBe(true);
    });

    it('should not identify non-terminal states', () => {
      expect(isTerminal('IDLE')).toBe(false);
      expect(isTerminal('FRONT_UPLOAD')).toBe(false);
      expect(isTerminal('LIVENESS')).toBe(false);
    });
  });

  describe('isProcessing', () => {
    it('should identify processing states', () => {
      expect(isProcessing('PROCESSING_ID')).toBe(true);
      expect(isProcessing('OCR_PROCESSING')).toBe(true);
      expect(isProcessing('LIVENESS')).toBe(true);
      expect(isProcessing('FACE_MATCHING')).toBe(true);
    });

    it('should not identify non-processing states', () => {
      expect(isProcessing('IDLE')).toBe(false);
      expect(isProcessing('FRONT_UPLOAD')).toBe(false);
      expect(isProcessing('SUCCESS')).toBe(false);
    });
  });

  describe('getStepNumber', () => {
    it('should return correct step numbers', () => {
      expect(getStepNumber('FRONT_UPLOAD')).toBe(1);
      expect(getStepNumber('BACK_UPLOAD')).toBe(2);
      expect(getStepNumber('REVIEW')).toBe(3);
      expect(getStepNumber('CAMERA_PERMISSION')).toBe(4);
      expect(getStepNumber('LIVENESS')).toBe(5);
      expect(getStepNumber('FACE_MATCHING')).toBe(6);
    });

    it('should return 0 for unknown states', () => {
      expect(getStepNumber('IDLE')).toBe(0);
      expect(getStepNumber('SUCCESS')).toBe(0);
    });
  });

  describe('transition', () => {
    it('should return new state for valid transitions', () => {
      expect(transition('IDLE', 'FRONT_UPLOAD')).toBe('FRONT_UPLOAD');
    });

    it('should throw for invalid transitions', () => {
      expect(() => transition('IDLE', 'BACK_UPLOAD')).toThrow('Invalid state transition');
    });
  });
});