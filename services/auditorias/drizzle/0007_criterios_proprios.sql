CREATE TABLE "criterios_proprios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tipo" varchar(25) NOT NULL,
	"nome" varchar(150) NOT NULL,
	"referencia" varchar(150),
	"requisitos" varchar(2000) NOT NULL
);
