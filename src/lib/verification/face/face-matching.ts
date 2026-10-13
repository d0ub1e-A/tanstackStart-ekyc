import type { FaceMatchResult, FaceDescriptor } from '../types';
import { createHumanEngine } from './human-engine';
import { verificationConfig } from '../config';

export async function computePortraitDescriptor(
  portraitImageData: ImageData,
  width: number,
  height: number,
): Promise<FaceDescriptor | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(portraitImageData, 0, 0);

  const engine = createHumanEngine();
  await engine.init();
  const result = await engine.detect(canvas);
  await engine.terminate();

  if (result.count === 1) {
    const face = result.faces[0];
    if (face.embedding) return { descriptor: face.embedding };
  }
  return null;
}

export async function computeLiveDescriptor(
  video: HTMLVideoElement,
): Promise<FaceDescriptor | null> {
  const engine = createHumanEngine();
  await engine.init();
  const result = await engine.detect(video);
  await engine.terminate();

  if (result.count === 1) {
    const face = result.faces[0];
    if (face.embedding) return { descriptor: face.embedding };
  }
  return null;
}

export async function compareDescriptors(
  desc1: number[],
  desc2: number[],
): Promise<FaceMatchResult> {
  const engine = createHumanEngine();
  await engine.init();
  const match = engine.match(desc1, desc2);
  await engine.terminate();

  return {
    matched: match.distance <= verificationConfig.faceMatchThreshold,
    distance: match.distance,
    similarity: match.similarity,
  };
}

export async function compareDescriptorsSync(
  desc1: number[],
  desc2: number[],
): Promise<FaceMatchResult> {
  const { default: human } = await import('@vladmandic/human');
  const distance = human.match.distance(desc1, desc2, { multiplier: 20 });
  const similarity = 1 / (1 + distance);
  return {
    matched: distance <= verificationConfig.faceMatchThreshold,
    distance,
    similarity,
  };
}
