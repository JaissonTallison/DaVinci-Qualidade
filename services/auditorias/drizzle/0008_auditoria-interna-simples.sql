CREATE TABLE "auditorias_simples" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"data" date NOT NULL,
	"horario" varchar(20),
	"unidade" varchar(120),
	"setores_envolvidos" varchar(300),
	"auditores" varchar(300),
	"area_foco" varchar(1000),
	"linhas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "auditorias_simples_numero_por_empresa" UNIQUE("empresa_id","numero")
);
