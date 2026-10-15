CREATE TABLE "registros_sst" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tipo" varchar(20) NOT NULL,
	"data" date NOT NULL,
	"tema" varchar(200) NOT NULL,
	"local" varchar(120),
	"responsavel" varchar(120) NOT NULL,
	"participantes" integer NOT NULL,
	"conteudo" varchar(4000) NOT NULL,
	"motivo_anulacao" varchar(300)
);
--> statement-breakpoint
CREATE INDEX "registros_sst_tipo_idx" ON "registros_sst" USING btree ("empresa_id","tipo","data");