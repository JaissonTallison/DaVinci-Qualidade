CREATE TABLE "funcionarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"matricula" varchar(20) NOT NULL,
	"nome" varchar(120) NOT NULL,
	"cpf" char(11) NOT NULL,
	"setor_id" uuid NOT NULL,
	"funcao_id" uuid NOT NULL,
	"admissao" date NOT NULL,
	"email" varchar(150),
	"telefone" varchar(11),
	"ativo" boolean DEFAULT true NOT NULL,
	"desligamento" date,
	"motivo_desligamento" varchar(300),
	CONSTRAINT "funcionarios_matricula_por_empresa" UNIQUE("empresa_id","matricula"),
	CONSTRAINT "funcionarios_cpf_por_empresa" UNIQUE("empresa_id","cpf"),
	CONSTRAINT "funcionarios_desligamento" CHECK ("funcionarios"."desligamento" IS NULL OR "funcionarios"."desligamento" >= "funcionarios"."admissao")
);
--> statement-breakpoint
CREATE TABLE "funcoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(100) NOT NULL,
	"cbo" char(6),
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "funcoes_nome_por_empresa" UNIQUE("empresa_id","nome")
);
--> statement-breakpoint
CREATE TABLE "setores_empresa" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(100) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "setores_empresa_nome_por_empresa" UNIQUE("empresa_id","nome")
);
--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_setor_id_setores_empresa_id_fk" FOREIGN KEY ("setor_id") REFERENCES "setores_empresa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_funcao_id_funcoes_id_fk" FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "funcionarios_empresa_nome_idx" ON "funcionarios" USING btree ("empresa_id","nome");