CREATE TABLE "funcao_epis" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcao_id" uuid NOT NULL,
	"epi_id" uuid NOT NULL,
	"risco_id" uuid,
	CONSTRAINT "funcao_epis_unico" UNIQUE("empresa_id","funcao_id","epi_id")
);
--> statement-breakpoint
ALTER TABLE "funcao_epis" ADD CONSTRAINT "funcao_epis_epi_id_epis_id_fk" FOREIGN KEY ("epi_id") REFERENCES "epis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcao_epis" ADD CONSTRAINT "funcao_epis_risco_id_riscos_id_fk" FOREIGN KEY ("risco_id") REFERENCES "riscos"("id") ON DELETE no action ON UPDATE no action;