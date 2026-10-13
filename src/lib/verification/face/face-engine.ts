export interface FaceEngine {
  init(): Promise<void>;
  detect(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  ): Promise<FaceDetectionResult>;
  getDescriptor(face: FaceDetectionResult['faces'][0]): number[] | null;
  match(
    descriptor1: number[],
    descriptor2: number[],
  ): { distance: number; similarity: number };
  terminate(): Promise<void>;
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
    eyeLandmarks?: { leftEye: number[][]; rightEye: number[][] };
  }[];
  count: number;
}
