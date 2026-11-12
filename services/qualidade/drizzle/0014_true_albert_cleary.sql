CREATE TABLE "processos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"codigo" varchar(30) NOT NULL,
	"nome" varchar(150) NOT NULL,
	"descricao" text,
	"objetivo" text,
	"escopo" text,
	"unidade" varchar(120),
	"departamento" varchar(120),
	"gestor" varchar(120),
	"elaborado_por" varchar(120) NOT NULL,
	"normas" varchar(300),
	"status" varchar(20) DEFAULT 'em_elaboracao' NOT NULL,
	"revisao_atual" integer DEFAULT 0 NOT NULL,
	"conteudo" jsonb,
	"o_que_mudou_pendente" varchar(500),
	"aprovado_por" uuid,
	"aprovado_por_nome" varchar(120),
	"aprovado_em" timestamp (3) with time zone,
	"publicado_em" timestamp (3) with time zone,
	"data_proxima_revisao" date,
	"motivo_encerramento" varchar(500),
	CONSTRAINT "processos_codigo_por_empresa" UNIQUE("empresa_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "processos_revisoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"processo_id" uuid NOT NULL,
	"revisao" integer NOT NULL,
	"o_que_mudou" varchar(500) NOT NULL,
	"elaborado_por" varchar(120) NOT NULL,
	"aprovado_por_nome" varchar(120),
	"aprovado_em" timestamp (3) with time zone NOT NULL,
	"conteudo" jsonb,
	CONSTRAINT "processos_revisao_por_processo" UNIQUE("processo_id","revisao")
);
--> statement-breakpoint
ALTER TABLE "processos_revisoes" ADD CONSTRAINT "processos_revisoes_processo_id_processos_id_fk" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processos_empresa_status_idx" ON "processos" USING btree ("empresa_id","status");--> statement-breakpoint
CREATE INDEX "processos_revisoes_processo_idx" ON "processos_revisoes" USING btree ("processo_id");