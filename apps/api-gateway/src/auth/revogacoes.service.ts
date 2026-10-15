import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  EVENTOS,
  assinarEvento,
  encerrarEventos,
} from '@davinci/shared/eventos';
import {
  PATTERNS,
  SERVICES,
  uuidv7,
  type SessoesRevogadas,
} from '@davinci/types';
import { MensageriaService } from '../mensageria.service.js';

/** O token de acesso vale 15 min: guardar a revogação um pouco mais que isso basta. */
const GUARDAR_POR_MS = 16 * 60_000;

/**
 * Revogação IMEDIATA (decisão A64): sessões encerradas à força chegam por evento do Identidade
 * e os tokens delas são recusados na hora, sem consultar o banco a cada requisição.
 * Ao subir, busca as revogações dos últimos minutos (para não "esquecer" após reiniciar).
 */
@Injectable()
export class RevogacoesService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger('Revogações');
  private readonly revogadas = new Map<string, number>();
  private cancelar?: () => Promise<void>;

  constructor(private readonly mensageria: MensageriaService) {}

  /** Não segura a subida do gateway: assina e busca em segundo plano. */
  onApplicationBootstrap() {
    if (process.env.REVOGACAO_POR_EVENTO === 'desligada') return;
    void assinarEvento<SessoesRevogadas>(EVENTOS.sessoesRevogadas, (e) =>
      this.registrar(e.familias),
    )
      .then((c) => (this.cancelar = c))
      .catch((erro: unknown) =>
        this.logger.error(
          `Não foi possível assinar as revogações: ${(erro as Error).message}`,
        ),
      );
    void this.mensageria
      .enviar<{ familias: string[] }>(
        SERVICES.IDENTIDADE,
        PATTERNS.identidade.revogacoesRecentes,
        {},
        { rastreioId: uuidv7() },
        5_000,
      )
      .then((r) => this.registrar(r.familias))
      .catch(() =>
        this.logger.warn(
          'Identidade fora do ar ao subir: revogações anteriores valem até o token vencer (máx. 15 min).',
        ),
      );
  }

  async onModuleDestroy() {
    await this.cancelar?.();
    await encerrarEventos();
  }

  registrar(familias: unknown) {
    if (!Array.isArray(familias)) return;
    const ate = Date.now() + GUARDAR_POR_MS;
    for (const f of familias)
      if (typeof f === 'string') this.revogadas.set(f, ate);
    this.limpar();
  }

  revogada(familia: string | undefined): boolean {
    if (!familia) return false;
    const ate = this.revogadas.get(familia);
    return ate !== undefined && ate > Date.now();
  }

  private limpar() {
    const agora = Date.now();
    for (const [f, ate] of this.revogadas)
      if (ate <= agora) this.revogadas.delete(f);
  }
}
