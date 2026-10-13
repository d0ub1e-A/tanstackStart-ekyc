import type { VerificationStatus } from './types';

const TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  IDLE: ['FRONT_UPLOAD'],
  FRONT_UPLOAD: ['BACK_UPLOAD', 'FAILED'],
  BACK_UPLOAD: ['PROCESSING_ID', 'FAILED'],
  PROCESSING_ID: ['OCR_PROCESSING', 'FAILED'],
  OCR_PROCESSING: ['PORTRAIT_EXTRACTION', 'FAILED'],
  PORTRAIT_EXTRACTION: ['REVIEW', 'FAILED'],
  REVIEW: ['CAMERA_PERMISSION', 'FAILED', 'FRONT_UPLOAD'],
  CAMERA_PERMISSION: ['CAMERA_READY', 'FAILED'],
  CAMERA_READY: ['LIVENESS', 'FAILED'],
  LIVENESS: ['FACE_MATCHING', 'FAILED'],
  FACE_MATCHING: ['SAVING_RESULT', 'FAILED'],
  SAVING_RESULT: ['SUCCESS', 'FAILED'],
  SUCCESS: ['IDLE'],
  FAILED: ['FRONT_UPLOAD', 'IDLE'],
};

export function canTransition(
  from: VerificationStatus,
  to: VerificationStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function transition(
  from: VerificationStatus,
  to: VerificationStatus,
): VerificationStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid state transition: ${from} → ${to}`);
  }
  return to;
}

export function isTerminal(status: VerificationStatus): boolean {
  return status === 'SUCCESS' || status === 'FAILED';
}

export function isProcessing(status: VerificationStatus): boolean {
  return [
    'PROCESSING_ID',
    'OCR_PROCESSING',
    'PORTRAIT_EXTRACTION',
    'LIVENESS',
    'FACE_MATCHING',
    'SAVING_RESULT',
  ].includes(status);
}

export function getStepNumber(status: VerificationStatus): number {
  const order: VerificationStatus[] = [
    'FRONT_UPLOAD',
    'BACK_UPLOAD',
    'REVIEW',
    'CAMERA_PERMISSION',
    'LIVENESS',
    'FACE_MATCHING',
  ];
  const idx = order.indexOf(status);
  return idx >= 0 ? idx + 1 : 0;
}
