CREATE TABLE "bancos" (
	"codigo" char(3) PRIMARY KEY NOT NULL,
	"ispb" char(8),
	"nome" varchar(150) NOT NULL,
	"nome_curto" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cnaes" (
	"codigo" char(7) PRIMARY KEY NOT NULL,
	"descricao" varchar(300) NOT NULL,
	"setor" char(1) NOT NULL,
	"palavras" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parceiro_chaves_pix" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"parceiro_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"chave" varchar(77) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parceiro_contas_bancarias" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"parceiro_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"banco" char(3) NOT NULL,
	"agencia" varchar(7) NOT NULL,
	"conta" varchar(22) NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"titular" varchar(150),
	"documento_titular" varchar(14)
);
--> statement-breakpoint
CREATE TABLE "parceiro_contatos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"parceiro_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"nome" varchar(100) NOT NULL,
	"cargo" varchar(60),
	"email" varchar(150),
	"telefone" varchar(11),
	"whatsapp" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parceiro_enderecos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"parceiro_id" uuid NOT NULL,
	"ordem" smallint NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"cep" char(8) NOT NULL,
	"logradouro" varchar(150) NOT NULL,
	"numero" varchar(20) NOT NULL,
	"complemento" varchar(60),
	"bairro" varchar(80) NOT NULL,
	"cidade" varchar(80) NOT NULL,
	"uf" char(2) NOT NULL,
	"codigo_municipio" char(7)
);
--> statement-breakpoint
CREATE TABLE "parceiros" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"codigo" integer NOT NULL,
	"tipo_pessoa" varchar(2) NOT NULL,
	"documento" varchar(30) NOT NULL,
	"nome" varchar(150) NOT NULL,
	"nome_fantasia" varchar(150),
	"email" varchar(150),
	"telefone" varchar(11),
	"papeis" text[] DEFAULT '{}'::text[] NOT NULL,
	"rg" varchar(20),
	"rg_orgao" varchar(20),
	"nascimento" date,
	"pais" varchar(60),
	"cnae_principal" char(7),
	"cnaes_secundarios" text[] DEFAULT '{}'::text[] NOT NULL,
	"situacao_cadastral" varchar(10),
	"data_abertura" date,
	"natureza_juridica" varchar(120),
	"porte" varchar(10),
	"indicador_ie" varchar(20) DEFAULT 'nao_contribuinte' NOT NULL,
	"inscricao_estadual" varchar(20),
	"inscricao_municipal" varchar(20),
	"suframa" varchar(9),
	"regime_tributario" varchar(10),
	"consumidor_final" boolean DEFAULT false NOT NULL,
	"retem_iss" boolean DEFAULT false NOT NULL,
	"retem_ir" boolean DEFAULT false NOT NULL,
	"retem_pis" boolean DEFAULT false NOT NULL,
	"retem_cofins" boolean DEFAULT false NOT NULL,
	"retem_csll" boolean DEFAULT false NOT NULL,
	"retem_inss" boolean DEFAULT false NOT NULL,
	"site" varchar(150),
	"email_cobranca" varchar(150),
	"email_nfe" varchar(150),
	"limite_credito" numeric(15, 2),
	"bloqueado" boolean DEFAULT false NOT NULL,
	"motivo_bloqueio" varchar(300),
	"forma_pagamento" varchar(20),
	"condicao_pagamento_id" uuid,
	"conta_receita_id" uuid,
	"conta_despesa_id" uuid,
	"etiquetas" text[] DEFAULT '{}'::text[] NOT NULL,
	"origem" varchar(60),
	"observacoes" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"inativado_em" timestamp (3) with time zone,
	"inativado_por" uuid,
	"motivo_inativacao" varchar(500),
	CONSTRAINT "parceiros_documento_por_empresa" UNIQUE("empresa_id","documento"),
	CONSTRAINT "parceiros_codigo_por_empresa" UNIQUE("empresa_id","codigo"),
	CONSTRAINT "parceiros_ao_menos_um_papel" CHECK (cardinality("parceiros"."papeis") > 0),
	CONSTRAINT "parceiros_tipo_pessoa" CHECK ("parceiros"."tipo_pessoa" IN ('PJ', 'PF', 'EX'))
);
--> statement-breakpoint
CREATE TABLE "sequencias" (
	"empresa_id" uuid NOT NULL,
	"nome" varchar(50) NOT NULL,
	"ultimo" integer NOT NULL,
	CONSTRAINT "sequencias_empresa_id_nome_pk" PRIMARY KEY("empresa_id","nome")
);
--> statement-breakpoint
CREATE TABLE "setores" (
	"id" char(1) PRIMARY KEY NOT NULL,
	"nome" varchar(120) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cnaes" ADD CONSTRAINT "cnaes_setor_setores_id_fk" FOREIGN KEY ("setor") REFERENCES "setores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parceiro_chaves_pix" ADD CONSTRAINT "parceiro_chaves_pix_parceiro_id_parceiros_id_fk" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parceiro_contas_bancarias" ADD CONSTRAINT "parceiro_contas_bancarias_parceiro_id_parceiros_id_fk" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parceiro_contatos" ADD CONSTRAINT "parceiro_contatos_parceiro_id_parceiros_id_fk" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parceiro_enderecos" ADD CONSTRAINT "parceiro_enderecos_parceiro_id_parceiros_id_fk" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cnaes_setor_idx" ON "cnaes" USING btree ("setor");--> statement-breakpoint
CREATE INDEX "parceiro_chaves_pix_parceiro_idx" ON "parceiro_chaves_pix" USING btree ("parceiro_id");--> statement-breakpoint
CREATE INDEX "parceiro_contas_parceiro_idx" ON "parceiro_contas_bancarias" USING btree ("parceiro_id");--> statement-breakpoint
CREATE INDEX "parceiro_contatos_parceiro_idx" ON "parceiro_contatos" USING btree ("parceiro_id");--> statement-breakpoint
CREATE INDEX "parceiro_enderecos_parceiro_idx" ON "parceiro_enderecos" USING btree ("parceiro_id");--> statement-breakpoint
CREATE INDEX "parceiro_enderecos_cidade_idx" ON "parceiro_enderecos" USING btree ("empresa_id","uf","cidade");--> statement-breakpoint
CREATE INDEX "parceiros_empresa_nome_idx" ON "parceiros" USING btree ("empresa_id","nome");--> statement-breakpoint
CREATE INDEX "parceiros_empresa_cnae_idx" ON "parceiros" USING btree ("empresa_id","cnae_principal");