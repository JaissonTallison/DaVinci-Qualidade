CREATE TABLE "recuperacoes_senha" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"ip" varchar(45),
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp (3) with time zone NOT NULL,
	"usado_em" timestamp (3) with time zone,
	CONSTRAINT "recuperacoes_senha_token" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "recuperacoes_senha_usuario_idx" ON "recuperacoes_senha" USING btree ("usuario_id","criado_em");