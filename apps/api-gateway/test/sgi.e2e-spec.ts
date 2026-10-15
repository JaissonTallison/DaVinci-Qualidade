import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES, uuidv7 } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const sgi = {
  recebidas: [] as string[],
  send(padrao: string) {
    this.recebidas.push(padrao);
    return of({});
  },
};

describe('Gestão do SGI (e2e no gateway)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.SGI)
      .useValue(sgi)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('decidir mudança é do gestor; risco alto sem tratamento para no gateway', async () => {
    const id = uuidv7();
    const corpo = { versao: 'v', aprovar: true, parecer: 'Aprovada.' };
    await request(app.getHttpServer())
      .post(`/mudancas/${id}/decidir`)
      .set(await comLogin(['sgi.editar']))
      .send(corpo)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/mudancas/${id}/decidir`)
      .set(await comLogin(['sgi.excluir']))
      .send(corpo)
      .expect(200);
    const r = await request(app.getHttpServer())
      .post('/riscos-e-oportunidades')
      .set(await comLogin(['sgi.editar']))
      .send({
        tipo: 'risco',
        processo: 'Compras',
        descricao: 'Fornecedor único',
        probabilidade: 5,
        impacto: 5,
      })
      .expect(400);
    expect(r.body.erro.detalhes).toHaveLength(3);
    await request(app.getHttpServer())
      .get('/sgi/resumo')
      .set(await comLogin(['sgi.ver']))
      .expect(200);
    expect(sgi.recebidas).toEqual([
      PATTERNS.sgi.decidirMudanca,
      PATTERNS.sgi.resumo,
    ]);
  });
});
