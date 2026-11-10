CREATE TABLE "relatorios_nc" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nc_id" uuid NOT NULL,
	"versao" integer NOT NULL,
	"emitido_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"emitido_por_nome" varchar(120),
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "relatorios_nc_versao" UNIQUE("nc_id","versao")
);
--> statement-breakpoint
ALTER TABLE "relatorios_nc" ADD CONSTRAINT "relatorios_nc_nc_id_nao_conformidades_id_fk" FOREIGN KEY ("nc_id") REFERENCES "nao_conformidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "relatorios_nc_nc_idx" ON "relatorios_nc" USING btree ("nc_id");