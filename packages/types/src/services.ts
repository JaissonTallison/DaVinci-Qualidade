/**
 * Catálogo dos microsserviços, organizados por camada
 * (docs/02-arquitetura/dominios.md). O valor é o identificador do serviço e
 * também a base do nome da fila RabbitMQ (ver `queueName`).
 *
 * Para criar um serviço: `pnpm novo:servico <nome> --camada <camada> --descricao "…"`.
 */
export const SERVICES = {
  // Plataforma: transversal, usada por todos os módulos
  IDENTIDADE: 'identidade',
  CODEX: 'codex',
  INTEGRACOES: 'integracoes',
  PLATAFORMA: 'plataforma',
  QUALIDADE: 'qualidade',
  AUDITORIAS: 'auditorias',
  SGI: 'sgi',
  SERVICOS: 'servicos',
  SEGURANCA: 'seguranca',
  AMBIENTAL: 'ambiental',
  ESG: 'esg',
  PAINEIS: 'paineis',
} as const;

export type ServiceName = (typeof SERVICES)[keyof typeof SERVICES];

export const SERVICE_NAMES = Object.values(SERVICES) as ServiceName[];

export type ServiceLayer = 'plataforma' | 'dominio' | 'inteligencia';

/** Camada de cada serviço. Obrigatório para todos (o TypeScript acusa se faltar). */
export const SERVICE_LAYER = {
  identidade: 'plataforma',
  codex: 'plataforma',
  integracoes: 'plataforma',
  plataforma: 'plataforma',
  qualidade: 'dominio',
  auditorias: 'dominio',
  sgi: 'dominio',
  servicos: 'dominio',
  seguranca: 'dominio',
  ambiental: 'dominio',
  esg: 'dominio',
  paineis: 'inteligencia',
} as const satisfies Record<ServiceName, ServiceLayer>;

/** Fila de comandos/consultas (request-reply) de um serviço. */
export function queueName(service: ServiceName): string {
  return `davinci.${service}`;
}
