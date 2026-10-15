CREATE TABLE "avisos_enviados" (
	"empresa_id" uuid NOT NULL,
	"data" date NOT NULL,
	"emails" integer NOT NULL,
	"enviado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avisos_enviados_empresa_id_data_pk" PRIMARY KEY("empresa_id","data")
);
