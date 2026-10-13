CREATE TYPE "verification_result" AS ENUM('VERIFIED', 'FAILED');--> statement-breakpoint
CREATE TYPE "verification_status" AS ENUM('PENDING', 'PROCESSING', 'VERIFIED', 'FAILED');--> statement-breakpoint
CREATE TABLE "verification_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"liveness_passed" boolean NOT NULL,
	"face_match_passed" boolean NOT NULL,
	"face_distance" double precision,
	"face_similarity" double precision,
	"result" "verification_result" NOT NULL,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" "verification_status" DEFAULT 'PENDING'::"verification_status" NOT NULL,
	"card_type" text,
	"template_version" text,
	"name" text NOT NULL,
	"department" text NOT NULL,
	"id_number" text NOT NULL,
	"blood_group" text NOT NULL,
	"contact_number" text NOT NULL,
	"issue_date" date NOT NULL,
	"liveness_passed" boolean DEFAULT false NOT NULL,
	"face_match_passed" boolean DEFAULT false NOT NULL,
	"face_distance" double precision,
	"face_similarity" double precision,
	"failure_reason" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_session_id_verification_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "verification_sessions"("id") ON DELETE CASCADE;