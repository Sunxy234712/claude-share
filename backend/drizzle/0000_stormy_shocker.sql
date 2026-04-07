CREATE TYPE "public"."role" AS ENUM('teller', 'supervisor');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "tellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"teller_no" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'teller' NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tellers_teller_no_unique" UNIQUE("teller_no")
);
