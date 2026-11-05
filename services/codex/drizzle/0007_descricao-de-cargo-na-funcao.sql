ALTER TABLE "funcoes" ADD COLUMN "escolaridade" varchar(200);--> statement-breakpoint
ALTER TABLE "funcoes" ADD COLUMN "experiencia" varchar(200);--> statement-breakpoint
ALTER TABLE "funcoes" ADD COLUMN "outros_requisitos" varchar(300);--> statement-breakpoint
ALTER TABLE "funcoes" ADD COLUMN "competencias" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "funcoes" ADD COLUMN "atribuicoes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "funcoes" ADD COLUMN "treinamentos_continuados" jsonb DEFAULT '[]'::jsonb NOT NULL;