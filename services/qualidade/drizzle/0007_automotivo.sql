CREATE TABLE "fmeas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"item" varchar(150) NOT NULL,
	"cliente" varchar(150),
	"equipe" varchar(300),
	"revisao" varchar(20),
	"linhas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "fmeas_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "planos_de_controle" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"item" varchar(150) NOT NULL,
	"fase" varchar(20) NOT NULL,
	"revisao" varchar(20),
	"fmea_id" uuid,
	"linhas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "planos_de_controle_numero_por_empresa" UNIQUE("empresa_id","numero")
);
--> statement-breakpoint
CREATE TABLE "ppaps" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"peca" varchar(150) NOT NULL,
	"numero_da_peca" varchar(60) NOT NULL,
	"revisao_do_desenho" varchar(20),
	"cliente" varchar(150) NOT NULL,
	"nivel" smallint NOT NULL,
	"motivo" varchar(25) NOT NULL,
	"fmea_id" uuid,
	"plano_de_controle_id" uuid,
	"elementos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(25) DEFAULT 'em_preparacao' NOT NULL,
	"submetido_em" date,
	"parecer" varchar(1000),
	"decidido_em" timestamp (3) with time zone,
	CONSTRAINT "ppaps_numero_por_empresa" UNIQUE("empresa_id","numero"),
	CONSTRAINT "ppaps_nivel" CHECK ("ppaps"."nivel" BETWEEN 1 AND 5)
);
--> statement-breakpoint
ALTER TABLE "planos_de_controle" ADD CONSTRAINT "planos_de_controle_fmea_id_fmeas_id_fk" FOREIGN KEY ("fmea_id") REFERENCES "fmeas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppaps" ADD CONSTRAINT "ppaps_fmea_id_fmeas_id_fk" FOREIGN KEY ("fmea_id") REFERENCES "fmeas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppaps" ADD CONSTRAINT "ppaps_plano_de_controle_id_planos_de_controle_id_fk" FOREIGN KEY ("plano_de_controle_id") REFERENCES "planos_de_controle"("id") ON DELETE no action ON UPDATE no action;