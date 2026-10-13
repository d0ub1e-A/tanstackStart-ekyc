import { z } from 'zod';

export const ParsedIdSchema = z.object({
  cardType: z.string().min(1, 'Card type is required'),
  templateVersion: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  department: z.string().min(1, 'Department is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
});

export const ParsedBackSchema = z.object({
  issueDate: z.coerce.date(),
});

export const VerificationSessionCreateSchema = z.object({
  cardType: z.string().min(1),
  templateVersion: z.string().min(1),
});

export const VerificationResultSaveSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().min(1),
  department: z.string().min(1),
  idNumber: z.string().min(1),
  bloodGroup: z.string().min(1),
  contactNumber: z.string().min(1),
  issueDate: z.string().min(1),
  livenessPassed: z.boolean(),
  faceMatchPassed: z.boolean(),
  faceDistance: z.number().nullable(),
  faceSimilarity: z.number().nullable(),
  failureReason: z.string().nullable(),
  attemptCount: z.number().int().min(1).max(10),
});

export const VerificationAttemptSaveSchema = z.object({
  sessionId: z.string().uuid(),
  attemptNumber: z.number().int().min(1),
  livenessPassed: z.boolean(),
  faceMatchPassed: z.boolean(),
  faceDistance: z.number().nullable(),
  faceSimilarity: z.number().nullable(),
  result: z.enum(['VERIFIED', 'FAILED']),
  failureReason: z.string().nullable(),
});

export type VerificationSessionCreate = z.infer<
  typeof VerificationSessionCreateSchema
>;
export type VerificationResultSave = z.infer<
  typeof VerificationResultSaveSchema
>;
export type VerificationAttemptSave = z.infer<
  typeof VerificationAttemptSaveSchema
>;
