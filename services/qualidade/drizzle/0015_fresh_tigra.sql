CREATE TABLE "processos_vinculos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"processo_id" uuid NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"registro_id" uuid NOT NULL,
	"rotulo" varchar(200) NOT NULL,
	CONSTRAINT "processos_vinculo_unico" UNIQUE("processo_id","tipo","registro_id")
);
--> statement-breakpoint
ALTER TABLE "processos_vinculos" ADD CONSTRAINT "processos_vinculos_processo_id_processos_id_fk" FOREIGN KEY ("processo_id") REFERENCES "processos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processos_vinculos_processo_idx" ON "processos_vinculos" USING btree ("processo_id");