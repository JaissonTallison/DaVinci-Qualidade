import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  pedir,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  avaliarFornecedorSchema,
  avaliarOsSchema,
  cancelarOsSchema,
  categoriaNps,
  classificarFornecedor,
  concluirOsSchema,
  filtroNpsSchema,
  filtroOsSchema,
  iniciarOsSchema,
  isUuid,
  novaOsSchema,
  PATTERNS,
  registrarRespostaNpsSchema,
  SERVICES,
  type AvaliacaoDeFornecedor,
  type ClassificacaoFornecedor,
  type Contexto,
  type OrdemDeServico,
  type Pagina,
  type Papel,
  type Parceiro,
  type ResultadoNps,
  type ResumoServicos,
  type StatusOs,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  avaliacoesFornecedores as avs,
  ordensServico as os,
  respostasNps as nps,
  sequencias,
} from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO = 'Esta OS foi alterada por outra pessoa. Recarregue a página.';

@Injectable()
export class ServicosService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    /** Dono do cadastro de clientes e fornecedores. */
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  // ---------------------------------------------------------------- ordens de serviço

  async listarOs(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<OrdemDeServico>> {
    const f = validar(filtroOsSchema, dados ?? {});
    const c: SQL[] = [eq(os.empresaId, ctx.empresaId)];
    if (f.status) c.push(eq(os.status, f.status));
    if (f.clienteId) c.push(eq(os.clienteId, f.clienteId));
    const onde = and(...c);
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(os)
        .where(onde)
        .orderBy(desc(os.criadoEm))
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(os).where(onde),
    ]);
    const hoje = hojeEmBrasilia();
    return {
      itens: linhas.map((l) => montarOs(l, hoje)),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async obterOs(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<OrdemDeServico> {
    return montarOs(await this.os(ctx, dados?.id), hojeEmBrasilia());
  }

  async criarOs(ctx: Contexto, dados: unknown): Promise<OrdemDeServico> {
    const n = validar(novaOsSchema, dados);
    const cliente = await this.parceiro(
      ctx,
      n.clienteId,
      'cliente',
      'clienteId',
    );
    const ano = hojeEmBrasilia().slice(0, 4);
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: `OS-${ano}`, ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [l] = await tx
        .insert(os)
        .values({
          ...n,
          clienteNome: cliente.nomeFantasia ?? cliente.nome,
          numero: `OS-${ano}-${String(ultimo).padStart(3, '0')}`,
          ...autoria(ctx),
        })
        .returning();
      return montarOs(l!, hojeEmBrasilia());
    });
  }

  async iniciarOs(ctx: Contexto, dados: ComId): Promise<OrdemDeServico> {
    const { versao } = validar(iniciarOsSchema, dados?.alteracoes);
    const atual = await this.os(ctx, dados?.id);
    if (atual.status !== 'aberta') throw regra('Só OS aberta é iniciada.');
    return this.gravarOs(ctx, atual.id, versao, {
      status: 'em_execucao',
      iniciadaEm: new Date(),
    });
  }

  async concluirOs(ctx: Contexto, dados: ComId): Promise<OrdemDeServico> {
    const { versao, relatorio } = validar(concluirOsSchema, dados?.alteracoes);
    const atual = await this.os(ctx, dados?.id);
    if (atual.status !== 'em_execucao')
      throw regra('Só OS em execução é concluída: inicie antes.');
    return this.gravarOs(ctx, atual.id, versao, {
      status: 'concluida',
      concluidaEm: new Date(),
      relatorio,
    });
  }

  async cancelarOs(ctx: Contexto, dados: ComId): Promise<OrdemDeServico> {
    const { versao, motivo } = validar(cancelarOsSchema, dados?.alteracoes);
    const atual = await this.os(ctx, dados?.id);
    if (atual.status === 'concluida' || atual.status === 'cancelada')
      throw regra(`Esta OS já está ${atual.status}.`);
    return this.gravarOs(ctx, atual.id, versao, {
      status: 'cancelada',
      motivoCancelamento: motivo,
    });
  }

  /** O cliente avalia depois da conclusão, uma vez. */
  async avaliarOs(ctx: Contexto, dados: ComId): Promise<OrdemDeServico> {
    const { versao, nota, comentario } = validar(
      avaliarOsSchema,
      dados?.alteracoes,
    );
    const atual = await this.os(ctx, dados?.id);
    if (atual.status !== 'concluida')
      throw regra('Só OS concluída recebe a avaliação do cliente.');
    if (atual.nota !== null) throw regra('Esta OS já foi avaliada.');
    return this.gravarOs(ctx, atual.id, versao, { nota, comentario });
  }

  // ---------------------------------------------------------------- NPS

  async listarNps(ctx: Contexto, dados: unknown): Promise<ResultadoNps> {
    const { ano } = validar(filtroNpsSchema, dados ?? {});
    const hoje = hojeEmBrasilia();
    const de = ano ? `${ano}-01-01` : somarMeses(hoje, -12);
    const ate = ano ? `${ano + 1}-01-01` : '9999-12-31';
    const linhas = await this.db
      .select()
      .from(nps)
      .where(
        and(
          eq(nps.empresaId, ctx.empresaId),
          gte(nps.data, de),
          lt(nps.data, ate),
        ),
      )
      .orderBy(desc(nps.data), desc(nps.criadoEm));
    const respostas = linhas.map((l) => ({
      id: l.id,
      clienteId: l.clienteId,
      clienteNome: l.clienteNome,
      data: l.data,
      nota: l.nota,
      categoria: categoriaNps(l.nota),
      comentario: l.comentario,
    }));
    const conta = (c: string) =>
      respostas.filter((r) => r.categoria === c).length;
    const [promotores, neutros, detratores] = [
      conta('promotor'),
      conta('neutro'),
      conta('detrator'),
    ];
    return {
      respostas,
      promotores,
      neutros,
      detratores,
      nps: respostas.length
        ? Math.round(((promotores - detratores) / respostas.length) * 100)
        : null,
    };
  }

  async registrarNps(ctx: Contexto, dados: unknown): Promise<ResultadoNps> {
    const r = validar(registrarRespostaNpsSchema, dados);
    if (r.data > hojeEmBrasilia())
      throw invalido('data', 'A data não pode estar no futuro.');
    const cliente = await this.parceiro(
      ctx,
      r.clienteId,
      'cliente',
      'clienteId',
    );
    await this.db.insert(nps).values({
      ...r,
      clienteNome: cliente.nomeFantasia ?? cliente.nome,
      ...autoria(ctx),
    });
    return this.listarNps(ctx, {});
  }

  // ---------------------------------------------------------------- fornecedores

  async listarAvaliacoes(ctx: Contexto): Promise<AvaliacaoDeFornecedor[]> {
    const linhas = await this.db
      .select()
      .from(avs)
      .where(eq(avs.empresaId, ctx.empresaId))
      .orderBy(desc(avs.data), desc(avs.criadoEm));
    const vistos = new Set<string>();
    return linhas.map((l) => {
      const vigente = !vistos.has(l.fornecedorId);
      vistos.add(l.fornecedorId);
      return montarAvaliacao(l, vigente);
    });
  }

  async avaliarFornecedor(
    ctx: Contexto,
    dados: unknown,
  ): Promise<AvaliacaoDeFornecedor> {
    const a = validar(avaliarFornecedorSchema, dados);
    if (a.data > hojeEmBrasilia())
      throw invalido('data', 'A data não pode estar no futuro.');
    const f = await this.parceiro(
      ctx,
      a.fornecedorId,
      'fornecedor',
      'fornecedorId',
    );
    const media =
      Math.round(
        ((a.qualidade + a.prazo + a.atendimento + a.documentacao) / 4) * 100,
      ) / 100;
    const { classificacao, mesesAteReavaliar } = classificarFornecedor(media);
    const [l] = await this.db
      .insert(avs)
      .values({
        ...a,
        fornecedorNome: f.nomeFantasia ?? f.nome,
        media,
        classificacao,
        proximaAvaliacao: somarMeses(a.data, mesesAteReavaliar),
        ...autoria(ctx),
      })
      .returning();
    return montarAvaliacao(l!, true);
  }

  async resumo(ctx: Contexto): Promise<ResumoServicos> {
    const hoje = hojeEmBrasilia();
    const [abertas, n, avaliacoes] = await Promise.all([
      this.db
        .select({ prazo: os.prazo })
        .from(os)
        .where(
          and(
            eq(os.empresaId, ctx.empresaId),
            inArray(os.status, ['aberta', 'em_execucao']),
          ),
        ),
      this.listarNps(ctx, {}),
      this.listarAvaliacoes(ctx),
    ]);
    const vigentes = avaliacoes.filter((a) => a.vigente);
    return {
      osAbertas: abertas.length,
      osAtrasadas: abertas.filter((a) => a.prazo < hoje).length,
      nps12Meses: n.nps,
      fornecedoresReprovados: vigentes.filter(
        (a) => a.classificacao === 'reprovado',
      ).length,
      avaliacoesVencidas: vigentes.filter((a) => a.proximaAvaliacao < hoje)
        .length,
    };
  }

  // ---------------------------------------------------------------- apoio

  /** Confere no codex: existe, está ativo e tem o papel (cliente ou fornecedor). */
  private async parceiro(
    ctx: Contexto,
    id: string,
    papel: Papel,
    campo: string,
  ): Promise<Parceiro> {
    const p = await pedir<Parceiro>(
      this.codex,
      PATTERNS.parceiros.obter,
      { id },
      ctx,
      'Cadastros',
    ).catch((erro: unknown) => {
      if (
        erro instanceof ErroDeNegocio &&
        (erro.getError() as { codigo?: string }).codigo === 'NAO_ENCONTRADO'
      )
        throw invalido(campo, 'Cadastro não encontrado.');
      throw erro;
    });
    if (!p.ativo) throw invalido(campo, `${p.nome} está inativo no cadastro.`);
    if (!p.papeis.includes(papel))
      throw invalido(campo, `${p.nome} não está cadastrado como ${papel}.`);
    return p;
  }

  private async os(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(os)
          .where(and(eq(os.id, id), eq(os.empresaId, ctx.empresaId)))
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Ordem de serviço não encontrada.',
      );
    return l;
  }

  private async gravarOs(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof os.$inferInsert>,
  ): Promise<OrdemDeServico> {
    const [l] = await this.db
      .update(os)
      .set({ ...valores, atualizadoPor: ctx.usuarioId })
      .where(and(eq(os.id, id), eq(os.atualizadoEm, new Date(versao))))
      .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarOs(l, hojeEmBrasilia());
  }
}

