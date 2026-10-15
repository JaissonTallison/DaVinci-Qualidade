CREATE TABLE "inspecoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"numero" varchar(20) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"objeto" varchar(200) NOT NULL,
	"lote" varchar(60),
	"local" varchar(120),
	"quantidade" integer,
	"inspetor" varchar(120) NOT NULL,
	"data" date NOT NULL,
	"modelo_id" uuid,
	"modelo_nome" varchar(120),
	"observacoes" text,
	"status" varchar(15) DEFAULT 'em_andamento' NOT NULL,
	"concluida_em" timestamp (3) with time zone,
	"concluida_por" uuid,
	"motivo_cancelamento" varchar(500),
	"cancelada_em" timestamp (3) with time zone,
	"cancelada_por" uuid,
	CONSTRAINT "inspecoes_numero_por_empresa" UNIQUE("empresa_id","numero"),
	CONSTRAINT "inspecoes_status" CHECK ("inspecoes"."status" IN ('em_andamento', 'aprovada', 'reprovada', 'cancelada'))
);
--> statement-breakpoint
CREATE TABLE "inspecoes_itens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"inspecao_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"verificar" varchar(300) NOT NULL,
	"criterio" varchar(300),
	"resposta" varchar(3),
	"observacao" text,
	CONSTRAINT "inspecoes_itens_resposta" CHECK ("inspecoes_itens"."resposta" IS NULL OR "inspecoes_itens"."resposta" IN ('ok', 'nok', 'na'))
);
--> statement-breakpoint
CREATE TABLE "modelos_inspecao" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(120) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"itens" jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "modelos_inspecao_nome_por_empresa" UNIQUE("empresa_id","nome")
);
--> statement-breakpoint
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_modelo_id_modelos_inspecao_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "modelos_inspecao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspecoes_itens" ADD CONSTRAINT "inspecoes_itens_inspecao_id_inspecoes_id_fk" FOREIGN KEY ("inspecao_id") REFERENCES "inspecoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspecoes_empresa_status_data_idx" ON "inspecoes" USING btree ("empresa_id","status","data");--> statement-breakpoint
CREATE INDEX "inspecoes_itens_inspecao_idx" ON "inspecoes_itens" USING btree ("inspecao_id","ordem");