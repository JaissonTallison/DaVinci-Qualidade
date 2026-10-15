import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of, type Observable } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { comLogin, EMPRESA_ID, USUARIO_ID } from './acesso.js';
import { AppModule } from './../src/app.module.js';

/** Serviço qualidade falso: registra o que recebeu e responde o que o teste mandar. */
const qualidade = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  resposta: (): Observable<unknown> => of({}),
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return this.resposta();
  },
};

const ID = '0192f1c4-0000-7000-8000-0000000000c1';
const nova = {
  titulo: 'Paquímetro fora de calibração',
  descricao: 'O paquímetro TAG-0042 mediu 0,08 mm acima do padrão na inspeção.',
  origem: 'inspecao',
  tipo: 'processo',
  gravidade: 'alta',
  responsavel: 'Marina Duarte',
  prazo: '2030-01-31',
};

describe('Não conformidades (e2e no gateway)', () => {
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
    qualidade.resposta = () => of({});
  });

  afterAll(() => app.close());

  it('abrir NC exige qualidade.editar e manda o contexto do token', async () => {
    await request(app.getHttpServer())
      .post('/nao-conformidades')
      .set(await comLogin(['qualidade.ver']))
      .send(nova)
      .expect(403);
    await request(app.getHttpServer())
      .post('/nao-conformidades')
      .set(await comLogin(['qualidade.editar']))
      .send(nova)
      .expect(201);
    expect(qualidade.recebidas).toHaveLength(1);
    expect(qualidade.recebidas[0]).toMatchObject({
      padrao: PATTERNS.naoConformidades.criar,
      mensagem: {
        contexto: { empresaId: EMPRESA_ID, usuarioId: USUARIO_ID },
        dados: nova,
      },
    });
  });

  it('dados inválidos param no gateway, sem ir à fila', async () => {
    const r = await request(app.getHttpServer())
      .post('/nao-conformidades')
      .set(await comLogin(['qualidade.editar']))
      .send({ ...nova, gravidade: 'gravissima', titulo: '' })
      .expect(400);
    expect(
      r.body.erro.detalhes.map((d: { campo: string }) => d.campo).sort(),
    ).toEqual(['gravidade', 'titulo']);
    expect(qualidade.recebidas).toHaveLength(0);
  });

  it('transições vão como { id, alteracoes } com o padrão certo', async () => {
    const login = await comLogin(['qualidade.editar']);
    const versao = '2026-10-15T12:00:00.000Z';
    await request(app.getHttpServer())
      .post(`/nao-conformidades/${ID}/enviar-para-verificacao`)
      .set(login)
      .send({ versao, dataImplantacao: '2026-10-15' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/nao-conformidades/${ID}/verificar-eficacia`)
      .set(login)
      .send({
        versao,
        eficaz: false,
        parecer: 'O desvio voltou na semana seguinte.',
      })
      .expect(200);
    expect(qualidade.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.naoConformidades.enviarParaVerificacao,
      PATTERNS.naoConformidades.verificarEficacia,
    ]);
    expect(qualidade.recebidas[1]!.mensagem.dados).toEqual({
      id: ID,
      alteracoes: {
        versao,
        eficaz: false,
        parecer: 'O desvio voltou na semana seguinte.',
      },
    });
  });

  it('cancelar é do gestor (qualidade.excluir); ver exige qualidade.ver', async () => {
    const corpo = {
      versao: '2026-10-15T12:00:00.000Z',
      motivo: 'Aberta em duplicidade com outra NC.',
    };
    await request(app.getHttpServer())
      .post(`/nao-conformidades/${ID}/cancelar`)
      .set(await comLogin(['qualidade.editar']))
      .send(corpo)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/nao-conformidades/${ID}/cancelar`)
      .set(await comLogin(['qualidade.excluir']))
      .send(corpo)
      .expect(200);
    await request(app.getHttpServer())
      .get('/nao-conformidades')
      .set(await comLogin(['parceiros.ver']))
      .expect(403);
    qualidade.resposta = () =>
      of({ itens: [], total: 0, pagina: 1, porPagina: 25 });
    await request(app.getHttpServer())
      .get('/nao-conformidades?vencidas=true')
      .set(await comLogin(['qualidade.ver']))
      .expect(200);
    expect(qualidade.recebidas.at(-1)).toMatchObject({
      padrao: PATTERNS.naoConformidades.listar,
      mensagem: { dados: { vencidas: 'true' } },
    });
  });
});
