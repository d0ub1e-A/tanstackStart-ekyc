import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core';

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'PROCESSING',
  'VERIFIED',
  'FAILED',
]);

export const verificationResultEnum = pgEnum('verification_result', [
  'VERIFIED',
  'FAILED',
]);

export const verificationSessions = pgTable('verification_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: verificationStatusEnum('status').notNull().default('PENDING'),
  cardType: text('card_type'),
  templateVersion: text('template_version'),
  name: text('name').notNull(),
  department: text('department').notNull(),
  idNumber: text('id_number').notNull(),
  bloodGroup: text('blood_group').notNull(),
  contactNumber: text('contact_number').notNull(),
  issueDate: date('issue_date').notNull(),
  livenessPassed: boolean('liveness_passed').notNull().default(false),
  faceMatchPassed: boolean('face_match_passed').notNull().default(false),
  faceDistance: doublePrecision('face_distance'),
  faceSimilarity: doublePrecision('face_similarity'),
  failureReason: text('failure_reason'),
  attemptCount: integer('attempt_count').notNull().default(0),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verificationAttempts = pgTable('verification_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => verificationSessions.id, { onDelete: 'cascade' })
    .notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  livenessPassed: boolean('liveness_passed').notNull(),
  faceMatchPassed: boolean('face_match_passed').notNull(),
  faceDistance: doublePrecision('face_distance'),
  faceSimilarity: doublePrecision('face_similarity'),
  result: verificationResultEnum('result').notNull(),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type VerificationSession = typeof verificationSessions.$inferSelect;
export type NewVerificationSession = typeof verificationSessions.$inferInsert;
export type VerificationAttempt = typeof verificationAttempts.$inferSelect;
export type NewVerificationAttempt = typeof verificationAttempts.$inferInsert;
