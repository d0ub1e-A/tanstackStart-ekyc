import type { FaceEngine, FaceDetectionResult } from './face-engine';
import { verificationConfig } from '../config';

interface HumanInstance {
  config: Record<string, unknown>;
  load(): Promise<void>;
  detect(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  ): Promise<{
    face: Array<{
      score?: number;
      boxScore?: number;
      box?: { x: number; y: number; width: number; height: number };
      embedding?: Float32Array | number[];
      rotation?: { angle?: { yaw: number; pitch: number; roll: number } };
      live?: number;
      real?: number;
      annotations?: Record<string, number[][]>;
    }>;
  }>;
  match: {
    distance(d1: number[], d2: number[], opts?: { multiplier: number }): number;
  };
}

let humanInstance: HumanInstance | null = null;

export class HumanEngine implements FaceEngine {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    const { default: human } = await import('@vladmandic/human');
    humanInstance = human as unknown as HumanInstance;

    humanInstance.config = {
      modelBasePath: '/models/human',
      backend: 'webgl',
      face: {
        enabled: true,
        detector: {
          enabled: true,
          modelPath: 'blazeface.json',
          rotation: true,
          maxDetected: 3,
          skipFrames: 2,
          skipTime: 200,
          minConfidence: verificationConfig.faceMinConfidence,
          minSize: verificationConfig.faceMinSize,
        },
        mesh: { enabled: true, modelPath: 'facemesh.json' },
        iris: { enabled: true, modelPath: 'iris.json', scale: 2.3 },
        emotion: { enabled: false },
        description: {
          enabled: true,
          modelPath: 'faceres.json',
          skipFrames: 2,
          skipTime: 500,
          minConfidence: 0.3,
        },
        antispoof: {
          enabled: true,
          modelPath: 'antispoof.json',
          skipFrames: 4,
          skipTime: 1000,
          minConfidence: 0.4,
        },
        liveness: {
          enabled: true,
          modelPath: 'liveness.json',
          skipFrames: 4,
          skipTime: 1000,
          minConfidence: 0.4,
        },
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false },
      filter: { enabled: false },
    };

    await humanInstance.load();
    this.initialized = true;
  }

  async detect(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  ): Promise<FaceDetectionResult> {
    if (!this.initialized) await this.init();
    const result = await humanInstance?.detect(input);
    if (!result) return { faces: [], count: 0 };

    const faces = (result.face || []).map((face, index: number) => {
      const embedding = face.embedding ? Array.from(face.embedding) : undefined;
      const yaw = face.rotation?.angle?.yaw ?? 0;
      const pitch = face.rotation?.angle?.pitch ?? 0;
      const roll = face.rotation?.angle?.roll ?? 0;

      let eyeLandmarks:
        | { leftEye: number[][]; rightEye: number[][] }
        | undefined;
      const ann = face.annotations as Record<string, number[][]> | undefined;
      if (ann) {
        const leftEyePoints = (ann.leftEyeUpper0 || []).concat(
          ann.leftEyeUpper1 || [],
          ann.leftEyeLower0 || [],
          ann.leftEyeLower1 || [],
        );
        const rightEyePoints = (ann.rightEyeUpper0 || []).concat(
          ann.rightEyeUpper1 || [],
          ann.rightEyeLower0 || [],
          ann.rightEyeLower1 || [],
        );
        if (leftEyePoints.length && rightEyePoints.length) {
          eyeLandmarks = { leftEye: leftEyePoints, rightEye: rightEyePoints };
        }
      }

      return {
        id: index,
        score: face.score || face.boxScore || 0,
        box: {
          x: face.box?.x || 0,
          y: face.box?.y || 0,
          width: face.box?.width || 0,
          height: face.box?.height || 0,
        },
        yaw,
        pitch,
        roll,
        embedding,
        liveness: face.live,
        real: face.real,
        eyeLandmarks,
      };
    });

    return { faces, count: faces.length };
  }

  getDescriptor(face: FaceDetectionResult['faces'][0]): number[] | null {
    return face.embedding ?? null;
  }

  match(
    descriptor1: number[],
    descriptor2: number[],
  ): { distance: number; similarity: number } {
    if (!humanInstance) throw new Error('Human not initialized');
    const distance = humanInstance.match.distance(descriptor1, descriptor2, {
      multiplier: 20,
    });
    const similarity = 1 / (1 + distance);
    return { distance, similarity };
  }

  async terminate(): Promise<void> {
    this.initialized = false;
  }
}

export function createHumanEngine(): HumanEngine {
  return new HumanEngine();
}
