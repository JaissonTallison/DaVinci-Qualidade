import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { hojeEmBrasilia, pedir, validar } from '@davinci/shared';
import {
  buscaNoPainelSchema,
  filtroPainelSchema,
  modulosVisiveis,
  PATTERNS,
  SERVICES,
  uuidv7,
  type Busca,
  type Contexto,
  type ModuloDaBusca,
  type ResultadoDaBusca,
  type DestinatarioDeAviso,
  type ModuloDoPainel,
  type PainelDeVencimentos,
  type Prazo,
  type ResultadoDosAvisos,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { avisosEnviados } from '../db/schema.js';
import { itensDoAviso, montarAviso } from './regras.js';

type Db = Database<typeof schema>;
type Cliente = Pick<ClientProxy, 'send' | 'emit'>;

/** Hora (Brasília) a partir da qual o aviso do dia sai. */
const HORA_DO_AVISO = 7;
const VERIFICAR_A_CADA_MS = 10 * 60_000;

@Injectable()
export class PaineisService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly log = new Logger('Avisos');
  private relogio?: NodeJS.Timeout;

  constructor(
    @Inject(DATABASE) private readonly db: Db,
    @Inject(SERVICES.QUALIDADE) private readonly qualidade: Cliente,
    @Inject(SERVICES.SEGURANCA) private readonly seguranca: Cliente,
    @Inject(SERVICES.CODEX) private readonly codex: Cliente,
    @Inject(SERVICES.SGI) private readonly sgi: Cliente,
    @Inject(SERVICES.AUDITORIAS) private readonly auditorias: Cliente,
    @Inject(SERVICES.SERVICOS) private readonly servicos: Cliente,
    @Inject(SERVICES.AMBIENTAL) private readonly ambiental: Cliente,
    @Inject(SERVICES.ESG) private readonly esg: Cliente,
    @Inject(SERVICES.IDENTIDADE) private readonly identidade: Cliente,
    @Inject(SERVICES.PLATAFORMA) private readonly plataforma: Cliente,
  ) {}

  /** O gateway manda só os módulos que a pessoa vê. Módulo que não responde não derruba o painel. */
  async vencimentos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<PainelDeVencimentos> {
    const { modulos, dias } = validar(filtroPainelSchema, dados);
    return this.juntar(ctx, modulos, dias);
  }

  /** Pesquisa geral: pergunta a cada serviço que a pessoa vê; quem não responde em 5 s fica de fora. */
  async buscar(ctx: Contexto, dados: unknown): Promise<Busca> {
    const { termo, modulos } = validar(buscaNoPainelSchema, dados);
    const fontes: Record<ModuloDaBusca, [Cliente, string, string]> = {
      qualidade: [this.qualidade, PATTERNS.busca.qualidade, 'Qualidade'],
      auditorias: [this.auditorias, PATTERNS.busca.auditorias, 'Auditorias'],
      sgi: [this.sgi, PATTERNS.busca.sgi, 'SGI'],
      servicos: [this.servicos, PATTERNS.busca.servicos, 'Serviços'],
      ambiental: [this.ambiental, PATTERNS.busca.ambiental, 'Meio Ambiente'],
      esg: [this.esg, PATTERNS.busca.esg, 'Agenda ESG'],
      seguranca: [this.seguranca, PATTERNS.busca.seguranca, 'Segurança'],
      funcionarios: [this.codex, PATTERNS.busca.codex, 'Cadastros'],
    };
    const respostas = await Promise.allSettled(
      modulos.map((m) =>
        pedir<ResultadoDaBusca[]>(
          fontes[m][0],
          fontes[m][1],
          { termo },
          ctx,
          fontes[m][2],
          5_000,
        ),
      ),
    );
    const resultados: ResultadoDaBusca[] = [];
    const indisponiveis: ModuloDaBusca[] = [];
    respostas.forEach((r, i) =>
      r.status === 'fulfilled'
        ? resultados.push(...r.value)
        : indisponiveis.push(modulos[i]!),
    );
    return { resultados, indisponiveis };
  }

  /**
   * Avisos por e-mail. Sem `empresaId`: rotina diária, uma vez por empresa por dia.
   * Com `empresaId`: pedido manual do administrador, manda agora mesmo que já tenha ido hoje.
   */
  async enviarAvisos(empresaId?: string): Promise<ResultadoDosAvisos> {
    const hoje = hojeEmBrasilia();
    const sistema: Contexto = {
      empresaId: empresaId ?? '00000000-0000-7000-8000-000000000000',
      usuarioId: null,
      rastreioId: uuidv7(),
    };
    const todos = await pedir<DestinatarioDeAviso[]>(
      this.identidade,
      PATTERNS.usuarios.destinatariosDeAvisos,
      {},
      sistema,
      'Identidade',
      15_000,
    );
    const porEmpresa = new Map<string, DestinatarioDeAviso[]>();
    for (const d of todos)
      if (!empresaId || d.empresaId === empresaId)
        porEmpresa.set(d.empresaId, [
          ...(porEmpresa.get(d.empresaId) ?? []),
          d,
        ]);
    let emails = 0;
    let empresas = 0;
    for (const [id, pessoas] of porEmpresa) {
      if (!empresaId) {
        const [ja] = await this.db
          .select()
          .from(avisosEnviados)
          .where(
            and(
              eq(avisosEnviados.empresaId, id),
              eq(avisosEnviados.data, hoje),
            ),
          );
        if (ja) continue;
      }
      const ctx: Contexto = {
        empresaId: id,
        usuarioId: null,
        rastreioId: uuidv7(),
      };
      const { prazos } = await this.juntar(ctx, [
        'qualidade',
        'seguranca',
        'funcionarios',
        'sgi',
        'servicos',
        'ambiental',
        'esg',
      ]);
      let daEmpresa = 0;
      for (const p of pessoas) {
        const visiveis = new Set(modulosVisiveis(p.permissoes, p.recursos));
        const itens = itensDoAviso(
          prazos.filter((x) => visiveis.has(x.modulo)),
          hoje,
        );
        if (!itens.length) continue;
        this.plataforma.emit(PATTERNS.notificacoes.enviarEmail, {
          contexto: ctx,
          dados: montarAviso(
            p.email,
            p.nome,
            p.empresaNome,
            itens,
            process.env.APP_URL ?? 'http://localhost:3170',
          ),
        });
        daEmpresa++;
      }
      await this.db
        .insert(avisosEnviados)
        .values({ empresaId: id, data: hoje, emails: daEmpresa })
        .onConflictDoUpdate({
          target: [avisosEnviados.empresaId, avisosEnviados.data],
          set: { emails: daEmpresa, enviadoEm: new Date() },
        });
      emails += daEmpresa;
      empresas++;
    }
    return { empresas, emails };
  }

  onApplicationBootstrap() {
    if (process.env.AVISOS_AUTOMATICOS === 'nao') return;
    this.relogio = setInterval(() => void this.rotina(), VERIFICAR_A_CADA_MS);
    this.relogio.unref();
  }

  onApplicationShutdown() {
    if (this.relogio) clearInterval(this.relogio);
  }

  private async rotina() {
    const hora = Number(
      new Date()
        .toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
        .slice(11, 13),
    );
    if (hora < HORA_DO_AVISO) return;
    try {
      const r = await this.enviarAvisos();
      if (r.empresas)
        this.log.log(
          `Avisos do dia: ${r.emails} e-mails em ${r.empresas} empresas.`,
        );
    } catch (erro) {
      this.log.error(
        `Avisos do dia falharam; nova tentativa em ${VERIFICAR_A_CADA_MS / 60_000} minutos.`,
        erro instanceof Error ? erro.stack : String(erro),
      );
    }
  }

  private async juntar(
    ctx: Contexto,
    modulos: ModuloDoPainel[],
    dias = 30,
  ): Promise<PainelDeVencimentos> {
    const fontes: Record<ModuloDoPainel, [Cliente, string, string]> = {
      qualidade: [this.qualidade, PATTERNS.prazos.qualidade, 'Qualidade'],
      seguranca: [this.seguranca, PATTERNS.prazos.seguranca, 'Segurança'],
      funcionarios: [this.codex, PATTERNS.prazos.codex, 'Cadastros'],
      sgi: [this.sgi, PATTERNS.prazos.sgi, 'SGI'],
      servicos: [this.servicos, PATTERNS.prazos.servicos, 'Serviços'],
      ambiental: [this.ambiental, PATTERNS.prazos.ambiental, 'Meio Ambiente'],
      esg: [this.esg, PATTERNS.prazos.esg, 'Agenda ESG'],
    };
    const respostas = await Promise.allSettled(
      modulos.map((m) =>
        pedir<Prazo[]>(fontes[m][0], fontes[m][1], { dias }, ctx, fontes[m][2]),
      ),
    );
    const prazos: Prazo[] = [];
    const indisponiveis: ModuloDoPainel[] = [];
    respostas.forEach((r, i) =>
      r.status === 'fulfilled'
        ? prazos.push(...r.value)
        : indisponiveis.push(modulos[i]!),
    );
    prazos.sort(
      (a, b) =>
        a.data.localeCompare(b.data) || a.tipo.localeCompare(b.tipo, 'pt-BR'),
    );
    return { prazos, indisponiveis };
  }
}
