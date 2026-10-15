import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES, uuidv7 } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const seguranca = {
  recebidas: [] as { padrao: string; mensagem: unknown }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return of({});
  },
};

describe('PGR e permissões de trabalho (e2e no gateway)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.SEGURANCA)
      .useValue(seguranca)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    seguranca.recebidas = [];
  });
  afterAll(() => app.close());

  it('risco crítico sem plano para no gateway', async () => {
    const r = await request(app.getHttpServer())
      .post('/riscos')
      .set(await comLogin(['seguranca.editar']))
      .send({
        grupo: 'acidente',
        local: 'Estamparia',
        perigo: 'Prensa sem proteção',
        danos: 'Amputação',
        severidade: 4,
        probabilidade: 4,
      })
      .expect(400);
    expect(
      r.body.erro.detalhes.map((d: { campo: string }) => d.campo).sort(),
    ).toEqual(['acoes', 'prazo', 'responsavel']);
  });

  it('liberar PT exige seguranca.liberar-pt; "resumo" não é id', async () => {
    const id = uuidv7();
    await request(app.getHttpServer())
      .post(`/permissoes-de-trabalho/${id}/liberar`)
      .set(await comLogin(['seguranca.editar']))
      .send({ versao: 'v' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/permissoes-de-trabalho/${id}/liberar`)
      .set(await comLogin(['seguranca.liberar-pt']))
      .send({ versao: 'v' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/permissoes-de-trabalho/resumo')
      .set(await comLogin(['seguranca.ver']))
      .expect(200);
    expect(seguranca.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.pts.liberar,
      PATTERNS.pts.resumo,
    ]);
  });
});
