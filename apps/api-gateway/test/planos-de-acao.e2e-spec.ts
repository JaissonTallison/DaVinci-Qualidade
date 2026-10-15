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

const ID = '0192f1c4-0000-7000-8000-0000000000a1';
const TAREFA = '0192f1c4-0000-7000-8000-0000000000b1';
const versao = '2026-10-15T12:00:00.000Z';
const novo = {
  titulo: 'Rotina de limpeza das impressoras',
  objetivo: 'Nenhuma etiqueta ilegível por 60 dias.',
  tipo: 'corretiva',
  origem: 'nc',
  responsavel: 'Carlos Menezes',
  tarefas: [
    {
      oQue: 'Incluir a limpeza no checklist',
      responsavel: 'Carlos Menezes',
      prazo: '2030-01-10',
    },
  ],
};

describe('Planos de ação (e2e no gateway)', () => {
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

  it('criar exige qualidade.editar e ao menos uma tarefa, validado antes da fila', async () => {
    await request(app.getHttpServer())
      .post('/planos-de-acao')
      .set(await comLogin(['qualidade.ver']))
      .send(novo)
      .expect(403);
    const r = await request(app.getHttpServer())
      .post('/planos-de-acao')
      .set(await comLogin(['qualidade.editar']))
      .send({ ...novo, tarefas: [] })
      .expect(400);
    expect(r.body.erro.detalhes).toEqual([
      { campo: 'tarefas', mensagem: 'Inclua ao menos uma tarefa.' },
    ]);
    expect(qualidade.recebidas).toHaveLength(0);
    await request(app.getHttpServer())
      .post('/planos-de-acao')
      .set(await comLogin(['qualidade.editar']))
      .send(novo)
      .expect(201);
    expect(qualidade.recebidas[0]!.padrao).toBe(PATTERNS.planosDeAcao.criar);
  });

  it('tarefas vão ao padrão certo com { id, alteracoes }', async () => {
    const login = await comLogin(['qualidade.editar']);
    await request(app.getHttpServer())
      .post(`/planos-de-acao/${ID}/tarefas/concluir`)
      .set(login)
      .send({ versao, tarefaId: TAREFA })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/planos-de-acao/${ID}/tarefas/cancelar`)
      .set(login)
      .send({ versao, tarefaId: TAREFA, motivo: 'Já feito antes.' })
      .expect(200);
    expect(qualidade.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.planosDeAcao.concluirTarefa,
      PATTERNS.planosDeAcao.cancelarTarefa,
    ]);
    expect(qualidade.recebidas[0]!.mensagem.dados).toEqual({
      id: ID,
      alteracoes: { versao, tarefaId: TAREFA },
    });
  });

  it('cancelar o plano é do gestor', async () => {
    const corpo = { versao, motivo: 'Substituído por outro plano.' };
    await request(app.getHttpServer())
      .post(`/planos-de-acao/${ID}/cancelar`)
      .set(await comLogin(['qualidade.editar']))
      .send(corpo)
      .expect(403);
    await request(app.getHttpServer())
      .post(`/planos-de-acao/${ID}/cancelar`)
      .set(await comLogin(['qualidade.excluir']))
      .send(corpo)
      .expect(200);
  });
});
