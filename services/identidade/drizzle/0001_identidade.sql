CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"cnpj" varchar(14) NOT NULL,
	"razao_social" varchar(150) NOT NULL,
	"nome_fantasia" varchar(150),
	"ativa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "empresas_cnpj" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "perfis" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(60) NOT NULL,
	"descricao" varchar(200),
	"permissoes" text[] DEFAULT '{}'::text[] NOT NULL,
	"protegido" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "perfis_nome_por_empresa" UNIQUE("empresa_id","nome")
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"familia" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"empresa_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp (3) with time zone NOT NULL,
	"revogada_em" timestamp (3) with time zone,
	"motivo_revogacao" varchar(30),
	CONSTRAINT "sessoes_token" UNIQUE("token_hash"),
	CONSTRAINT "sessoes_expira_depois" CHECK ("sessoes"."expira_em" > "sessoes"."criado_em")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"nome" varchar(150) NOT NULL,
	"email" varchar(150) NOT NULL,
	"senha_hash" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"deve_trocar_senha" boolean DEFAULT false NOT NULL,
	"falhas_login" integer DEFAULT 0 NOT NULL,
	"bloqueado_ate" timestamp (3) with time zone,
	"ultimo_acesso_em" timestamp (3) with time zone,
	"ultima_empresa_id" uuid,
	CONSTRAINT "usuarios_email" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vinculos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"usuario_id" uuid NOT NULL,
	"perfil_id" uuid NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "vinculos_usuario_por_empresa" UNIQUE("empresa_id","usuario_id")
);
--> statement-breakpoint
CREATE INDEX "sessoes_familia_idx" ON "sessoes" USING btree ("familia");--> statement-breakpoint
CREATE INDEX "vinculos_usuario_idx" ON "vinculos" USING btree ("usuario_id");