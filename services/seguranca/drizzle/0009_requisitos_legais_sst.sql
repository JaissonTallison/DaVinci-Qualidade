CREATE TABLE "requisitos_legais_sst" (
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
