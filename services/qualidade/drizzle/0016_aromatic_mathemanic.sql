CREATE TABLE "processos_eventos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"processo_id" uuid NOT NULL,
	"acao" varchar(20) NOT NULL,
	"usuario_nome" varchar(120),
	"comentario" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "processos_eventos" ADD CONSTRAINT "processos_eventos_processo_id_processos_id_fk" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processos_eventos_processo_idx" ON "processos_eventos" USING btree ("processo_id","criado_em");