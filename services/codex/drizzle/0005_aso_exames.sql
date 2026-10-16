ALTER TABLE "asos" ADD COLUMN "uf_crm" char(2);--> statement-breakpoint
ALTER TABLE "asos" ADD COLUMN "exames" jsonb DEFAULT '[]'::jsonb NOT NULL;