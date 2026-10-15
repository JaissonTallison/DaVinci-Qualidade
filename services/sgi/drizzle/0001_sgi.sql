CREATE TABLE "analises_criticas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"data" date NOT NULL,
	"participantes" varchar(500) NOT NULL,
	"entradas" varchar(6000) NOT NULL,
	"decisoes" varchar(4000) NOT NULL,
	"proxima_analise" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"objetivo_id" uuid NOT NULL,
	"competencia" char(7) NOT NULL,
	"valor" double precision NOT NULL,
	"analise" varchar(500),
	CONSTRAINT "medicoes_por_competencia" UNIQUE("objetivo_id","competencia")
);
--> statement-breakpoint
CREATE TABLE "mudancas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"descricao" varchar(1000) NOT NULL,
	"motivo" varchar(500) NOT NULL,
	"impactos" varchar(1000) NOT NULL,
	"responsavel" varchar(120) NOT NULL,
	"data_prevista" date NOT NULL,
	"status" varchar(15) DEFAULT 'proposta' NOT NULL,
	"parecer" varchar(500),
	"decidida_por" uuid,
	"decidida_em" timestamp (3) with time zone,
	"verificacao" varchar(500),
	"implementada_em" timestamp (3) with time zone,
	CONSTRAINT "mudancas_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "objetivos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(200) NOT NULL,
	"indicador" varchar(150) NOT NULL,
	"unidade" varchar(20) NOT NULL,
	"meta" double precision NOT NULL,
	"sentido" varchar(10) NOT NULL,
	"responsavel" varchar(120) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riscos_oportunidades" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tipo" varchar(15) NOT NULL,
	"processo" varchar(120) NOT NULL,
	"descricao" varchar(500) NOT NULL,
	"contexto" varchar(500),
	"probabilidade" smallint NOT NULL,
	"impacto" smallint NOT NULL,
	"acao" varchar(1000),
	"responsavel" varchar(120),
	"prazo" date,
	"resultado" varchar(500),
	"encerrado_em" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"empresa_id" uuid NOT NULL,
	"nome" varchar(30) NOT NULL,
	"ultimo" integer NOT NULL,
	CONSTRAINT "sequencias_empresa_id_nome_pk" PRIMARY KEY("empresa_id","nome")
);
--> statement-breakpoint
ALTER TABLE "medicoes" ADD CONSTRAINT "medicoes_objetivo_id_objetivos_id_fk" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ros_empresa_idx" ON "riscos_oportunidades" USING btree ("empresa_id","encerrado_em");