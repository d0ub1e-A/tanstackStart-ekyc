import type {
  OcrDocument,
  ProcessedDocument,
  ParsedIdFields,
  ParsedBackFields,
  PortraitExtractionResult,
} from '../types';
import type { FieldConfidence } from '../types';

export interface IdCardTemplate {
  id: string;
  version: string;
  label: string;

  detect(
    input: ProcessedDocument,
    ocr: OcrDocument,
  ): Promise<boolean> | boolean;

  parseFront(ocr: OcrDocument): {
    fields: Omit<ParsedIdFields, 'cardType' | 'templateVersion'>;
    confidences: FieldConfidence[];
  };

  parseBack(ocr: OcrDocument): {
    fields: ParsedBackFields;
    confidences: FieldConfidence[];
  };

  extractPortrait(input: ProcessedDocument): Promise<PortraitExtractionResult>;

  validate(parsed: ParsedIdFields & ParsedBackFields): {
    valid: boolean;
    errors: string[];
  };
}
