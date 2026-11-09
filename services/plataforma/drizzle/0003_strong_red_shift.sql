CREATE TABLE "notificacoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"usuario_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"descricao" varchar(500),
	"modulo" varchar(20),
	"href" varchar(300),
	"lida" boolean DEFAULT false NOT NULL,
	"mencao" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notificacoes_usuario_idx" ON "notificacoes" USING btree ("empresa_id","usuario_id","lida");