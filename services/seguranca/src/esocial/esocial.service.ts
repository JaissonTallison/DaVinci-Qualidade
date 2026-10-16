import { Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, desc, eq, gte, inArray, ne } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, pedir, validar } from '@davinci/shared';
import {
  configuracaoEsocialSchema,
  ehAcidenteComLesao,
  gerarEventoSchema,
  isUuid,
  marcarEnviadoSchema,
  PATTERNS,
  SERVICES,
  type AsoParaEsocial,
  type CandidatoAoEvento,
  type ConfiguracaoEsocial,
  type Contexto,
  type DadosDaCat,
  type DadosEsocialDoRisco,
  type EventoEsocial,
  type EventoSst,
  type Funcionario,
  type FuncionarioResumo,
  type Pagina,
  type PainelEsocial,
  type TipoAcidente,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  acidentes,
  configuracaoEsocial,
  epis,
  eventosEsocial,
  funcaoEpis,
  funcaoRiscos,
  ordensSst,
  riscos,
} from '../db/schema.js';
import {
  idDoEvento,
  xmlS2210,
  xmlS2220,
  xmlS2240,
  type RiscoNoS2240,
} from './xml.js';

type Db = Database<typeof schema>;
const CADASTROS = 'Cadastros';

/** Monta o XML do candidato, ou devolve o que falta. */
type Preparo = CandidatoAoEvento & {
  montar?: (c: ConfiguracaoEsocial, id: string) => string;
};

@Injectable()
export class EsocialService {
  constructor(
    @Inject(DATABASE) private readonly db: Db,
    @Inject(SERVICES.CODEX) private readonly codex: Pick<ClientProxy, 'send'>,
  ) {}

  async painel(ctx: Contexto): Promise<PainelEsocial> {
    const configuracao = await this.configuracao(ctx);
    const eventos = await this.eventos(ctx);
    if (!configuracao)
      return {
        configurado: false,
        configuracao: null,
        candidatos: [],
        eventos,
      };
    const candidatos = (await this.preparar(ctx, configuracao)).map(
      ({ montar: _, ...c }) => c,
    );
    return { configurado: true, configuracao, candidatos, eventos };
  }

