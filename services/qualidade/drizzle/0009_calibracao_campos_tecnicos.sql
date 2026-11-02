ALTER TABLE "instrumentos" ADD COLUMN "grandeza" varchar(20);--> statement-breakpoint
ALTER TABLE "instrumentos" ADD COLUMN "unidade" varchar(20);--> statement-breakpoint
ALTER TABLE "instrumentos" ADD COLUMN "erro_maximo_admissivel" varchar(200);--> statement-breakpoint
ALTER TABLE "instrumentos" ADD COLUMN "incerteza" varchar(120);--> statement-breakpoint
ALTER TABLE "instrumentos" ADD COLUMN "classe_exatidao" varchar(60);--> statement-breakpoint
ALTER TABLE "instrumentos" ADD COLUMN "norma_referencia" varchar(160);