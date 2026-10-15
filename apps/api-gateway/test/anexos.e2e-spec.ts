import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of } from 'rxjs';
import { PATTERNS, SERVICES, uuidv7 } from '@davinci/types';
import { comLogin } from './acesso.js';
import { AppModule } from './../src/app.module.js';

const PDF = Buffer.from('%PDF-1.7 teste').toString('base64');
const plataforma = {
  recebidas: [] as { padrao: string; mensagem: unknown }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    if (padrao === PATTERNS.anexos.conteudo)
      return of({
        id: 'a',
        registro: 'acidente',
        nome: 'cat assinada.pdf',
        tipo: 'application/pdf',
        base64: PDF,
      });
    return of([]);
  },
};

describe('Anexos (e2e no gateway)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.PLATAFORMA)
      .useValue(plataforma)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    plataforma.recebidas = [];
  });
  afterAll(() => app.close());

  it('a permissão é a do módulo dono do registro', async () => {
    const q = `/anexos?registro=nao_conformidade&registroId=${uuidv7()}`;
    await request(app.getHttpServer())
      .get(q)
      .set(await comLogin(['seguranca.ver']))
      .expect(403);
    await request(app.getHttpServer())
      .get(q)
      .set(await comLogin(['qualidade.ver']))
      .expect(200);
    const corpo = {
      registro: 'nao_conformidade',
      registroId: uuidv7(),
      nome: 'laudo.pdf',
      tipo: 'application/pdf',
      base64: PDF,
    };
    await request(app.getHttpServer())
      .post('/anexos')
      .set(await comLogin(['qualidade.ver']))
      .send(corpo)
      .expect(403);
    await request(app.getHttpServer())
      .post('/anexos')
      .set(await comLogin(['qualidade.editar']))
      .send(corpo)
      .expect(201);
    expect(plataforma.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.anexos.listar,
      PATTERNS.anexos.anexar,
    ]);
  });

  it('tipo fora da lista para no gateway; download sai com o nome original', async () => {
    const r = await request(app.getHttpServer())
      .post('/anexos')
      .set(await comLogin(['qualidade.editar']))
      .send({
        registro: 'inspecao',
        registroId: uuidv7(),
        nome: 'x.exe',
        tipo: 'application/x-msdownload',
        base64: PDF,
      })
      .expect(400);
    expect(r.body.erro.detalhes[0].campo).toBe('tipo');
    await request(app.getHttpServer())
      .get(`/anexos/${uuidv7()}/conteudo`)
      .set(await comLogin(['qualidade.ver']))
      .expect(403);
    const d = await request(app.getHttpServer())
      .get(`/anexos/${uuidv7()}/conteudo`)
      .set(await comLogin(['seguranca.ver']))
      .expect(200);
    expect(d.headers['content-disposition']).toContain(
      "filename*=UTF-8''cat%20assinada.pdf",
    );
    expect(d.headers['content-type']).toContain('application/pdf');
  });
});
