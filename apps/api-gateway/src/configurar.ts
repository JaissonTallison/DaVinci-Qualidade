import type { NestExpressApplication } from '@nestjs/platform-express';

/** Limite do corpo JSON: a logo da empresa (até 500 KB) chega em base64 (~670 KB). */
/** 3 MB: extrato OFX de até 2 MB enviado como texto. */
export const LIMITE_JSON = '20mb';

/** Ajustes da aplicação HTTP, iguais no servidor e nos testes e2e. */
export function configurarApp(app: NestExpressApplication): void {
  app.useBodyParser('json', { limit: LIMITE_JSON });
}
