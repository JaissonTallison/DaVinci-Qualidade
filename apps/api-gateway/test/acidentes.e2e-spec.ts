import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const seguranca = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return of({});
  },
};

describe('Acidentes (e2e no gateway)', () => {
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

  it('"indicadores" e "resumo" não são confundidos com um id', async () => {
    const login = await comLogin(['seguranca.ver']);
    await request(app.getHttpServer())
      .get('/acidentes/indicadores?ano=2026')
      .set(login)
      .expect(200);
    await request(app.getHttpServer())
      .get('/acidentes/resumo')
      .set(login)
      .expect(200);
    expect(seguranca.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.acidentes.indicadores,
      PATTERNS.acidentes.resumo,
    ]);
  });

  it('com afastamento e zero dias para no gateway; horas exigem seguranca.editar', async () => {
    const r = await request(app.getHttpServer())
      .post('/acidentes')
      .set(await comLogin(['seguranca.editar']))
      .send({
        tipo: 'com_afastamento',
        data: '2026-10-10',
        local: 'Linha 2',
        acidentado: 'João Pereira',
        descricao: 'Corte na mão esquerda ao retirar peça.',
        diasPerdidos: 0,
      })
      .expect(400);
    expect(r.body.erro.detalhes).toEqual([
      {
        campo: 'diasPerdidos',
        mensagem: 'Acidente com afastamento tem ao menos 1 dia perdido.',
      },
    ]);
    await request(app.getHttpServer())
      .post('/acidentes/horas')
      .set(await comLogin(['seguranca.ver']))
      .send({ competencia: '2026-09', horas: 1000 })
      .expect(403);
    expect(seguranca.recebidas).toHaveLength(0);
  });
});
