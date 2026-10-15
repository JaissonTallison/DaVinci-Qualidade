CREATE TABLE "avaliacoes_fornecedores" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"fornecedor_id" uuid NOT NULL,
	"fornecedor_nome" varchar(150) NOT NULL,
	"data" date NOT NULL,
	"qualidade" smallint NOT NULL,
	"prazo" smallint NOT NULL,
	"atendimento" smallint NOT NULL,
	"documentacao" smallint NOT NULL,
	"media" double precision NOT NULL,
	"classificacao" varchar(25) NOT NULL,
	"proxima_avaliacao" date NOT NULL,
	"observacao" varchar(1000)
);
--> statement-breakpoint
CREATE TABLE "ordens_servico" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"cliente_id" uuid NOT NULL,
	"cliente_nome" varchar(150) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"descricao" varchar(2000) NOT NULL,
	"responsavel" varchar(120) NOT NULL,
	"prazo" date NOT NULL,
	"status" varchar(15) DEFAULT 'aberta' NOT NULL,
	"iniciada_em" timestamp (3) with time zone,
	"concluida_em" timestamp (3) with time zone,
	"relatorio" varchar(2000),
	"motivo_cancelamento" varchar(300),
	"nota" smallint,
	"comentario" varchar(500),
	CONSTRAINT "os_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "respostas_nps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"cliente_id" uuid NOT NULL,
	"cliente_nome" varchar(150) NOT NULL,
	"data" date NOT NULL,
	"nota" smallint NOT NULL,
	"comentario" varchar(1000),
	"os_id" uuid
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"empresa_id" uuid NOT NULL,
	"nome" varchar(30) NOT NULL,
	"ultimo" integer NOT NULL,
	CONSTRAINT "sequencias_empresa_id_nome_pk" PRIMARY KEY("empresa_id","nome")
);
--> statement-breakpoint
CREATE INDEX "avaliacoes_fornecedor_idx" ON "avaliacoes_fornecedores" USING btree ("empresa_id","fornecedor_id","data");--> statement-breakpoint
CREATE INDEX "os_status_idx" ON "ordens_servico" USING btree ("empresa_id","status");--> statement-breakpoint
CREATE INDEX "nps_data_idx" ON "respostas_nps" USING btree ("empresa_id","data");