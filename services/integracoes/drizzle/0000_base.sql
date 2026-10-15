CREATE TABLE "consultas_cache" (
	"tipo" varchar(10) NOT NULL,
	"chave" varchar(14) NOT NULL,
	"dados" jsonb,
	"fonte" varchar(40) NOT NULL,
	"consultado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultas_cache_tipo_chave_pk" PRIMARY KEY("tipo","chave")
);
