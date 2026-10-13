import type { FaceDetectionResult, LivenessChallenge } from '../types';
import { verificationConfig } from '../config';

export interface LivenessState {
  challenges: LivenessChallenge[];
  currentIndex: number;
  completed: boolean;
  failed: boolean;
  frameHistory: { yaw: number; ear: number; timestamp: number }[];
  consecutiveValid: number;
  challengeStartTime: number;
}

export function createLivenessSession(): LivenessState {
  const challenges: LivenessChallenge[] = ['TURN_LEFT', 'TURN_RIGHT', 'BLINK'];
  const shuffled = [...challenges].sort(() => Math.random() - 0.5);
  return {
    challenges: shuffled,
    currentIndex: 0,
    completed: false,
    failed: false,
    frameHistory: [],
    consecutiveValid: 0,
    challengeStartTime: Date.now(),
  };
}

export function getCurrentChallenge(
  state: LivenessState,
): LivenessChallenge | null {
  if (state.currentIndex >= state.challenges.length) return null;
  return state.challenges[state.currentIndex];
}

function calculateEAR(eyeLandmarks: Record<string, number[][]>): number {
  const left = eyeLandmarks.leftEye || [];
  const right = eyeLandmarks.rightEye || [];
  if (!left.length || !right.length) return 1;

  function eyeAspectRatio(points: number[][]): number {
    if (points.length < 6) return 0.3;
    const p1 = points[0],
      p2 = points[1],
      p3 = points[2],
      p4 = points[3],
      p5 = points[4],
      p6 = points[5];
    const vertical1 = Math.hypot(p2[0] - p6[0], p2[1] - p6[1]);
    const vertical2 = Math.hypot(p3[0] - p5[0], p3[1] - p5[1]);
    const horizontal = Math.hypot(p1[0] - p4[0], p1[1] - p4[1]);
    return (vertical1 + vertical2) / (2 * horizontal);
  }
  return (eyeAspectRatio(left) + eyeAspectRatio(right)) / 2;
}

export function updateLivenessState(
  state: LivenessState,
  result: FaceDetectionResult,
): { state: LivenessState; challengeComplete: boolean; failed: boolean } {
  if (result.count === 0 || result.count > 1) {
    return { state, challengeComplete: false, failed: false };
  }

  const face = result.faces[0];
  const ear = face.eyeLandmarks ? calculateEAR(face.eyeLandmarks) : 0.3;
  const yaw = face.yaw;

  const now = Date.now();
  state.frameHistory.push({ yaw, ear, timestamp: now });

  const windowMs = 2000;
  state.frameHistory = state.frameHistory.filter(
    (f) => now - f.timestamp < windowMs,
  );

  const challenge = getCurrentChallenge(state);
  if (!challenge) return { state, challengeComplete: true, failed: false };

  let validFrame = false;
  if (challenge === 'TURN_LEFT') {
    validFrame = yaw < verificationConfig.leftYawThreshold;
  } else if (challenge === 'TURN_RIGHT') {
    validFrame = yaw > verificationConfig.rightYawThreshold;
  } else if (challenge === 'BLINK') {
    const recent = state.frameHistory.slice(-10);
    const hadOpen = recent.some((f) => f.ear > 0.25);
    const hadClosed = recent.some((f) => f.ear < 0.18);
    validFrame = hadOpen && hadClosed && recent.length >= 5;
  }

  if (validFrame) {
    state.consecutiveValid++;
    if (state.consecutiveValid >= verificationConfig.consecutiveValidFrames) {
      state.currentIndex++;
      state.consecutiveValid = 0;
      state.challengeStartTime = Date.now();
      getCurrentChallenge(state);
      return {
        state,
        challengeComplete: true,
        failed: false,
      };
    }
  } else {
    state.consecutiveValid = 0;
  }

  if (now - state.challengeStartTime > verificationConfig.livenessTimeoutMs) {
    state.failed = true;
    return { state, challengeComplete: false, failed: true };
  }

  return { state, challengeComplete: false, failed: state.failed };
}

export function evaluateAntiSpoof(result: FaceDetectionResult): boolean {
  if (result.count !== 1) return false;
  const face = result.faces[0];
  if (
    face.real !== undefined &&
    face.real < verificationConfig.antiSpoofMinConfidence
  )
    return false;
  if (
    face.liveness !== undefined &&
    face.liveness < verificationConfig.livenessMinConfidence
  )
    return false;
  return true;
}
