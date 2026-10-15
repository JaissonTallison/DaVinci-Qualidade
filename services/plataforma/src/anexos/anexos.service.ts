import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  filtroAnexosSchema,
  isUuid,
  novoAnexoSchema,
  TIPOS_DE_ANEXO,
  type Anexo,
  type ConteudoDoAnexo,
  type Contexto,
  type RegistroComAnexo,
  type TipoDeAnexo,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { anexos } from '../db/schema.js';
import { conteudoConfere } from './assinatura.js';

type Db = Database<typeof schema>;
type Linha = typeof anexos.$inferSelect;

/** Até quantos anexos um registro aceita: evidência, não arquivo morto. */
export const LIMITE_POR_REGISTRO = 30;

@Injectable()
export class AnexosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Anexo[]> {
    const f = validar(filtroAnexosSchema, dados);
    const linhas = await this.db
      .select()
      .from(anexos)
      .where(
        and(
          eq(anexos.empresaId, ctx.empresaId),
          eq(anexos.registro, f.registro),
          eq(anexos.registroId, f.registroId),
          isNull(anexos.removidoEm),
        ),
      )
      .orderBy(desc(anexos.criadoEm));
    return linhas.map(montar);
  }

  async anexar(ctx: Contexto, dados: unknown): Promise<Anexo> {
    const novo = validar(novoAnexoSchema, dados);
    const conteudo = Buffer.from(novo.base64, 'base64');
    if (conteudo.length === 0) throw invalido('O arquivo está vazio.');
    if (!conteudoConfere(novo.tipo, conteudo))
      throw invalido(
        `O conteúdo não é de um arquivo ${TIPOS_DE_ANEXO[novo.tipo]}. Confira se o arquivo abre no computador e envie de novo.`,
      );
    const atuais = await this.listar(ctx, {
      registro: novo.registro,
      registroId: novo.registroId,
    });
    if (atuais.length >= LIMITE_POR_REGISTRO)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        `Este registro já tem ${LIMITE_POR_REGISTRO} anexos. Remova os que não servem mais antes de anexar outro.`,
      );
    const [l] = await this.db
      .insert(anexos)
      .values({
        registro: novo.registro,
        registroId: novo.registroId,
        nome: novo.nome,
        tipo: novo.tipo,
        tamanho: conteudo.length,
        descricao: novo.descricao,
        conteudo,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(l!);
  }

  /** Só os dados (o gateway usa para conferir a permissão antes de remover ou baixar). */
  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Anexo> {
    return montar(await this.buscar(ctx, dados?.id));
  }

  async conteudo(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<ConteudoDoAnexo> {
    const l = await this.buscar(ctx, dados?.id);
    return { ...montar(l), base64: l.conteudo.toString('base64') };
  }

  async remover(ctx: Contexto, dados: { id?: unknown }): Promise<Anexo> {
    const atual = await this.buscar(ctx, dados?.id);
    const [l] = await this.db
      .update(anexos)
      .set({
        removidoEm: new Date(),
        removidoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .where(and(eq(anexos.id, atual.id), eq(anexos.empresaId, ctx.empresaId)))
      .returning();
    return montar(l!);
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Linha> {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(anexos)
          .where(
            and(
              eq(anexos.id, id),
              eq(anexos.empresaId, ctx.empresaId),
              isNull(anexos.removidoEm),
            ),
          )
      : [];
    if (!l) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Anexo não encontrado.');
    return l;
  }
}

function invalido(mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique o arquivo.', [
    { campo: 'arquivo', mensagem },
  ]);
}

function montar(l: Linha): Anexo {
  return {
    id: l.id,
    registro: l.registro as RegistroComAnexo,
    registroId: l.registroId,
    nome: l.nome,
    tipo: l.tipo as TipoDeAnexo,
    tamanho: l.tamanho,
    descricao: l.descricao,
    criadoEm: l.criadoEm.toISOString(),
  };
}
