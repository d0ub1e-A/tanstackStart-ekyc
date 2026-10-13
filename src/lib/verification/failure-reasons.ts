export const FAILURE_REASONS = {
  INVALID_FILE: {
    title: 'Invalid File',
    message: 'The selected file is not a supported image format.',
  },
  IMAGE_TOO_LARGE: {
    title: 'Image Too Large',
    message:
      'The image exceeds the maximum file size. Please upload a smaller image.',
  },
  IMAGE_TOO_BLURRY: {
    title: 'Image Too Blurry',
    message:
      'The image quality is too low. Please upload a clearer photo of the ID card.',
  },
  CARD_NOT_DETECTED: {
    title: 'Card Not Detected',
    message:
      'Could not locate the ID card boundary. Ensure the card fills most of the frame.',
  },
  OCR_FAILED: {
    title: 'OCR Failed',
    message:
      'Could not read text from the ID card. Try a clearer image with better lighting.',
  },
  FIELD_PARSE_FAILED: {
    title: 'Field Parse Failed',
    message: 'Could not extract all required fields from the ID card.',
  },
  REQUIRED_FIELD_MISSING: {
    title: 'Required Field Missing',
    message: 'One or more required fields could not be found on the ID card.',
  },
  INVALID_ID_NUMBER: {
    title: 'Invalid ID Number',
    message: 'The ID number format is not valid.',
  },
  INVALID_BLOOD_GROUP: {
    title: 'Invalid Blood Group',
    message: 'The blood group information could not be recognized.',
  },
  INVALID_PHONE_NUMBER: {
    title: 'Invalid Phone Number',
    message: 'The contact number format is not valid.',
  },
  INVALID_ISSUE_DATE: {
    title: 'Invalid Issue Date',
    message: 'The issue date could not be parsed.',
  },
  PORTRAIT_NOT_FOUND: {
    title: 'Portrait Not Found',
    message: 'Could not locate a portrait photo on the ID card.',
  },
  PORTRAIT_MULTIPLE_FACES: {
    title: 'Multiple Faces in Portrait',
    message: 'Found multiple faces in the ID portrait region.',
  },
  CAMERA_PERMISSION_DENIED: {
    title: 'Camera Permission Denied',
    message:
      'Camera access is required for identity verification. Please allow camera access in your browser settings.',
  },
  CAMERA_UNAVAILABLE: {
    title: 'Camera Unavailable',
    message:
      'No camera device found or camera is not accessible. Check your camera connection.',
  },
  FACE_NOT_DETECTED: {
    title: 'Face Not Detected',
    message:
      'We cannot see your face clearly. Move closer and position your face inside the frame.',
  },
  MULTIPLE_LIVE_FACES: {
    title: 'Multiple Faces Detected',
    message: 'Only one person should be visible during verification.',
  },
  LIVENESS_FAILED: {
    title: 'Liveness Check Failed',
    message:
      'We could not confirm you are a real person. Try again and follow the instructions carefully.',
  },
  LIVENESS_TIMEOUT: {
    title: 'Liveness Timeout',
    message: 'The liveness check took too long. Please try again.',
  },
  CHALLENGE_FAILED: {
    title: 'Challenge Failed',
    message: 'Could not complete the requested action. Please try again.',
  },
  FACE_MATCH_FAILED: {
    title: 'Face Match Failed',
    message:
      'The live face does not sufficiently match the photo on the ID card.',
  },
  MODEL_LOAD_FAILED: {
    title: 'Model Load Failed',
    message:
      'Could not load the verification model. Check your network or refresh the page.',
  },
  UNKNOWN_ERROR: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
  },
} as const;
