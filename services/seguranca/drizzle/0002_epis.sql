CREATE TABLE "entregas_epi" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcionario_id" uuid NOT NULL,
	"funcionario_nome" varchar(120) NOT NULL,
	"funcionario_matricula" varchar(20) NOT NULL,
	"epi_id" uuid NOT NULL,
	"epi_nome" varchar(120) NOT NULL,
	"ca" varchar(7) NOT NULL,
	"quantidade" smallint NOT NULL,
	"data" date NOT NULL,
	"motivo" varchar(20) NOT NULL,
	"termo_assinado" boolean DEFAULT false NOT NULL,
	"observacao" varchar(500),
	"proxima_troca" date,
	"devolvido_em" date,
	"motivo_anulacao" varchar(300),
	"anulada_por" uuid,
	CONSTRAINT "entregas_epi_quantidade" CHECK ("entregas_epi"."quantidade" > 0),
	CONSTRAINT "entregas_epi_devolucao" CHECK ("entregas_epi"."devolvido_em" IS NULL OR "entregas_epi"."devolvido_em" >= "entregas_epi"."data")
);
--> statement-breakpoint
CREATE TABLE "epis" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(120) NOT NULL,
	"ca" varchar(7) NOT NULL,
	"validade_ca" date NOT NULL,
	"vida_util_dias" smallint,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "epis_nome_ca_por_empresa" UNIQUE("empresa_id","nome","ca")
);
--> statement-breakpoint
ALTER TABLE "entregas_epi" ADD CONSTRAINT "entregas_epi_epi_id_epis_id_fk" FOREIGN KEY ("epi_id") REFERENCES "epis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entregas_epi_funcionario_idx" ON "entregas_epi" USING btree ("empresa_id","funcionario_id","data");