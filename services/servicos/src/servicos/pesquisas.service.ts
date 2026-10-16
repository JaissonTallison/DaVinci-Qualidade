import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  somarDias,
  validar,
} from '@davinci/shared';
import {
  criarConviteSchema,
  DIAS_DE_VALIDADE_DO_CONVITE,
  responderPesquisaSchema,
  tokenDaPesquisaSchema,
  type ConviteDePesquisa,
  type Contexto,
  type PesquisaPublica,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  convitesPesquisa as cv,
  ordensServico as os,
  respostasNps as nps,
} from '../db/schema.js';
import { ServicosService } from './servicos.service.js';

type Db = Database<typeof schema>;
type Linha = typeof cv.$inferSelect;

/**
 * Pesquisa por link: o convite gera um token aleatório (32 bytes); quem tem o link responde uma vez, sem login,
 * em até 30 dias. A resposta entra no NPS e, com OS concluída ainda não avaliada, vira a nota da OS.
 */
@Injectable()
export class PesquisasService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    private readonly servicos: ServicosService,
  ) {}

  async listar(ctx: Contexto): Promise<ConviteDePesquisa[]> {
    const linhas = await this.db
      .select()
      .from(cv)
      .where(eq(cv.empresaId, ctx.empresaId))
      .orderBy(desc(cv.criadoEm))
      .limit(100);
    return linhas.map(montar);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<ConviteDePesquisa> {
    const n = validar(criarConviteSchema, dados);
    const cliente = await this.servicos.parceiro(
      ctx,
      n.clienteId,
      'cliente',
      'clienteId',
    );
    let o: typeof os.$inferSelect | null = null;
    if (n.osId) {
      o = await this.servicos.os(ctx, n.osId);
      if (o.clienteId !== n.clienteId)
        throw new ErroDeNegocio(
          'DADOS_INVALIDOS',
          'Verifique os campos destacados.',
          [{ campo: 'osId', mensagem: 'Esta OS é de outro cliente.' }],
        );
    }
    const [l] = await this.db
      .insert(cv)
      .values({
        token: randomBytes(32).toString('base64url'),
        clienteId: cliente.id,
        clienteNome: cliente.nomeFantasia ?? cliente.nome,
        osId: o?.id ?? null,
        osNumero: o?.numero ?? null,
        osTitulo: o?.titulo ?? null,
        expiraEm: somarDias(hojeEmBrasilia(), DIAS_DE_VALIDADE_DO_CONVITE),
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montar(l!);
  }

  /** Rota pública: só o que a pessoa precisa ver para responder. */
  async obterPublica(dados: unknown): Promise<PesquisaPublica> {
    const { token } = validar(tokenDaPesquisaSchema, dados);
    const l = await this.porToken(token);
    return {
      clienteNome: l.clienteNome,
      osNumero: l.osNumero,
      osTitulo: l.osTitulo,
      situacao: situacao(l),
    };
  }

  async responderPublica(dados: unknown): Promise<PesquisaPublica> {
    const r = validar(responderPesquisaSchema, dados);
    const l = await this.porToken(r.token);
    const s = situacao(l);
    if (s === 'respondida')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Esta pesquisa já foi respondida. Obrigado!',
      );
    if (s === 'expirada')
      throw new ErroDeNegocio('REGRA_DE_NEGOCIO', 'Este link expirou.');
    await this.db.transaction(async (tx) => {
      // Trava o convite: duas respostas simultâneas, só uma entra
      const [marcado] = await tx
        .update(cv)
        .set({ respondidoEm: new Date(), comentario: r.comentario })
        .where(and(eq(cv.id, l.id), isNull(cv.respondidoEm)))
        .returning();
      if (!marcado)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'Esta pesquisa já foi respondida. Obrigado!',
        );
      await tx.insert(nps).values({
        empresaId: l.empresaId,
        clienteId: l.clienteId,
        clienteNome: l.clienteNome,
        data: hojeEmBrasilia(),
        nota: r.nota,
        comentario: r.comentario,
        osId: l.osId,
      });
      if (l.osId && r.notaOs)
        await tx
          .update(os)
          .set({ nota: r.notaOs, comentario: r.comentario })
          .where(
            and(eq(os.id, l.osId), eq(os.status, 'concluida'), isNull(os.nota)),
          );
    });
    return {
      clienteNome: l.clienteNome,
      osNumero: l.osNumero,
      osTitulo: l.osTitulo,
      situacao: 'respondida',
    };
  }

  private async porToken(token: string): Promise<Linha> {
    const [l] = await this.db.select().from(cv).where(eq(cv.token, token));
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Pesquisa não encontrada. Confira o link.',
      );
    return l;
  }
}

function situacao(l: Linha): PesquisaPublica['situacao'] {
  if (l.respondidoEm) return 'respondida';
  return l.expiraEm < hojeEmBrasilia() ? 'expirada' : 'aberta';
}

function montar(l: Linha): ConviteDePesquisa {
  return {
    id: l.id,
    token: l.token,
    clienteId: l.clienteId,
    clienteNome: l.clienteNome,
    osId: l.osId,
    osNumero: l.osNumero,
    criadoEm: l.criadoEm.toISOString(),
    expiraEm: l.expiraEm,
    respondidoEm: l.respondidoEm?.toISOString() ?? null,
  };
}
