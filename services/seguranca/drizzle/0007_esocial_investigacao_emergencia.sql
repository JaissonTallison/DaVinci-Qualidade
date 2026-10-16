CREATE TABLE "brigadistas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcionario_id" uuid NOT NULL,
	"nome" varchar(120) NOT NULL,
	"setor" varchar(100) NOT NULL,
	"papel" varchar(15) NOT NULL,
	"turno" varchar(40),
	"treinado_em" date NOT NULL,
	CONSTRAINT "brigadistas_funcionario" UNIQUE("empresa_id","funcionario_id")
);
--> statement-breakpoint
CREATE TABLE "configuracao_esocial" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"dados" jsonb NOT NULL,
	CONSTRAINT "configuracao_esocial_por_empresa" UNIQUE("empresa_id")
);
--> statement-breakpoint
CREATE TABLE "equipamentos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"categoria" varchar(20) NOT NULL,
	"identificacao" varchar(60) NOT NULL,
	"local" varchar(150) NOT NULL,
	"detalhes" varchar(300),
	"inspecao_dias" smallint NOT NULL,
	"ultima_inspecao" date,
	"ultima_recarga" date,
	"ultimo_teste" date,
	"pendencia" varchar(500),
	"inspecoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "equipamentos_identificacao" UNIQUE("empresa_id","categoria","identificacao")
);
--> statement-breakpoint
CREATE TABLE "eventos_esocial" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"evento" varchar(6) NOT NULL,
	"referencia_id" uuid NOT NULL,
	"descricao" varchar(200) NOT NULL,
	"funcionario_nome" varchar(120),
	"id_do_evento" varchar(36) NOT NULL,
	"xml" text NOT NULL,
	"recibo" varchar(40),
	"enviado_em" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "funcao_riscos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcao_id" uuid NOT NULL,
	"risco_id" uuid NOT NULL,
	CONSTRAINT "funcao_riscos_unico" UNIQUE("empresa_id","funcao_id","risco_id")
);
--> statement-breakpoint
CREATE TABLE "ordens_sst" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"funcao_id" uuid NOT NULL,
	"atividades" text NOT NULL,
	"procedimentos" text NOT NULL,
	"proibicoes" text NOT NULL,
	"emergencia" text,
	CONSTRAINT "ordens_sst_por_funcao" UNIQUE("empresa_id","funcao_id")
);
--> statement-breakpoint
CREATE TABLE "planos_de_emergencia" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"dados" jsonb NOT NULL,
	CONSTRAINT "planos_de_emergencia_por_empresa" UNIQUE("empresa_id")
);
--> statement-breakpoint
ALTER TABLE "acidentes" ADD COLUMN "investigacao" jsonb DEFAULT '{"testemunhas":[],"porques":[],"fatos":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "acidentes" ADD COLUMN "dados_cat" jsonb;--> statement-breakpoint
ALTER TABLE "riscos" ADD COLUMN "dados_esocial" jsonb;--> statement-breakpoint
ALTER TABLE "funcao_riscos" ADD CONSTRAINT "funcao_riscos_risco_id_riscos_id_fk" FOREIGN KEY ("risco_id") REFERENCES "riscos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eventos_esocial_ref_idx" ON "eventos_esocial" USING btree ("empresa_id","evento","referencia_id");