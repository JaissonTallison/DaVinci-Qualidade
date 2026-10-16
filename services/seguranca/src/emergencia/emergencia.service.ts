import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE, type Database, violacaoUnica } from '@davinci/database';
import {
  ErroDeNegocio,
  hojeEmBrasilia,
  pedir,
  somarMeses,
  validar,
} from '@davinci/shared';
import {
  atualizarBrigadistaSchema,
  atualizarEquipamentoSchema,
  CATEGORIAS_DE_EQUIPAMENTO,
  inspecionarEquipamentoSchema,
  isUuid,
  MESES_DE_VALIDADE_DA_BRIGADA,
  novoBrigadistaSchema,
  novoEquipamentoSchema,
  ordemDeServicoSstSchema,
  PATTERNS,
  planoDeEmergenciaSchema,
  SERVICES,
  situacaoDoEquipamentoSchema,
  type Brigadista,
  type CategoriaDeEquipamento,
  type Contexto,
  type Equipamento,
  type Funcionario,
  type InspecaoDeEquipamento,
  type OrdemDeServicoSst,
  type PlanoDeEmergencia,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  brigadistas,
  equipamentos,
  funcaoRiscos,
  ordensSst,
  planosDeEmergencia,
  riscos,
} from '../db/schema.js';
import { vencimentosDoEquipamento } from './regras.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };
const CONFLITO =
  'Este registro foi alterado por outra pessoa. Recarregue a página.';

