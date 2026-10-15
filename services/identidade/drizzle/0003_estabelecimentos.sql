CREATE TABLE "estabelecimentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tipo" varchar(6) NOT NULL,
	"cnpj" varchar(14) NOT NULL,
	"nome" varchar(60) NOT NULL,
	"razao_social" varchar(150) NOT NULL,
	"nome_fantasia" varchar(150),
	"indicador_ie" varchar(20) DEFAULT 'contribuinte' NOT NULL,
	"inscricao_estadual" varchar(20),
	"inscricao_municipal" varchar(20),
	"cnae_principal" char(7),
	"cnaes_secundarios" text[] DEFAULT '{}'::text[] NOT NULL,
	"situacao_cadastral" varchar(10),
	"data_abertura" date,
	"cep" char(8),
	"logradouro" varchar(150),
	"numero" varchar(20),
	"complemento" varchar(60),
	"bairro" varchar(80),
	"cidade" varchar(80),
	"uf" char(2),
	"codigo_municipio" char(7),
	"telefone" varchar(11),
	"email" varchar(150),
	"ativo" boolean DEFAULT true NOT NULL,
	"motivo_inativacao" varchar(300),
	CONSTRAINT "estabelecimentos_cnpj" UNIQUE("cnpj"),
	CONSTRAINT "estabelecimentos_tipo" CHECK ("estabelecimentos"."tipo" IN ('matriz', 'filial'))
);
--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "regime_tributario" varchar(10);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "email" varchar(150);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "telefone" varchar(11);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "site" varchar(150);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "logo" "bytea";--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "logo_tipo" varchar(20);--> statement-breakpoint
ALTER TABLE "empresas" ADD COLUMN "logo_atualizada_em" timestamp (3) with time zone;--> statement-breakpoint
CREATE INDEX "estabelecimentos_empresa_idx" ON "estabelecimentos" USING btree ("empresa_id");--> statement-breakpoint
CREATE UNIQUE INDEX "estabelecimentos_uma_matriz" ON "estabelecimentos" USING btree ("empresa_id") WHERE "estabelecimentos"."tipo" = 'matriz';--> statement-breakpoint
-- Toda empresa existente ganha a sua MATRIZ, com o CNPJ e a razão social que ela já tinha.
INSERT INTO "estabelecimentos" ("id", "empresa_id", "tipo", "cnpj", "nome", "razao_social", "nome_fantasia", "indicador_ie")
SELECT gen_random_uuid(), "id", 'matriz', "cnpj", 'Matriz', "razao_social", "nome_fantasia", 'nao_contribuinte'
FROM "empresas"
WHERE NOT EXISTS (SELECT 1 FROM "estabelecimentos" e WHERE e."empresa_id" = "empresas"."id" AND e."tipo" = 'matriz');
