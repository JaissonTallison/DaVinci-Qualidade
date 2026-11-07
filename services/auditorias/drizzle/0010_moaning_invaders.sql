CREATE TABLE "programacao_auditorias" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"ano" integer NOT NULL,
	"setor" varchar(150) NOT NULL,
	"normas" text[] DEFAULT '{}'::text[] NOT NULL,
	"frequencia" varchar(15) NOT NULL,
	"meses" integer[] DEFAULT '{}'::int[] NOT NULL,
	"responsavel" varchar(120) NOT NULL,
	"observacoes" text,
	CONSTRAINT "programacao_auditorias_frequencia" CHECK ("programacao_auditorias"."frequencia" IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'pontual'))
);
--> statement-breakpoint
ALTER TABLE "auditorias" ADD COLUMN "programacao_id" uuid;--> statement-breakpoint
CREATE INDEX "programacao_auditorias_empresa_ano_idx" ON "programacao_auditorias" USING btree ("empresa_id","ano");--> statement-breakpoint
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_programacao_id_programacao_auditorias_id_fk" FOREIGN KEY ("programacao_id") REFERENCES "programacao_auditorias"("id") ON DELETE no action ON UPDATE no action;