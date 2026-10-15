ALTER TABLE "vinculos" ADD COLUMN "inativado_em" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vinculos" ADD COLUMN "inativado_por" uuid;--> statement-breakpoint
ALTER TABLE "vinculos" ADD COLUMN "motivo_inativacao" varchar(500);