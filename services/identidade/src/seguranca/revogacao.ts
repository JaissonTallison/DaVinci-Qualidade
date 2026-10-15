import { Logger } from '@nestjs/common';
import { EVENTOS, publicarEvento } from '@davinci/shared/eventos';
import type { SessoesRevogadas } from '@davinci/types';

/**
 * Revogação IMEDIATA (decisão A64): ao encerrar sessões à força, o Identidade publica um evento
 * e cada gateway passa a recusar os tokens dessas sessões na hora (sem esperar os 15 min do token).
 * "renovada" e "troca-de-empresa" NÃO encerram a sessão (a família continua): não são anunciadas.
 */
export const MOTIVOS_QUE_NAO_ENCERRAM = [
  'renovada',
  'troca-de-empresa',
] as const;

const logger = new Logger('Revogação');
type Publicador = (dados: SessoesRevogadas) => Promise<boolean>;
let publicador: Publicador = (dados) =>
  publicarEvento(EVENTOS.sessoesRevogadas, dados);

/** Nos testes: troca o publicador (sem RabbitMQ) e permite conferir o que foi anunciado. */
export function definirPublicador(p: Publicador): void {
  publicador = p;
}

export async function anunciarRevogacao(
  familias: (string | null | undefined)[],
): Promise<void> {
  const unicas = [...new Set(familias.filter((f): f is string => Boolean(f)))];
  if (!unicas.length) return;
  if (!(await publicador({ familias: unicas }))) {
    // A sessão já está revogada no banco (não renova mais); só o efeito imediato falhou
    logger.warn(
      `Não foi possível anunciar a revogação de ${unicas.length} sessão(ões): valerá em até 15 minutos.`,
    );
  }
}
