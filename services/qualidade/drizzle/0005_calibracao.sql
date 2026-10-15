CREATE TABLE "calibracoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"instrumento_id" uuid NOT NULL,
	"data" date NOT NULL,
	"laboratorio" varchar(120) NOT NULL,
	"certificado" varchar(60),
	"aprovada" boolean NOT NULL,
	"erro_encontrado" varchar(200),
	"observacao" text,
	"custo" numeric(18, 2),
	"anulada" boolean DEFAULT false NOT NULL,
	"motivo_anulacao" varchar(300),
	"anulada_por" uuid
);
--> statement-breakpoint
CREATE TABLE "instrumentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tag" varchar(30) NOT NULL,
	"descricao" varchar(150) NOT NULL,
	"fabricante" varchar(80),
	"modelo" varchar(80),
	"numero_serie" varchar(60),
	"local" varchar(120),
	"responsavel" varchar(120),
	"faixa" varchar(80),
	"criterio_aceitacao" varchar(200),
	"frequencia_meses" smallint NOT NULL,
	"em_uso" boolean DEFAULT true NOT NULL,
	CONSTRAINT "instrumentos_tag_por_empresa" UNIQUE("empresa_id","tag"),
	CONSTRAINT "instrumentos_frequencia" CHECK ("instrumentos"."frequencia_meses" BETWEEN 1 AND 60)
);
--> statement-breakpoint
ALTER TABLE "calibracoes" ADD CONSTRAINT "calibracoes_instrumento_id_instrumentos_id_fk" FOREIGN KEY ("instrumento_id") REFERENCES "instrumentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calibracoes_instrumento_data_idx" ON "calibracoes" USING btree ("instrumento_id","data");