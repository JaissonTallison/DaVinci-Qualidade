CREATE TABLE "andamentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"tema_id" uuid NOT NULL,
	"data" date NOT NULL,
	"progresso" smallint NOT NULL,
	"comentario" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"codigo_catalogo" varchar(5),
	"nome" varchar(150) NOT NULL,
	"pilar" varchar(12) NOT NULL,
	"descricao" varchar(500),
	"ods" smallint[] DEFAULT '{}' NOT NULL,
	"impacto" smallint,
	"relevancia" smallint,
	"responsavel" varchar(120),
	"meta" varchar(300),
	"prazo_meta" date,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "andamentos" ADD CONSTRAINT "andamentos_tema_id_temas_id_fk" FOREIGN KEY ("tema_id") REFERENCES "temas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "andamentos_tema_idx" ON "andamentos" USING btree ("tema_id","data");--> statement-breakpoint
CREATE UNIQUE INDEX "temas_catalogo_unico" ON "temas" USING btree ("empresa_id","codigo_catalogo");