/** Equipamentos de emergência, brigada, plano de emergência e ordem de serviço de segurança. */
@Injectable()
export class EmergenciaService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  // ---------------------------------------------------------------- equipamentos

  async listarEquipamentos(ctx: Contexto): Promise<Equipamento[]> {
    const linhas = await this.db
      .select()
      .from(equipamentos)
      .where(eq(equipamentos.empresaId, ctx.empresaId))
      .orderBy(asc(equipamentos.categoria), asc(equipamentos.identificacao));
    const hoje = hojeEmBrasilia();
    return linhas.map((l) => montarEquipamento(l, hoje));
  }

  async obterEquipamento(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<Equipamento> {
    return montarEquipamento(
      await this.equipamento(ctx, dados?.id),
      hojeEmBrasilia(),
    );
  }

  async criarEquipamento(ctx: Contexto, dados: unknown): Promise<Equipamento> {
    const n = validar(novoEquipamentoSchema, dados);
    this.conferirDatas(n);
    try {
      const [l] = await this.db
        .insert(equipamentos)
        .values({
          ...n,
          inspecaoDias:
            n.inspecaoDias ??
            CATEGORIAS_DE_EQUIPAMENTO[n.categoria].inspecaoDias,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarEquipamento(l!, hojeEmBrasilia());
    } catch (e) {
      if (violacaoUnica(e))
        throw invalido(
          'identificacao',
          'Já existe um equipamento desta categoria com esta identificação.',
        );
      throw e;
    }
  }

  async atualizarEquipamento(
    ctx: Contexto,
    dados: ComId,
  ): Promise<Equipamento> {
    const { versao, ...n } = validar(
      atualizarEquipamentoSchema,
      dados?.alteracoes,
    );
    this.conferirDatas(n);
    return this.gravarEquipamento(ctx, dados?.id, versao, {
      ...n,
      inspecaoDias:
        n.inspecaoDias ?? CATEGORIAS_DE_EQUIPAMENTO[n.categoria].inspecaoDias,
    });
  }

  async mudarSituacaoDoEquipamento(
    ctx: Contexto,
    dados: ComId,
  ): Promise<Equipamento> {
    const { versao, ativo } = validar(
      situacaoDoEquipamentoSchema,
      dados?.alteracoes,
    );
    return this.gravarEquipamento(ctx, dados?.id, versao, { ativo });
  }

  /** Inspeção: atualiza a última data (e recarga/teste, se feitos); não conforme deixa a pendência até a próxima conforme. */
  async inspecionar(ctx: Contexto, dados: ComId): Promise<Equipamento> {
    const i = validar(inspecionarEquipamentoSchema, dados?.alteracoes);
    if (i.data > hojeEmBrasilia())
      throw invalido('data', 'A inspeção não pode estar no futuro.');
    const atual = await this.equipamento(ctx, dados?.id);
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Equipamento inativo não recebe inspeção.',
      );
    const categoria =
      CATEGORIAS_DE_EQUIPAMENTO[atual.categoria as CategoriaDeEquipamento];
    if (i.recarregado && !categoria.recargaMeses)
      throw invalido('recarregado', 'Esta categoria não tem recarga.');
    if (i.testado && !categoria.testeMeses)
      throw invalido('testado', 'Esta categoria não tem teste hidrostático.');
    const registro: InspecaoDeEquipamento = {
      data: i.data,
      resultado: i.resultado,
      responsavel: i.responsavel,
      observacao: i.observacao,
    };
    const historico = [
      registro,
      ...(atual.inspecoes as InspecaoDeEquipamento[]),
    ].slice(0, 100);
    return this.gravarEquipamento(ctx, atual.id, i.versao, {
      ultimaInspecao:
        !atual.ultimaInspecao || i.data > atual.ultimaInspecao
          ? i.data
          : atual.ultimaInspecao,
      ...(i.recarregado ? { ultimaRecarga: i.data } : {}),
      ...(i.testado ? { ultimoTeste: i.data } : {}),
      pendencia: i.resultado === 'nao_conforme' ? i.observacao : null,
      inspecoes: historico,
    });
  }

  // ---------------------------------------------------------------- brigada

  async listarBrigada(ctx: Contexto): Promise<Brigadista[]> {
    const linhas = await this.db
      .select()
      .from(brigadistas)
      .where(eq(brigadistas.empresaId, ctx.empresaId))
      .orderBy(asc(brigadistas.papel), asc(brigadistas.nome));
    const hoje = hojeEmBrasilia();
    return linhas.map((l) => montarBrigadista(l, hoje));
  }

  async incluirBrigadista(ctx: Contexto, dados: unknown): Promise<Brigadista> {
    const n = validar(novoBrigadistaSchema, dados);
    if (n.treinadoEm > hojeEmBrasilia())
      throw invalido('treinadoEm', 'A data não pode estar no futuro.');
    const f = await pedir<Funcionario>(
      this.codex,
      PATTERNS.funcionarios.obter,
      { id: n.funcionarioId },
      ctx,
      'Cadastros',
    );
    if (!f.ativo) throw invalido('funcionarioId', `${f.nome} está desligado.`);
    try {
      const [l] = await this.db
        .insert(brigadistas)
        .values({
          ...n,
          nome: f.nome,
          setor: f.setorNome,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return montarBrigadista(l!, hojeEmBrasilia());
    } catch (e) {
      if (violacaoUnica(e))
        throw invalido('funcionarioId', `${f.nome} já está na brigada.`);
      throw e;
    }
  }

  async atualizarBrigadista(ctx: Contexto, dados: ComId): Promise<Brigadista> {
    const { versao, ...n } = validar(
      atualizarBrigadistaSchema,
      dados?.alteracoes,
    );
    if (n.treinadoEm > hojeEmBrasilia())
      throw invalido('treinadoEm', 'A data não pode estar no futuro.');
    const [l] = isUuid(dados?.id)
      ? await this.db
          .update(brigadistas)
          .set({ ...n, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(brigadistas.id, dados.id),
              eq(brigadistas.empresaId, ctx.empresaId),
              eq(brigadistas.atualizadoEm, new Date(versao)),
            ),
          )
          .returning()
      : [];
    if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
    return montarBrigadista(l, hojeEmBrasilia());
  }

  async retirarBrigadista(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<{ ok: true }> {
    const [l] = isUuid(dados?.id)
      ? await this.db
          .delete(brigadistas)
          .where(
            and(
              eq(brigadistas.id, dados.id),
              eq(brigadistas.empresaId, ctx.empresaId),
            ),
          )
          .returning()
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Brigadista não encontrado.');
    return { ok: true };
  }

  // ---------------------------------------------------------------- plano de emergência

  async obterPlano(ctx: Contexto): Promise<PlanoDeEmergencia | null> {
    const [l] = await this.db
      .select()
      .from(planosDeEmergencia)
      .where(eq(planosDeEmergencia.empresaId, ctx.empresaId));
    return l ? montarPlano(l) : null;
  }

  async salvarPlano(ctx: Contexto, dados: unknown): Promise<PlanoDeEmergencia> {
    const { versao, ...p } = validar(planoDeEmergenciaSchema, dados);
    const [atual] = await this.db
      .select()
      .from(planosDeEmergencia)
      .where(eq(planosDeEmergencia.empresaId, ctx.empresaId));
    if (atual) {
      if (atual.atualizadoEm.toISOString() !== versao)
        throw new ErroDeNegocio('CONFLITO', CONFLITO);
      const [l] = await this.db
        .update(planosDeEmergencia)
        .set({ dados: p, atualizadoPor: ctx.usuarioId })
        .where(eq(planosDeEmergencia.id, atual.id))
        .returning();
      return montarPlano(l!);
    }
    const [l] = await this.db
      .insert(planosDeEmergencia)
      .values({
        dados: p,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montarPlano(l!);
  }

  // ---------------------------------------------------------------- ordem de serviço de segurança

  async obterOrdemSst(
    ctx: Contexto,
    dados: unknown,
  ): Promise<OrdemDeServicoSst | null> {
    const funcaoId = String((dados as { funcaoId?: unknown })?.funcaoId ?? '');
    if (!isUuid(funcaoId)) throw invalido('funcaoId', 'Função inválida.');
    const [[o], rs] = await Promise.all([
      this.db
        .select()
        .from(ordensSst)
        .where(
          and(
            eq(ordensSst.empresaId, ctx.empresaId),
            eq(ordensSst.funcaoId, funcaoId),
          ),
        ),
      this.riscosDaFuncao(ctx, funcaoId),
    ]);
    if (!o) return null;
    return {
      funcaoId,
      atividades: o.atividades,
      procedimentos: o.procedimentos,
      proibicoes: o.proibicoes,
      emergencia: o.emergencia,
      riscos: rs,
      revisadaEm: o.atualizadoEm.toISOString(),
      versao: o.atualizadoEm.toISOString(),
    };
  }

  async salvarOrdemSst(
    ctx: Contexto,
    dados: unknown,
  ): Promise<OrdemDeServicoSst> {
    const { funcaoId, versao, ...o } = validar(ordemDeServicoSstSchema, dados);
    const [atual] = await this.db
      .select()
      .from(ordensSst)
      .where(
        and(
          eq(ordensSst.empresaId, ctx.empresaId),
          eq(ordensSst.funcaoId, funcaoId),
        ),
      );
    if (atual) {
      if (atual.atualizadoEm.toISOString() !== versao)
        throw new ErroDeNegocio('CONFLITO', CONFLITO);
      await this.db
        .update(ordensSst)
        .set({ ...o, atualizadoPor: ctx.usuarioId })
        .where(eq(ordensSst.id, atual.id));
    } else
      await this.db.insert(ordensSst).values({
        ...o,
        funcaoId,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      });
    return (await this.obterOrdemSst(ctx, { funcaoId }))!;
  }

  // ---------------------------------------------------------------- apoio

  private async riscosDaFuncao(ctx: Contexto, funcaoId: string) {
    const linhas = await this.db
      .select({ r: riscos })
      .from(funcaoRiscos)
      .innerJoin(riscos, eq(riscos.id, funcaoRiscos.riscoId))
      .where(
        and(
          eq(funcaoRiscos.empresaId, ctx.empresaId),
          eq(funcaoRiscos.funcaoId, funcaoId),
          eq(riscos.ativo, true),
        ),
      )
      .orderBy(asc(riscos.perigo));
    return linhas.map(({ r }) => ({
      id: r.id,
      perigo: r.perigo,
      danos: r.danos,
      controles: r.controles,
    }));
  }

  private conferirDatas(n: {
    ultimaInspecao: string | null;
    ultimaRecarga: string | null;
    ultimoTeste: string | null;
  }) {
    const hoje = hojeEmBrasilia();
    for (const campo of [
      'ultimaInspecao',
      'ultimaRecarga',
      'ultimoTeste',
    ] as const)
      if (n[campo] && n[campo]! > hoje)
        throw invalido(campo, 'A data não pode estar no futuro.');
  }

  private async equipamento(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(equipamentos)
          .where(
            and(
              eq(equipamentos.id, id),
              eq(equipamentos.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Equipamento não encontrado.');
    return l;
  }

  private async gravarEquipamento(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof equipamentos.$inferInsert>,
  ): Promise<Equipamento> {
    if (!isUuid(id))
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Equipamento não encontrado.');
    try {
      const [l] = await this.db
        .update(equipamentos)
        .set({ ...valores, atualizadoPor: ctx.usuarioId })
        .where(
          and(
            eq(equipamentos.id, id),
            eq(equipamentos.empresaId, ctx.empresaId),
            eq(equipamentos.atualizadoEm, new Date(versao)),
          ),
        )
        .returning();
      if (!l) throw new ErroDeNegocio('CONFLITO', CONFLITO);
      return montarEquipamento(l, hojeEmBrasilia());
    } catch (e) {
      if (violacaoUnica(e))
        throw invalido(
          'identificacao',
          'Já existe um equipamento desta categoria com esta identificação.',
        );
      throw e;
    }
  }
}

function montarEquipamento(
  l: typeof equipamentos.$inferSelect,
  hoje: string,
): Equipamento {
  const categoria = l.categoria as CategoriaDeEquipamento;
  return {
    id: l.id,
    categoria,
    identificacao: l.identificacao,
    local: l.local,
    detalhes: l.detalhes,
    inspecaoDias: l.inspecaoDias,
    ultimaInspecao: l.ultimaInspecao,
    ultimaRecarga: l.ultimaRecarga,
    ultimoTeste: l.ultimoTeste,
    ...vencimentosDoEquipamento({ ...l, categoria }, hoje),
    pendencia: l.pendencia,
    inspecoes: l.inspecoes as InspecaoDeEquipamento[],
    ativo: l.ativo,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarBrigadista(
  l: typeof brigadistas.$inferSelect,
  hoje: string,
): Brigadista {
  const validade = somarMeses(l.treinadoEm, MESES_DE_VALIDADE_DA_BRIGADA);
  return {
    id: l.id,
    funcionarioId: l.funcionarioId,
    nome: l.nome,
    setor: l.setor,
    papel: l.papel as Brigadista['papel'],
    turno: l.turno,
    treinadoEm: l.treinadoEm,
    validade,
    vencido: validade < hoje,
    versao: l.atualizadoEm.toISOString(),
  };
}

function montarPlano(
  l: typeof planosDeEmergencia.$inferSelect,
): PlanoDeEmergencia {
  return {
    ...(l.dados as Omit<PlanoDeEmergencia, 'revisadoEm' | 'versao'>),
    revisadoEm: l.atualizadoEm.toISOString(),
    versao: l.atualizadoEm.toISOString(),
  };
}

const invalido = (campo: string, mensagem: string) =>
  new ErroDeNegocio('DADOS_INVALIDOS', 'Verifique os campos destacados.', [
    { campo, mensagem },
  ]);
