CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_no" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"id_type" varchar(20) DEFAULT 'id_card' NOT NULL,
	"id_no" varchar(30) NOT NULL,
	"phone" varchar(20),
	"address" varchar(200),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_customer_no_unique" UNIQUE("customer_no"),
	CONSTRAINT "customers_id_no_unique" UNIQUE("id_no")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_no" varchar(25) NOT NULL,
	"customer_id" integer NOT NULL,
	"account_type" varchar(20) DEFAULT 'savings' NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'CNY' NOT NULL,
	"status" varchar(20) DEFAULT 'normal' NOT NULL,
	"open_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "accounts_account_no_unique" UNIQUE("account_no")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_no" varchar(25) NOT NULL,
	"account_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'normal' NOT NULL,
	"issued_at" timestamp DEFAULT now(),
	CONSTRAINT "cards_card_no_unique" UNIQUE("card_no")
);
