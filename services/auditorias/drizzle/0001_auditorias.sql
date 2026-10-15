CREATE TABLE "auditorias" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"escopo" text NOT NULL,
	"normas" text[] DEFAULT '{}'::text[] NOT NULL,
	"areas" varchar(300),
	"auditor_lider" varchar(120) NOT NULL,
	"equipe" varchar(300),
	"representante" varchar(120),
	"data_inicio" date NOT NULL,
	"data_fim" date NOT NULL,
	"status" varchar(15) DEFAULT 'planejada' NOT NULL,
	"conclusao" text,
	"concluida_em" timestamp (3) with time zone,
	"motivo_cancelamento" varchar(500),
	"cancelada_em" timestamp (3) with time zone,
	CONSTRAINT "auditorias_numero_por_empresa" UNIQUE("empresa_id","numero"),
	CONSTRAINT "auditorias_status" CHECK ("auditorias"."status" IN ('planejada', 'em_andamento', 'concluida', 'cancelada')),
	CONSTRAINT "auditorias_datas" CHECK ("auditorias"."data_fim" >= "auditorias"."data_inicio")
);
--> statement-breakpoint
CREATE TABLE "constatacoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"auditoria_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"tipo" varchar(15) NOT NULL,
	"norma" varchar(15) NOT NULL,
	"clausula" varchar(20),
	"area" varchar(120),
	"descricao" text NOT NULL,
	"evidencia" text,
	"nc_id" uuid,
	"nc_numero" varchar(20),
	CONSTRAINT "constatacoes_tipo" CHECK ("constatacoes"."tipo" IN ('conformidade', 'nc_maior', 'nc_menor', 'observacao', 'oportunidade'))
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"empresa_id" uuid NOT NULL,
	"nome" varchar(30) NOT NULL,
	"ultimo" integer NOT NULL,
	CONSTRAINT "sequencias_empresa_id_nome_pk" PRIMARY KEY("empresa_id","nome")
);
--> statement-breakpoint
ALTER TABLE "constatacoes" ADD CONSTRAINT "constatacoes_auditoria_id_auditorias_id_fk" FOREIGN KEY ("auditoria_id") REFERENCES "auditorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auditorias_empresa_status_idx" ON "auditorias" USING btree ("empresa_id","status","data_inicio");--> statement-breakpoint
CREATE INDEX "constatacoes_auditoria_idx" ON "constatacoes" USING btree ("auditoria_id","ordem");