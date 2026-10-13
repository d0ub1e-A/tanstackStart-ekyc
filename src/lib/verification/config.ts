export const verificationConfig = {
  faceMatchThreshold: Number(import.meta.env.VITE_FACE_MATCH_THRESHOLD) || 0.45,
  maxUploadSizeMB: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB) || 15,
  maxAttempts: Number(import.meta.env.VITE_VERIFICATION_MAX_ATTEMPTS) || 3,
  livenessTimeoutMs:
    Number(import.meta.env.VITE_LIVENESS_CHALLENGE_TIMEOUT_MS) || 30000,
  challengeSequenceLength: 3,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  minImageWidth: 300,
  minImageHeight: 200,
  faceMinConfidence: 0.35,
  faceMinSize: 48,
  leftYawThreshold: -28,
  rightYawThreshold: 28,
  neutralYawThreshold: 8,
  consecutiveValidFrames: 6,
  yawDwellTimeMs: 400,
  challengeFrameIntervalMs: 100,
  antiSpoofMinConfidence: 0.7,
  livenessMinConfidence: 0.5,
  portraitMargin: 0.2,
} as const;

export const FAILURE_MESSAGES: Record<string, string> = {
  INVALID_FILE: 'The selected file is not a supported image format.',
  IMAGE_TOO_LARGE:
    'The image exceeds the maximum file size. Please upload a smaller image.',
  IMAGE_TOO_BLURRY:
    'The image quality is too low. Please upload a clearer photo of the ID card.',
  CARD_NOT_DETECTED:
    'Could not locate the ID card boundary. Ensure the card fills most of the frame.',
  OCR_FAILED:
    'Could not read text from the ID card. Try a clearer image with better lighting.',
  FIELD_PARSE_FAILED: 'Could not extract all required fields from the ID card.',
  REQUIRED_FIELD_MISSING:
    'One or more required fields could not be found on the ID card.',
  INVALID_ID_NUMBER: 'The ID number format is not valid.',
  INVALID_BLOOD_GROUP: 'The blood group information could not be recognized.',
  INVALID_PHONE_NUMBER: 'The contact number format is not valid.',
  INVALID_ISSUE_DATE: 'The issue date could not be parsed.',
  PORTRAIT_NOT_FOUND: 'Could not locate a portrait photo on the ID card.',
  PORTRAIT_MULTIPLE_FACES: 'Found multiple faces in the ID portrait region.',
  CAMERA_PERMISSION_DENIED:
    'Camera access is required for identity verification.',
  CAMERA_UNAVAILABLE: 'No camera device found or camera is not accessible.',
  FACE_NOT_DETECTED:
    'We cannot see your face clearly. Move closer and position your face inside the frame.',
  MULTIPLE_LIVE_FACES: 'Only one person should be visible during verification.',
  LIVENESS_FAILED:
    'We could not confirm you are a real person. Try again and follow the instructions carefully.',
  LIVENESS_TIMEOUT: 'The liveness check took too long. Please try again.',
  CHALLENGE_FAILED:
    'Could not complete the requested action. Please try again.',
  FACE_MATCH_FAILED:
    'The live face does not sufficiently match the photo on the ID card.',
  MODEL_LOAD_FAILED:
    'Could not load the verification model. Check your network or refresh the page.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

export const CHALLENGE_LABELS: Record<string, string> = {
  TURN_LEFT: 'Turn your head to the left',
  TURN_RIGHT: 'Turn your head to the right',
  BLINK: 'Blink once',
} as const;

export const STAGE_LABELS: Record<string, string> = {
  IDLE: 'Getting started',
  FRONT_UPLOAD: 'Upload ID front',
  BACK_UPLOAD: 'Upload ID back',
  PROCESSING_ID: 'Preparing ID image...',
  OCR_PROCESSING: 'Reading ID...',
  PORTRAIT_EXTRACTION: 'Finding ID portrait...',
  REVIEW: 'Review extracted information',
  CAMERA_PERMISSION: 'Prepare camera',
  CAMERA_READY: 'Camera ready',
  LIVENESS: 'Checking liveness...',
  FACE_MATCHING: 'Comparing faces...',
  SAVING_RESULT: 'Saving verification result...',
  SUCCESS: 'Verification complete',
  FAILED: 'Verification failed',
};
