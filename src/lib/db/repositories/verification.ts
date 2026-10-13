import { db } from '../index';
import {
  verificationSessions,
  verificationAttempts,
  type NewVerificationSession,
  type NewVerificationAttempt,
  type VerificationSession,
} from '../schema';
import { eq } from 'drizzle-orm';

interface CreateSessionInput {
  cardType: string;
  templateVersion: string;
}

export async function createVerificationSession(
  data: CreateSessionInput,
): Promise<VerificationSession> {
  const [session] = await db
    .insert(verificationSessions)
    .values({
      cardType: data.cardType,
      templateVersion: data.templateVersion,
      name: '',
      department: '',
      idNumber: '',
      bloodGroup: '',
      contactNumber: '',
      issueDate: '1970-01-01',
      status: 'PENDING',
      livenessPassed: false,
      faceMatchPassed: false,
      attemptCount: 0,
    })
    .returning();
  return session;
}

export async function getVerificationSession(
  id: string,
): Promise<VerificationSession | null> {
  const [session] = await db
    .select()
    .from(verificationSessions)
    .where(eq(verificationSessions.id, id))
    .limit(1);
  return session ?? null;
}

export async function updateVerificationSession(
  id: string,
  data: Partial<NewVerificationSession>,
): Promise<VerificationSession> {
  const [session] = await db
    .update(verificationSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(verificationSessions.id, id))
    .returning();
  return session;
}

export async function saveVerificationResult(data: {
  sessionId: string;
  name: string;
  department: string;
  idNumber: string;
  bloodGroup: string;
  contactNumber: string;
  issueDate: string;
  livenessPassed: boolean;
  faceMatchPassed: boolean;
  faceDistance: number | null;
  faceSimilarity: number | null;
  failureReason: string | null;
  attemptCount: number;
}): Promise<VerificationSession> {
  const [session] = await db
    .update(verificationSessions)
    .set({
      status:
        data.livenessPassed && data.faceMatchPassed ? 'VERIFIED' : 'FAILED',
      livenessPassed: data.livenessPassed,
      faceMatchPassed: data.faceMatchPassed,
      faceDistance: data.faceDistance,
      faceSimilarity: data.faceSimilarity,
      failureReason: data.failureReason,
      attemptCount: data.attemptCount,
      verifiedAt:
        data.livenessPassed && data.faceMatchPassed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(verificationSessions.id, data.sessionId))
    .returning();
  return session;
}

export async function saveVerificationAttempt(
  data: NewVerificationAttempt,
): Promise<void> {
  await db.insert(verificationAttempts).values(data);
}

export async function getVerificationAttempts(sessionId: string) {
  return db
    .select()
    .from(verificationAttempts)
    .where(eq(verificationAttempts.sessionId, sessionId))
    .orderBy(verificationAttempts.attemptNumber);
}
