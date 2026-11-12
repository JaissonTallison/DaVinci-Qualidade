CREATE TABLE "documentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"codigo" varchar(30) NOT NULL,
	"titulo" varchar(150) NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"area" varchar(120),
	"elaborado_por" varchar(120) NOT NULL,
	"status" varchar(15) DEFAULT 'rascunho' NOT NULL,
	"revisao_atual" integer DEFAULT 0 NOT NULL,
	"o_que_mudou_pendente" varchar(500),
	"aprovado_por" uuid,
	"aprovado_por_nome" varchar(120),
	"aprovado_em" timestamp (3) with time zone,
	"data_vigencia" date,
	"proxima_revisao" date,
	"motivo_obsolescencia" varchar(500),
	CONSTRAINT "documentos_codigo_por_empresa" UNIQUE("empresa_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "documentos_revisoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"documento_id" uuid NOT NULL,
	"revisao" integer NOT NULL,
	"o_que_mudou" varchar(500) NOT NULL,
	"elaborado_por" varchar(120) NOT NULL,
	"aprovado_por_nome" varchar(120),
	"aprovado_em" timestamp (3) with time zone NOT NULL,
	"data_vigencia" date,
	"proxima_revisao" date,
	CONSTRAINT "documentos_revisao_por_documento" UNIQUE("documento_id","revisao")
);
--> statement-breakpoint
ALTER TABLE "documentos_revisoes" ADD CONSTRAINT "documentos_revisoes_documento_id_documentos_id_fk" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documentos_empresa_status_idx" ON "documentos" USING btree ("empresa_id","status");--> statement-breakpoint
CREATE INDEX "documentos_revisoes_documento_idx" ON "documentos_revisoes" USING btree ("documento_id");