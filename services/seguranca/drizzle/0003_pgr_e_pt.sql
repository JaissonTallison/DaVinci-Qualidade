CREATE TABLE "permissoes_de_trabalho" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"local" varchar(120) NOT NULL,
	"servico" varchar(500) NOT NULL,
	"executantes" varchar(500) NOT NULL,
	"inicio" varchar(16) NOT NULL,
	"fim" varchar(16) NOT NULL,
	"riscos" varchar(1000) NOT NULL,
	"epis" varchar(500),
	"status" varchar(15) DEFAULT 'solicitada' NOT NULL,
	"liberada_por" uuid,
	"liberada_em" timestamp (3) with time zone,
	"encerrada_em" timestamp (3) with time zone,
	"observacao_encerramento" varchar(500),
	"motivo_cancelamento" varchar(300),
	CONSTRAINT "pts_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "riscos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"grupo" varchar(20) NOT NULL,
	"local" varchar(120) NOT NULL,
	"perigo" varchar(200) NOT NULL,
	"danos" varchar(300) NOT NULL,
	"severidade" smallint NOT NULL,
	"probabilidade" smallint NOT NULL,
	"controles" varchar(1000),
	"acoes" varchar(1000),
	"responsavel" varchar(120),
	"prazo" date,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "riscos_escala" CHECK ("riscos"."severidade" BETWEEN 1 AND 4 AND "riscos"."probabilidade" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE INDEX "pts_status_idx" ON "permissoes_de_trabalho" USING btree ("empresa_id","status");--> statement-breakpoint
CREATE INDEX "riscos_empresa_idx" ON "riscos" USING btree ("empresa_id","ativo");