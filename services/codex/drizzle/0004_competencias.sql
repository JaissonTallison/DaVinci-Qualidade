CREATE TABLE "funcao_treinamentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcao_id" uuid NOT NULL,
	"treinamento_id" uuid NOT NULL,
	CONSTRAINT "funcao_treinamentos_unico" UNIQUE("empresa_id","funcao_id","treinamento_id")
);
--> statement-breakpoint
ALTER TABLE "funcao_treinamentos" ADD CONSTRAINT "funcao_treinamentos_funcao_id_funcoes_id_fk" FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcao_treinamentos" ADD CONSTRAINT "funcao_treinamentos_treinamento_id_treinamentos_id_fk" FOREIGN KEY ("treinamento_id") REFERENCES "treinamentos"("id") ON DELETE no action ON UPDATE no action;