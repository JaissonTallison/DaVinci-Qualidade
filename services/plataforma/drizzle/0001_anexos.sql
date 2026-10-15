CREATE TABLE "anexos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"registro" varchar(30) NOT NULL,
	"registro_id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"tamanho" integer NOT NULL,
	"descricao" varchar(200),
	"conteudo" "bytea" NOT NULL,
	"removido_em" timestamp (3) with time zone,
	"removido_por" uuid
);
--> statement-breakpoint
CREATE INDEX "anexos_registro_idx" ON "anexos" USING btree ("empresa_id","registro","registro_id");