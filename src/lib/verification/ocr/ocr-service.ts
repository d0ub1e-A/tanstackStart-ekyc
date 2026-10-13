import type { OcrDocument, OcrWord, OcrLine } from '../types';

let workerInstance: any = null;

async function loadTesseractWorker(): Promise<any> {
  if (workerInstance) return workerInstance;
  const { createWorker } = await import('tesseract.js');
  const coreUrl = new URL(
    'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
    import.meta.url,
  ).href;
  const workerUrl = new URL('tesseract.js/dist/worker.min.js', import.meta.url)
    .href;
  workerInstance = await createWorker('eng', 1, {
    workerPath: workerUrl,
    corePath: coreUrl,
    langPath: '/tessdata/',
    cacheMethod: 'none',
  });
  return workerInstance;
}

function mapTesseractWord(word: {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
}): OcrWord {
  return {
    text: word.text || '',
    bbox: {
      x0: word.bbox?.x0 || 0,
      y0: word.bbox?.y0 || 0,
      x1: word.bbox?.x1 || 0,
      y1: word.bbox?.y1 || 0,
    },
    confidence: word.confidence || 0,
  };
}

function mapTesseractLine(line: {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  confidence: number;
  words: Array<{
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
    confidence: number;
  }>;
}): OcrLine {
  return {
    text: line.text || '',
    bbox: {
      x0: line.bbox?.x0 || 0,
      y0: line.bbox?.y0 || 0,
      x1: line.bbox?.x1 || 0,
      y1: line.bbox?.y1 || 0,
    },
    words: (line.words || []).map(mapTesseractWord),
    confidence: line.confidence || 0,
  };
}

export async function recognize(file: File): Promise<OcrDocument>;
export async function recognize(
  canvas: HTMLCanvasElement,
): Promise<OcrDocument>;
export async function recognize(
  image: string | HTMLCanvasElement | File,
): Promise<OcrDocument> {
  const worker = await loadTesseractWorker();
  const result = await worker.recognize(image);
  const lines: OcrLine[] = [];
  for (const block of result.data.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        lines.push(mapTesseractLine(line));
      }
    }
  }
  const words = lines.flatMap((l) => l.words);
  return {
    text: result.data.text || '',
    lines,
    words,
    confidence: result.data.confidence || 0,
  };
}

export async function terminateWorker(): Promise<void> {
  if (workerInstance) {
    try {
      await workerInstance.terminate();
    } catch {
      /* ignore */
    }
    workerInstance = null;
  }
}

export async function recognizeImageData(
  imageData: ImageData,
  width: number,
  height: number,
): Promise<OcrDocument> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.putImageData(imageData, 0, 0);
  return recognize(canvas);
}