  async salvarConfiguracao(
    ctx: Contexto,
    dados: unknown,
  ): Promise<PainelEsocial> {
    const c = validar(configuracaoEsocialSchema, dados);
    await this.db
      .insert(configuracaoEsocial)
      .values({
        empresaId: ctx.empresaId,
        dados: c,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .onConflictDoUpdate({
        target: configuracaoEsocial.empresaId,
        set: {
          dados: c,
          atualizadoPor: ctx.usuarioId,
          atualizadoEm: new Date(),
        },
      });
    return this.painel(ctx);
  }

  /** Gera o XML de um candidato pronto e guarda o evento (a geração anterior continua no histórico). */
  async gerar(ctx: Contexto, dados: unknown): Promise<EventoEsocial> {
    const { evento, referenciaId } = validar(gerarEventoSchema, dados);
    const c = await this.configuracao(ctx);
    if (!c)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Configure o eSocial antes de gerar eventos.',
      );
    const p = (await this.preparar(ctx, c, { evento, referenciaId }))[0];
    if (!p)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Registro não encontrado para este evento.',
      );
    if (p.pendencias.length || !p.montar)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        `Antes de gerar: ${p.pendencias.join(' ')}`,
      );
    const quantos = (
      await this.db
        .select({ id: eventosEsocial.id })
        .from(eventosEsocial)
        .where(eq(eventosEsocial.empresaId, ctx.empresaId))
    ).length;
    const id = idDoEvento(c.cnpj, new Date(), quantos + 1);
    const [l] = await this.db
      .insert(eventosEsocial)
      .values({
        evento,
        referenciaId,
        descricao: p.descricao.slice(0, 200),
        funcionarioNome: p.funcionarioNome,
        idDoEvento: id,
        xml: p.montar(c, id),
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return montarEvento(l!);
  }

  async xml(
    ctx: Contexto,
    dados: { id?: unknown },
  ): Promise<{ nome: string; xml: string }> {
    const l = await this.evento(ctx, dados?.id);
    return { nome: `${l.evento}-${l.idDoEvento}.xml`, xml: l.xml };
  }

  async marcarEnviado(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<EventoEsocial> {
    const { recibo } = validar(marcarEnviadoSchema, dados?.alteracoes);
    const l = await this.evento(ctx, dados?.id);
    const [m] = await this.db
      .update(eventosEsocial)
      .set({ recibo, enviadoEm: new Date(), atualizadoPor: ctx.usuarioId })
      .where(eq(eventosEsocial.id, l.id))
      .returning();
    return montarEvento(m!);
  }

  // ---------------------------------------------------------------- candidatos

  private async preparar(
    ctx: Contexto,
    c: ConfiguracaoEsocial,
    so?: { evento: EventoSst; referenciaId: string },
  ): Promise<Preparo[]> {
    const ultimos = new Map<string, string>();
    for (const ev of await this.eventos(ctx)) {
      const k = `${ev.evento}|${ev.referenciaId}`;
      if (!ultimos.has(k)) ultimos.set(k, ev.id);
    }
    const lista: Preparo[] = [];
    if (!so || so.evento === 'S-2210')
      lista.push(...(await this.candidatosS2210(ctx, c, so?.referenciaId)));
    if (!so || so.evento === 'S-2220')
      lista.push(...(await this.candidatosS2220(ctx, c, so?.referenciaId)));
    if (!so || so.evento === 'S-2240')
      lista.push(...(await this.candidatosS2240(ctx, c, so?.referenciaId)));
    return lista.map((p) => ({
      ...p,
      geradoId: ultimos.get(`${p.evento}|${p.referenciaId}`) ?? null,
    }));
  }

  private async candidatosS2210(
    ctx: Contexto,
    c: ConfiguracaoEsocial,
    ref?: string,
  ): Promise<Preparo[]> {
    const linhas = await this.db
      .select()
      .from(acidentes)
      .where(
        and(
          eq(acidentes.empresaId, ctx.empresaId),
          ne(acidentes.status, 'cancelado'),
          gte(acidentes.data, c.inicioSst),
          ...(ref && isUuid(ref) ? [eq(acidentes.id, ref)] : []),
        ),
      )
      .orderBy(desc(acidentes.data));
    const saida: Preparo[] = [];
    for (const a of linhas.filter((x) =>
      ehAcidenteComLesao(x.tipo as TipoAcidente),
    )) {
      const cat = a.dadosCat as DadosDaCat | null;
      const base = {
        evento: 'S-2210' as const,
        referenciaId: a.id,
        descricao: `${a.numero} · ${a.local}`,
        funcionarioNome: a.acidentado,
        data: a.data,
        geradoId: null,
      };
      if (!cat) {
        saida.push({
          ...base,
          pendencias: ['Preencha o complemento eSocial da CAT no acidente.'],
        });
        continue;
      }
      const f = await this.funcionario(ctx, cat.acidentadoId);
      saida.push({
        ...base,
        funcionarioNome: f.nome,
        pendencias: [],
        montar: (cfg, id) =>
          xmlS2210(
            cfg,
            id,
            f,
            { data: a.data, houveAfastamento: a.tipo === 'com_afastamento' },
            cat,
          ),
      });
    }
    return saida;
  }

  private async candidatosS2220(
    ctx: Contexto,
    c: ConfiguracaoEsocial,
    ref?: string,
  ): Promise<Preparo[]> {
    const asos = (
      await pedir<AsoParaEsocial[]>(
        this.codex,
        PATTERNS.asos.paraEsocial,
        { desde: c.inicioSst },
        ctx,
        CADASTROS,
      )
    ).filter((a) => !ref || a.id === ref);
    return asos.map((a) => {
      const pendencias = [
        !a.medico && 'Informe o médico que emitiu o ASO.',
        !a.crm && 'Informe o CRM do médico.',
        !a.ufCrm && 'Informe a UF do CRM.',
        !a.exames.length &&
          'Informe os exames realizados (procedimento da tabela 27).',
      ].filter((x): x is string => Boolean(x));
      return {
        evento: 'S-2220' as const,
        referenciaId: a.id,
        descricao: `ASO ${a.tipo.replace(/_/g, ' ')} de ${a.data}`,
        funcionarioNome: a.funcionarioNome,
        data: a.data,
        geradoId: null,
        pendencias,
        montar: pendencias.length
          ? undefined
          : (cfg, id) =>
              xmlS2220(
                cfg,
                id,
                { cpf: a.cpf, matricula: a.matricula },
                {
                  tipo: a.tipo,
                  data: a.data,
                  resultado: a.resultado,
                  medico: a.medico!,
                  crm: a.crm!,
                  ufCrm: a.ufCrm!,
                  exames: a.exames,
                },
              ),
      };
    });
  }

  private async candidatosS2240(
    ctx: Contexto,
    c: ConfiguracaoEsocial,
    ref?: string,
  ): Promise<Preparo[]> {
    const pessoas: FuncionarioResumo[] = [];
    if (ref) pessoas.push(await this.funcionario(ctx, ref));
    else
      for (let pagina = 1; pagina <= 50; pagina++) {
        const p = await pedir<Pagina<FuncionarioResumo>>(
          this.codex,
          PATTERNS.funcionarios.listar,
          { situacao: 'ativos', porPagina: 100, pagina },
          ctx,
          CADASTROS,
        );
        pessoas.push(...p.itens);
        if (pessoas.length >= p.total || !p.itens.length) break;
      }
    // Funções das pessoas: o resumo não traz o id da função, então cada pessoa é lida no cadastro
    const detalhes = ref
      ? (pessoas as Funcionario[])
      : await Promise.all(pessoas.map((p) => this.funcionario(ctx, p.id)));
    const funcoes = [...new Set(detalhes.map((d) => d.funcaoId))];
    const [ligados, episDaFuncao, ordens] = funcoes.length
      ? await Promise.all([
          this.db
            .select({ funcaoId: funcaoRiscos.funcaoId, r: riscos })
            .from(funcaoRiscos)
            .innerJoin(riscos, eq(riscos.id, funcaoRiscos.riscoId))
            .where(
              and(
                eq(funcaoRiscos.empresaId, ctx.empresaId),
                inArray(funcaoRiscos.funcaoId, funcoes),
              ),
            ),
          this.db
            .select({ funcaoId: funcaoEpis.funcaoId, ca: epis.ca })
            .from(funcaoEpis)
            .innerJoin(epis, eq(epis.id, funcaoEpis.epiId))
            .where(
              and(
                eq(funcaoEpis.empresaId, ctx.empresaId),
                inArray(funcaoEpis.funcaoId, funcoes),
              ),
            ),
          this.db
            .select({
              funcaoId: ordensSst.funcaoId,
              atividades: ordensSst.atividades,
            })
            .from(ordensSst)
            .where(
              and(
                eq(ordensSst.empresaId, ctx.empresaId),
                inArray(ordensSst.funcaoId, funcoes),
              ),
            ),
        ])
      : [[], [], []];
    return detalhes.map((f) => {
      const rs = ligados
        .filter((l) => l.funcaoId === f.funcaoId && l.r.ativo)
        .map((l) => l.r);
      const semDados = rs.filter((r) => !r.dadosEsocial).map((r) => r.perigo);
      const atividades = ordens.find(
        (o) => o.funcaoId === f.funcaoId,
      )?.atividades;
      const pendencias = [
        semDados.length &&
          `Informe o agente nocivo (tabela 24) dos riscos: ${semDados.join('; ')}.`,
        !atividades &&
          `Descreva as atividades da função ${f.funcaoNome} na ordem de serviço de segurança.`,
      ].filter((x): x is string => Boolean(x));
      const inicio = f.admissao > c.inicioSst ? f.admissao : c.inicioSst;
      const riscosDoEvento: RiscoNoS2240[] = rs.map((r) => ({
        perigo: r.perigo,
        controles: r.controles,
        dados: r.dadosEsocial as DadosEsocialDoRisco,
      }));
      const cas = episDaFuncao
        .filter((e) => e.funcaoId === f.funcaoId)
        .map((e) => e.ca);
      return {
        evento: 'S-2240' as const,
        referenciaId: f.id,
        descricao: `${f.funcaoNome} · ${f.setorNome}`,
        funcionarioNome: f.nome,
        data: inicio,
        geradoId: null,
        pendencias,
        montar: pendencias.length
          ? undefined
          : (cfg, id) =>
              xmlS2240(
                cfg,
                id,
                f,
                { inicio, setor: f.setorNome, atividades: atividades! },
                riscosDoEvento,
                cas,
              ),
      };
    });
  }

  // ---------------------------------------------------------------- apoio

  private async configuracao(
    ctx: Contexto,
  ): Promise<ConfiguracaoEsocial | null> {
    const [l] = await this.db
      .select()
      .from(configuracaoEsocial)
      .where(eq(configuracaoEsocial.empresaId, ctx.empresaId));
    return (l?.dados as ConfiguracaoEsocial) ?? null;
  }

  private async eventos(ctx: Contexto): Promise<EventoEsocial[]> {
    const linhas = await this.db
      .select()
      .from(eventosEsocial)
      .where(eq(eventosEsocial.empresaId, ctx.empresaId))
      .orderBy(desc(eventosEsocial.criadoEm))
      .limit(500);
    return linhas.map(montarEvento);
  }

  private async evento(ctx: Contexto, id: unknown) {
    const [l] = isUuid(id)
      ? await this.db
          .select()
          .from(eventosEsocial)
          .where(
            and(
              eq(eventosEsocial.id, id),
              eq(eventosEsocial.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Evento não encontrado.');
    return l;
  }

  private funcionario(ctx: Contexto, id: string): Promise<Funcionario> {
    return pedir<Funcionario>(
      this.codex,
      PATTERNS.funcionarios.obter,
      { id },
      ctx,
      CADASTROS,
    );
  }
}

function montarEvento(l: typeof eventosEsocial.$inferSelect): EventoEsocial {
  return {
    id: l.id,
    evento: l.evento as EventoSst,
    referenciaId: l.referenciaId,
    descricao: l.descricao,
    funcionarioNome: l.funcionarioNome,
    idDoEvento: l.idDoEvento,
    status: l.enviadoEm ? 'enviado' : 'gerado',
    recibo: l.recibo,
    geradoEm: l.criadoEm.toISOString(),
    enviadoEm: l.enviadoEm?.toISOString() ?? null,
  };
}
