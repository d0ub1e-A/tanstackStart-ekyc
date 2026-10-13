import type { z } from 'zod';
import type { ParsedIdSchema, ParsedBackSchema } from './schemas';

export type ParsedIdFields = z.infer<typeof ParsedIdSchema>;
export type ParsedBackFields = z.infer<typeof ParsedBackSchema>;

export type LivenessChallenge = 'TURN_LEFT' | 'TURN_RIGHT' | 'BLINK';

export type VerificationStatus =
  | 'IDLE'
  | 'FRONT_UPLOAD'
  | 'BACK_UPLOAD'
  | 'PROCESSING_ID'
  | 'OCR_PROCESSING'
  | 'PORTRAIT_EXTRACTION'
  | 'REVIEW'
  | 'CAMERA_PERMISSION'
  | 'CAMERA_READY'
  | 'LIVENESS'
  | 'FACE_MATCHING'
  | 'SAVING_RESULT'
  | 'SUCCESS'
  | 'FAILED';

export type FailureReason =
  | 'INVALID_FILE'
  | 'IMAGE_TOO_LARGE'
  | 'IMAGE_TOO_BLURRY'
  | 'CARD_NOT_DETECTED'
  | 'OCR_FAILED'
  | 'FIELD_PARSE_FAILED'
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_ID_NUMBER'
  | 'INVALID_BLOOD_GROUP'
  | 'INVALID_PHONE_NUMBER'
  | 'INVALID_ISSUE_DATE'
  | 'PORTRAIT_NOT_FOUND'
  | 'PORTRAIT_MULTIPLE_FACES'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_LIVE_FACES'
  | 'LIVENESS_FAILED'
  | 'LIVENESS_TIMEOUT'
  | 'CHALLENGE_FAILED'
  | 'FACE_MATCH_FAILED'
  | 'MODEL_LOAD_FAILED'
  | 'UNKNOWN_ERROR';

export interface FieldConfidence {
  field: string;
  value: string;
  confidence: number;
}

export interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}

export interface OcrLine {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  words: OcrWord[];
  confidence: number;
}

export interface OcrDocument {
  text: string;
  lines: OcrLine[];
  words: OcrWord[];
  confidence: number;
}

export interface ProcessedDocument {
  imageData: ImageData;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  cardCorners?: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
}

export interface PortraitExtractionResult {
  imageData: ImageData;
  width: number;
  height: number;
  faceDetected: boolean;
  confidence: number;
}

export interface FaceMatchResult {
  matched: boolean;
  distance: number;
  similarity: number | null;
}

export interface FaceDescriptor {
  descriptor: number[];
}

export interface FaceDetectionResult {
  faces: {
    id: number;
    score: number;
    box: { x: number; y: number; width: number; height: number };
    yaw: number;
    pitch: number;
    roll: number;
    embedding?: number[];
    liveness?: number;
    real?: number;
    eyeLandmarks?: Record<string, number[][]>;
  }[];
  count: number;
}

export interface LivenessSession {
  challenges: LivenessChallenge[];
  currentIndex: number;
  startedAt: number;
  completed: boolean;
  failed: boolean;
}

export interface VerificationState {
  status: VerificationStatus;
  parsedFields?: ParsedIdFields & ParsedBackFields;
  fieldConfidences?: FieldConfidence[];
  portrait?: PortraitExtractionResult;
  failureReason?: FailureReason;
  failureDetail?: string;
  faceMatch?: FaceMatchResult;
  livenessPassed?: boolean;
}
