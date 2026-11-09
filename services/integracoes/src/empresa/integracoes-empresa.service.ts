import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { validar } from '@davinci/shared';
import {
  CONFIG_DE_INTEGRACOES_PADRAO,
  salvarIaSchema,
  salvarWebhookSchema,
  type ConfigDeIntegracoes,
  type Contexto,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { integracoesEmpresa } from '../db/schema.js';
import { cifrar, decifrar } from '../seguranca/cifra.js';

/**
 * Config de integrações por empresa: lê e grava a linha. O que não é segredo fica em `config`;
 * credenciais (quando entrarem SMTP/WhatsApp) vão cifradas em `segredos` (seguranca/cifra.ts).
 */
@Injectable()
export class IntegracoesEmpresaService {
  constructor(@Inject(DATABASE) private readonly db: Database<typeof schema>) {}

  async obter(ctx: Contexto): Promise<ConfigDeIntegracoes> {
    const [linha] = await this.db
      .select()
      .from(integracoesEmpresa)
      .where(eq(integracoesEmpresa.empresaId, ctx.empresaId));
    const salvo = (linha?.config ?? {}) as Partial<ConfigDeIntegracoes>;
    const segredos = linha?.segredos
      ? decifrar<Record<string, string>>(linha.segredos)
      : null;
    return {
      webhook: { ...CONFIG_DE_INTEGRACOES_PADRAO.webhook, ...salvo.webhook },
      ia: {
        provedor: salvo.ia?.provedor ?? null,
        temChave: Boolean(segredos?.iaChave),
      },
    };
  }

  async salvarWebhook(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ConfigDeIntegracoes> {
    const d = validar(salvarWebhookSchema, dados);
    const atual = await this.obter(ctx);
    const config: ConfigDeIntegracoes = {
      ...atual,
      webhook: { url: d.url ?? null, ativo: d.ativo },
    };
    await this.db
      .insert(integracoesEmpresa)
      .values({ empresaId: ctx.empresaId, config })
      .onConflictDoUpdate({
        target: integracoesEmpresa.empresaId,
        set: { config, atualizadoEm: new Date() },
      });
    return config;
  }

  async salvarIa(ctx: Contexto, dados: unknown): Promise<ConfigDeIntegracoes> {
    const d = validar(salvarIaSchema, dados);
    const [linha] = await this.db
      .select()
      .from(integracoesEmpresa)
      .where(eq(integracoesEmpresa.empresaId, ctx.empresaId));
    const segredos =
      (linha?.segredos
        ? decifrar<Record<string, string>>(linha.segredos)
        : null) ?? {};
    if (d.chave) segredos.iaChave = d.chave;
    const atual = await this.obter(ctx);
    const config: ConfigDeIntegracoes = {
      ...atual,
      ia: { provedor: d.provedor, temChave: Boolean(segredos.iaChave) },
    };
    const cifrados = cifrar(segredos);
    await this.db
      .insert(integracoesEmpresa)
      .values({ empresaId: ctx.empresaId, config, segredos: cifrados })
      .onConflictDoUpdate({
        target: integracoesEmpresa.empresaId,
        set: { config, segredos: cifrados, atualizadoEm: new Date() },
      });
    return this.obter(ctx);
  }
}
