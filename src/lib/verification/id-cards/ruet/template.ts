import type { IdCardTemplate } from '../types';
import type {
  OcrDocument,
  ProcessedDocument,
  ParsedIdFields,
  ParsedBackFields,
  PortraitExtractionResult,
  FieldConfidence,
  OcrLine,
} from '../../types';
import {
  normalizeName,
  normalizeDepartment,
  normalizeIdNumber,
  normalizeBloodGroup,
  normalizePhoneNumber,
  normalizeIssueDate,
} from '../../ocr/normalizers';

function findAnchor(
  lines: OcrLine[],
  anchors: string[],
): { line: OcrLine; index: number } | null {
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.toLowerCase().replace(/[:\s]/g, '');
    for (const anchor of anchors) {
      const normalized = anchor.toLowerCase().replace(/[:\s]/g, '');
      if (text.includes(normalized)) return { line: lines[i], index: i };
    }
  }
  return null;
}

function getValueAfterAnchor(lines: OcrLine[], anchorIndex: number): string {
  const anchorLine = lines[anchorIndex];
  const colonSep = anchorLine.text.split(/[:]/);
  if (colonSep.length > 1) {
    const afterColon = colonSep.slice(1).join(':').trim();
    if (afterColon.length > 0) return afterColon;
  }
  for (let i = anchorIndex + 1; i < lines.length; i++) {
    const candidate = lines[i].text.trim();
    if (
      candidate.length > 1 &&
      !candidate.toLowerCase().includes('ruet') &&
      !candidate.toLowerCase().includes('rajshahi') &&
      !candidate.toLowerCase().includes('student') &&
      !candidate.toLowerCase().includes('identity') &&
      !candidate.toLowerCase().includes('university')
    ) {
      return candidate.replace(/^[:]\s*/, '').trim();
    }
  }
  return '';
}

function getNextLine(lines: OcrLine[], fromIndex: number): string {
  for (let i = fromIndex + 1; i < lines.length; i++) {
    const text = lines[i].text.trim();
    if (text.length > 0) return text;
  }
  return '';
}

function fuzzyMatchWord(word: string, anchors: string[]): string | null {
  const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const anchor of anchors) {
    const norm = anchor.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleaned === norm) return anchor;
    if (cleaned.includes(norm)) return anchor;
    if (levenshtein(cleaned, norm) <= 2) return anchor;
  }
  return null;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
    }
  }
  return dp[m][n];
}

function extractField(
  lines: OcrLine[],
  anchors: string[],
  defaultNextLine: boolean = false,
): { value: string; confidence: number } {
  const found = findAnchor(lines, anchors);
  if (found) {
    const value = getValueAfterAnchor(lines, found.index);
    const wordConfidence =
      found.line.words.length > 0
        ? found.line.words.reduce((s, w) => s + (w.confidence || 0), 0) /
          found.line.words.length
        : 0;
    return {
      value,
      confidence: Math.min(
        value.length > 0 ? wordConfidence + 0.1 : wordConfidence,
        1,
      ),
    };
  }
  if (defaultNextLine) {
    for (let i = 0; i < lines.length; i++) {
      for (const word of lines[i].words) {
        if (
          fuzzyMatchWord(word.text, [
            'name',
            'department',
            'blood',
            'contact',
            'id',
          ])
        ) {
          const nextLine = getNextLine(lines, i);
          if (nextLine)
            return { value: nextLine, confidence: word.confidence * 0.7 };
        }
      }
    }
  }
  return { value: '', confidence: 0 };
}

function detectAnchorsInOcr(ocr: OcrDocument): boolean {
  const combined = ocr.text.toLowerCase();
  if (
    combined.includes('ruet') ||
    combined.includes('rajshahi') ||
    combined.includes('engineering')
  )
    return true;
  const anchorCount = [
    'name',
    'department',
    'blood',
    'contact',
    'id no',
    'student id',
    'issue date',
  ].filter((a) => combined.includes(a)).length;
  return anchorCount >= 2;
}

export const ruetPortraitRegion = {
  x: 0.035,
  y: 0.13,
  width: 0.21,
  height: 0.36,
};

