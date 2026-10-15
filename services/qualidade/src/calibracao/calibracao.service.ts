import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { DATABASE, type Database, violacaoUnica } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  anularCalibracaoSchema,
  atualizarInstrumentoSchema,
  filtroInstrumentosSchema,
  isUuid,
  novoInstrumentoSchema,
  registrarCalibracaoSchema,
  usoDoInstrumentoSchema,
  type Contexto,
  type Instrumento,
  type InstrumentoResumo,
  type Pagina,
  type ResumoCalibracao,
  type SituacaoInstrumento,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { calibracoes, instrumentos } from '../db/schema.js';
import { hojeEmBrasilia } from '../datas.js';
import { situacaoDoInstrumento } from './regras.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Linha = typeof instrumentos.$inferSelect;
type LinhaCalibracao = typeof calibracoes.$inferSelect;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este instrumento foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';
const TAG_REPETIDA = 'Já existe um instrumento com esta TAG.';

/** Ordem da lista: o que pede ação primeiro. */
const PRIORIDADE: Record<SituacaoInstrumento, number> = {
  reprovado: 0,
  vencido: 1,
  vence_em_breve: 2,
  sem_calibracao: 3,
  em_dia: 4,
  fora_de_uso: 5,
};

@Injectable()
export class CalibracaoService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  /**
   * A situação depende do calendário e do histórico, então é calculada aqui, em memória, para todos os instrumentos
   * da empresa (dezenas ou centenas, não milhões), e só depois filtrada e paginada.
   */
  async listar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<InstrumentoResumo>> {
    const f = validar(filtroInstrumentosSchema, dados ?? {});
    const todos = await this.todosComSituacao(ctx);
    const termo = f.busca?.toLocaleLowerCase('pt-BR');
    const filtrados = todos
      .filter((i) => !f.situacao || i.situacao === f.situacao)
      .filter(
        (i) =>
          !termo ||
          i.tag.toLocaleLowerCase('pt-BR').includes(termo) ||
          i.descricao.toLocaleLowerCase('pt-BR').includes(termo),
      )
      .sort(
        (a, b) =>
          PRIORIDADE[a.situacao] - PRIORIDADE[b.situacao] ||
          (a.proximaCalibracao ?? '').localeCompare(
            b.proximaCalibracao ?? '',
          ) ||
          a.tag.localeCompare(b.tag),
      );
    const inicio = (f.pagina - 1) * f.porPagina;
    return {
      itens: filtrados.slice(inicio, inicio + f.porPagina),
      total: filtrados.length,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async resumo(ctx: Contexto): Promise<ResumoCalibracao> {
    const todos = await this.todosComSituacao(ctx);
    const contar = (s: SituacaoInstrumento) =>
      todos.filter((i) => i.situacao === s).length;
    return {
      vencidos: contar('vencido'),
      vencemEmBreve: contar('vence_em_breve'),
      reprovados: contar('reprovado'),
      semCalibracao: contar('sem_calibracao'),
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Instrumento> {
    const linha = await this.buscar(ctx, this.db, dados?.id);
    return montar(
      linha,
      (await this.historicos(this.db, [linha.id])).get(linha.id) ?? [],
    );
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Instrumento> {
    const novo = validar(novoInstrumentoSchema, dados);
    try {
      const [linha] = await this.db
        .insert(instrumentos)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montar(linha!, []);
    } catch (erro) {
      throw tagRepetida(erro) ?? erro;
    }
  }

  async atualizar(ctx: Contexto, dados: ComId): Promise<Instrumento> {
    const { versao, ...campos } = validar(
      atualizarInstrumentoSchema,
      dados?.alteracoes,
    );
    try {
      return await this.alterar(ctx, dados?.id, versao, async (tx, linha) => {
        await tx
          .update(instrumentos)
          .set(campos)
          .where(eq(instrumentos.id, linha.id));
      });
    } catch (erro) {
      throw tagRepetida(erro) ?? erro;
    }
  }

  async mudarUso(ctx: Contexto, dados: ComId): Promise<Instrumento> {
    const { versao, emUso } = validar(
      usoDoInstrumentoSchema,
      dados?.alteracoes,
    );
    return this.alterar(ctx, dados?.id, versao, async (tx, linha) => {
      await tx
        .update(instrumentos)
        .set({ emUso })
        .where(eq(instrumentos.id, linha.id));
    });
  }

  /** Registra uma calibração no histórico. A data pode ser antiga (lançamento atrasado), nunca futura. */
  async registrar(ctx: Contexto, dados: ComId): Promise<Instrumento> {
    const { versao, ...cal } = validar(
      registrarCalibracaoSchema,
      dados?.alteracoes,
    );
    if (cal.data > hojeEmBrasilia())
      throw invalido('data', 'A data da calibração não pode estar no futuro.');
    return this.alterar(ctx, dados?.id, versao, async (tx, linha) => {
      if (!linha.emUso)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          'O instrumento está fora de uso. Volte-o para uso antes de registrar uma calibração.',
        );
      await tx
        .insert(calibracoes)
        .values({
          ...cal,
          instrumentoId: linha.id,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        });
    });
  }

  /** Anula um registro feito por engano: ele continua no histórico, marcado, e sai das contas. */
  async anular(ctx: Contexto, dados: ComId): Promise<Instrumento> {
    const { versao, calibracaoId, motivo } = validar(
      anularCalibracaoSchema,
      dados?.alteracoes,
    );
    return this.alterar(
      ctx,
      dados?.id,
      versao,
      async (tx, linha, historico) => {
        const cal = historico.find((c) => c.id === calibracaoId);
        if (!cal)
          throw new ErroDeNegocio(
            'NAO_ENCONTRADO',
            'Calibração não encontrada neste instrumento.',
          );
        if (cal.anulada)
          throw new ErroDeNegocio(
            'REGRA_DE_NEGOCIO',
            'Esta calibração já está anulada.',
          );
        await tx
          .update(calibracoes)
          .set({
            anulada: true,
            motivoAnulacao: motivo,
            anuladaPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })
          .where(
            and(
              eq(calibracoes.id, cal.id),
              eq(calibracoes.instrumentoId, linha.id),
            ),
          );
      },
    );
  }

  private async todosComSituacao(ctx: Contexto): Promise<InstrumentoResumo[]> {
    const linhas = await this.db
      .select()
      .from(instrumentos)
      .where(eq(instrumentos.empresaId, ctx.empresaId))
      .orderBy(asc(instrumentos.tag));
    const historicos = await this.historicos(
      this.db,
      linhas.map((l) => l.id),
    );
    return linhas.map((l) => {
      const i = montar(l, historicos.get(l.id) ?? []);
      return {
        id: i.id,
        tag: i.tag,
        descricao: i.descricao,
        local: i.local,
        responsavel: i.responsavel,
        frequenciaMeses: i.frequenciaMeses,
        situacao: i.situacao,
        ultimaCalibracao: i.ultimaCalibracao,
        proximaCalibracao: i.proximaCalibracao,
      };
    });
  }

  /** Transação: confere empresa e versão (já avançando-a, o que trava gravação simultânea) e aplica a mudança. */
  private async alterar(
    ctx: Contexto,
    id: unknown,
    versao: string,
    mudanca: (
      tx: Tx,
      linha: Linha,
      historico: LinhaCalibracao[],
    ) => Promise<void>,
  ): Promise<Instrumento> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    return this.db.transaction(async (tx) => {
      const atual = await this.buscar(ctx, tx, id);
      const [travado] = await tx
        .update(instrumentos)
        .set({ atualizadoPor: ctx.usuarioId })
        .where(
          and(
            eq(instrumentos.id, atual.id),
            eq(instrumentos.atualizadoEm, lida),
          ),
        )
        .returning();
      if (!travado)
        throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
      await mudanca(
        tx,
        travado,
        (await this.historicos(tx, [travado.id])).get(travado.id) ?? [],
      );
      const [final] = await tx
        .select()
        .from(instrumentos)
        .where(eq(instrumentos.id, travado.id));
      return montar(
        final!,
        (await this.historicos(tx, [travado.id])).get(travado.id) ?? [],
      );
    });
  }

  private async buscar(
    ctx: Contexto,
    db: Db | Tx,
    id: unknown,
  ): Promise<Linha> {
    const [linha] = isUuid(id)
      ? await db
          .select()
          .from(instrumentos)
          .where(
            and(
              eq(instrumentos.id, id),
              eq(instrumentos.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!linha)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Instrumento não encontrado.');
    return linha;
  }

  private async historicos(
    db: Db | Tx,
    ids: string[],
  ): Promise<Map<string, LinhaCalibracao[]>> {
    const mapa = new Map<string, LinhaCalibracao[]>();
    if (!ids.length) return mapa;
    const linhas = await db
      .select()
      .from(calibracoes)
      .where(inArray(calibracoes.instrumentoId, ids))
      .orderBy(desc(calibracoes.data), desc(calibracoes.criadoEm));
    for (const l of linhas)
      mapa.set(l.instrumentoId, [...(mapa.get(l.instrumentoId) ?? []), l]);
    return mapa;
  }
}

function tagRepetida(erro: unknown): ErroDeNegocio | null {
  return violacaoUnica(erro) === 'instrumentos_tag_por_empresa'
    ? new ErroDeNegocio('CONFLITO', TAG_REPETIDA, [
        { campo: 'tag', mensagem: TAG_REPETIDA },
      ])
    : null;
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(l: Linha, historico: LinhaCalibracao[]): Instrumento {
  const { situacao, ultima, proxima } = situacaoDoInstrumento(
    l.emUso,
    l.frequenciaMeses,
    historico,
    hojeEmBrasilia(),
  );
  return {
    id: l.id,
    tag: l.tag,
    descricao: l.descricao,
    fabricante: l.fabricante,
    modelo: l.modelo,
    numeroSerie: l.numeroSerie,
    local: l.local,
    responsavel: l.responsavel,
    faixa: l.faixa,
    criterioAceitacao: l.criterioAceitacao,
    frequenciaMeses: l.frequenciaMeses,
    emUso: l.emUso,
    situacao,
    ultimaCalibracao: ultima,
    proximaCalibracao: proxima,
    calibracoes: historico.map((c) => ({
      id: c.id,
      data: c.data,
      laboratorio: c.laboratorio,
      certificado: c.certificado,
      aprovada: c.aprovada,
      erroEncontrado: c.erroEncontrado,
      observacao: c.observacao,
      custo: c.custo,
      anulada: c.anulada,
      motivoAnulacao: c.motivoAnulacao,
      criadoEm: c.criadoEm.toISOString(),
    })),
    versao: l.atualizadoEm.toISOString(),
  };
}
