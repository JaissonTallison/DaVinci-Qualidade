CREATE TABLE "integracoes_empresa" (
	"empresa_id" uuid PRIMARY KEY NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"segredos" text,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL
);
