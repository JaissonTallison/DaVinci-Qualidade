CREATE TABLE "listas_cadastro" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"lista" varchar(30) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "listas_cadastro_nome_por_empresa" UNIQUE("empresa_id","lista","nome")
);
