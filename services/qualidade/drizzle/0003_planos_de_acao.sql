CREATE TABLE "planos_acao" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"objetivo" text NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"origem" varchar(20) NOT NULL,
	"origem_ref" varchar(60),
	"nc_id" uuid,
	"responsavel" varchar(120) NOT NULL,
	"custo_previsto" numeric(18, 2),
	"status" varchar(25) DEFAULT 'em_execucao' NOT NULL,
	"eficaz" boolean,
	"parecer_eficacia" text,
	"verificado_por" uuid,
	"verificado_em" timestamp (3) with time zone,
	"motivo_cancelamento" varchar(500),
	"cancelado_em" timestamp (3) with time zone,
	"cancelado_por" uuid,
	CONSTRAINT "planos_acao_numero_por_empresa" UNIQUE("empresa_id","numero"),
	CONSTRAINT "planos_acao_status" CHECK ("planos_acao"."status" IN ('em_execucao', 'aguardando_eficacia', 'encerrado', 'cancelado'))
);
--> statement-breakpoint
CREATE TABLE "planos_acao_tarefas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"plano_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"o_que" varchar(300) NOT NULL,
	"responsavel" varchar(120) NOT NULL,
	"prazo" date NOT NULL,
	"onde" varchar(150),
	"como" text,
	"situacao" varchar(15) DEFAULT 'pendente' NOT NULL,
	"concluida_em" timestamp (3) with time zone,
	"concluida_por" uuid,
	"motivo_cancelamento" varchar(300),
	CONSTRAINT "planos_acao_tarefas_situacao" CHECK ("planos_acao_tarefas"."situacao" IN ('pendente', 'concluida', 'cancelada'))
);
--> statement-breakpoint
ALTER TABLE "planos_acao" ADD CONSTRAINT "planos_acao_nc_id_nao_conformidades_id_fk" FOREIGN KEY ("nc_id") REFERENCES "nao_conformidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos_acao_tarefas" ADD CONSTRAINT "planos_acao_tarefas_plano_id_planos_acao_id_fk" FOREIGN KEY ("plano_id") REFERENCES "planos_acao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planos_acao_empresa_status_idx" ON "planos_acao" USING btree ("empresa_id","status");--> statement-breakpoint
CREATE INDEX "planos_acao_nc_idx" ON "planos_acao" USING btree ("nc_id");--> statement-breakpoint
CREATE INDEX "planos_acao_tarefas_plano_idx" ON "planos_acao_tarefas" USING btree ("plano_id","ordem");