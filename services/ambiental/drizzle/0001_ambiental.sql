CREATE TABLE "aspectos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"atividade" varchar(150) NOT NULL,
	"aspecto" varchar(200) NOT NULL,
	"impacto" varchar(200) NOT NULL,
	"situacao" varchar(15) NOT NULL,
	"incidencia" varchar(10) NOT NULL,
	"severidade" smallint NOT NULL,
	"frequencia" smallint NOT NULL,
	"requisito_legal" boolean DEFAULT false NOT NULL,
	"controles" varchar(1000),
	"acoes" varchar(1000),
	"responsavel" varchar(120),
	"prazo" date,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condicionantes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"licenca_id" uuid NOT NULL,
	"descricao" varchar(500) NOT NULL,
	"prazo" date,
	"periodicidade_meses" smallint,
	"cumprida_em" date,
	"evidencia" varchar(300)
);
--> statement-breakpoint
CREATE TABLE "licencas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tipo" varchar(15) NOT NULL,
	"numero" varchar(60) NOT NULL,
	"orgao" varchar(120) NOT NULL,
	"descricao" varchar(300),
	"emissao" date NOT NULL,
	"validade" date NOT NULL,
	"dias_para_renovar" smallint NOT NULL,
	"renovacao_protocolo" varchar(60),
	"renovacao_data" date
);
--> statement-breakpoint
CREATE TABLE "requisitos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"norma" varchar(200) NOT NULL,
	"esfera" varchar(15) NOT NULL,
	"tema" varchar(100) NOT NULL,
	"requisito" varchar(1000) NOT NULL,
	"atendimento" varchar(15) DEFAULT 'nao_avaliado' NOT NULL,
	"ultima_avaliacao" date,
	"evidencia" varchar(500),
	"acao" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "residuos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(150) NOT NULL,
	"classe" varchar(4) NOT NULL,
	"origem" varchar(150) NOT NULL,
	"acondicionamento" varchar(150) NOT NULL,
	"destinacao" varchar(150) NOT NULL,
	"unidade" varchar(4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saidas_residuo" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"residuo_id" uuid NOT NULL,
	"data" date NOT NULL,
	"quantidade" double precision NOT NULL,
	"mtr" varchar(40) NOT NULL,
	"transportador" varchar(150) NOT NULL,
	"destinador" varchar(150) NOT NULL,
	"cdf_numero" varchar(40),
	"cdf_data" date,
	"cdf_registrado_em" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_licenca_id_licencas_id_fk" FOREIGN KEY ("licenca_id") REFERENCES "licencas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saidas_residuo" ADD CONSTRAINT "saidas_residuo_residuo_id_residuos_id_fk" FOREIGN KEY ("residuo_id") REFERENCES "residuos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aspectos_empresa_idx" ON "aspectos" USING btree ("empresa_id","ativo");--> statement-breakpoint
CREATE INDEX "condicionantes_licenca_idx" ON "condicionantes" USING btree ("licenca_id");--> statement-breakpoint
CREATE INDEX "saidas_residuo_idx" ON "saidas_residuo" USING btree ("empresa_id","residuo_id","data");