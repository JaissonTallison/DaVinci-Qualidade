CREATE TABLE "evidencias_proprias" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"norma" varchar(15) NOT NULL,
	"clausula" varchar(20) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"tipo" varchar(12) NOT NULL,
	"risco" varchar(6) NOT NULL,
	"o_que_pedir" varchar(500) NOT NULL,
	"exemplo" varchar(500) NOT NULL
);
