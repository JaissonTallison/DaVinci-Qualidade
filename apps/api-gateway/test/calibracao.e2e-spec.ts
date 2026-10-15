import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const qualidade = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return of({});
  },
};
const ID = '0192f1c4-0000-7000-8000-0000000000e1';
const versao = '2026-10-15T12:00:00.000Z';

describe('Calibração (e2e no gateway)', () => {
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

  it('TAG inválida e frequência fora da faixa param no gateway', async () => {
    const r = await request(app.getHttpServer())
      .post('/instrumentos')
      .set(await comLogin(['qualidade.editar']))
      .send({ tag: 'paq 42!', descricao: 'Paquímetro', frequenciaMeses: 72 })
      .expect(400);
    expect(
      r.body.erro.detalhes.map((d: { campo: string }) => d.campo).sort(),
    ).toEqual(['frequenciaMeses', 'tag']);
    expect(qualidade.recebidas).toHaveLength(0);
  });

  it('registrar é de quem tem o módulo; anular e tirar de uso, do gestor', async () => {
    const editar = await comLogin(['qualidade.editar']);
    await request(app.getHttpServer())
      .post(`/instrumentos/${ID}/calibracoes`)
      .set(editar)
      .send({
        versao,
        data: '2026-10-01',
        laboratorio: 'Lab Alfa',
        aprovada: true,
      })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/instrumentos/${ID}/calibracoes/anular`)
      .set(editar)
      .send({ versao, calibracaoId: ID, motivo: 'Lançada errada.' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/instrumentos/${ID}/uso`)
      .set(editar)
      .send({ versao, emUso: false })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/instrumentos/${ID}/uso`)
      .set(await comLogin(['qualidade.excluir']))
      .send({ versao, emUso: false })
      .expect(200);
    expect(qualidade.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.calibracao.registrar,
      PATTERNS.calibracao.mudarUso,
    ]);
  });
});
