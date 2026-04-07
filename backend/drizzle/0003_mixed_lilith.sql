CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'interest', 'fee', 'other');--> statement-breakpoint
CREATE TYPE "public"."channel_type" AS ENUM('counter', 'atm', 'online', 'batch');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'CNY' NOT NULL,
	"description" varchar(200),
	"channel_type" "channel_type" DEFAULT 'counter' NOT NULL,
	"related_account_no" varchar(25),
	"teller_no" varchar(20),
	"reference_no" varchar(32) NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_reference_no_unique" UNIQUE("reference_no")
);
