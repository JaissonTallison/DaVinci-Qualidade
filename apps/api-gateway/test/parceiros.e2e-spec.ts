import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of, throwError, type Observable } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { comLogin, EMPRESA_ID, USUARIO_ID } from './acesso.js';
import { AppModule } from './../src/app.module.js';

/** Codex falso: registra o que recebeu e responde o que o teste mandar. */
const codex = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  resposta: (): Observable<unknown> => of({}),
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return this.resposta();
  },
};

const integracoes = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return of({ razaoSocial: 'OPEN KNOWLEDGE BRASIL' });
  },
};

const valido = {
  tipoPessoa: 'PJ',
  documento: '11.222.333/0001-81',
  nome: 'Distribuidora Alfa',
  papeis: ['fornecedor'],
};

describe('Parceiros (e2e no gateway)', () => {
  let app: INestApplication<App>;
  let login: { authorization: string };

  beforeAll(async () => {
    login = await comLogin();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.CODEX)
      .useValue(codex)
      .overrideProvider(SERVICES.INTEGRACOES)
      .useValue(integracoes)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    codex.recebidas = [];
    codex.resposta = () => of({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /parceiros válido → 201, envia ao Codex o contexto DO TOKEN (empresa e usuário)', async () => {
    codex.resposta = () =>
      of({ id: 'x', codigo: 1, nome: 'Distribuidora Alfa' });
    const res = await request(app.getHttpServer())
      .post('/parceiros')
      .set(login)
      .send(valido)
      .expect(201);
    expect(res.body).toMatchObject({ codigo: 1 });
    expect(codex.recebidas[0]).toMatchObject({
      padrao: PATTERNS.parceiros.criar,
      mensagem: {
        contexto: { empresaId: EMPRESA_ID, usuarioId: USUARIO_ID },
        dados: valido,
      },
    });
  });

  it('POST /parceiros inválido → 400 com erros por campo, SEM chamar o Codex', async () => {
    const res = await request(app.getHttpServer())
      .post('/parceiros')
      .set(login)
      .send({ ...valido, documento: '123', papeis: [] })
      .expect(400);
    expect(res.body.erro).toMatchObject({
      codigo: 'DADOS_INVALIDOS',
      mensagem: 'Verifique os campos destacados.',
    });
    expect(
      res.body.erro.detalhes.map((d: { campo: string }) => d.campo),
    ).toEqual(expect.arrayContaining(['documento', 'papeis']));
    expect(codex.recebidas).toHaveLength(0);
  });

  it('recusa de negócio do Codex (CNPJ repetido) → 409 com a mensagem do serviço', async () => {
    codex.resposta = () =>
      throwError(() => ({
        codigo: 'CONFLITO',
        mensagem: 'Já existe um parceiro com este CNPJ (nº 1 · Alfa).',
      }));
    const res = await request(app.getHttpServer())
      .post('/parceiros')
      .set(login)
      .send(valido)
      .expect(409);
    expect(res.body.erro).toMatchObject({
      codigo: 'CONFLITO',
      mensagem: 'Já existe um parceiro com este CNPJ (nº 1 · Alfa).',
    });
    expect(res.body.erro.rastreioId).toBe(res.headers['x-rastreio-id']);
  });

  it('GET /parceiros repassa busca e filtros', async () => {
    codex.resposta = () =>
      of({ itens: [], total: 0, pagina: 2, porPagina: 50 });
    await request(app.getHttpServer())
      .get('/parceiros?busca=alfa&papel=fornecedor&pagina=2')
      .set(login)
      .expect(200);
    expect(codex.recebidas[0]?.mensagem.dados).toEqual({
      busca: 'alfa',
      papel: 'fornecedor',
      pagina: '2',
    });
  });

  it('GET /parceiros com filtro inválido → 400', async () => {
    await request(app.getHttpServer())
      .get('/parceiros?situacao=apagados')
      .set(login)
      .expect(400);
    expect(codex.recebidas).toHaveLength(0);
  });

  it('GET /parceiros/:id não encontrado → 404 em português', async () => {
    codex.resposta = () =>
      throwError(() => ({
        codigo: 'NAO_ENCONTRADO',
        mensagem: 'Parceiro não encontrado.',
      }));
    const res = await request(app.getHttpServer())
      .get('/parceiros/0192f1c4-0000-7000-8000-000000000abc')
      .set(login)
      .expect(404);
    expect(res.body.erro.mensagem).toBe('Parceiro não encontrado.');
  });

  it('PUT /parceiros/:id sem versão → 400 pedindo para recarregar', async () => {
    const res = await request(app.getHttpServer())
      .put('/parceiros/0192f1c4-0000-7000-8000-000000000abc')
      .set(login)
      .send(valido)
      .expect(400);
    expect(res.body.erro.detalhes).toContainEqual({
      campo: 'versao',
      mensagem: 'Versão do cadastro ausente: recarregue a página.',
    });
  });

  it('POST /parceiros/:id/inativar envia id, motivo e versão → 200', async () => {
    codex.resposta = () => of({ ativo: false });
    await request(app.getHttpServer())
      .post('/parceiros/abc/inativar')
      .set(login)
      .send({ motivo: 'Encerrou', versao: 'v1' })
      .expect(200);
    expect(codex.recebidas[0]?.mensagem.dados).toEqual({
      id: 'abc',
      motivo: 'Encerrou',
      versao: 'v1',
    });
  });

  it('GET /referencias/cnaes exige login e repassa a busca; lista de códigos vira array', async () => {
    await request(app.getHttpServer())
      .get('/referencias/cnaes?busca=padaria')
      .expect(401);
    codex.resposta = () =>
      of([
        {
          codigo: '1091102',
          descricao: 'Fabricação de produtos de padaria',
          setor: 'C',
        },
      ]);
    const res = await request(app.getHttpServer())
      .get('/referencias/cnaes?busca=padaria&setor=C')
      .set(login)
      .expect(200);
    expect(res.body[0].codigo).toBe('1091102');
    expect(codex.recebidas[0]).toMatchObject({
      padrao: PATTERNS.referencias.cnaes,
      mensagem: { dados: { busca: 'padaria', setor: 'C' } },
    });
    await request(app.getHttpServer())
      .get('/referencias/cnaes?codigos=1091102,4721102')
      .set(login)
      .expect(200);
    expect(codex.recebidas[1]?.mensagem.dados).toEqual({
      codigos: ['1091102', '4721102'],
    });
  });

  it('GET /consultas/cnpj/:cnpj vai ao Integrações; exige parceiros.editar ou empresa.gerenciar', async () => {
    const res = await request(app.getHttpServer())
      .get('/consultas/cnpj/19131243000197')
      .set(login)
      .expect(200);
    expect(res.body.razaoSocial).toBe('OPEN KNOWLEDGE BRASIL');
    expect(integracoes.recebidas[0]).toMatchObject({
      padrao: PATTERNS.consultas.cnpj,
      mensagem: { dados: { cnpj: '19131243000197' } },
    });
    await request(app.getHttpServer())
      .get('/consultas/cep/01310100')
      .set(await comLogin(['parceiros.ver']))
      .expect(403);
    await request(app.getHttpServer())
      .get('/consultas/cep/01310100')
      .set(await comLogin(['empresa.gerenciar']))
      .expect(200);
  });
});
