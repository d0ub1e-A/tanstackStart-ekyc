import type { ProcessedDocument } from '../types';

interface OpenCV {
  matFromImageData(imageData: ImageData): any;
  Mat: new () => any;
  cvtColor(src: any, dst: any, code: number): void;
  COLOR_RGBA2GRAY: number;
  GaussianBlur(src: any, dst: any, ksize: any, sigmaX: number): void;
  Size: new (width: number, height: number) => any;
  Canny(image: any, edges: any, threshold1: number, threshold2: number): void;
  MatVector: new () => any;
  findContours(
    image: any,
    contours: any,
    hierarchy: any,
    mode: number,
    method: number,
  ): void;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  contourArea(contour: any): number;
  arcLength(curve: any, closed: boolean): number;
  approxPolyDP(curve: any, approx: any, epsilon: number, closed: boolean): void;
  getPerspectiveTransform(src: any, dst: any): any;
  warpPerspective(src: any, dst: any, M: any, dsize: any): void;
  matFromArray(rows: number, cols: number, type: number, data: number[]): any;
  CV_32FC2: number;
  CV_8UC4: number;
}

let cvInstance: OpenCV | null = null;

async function getOpenCv(): Promise<OpenCV> {
  if (!cvInstance) {
    const cv = await import('@techstark/opencv-js');
    cvInstance = cv as unknown as OpenCV;
  }
  return cvInstance!;
}

export async function loadImage(file: File): Promise<ProcessedDocument> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  URL.revokeObjectURL(url);

  return {
    imageData,
    width: img.width,
    height: img.height,
    originalWidth: img.width,
    originalHeight: img.height,
  };
}

export async function detectCardCorners(
  input: ProcessedDocument,
): Promise<ProcessedDocument> {
  const cv = await getOpenCv();
  const src = cv.matFromImageData(input.imageData);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(
    edges,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE,
  );

  let largestContour: any = null;
  let largestArea = 0;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    if (area > largestArea) {
      largestArea = area;
      largestContour = contour;
    }
  }

  let cardCorners: ProcessedDocument['cardCorners'];
  if (largestContour && largestArea > input.width * input.height * 0.15) {
    const peri = cv.arcLength(largestContour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(largestContour, approx, 0.02 * peri, true);
    if (approx.rows === 4) {
      cardCorners = [
        { x: approx.data32S[0], y: approx.data32S[1] },
        { x: approx.data32S[2], y: approx.data32S[3] },
        { x: approx.data32S[4], y: approx.data32S[5] },
        { x: approx.data32S[6], y: approx.data32S[7] },
      ];
      const ordered = orderCorners(cardCorners, input.width, input.height);
      if (ordered) cardCorners = ordered;
    }
    approx.delete();
  }

  src.delete();
  gray.delete();
  blurred.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();

  return { ...input, cardCorners };
}

function orderCorners(
  corners: ProcessedDocument['cardCorners'],
  w: number,
  h: number,
): ProcessedDocument['cardCorners'] | null {
  if (!corners) return null;
  const centerX = w / 2;
  const centerY = h / 2;
  const sorted = [...corners].sort((a, b) => {
    const aAngle = Math.atan2(a.y - centerY, a.x - centerX);
    const bAngle = Math.atan2(b.y - centerY, b.x - centerX);
    return aAngle - bAngle;
  });
  return [sorted[0], sorted[1], sorted[2], sorted[3]];
}

export async function applyPerspectiveCorrection(
  input: ProcessedDocument,
): Promise<ProcessedDocument> {
  if (!input.cardCorners) return input;
  const cv = await getOpenCv();
  const src = cv.matFromImageData(input.imageData);
  const [tl, tr, br, bl] = input.cardCorners;
  const dstWidth = Math.max(
    Math.sqrt((tr.x - tl.x) ** 2 + (tr.y - tl.y) ** 2),
    Math.sqrt((br.x - bl.x) ** 2 + (br.y - bl.y) ** 2),
  );
  const dstHeight = Math.max(
    Math.sqrt((bl.x - tl.x) ** 2 + (bl.y - tl.y) ** 2),
    Math.sqrt((br.x - tr.x) ** 2 + (br.y - tr.y) ** 2),
  );
  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x,
    tl.y,
    tr.x,
    tr.y,
    br.x,
    br.y,
    bl.x,
    bl.y,
  ]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    dstWidth - 1,
    0,
    dstWidth - 1,
    dstHeight - 1,
    0,
    dstHeight - 1,
  ]);
  const matrix = cv.getPerspectiveTransform(srcPts, dstPts);
  const warped = new cv.Mat();
  cv.warpPerspective(src, warped, matrix, new cv.Size(dstWidth, dstHeight));

  const canvas = document.createElement('canvas');
  canvas.width = dstWidth;
  canvas.height = dstHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  const imgData = new cv.Mat();
  warped.convertTo(imgData, cv.CV_8UC4);
  const data = new ImageData(
    new Uint8ClampedArray(imgData.data),
    dstWidth,
    dstHeight,
  );
  ctx.putImageData(data, 0, 0);

  src.delete();
  srcPts.delete();
  dstPts.delete();
  matrix.delete();
  warped.delete();
  imgData.delete();

  return {
    imageData: data,
    width: dstWidth,
    height: dstHeight,
    originalWidth: input.originalWidth,
    originalHeight: input.originalHeight,
  };
}

export function getImageAsDataUrl(input: ProcessedDocument): string {
  const canvas = document.createElement('canvas');
  canvas.width = input.width;
  canvas.height = input.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(input.imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function releaseMat(
  mat: { delete?: () => void } | null | undefined,
): void {
  mat?.delete?.();
}
