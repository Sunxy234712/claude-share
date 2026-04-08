CREATE TYPE "public"."wealth_product_type" AS ENUM('fixed_income', 'structured', 'floating_rate');--> statement-breakpoint
CREATE TYPE "public"."wealth_status" AS ENUM('on_sale', 'off_sale', 'matured');--> statement-breakpoint
CREATE TYPE "public"."wealth_order_status" AS ENUM('active', 'redeemed', 'matured');--> statement-breakpoint
CREATE TYPE "public"."fund_type" AS ENUM('equity', 'bond', 'mixed', 'money');--> statement-breakpoint
CREATE TYPE "public"."fund_status" AS ENUM('on_sale', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."metal_type" AS ENUM('gold', 'silver', 'platinum', 'copper');--> statement-breakpoint
CREATE TYPE "public"."metal_status" AS ENUM('trading', 'suspension');--> statement-breakpoint
CREATE TYPE "public"."metal_storage_type" AS ENUM('account', 'pending_delivery');--> statement-breakpoint
CREATE TABLE "wealth_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_code" varchar(20) NOT NULL,
	"product_name" varchar(100) NOT NULL,
	"product_type" "wealth_product_type" DEFAULT 'fixed_income' NOT NULL,
	"expected_return" numeric(5, 2) NOT NULL,
	"min_amount" numeric(15, 2) NOT NULL,
	"max_amount" numeric(15, 2) NOT NULL,
	"term_days" integer NOT NULL,
	"status" "wealth_status" DEFAULT 'on_sale' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "wealth_products_product_code_unique" UNIQUE("product_code")
);
--> statement-breakpoint
CREATE TABLE "wealth_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"order_no" varchar(30) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"maturity_date" timestamp NOT NULL,
	"expected_income" numeric(15, 2) NOT NULL,
	"actual_income" numeric(15, 2) DEFAULT '0',
	"status" "wealth_order_status" DEFAULT 'active' NOT NULL,
	"redemption_date" timestamp,
	"teller_no" varchar(20),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "wealth_orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" serial PRIMARY KEY NOT NULL,
	"fund_code" varchar(10) NOT NULL,
	"fund_name" varchar(100) NOT NULL,
	"fund_type" "fund_type" DEFAULT 'equity' NOT NULL,
	"nav" numeric(10, 4) NOT NULL,
	"nav_date" timestamp DEFAULT now() NOT NULL,
	"performance_1m" numeric(5, 2) DEFAULT '0',
	"performance_1y" numeric(5, 2) DEFAULT '0',
	"manager" varchar(50),
	"status" "fund_status" DEFAULT 'on_sale' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "funds_fund_code_unique" UNIQUE("fund_code")
);
--> statement-breakpoint
CREATE TABLE "fund_holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"fund_id" integer NOT NULL,
	"shares" numeric(15, 4) NOT NULL,
	"purchase_price" numeric(10, 4) NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"teller_no" varchar(20),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "precious_metals" (
	"id" serial PRIMARY KEY NOT NULL,
	"metal_type" "metal_type" NOT NULL,
	"purity" varchar(20) NOT NULL,
	"current_price" numeric(12, 2) NOT NULL,
	"price_update_time" timestamp DEFAULT now() NOT NULL,
	"daily_change" numeric(5, 2) DEFAULT '0',
	"status" "metal_status" DEFAULT 'trading' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "metal_holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"metal_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"average_cost" numeric(12, 2) NOT NULL,
	"storage_type" "metal_storage_type" DEFAULT 'account' NOT NULL,
	"teller_no" varchar(20),
	"created_at" timestamp DEFAULT now()
);
