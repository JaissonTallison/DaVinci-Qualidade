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

describe('EPIs (e2e no gateway)', () => {
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

  it('"resumo" e "entregas" têm rota própria', async () => {
    const login = await comLogin(['seguranca.ver']);
    await request(app.getHttpServer())
      .get('/epis/resumo')
      .set(login)
      .expect(200);
    await request(app.getHttpServer())
      .get('/epis/entregas?situacao=troca_vencida')
      .set(login)
      .expect(200);
    expect(seguranca.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.epis.resumo,
      PATTERNS.epis.listarEntregas,
    ]);
  });

  it('CA com letras para no gateway; entrega vai com o funcionário escolhido', async () => {
    const login = await comLogin(['seguranca.editar']);
    const r = await request(app.getHttpServer())
      .post('/epis')
      .set(login)
      .send({ nome: 'Luva de vaqueta', ca: 'CA-AB', validadeCa: '2027-05-01' })
      .expect(400);
    expect(r.body.erro.detalhes).toEqual([
      { campo: 'ca', mensagem: 'O CA tem de 3 a 7 dígitos (ex.: 32157).' },
    ]);

    const entrega = {
      funcionarioId: uuidv7(),
      epiId: uuidv7(),
      quantidade: 2,
      data: '2026-10-10',
      motivo: 'perda',
    };
    await request(app.getHttpServer())
      .post('/epis/entregas')
      .set(login)
      .send(entrega)
      .expect(201);
    expect(seguranca.recebidas).toEqual([
      {
        padrao: PATTERNS.epis.registrarEntrega,
        mensagem: expect.objectContaining({ dados: entrega }),
      },
    ]);
  });

  it('anular entrega é do gestor (seguranca.excluir)', async () => {
    const id = uuidv7();
    const corpo = { motivo: 'Registrada para a pessoa errada.' };
    await request(app.getHttpServer())
      .post(`/epis/entregas/${id}/anular`)
      .set(await comLogin(['seguranca.editar']))
      .send(corpo)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/epis/entregas/${id}/anular`)
      .set(await comLogin(['seguranca.excluir']))
      .send(corpo)
      .expect(200);
    expect(seguranca.recebidas).toEqual([
      {
        padrao: PATTERNS.epis.anular,
        mensagem: expect.objectContaining({ dados: { id, alteracoes: corpo } }),
      },
    ]);
  });
});
