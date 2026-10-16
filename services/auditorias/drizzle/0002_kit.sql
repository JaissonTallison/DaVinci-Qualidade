CREATE TABLE "itens_do_kit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"auditoria_id" uuid NOT NULL,
	"codigo" varchar(10) NOT NULL,
	"status" varchar(15) NOT NULL,
	CONSTRAINT "itens_do_kit_por_auditoria" UNIQUE("auditoria_id","codigo")
);
--> statement-breakpoint
ALTER TABLE "itens_do_kit" ADD CONSTRAINT "itens_do_kit_auditoria_id_auditorias_id_fk" FOREIGN KEY ("auditoria_id") REFERENCES "auditorias"("id") ON DELETE no action ON UPDATE no action;