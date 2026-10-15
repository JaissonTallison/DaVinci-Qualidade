CREATE TABLE "chaves_api" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"nome" varchar(80) NOT NULL,
	"prefixo" varchar(12) NOT NULL,
	"hash" varchar(64) NOT NULL,
	"criada_por" uuid,
	"criada_por_nome" text,
	"criada_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"ultimo_uso" timestamp (3) with time zone,
	"revogada" boolean DEFAULT false NOT NULL,
	CONSTRAINT "chaves_api_hash" UNIQUE("hash")
);
--> statement-breakpoint
CREATE INDEX "chaves_api_empresa_idx" ON "chaves_api" USING btree ("empresa_id");