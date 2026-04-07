CREATE TABLE "menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"title" varchar(50) NOT NULL,
	"path" varchar(100),
	"icon" varchar(50),
	"sort" integer DEFAULT 0 NOT NULL,
	"roles" varchar(100) DEFAULT 'teller,supervisor' NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL
);
