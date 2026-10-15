CREATE TABLE "acessos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid,
	"email" varchar(150) NOT NULL,
	"empresa_id" uuid,
	"momento" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"resultado" varchar(30) NOT NULL,
	"ip" varchar(45),
	"navegador" varchar(300)
);
--> statement-breakpoint
CREATE TABLE "codigos_recuperacao" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"hash" varchar(64) NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"usado_em" timestamp (3) with time zone
);
--> statement-breakpoint
CREATE TABLE "desafios_login" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"empresa_id" uuid,
	"ip" varchar(45),
	"navegador" varchar(300),
	"tentativas" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp (3) with time zone NOT NULL,
	"usado_em" timestamp (3) with time zone,
	CONSTRAINT "desafios_login_token" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "navegadores_confiaveis" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"navegador" varchar(300),
	"criado_em" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp (3) with time zone NOT NULL,
	"revogado_em" timestamp (3) with time zone,
	CONSTRAINT "navegadores_confiaveis_token" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "perfis" ADD COLUMN "exige2fa" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sessoes" ADD COLUMN "ip" varchar(45);--> statement-breakpoint
ALTER TABLE "sessoes" ADD COLUMN "navegador" varchar(300);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "totp_segredo" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "totp_pendente" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "totp_ativado_em" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "totp_ultimo_passo" integer;--> statement-breakpoint
CREATE INDEX "acessos_usuario_momento_idx" ON "acessos" USING btree ("usuario_id","momento");--> statement-breakpoint
CREATE INDEX "acessos_momento_idx" ON "acessos" USING btree ("momento");--> statement-breakpoint
CREATE INDEX "codigos_recuperacao_usuario_idx" ON "codigos_recuperacao" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "navegadores_confiaveis_usuario_idx" ON "navegadores_confiaveis" USING btree ("usuario_id");