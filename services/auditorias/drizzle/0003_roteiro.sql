CREATE TABLE "perguntas_da_auditoria" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"auditoria_id" uuid NOT NULL,
	"codigo" varchar(40) NOT NULL,
	"origem" varchar(10) NOT NULL,
	"ordem" smallint NOT NULL,
	"processo" varchar(25) NOT NULL,
	"norma" varchar(15) NOT NULL,
	"clausula" varchar(20) NOT NULL,
	"pergunta" varchar(300) NOT NULL,
	"resposta_esperada" varchar(500) NOT NULL,
	"sinal_de_alerta" varchar(500) NOT NULL,
	"resposta" varchar(15) DEFAULT 'pendente' NOT NULL,
	"evidencia" text,
	"respondida_em" timestamp (3) with time zone,
	CONSTRAINT "perguntas_da_auditoria_unica" UNIQUE("auditoria_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "perguntas_proprias" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"processo" varchar(25) NOT NULL,
	"norma" varchar(15) NOT NULL,
	"clausula" varchar(20) NOT NULL,
	"pergunta" varchar(300) NOT NULL,
	"resposta_esperada" varchar(500) NOT NULL,
	"sinal_de_alerta" varchar(500) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "perguntas_da_auditoria" ADD CONSTRAINT "perguntas_da_auditoria_auditoria_id_auditorias_id_fk" FOREIGN KEY ("auditoria_id") REFERENCES "auditorias"("id") ON DELETE no action ON UPDATE no action;