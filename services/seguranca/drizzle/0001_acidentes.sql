CREATE TABLE "acidentes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"data" date NOT NULL,
	"hora" varchar(5),
	"local" varchar(150) NOT NULL,
	"setor" varchar(100),
	"acidentado" varchar(120),
	"funcao" varchar(100),
	"descricao" text NOT NULL,
	"lesao" varchar(200),
	"parte_do_corpo" varchar(100),
	"agente_causador" varchar(200),
	"dias_perdidos" integer DEFAULT 0 NOT NULL,
	"dias_debitados" integer DEFAULT 0 NOT NULL,
	"medidas_imediatas" text,
	"testemunhas" varchar(500),
	"cat_numero" varchar(30),
	"cat_data" date,
	"status" varchar(20) DEFAULT 'registrado' NOT NULL,
	"causas" text,
	"medidas" text,
	"motivo_cancelamento" varchar(500),
	CONSTRAINT "acidentes_numero_por_empresa" UNIQUE("empresa_id","numero"),
	CONSTRAINT "acidentes_status" CHECK ("acidentes"."status" IN ('registrado', 'em_investigacao', 'concluido', 'cancelado')),
	CONSTRAINT "acidentes_tipo" CHECK ("acidentes"."tipo" IN ('com_afastamento', 'sem_afastamento', 'incidente', 'quase_acidente')),
	CONSTRAINT "acidentes_dias" CHECK ("acidentes"."dias_perdidos" >= 0 AND "acidentes"."dias_debitados" >= 0)
);
--> statement-breakpoint
CREATE TABLE "horas_trabalhadas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"competencia" varchar(7) NOT NULL,
	"horas" numeric(14, 2) NOT NULL,
	CONSTRAINT "horas_trabalhadas_competencia_por_empresa" UNIQUE("empresa_id","competencia")
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"empresa_id" uuid NOT NULL,
	"nome" varchar(30) NOT NULL,
	"ultimo" integer NOT NULL,
	CONSTRAINT "sequencias_empresa_id_nome_pk" PRIMARY KEY("empresa_id","nome")
);
--> statement-breakpoint
CREATE INDEX "acidentes_empresa_data_idx" ON "acidentes" USING btree ("empresa_id","data");