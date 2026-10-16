CREATE TABLE "catalogo_servicos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(120) NOT NULL,
	"descricao" varchar(1000),
	"horas_padrao" double precision,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "catalogo_nome_por_empresa" UNIQUE("empresa_id","nome")
);
--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"cliente_id" uuid NOT NULL,
	"cliente_nome" varchar(150) NOT NULL,
	"objeto" varchar(300) NOT NULL,
	"inicio" date NOT NULL,
	"fim" date NOT NULL,
	"prazo_atendimento_dias" smallint NOT NULL,
	"meta_no_prazo" smallint NOT NULL,
	"valor_mensal" varchar(20),
	"observacoes" varchar(1000),
	"motivo_encerramento" varchar(300),
	"encerrado_em" timestamp (3) with time zone,
	CONSTRAINT "contratos_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "convites_pesquisa" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"token" varchar(64) NOT NULL,
	"cliente_id" uuid NOT NULL,
	"cliente_nome" varchar(150) NOT NULL,
	"os_id" uuid,
	"os_numero" varchar(20),
	"os_titulo" varchar(150),
	"expira_em" date NOT NULL,
	"respondido_em" timestamp (3) with time zone,
	"comentario" text,
	CONSTRAINT "convites_token" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reclamacoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"cliente_id" uuid NOT NULL,
	"cliente_nome" varchar(150) NOT NULL,
	"canal" varchar(20) NOT NULL,
	"recebida_em" date NOT NULL,
	"descricao" varchar(2000) NOT NULL,
	"produto" varchar(150),
	"os_id" uuid,
	"os_numero" varchar(20),
	"prazo_resposta" date NOT NULL,
	"status" varchar(15) DEFAULT 'aberta' NOT NULL,
	"procedente" boolean,
	"analise" varchar(2000),
	"analisada_em" timestamp (3) with time zone,
	"nc_id" uuid,
	"nc_numero" varchar(20),
	"resposta" varchar(2000),
	"respondida_em" date,
	"cliente_satisfeito" boolean,
	"observacao_encerramento" varchar(500),
	"encerrada_em" timestamp (3) with time zone,
	CONSTRAINT "reclamacoes_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "contrato_id" uuid;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "contrato_numero" varchar(20);--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "servico_id" uuid;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "servico_nome" varchar(120);--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "checklist" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "apontamentos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "materiais" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ordens_servico" ADD COLUMN "recebido_por" varchar(120);--> statement-breakpoint
CREATE INDEX "reclamacoes_status_idx" ON "reclamacoes" USING btree ("empresa_id","status");