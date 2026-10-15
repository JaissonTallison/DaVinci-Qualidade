import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES, uuidv7 } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const codex = {
  recebidas: [] as { padrao: string; mensagem: unknown }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return of([]);
  },
};

describe('ASO e treinamentos (e2e no gateway)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.CODEX)
      .useValue(codex)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    codex.recebidas = [];
  });
  afterAll(() => app.close());

  it('"realizados" e "resumo" não são confundidos com id; ASO sem próximo exame para no gateway', async () => {
    const login = await comLogin(['funcionarios.ver', 'funcionarios.editar']);
    await request(app.getHttpServer())
      .get(`/treinamentos/realizados?funcionarioId=${uuidv7()}`)
      .set(login)
      .expect(200);
    await request(app.getHttpServer())
      .get('/vencimentos/resumo')
      .set(login)
      .expect(200);
    expect(codex.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.treinamentos.realizados,
      PATTERNS.vencimentos.resumo,
    ]);
    const r = await request(app.getHttpServer())
      .post('/asos')
      .set(login)
      .send({
        funcionarioId: uuidv7(),
        tipo: 'periodico',
        data: '2026-10-01',
        resultado: 'apto',
      })
      .expect(400);
    expect(r.body.erro.detalhes[0].campo).toBe('proximoExame');
  });

  it('registrar turma exige funcionarios.editar', async () => {
    const corpo = {
      treinamentoId: uuidv7(),
      funcionarioIds: [uuidv7()],
      data: '2026-10-01',
    };
    await request(app.getHttpServer())
      .post('/treinamentos/turmas')
      .set(await comLogin(['funcionarios.ver']))
      .send(corpo)
      .expect(403);
    await request(app.getHttpServer())
      .post('/treinamentos/turmas')
      .set(await comLogin(['funcionarios.editar']))
      .send(corpo)
      .expect(201);
  });
});
