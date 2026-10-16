CREATE TABLE "modelos_nc_proprios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"norma" varchar(15) NOT NULL,
	"clausula" varchar(20) NOT NULL,
	"tipo" varchar(15) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"descricao" varchar(1000) NOT NULL,
	"causa_raiz" varchar(500) NOT NULL,
	"acao_corretiva" varchar(500) NOT NULL,
	"evidencia_fechamento" varchar(500) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "perguntas_da_auditoria" ADD COLUMN "objetivo" varchar(300);--> statement-breakpoint
ALTER TABLE "perguntas_proprias" ADD COLUMN "objetivo" varchar(300);