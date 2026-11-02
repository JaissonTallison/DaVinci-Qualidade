CREATE TABLE "requisitos_contrato" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"contrato_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"descricao" varchar(500) NOT NULL,
	"criterio_aceitacao" varchar(500),
	"obrigatorio" boolean DEFAULT true NOT NULL,
	"situacao" varchar(20) DEFAULT 'pendente' NOT NULL,
	"evidencia" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "analise_data" date;--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "analise_responsavel" varchar(120);--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "analise_conclusao" varchar(30);--> statement-breakpoint
ALTER TABLE "contratos" ADD COLUMN "analise_parecer" varchar(1000);--> statement-breakpoint
CREATE INDEX "requisitos_contrato_idx" ON "requisitos_contrato" USING btree ("empresa_id","contrato_id");