import {
  Transport,
  type ClientProviderOptions,
  type RmqOptions,
} from '@nestjs/microservices';
import { queueName, type ServiceName } from '@davinci/types';

const DEFAULT_RABBITMQ_URL = 'amqp://davinci:davinci@localhost:5551';

function rmqBase(service: ServiceName): RmqOptions['options'] {
  return {
    urls: [process.env.RABBITMQ_URL ?? DEFAULT_RABBITMQ_URL],
    queue: queueName(service),
    queueOptions: { durable: true },
  };
}

/** Opções do servidor: o serviço consome a própria fila. */
export function rmqServerOptions(service: ServiceName): RmqOptions {
  return { transport: Transport.RMQ, options: rmqBase(service) };
}

/**
 * Opções de cliente para falar com `service`. O token de injeção é o próprio
 * nome do serviço: `@Inject(SERVICES.FINANCEIRO) client: ClientProxy`.
 */
export function rmqClientOptions(service: ServiceName): ClientProviderOptions {
  return { name: service, transport: Transport.RMQ, options: rmqBase(service) };
}
