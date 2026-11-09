CREATE TABLE "configuracoes_qualidade" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"auto_verificacao_eficacia" boolean DEFAULT false NOT NULL,
	CONSTRAINT "configuracoes_qualidade_empresa" UNIQUE("empresa_id")
);
--> statement-breakpoint
ALTER TABLE "nao_conformidades" ADD COLUMN "tratado_por" uuid;