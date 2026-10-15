import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const auditorias = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return of({});
  },
};
const ID = '0192f1c4-0000-7000-8000-0000000000f1';
const versao = '2026-10-15T12:00:00.000Z';

describe('Auditorias (e2e no gateway)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.AUDITORIAS)
      .useValue(auditorias)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    auditorias.recebidas = [];
  });
  afterAll(() => app.close());

  it('permissões do próprio módulo: qualidade.* não basta', async () => {
    await request(app.getHttpServer())
      .get('/auditorias')
      .set(await comLogin(['qualidade.ver']))
      .expect(403);
    await request(app.getHttpServer())
      .get('/auditorias')
      .set(await comLogin(['auditorias.ver']))
      .expect(200);
  });

  it('auditoria sem norma e com fim antes do início para no gateway', async () => {
    const r = await request(app.getHttpServer())
      .post('/auditorias')
      .set(await comLogin(['auditorias.editar']))
      .send({
        tipo: 'interna',
        escopo: 'Produção e expedição',
        normas: [],
        auditorLider: 'Paula Ribeiro',
        dataInicio: '2026-10-20',
        dataFim: '2026-10-19',
      })
      .expect(400);
    expect(
      r.body.erro.detalhes.map((d: { campo: string }) => d.campo).sort(),
    ).toEqual(['dataFim', 'normas']);
    expect(auditorias.recebidas).toHaveLength(0);
  });

  it('formalizar NC vai ao padrão certo; cancelar é do gestor', async () => {
    await request(app.getHttpServer())
      .post(`/auditorias/${ID}/constatacoes/formalizar-nc`)
      .set(await comLogin(['auditorias.editar']))
      .send({ versao, constatacaoId: ID, responsavel: 'Carlos Menezes' })
      .expect(200);
    expect(auditorias.recebidas[0]!.padrao).toBe(
      PATTERNS.auditorias.formalizarNc,
    );
    await request(app.getHttpServer())
      .post(`/auditorias/${ID}/cancelar`)
      .set(await comLogin(['auditorias.editar']))
      .send({ versao, motivo: 'Reagendada para o próximo trimestre.' })
      .expect(403);
  });
});