const autoria = (ctx: Contexto) => ({
  empresaId: ctx.empresaId,
  criadoPor: ctx.usuarioId,
  atualizadoPor: ctx.usuarioId,
});
const regra = (m: string) => new ErroDeNegocio('REGRA_DE_NEGOCIO', m);
const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);

function montarOs(l: typeof os.$inferSelect, hoje: string): OrdemDeServico {
  const status = l.status as StatusOs;
  return {
    id: l.id,
    numero: l.numero,
    clienteId: l.clienteId,
    clienteNome: l.clienteNome,
    titulo: l.titulo,
    descricao: l.descricao,
    responsavel: l.responsavel,
    prazo: l.prazo,
    status,
    atrasada:
      (status === 'aberta' || status === 'em_execucao') && l.prazo < hoje,
    iniciadaEm: l.iniciadaEm?.toISOString() ?? null,
    concluidaEm: l.concluidaEm?.toISOString() ?? null,
    relatorio: l.relatorio,
    motivoCancelamento: l.motivoCancelamento,
    nota: l.nota,
    comentario: l.comentario,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarAvaliacao(
  l: typeof avs.$inferSelect,
  vigente: boolean,
): AvaliacaoDeFornecedor {
  return {
    id: l.id,
    fornecedorId: l.fornecedorId,
    fornecedorNome: l.fornecedorNome,
    data: l.data,
    notas: {
      qualidade: l.qualidade,
      prazo: l.prazo,
      atendimento: l.atendimento,
      documentacao: l.documentacao,
    },
    media: l.media,
    classificacao: l.classificacao as ClassificacaoFornecedor,
    proximaAvaliacao: l.proximaAvaliacao,
    vigente,
    observacao: l.observacao,
  };
}
