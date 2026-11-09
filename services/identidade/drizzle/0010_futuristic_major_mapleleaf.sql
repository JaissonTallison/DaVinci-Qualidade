ALTER TABLE "vinculos" ADD COLUMN "convidado_em" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vinculos" ADD COLUMN "convidado_por" uuid;