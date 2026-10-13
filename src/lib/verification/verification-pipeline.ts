import type {
  ParsedIdFields,
  ParsedBackFields,
  PortraitExtractionResult,
  FieldConfidence,
  VerificationStatus,
} from './types';
import {
  loadImage,
  detectCardCorners,
  applyPerspectiveCorrection,
} from './document/image-processing';
import { recognizeImageData, terminateWorker } from './ocr/ocr-service';
import { parseOcrDocument, validateRequiredFields } from './ocr/ocr-parser';
import { ruetStudentIdTemplate } from './id-cards/ruet/template';

export interface PipelineStage {
  status: VerificationStatus;
  progress: number;
  message: string;
}

export type ProgressCallback = (stage: PipelineStage) => void;

export async function processIdCard(
  frontFile: File,
  backFile: File,
  onProgress: ProgressCallback,
): Promise<{
  parsed: ParsedIdFields & ParsedBackFields;
  confidences: FieldConfidence[];
  portrait: PortraitExtractionResult;
}> {
  const stages: PipelineStage[] = [
    { status: 'PROCESSING_ID', progress: 10, message: 'Preparing ID image...' },
    { status: 'PROCESSING_ID', progress: 25, message: 'Detecting document...' },
    { status: 'OCR_PROCESSING', progress: 40, message: 'Reading ID front...' },
    { status: 'OCR_PROCESSING', progress: 55, message: 'Reading ID back...' },
    {
      status: 'OCR_PROCESSING',
      progress: 70,
      message: 'Extracting information...',
    },
    {
      status: 'PORTRAIT_EXTRACTION',
      progress: 85,
      message: 'Finding ID portrait...',
    },
  ];

  for (const stage of stages) onProgress(stage);

  const frontDoc = await loadImage(frontFile);console.log('frontDoc',frontDoc)
  onProgress(stages[1]);

  const frontWithCorners = await detectCardCorners(frontDoc);console.log('corner', frontWithCorners)
  const normalizedFront = frontWithCorners.cardCorners
    ? await applyPerspectiveCorrection(frontWithCorners)
    : frontWithCorners;
  onProgress(stages[2]);

  const backDoc = await loadImage(backFile);console.log('backDoc',backDoc)
  onProgress(stages[3]);

  const backWithCorners = await detectCardCorners(backDoc);
  const normalizedBack = backWithCorners.cardCorners
    ? await applyPerspectiveCorrection(backWithCorners)
    : backWithCorners;
  onProgress(stages[4]);

  const [frontOcr, backOcr] = await Promise.all([
    recognizeImageData(
      normalizedFront.imageData,
      normalizedFront.width,
      normalizedFront.height,
    ),
    recognizeImageData(
      normalizedBack.imageData,
      normalizedBack.width,
      normalizedBack.height,
    ),
  ]);

  const parseResult = await parseOcrDocument(frontOcr);
  const backParseResult = await parseOcrDocument(backOcr);
  onProgress(stages[5]);

  const combinedFields = { ...parseResult.fields, ...backParseResult.fields };
  const validation = validateRequiredFields(combinedFields);
  if (!validation.valid) {
    throw new Error(`REQUIRED_FIELD_MISSING:${validation.missing.join(',')}`);
  }

  const portrait = await ruetStudentIdTemplate.extractPortrait(normalizedFront);

  await terminateWorker();

  return {
    parsed: combinedFields,
    confidences: [...parseResult.confidences, ...backParseResult.confidences],
    portrait,
  };
}