export const ruetStudentIdTemplate: IdCardTemplate = {
  id: 'ruet-student-id',
  version: '1.0.0',
  label: 'RUET Student ID',

  detect(_input: ProcessedDocument, ocr: OcrDocument): boolean {
    return detectAnchorsInOcr(ocr);
  },

  parseFront(ocr: OcrDocument): {
    fields: Omit<ParsedIdFields, 'cardType' | 'templateVersion'>;
    confidences: FieldConfidence[];
  } {
    const lines = ocr.lines;
    const nameResult = extractField(lines, ['name:', 'name'], true);
    const deptResult = extractField(
      lines,
      ['department:', 'dept:', 'department', 'dept'],
      true,
    );
    const idResult = extractField(
      lines,
      ['id no:', 'id:', 'student id:', 'idnumber:', 'id no', 'student id'],
      true,
    );
    const bloodResult = extractField(
      lines,
      ['blood group:', 'blood:', 'bg:', 'blood group', 'blood', 'bg'],
      true,
    );
    const contactResult = extractField(
      lines,
      [
        'contact:',
        'contact no:',
        'mobile:',
        'phone:',
        'contact',
        'mobile',
        'phone',
      ],
      true,
    );

    const name = normalizeName(nameResult.value);
    const dept = normalizeDepartment(deptResult.value);
    const idNo = normalizeIdNumber(idResult.value);
    const blood = normalizeBloodGroup(bloodResult.value);
    const contact = normalizePhoneNumber(contactResult.value);

    const fields = {
      name,
      department: dept,
      idNumber: idNo,
      bloodGroup: blood || '',
      contactNumber: contact || '',
    };

    const confidences: FieldConfidence[] = [
      { field: 'name', value: name, confidence: nameResult.confidence },
      { field: 'department', value: dept, confidence: deptResult.confidence },
      { field: 'idNumber', value: idNo, confidence: idResult.confidence },
      {
        field: 'bloodGroup',
        value: blood || bloodResult.value,
        confidence: bloodResult.confidence * 0.9,
      },
      {
        field: 'contactNumber',
        value: contact || contactResult.value,
        confidence: contactResult.confidence * 0.9,
      },
    ];

    return { fields, confidences };
  },

  parseBack(ocr: OcrDocument): {
    fields: ParsedBackFields;
    confidences: FieldConfidence[];
  } {
    const lines = ocr.lines;
    const issueResult = extractField(
      lines,
      [
        'issue date:',
        'date of issue:',
        'issued on:',
        'issue date',
        'date of issue',
      ],
      true,
    );
    const issueDateStr = normalizeIssueDate(issueResult.value);
    const issueDate = issueDateStr ? new Date(issueDateStr) : new Date(0);

    return {
      fields: { issueDate },
      confidences: [
        {
          field: 'issueDate',
          value: issueDateStr || issueResult.value,
          confidence: issueResult.confidence,
        },
      ],
    };
  },

  async extractPortrait(
    input: ProcessedDocument,
  ): Promise<PortraitExtractionResult> {
    const { x, y, width, height } = ruetPortraitRegion;
    const sx = Math.round(x * input.width);
    const sy = Math.round(y * input.height);
    const sw = Math.round(width * input.width);
    const sh = Math.round(height * input.height);

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    ctx.putImageData(input.imageData, 0, 0, sx, sy, sw, sh);

    const regionData = ctx.getImageData(0, 0, sw, sh);

    return {
      imageData: regionData,
      width: sw,
      height: sh,
      faceDetected: false,
      confidence: 0.8,
    };
  },

  validate(parsed: ParsedIdFields & ParsedBackFields): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (!parsed.name || parsed.name.length < 2)
      errors.push('Invalid or missing name');
    if (!parsed.department) errors.push('Missing department');
    if (!parsed.idNumber) errors.push('Missing ID number');
    if (!normalizeBloodGroup(parsed.bloodGroup))
      errors.push('Invalid blood group');
    if (!normalizePhoneNumber(parsed.contactNumber))
      errors.push('Invalid contact number');
    if (Number.isNaN(parsed.issueDate.getTime()))
      errors.push('Invalid issue date');
    return { valid: errors.length === 0, errors };
  },
};
