/**
 * Eventos entre serviços (publicar/assinar), além do pedido-resposta das filas.
 * Cada tipo de evento tem uma EXCHANGE "fanout": todo assinante recebe uma cópia
 * (ex.: todas as instâncias do gateway ficam sabendo de uma sessão revogada).
 * Cada assinante usa uma fila própria, exclusiva e temporária (some quando ele desliga).
 */
import {
  connect,
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';

const URL_PADRAO = 'amqp://davinci:davinci@localhost:5551';
let conexao: AmqpConnectionManager | undefined;

function conectar(): AmqpConnectionManager {
  conexao ??= connect([process.env.RABBITMQ_URL ?? URL_PADRAO]);
  return conexao;
}

/** Nomes das exchanges de eventos (um lugar só, para não errar a grafia). */
export const EVENTOS = {
  /** Sessões encerradas à força (sair, encerrar sessão, remover acesso, trocar/redefinir senha, desativar 2FA). */
  sessoesRevogadas: 'davinci.eventos.sessoes-revogadas',
} as const;
export type NomeDoEvento = (typeof EVENTOS)[keyof typeof EVENTOS];

const publicadores = new Map<NomeDoEvento, ChannelWrapper>();

/**
 * Publica um evento. Não espera assinantes: quem não estiver ouvindo agora não recebe.
 * NUNCA lança: devolve false se o RabbitMQ recusar (ex.: um assinante desligando no mesmo instante).
 * Quem publica decide o que fazer (em geral, registrar no log; a operação principal já aconteceu).
 */
export async function publicarEvento<T>(
  exchange: NomeDoEvento,
  dados: T,
  prazoMs = 5_000,
): Promise<boolean> {
  try {
    let canal = publicadores.get(exchange);
    if (!canal) {
      canal = conectar().createChannel({
        json: true,
        setup: (c: Channel) =>
          c.assertExchange(exchange, 'fanout', { durable: true }),
      });
      publicadores.set(exchange, canal);
    }
    await canal.publish(exchange, '', dados as object, {
      persistent: false,
      contentType: 'application/json',
      timeout: prazoMs,
    });
    return true;
  } catch {
    return false;
  }
}

/** Assina um evento: `aoReceber` roda para cada mensagem. Devolve uma função para cancelar. */
export async function assinarEvento<T>(
  exchange: NomeDoEvento,
  aoReceber: (dados: T) => void,
): Promise<() => Promise<void>> {
  const canal = conectar().createChannel({
    setup: async (c: Channel) => {
      await c.assertExchange(exchange, 'fanout', { durable: true });
      const { queue } = await c.assertQueue('', {
        exclusive: true,
        autoDelete: true,
      });
      await c.bindQueue(queue, exchange, '');
      await c.consume(queue, (m: ConsumeMessage | null) => {
        if (!m) return;
        try {
          aoReceber(JSON.parse(m.content.toString('utf8')) as T);
        } catch {
          // evento malformado: ignorado (não derruba o assinante)
        }
        c.ack(m);
      });
    },
  });
  await canal.waitForConnect();
  return () => canal.close();
}

/** Fecha a conexão de eventos (testes, desligamento). */
export async function encerrarEventos(): Promise<void> {
  await Promise.all([...publicadores.values()].map((c) => c.close()));
  publicadores.clear();
  await conexao?.close();
  conexao = undefined;
}
