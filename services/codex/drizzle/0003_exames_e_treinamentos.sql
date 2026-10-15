CREATE TABLE "asos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcionario_id" uuid NOT NULL,
	"tipo" varchar(25) NOT NULL,
	"data" date NOT NULL,
	"resultado" varchar(25) NOT NULL,
	"proximo_exame" date,
	"medico" varchar(120),
	"crm" varchar(20),
	"observacao" varchar(300),
	"motivo_anulacao" varchar(300)
);
--> statement-breakpoint
CREATE TABLE "treinamentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(120) NOT NULL,
	"norma" varchar(30),
	"carga_horaria" smallint NOT NULL,
	"validade_meses" smallint,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "treinamentos_nome_por_empresa" UNIQUE("empresa_id","nome")
);
--> statement-breakpoint
CREATE TABLE "treinamentos_realizados" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcionario_id" uuid NOT NULL,
	"treinamento_id" uuid NOT NULL,
	"data" date NOT NULL,
	"validade" date,
	"instrutor" varchar(120),
	"motivo_anulacao" varchar(300)
);
--> statement-breakpoint
ALTER TABLE "asos" ADD CONSTRAINT "asos_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treinamentos_realizados" ADD CONSTRAINT "treinamentos_realizados_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treinamentos_realizados" ADD CONSTRAINT "treinamentos_realizados_treinamento_id_treinamentos_id_fk" FOREIGN KEY ("treinamento_id") REFERENCES "treinamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asos_funcionario_idx" ON "asos" USING btree ("empresa_id","funcionario_id","data");--> statement-breakpoint
CREATE INDEX "treinamentos_realizados_funcionario_idx" ON "treinamentos_realizados" USING btree ("empresa_id","funcionario_id","data");