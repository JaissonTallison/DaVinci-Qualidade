CREATE TABLE "documentos_terceiros" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"terceiro_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"descricao" varchar(150),
	"validade" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terceiros" (
	"id" uuid PRIMARY KEY NOT NULL,
	"empresa_id" uuid NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid,
	"atualizado_por" uuid,
	"razao_social" varchar(150) NOT NULL,
	"cnpj" varchar(14) NOT NULL,
	"servico" varchar(200) NOT NULL,
	"contato" varchar(120),
	"inicio_contrato" date NOT NULL,
	"fim_contrato" date,
	CONSTRAINT "terceiros_cnpj_por_empresa" UNIQUE("empresa_id","cnpj")
);
--> statement-breakpoint
ALTER TABLE "documentos_terceiros" ADD CONSTRAINT "documentos_terceiros_terceiro_id_terceiros_id_fk" FOREIGN KEY ("terceiro_id") REFERENCES "terceiros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documentos_terceiros_idx" ON "documentos_terceiros" USING btree ("empresa_id","terceiro_id");