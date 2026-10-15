import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of, type Observable } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const qualidade = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  resposta: (): Observable<unknown> => of({}),
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return this.resposta();
  },
};

const ID = '0192f1c4-0000-7000-8000-0000000000d1';
const ITEM = '0192f1c4-0000-7000-8000-0000000000d2';
const versao = '2026-10-15T12:00:00.000Z';

describe('Inspeções (e2e no gateway)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.QUALIDADE)
      .useValue(qualidade)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    qualidade.recebidas = [];
  });

  afterAll(() => app.close());

  it('criar sem modelo e sem itens para no gateway', async () => {
    const r = await request(app.getHttpServer())
      .post('/inspecoes')
      .set(await comLogin(['qualidade.editar']))
      .send({
        tipo: 'recebimento',
        objeto: 'Eixo 10 mm',
        inspetor: 'Marina Duarte',
        data: '2026-10-15',
      })
      .expect(400);
    expect(r.body.erro.detalhes).toEqual([
      {
        campo: 'itens',
        mensagem: 'Escolha um modelo ou inclua os itens a verificar.',
      },
    ]);
    expect(qualidade.recebidas).toHaveLength(0);
  });

  it('respostas e conclusão vão ao padrão certo; resposta desconhecida é recusada', async () => {
    const login = await comLogin(['qualidade.editar']);
    await request(app.getHttpServer())
      .post(`/inspecoes/${ID}/respostas`)
      .set(login)
      .send({ versao, respostas: [{ itemId: ITEM, resposta: 'talvez' }] })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/inspecoes/${ID}/respostas`)
      .set(login)
      .send({
        versao,
        respostas: [{ itemId: ITEM, resposta: 'nok', observacao: 'Riscado' }],
      })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/inspecoes/${ID}/concluir`)
      .set(login)
      .send({ versao })
      .expect(200);
    expect(qualidade.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.inspecoes.responder,
      PATTERNS.inspecoes.concluir,
    ]);
  });

  it('cancelar inspeção e inativar modelo são do gestor', async () => {
    await request(app.getHttpServer())
      .post(`/inspecoes/${ID}/cancelar`)
      .set(await comLogin(['qualidade.editar']))
      .send({ versao, motivo: 'Inspeção duplicada por engano.' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/modelos-de-inspecao/${ID}/inativar`)
      .set(await comLogin(['qualidade.editar']))
      .send({ versao })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/modelos-de-inspecao/${ID}/inativar`)
      .set(await comLogin(['qualidade.excluir']))
      .send({ versao })
      .expect(200);
  });
});
