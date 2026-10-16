ALTER TABLE "inspecoes" ADD COLUMN "nqa" varchar(6);--> statement-breakpoint
ALTER TABLE "inspecoes" ADD COLUMN "nivel_inspecao" varchar(3);--> statement-breakpoint
ALTER TABLE "inspecoes" ADD COLUMN "defeituosos" integer;--> statement-breakpoint
ALTER TABLE "inspecoes" ADD COLUMN "fornecedor_id" uuid;--> statement-breakpoint
ALTER TABLE "inspecoes" ADD COLUMN "fornecedor_nome" varchar(150);