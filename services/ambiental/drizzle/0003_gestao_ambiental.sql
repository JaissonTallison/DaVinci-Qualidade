CREATE TABLE "destinadores" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(150) NOT NULL,
	"cnpj" varchar(18),
	"tipo" varchar(15) NOT NULL,
	"licenca_numero" varchar(60) NOT NULL,
	"licenca_orgao" varchar(60) NOT NULL,
	"licenca_validade" date NOT NULL,
	"atividades" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "obrigacoes_legais" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(200) NOT NULL,
	"orgao" varchar(120) NOT NULL,
	"periodicidade" varchar(12) NOT NULL,
	"proximo_vencimento" date,
	"responsavel" varchar(120) NOT NULL,
	"descricao" varchar(1000),
	"historico" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ocorrencias_ambientais" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"data" date NOT NULL,
	"hora" varchar(5) NOT NULL,
	"local" varchar(150) NOT NULL,
	"substancia" varchar(150) NOT NULL,
	"quantidade" double precision,
	"unidade" varchar(10),
	"meios" jsonb NOT NULL,
	"severidade" varchar(10) NOT NULL,
	"descricao" text NOT NULL,
	"contencao" text NOT NULL,
	"comunicacao" jsonb,
	"nc_id" uuid,
	"nc_numero" varchar(20),
	"status" varchar(10) DEFAULT 'aberta' NOT NULL,
	"causas" text,
	"acoes" text,
	"remediacao" text
);
--> statement-breakpoint
CREATE TABLE "producao" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"competencia" varchar(7) NOT NULL,
	"quantidade" double precision NOT NULL,
	"unidade" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programas_ambientais" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(150) NOT NULL,
	"objetivo" varchar(1000) NOT NULL,
	"indicador" varchar(25) NOT NULL,
	"unidade_manual" varchar(20),
	"linha_de_base" double precision NOT NULL,
	"ano_base" smallint NOT NULL,
	"meta" double precision NOT NULL,
	"prazo" date NOT NULL,
	"responsavel" varchar(120) NOT NULL,
	"acoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"medicoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"encerrado" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"empresa_id" uuid NOT NULL,
	"nome" varchar(30) NOT NULL,
	"ultimo" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saidas_residuo" ADD COLUMN "transportador_id" uuid;--> statement-breakpoint
ALTER TABLE "saidas_residuo" ADD COLUMN "destinador_id" uuid;--> statement-breakpoint
ALTER TABLE "saidas_residuo" ADD COLUMN "custo" double precision;--> statement-breakpoint
CREATE UNIQUE INDEX "ocorrencias_numero" ON "ocorrencias_ambientais" USING btree ("empresa_id","numero");--> statement-breakpoint
CREATE UNIQUE INDEX "producao_mes_unico" ON "producao" USING btree ("empresa_id","competencia");--> statement-breakpoint
CREATE UNIQUE INDEX "sequencias_unica" ON "sequencias" USING btree ("empresa_id","nome");