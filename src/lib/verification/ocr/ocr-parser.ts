import type {
  OcrDocument,
  ParsedIdFields,
  ParsedBackFields,
  FieldConfidence,
} from '../types';
import { ParsedIdSchema, ParsedBackSchema } from '../schemas';
import { getTemplates } from '../id-cards/registry';

export interface OcrParseResult {
  fields: ParsedIdFields & ParsedBackFields;
  template: { id: string; version: string };
  confidences: FieldConfidence[];
}

export async function parseOcrDocument(
  ocr: OcrDocument,
): Promise<OcrParseResult> {
  const templates = getTemplates();
  let matchedTemplate: (typeof templates)[0] | null = null;

  for (const template of templates) {
    const isMatch = template.detect(
      {
        imageData: new ImageData(1, 1),
        width: 1,
        height: 1,
        originalWidth: 1,
        originalHeight: 1,
      },
      ocr,
    );
    if (isMatch) {
      matchedTemplate = template;
      break;
    }
  }

  if (!matchedTemplate) {
    throw new Error('No matching ID card template found');
  }

  const frontResult = matchedTemplate.parseFront(ocr);
  const backResult = matchedTemplate.parseBack(ocr);

  const validatedFront = ParsedIdSchema.safeParse({
    cardType: matchedTemplate.id,
    templateVersion: matchedTemplate.version,
    ...frontResult.fields,
  });
  const validatedBack = ParsedBackSchema.safeParse(backResult.fields);

  if (!validatedFront.success || !validatedBack.success) {
    throw new Error('Field validation failed');
  }

  const confidences = [...frontResult.confidences, ...backResult.confidences];

  return {
    fields: validatedFront.data as ParsedIdFields & ParsedBackFields,
    template: { id: matchedTemplate.id, version: matchedTemplate.version },
    confidences,
  };
}

export function validateRequiredFields(
  parsed: ParsedIdFields & ParsedBackFields,
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!parsed.name || parsed.name.length < 2) missing.push('name');
  if (!parsed.department) missing.push('department');
  if (!parsed.idNumber) missing.push('idNumber');
  if (!parsed.bloodGroup) missing.push('bloodGroup');
  if (!parsed.contactNumber) missing.push('contactNumber');
  if (!parsed.issueDate || Number.isNaN(parsed.issueDate.getTime()))
    missing.push('issueDate');
  return { valid: missing.length === 0, missing };
}
