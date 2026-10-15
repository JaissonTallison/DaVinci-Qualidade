import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('API Gateway (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) =>
        expect(res.body).toMatchObject({
          service: 'api-gateway',
          status: 'ok',
        }),
      );
  });

  it('rota inexistente devolve erro padrão em português, com rastreio', async () => {
    const res = await request(app.getHttpServer())
      .get('/nao-existe')
      .expect(404);
    expect(res.body).toEqual({
      erro: {
        codigo: 'NAO_ENCONTRADO',
        mensagem: 'Recurso não encontrado.',
        rastreioId: res.headers['x-rastreio-id'],
      },
    });
  });

  it('devolve o rastreio informado pelo cliente', async () => {
    const rastreio = '0192f1c4-0000-7000-8000-000000000abc';
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('x-rastreio-id', rastreio)
      .expect(200);
    expect(res.headers['x-rastreio-id']).toBe(rastreio);
  });

  afterEach(async () => {
    await app.close();
  });
});
