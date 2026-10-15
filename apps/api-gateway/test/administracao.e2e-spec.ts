import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of, type Observable } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { AppModule } from './../src/app.module.js';
import { comLogin, EMPRESA_ID } from './acesso.js';

const identidade = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  resposta: (): Observable<unknown> => of({}),
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return this.resposta();
  },
};

describe('Usuários e perfis (e2e no gateway)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.IDENTIDADE)
      .useValue(identidade)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    identidade.recebidas = [];
    identidade.resposta = () => of({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('usuários exigem usuarios.gerenciar (sem ela → 403, serviço não é chamado)', async () => {
    await http()
      .get('/usuarios')
      .set(await comLogin(['parceiros.ver', 'perfis.gerenciar']))
      .expect(403);
    await http()
      .get('/usuarios')
      .set(await comLogin(['usuarios.gerenciar']))
      .expect(200);
    expect(identidade.recebidas).toHaveLength(1);
    expect(identidade.recebidas[0]).toMatchObject({
      padrao: PATTERNS.usuarios.listar,
      mensagem: { contexto: { empresaId: EMPRESA_ID } },
    });
  });

  it('lista de perfis abre para quem gerencia usuários OU perfis; alterar perfil exige perfis.gerenciar', async () => {
    await http()
      .get('/perfis')
      .set(await comLogin(['usuarios.gerenciar']))
      .expect(200);
    await http()
      .get('/perfis')
      .set(await comLogin(['perfis.gerenciar']))
      .expect(200);
    await http()
      .get('/perfis')
      .set(await comLogin(['parceiros.ver']))
      .expect(403);
    await http()
      .post('/perfis')
      .set(await comLogin(['usuarios.gerenciar']))
      .send({ nome: 'X', permissoes: ['parceiros.ver'] })
      .expect(403);
  });

  it('POST /usuarios valida antes (e-mail e perfil) e repassa normalizado', async () => {
    const admin = await comLogin(['usuarios.gerenciar']);
    const res = await http()
      .post('/usuarios')
      .set(admin)
      .send({ nome: 'A', email: 'x' })
      .expect(400);
    expect(
      res.body.erro.detalhes.map((d: { campo: string }) => d.campo),
    ).toEqual(expect.arrayContaining(['nome', 'email', 'perfilId']));
    expect(identidade.recebidas).toHaveLength(0);
    await http()
      .post('/usuarios')
      .set(admin)
      .send({ nome: 'Bruno Lima', email: 'bruno@alfa.com.br', perfilId: 'p1' })
      .expect(201);
    expect(identidade.recebidas[0]?.padrao).toBe(PATTERNS.usuarios.criar);
  });

  it('ações de usuário levam o id da URL junto com os dados', async () => {
    const admin = await comLogin(['usuarios.gerenciar']);
    await http()
      .put('/usuarios/u1/perfil')
      .set(admin)
      .send({ perfilId: 'p2', versao: 'v1' })
      .expect(200);
    await http()
      .post('/usuarios/u1/remover-acesso')
      .set(admin)
      .send({ motivo: 'Saiu da empresa', versao: 'v1' })
      .expect(200);
    await http()
      .post('/usuarios/u1/remover-acesso')
      .set(admin)
      .send({ motivo: '', versao: 'v1' })
      .expect(400);
    await http().post('/usuarios/u1/redefinir-senha').set(admin).expect(200);
    expect(
      identidade.recebidas.map((r) => [r.padrao, r.mensagem.dados.id]),
    ).toEqual([
      [PATTERNS.usuarios.alterarPerfil, 'u1'],
      [PATTERNS.usuarios.removerAcesso, 'u1'],
      [PATTERNS.usuarios.redefinirSenha, 'u1'],
    ]);
  });

  it('PUT /perfis/:id recusa permissão desconhecida e lista vazia antes de chamar o serviço', async () => {
    const res = await http()
      .put('/perfis/p1')
      .set(await comLogin(['perfis.gerenciar']))
      .send({ nome: 'Estagiário', permissoes: [], versao: 'v1' })
      .expect(400);
    expect(res.body.erro.detalhes).toContainEqual({
      campo: 'permissoes',
      mensagem: 'Marque pelo menos uma permissão.',
    });
    expect(identidade.recebidas).toHaveLength(0);
  });
});
