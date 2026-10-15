CREATE TABLE "consumos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"fonte" varchar(15) NOT NULL,
	"competencia" varchar(7) NOT NULL,
	"quantidade" double precision NOT NULL,
	"custo" double precision
);
--> statement-breakpoint
CREATE TABLE "fatores_emissao" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"fonte" varchar(15) NOT NULL,
	"ano" smallint NOT NULL,
	"fator" double precision NOT NULL,
	"referencia" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoramentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tipo" varchar(10) NOT NULL,
	"ponto" varchar(150) NOT NULL,
	"parametro" varchar(100) NOT NULL,
	"unidade" varchar(20) NOT NULL,
	"limite_minimo" double precision,
	"limite_maximo" double precision,
	"referencia" varchar(200),
	"periodicidade_meses" smallint NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos_quimicos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(150) NOT NULL,
	"fabricante" varchar(150) NOT NULL,
	"cas" varchar(15),
	"perigos" varchar(15)[] DEFAULT '{}' NOT NULL,
	"local" varchar(150) NOT NULL,
	"quantidade_maxima" double precision,
	"unidade" varchar(4) NOT NULL,
	"fds_revisao" date NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resultados_monitoramento" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"monitoramento_id" uuid NOT NULL,
	"data" date NOT NULL,
	"valor" double precision NOT NULL,
	"laudo" varchar(100)
);
--> statement-breakpoint
ALTER TABLE "resultados_monitoramento" ADD CONSTRAINT "resultados_monitoramento_monitoramento_id_monitoramentos_id_fk" FOREIGN KEY ("monitoramento_id") REFERENCES "monitoramentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "consumos_mes_unico" ON "consumos" USING btree ("empresa_id","fonte","competencia");--> statement-breakpoint
CREATE UNIQUE INDEX "fatores_ano_unico" ON "fatores_emissao" USING btree ("empresa_id","fonte","ano");--> statement-breakpoint
CREATE INDEX "resultados_monitoramento_idx" ON "resultados_monitoramento" USING btree ("monitoramento_id","data");