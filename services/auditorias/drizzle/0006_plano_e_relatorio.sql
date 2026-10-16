ALTER TABLE "auditorias" ADD COLUMN "empresa_auditada" varchar(150);--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "unidade" varchar(120);--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "objetivo" text;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "metodologia" text;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "pontos_fortes" text;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "processos" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "criterios" text;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "cronograma" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "auditados" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "logistica" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "emissor" varchar(120);--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "papel" varchar(12) DEFAULT 'lider' NOT NULL;--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "horas" double precision;--> statement-breakpoint
ALTER TABLE "constatacoes" ADD COLUMN "pergunta_codigo" varchar(40);--> statement-breakpoint
ALTER TABLE "constatacoes" ADD COLUMN "modelo_codigo" varchar(40);--> statement-breakpoint
ALTER TABLE "constatacoes" ADD COLUMN "tipo_desvio" varchar(15);--> statement-breakpoint
ALTER TABLE "constatacoes" ADD COLUMN "causa_raiz" text;--> statement-breakpoint
ALTER TABLE "constatacoes" ADD COLUMN "acao_corretiva" text;--> statement-breakpoint
ALTER TABLE "constatacoes" ADD COLUMN "evidencia_fechamento" text;