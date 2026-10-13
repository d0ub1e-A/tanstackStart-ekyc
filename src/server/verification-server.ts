import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
  createVerificationSession,
  saveVerificationResult,
  saveVerificationAttempt,
  getVerificationSession,
} from '../lib/db/repositories/verification';

const VerificationSessionCreateSchema = z.object({
  cardType: z.string().min(1),
  templateVersion: z.string().min(1),
});

const VerificationResultSaveSchema = z.object({
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

export const createVerificationSessionFn = createServerFn({ method: 'POST' })
  .validator(VerificationSessionCreateSchema)
  .handler(async ({ data }) => {
    const session = await createVerificationSession(data);
    return { sessionId: session.id };
  });

export const saveVerificationResultFn = createServerFn({ method: 'POST' })
  .validator(VerificationResultSaveSchema)
  .handler(async ({ data }) => {
    const existing = await getVerificationSession(data.sessionId);
    if (!existing) throw new Error('Session not found');

    const maxAttempts = 3;
    if (existing.attemptCount >= maxAttempts) {
      throw new Error('Max attempts exceeded');
    }

    const attemptNumber = existing.attemptCount + 1;
    await saveVerificationAttempt({
      sessionId: data.sessionId,
      attemptNumber,
      livenessPassed: data.livenessPassed,
      faceMatchPassed: data.faceMatchPassed,
      faceDistance: data.faceDistance,
      faceSimilarity: data.faceSimilarity,
      result:
        data.livenessPassed && data.faceMatchPassed ? 'VERIFIED' : 'FAILED',
      failureReason: data.failureReason,
    });

    const updated = await saveVerificationResult(data);
    return { success: updated.status === 'VERIFIED', sessionId: updated.id };
  });
